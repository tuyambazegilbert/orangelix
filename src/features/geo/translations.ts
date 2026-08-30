/**
 * OrangeFlix Multilingual Translation Dictionaries
 * Decouples user interface language from visitor geolocation.
 */

export interface GeoTranslationDictionary {
  watchMovies: (countryName: string) => string;
  forYou: string;
  discoverSubtitle: (countryName: string) => string;
  fullMovies: string;
  popular: string;
  recentlyAdded: string;
  seriesAndEpisodes: string;
  allContent: string;
  searchPlaceholder: (countryName: string) => string;
  duration: string;
  views: string;
  channel: string;
  published: string;
  seeAll: string;
  watchNow: string;
  dismiss: string;
  noMoviesFound: string;
  verifiedYouTube: string;
  relatedMovies: string;
  share: string;
  addToFavorites: string;
  watchLater: string;
  filterByDuration: string;
  allDurations: string;
  featureLength: string; // > 60m
  mediumLength: string; // 30-60m
  shortLength: string; // < 30m
  score: string;
  officialYouTubeEmbed: string;
  disclaimer: string;
}

export const GEO_TRANSLATIONS: Record<string, GeoTranslationDictionary> = {
  rw: {
    watchMovies: (c) => `Reba Filime ${c === 'Rwanda' ? 'Nyarwanda' : `zo muri ${c}`}`,
    forYou: 'Byagenewe Wowe',
    discoverSubtitle: (c) => `Filime n’amasohora byatoranyijwe byo muri ${c} kuri YouTube.`,
    fullMovies: 'Filime Zose (Full Movies)',
    popular: 'Izikunzwe Cyane',
    recentlyAdded: 'Iziheruka Gusohoka',
    seriesAndEpisodes: 'Uruhererekane & Ibice',
    allContent: 'Byose Hamwe',
    searchPlaceholder: (c) => `Shakisha filime ${c === 'Rwanda' ? 'nyarwanda' : `zo muri ${c}`}...`,
    duration: 'Igihe imara',
    views: 'inshuro yarebwe',
    channel: 'Shene',
    published: 'Yashyizweho',
    seeAll: 'Reba zose',
    watchNow: 'Reba nonaha',
    dismiss: 'Funga',
    noMoviesFound: 'Nta filime zibonetse kuri ubu bushakashatsi.',
    verifiedYouTube: 'Kuri YouTube yemewe',
    relatedMovies: 'Izindi filime ushobora gukunda',
    share: 'Sangiza abandi',
    addToFavorites: 'Bika mu zo ukunda',
    watchLater: 'Reba nyuma',
    filterByDuration: 'Hitamo igihe',
    allDurations: 'Ibihe byose',
    featureLength: 'Yose (hejuru ya 60m)',
    mediumLength: 'Iringaniye (30-60m)',
    shortLength: 'Ntoya (< 30m)',
    score: 'Amanota y’ubwiza',
    officialYouTubeEmbed: 'Iyi videwo icurangirwa kuri YouTube yemewe mu buryo bwizewe.',
    disclaimer: 'Videwo zicukurwa mu buryo bwa YouTube API zikagaragara mu mukurankuru w’abahanzi bazo.',
  },
  en: {
    watchMovies: (c) => `Watch ${c === 'Rwanda' ? 'Rwandan' : `${c}`} Movies`,
    forYou: 'For You',
    discoverSubtitle: (c) => `Curated cinema & stories from ${c} discovered on YouTube.`,
    fullMovies: 'Full Movies',
    popular: 'Popular Now',
    recentlyAdded: 'Recently Added',
    seriesAndEpisodes: 'TV Series & Episodes',
    allContent: 'All Content',
    searchPlaceholder: (c) => `Search ${c === 'Rwanda' ? 'Rwandan' : `${c}`} cinema & movies...`,
    duration: 'Duration',
    views: 'views',
    channel: 'Channel',
    published: 'Published',
    seeAll: 'View all',
    watchNow: 'Watch now',
    dismiss: 'Dismiss',
    noMoviesFound: 'No movies found matching your search filters.',
    verifiedYouTube: 'Official YouTube Stream',
    relatedMovies: 'More like this',
    share: 'Share',
    addToFavorites: 'Add to Favorites',
    watchLater: 'Watch Later',
    filterByDuration: 'Duration filter',
    allDurations: 'All durations',
    featureLength: 'Feature Film (> 60m)',
    mediumLength: 'Medium (30-60m)',
    shortLength: 'Short (< 30m)',
    score: 'Quality Score',
    officialYouTubeEmbed: 'Official YouTube embedded playback adhering to platform syndication standards.',
    disclaimer: 'OrangeFlix indexes public YouTube cinema metadata and streams directly via the official embedded player.',
  },
  fr: {
    watchMovies: (c) => `Regarder des Films ${c === 'Rwanda' ? 'Rwandais' : `du ${c}`}`,
    forYou: 'Pour Vous',
    discoverSubtitle: (c) => `Cinéma et productions sélectionnées du ${c} disponibles sur YouTube.`,
    fullMovies: 'Films Complets',
    popular: 'Populaires',
    recentlyAdded: 'Récemment Ajoutés',
    seriesAndEpisodes: 'Séries & Épisodes',
    allContent: 'Tout le Catalogue',
    searchPlaceholder: (c) => `Rechercher des films du ${c}...`,
    duration: 'Durée',
    views: 'vues',
    channel: 'Chaîne',
    published: 'Publié le',
    seeAll: 'Voir tout',
    watchNow: 'Regarder',
    dismiss: 'Fermer',
    noMoviesFound: 'Aucun film trouvé pour cette recherche.',
    verifiedYouTube: 'Lecteur Officiel YouTube',
    relatedMovies: 'Films similaires',
    share: 'Partager',
    addToFavorites: 'Ajouter aux favoris',
    watchLater: 'À regarder plus tard',
    filterByDuration: 'Filtrer par durée',
    allDurations: 'Toutes les durées',
    featureLength: 'Long-métrage (> 60m)',
    mediumLength: 'Moyen-métrage (30-60m)',
    shortLength: 'Court-métrage (< 30m)',
    score: 'Score Qualité',
    officialYouTubeEmbed: 'Lecture intégrée officielle respectant les standards de syndication YouTube.',
    disclaimer: 'OrangeFlix indexe les métadonnées YouTube publiques et diffuse via le lecteur officiel.',
  },
  sw: {
    watchMovies: (c) => `Tazama Filamu za ${c}`,
    forYou: 'Kwa Ajili Yako',
    discoverSubtitle: (c) => `Filamu zilizoteuliwa kutoka ${c} zinazopatikana YouTube.`,
    fullMovies: 'Filamu Kamili (Full Movies)',
    popular: 'Zinazopendwa Zaidi',
    recentlyAdded: 'Mpya Zaidi',
    seriesAndEpisodes: 'Tamthilia & Vipindi',
    allContent: 'Zote Pamoja',
    searchPlaceholder: (c) => `Tafuta filamu za ${c}...`,
    duration: 'Muda',
    views: 'watazamaji',
    channel: 'Chaneli',
    published: 'Imechapishwa',
    seeAll: 'Tazama zote',
    watchNow: 'Tazama sasa',
    dismiss: 'Funga',
    noMoviesFound: 'Hakuna filamu zilizopatikana kwa utafutaji huu.',
    verifiedYouTube: 'YouTube Rasmi',
    relatedMovies: 'Filamu Zinazofanana',
    share: 'Shiriki',
    addToFavorites: 'Weka kwenye vipendwa',
    watchLater: 'Tazama baadaye',
    filterByDuration: 'Chuja kwa muda',
    allDurations: 'Muda wowote',
    featureLength: 'Filamu Ndefu (> 60m)',
    mediumLength: 'Wastani (30-60m)',
    shortLength: 'Fupi (< 30m)',
    score: 'Kiwango cha Ubora',
    officialYouTubeEmbed: 'Inacheza kupitia mfumo rasmi wa YouTube.',
    disclaimer: 'OrangeFlix inakusanya taarifa za YouTube na kuchezesha kupitia kichezaji rasmi cha YouTube.',
  },
};

export function getGeoTranslations(lang: string = 'rw'): GeoTranslationDictionary {
  const normalized = (lang || 'rw').toLowerCase();
  return GEO_TRANSLATIONS[normalized] || GEO_TRANSLATIONS['en'] || GEO_TRANSLATIONS['rw'];
}

