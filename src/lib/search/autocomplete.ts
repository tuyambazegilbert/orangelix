/**
 * OrangeFlix Search-As-You-Type Autocomplete & Categorized Instant Suggestions Engine
 * Sub-millisecond categorized entity completion for prefix typing.
 */

import {
  CHARACTER_ENTITIES,
  PERSON_ENTITIES,
  FRANCHISE_ENTITIES,
  GENRE_ALIASES,
  SEMANTIC_THEMES,
  AFRICAN_CINEMA_ENTITIES,
} from './entity-index';
import { parseSearchQuery, normalizeQueryString, levenshteinDistance } from './query-parser';

export interface AutocompleteSuggestion {
  id: string;
  category: 'movie' | 'person' | 'character' | 'franchise' | 'genre' | 'african' | 'theme';
  title: string;
  subtitle?: string;
  query: string;
  badge?: string;
}

export interface AutocompleteResult {
  query: string;
  didYouMean?: string;
  suggestions: AutocompleteSuggestion[];
}

export function getInstantAutocomplete(query: string, maxResults = 8): AutocompleteResult {
  const normalized = normalizeQueryString(query);
  if (!normalized || normalized.length < 1) {
    return { query, suggestions: [] };
  }

  const analysis = parseSearchQuery(query);
  const suggestions: AutocompleteSuggestion[] = [];

  // 1. Check Character entities
  for (const char of CHARACTER_ENTITIES) {
    if (
      char.aliases.some((alias) => alias.startsWith(normalized) || alias.includes(normalized)) ||
      levenshteinDistance(normalized, char.name.toLowerCase()) <= 2
    ) {
      suggestions.push({
        id: `char-${char.name}`,
        category: 'character',
        title: char.name,
        subtitle: `Played by ${char.actor} • Top: ${char.movies[0]}`,
        query: char.name,
        badge: 'Character',
      });
    }
  }

  // 2. Check People (Actors & Directors)
  for (const person of PERSON_ENTITIES) {
    if (
      person.aliases.some((alias) => alias.startsWith(normalized) || alias.includes(normalized)) ||
      levenshteinDistance(normalized, person.name.toLowerCase()) <= 2
    ) {
      suggestions.push({
        id: `person-${person.name}`,
        category: 'person',
        title: person.name,
        subtitle: `${person.role === 'director' ? 'Director' : 'Actor'} • Known for ${person.knownFor.slice(0, 2).join(', ')}`,
        query: person.name,
        badge: person.role === 'director' ? 'Director' : 'Actor',
      });
    }
  }

  // 3. Check Franchises
  for (const franchise of FRANCHISE_ENTITIES) {
    if (
      franchise.aliases.some((alias) => alias.startsWith(normalized) || alias.includes(normalized))
    ) {
      suggestions.push({
        id: `franchise-${franchise.name}`,
        category: 'franchise',
        title: franchise.name,
        subtitle: `Franchise • ${franchise.topMovies.slice(0, 2).join(', ')}`,
        query: franchise.name,
        badge: 'Franchise',
      });
    }
  }

  // 4. Check African Cinema Entities
  for (const african of AFRICAN_CINEMA_ENTITIES) {
    if (african.startsWith(normalized) || african.includes(normalized)) {
      suggestions.push({
        id: `african-${african}`,
        category: 'african',
        title: african.charAt(0).toUpperCase() + african.slice(1),
        subtitle: 'African & Regional Cinema Stream',
        query: african,
        badge: 'African Cinema',
      });
    }
  }

  // 5. Check Genres
  for (const genre of GENRE_ALIASES) {
    if (
      genre.aliases.some((alias) => alias.startsWith(normalized) || alias.includes(normalized))
    ) {
      suggestions.push({
        id: `genre-${genre.canonical}`,
        category: 'genre',
        title: genre.canonical,
        subtitle: 'Browse all films & series in this genre',
        query: genre.canonical,
        badge: 'Genre',
      });
    }
  }

  // 6. Check Semantic Plot Themes
  for (const theme of SEMANTIC_THEMES) {
    if (
      theme.keywords.some((kw) => kw.includes(normalized) || normalized.includes(kw))
    ) {
      suggestions.push({
        id: `theme-${theme.theme}`,
        category: 'theme',
        title: theme.theme,
        subtitle: `Recommended: ${theme.recommendedTitles.slice(0, 2).join(', ')}`,
        query: theme.recommendedTitles[0] || theme.theme,
        badge: 'Plot Theme',
      });
    }
  }

  // Limit suggestions
  const sliced = suggestions.slice(0, maxResults);

  return {
    query,
    didYouMean: analysis.isCorrected ? analysis.correctedQuery : undefined,
    suggestions: sliced,
  };
}

