/** Persistent, incremental, frontend-only Discovery V2 orchestrator. */
import { collection, doc, getDoc, getDocs, query, runTransaction, setDoc, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { YouTubeClient } from '@/features/youtube/client';
import { DISCOVERY_V2_SCORING_CONFIG, FIRESTORE_COLLECTIONS } from './constants';
import { classifyYouTubeVideoV2 } from './scoring';
import { detectEpisodePattern } from './contentClassifier';
import { analyzeAllCountries, analyzeCountryEvidence, detectCountryConflict, detectLanguage } from './geoAnalyzer';
import { decidePublicationForEpisodeV2 } from './publicationEngine';
import { generateEpisodeQueries, generateMovieQueries, generateSeriesQueries } from './queryGenerator';
import { generateHash, normalizeSeriesTitle, normalizeString } from './utils';
import { v2Demonym, v2KeywordSet, v2LanguageKeywords } from './profiles';
import type { DiscoveryRun, GeneratedQuery, GeoCountryConfigV2 } from './types';

export interface DiscoveryEngineConfig { countryCode: string; countryConfig: Partial<GeoCountryConfigV2> & Record<string, unknown>; mode: 'manual'|'scheduled'|'incremental'; maxQueries?: number; skipCache?: boolean; dryRun?: boolean; lockedBy?: string; }
export interface DiscoveryStats { startTime: Date; endTime?: Date; queriesExecuted: number; cacheHits: number; cacheMisses: number; candidatesFound: number; newVideos: number; updatedVideos: number; moviesFound: number; seriesFound: number; episodesFound: number; seasonsFound: number; published: number; pendingReview: number; rejected: number; quotaErrors: number; metadataErrors: number; firebaseErrors: number; }
const LOCK_TTL = 30 * 60 * 1000;
const dateOf = (v: unknown): Date | undefined => {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => unknown }).toDate === 'function') {
    const res = (v as { toDate: () => unknown }).toDate();
    if (res instanceof Date) return res;
  }
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  return undefined;
};
const safeSlug = (v: string) => normalizeString(v).replace(/\s+/g, '-').slice(0, 110) || 'untitled';

function profile(raw: DiscoveryEngineConfig['countryConfig'], countryCode: string): GeoCountryConfigV2 {
  const name = String(raw.name || countryCode); const demonyms: Record<string, string> = { RW:'Rwandan', UG:'Ugandan', KE:'Kenyan', NG:'Nigerian', GH:'Ghanaian', TZ:'Tanzanian', ZA:'South African', US:'American' };
  const movieQueries = Array.isArray(raw.movieQueries) ? raw.movieQueries as string[] : []; const seriesQueries = Array.isArray(raw.seriesQueries) ? raw.seriesQueries as string[] : [];
  const languages = Array.isArray(raw.languages) ? raw.languages as string[] : [];
  const existingKeywords = raw.discoveryKeywords as Record<string, unknown> | undefined;
  const existingLanguageKeywords = Array.isArray(raw.languageKeywords) ? raw.languageKeywords : [];
  const demonym = v2Demonym(countryCode, String(raw.demonym || demonyms[countryCode] || name));
  return { countryCode, name, nativeName:String(raw.nativeName || name), flagEmoji:String(raw.flagEmoji || ''), demonym, adjective:String(raw.adjective || demonym), languages, defaultLanguage:String(raw.defaultLanguage || 'en'), region:String(raw.region || ''), discoveryKeywords:v2KeywordSet(countryCode, (existingKeywords as { movie?: string[]; series?: string[] }) || { movie:movieQueries, series:seriesQueries }), languageKeywords:v2LanguageKeywords(countryCode, languages, existingLanguageKeywords), movieQueries, seriesQueries, trustedChannelIds:Array.isArray(raw.trustedChannelIds) ? raw.trustedChannelIds as string[] : [], minMovieDurationMinutes:Number(raw.minMovieDurationMinutes || 45), enabled:raw.enabled !== false, cinemaTerms:Array.isArray(raw.cinemaTerms) ? raw.cinemaTerms as string[] : [] };
}

export class DiscoveryEngineV2 {
  private readonly runId = `v2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  private readonly p: GeoCountryConfigV2; private held = false; private readonly seen = new Set<string>(); private readonly errors: string[] = [];
  private stats: DiscoveryStats = { startTime:new Date(), queriesExecuted:0, cacheHits:0, cacheMisses:0, candidatesFound:0, newVideos:0, updatedVideos:0, moviesFound:0, seriesFound:0, episodesFound:0, seasonsFound:0, published:0, pendingReview:0, rejected:0, quotaErrors:0, metadataErrors:0, firebaseErrors:0 };
  constructor(private readonly config: DiscoveryEngineConfig) { this.p = profile(config.countryConfig, config.countryCode.toUpperCase()); }

  async run(): Promise<DiscoveryRun> {
    if (!firestore) throw new Error('Firestore is required for Discovery V2 persistent memory. Configure Firebase before scanning.');
    await this.acquireLock();
    try {
      if (!this.config.dryRun) await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.DISCOVERY_RUNS, this.runId), this.asRun('running'));
      // Approved channels are a first-class persistent discovery source in V2.
      await this.scanTrustedChannels();
      await this.expandKnownSeries();
      for (const q of await this.queries()) {
        if (this.config.maxQueries && this.stats.queriesExecuted >= this.config.maxQueries) break;
        try { await this.execute(q); } catch (error) { const message = error instanceof Error ? error.message : String(error); this.errors.push(message); if (/quota|rate.?limit|\b403\b|\b429\b/i.test(message)) { this.stats.quotaErrors++; break; } }
      }
      const result = this.asRun(); if (!this.config.dryRun) await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.DISCOVERY_RUNS, this.runId), result, { merge:true }); return result;
    } finally { await this.releaseLock(); }
  }

  private async queries(): Promise<GeneratedQuery[]> {
    const legacy = (items: string[], type: 'movie'|'series') => items.map((query, i) => ({ query, queryHash:generateHash(`${this.p.countryCode}:${type}:${normalizeString(query)}`), countryCode:this.p.countryCode, type, tier:2 as const, priorityScore:80-i, reason:'Migrated V1 query' }));
    const custom = firestore ? await getDocs(query(collection(firestore, FIRESTORE_COLLECTIONS.CUSTOM_QUERIES), where('countryCode', '==', this.p.countryCode))) : null;
    const customQueries = (custom?.docs || []).filter(record => record.data().enabled !== false).map((record, index) => {
      const data = record.data(); const type = data.type === 'series' ? 'series' as const : 'movie' as const;
      return { query:String(data.query || ''), queryHash:generateHash(`${this.p.countryCode}:${type}:${normalizeString(String(data.query || ''))}`), countryCode:this.p.countryCode, type, tier:2 as const, priorityScore:90-index, reason:'Administrator custom query' };
    }).filter(item => item.query);
    const all = [...generateMovieQueries(this.p, 12), ...generateSeriesQueries(this.p, 10), ...legacy(this.p.movieQueries, 'movie'), ...legacy(this.p.seriesQueries, 'series'), ...customQueries];
    const unique = [...new Map(all.map(q => [q.queryHash, q])).values()];
    if (!firestore) return unique.sort((a,b) => b.priorityScore-a.priorityScore);
    const ranked = await Promise.all(unique.map(async item => {
      const stats = await getDoc(doc(firestore!, FIRESTORE_COLLECTIONS.QUERY_STATS, item.queryHash));
      // Existing administrative/V1 queries stay eligible; performance only adjusts priority.
      return { ...item, priorityScore: Math.max(1, Math.min(100, Number(stats.exists() ? stats.data().priorityScore : item.priorityScore))) };
    }));
    return ranked.sort((a,b) => b.priorityScore-a.priorityScore);
  }
  private async execute(source: GeneratedQuery) {
    if (!firestore) return; this.stats.queriesExecuted++;
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.DISCOVERY_CACHE, source.queryHash); const cached = await getDoc(ref); const data = cached.exists() ? cached.data() : undefined;
    let ids: string[];
    if (!this.config.skipCache && data && (dateOf(data.expiresAt)?.valueOf() || 0) > Date.now()) { ids = Array.isArray(data.videoIds) ? data.videoIds : []; this.stats.cacheHits++; if (!this.config.dryRun) await setDoc(ref, {lastReuseAt:new Date(),cacheHitCount:Number(data.cacheHitCount||0)+1},{merge:true}); }
    else { this.stats.cacheMisses++; const found = await YouTubeClient.searchVideos({query:source.query,maxResults:50,regionCode:this.p.countryCode,relevanceLanguage:this.p.defaultLanguage}); if (found.error) throw new Error(found.error); ids = found.videoIds; if (!this.config.dryRun) await setDoc(ref,{queryHash:source.queryHash,countryCode:this.p.countryCode,query:source.query,queryType:source.type,videoIds:[...new Set([...(data?.videoIds || []),...ids])],resultCount:ids.length,executedAt:new Date(),expiresAt:new Date(Date.now()+(DISCOVERY_V2_SCORING_CONFIG.QUERY_CACHE_TTL[source.type]||3)*86400000),discoveryVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION},{merge:true}); }
    const unique = ids.filter(id => !this.seen.has(id)); unique.forEach(id => this.seen.add(id)); this.stats.candidatesFound += unique.length;
    const stale: string[] = []; for (const id of unique) { const index = await getDoc(doc(firestore,FIRESTORE_COLLECTIONS.VIDEO_INDEX,id)); const d = index.exists() ? index.data() : undefined; const analyzed = dateOf(d?.lastAnalyzedAt); if (!d || d.classifierVersion !== DISCOVERY_V2_SCORING_CONFIG.VERSION || !analyzed || Date.now()-analyzed.valueOf() > DISCOVERY_V2_SCORING_CONFIG.METADATA_CACHE_TTL*86400000) stale.push(id); else if (!this.config.dryRun) await setDoc(index.ref,{lastSeenAt:new Date()},{merge:true}); }
    for (let i=0;i<stale.length;i+=50) for (const video of await YouTubeClient.getVideoDetails(stale.slice(i,i+50))) await this.analyze(video,source);
  }
  private async scanTrustedChannels() {
    if (!firestore) return;
    const channels = await getDocs(query(collection(firestore, FIRESTORE_COLLECTIONS.TRUSTED_CHANNELS), where('country', '==', this.p.countryCode), where('trust', '==', 'approved')));
    for (const channel of channels.docs) {
      this.stats.queriesExecuted++;
      const channelId = channel.id;
      const cacheRef = doc(firestore, FIRESTORE_COLLECTIONS.DISCOVERY_CACHE, `channel-${channelId}`);
      const cache = await getDoc(cacheRef); const cached = cache.exists() ? cache.data() : undefined;
      let ids: string[];
      if (!this.config.skipCache && cached && (dateOf(cached.expiresAt)?.valueOf() || 0) > Date.now()) { ids = cached.videoIds || []; this.stats.cacheHits++; }
      else {
        this.stats.cacheMisses++; ids = await YouTubeClient.getChannelUploads(channelId, 50);
        if (!this.config.dryRun) await setDoc(cacheRef, { queryHash:`channel-${channelId}`, countryCode:this.p.countryCode, query:channel.data().channelTitle || channelId, queryType:'channel', videoIds:[...new Set([...(cached?.videoIds || []), ...ids])], resultCount:ids.length, executedAt:new Date(), expiresAt:new Date(Date.now() + DISCOVERY_V2_SCORING_CONFIG.QUERY_CACHE_TTL.channel * 86400000), discoveryVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION }, { merge:true });
      }
      const unique = ids.filter(id => !this.seen.has(id)); unique.forEach(id => this.seen.add(id)); this.stats.candidatesFound += unique.length;
      for (let i=0;i<unique.length;i+=50) for (const video of await YouTubeClient.getVideoDetails(unique.slice(i,i+50))) await this.analyze(video, { query:channel.data().channelTitle || channelId, queryHash:`channel-${channelId}`, countryCode:this.p.countryCode, type:'channel', tier:1, priorityScore:100, reason:'Approved-channel upload scan' });
      if (!this.config.dryRun) await setDoc(channel.ref, { lastScannedAt:new Date(), lastScanStatus:'success', classifierVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION }, { merge:true });
    }
  }
  /** Known series become seeds for new episodes and for genuine gaps, not generic re-crawls. */
  private async expandKnownSeries() {
    if (!firestore || this.config.mode === 'manual') return;
    const series = await getDocs(query(collection(firestore, FIRESTORE_COLLECTIONS.GEO_SERIES), where('countryCodes', 'array-contains', this.p.countryCode)));
    for (const record of series.docs.slice(0, 4)) {
      const data = record.data(); const title = data.canonicalTitle || data.normalizedTitle;
      if (!title) continue;
      // A small, cache-protected seed set supports newly uploaded and inconsistently named episodes.
      for (const source of generateEpisodeQueries(title, this.p.countryCode, this.p, 4)) {
        if (this.config.maxQueries && this.stats.queriesExecuted >= this.config.maxQueries) return;
        await this.execute(source);
      }
    }
  }
  private async analyze(video: { videoId: string; title: string; description?: string; channelId: string; channelTitle?: string; durationSeconds?: number; durationFormatted?: string; categoryId?: string; tags?: string[]; isEmbeddable?: boolean; license?: string; publishedAt?: string; viewCount?: number; likeCount?: number; thumbnailUrl?: string }, source: GeneratedQuery) {
    if (!firestore) return; const contentRef = doc(firestore,FIRESTORE_COLLECTIONS.GEO_CONTENT,video.videoId); const old = await getDoc(contentRef); const channel = await this.channel(video.channelId,video.channelTitle || video.channelId); const pattern = detectEpisodePattern(`${video.title}\n${video.description||''}`); const geo = analyzeCountryEvidence(this.p.countryCode,video.title,video.description||'',channel.country,channel.notes,this.p.defaultLanguage,video.tags||[]); const allCountries = analyzeAllCountries(video.title,video.description||'',channel.country,channel.notes,this.p.defaultLanguage,video.tags||[]); const countryConflict = detectCountryConflict(this.p.countryCode,allCountries); const gates = this.gates(video,countryConflict.severity === 'high' ? 0 : geo.confidence,channel.trust);
    const scored = await classifyYouTubeVideoV2({title:video.title,description:video.description,durationSeconds:video.durationSeconds,category:video.categoryId,tags:video.tags,channelId:video.channelId,channelTitle:video.channelTitle,channelCountry:channel.country,channelTrust:channel.trust,countryCode:this.p.countryCode,language:this.p.defaultLanguage,isEmbeddable:video.isEmbeddable,publishedAt:video.publishedAt ? new Date(video.publishedAt) : undefined,views:video.viewCount,likes:video.likeCount,minMovieDurationMinutes:this.p.minMovieDurationMinutes},DISCOVERY_V2_SCORING_CONFIG,geo.evidence.map(keyword=>({keyword,weight:8})),pattern||undefined,gates);
    const link = await this.linkSeries(video,pattern); const initialDecision = scored.contentType === 'episode' ? decidePublicationForEpisodeV2(scored.overallScore,link.id,link.confidence,pattern?.confidence||0,channel.trust,video.isEmbeddable,gates) : scored.publicationDecision;
    const decision = countryConflict.hasConflict && initialDecision.status === 'published'
      ? { ...initialDecision, status: 'pending_review' as const, reason: 'country_evidence_conflict', thresholdDecision: 'pending' as const, reasoning: `Conflicting country evidence: ${countryConflict.conflictingCountries.join(', ') || 'ambiguous metadata'}.` }
      : link.duplicateOf && initialDecision.status === 'published'
      ? { ...initialDecision, status: 'pending_review' as const, reason: 'duplicate_episode_candidate', thresholdDecision: 'pending' as const, reasoning: `Likely duplicate of ${link.duplicateOf}; canonical episode review required.` }
      : initialDecision;
    const now = new Date(); const previousQueries = old.exists() && Array.isArray(old.data().discoveredByQueries) ? old.data().discoveredByQueries : [];
    const item = { id:video.videoId,videoId:video.videoId,youtubeVideoId:video.videoId,youtubeChannelId:video.channelId,channelId:video.channelId,youtubeUrl:`https://www.youtube.com/watch?v=${video.videoId}`,title:video.title,normalizedTitle:normalizeString(video.title),slug:safeSlug(video.title),description:video.description||'',thumbnail:video.thumbnailUrl||'',thumbnailUrl:video.thumbnailUrl||'',channelTitle:video.channelTitle||'',durationSeconds:video.durationSeconds||0,durationFormatted:video.durationFormatted||'0m',views:Number(video.viewCount||0),viewCount:Number(video.viewCount||0),likes:Number(video.likeCount||0),likeCount:Number(video.likeCount||0),publishedAt:video.publishedAt||now.toISOString(),country:this.p.countryCode,countryCode:this.p.countryCode,language:this.p.defaultLanguage,tags:video.tags||[],classification:scored.contentType,type:scored.contentType,contentType:scored.contentType,score:scored.overallScore,overallScore:scored.overallScore,countryScore:scored.scoringDimensions.countryScore,geoScore:scored.scoringDimensions.countryScore,contentScore:scored.scoringDimensions.contentTypeScore,seriesScore:link.confidence||scored.scoringDimensions.seriesScore,channelScore:scored.scoringDimensions.channelScore,qualityScore:scored.scoringDimensions.qualityScore,duplicateScore:scored.scoringDimensions.duplicateScore,scoringDimensions:scored.scoringDimensions,classificationConfidence:scored.confidence,isFullMovieCandidate:scored.isFullMovieCandidate,isEmbeddable:Boolean(video.isEmbeddable),embeddable:Boolean(video.isEmbeddable),youtubeLicense:video.license||'standard',channelTrust:channel.trust,rightsVerified:false,status:decision.status,publicationStatus:decision.status,moderationStatus:decision.status==='published'?'approved':decision.status,publicationDecision:decision,scoreReasons:scored.scoreReasons,evidence:geo.evidence.map(value=>({type:'country_keyword',field:'metadata',value,impact:8,explanation:value,confidence:geo.confidence})),countryCandidates:[{countryCode:this.p.countryCode,confidence:geo.confidence,evidence:geo.evidence}],detectedLanguages:[{code:this.p.defaultLanguage,confidence:55,evidence:['country profile language']}],geoConflict:geo.confidence<25,seriesId:link.id||null,seriesConfidence:link.confidence,seasonNumber:pattern?.seasonNumber??null,episodeNumber:pattern?.episodeNumber??null,episodeTitle:scored.contentType==='episode'?video.title:null,classifierVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION,discoveryVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION,metadataHash:generateHash(`${video.title}|${video.description}|${video.durationSeconds}|${video.channelId}`),discoveredByQueries:[...new Set([...previousQueries,source.query])],discoveryRuns:[...new Set([...(old.exists()&&old.data().discoveryRuns||[]),this.runId])],firstDiscoveredAt:old.exists()?old.data().firstDiscoveredAt||now:now,lastSeenAt:now,lastAnalyzedAt:now,lastCheckedAt:now.toISOString(),discoveredAt:old.exists()?old.data().discoveredAt||now.toISOString():now.toISOString(),createdAt:old.exists()?old.data().createdAt||now.toISOString():now.toISOString(),updatedAt:now.toISOString(),source:'youtube',sourceQueryType:source.type };
    if (!this.config.dryRun) { await setDoc(contentRef,item,{merge:true}); await setDoc(doc(firestore,FIRESTORE_COLLECTIONS.VIDEO_INDEX,video.videoId),{videoId:video.videoId,firstSeenAt:old.exists()?old.data().firstDiscoveredAt||now:now,lastSeenAt:now,lastAnalyzedAt:now,countryCodes:[this.p.countryCode],channelId:video.channelId,contentType:scored.contentType,seriesId:link.id||null,seasonNumber:pattern?.seasonNumber??null,episodeNumber:pattern?.episodeNumber??null,classifierVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION,metadataHash:item.metadataHash,publicationStatus:decision.status},{merge:true}); await this.recordQueryOutcome(source, scored.overallScore, scored.scoringDimensions.countryScore, decision.status); }
    if (!this.config.dryRun && link.duplicateOf) await setDoc(contentRef, { isDuplicate:true, duplicateOf:link.duplicateOf, duplicateConfidence:95, duplicateScore:95 }, { merge:true });
    if (!this.config.dryRun) await setDoc(contentRef, { geoConflict:countryConflict.hasConflict, countryCandidates:allCountries.map(candidate => ({ countryCode:candidate.countryCode, confidence:candidate.confidence, evidence:candidate.evidence })), detectedLanguages:detectLanguage(video.title, video.description || '', channel.country).map(language => ({ code:language.code, confidence:language.confidence, evidence:['metadata language analysis'] })) }, { merge:true });
    if (!this.config.dryRun) await this.recordChannelOutcome(video.channelId, scored.contentType, decision.status, geo.confidence, gates.length === 0);
    if (old.exists()) { this.stats.updatedVideos++; } else { this.stats.newVideos++; }
    if (scored.contentType === 'movie') { this.stats.moviesFound++; }
    if (scored.contentType === 'series') { this.stats.seriesFound++; }
    if (scored.contentType === 'episode') { this.stats.episodesFound++; }
    if (decision.status === 'published') { this.stats.published++; } else if (decision.status === 'pending_review') { this.stats.pendingReview++; } else { this.stats.rejected++; }
  }
  private gates(video: { title: string; description?: string; isEmbeddable?: boolean }, country: number, trust: string) { const text=`${video.title} ${video.description||''}`.toLowerCase(); const gates:string[]=[]; if(!video.isEmbeddable)gates.push('not_embeddable'); if(trust==='rejected')gates.push('channel_rejected'); for(const [pattern,reason] of [[/\btrailer\b/,'detected_trailer'],[/\bteaser\b|\bpromo\b/,'detected_teaser'],[/\bclip\b|\bscene\b|\bhighlight\b/,'detected_clip'],[/\binterview\b/,'detected_interview'],[/\bmusic video\b|\bofficial audio\b|\blyrics\b/,'detected_music_video'],[/\breaction\b/,'detected_reaction'],[/\breview\b|ending explained|recap/,'detected_review'],[/\bnews\b/,'detected_news_only']] as Array<[RegExp,string]>)if(pattern.test(text))gates.push(reason); if(country<15)gates.push('country_conflict_strong'); return gates; }
  private async channel(id:string,title:string):Promise<{trust:'approved'|'pending'|'rejected';country:string;notes:string}> { if(!firestore)return {trust:'pending',country:'',notes:''}; const ref=doc(firestore,FIRESTORE_COLLECTIONS.TRUSTED_CHANNELS,id);const snap=await getDoc(ref);if(snap.exists())return {trust:snap.data().trust||snap.data().trustStatus||'pending',country:snap.data().country||snap.data().countryCode||'',notes:snap.data().notes||''};const trust=this.p.trustedChannelIds?.includes(id)?'approved':'pending';if(!this.config.dryRun)await setDoc(ref,{channelId:id,channelTitle:title||id,country:this.p.countryCode,countryCode:this.p.countryCode,trust,trustStatus:trust,channelTrustScore:trust==='approved'?85:50,autoPublishMovies:trust==='approved',autoPublishSeries:trust==='approved',totalAnalyzed:0,acceptedCount:0,rejectedCount:0,classifierVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},{merge:true});return {trust,country:this.p.countryCode,notes:''}; }
  private async linkSeries(video: { title: string; channelId: string; videoId: string }, pattern: ReturnType<typeof detectEpisodePattern>):Promise<{id?:string;confidence:number;duplicateOf?:string}> {
    if(!firestore || !pattern) return {confidence:0};
    const title=normalizeSeriesTitle(video.title); if(!title) return {confidence:0};
    const id=`series-${generateHash(`${this.p.countryCode}:${title}`)}`; const ref=doc(firestore,FIRESTORE_COLLECTIONS.GEO_SERIES,id);
    const snap=await getDoc(ref); const existing=snap.exists()?snap.data():{};
    const confidence=Math.min(100,Math.max(0,pattern.confidence+(snap.exists()&&(existing.channelIds||[]).includes(video.channelId)?10:-10)));
    if(this.config.dryRun) return {id,confidence};
    const now=new Date(); const episodeNumbers=Array.from(new Set([...(existing.knownEpisodeNumbers||[]),...(pattern.episodeNumber?[pattern.episodeNumber]:[])])).sort((a: number, b: number)=>a-b);
    await setDoc(ref,{seriesId:id,canonicalTitle:existing.canonicalTitle||title,normalizedTitle:title,aliases:Array.from(new Set([...(existing.aliases||[]),video.title,title])),countryCodes:Array.from(new Set([...(existing.countryCodes||[]),this.p.countryCode])),languages:Array.from(new Set([...(existing.languages||[]),this.p.defaultLanguage])),channelIds:Array.from(new Set([...(existing.channelIds||[]),video.channelId])),confidence,episodeCount:Math.max(Number(existing.episodeCount||0),episodeNumbers.length),knownEpisodeNumbers:episodeNumbers,seasonCount:Math.max(Number(existing.seasonCount||0),pattern.seasonNumber||0),firstDiscoveredAt:existing.firstDiscoveredAt||now,lastSeenAt:now,lastUpdatedAt:now,searchAliases:Array.from(new Set([...(existing.searchAliases||[]),title])),status:'active',classifierVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION,discoveryVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION},{merge:true});
    if(!pattern.episodeNumber) return {id,confidence};
    const seasonKey=pattern.seasonNumber ?? 'unknown'; const seasonId=`season-${generateHash(`${id}:${seasonKey}`)}`;
    const seasonRef=doc(firestore,FIRESTORE_COLLECTIONS.GEO_SEASONS,seasonId); const season=await getDoc(seasonRef); const known=Array.from(new Set([...(season.exists()?season.data().knownEpisodeNumbers:[]),pattern.episodeNumber])).sort((a: number, b: number)=>a-b);
    await setDoc(seasonRef,{seasonId,seriesId:id,seasonNumber:pattern.seasonNumber??null,episodeCount:known.length,knownEpisodeNumbers:known,confidence:pattern.seasonNumber?pattern.confidence:Math.min(confidence,60),firstDiscoveredAt:season.exists()?season.data().firstDiscoveredAt:now,lastSeenAt:now,lastUpdatedAt:now,classificationVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION},{merge:true}); this.stats.seasonsFound += season.exists()?0:1;
    const episodeId=`episode-${generateHash(`${id}:${seasonKey}:${pattern.episodeNumber}`)}`; const ep=await getDoc(doc(firestore,FIRESTORE_COLLECTIONS.GEO_EPISODES,episodeId)); const duplicateOf=ep.exists() && ep.data().canonicalVideoId && ep.data().canonicalVideoId !== video.videoId ? ep.data().canonicalVideoId : undefined;
    await setDoc(ep.ref,{episodeId,seriesId:id,seasonId,seasonNumber:pattern.seasonNumber??null,episodeNumber:pattern.episodeNumber,title:video.title,normalizedTitle:title,videoIds:Array.from(new Set([...(ep.exists()?ep.data().videoIds:[]),video.videoId])),canonicalVideoId:ep.exists()?ep.data().canonicalVideoId||video.videoId:video.videoId,confidence,createdAt:ep.exists()?ep.data().createdAt:now,updatedAt:now},{merge:true});
    return {id,confidence,duplicateOf};
  }
  /** Persistent query learning; the score is used on the next incremental run. */
  private async recordQueryOutcome(source: GeneratedQuery, overallScore: number, countryScore: number, status: string) {
    if (!firestore) return;
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.QUERY_STATS, source.queryHash);
    await runTransaction(firestore, async transaction => {
      const previous = await transaction.get(ref); const current = previous.exists() ? previous.data() : {};
      const runs = Number(current.runs || 0); const candidates = Number(current.candidateCount || 0) + 1;
      const published = Number(current.publishedCount || 0) + (status === 'published' ? 1 : 0);
      const pending = Number(current.pendingCount || 0) + (status === 'pending_review' ? 1 : 0);
      const rejected = Number(current.rejectedCount || 0) + (status === 'rejected' ? 1 : 0);
      const useful = published + pending;
      const averageOverall = Math.round(((Number(current.averageOverallScore || 0) * Math.max(candidates - 1, 0)) + overallScore) / candidates);
      const averageCountry = Math.round(((Number(current.averageCountryScore || 0) * Math.max(candidates - 1, 0)) + countryScore) / candidates);
      const priorityScore = Math.max(5, Math.min(100, Math.round(35 + (useful / candidates) * 45 + (averageOverall / 100) * 20 - (rejected / candidates) * 15)));
      transaction.set(ref, { queryHash:source.queryHash, countryCode:source.countryCode, query:source.query, queryType:source.type, runs:runs + 1, candidateCount:candidates, qualifyingCount:useful, publishedCount:published, pendingCount:pending, rejectedCount:rejected, averageOverallScore:averageOverall, averageCountryScore:averageCountry, priorityScore, lastRunAt:new Date(), lastSuccessfulRunAt:status !== 'rejected' ? new Date() : current.lastSuccessfulRunAt || null, nextRunAt:new Date(Date.now() + (DISCOVERY_V2_SCORING_CONFIG.QUERY_CACHE_TTL[source.type] || 3) * 86400000) }, { merge:true });
    });
  }
  private async recordChannelOutcome(channelId: string, contentType: string, status: string, countryScore: number, safe: boolean) {
    if (!firestore || !channelId) return;
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.TRUSTED_CHANNELS, channelId);
    await runTransaction(firestore, async transaction => {
      const snapshot = await transaction.get(ref); if (!snapshot.exists()) return;
      const value = snapshot.data(); const total = Number(value.totalAnalyzed || 0) + 1;
      const accepted = Number(value.acceptedCount || 0) + (status === 'published' ? 1 : 0);
      const rejected = Number(value.rejectedCount || 0) + (status === 'rejected' ? 1 : 0);
      const published = Number(value.publishedItemCount || 0) + (status === 'published' ? 1 : 0);
      const reviewed = Number(value.reviewedItemCount || 0) + (status === 'pending_review' ? 1 : 0);
      const acceptance = accepted / total; const rejection = rejected / total;
      const consistency = Math.round(((Number(value.countryScore || countryScore) * Math.max(total - 1, 0)) + countryScore) / total);
      const trustScore = Math.max(0, Math.min(100, Math.round(40 + acceptance * 35 + consistency * .2 - rejection * 35 + (value.trust === 'approved' ? 15 : 0))));
      const eligible = value.trust === 'pending' && trustScore >= 90 && accepted >= 3 && consistency >= 85 && rejection <= .2 && safe;
      transaction.set(ref, { totalAnalyzed:total, acceptedCount:accepted, rejectedCount:rejected, publishedItemCount:published, reviewedItemCount:reviewed, countryScore:consistency, channelTrustScore:trustScore, moviesFound:Number(value.moviesFound || 0) + (contentType === 'movie' ? 1 : 0), seriesFound:Number(value.seriesFound || 0) + (contentType === 'series' ? 1 : 0), episodesFound:Number(value.episodesFound || 0) + (contentType === 'episode' ? 1 : 0), trust:eligible ? 'approved' : value.trust, trustStatus:eligible ? 'approved' : value.trustStatus || value.trust, lastEvaluatedAt:new Date(), updatedAt:new Date().toISOString() }, { merge:true });
    });
  }
  private async acquireLock(){if(!firestore||this.config.dryRun)return;const ref=doc(firestore,FIRESTORE_COLLECTIONS.SYSTEM_META,'discovery_lock');const now=new Date();await runTransaction(firestore,async tx=>{const old=await tx.get(ref);const expires=old.exists()?dateOf(old.data().expiresAt):undefined;if(old.exists()&&old.data().locked===true&&(!expires||expires.valueOf()>now.valueOf()))throw new Error(`Discovery is already running (${old.data().runId||'unknown run'}).`);tx.set(ref,{locked:true,runId:this.runId,lockedAt:now,lockedBy:this.config.lockedBy||'admin-browser',expiresAt:new Date(now.valueOf()+LOCK_TTL)});});this.held=true;}
  private async releaseLock(){if(!firestore||!this.held||this.config.dryRun)return;const ref=doc(firestore,FIRESTORE_COLLECTIONS.SYSTEM_META,'discovery_lock');await runTransaction(firestore,async tx=>{const lock=await tx.get(ref);if(lock.exists()&&lock.data().runId===this.runId)tx.set(ref,{locked:false,releasedAt:new Date(),expiresAt:new Date()},{merge:true});});this.held=false;}
  private asRun(status?:DiscoveryRun['status']):DiscoveryRun { this.stats.endTime=new Date();return {runId:this.runId,mode:this.config.mode,countryCodes:[this.p.countryCode],startedAt:this.stats.startTime,completedAt:status==='running'?undefined:this.stats.endTime,status:status|| (this.stats.quotaErrors?'quota_exhausted':this.errors.length?'partial':'completed'),queriesExecuted:this.stats.queriesExecuted,cacheHits:this.stats.cacheHits,cacheMisses:this.stats.cacheMisses,candidatesFound:this.stats.candidatesFound,newVideos:this.stats.newVideos,updatedVideos:this.stats.updatedVideos,moviesFound:this.stats.moviesFound,seriesFound:this.stats.seriesFound,episodesFound:this.stats.episodesFound,seasonsFound:this.stats.seasonsFound,published:this.stats.published,pendingReview:this.stats.pendingReview,rejected:this.stats.rejected,quotaErrors:this.stats.quotaErrors,metadataErrors:this.stats.metadataErrors,firebaseErrors:this.stats.firebaseErrors,summary:`Discovery V2 ${this.p.countryCode}: ${this.stats.candidatesFound} unique candidates, ${this.stats.cacheHits} cache hits, ${this.stats.published} published.`,errorLog:this.errors.length?this.errors:undefined}; }
  getStats(){return {...this.stats};} getErrors(){return [...this.errors];}
}
export async function runDiscoveryV2(countryCode:string,countryConfig:DiscoveryEngineConfig['countryConfig'],mode:DiscoveryEngineConfig['mode']='manual',options:Omit<DiscoveryEngineConfig,'countryCode'|'countryConfig'|'mode'>={}):Promise<DiscoveryRun>{return new DiscoveryEngineV2({countryCode,countryConfig,mode,...options}).run();}
export function getDiscoveryV2Profile(countryCode: string, countryConfig: DiscoveryEngineConfig['countryConfig']): GeoCountryConfigV2 { return profile(countryConfig, countryCode.toUpperCase()); }

/** Reclassifies stored metadata without calling YouTube; safe migration path for V1 records. */
export async function reprocessDiscoveryV2(countryCode: string, countryConfig: DiscoveryEngineConfig['countryConfig']): Promise<number> {
  if (!firestore) throw new Error('Firestore is required to reprocess Discovery V2 records.');
  const p = profile(countryConfig, countryCode.toUpperCase());
  const snapshots = await Promise.all([
    getDocs(query(collection(firestore, FIRESTORE_COLLECTIONS.GEO_CONTENT), where('countryCode', '==', p.countryCode))),
    getDocs(query(collection(firestore, FIRESTORE_COLLECTIONS.GEO_CONTENT), where('country', '==', p.countryCode))),
  ]);
  const records = new Map(snapshots.flatMap(snapshot => snapshot.docs).map(record => [record.id, record]));
  for (const record of records.values()) {
    const item = record.data(); const pattern = detectEpisodePattern(`${item.title || ''}\n${item.description || ''}`);
    const scored = await classifyYouTubeVideoV2({ title:item.title || '', description:item.description || '', durationSeconds:Number(item.durationSeconds || 0), tags:item.tags || [], channelId:item.channelId || item.youtubeChannelId, channelTitle:item.channelTitle, channelTrust:item.channelTrust || 'pending', countryCode:p.countryCode, language:item.language || p.defaultLanguage, isEmbeddable:item.isEmbeddable !== false, publishedAt:dateOf(item.publishedAt), views:Number(item.views || item.viewCount || 0), likes:Number(item.likes || item.likeCount || 0), minMovieDurationMinutes:p.minMovieDurationMinutes }, DISCOVERY_V2_SCORING_CONFIG, [], pattern || undefined);
    await setDoc(record.ref, { score:scored.overallScore, overallScore:scored.overallScore, scoringDimensions:scored.scoringDimensions, scoreReasons:scored.scoreReasons, classification:scored.contentType, contentType:scored.contentType, isFullMovieCandidate:scored.isFullMovieCandidate, publicationDecision:scored.publicationDecision, status:scored.publicationDecision.status, publicationStatus:scored.publicationDecision.status, classifierVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION, discoveryVersion:DISCOVERY_V2_SCORING_CONFIG.VERSION, lastAnalyzedAt:new Date() }, { merge:true });
  }
  return records.size;
}
