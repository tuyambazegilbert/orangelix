/**
 * OrangeFlix Query Parser & Intent Understanding Engine
 * Performs normalization, typo tolerance (edit distance), intent classification,
 * entity extraction (actors, directors, characters, franchises, genres, years, similarity),
 * and semantic plot concept detection.
 */

import {
  CHARACTER_ENTITIES,
  PERSON_ENTITIES,
  FRANCHISE_ENTITIES,
  GENRE_ALIASES,
  SEMANTIC_THEMES,
  AFRICAN_CINEMA_ENTITIES,
  CharacterEntity,
  PersonEntity,
  FranchiseEntity,
  GenreAlias,
  SemanticTheme,
} from './entity-index';

export type SearchIntentType =
  | 'TITLE'
  | 'PERSON'
  | 'CHARACTER'
  | 'GENRE'
  | 'YEAR'
  | 'PERSON_YEAR'
  | 'TITLE_YEAR'
  | 'DIRECTOR'
  | 'FRANCHISE'
  | 'SIMILARITY'
  | 'GENRE_PERSON'
  | 'DESCRIPTION'
  | 'AFRICAN_GEO'
  | 'UNKNOWN'
  | 'GENERAL';

export interface ParsedSearchQuery {
  rawQuery: string;
  normalizedQuery: string;
  correctedQuery: string;
  isCorrected: boolean;
  confidence: number;
  intent: SearchIntentType;
  primaryTarget?: string;
  year?: number;
  matchedPerson?: PersonEntity;
  matchedCharacter?: CharacterEntity;
  matchedFranchise?: FranchiseEntity;
  matchedGenre?: GenreAlias;
  matchedSemanticTheme?: SemanticTheme;
  similarityTarget?: string;
  isAfricanCinemaQuery: boolean;
  expandedKeywords: string[];
  explanation: string;
}

/**
 * Compute Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array<number>(an + 1));
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 0; i <= bn; ++i) matrix[i][0] = i;

  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Normalize query by trimming, lowercasing, and stripping punctuation
 */
export function normalizeQueryString(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s\d:-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * High-confidence instant typo correction dictionary
 */
const COMMON_TYPO_MAP: Record<string, string> = {
  batmn: 'batman',
  batm: 'batman',
  avatr: 'avatar',
  'avatr way of wter': 'avatar way of water',
  'avatar way of wter': 'avatar way of water',
  'avatr 2': 'avatar the way of water',
  spidrman: 'spider man',
  spiderman: 'spider man',
  spider_man: 'spider man',
  comdy: 'comedy',
  comedi: 'comedy',
  acton: 'action',
  horor: 'horror',
  scifi: 'science fiction',
  'sci-fi': 'science fiction',
  'sci fi': 'science fiction',
  romcom: 'romantic comedy',
  leondardo: 'leonardo dicaprio',
  dicaprio: 'leonardo dicaprio',
  leo: 'leonardo dicaprio',
  oppenheime: 'oppenheimer',
  interstelar: 'interstellar',
  titnic: 'titanic',
  avengrs: 'avengers',
  'john wick 4': 'john wick: chapter 4',
  'john wick 3': 'john wick: chapter 3',
  'spider man 2002': 'spider man',
  rdj: 'robert downey jr',
  sandler: 'adam sandler',
};

/**
 * Strict entity alias matcher preventing short-string false positives
 */
export function isAliasMatch(query: string, alias: string): boolean {
  if (!query || !alias) return false;
  const q = query.trim().toLowerCase();
  const a = alias.trim().toLowerCase();

  // 1. Exact match (allowed for all lengths including 'dc', 'it', 'up')
  if (q === a) return true;

  // 2. Exact whole-word boundary match in longer query strings (e.g. "movies with batman" -> "batman")
  // Only allow if alias is at least 3 characters long to avoid false matches on short abbreviations
  if (a.length >= 3) {
    const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordPattern = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
    if (wordPattern.test(q)) return true;
  }

  // 3. Typo/Levenshtein fuzzy matching:
  // Strictly prevent fuzzy matching on short words (< 4 chars)
  // Distance 1 for medium words (4-5 chars, e.g. "avatr" -> "avatar", "batmn" -> "batman")
  if (a.length >= 4 && a.length <= 5 && q.length >= 4) {
    return levenshteinDistance(q, a) <= 1;
  }
  // Distance 2 for longer words (6+ chars, e.g. "spidrman" -> "spider man", "oppenheime" -> "oppenheimer")
  if (a.length >= 6 && q.length >= 5) {
    return levenshteinDistance(q, a) <= 2;
  }

  return false;
}

/**
 * Parse, normalize, categorize and understand any movie search query
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const rawQuery = query.trim();
  const normalized = normalizeQueryString(rawQuery);

  if (!normalized) {
    return {
      rawQuery,
      normalizedQuery: '',
      correctedQuery: '',
      isCorrected: false,
      confidence: 1,
      intent: 'UNKNOWN',
      isAfricanCinemaQuery: false,
      expandedKeywords: [],
      explanation: 'Empty query',
    };
  }

  // 1. Extract 4-digit Year if present (e.g. 1999, 2002, 2024)
  const yearMatch = normalized.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
  const queryWithoutYear = year
    ? normalized.replace(yearMatch![0], '').replace(/\b(movies|films|movie|film|from|in)\b/g, '').replace(/\s+/g, ' ').trim()
    : normalized;

  // 2. Check for Similarity queries (e.g. "movies like inception", "shows like stranger things", "similar to interstellar")
  const similarityMatch = normalized.match(/(?:movies|films|shows|series)?\s*(?:like|similar to|in the style of)\s+(.+)/i);
  const similarityTarget = similarityMatch ? similarityMatch[1].trim() : undefined;

  // 3. Typo resolution
  let correctedQuery = normalized;
  let isCorrected = false;
  let confidence = 0.95;

  if (COMMON_TYPO_MAP[normalized]) {
    correctedQuery = COMMON_TYPO_MAP[normalized];
    isCorrected = true;
    confidence = 0.98;
  } else if (COMMON_TYPO_MAP[queryWithoutYear]) {
    correctedQuery = COMMON_TYPO_MAP[queryWithoutYear];
    isCorrected = true;
    confidence = 0.98;
  }

  // 4. African Cinema Entity Check
  const isAfrican = AFRICAN_CINEMA_ENTITIES.some(
    (entity) => isAliasMatch(normalized, entity) || isAliasMatch(correctedQuery, entity)
  );

  // 5. Franchise Entity Check
  let matchedFranchise: FranchiseEntity | undefined;
  for (const franchise of FRANCHISE_ENTITIES) {
    if (
      franchise.aliases.some(
        (alias) => isAliasMatch(normalized, alias) || isAliasMatch(correctedQuery, alias)
      )
    ) {
      matchedFranchise = franchise;
      break;
    }
  }

  // 6. Character Entity Check
  let matchedCharacter: CharacterEntity | undefined;
  for (const char of CHARACTER_ENTITIES) {
    if (
      char.aliases.some(
        (alias) => isAliasMatch(normalized, alias) || isAliasMatch(correctedQuery, alias)
      )
    ) {
      matchedCharacter = char;
      break;
    }
  }

  // 7. Person Entity Check (Actor / Director)
  let matchedPerson: PersonEntity | undefined;
  for (const person of PERSON_ENTITIES) {
    if (
      person.aliases.some(
        (alias) => isAliasMatch(normalized, alias) || isAliasMatch(correctedQuery, alias)
      )
    ) {
      matchedPerson = person;
      break;
    }
  }

  // 8. Genre Entity Check
  let matchedGenre: GenreAlias | undefined;
  for (const genre of GENRE_ALIASES) {
    if (
      genre.aliases.some(
        (alias) => isAliasMatch(normalized, alias) || isAliasMatch(correctedQuery, alias)
      )
    ) {
      matchedGenre = genre;
      break;
    }
  }

  // 9. Semantic / Plot Theme Check
  let matchedSemanticTheme: SemanticTheme | undefined;
  for (const theme of SEMANTIC_THEMES) {
    if (
      theme.keywords.some(
        (kw) =>
          normalized.includes(kw) ||
          correctedQuery.includes(kw) ||
          kw.split(' ').every((word) => normalized.includes(word))
      )
    ) {
      matchedSemanticTheme = theme;
      break;
    }
  }

  // 10. Intent Classification & Query Expansion Builder
  const expandedKeywords: string[] = [rawQuery, normalized];
  if (isCorrected && correctedQuery !== normalized) {
    expandedKeywords.push(correctedQuery);
  }

  let intent: SearchIntentType = 'TITLE';
  let primaryTarget = correctedQuery;
  let explanation = 'Title search query';

  if (similarityTarget) {
    intent = 'SIMILARITY';
    primaryTarget = similarityTarget;
    expandedKeywords.push(similarityTarget);
    explanation = `Similarity discovery: Movies like "${similarityTarget}"`;
  } else if (matchedSemanticTheme) {
    intent = 'DESCRIPTION';
    primaryTarget = matchedSemanticTheme.theme;
    expandedKeywords.push(...matchedSemanticTheme.recommendedTitles);
    explanation = `Semantic plot concept: ${matchedSemanticTheme.theme}`;
  } else if (matchedPerson && matchedGenre) {
    intent = 'GENRE_PERSON';
    primaryTarget = `${matchedGenre.canonical} starring ${matchedPerson.name}`;
    expandedKeywords.push(...matchedPerson.knownFor);
    expandedKeywords.push(matchedGenre.canonical);
    explanation = `Combination: ${matchedGenre.canonical} starring ${matchedPerson.name}`;
  } else if (matchedPerson && year) {
    intent = 'PERSON_YEAR';
    primaryTarget = `${matchedPerson.name} (${year})`;
    expandedKeywords.push(matchedPerson.name, String(year));
    expandedKeywords.push(...matchedPerson.knownFor);
    explanation = `Person + Year: ${matchedPerson.name} in ${year}`;
  } else if (matchedPerson) {
    intent = matchedPerson.role === 'director' ? 'DIRECTOR' : 'PERSON';
    primaryTarget = matchedPerson.name;
    expandedKeywords.push(...matchedPerson.knownFor);
    explanation = `${matchedPerson.role === 'director' ? 'Director' : 'Actor'} identified: ${matchedPerson.name}`;
  } else if (matchedCharacter) {
    intent = 'CHARACTER';
    primaryTarget = matchedCharacter.name;
    expandedKeywords.push(...matchedCharacter.movies);
    expandedKeywords.push(matchedCharacter.actor);
    if (matchedCharacter.franchise) expandedKeywords.push(matchedCharacter.franchise);
    explanation = `Character identified: ${matchedCharacter.name} (Actor: ${matchedCharacter.actor})`;
  } else if (matchedFranchise) {
    intent = 'FRANCHISE';
    primaryTarget = matchedFranchise.name;
    expandedKeywords.push(...matchedFranchise.topMovies);
    explanation = `Franchise identified: ${matchedFranchise.name}`;
  } else if (matchedGenre && year) {
    intent = 'GENRE';
    primaryTarget = `${year} ${matchedGenre.canonical}`;
    expandedKeywords.push(matchedGenre.canonical, String(year));
    explanation = `Genre + Year: ${matchedGenre.canonical} (${year})`;
  } else if (matchedGenre) {
    intent = 'GENRE';
    primaryTarget = matchedGenre.canonical;
    expandedKeywords.push(matchedGenre.canonical);
    explanation = `Genre identified: ${matchedGenre.canonical}`;
  } else if (year && !queryWithoutYear) {
    intent = 'YEAR';
    primaryTarget = String(year);
    expandedKeywords.push(String(year));
    explanation = `Release Year: ${year}`;
  } else if (year && queryWithoutYear.length > 1) {
    intent = 'TITLE_YEAR';
    primaryTarget = `${queryWithoutYear} (${year})`;
    expandedKeywords.push(queryWithoutYear, String(year));
    explanation = `Title + Release Year: ${queryWithoutYear} (${year})`;
  } else if (isAfrican) {
    intent = 'AFRICAN_GEO';
    primaryTarget = 'African Regional Cinema';
    explanation = 'African & Regional Cinema query';
  }

  // Deduplicate keywords
  const uniqueKeywords = Array.from(new Set(expandedKeywords.filter(Boolean)));

  return {
    rawQuery,
    normalizedQuery: normalized,
    correctedQuery: isCorrected ? correctedQuery : normalized,
    isCorrected,
    confidence,
    intent,
    primaryTarget,
    year,
    matchedPerson,
    matchedCharacter,
    matchedFranchise,
    matchedGenre,
    matchedSemanticTheme,
    similarityTarget,
    isAfricanCinemaQuery: isAfrican,
    expandedKeywords: uniqueKeywords,
    explanation,
  };
}
