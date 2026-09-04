/**
 * V2 discovery vocabulary. It deliberately lives outside the classifier so
 * new territories can be configured without changing classification rules.
 * Supports rich regional cinema industries, local dialects, transliterations, and multi-dimensional queries.
 */
import type { DiscoveryKeywordSet, GeoCountryConfigV2, LanguageKeywordSet } from './types';

const MOVIE = [
  'full movie', 'full film', 'full length movie', 'full length film', 'complete movie', 'complete film',
  'entire movie', 'entire film', 'watch full movie', 'watch full film', 'feature film', 'full feature movie',
  'full cinema', 'whole movie', 'whole film', 'movie full', 'film full', 'movie complete', 'film complete',
  'full movie online', 'full film online', 'watch movie', 'watch film', 'full movie hd', 'full movie 1080p',
  'full movie 4k', 'movie hd', 'film hd', 'new movie', 'latest movie', 'new film', 'latest film',
  'movie release', 'film release', 'classic movie', 'classic film', 'old movie', 'independent film',
  'indie film', 'local movie', 'local film', 'blockbuster full movie', 'full cinema movie', 'hd movie full',
];

const SERIES = [
  'series', 'tv series', 'television series', 'tv show', 'show', 'drama series', 'african series',
  'african tv series', 'african tv show', 'local series', 'local tv series', 'local show', 'full series',
  'complete series', 'watch series', 'new series', 'latest series', 'new tv series', 'latest tv series',
  'web series', 'african web series', 'local web series', 'drama', 'tv drama', 'african drama series',
  'local drama series', 'season', 'full season', 'complete season', 'season one', 'season two',
  'season three', 'season four', 'season five', 'full episodes', 'complete episodes', 'tv episodes',
  'television episode', 'serial drama', 'telenovela', 'soap drama', 'season 1 full', 'season 2 full',
];

const EPISODE = [
  'episode', 'episodes', 'ep', 'eps', 'ep.', 'full episode', 'full episodes', 'complete episode',
  'complete episodes', 'new episode', 'latest episode', 'new episodes', 'latest episodes', 'watch episode',
  'watch full episode', 'full tv episode', 'full series episode', 'tv episode', 'television episode',
  'show episode', 'series episode', 'drama episode', 'african episode', 'african tv episode', 'local episode',
  'season episode', 'episode 1', 'episode 2', 'episode 3', 'episode 4', 'episode 5', 'ep 1', 'ep 2',
  'ep 3', 'ep 4', 'ep 5', 'part 1', 'part 2', 'part 3', 'part 4', 'chapter 1', 'new continuation',
];

const SEASON = [
  'season', 'full season', 'complete season', 'season one', 'season two', 'season three', 'season four',
  'season five', 'series one', 'series two', 'season 1', 'season 2', 'season 3', 'season 4', 'season 5',
  's01', 's02', 's03', 's04', 'season premiere', 'season finale',
];

const FULL = [
  'full movie', 'full film', 'full length movie', 'complete movie', 'complete film', 'entire movie',
  'feature film', 'full feature movie', 'whole movie', 'watch full movie', 'watch full film', 'full cinema',
  'movie complete', 'film complete', 'full movie online', 'full film online', 'full movie hd',
  'full movie 1080p', 'full episode', 'complete episode', 'full movie 4k', 'full length feature',
];

const NEGATIVE = [
  'trailer', 'teaser', 'clip', 'scene', 'scenes', 'highlight', 'highlights', 'interview', 'reaction',
  'review', 'recap', 'ending explained', 'explained', 'behind the scenes', 'bts', 'making of', 'short',
  'shorts', 'music video', 'song', 'lyrics', 'soundtrack', 'news', 'top 10', 'top 5', 'countdown',
  'compilation', 'bloopers', 'podcast', 'press conference', 'status video',
];

const GENRES = [
  'action', 'adventure', 'comedy', 'romance', 'romantic comedy', 'drama', 'family', 'crime', 'thriller',
  'mystery', 'horror', 'supernatural', 'fantasy', 'historical', 'war', 'biography', 'documentary',
  'faith', 'religious', 'inspirational', 'gospel', 'traditional',
];

export const LOCAL: Record<
  string,
  {
    demonym: string;
    adjective?: string;
    cinema: string[];
    topHighYieldMovieQueries?: string[];
    topHighYieldSeriesQueries?: string[];
    language: Record<string, string[]>;
  }
> = {
  RW: {
    demonym: 'Rwandan',
    adjective: 'Rwandan',
    cinema: [
      'filime nyarwanda',
      'film nyarwanda',
      'filime zisobanuye',
      'agasobanuye',
      'agasobanuye gashya',
      'filime nyarwanda nshya',
      'kigali movies',
      'filime z urukundo nyarwanda',
      'filime z imirwano',
      'filime zisobanuye mu kinyarwanda',
      'filime nyarwanda zisesenguye',
      'uruhererekane nyarwanda',
      'filime y urwenya',
      'agasobanuye rocky kimomo',
      'agasobanuye junior giti',
      'agasobanuye sankara',
      'rwandan cinema',
      'rwandan drama',
      'filime zo muri rwanda',
      'filime yuzuye nyarwanda',
      'sinema nyarwanda',
      'rwanda movies',
    ],
    topHighYieldMovieQueries: [
      'filime nyarwanda full movie',
      'Rwandan full movie english subtitles',
      'agasobanuye 2024 full movie',
      'Rwanda movies 2024 full hd',
      'filime zisobanuye mu kinyarwanda full',
      'Kigali movies full movie 1080p',
      'filime nyarwanda nshya 2024',
      'Rwandan cinema full length movie',
      'agasobanuye gashya full movie',
      'Rwandan drama movie with subtitles',
    ],
    topHighYieldSeriesQueries: [
      'filime nyarwanda uruhererekane igice cya 1',
      'Rwandan drama series season 1 episode 1',
      'filime nyarwanda season 1 episode 1',
      'Rwanda web series episode 1',
      'agasobanuye series igice cya 1',
      'Rwandan television series episode 1',
    ],
    language: {
      rw: [
        'filime nyarwanda',
        'filime zisobanuye',
        'agasobanuye',
        'uruhererekane',
        'igice cya',
        'sezo ya',
        'filime yuzuye',
        'filime nshya',
        'urukundo',
        'imirwano',
        'urwenya',
        'sinema nyarwanda',
      ],
      fr: ['film rwandais', 'cinema rwandais', 'film kigali', 'serie rwandaise'],
      en: ['rwandan full movie', 'rwanda movies', 'rwandan drama series', 'kigali films english subtitles'],
    },
  },
  UG: {
    demonym: 'Ugandan',
    adjective: 'Ugandan',
    cinema: [
      'wakaliwood',
      'lugawood',
      'ugandan movies',
      'uganda full movie',
      'luganda translated movies',
      'ugandan comedy',
      'katemba mu luganda',
      'ebinnyaanyanya',
      'omuzannyo gwa luganda',
      'kampala film',
      'ugandan action movie',
      'vj junior translated full movie',
      'vj emmy luganda full movie',
      'vj jingo full movie',
      'uganda drama series',
      'lugawood movie full',
      'ugandan series',
      'uganda cinema',
      'ugandan tv',
    ],
    topHighYieldMovieQueries: [
      'wakaliwood full movie',
      'Ugandan movies 2024 full movie',
      'luganda translated movies full',
      'Ugandan action movie with english subtitles',
      'katemba mu luganda full movie',
      'Kampala film full hd 1080p',
      'vj junior translated full movie',
      'Uganda cinema full length feature',
      'lugawood full movie',
      'Ugandan comedy movie full hd',
    ],
    topHighYieldSeriesQueries: [
      'omuzannyo gwa luganda ekitundu 1',
      'Ugandan drama series season 1 episode 1',
      'katemba series episode 1',
      'Uganda web series episode 1',
      'ebinnyaanyanya series ekitundu 1',
      'Ugandan tv series full episodes',
    ],
    language: {
      lg: [
        'luganda movie',
        'katemba',
        'omuzannyo',
        'ekitundu',
        'filimu mu luganda',
        'ebinnyaanyanya',
        'luganda translated',
        'vj junior',
        'vj emmy',
        'vj jingo',
        'katemba ow ekitundu',
      ],
      sw: ['filamu za uganda', 'tamthilia ya uganda'],
      en: ['ugandan full movie', 'wakaliwood action movie', 'ugandan series episode 1', 'kampala cinema'],
    },
  },
  KE: {
    demonym: 'Kenyan',
    adjective: 'Kenyan',
    cinema: [
      'riverwood',
      'swahiliwood',
      'kenyan movies',
      'kenya full movie',
      'tamthilia za kiswahili',
      'tamthilia ya kenya',
      'kenyan drama',
      'nairobi film',
      'riverwood full movie',
      'kenyan comedy movie',
      'lulu drama kenya',
      'sinema za kenya',
      'kenya cinema',
      'mfululizo wa kenya',
      'kikuyu movies',
      'kenyan feature film',
    ],
    topHighYieldMovieQueries: [
      'tamthilia za kiswahili kenya full',
      'Kenyan movies 2024 full movie',
      'riverwood full movie',
      'Kenyan full movie english subtitles',
      'swahiliwood full movie',
      'Nairobi film full hd 1080p',
      'filamu za kiswahili kenya full',
      'Kenyan drama full movie 2024',
      'sinema za kenya full movie',
      'Kenyan comedy movie full hd',
    ],
    topHighYieldSeriesQueries: [
      'tamthilia ya kenya episode 1',
      'Kenyan drama series season 1 episode 1',
      'tamthilia za kiswahili episode 1',
      'Kenyan web series episode 1',
      'lulu drama kenya full episode',
      'Kenya tv series full season',
    ],
    language: {
      sw: [
        'filamu za kiswahili',
        'tamthilia za kiswahili',
        'kipindi cha',
        'mfululizo',
        'sinema za kiswahili',
        'tamthilia ya kenya',
        'filamu mpya za kiswahili',
        'tamthilia episode 1',
      ],
      en: ['kenyan full movie', 'kenya drama series', 'nairobi movie full', 'riverwood films'],
    },
  },
  NG: {
    demonym: 'Nigerian',
    adjective: 'Nigerian',
    cinema: [
      'nollywood',
      'nollywood full movie',
      'latest nollywood movies',
      'yoruba movies',
      'yorubahood',
      'yoruba movies 2024 full movie',
      'igbo movies',
      'igbo full movie',
      'hausa film',
      'kannywood',
      'kannywood hausa movie',
      'nigerian drama',
      'asaba movies',
      'epic nollywood full movie',
      'royal nollywood movie',
      'nigerian cinema',
      'nollywood blockbuster',
      'nigerian comedy movies',
      'nollywood series',
    ],
    topHighYieldMovieQueries: [
      'yoruba movies 2024 full movie',
      'Latest Nollywood movies 2024 full movie',
      'igbo movies 2024 full movie',
      'Nollywood epic full movie 1080p',
      'kannywood hausa film 2024 full',
      'Nigerian movies 2024 full movie english subtitles',
      'yorubahood latest full movie',
      'Royal Nollywood full movie',
      'asaba latest full movie 2024',
      'Latest Naija full movies 1080p',
    ],
    topHighYieldSeriesQueries: [
      'yoruba series season 1 episode 1',
      'Nigerian drama series season 1 episode 1',
      'hausa series season 1 episode 1',
      'Nollywood series full episodes season 1',
      'igbo drama series episode 1',
      'Nollywood web series episode 1',
    ],
    language: {
      yo: [
        'fiimu yoruba',
        'ere aworan yoruba',
        'yoruba movie full',
        'yorubahood',
        'odunlade adekola movies',
        'femi adebayo films',
      ],
      ig: ['ihe nkiri igbo', 'igbo movie full', 'igbo traditional movie', 'epic igbo movie'],
      ha: ['fim din hausa', 'kannywood fim', 'hausa movie full', 'ali nuhu film', 'hausa series episode 1'],
      pcm: ['naija full movie', 'pidgin comedy movie', 'naija drama series'],
      en: ['nollywood full movie', 'nigerian movies 2024 full movie', 'nigerian tv series full episodes'],
    },
  },
  GH: {
    demonym: 'Ghanaian',
    adjective: 'Ghanaian',
    cinema: [
      'ghallywood',
      'kumawood',
      'ghana movies',
      'ghana full movie',
      'twi movies',
      'twi full movie',
      'kumawood full movie',
      'ghanaian drama',
      'accra film',
      'ghana comedy movie',
      'akan movies',
      'ghallywood full movie',
      'kumasi movie',
      'ghana series',
      'ghana gospel movie',
    ],
    topHighYieldMovieQueries: [
      'kumawood full movies 2024',
      'Ghana movies 2024 full movie',
      'twi movies 2024 full movie',
      'Ghanaian movies with english subtitles',
      'akan movies full movie 2024',
      'Ghallywood full movies 2024',
      'kumasi movie full hd',
      'Latest Ghanaian movies full hd 1080p',
      'ghana gospel movie full',
      'Ghanaian cinema full feature film',
    ],
    topHighYieldSeriesQueries: [
      'kumawood series season 1 episode 1',
      'Ghana drama series season 1 episode 1',
      'twi series season 1 episode 1',
      'Ghallywood series episode 1',
      'akan tv series episode 1',
      'Ghanaian web series episode 1',
    ],
    language: {
      ak: ['twi movie', 'kumawood movie', 'akan film', 'ghana twi film', 'kumawood series', 'twi full movie'],
      en: ['ghana movies full movie', 'ghallywood full movies', 'ghanaian drama series episode 1'],
    },
  },
  TZ: {
    demonym: 'Tanzanian',
    adjective: 'Tanzanian',
    cinema: [
      'bongo movie',
      'bongo movies',
      'bongo cinema',
      'tamthilia ya bongo',
      'tamthilia za tanzania',
      'filamu za kibongo',
      'bongo drama',
      'swahili movies tanzania',
      'sinema za kibongo',
      'dar es salaam film',
      'bongo comedy',
      'filamu mpya za kibongo',
      'swahiliwood tanzania',
    ],
    topHighYieldMovieQueries: [
      'bongo movie 2024 full',
      'Tanzanian full movie english subtitles',
      'filamu mpya za kibongo 2024 full',
      'Tanzania movies 2024 full movie',
      'tamthilia ya bongo full movie',
      'Bongo movie full movie english subtitles',
      'sinema za kibongo 2024 full movie',
      'Dar es Salaam film full hd 1080p',
      'swahili bongo movie full',
      'Tanzanian cinema 1080p full movie',
    ],
    topHighYieldSeriesQueries: [
      'tamthilia ya bongo episode 1',
      'Tanzanian drama series season 1 episode 1',
      'mfululizo wa bongo episode 1',
      'Tanzania web series episode 1',
      'tamthilia za kiswahili tanzania episode 1',
      'Bongo tv series full episodes',
    ],
    language: {
      sw: [
        'filamu za kiswahili',
        'tamthilia ya bongo',
        'filamu za kibongo',
        'kipindi cha bongo',
        'sinema za bongo',
        'mfululizo wa tamthilia',
        'filamu mpya za kibongo',
      ],
      en: ['tanzanian full movie', 'bongo movie full movie english subtitles', 'dar es salaam films'],
    },
  },
  ZA: {
    demonym: 'South African',
    adjective: 'South African',
    cinema: [
      'mzansi magic',
      'mzansi movies',
      'south african movie',
      'south african full movie',
      'lokshin bioskop',
      'zulu movie',
      'xhosa movie',
      'afrikaans fliek',
      'south african drama series',
      'sa cinema',
      'mzansi bioskop',
      'zulu drama',
      'south african comedy',
      'mzansi series',
    ],
    topHighYieldMovieQueries: [
      'lokshin bioskop full movie 2024',
      'South African movies 2024 full movie',
      'zulu movie full 2024',
      'Mzansi magic full movie',
      'afrikaans fliek full movie',
      'South African cinema 1080p full movie',
      'xhosa movie full',
      'South African comedy movie full',
      'mzansi bioskop full movie',
      'South African drama movie with english subtitles',
    ],
    topHighYieldSeriesQueries: [
      'zulu drama series episode 1',
      'South African drama series season 1 episode 1',
      'afrikaanse reeks episode 1',
      'Mzansi series season 1 episode 1',
      'lokshin series episode 1',
      'South African web series episode 1',
    ],
    language: {
      zu: ['ifilimu yesizulu', 'umdlalo wesizulu', 'isizulu movie full', 'zulu drama series'],
      xh: ['ifilimu yesixhosa', 'umdlalo wesixhosa', 'isixhosa movie full'],
      af: ['afrikaanse rolprent', 'fliek full movie', 'afrikaans fliek', 'afrikaanse reeks episode 1'],
      en: ['south african full movie', 'mzansi movie full', 'south african drama episode 1'],
    },
  },
  US: {
    demonym: 'American',
    adjective: 'American',
    cinema: [
      'independent black cinema full movie',
      'american indie film full movie',
      'urban indie movie full',
      'independent drama feature film',
      'american web series episode 1',
      'indie romance full movie',
      'award winning indie movie full',
      'african american cinema full movie',
      'indie drama full movie',
      'american cinema',
      'web series',
    ],
    topHighYieldMovieQueries: [
      'independent black cinema full movie',
      'American indie film 2024 full movie',
      'urban indie movie full',
      'Independent drama feature film',
      'award winning indie movie full',
      'African American cinema full movie',
      'indie drama full movie hd 1080p',
      'American independent feature film',
    ],
    topHighYieldSeriesQueries: [
      'urban web series episode 1',
      'American web series season 1 episode 1',
      'indie drama series episode 1',
      'Black indie series season 1 full',
    ],
    language: {
      en: [
        'indie full movie',
        'independent feature film',
        'web series season 1 episode 1',
        'urban movie full',
      ],
    },
  },
};

const unique = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

export function v2KeywordSet(countryCode: string, existing?: Partial<DiscoveryKeywordSet>): DiscoveryKeywordSet {
  const local = LOCAL[countryCode] || { demonym: countryCode, cinema: [], language: {} };
  return {
    movie: unique([...(existing?.movie || []), ...MOVIE, ...local.cinema.map((term) => `${term} full movie`)]),
    series: unique([...(existing?.series || []), ...SERIES, ...local.cinema.map((term) => `${term} series`)]),
    episode: unique([...(existing?.episode || []), ...EPISODE, ...local.cinema.map((term) => `${term} episode`)]),
    season: unique([...(existing?.season || []), ...SEASON]),
    fullContent: unique([...(existing?.fullContent || []), ...FULL]),
    genres: unique([...(existing?.genres || []), ...GENRES]),
    negativeExclusions: unique([...(existing?.negativeExclusions || []), ...NEGATIVE]),
    localCinema: unique([...(existing?.localCinema || []), ...local.cinema]),
  };
}

export function v2LanguageKeywords(
  countryCode: string,
  languages: string[],
  existing: LanguageKeywordSet[] = []
): LanguageKeywordSet[] {
  const local = LOCAL[countryCode]?.language || {};
  return languages.map((languageCode) => {
    const prior = existing.find((item) => item.languageCode === languageCode);
    const terms = unique([...(prior?.movie || []), ...(local[languageCode] || [])]);
    return {
      languageCode,
      movie: terms,
      series: unique([...(prior?.series || []), ...terms.map((term) => `${term} series`)]),
      episode: unique([...(prior?.episode || []), ...terms.map((term) => `${term} episode`)]),
      season: unique([...(prior?.season || []), ...SEASON.slice(0, 8)]),
      cinema: unique([...(prior?.cinema || []), ...(LOCAL[countryCode]?.cinema || [])]),
    };
  });
}

export function v2Demonym(countryCode: string, fallback: string): string {
  return LOCAL[countryCode]?.demonym || fallback;
}

export function validateV2Profile(profile: GeoCountryConfigV2): string[] {
  const minimums: Array<[keyof DiscoveryKeywordSet, number]> = [
    ['movie', 40],
    ['series', 40],
    ['episode', 40],
    ['season', 20],
    ['fullContent', 20],
    ['negativeExclusions', 20],
    ['genres', 10],
    ['localCinema', 10],
  ];
  return minimums.flatMap(([key, minimum]) =>
    profile.discoveryKeywords[key].length < minimum
      ? [`${key}: ${profile.discoveryKeywords[key].length}/${minimum}`]
      : []
  );
}

export function getDiscoveryV2Profile(
  countryCode: string,
  rawCountry?: Record<string, unknown>
): GeoCountryConfigV2 {
  const code = (countryCode || 'RW').toUpperCase();
  const name = (rawCountry?.name as string) || code;
  const demonym = v2Demonym(code, (rawCountry?.demonym as string) || `${name}n`);
  const keywords = v2KeywordSet(code, (rawCountry?.discoveryKeywords as Partial<DiscoveryKeywordSet>) || {});
  const languages = ((rawCountry?.languages as string[]) || ['en']).map((l) => l.toLowerCase());
  const languageKeywords = v2LanguageKeywords(
    code,
    languages,
    (rawCountry?.languageKeywords as LanguageKeywordSet[]) || []
  );

  return {
    countryCode: code,
    name,
    nativeName: (rawCountry?.nativeName as string) || name,
    flagEmoji: (rawCountry?.flagEmoji as string) || '🎬',
    demonym,
    adjective: (rawCountry?.adjective as string) || LOCAL[code]?.adjective || demonym,
    region: (rawCountry?.region as string) || 'Africa',
    capital: (rawCountry?.capital as string) || '',
    languages,
    defaultLanguage: (rawCountry?.defaultLanguage as string) || languages[0] || 'en',
    discoveryKeywords: keywords,
    languageKeywords,
    searchLanguages: languages,
    movieQueries: (rawCountry?.movieQueries as string[]) || [],
    seriesQueries: (rawCountry?.seriesQueries as string[]) || [],
    trustedChannelIds: (rawCountry?.trustedChannelIds as string[]) || [],
    minMovieDurationMinutes: (rawCountry?.minMovieDurationMinutes as number) || 45,
    autoPublishMinScore: (rawCountry?.autoPublishMinScore as number) || 76,
    enabled: rawCountry?.enabled !== false,
    cinemaTerms: (rawCountry?.cinemaTerms as string[]) || LOCAL[code]?.cinema || [],
  };
}


