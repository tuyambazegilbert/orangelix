/**
 * OrangeFlix YouTube Movie & Series Classifier & Scoring Engine
 * Conforms strictly to multi-country specifications (RW, UG, KE, NG, GH, TZ, ZA, US).
 * Dynamically computes country relevance and produces explainable scoring reasons.
 */

import { ClassificationResult, GeoContentType, ChannelTrust } from '@/types/geo-content';

export interface ClassifierInput {
  title: string;
  description?: string;
  durationSeconds: number;
  channelTitle?: string;
  channelId?: string;
  channelTrust?: ChannelTrust;
  categoryId?: string;
  countryCode?: string;
  tags?: string[];
  minDurationMinutes?: number;
}

export interface CountryKeywordRule {
  pattern: RegExp;
  weight: number;
  name: string;
}

const COUNTRY_RELEVANCE_RULES: Record<string, CountryKeywordRule[]> = {
  RW: [
    { pattern: /\b(film\s*nyarwanda|filime\s*nyarwanda)\b/i, weight: 30, name: 'film/filime nyarwanda' },
    { pattern: /\b(rwandan\s*movies?|rwanda\s*movies?|rwanda\s*cinema)\b/i, weight: 25, name: 'rwanda movies/cinema' },
    { pattern: /\b(filime\s*nyarwanda\s*yose)\b/i, weight: 25, name: 'filime nyarwanda yose' },
    { pattern: /\b(kinyarwanda)\b/i, weight: 20, name: 'kinyarwanda' },
    { pattern: /\b(nyarwanda)\b/i, weight: 20, name: 'nyarwanda' },
    { pattern: /\b(rwandan|rwanda)\b/i, weight: 15, name: 'rwanda/rwandan' },
    { pattern: /\b(kigali)\b/i, weight: 15, name: 'kigali' },
    { pattern: /\b(filime|filamu)\b/i, weight: 10, name: 'filime' },
    { pattern: /\b(agasobanuye|zisobanuye)\b/i, weight: 15, name: 'agasobanuye' },
    { pattern: /\b(z'urukundo|zisekeje|uruhererekane)\b/i, weight: 10, name: 'kinyarwanda genre' },
  ],
  UG: [
    { pattern: /\b(ugandan\s*movies?|uganda\s*movies?|uganda\s*cinema)\b/i, weight: 30, name: 'ugandan movies/cinema' },
    { pattern: /\b(wakaliwood|ramon\s*film)\b/i, weight: 30, name: 'wakaliwood action cinema' },
    { pattern: /\b(vj\s*emmy|vj\s*junior|vj\s*jingo|vj\s*ice\s*p|agasobanuye)\b/i, weight: 25, name: 'ugandan vj translated/cinema' },
    { pattern: /\b(luganda|ebinigeria|filamu\s*za\s*uganda)\b/i, weight: 20, name: 'luganda language/film' },
    { pattern: /\b(ugandan|uganda)\b/i, weight: 15, name: 'uganda/ugandan' },
    { pattern: /\b(kampala|entebbe|jinja)\b/i, weight: 15, name: 'ugandan cities' },
    { pattern: /\b(filimu\s*empya|katemba)\b/i, weight: 15, name: 'ugandan film term' },
  ],
  KE: [
    { pattern: /\b(kenyan\s*movies?|kenya\s*movies?|kenyan\s*cinema)\b/i, weight: 30, name: 'kenyan cinema' },
    { pattern: /\b(riverwood|riverwood\s*films?)\b/i, weight: 30, name: 'riverwood cinema' },
    { pattern: /\b(swahili\s*movies?|filamu\s*za\s*kiswahili)\b/i, weight: 25, name: 'swahili films' },
    { pattern: /\b(kenyan|kenya)\b/i, weight: 15, name: 'kenya/kenyan' },
    { pattern: /\b(nairobi|mombasa|kisumu)\b/i, weight: 15, name: 'kenyan cities' },
  ],
  NG: [
    { pattern: /\b(nollywood|nollywood\s*movies?|nollywood\s*cinema)\b/i, weight: 35, name: 'nollywood' },
    { pattern: /\b(nigerian\s*movies?|nigeria\s*movies?)\b/i, weight: 25, name: 'nigerian movies' },
    { pattern: /\b(yoruba\s*movies?|yorubahood)\b/i, weight: 25, name: 'yoruba movies' },
    { pattern: /\b(hausa\s*movies?|kannywood|igbo\s*movies?)\b/i, weight: 25, name: 'nigerian regional cinema' },
    { pattern: /\b(nigerian|nigeria)\b/i, weight: 15, name: 'nigeria/nigerian' },
    { pattern: /\b(lagos|abuja|enugu)\b/i, weight: 15, name: 'nigerian cities' },
  ],
  GH: [
    { pattern: /\b(ghallywood|kumawood|kumawood\s*movies?)\b/i, weight: 35, name: 'kumawood/ghallywood' },
    { pattern: /\b(ghanaian\s*movies?|ghana\s*movies?)\b/i, weight: 25, name: 'ghanaian movies' },
    { pattern: /\b(twi\s*movies?|twi\s*film)\b/i, weight: 25, name: 'twi language cinema' },
    { pattern: /\b(ghanaian|ghana)\b/i, weight: 15, name: 'ghana/ghanaian' },
    { pattern: /\b(accra|kumasi)\b/i, weight: 15, name: 'ghana cities' },
  ],
  TZ: [
    { pattern: /\b(bongo\s*movies?|bongomovie|bongo\s*cinema)\b/i, weight: 35, name: 'bongo movie' },
    { pattern: /\b(tanzanian\s*movies?|tanzania\s*movies?)\b/i, weight: 25, name: 'tanzanian movies' },
    { pattern: /\b(filamu\s*za\s*kiswahili|tamthilia\s*za\s*kiswahili)\b/i, weight: 25, name: 'swahili films/series' },
    { pattern: /\b(tanzanian|tanzania)\b/i, weight: 15, name: 'tanzania/tanzanian' },
    { pattern: /\b(dar\s*es\s*salaam|arusha|zanzibar|dodoma)\b/i, weight: 15, name: 'tanzanian cities' },
  ],
  ZA: [
    { pattern: /\b(south\s*african\s*movies?|mzansi\s*magic|mzansi\s*movies?)\b/i, weight: 35, name: 'mzansi/south african cinema' },
    { pattern: /\b(zulu\s*movies?|xhosa\s*movies?|afrikaans\s*movies?)\b/i, weight: 25, name: 'south african language cinema' },
    { pattern: /\b(south\s*african|south\s*africa)\b/i, weight: 15, name: 'south africa' },
    { pattern: /\b(johannesburg|cape\s*town|durban|soweto)\b/i, weight: 15, name: 'south african cities' },
  ],
  US: [
    { pattern: /\b(indie\s*movie|indie\s*film|american\s*indie)\b/i, weight: 30, name: 'indie cinema' },
    { pattern: /\b(african\s*american\s*cinema|black\s*cinema)\b/i, weight: 30, name: 'african american cinema' },
  ],
};

export function computeCountryRelevance(
  text: string,
  countryCode: string = 'RW'
): { score: number; matchedKeywords: string[] } {
  const t = text.toLowerCase();
  const code = (countryCode || 'RW').toUpperCase();
  const rules = COUNTRY_RELEVANCE_RULES[code] || COUNTRY_RELEVANCE_RULES.RW;

  let score = 0;
  const matchedKeywords: string[] = [];

  for (const { pattern, weight, name } of rules) {
    if (pattern.test(t)) {
      score += weight;
      matchedKeywords.push(name);
    }
  }

  return {
    score: Math.min(100, score),
    matchedKeywords,
  };
}

export function computeRwandaRelevance(text: string): { score: number; matchedKeywords: string[] } {
  return computeCountryRelevance(text, 'RW');
}

export function classifyYouTubeVideo(input: ClassifierInput): ClassificationResult {
  const title = (input.title || '').toLowerCase();
  const description = (input.description || '').toLowerCase();
  const channelTitle = (input.channelTitle || '').toLowerCase();
  const tagsStr = (input.tags || []).join(' ').toLowerCase();
  const combinedText = `${title} ${description} ${channelTitle} ${tagsStr}`;
  const duration = input.durationSeconds || 0;
  const countryCode = (input.countryCode || 'RW').toUpperCase();

  let score = 0;
  const positiveMatches: string[] = [];
  const negativeMatches: string[] = [];
  const reasons: string[] = [];

  // ==========================================
  // 1. Positive Signals
  // ==========================================

  // Duration >= 60 minutes (+35)
  if (duration >= 3600) {
    score += 35;
    positiveMatches.push('duration >= 60 minutes (+35)');
    const hrs = Math.floor(duration / 3600);
    const mins = Math.floor((duration % 3600) / 60);
    reasons.push(`duration=${hrs}h${mins}m`);
  } else if (duration >= 2700) {
    // 45 - 59 minutes (+20)
    score += 20;
    positiveMatches.push('duration 45-59 minutes (+20)');
    reasons.push(`duration=${Math.floor(duration / 60)}m`);
  }

  // "full movie" (+25)
  if (/\bfull\s*movie\b/i.test(title)) {
    score += 25;
    positiveMatches.push('"full movie" (+25)');
    reasons.push("title contains 'full movie'");
  }

  // "full film" (+25)
  if (/\bfull\s*film\b/i.test(title)) {
    score += 25;
    positiveMatches.push('"full film" (+25)');
    reasons.push("title contains 'full film'");
  }

  // Country-specific Full Movie bonus (+25)
  const countryFullMoviePatterns: Record<string, RegExp> = {
    RW: /\b(rwandan\s*full\s*movie|rwanda\s*full\s*movie)\b/i,
    UG: /\b(ugandan\s*full\s*movie|uganda\s*full\s*movie|wakaliwood\s*full\s*movie|vj\s*emmy\s*full\s*movie)\b/i,
    KE: /\b(kenyan\s*full\s*movie|kenya\s*full\s*movie|riverwood\s*full\s*movie)\b/i,
    NG: /\b(nollywood\s*full\s*movie|nigerian\s*full\s*movie|latest\s*nigerian\s*full\s*movie)\b/i,
    GH: /\b(ghallywood\s*full\s*movie|kumawood\s*full\s*movie|ghana\s*full\s*movie)\b/i,
    TZ: /\b(bongo\s*full\s*movie|bongomovie\s*full|tanzanian\s*full\s*movie)\b/i,
    ZA: /\b(south\s*african\s*full\s*movie|mzansi\s*full\s*movie)\b/i,
    US: /\b(indie\s*full\s*movie|american\s*full\s*movie)\b/i,
  };

  const fullMoviePattern = countryFullMoviePatterns[countryCode] || countryFullMoviePatterns.RW;
  if (fullMoviePattern.test(title)) {
    score += 25;
    positiveMatches.push(`"${countryCode} full movie" (+25)`);
    reasons.push(`title contains '${countryCode} full movie'`);
  }

  // Country-specific film industry terms (+20)
  const countryTermPatterns: Record<string, RegExp> = {
    RW: /\b(film\s*nyarwanda|filime\s*nyarwanda|filime\s*nyarwanda\s*yose)\b/i,
    UG: /\b(wakaliwood|vj\s*emmy|vj\s*junior|filamu\s*za\s*uganda|ugandan\s*movie)\b/i,
    KE: /\b(riverwood|swahili\s*movies?|filamu\s*za\s*kiswahili|kenyan\s*movie)\b/i,
    NG: /\b(nollywood|yoruba\s*movies?|kannywood|nigerian\s*movie)\b/i,
    GH: /\b(kumawood|ghallywood|twi\s*movies?|ghanaian\s*movie)\b/i,
    TZ: /\b(bongo\s*movies?|bongomovie|filamu\s*za\s*kiswahili|tanzanian\s*movie)\b/i,
    ZA: /\b(mzansi\s*magic|mzansi\s*movies?|south\s*african\s*movie)\b/i,
    US: /\b(indie\s*movie|african\s*american\s*cinema)\b/i,
  };

  const termPattern = countryTermPatterns[countryCode] || countryTermPatterns.RW;
  if (termPattern.test(title)) {
    score += 20;
    positiveMatches.push(`"${countryCode} cinema term" (+20)`);
    reasons.push(`${countryCode} cinema term match`);
  }

  // Country metadata relevance (+15)
  const relevance = computeCountryRelevance(combinedText, countryCode);
  if (relevance.score >= 15) {
    score += 15;
    positiveMatches.push(`${countryCode} metadata (+15, matches: ${relevance.matchedKeywords.join(', ')})`);
    reasons.push(`${countryCode} keyword match`);
  }

  // Approved channel (+20)
  if (input.channelTrust === 'approved') {
    score += 20;
    positiveMatches.push('approved channel (+20)');
    reasons.push('trusted channel source');
  }

  // YouTube movie category (+10)
  if (input.categoryId === '1') {
    score += 10;
    positiveMatches.push('YouTube movie category (+10)');
    reasons.push('film category');
  }

  // ==========================================
  // 2. Negative Signals
  // ==========================================

  // trailer (-50)
  if (/\b(official\s*trailer|trailer\s*hd|trailer)\b/i.test(title)) {
    score -= 50;
    negativeMatches.push('trailer (-50)');
    reasons.push('trailer detected (-50)');
  }

  // teaser (-50)
  if (/\b(official\s*teaser|teaser\s*trailer|teaser)\b/i.test(title)) {
    score -= 50;
    negativeMatches.push('teaser (-50)');
    reasons.push('teaser detected (-50)');
  }

  // clip (-40)
  if (/\b(clip|short\s*clip|scene|highlight|cut)\b/i.test(title)) {
    score -= 40;
    negativeMatches.push('clip (-40)');
    reasons.push('clip detected (-40)');
  }

  // shorts (-50)
  if (/\b(#shorts|#short|youtube\s*shorts|\/shorts\/)\b/i.test(combinedText) || duration <= 60) {
    score -= 50;
    negativeMatches.push('shorts (-50)');
    reasons.push('short video/tag detected (-50)');
  }

  // short (-30) — ONLY penalize if duration < 1800s (30m)
  if (/\b(short\s*film|short)\b/i.test(title) && duration < 1800) {
    score -= 30;
    negativeMatches.push('short (-30)');
    reasons.push('short film (<30m) (-30)');
  }

  // episode (-25)
  if (/\b(episode|ep\s*\.?\s*\d+|uruhererekane)\b/i.test(title)) {
    score -= 25;
    negativeMatches.push('episode (-25)');
    reasons.push('series episode detected (-25)');
  }

  // S01E01 (-30)
  if (/\b(s\d+\s*e\d+|season\s*\d+\s*episode\s*\d+)\b/i.test(title)) {
    score -= 30;
    negativeMatches.push('S01E01 (-30)');
    reasons.push('season/episode code detected (-30)');
  }

  // S01 EP1 (-30)
  if (/\b(s\d+\s*ep\s*\d+|part\s*\d+)\b/i.test(title)) {
    score -= 30;
    negativeMatches.push('S01 EP1 (-30)');
    reasons.push('episodic part code detected (-30)');
  }

  // season (-20)
  if (/\b(season\s*\d+)\b/i.test(title) && !/\b(episode|s\d+)\b/i.test(title)) {
    score -= 20;
    negativeMatches.push('season (-20)');
    reasons.push('season code detected (-20)');
  }

  // interview (-30)
  if (/\b(interview|interviews|itangazamakuru)\b/i.test(title)) {
    score -= 30;
    negativeMatches.push('interview (-30)');
    reasons.push('interview detected (-30)');
  }

  // behind the scenes (-30)
  if (/\b(behind\s*the\s*scenes|making\s*of|b-roll)\b/i.test(combinedText)) {
    score -= 30;
    negativeMatches.push('behind the scenes (-30)');
    reasons.push('behind the scenes detected (-30)');
  }

  // reaction (-30)
  if (/\b(reaction|reacting\s*to)\b/i.test(title)) {
    score -= 30;
    negativeMatches.push('reaction (-30)');
    reasons.push('reaction video detected (-30)');
  }

  // review (-25)
  if (/\b(movie\s*review|film\s*review|ending\s*explained|breakdown)\b/i.test(title)) {
    score -= 25;
    negativeMatches.push('review (-25)');
    reasons.push('review video detected (-25)');
  }

  // music video (-25)
  if (/\b(official\s*music\s*video|official\s*audio|lyrics\s*video|audio\s*visualizer)\b/i.test(title)) {
    score -= 25;
    negativeMatches.push('music video (-25)');
    reasons.push('music video detected (-25)');
  }

  // top 10 (-30)
  if (/\b(top\s*10|top\s*5|top\s*\d+)\b/i.test(title)) {
    score -= 30;
    negativeMatches.push('top 10 (-30)');
    reasons.push('countdown video detected (-30)');
  }

  // news (-20)
  if (/\b(amakuru|breaking\s*news|news\s*update)\b/i.test(title)) {
    score -= 20;
    negativeMatches.push('news (-20)');
    reasons.push('news video detected (-20)');
  }

  // ==========================================
  // 3. Classification Resolution
  // ==========================================
  let contentType: GeoContentType = 'unknown';

  const isEpisode =
    /\b(episode|ep\s*\.?\s*\d+|uruhererekane|s\d+\s*e\d+|s\d+\s*ep\s*\d+|season\s*\d+)\b/i.test(title);

  if (isEpisode) {
    contentType = duration < 3600 ? 'episode' : 'series';
  } else if (negativeMatches.some((m) => m.includes('trailer') || m.includes('teaser'))) {
    contentType = 'trailer';
  } else if (negativeMatches.some((m) => m.includes('clip') || m.includes('shorts') || m.includes('behind the scenes'))) {
    contentType = 'clip';
  } else if (negativeMatches.some((m) => m.includes('interview'))) {
    contentType = 'interview';
  } else if (negativeMatches.some((m) => m.includes('music video'))) {
    contentType = 'music';
  } else if (duration >= 2700 && score >= 35) {
    contentType = 'movie';
  } else if (duration >= 3600 && score >= 20) {
    contentType = 'movie';
  } else if (duration >= 1800 && score >= 50) {
    contentType = 'movie';
  }

  // ==========================================
  // 4. Full Movie Rules
  // ==========================================
  const hasDisqualifyingNegative = negativeMatches.some(
    (m) =>
      m.includes('trailer') ||
      m.includes('teaser') ||
      m.includes('clip') ||
      m.includes('shorts') ||
      m.includes('episode') ||
      m.includes('S01') ||
      m.includes('music video') ||
      m.includes('top 10')
  );

  let isFullMovieCandidate = false;

  if (
    contentType === 'movie' &&
    duration >= 2700 &&
    !hasDisqualifyingNegative &&
    input.channelTrust !== 'rejected'
  ) {
    if (duration >= 3600 && score >= 60) {
      isFullMovieCandidate = true;
    } else if (duration >= 2700 && score >= 70) {
      isFullMovieCandidate = true;
    } else if (input.channelTrust === 'approved' && score >= 45 && duration >= 2700) {
      isFullMovieCandidate = true;
    }
  }

  let confidence = Math.max(0, Math.min(100, score)) / 100;
  if (duration >= 3600) {
    confidence = Math.min(1.0, confidence + 0.1);
  } else if (duration < 2700) {
    confidence = Math.max(0.0, confidence - 0.1);
  }

  return {
    contentType,
    isFullMovieCandidate,
    confidence: Number(confidence.toFixed(2)),
    score,
    countryScore: relevance.score,
    positiveMatches,
    negativeMatches,
    classificationReasons: reasons,
  };
}
