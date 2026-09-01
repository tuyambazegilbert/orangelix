/**
 * V2 discovery vocabulary.  It deliberately lives outside the classifier so
 * new territories can be configured without changing classification rules.
 */
import type { DiscoveryKeywordSet, GeoCountryConfigV2, LanguageKeywordSet } from './types';

const MOVIE = ['full movie','full film','full length movie','full length film','complete movie','complete film','entire movie','entire film','watch full movie','watch full film','feature film','full feature movie','full cinema','whole movie','whole film','movie full','film full','movie complete','film complete','full movie online','full film online','watch movie','watch film','full movie hd','full movie 1080p','full movie 4k','movie hd','film hd','new movie','latest movie','new film','latest film','movie release','film release','classic movie','classic film','old movie','independent film','indie film','local movie','local film'];
const SERIES = ['series','tv series','television series','tv show','show','drama series','african series','african tv series','african tv show','local series','local tv series','local show','full series','complete series','watch series','new series','latest series','new tv series','latest tv series','web series','african web series','local web series','drama','tv drama','african drama series','local drama series','season','full season','complete season','season one','season two','season three','season four','season five','full episodes','complete episodes','tv episodes','television episode','serial drama','telenovela','soap drama'];
const EPISODE = ['episode','episodes','ep','eps','ep.','full episode','full episodes','complete episode','complete episodes','new episode','latest episode','new episodes','latest episodes','watch episode','watch full episode','full tv episode','full series episode','tv episode','television episode','show episode','series episode','drama episode','african episode','african tv episode','local episode','season episode','episode 1','episode 2','episode 3','episode 4','episode 5','ep 1','ep 2','ep 3','ep 4','ep 5','part 1','part 2','chapter 1','new continuation'];
const SEASON = ['season','full season','complete season','season one','season two','season three','season four','season five','series one','series two','season 1','season 2','season 3','season 4','season 5','s01','s02','s03','season premiere','season finale'];
const FULL = ['full movie','full film','full length movie','complete movie','complete film','entire movie','feature film','full feature movie','whole movie','watch full movie','watch full film','full cinema','movie complete','film complete','full movie online','full film online','full movie hd','full movie 1080p','full episode','complete episode'];
const NEGATIVE = ['trailer','teaser','clip','scene','scenes','highlight','highlights','interview','reaction','review','recap','ending explained','explained','behind the scenes','bts','making of','short','shorts','music video','song','lyrics','soundtrack','news','top 10','top 5','countdown','compilation'];
const GENRES = ['action','adventure','comedy','romance','romantic comedy','drama','family','crime','thriller','mystery','horror','supernatural','fantasy','historical','war','biography','documentary','faith','religious','inspirational'];

const LOCAL: Record<string, { demonym: string; cinema: string[]; language: Record<string, string[]> }> = {
  RW: { demonym:'Rwandan', cinema:['rwanda cinema','rwandan cinema','film nyarwanda','filime nyarwanda','filime nshya','filime z urukundo','kigali film','rwanda movies','agasobanuye','rwandan drama'], language:{ rw:['filime','filime nyarwanda','uruhererekane','igice','sezo'] } },
  UG: { demonym:'Ugandan', cinema:['uganda cinema','ugandan cinema','wakaliwood','lugawood','ugandan films','kampala film','luganda movie','agasobanuye','uganda drama','ugandan tv'], language:{ lg:['luganda movie','film mu luganda','ekitundu','omuzannyo','luganda series'] } },
  KE: { demonym:'Kenyan', cinema:['kenya cinema','kenyan cinema','riverwood','swahiliwood','nairobi film','kenyan drama','kenyan films','kiswahili film','kenya movie','local kenya film'], language:{ sw:['filamu','tamthilia','kipindi','filamu za kiswahili','mfululizo'] } },
  NG: { demonym:'Nigerian', cinema:['nollywood','yorubahood','nigerian cinema','lagos film','nigerian drama','yoruba movie','igbo movie','hausa film','abuja film','naija movie'], language:{ yo:['fiimu yoruba','yoruba movie','ere aworan'], ig:['igbo movie','nigerian igbo film'], ha:['hausa film','kannywood'] } },
  GH: { demonym:'Ghanaian', cinema:['ghallywood','kumawood','ghana cinema','ghanaian films','accra film','twi movie','ghana drama','kumasi film','ghana movie','local ghana film'], language:{ ak:['twi movie','akan film','kumawood'] } },
  TZ: { demonym:'Tanzanian', cinema:['bongomovie','bongo movie','bongo cinema','tamthilia','tanzania cinema','swahili film','dar es salaam film','tanzanian drama','filamu tanzania','bongo drama'], language:{ sw:['filamu','tamthilia','kipindi','filamu za kiswahili','mfululizo'] } },
  ZA: { demonym:'South African', cinema:['mzansi','mzansi magic','south african cinema','south african film','zulu drama','xhosa film','afrikaans film','bioskop','south african tv','local south african film'], language:{ zu:['ifilimu','umdlalo'], xh:['ifilimu','umdlalo'], af:['fliek','reeks'] } },
  US: { demonym:'American', cinema:['american cinema','indie film','independent cinema','african american cinema','black cinema','hollywood independent film','american drama','us cinema','american film','web series'], language:{ en:['indie film','web series','feature film'] } },
};

const unique = (values: string[]) => [...new Set(values.map(value => value.trim()).filter(Boolean))];
export function v2KeywordSet(countryCode: string, existing?: Partial<DiscoveryKeywordSet>): DiscoveryKeywordSet {
  const local = LOCAL[countryCode] || { demonym: countryCode, cinema: [], language: {} };
  return {
    movie: unique([...(existing?.movie || []), ...MOVIE, ...local.cinema.map(term => `${term} full movie`)]),
    series: unique([...(existing?.series || []), ...SERIES, ...local.cinema.map(term => `${term} series`)]),
    episode: unique([...(existing?.episode || []), ...EPISODE, ...local.cinema.map(term => `${term} episode`)]),
    season: unique([...(existing?.season || []), ...SEASON]),
    fullContent: unique([...(existing?.fullContent || []), ...FULL]),
    genres: unique([...(existing?.genres || []), ...GENRES]),
    negativeExclusions: unique([...(existing?.negativeExclusions || []), ...NEGATIVE]),
    localCinema: unique([...(existing?.localCinema || []), ...local.cinema]),
  };
}

export function v2LanguageKeywords(countryCode: string, languages: string[], existing: LanguageKeywordSet[] = []): LanguageKeywordSet[] {
  const local = LOCAL[countryCode]?.language || {};
  return languages.map(languageCode => {
    const prior = existing.find(item => item.languageCode === languageCode);
    const terms = unique([...(prior?.movie || []), ...(local[languageCode] || [])]);
    return { languageCode, movie: terms, series: unique([...(prior?.series || []), ...terms.map(term => `${term} series`)]), episode: unique([...(prior?.episode || []), ...terms.map(term => `${term} episode`)]), season: unique([...(prior?.season || []), ...SEASON.slice(0, 8)]), cinema: unique([...(prior?.cinema || []), ...(LOCAL[countryCode]?.cinema || [])]) };
  });
}

export function v2Demonym(countryCode: string, fallback: string): string { return LOCAL[countryCode]?.demonym || fallback; }

export function validateV2Profile(profile: GeoCountryConfigV2): string[] {
  const minimums: Array<[keyof DiscoveryKeywordSet, number]> = [['movie',40],['series',40],['episode',40],['season',20],['fullContent',20],['negativeExclusions',20],['genres',10],['localCinema',10]];
  return minimums.flatMap(([key, minimum]) => profile.discoveryKeywords[key].length < minimum ? [`${key}: ${profile.discoveryKeywords[key].length}/${minimum}`] : []);
}
