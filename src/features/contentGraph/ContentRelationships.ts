/**
 * OrangeFlix Content Graph - Entity Relationship Resolver
 * Interconnects Movies and TV Shows with Soundtracks, News, Source Material, and Talent.
 */

import { MusicApi, SoundtrackItem } from '@/services/music-api';
import { NewsApi, NewsArticle, EntityNewsContext } from '@/services/news-api';
import { BooksApi, BookAdaptation } from '@/services/books-api';

export interface ContentEntityRelations {
  soundtrack: SoundtrackItem | null;
  news: NewsArticle[];
  sourceBook: BookAdaptation | null;
}

export type MediaRelationshipInput = 
  | string 
  | {
      title: string;
      tmdbId?: number;
      mediaType?: 'movie' | 'tv' | string;
      genres?: string[];
      overview?: string;
      backdropUrl?: string;
      posterUrl?: string;
      releaseYear?: number | string;
      cast?: Array<{ name: string; character?: string }>;
    };

export const ContentRelationships = {
  async resolveForMovie(
    input: MediaRelationshipInput,
    optionalTmdbId?: number,
    optionalGenres: string[] = []
  ): Promise<ContentEntityRelations> {
    const ctx: EntityNewsContext =
      typeof input === 'string'
        ? {
            title: input,
            tmdbId: optionalTmdbId,
            genres: optionalGenres,
          }
        : {
            title: input.title,
            tmdbId: input.tmdbId ?? optionalTmdbId,
            mediaType: input.mediaType,
            genres: input.genres ?? optionalGenres,
            overview: input.overview,
            backdropUrl: input.backdropUrl,
            posterUrl: input.posterUrl,
            releaseYear: input.releaseYear,
            cast: input.cast,
          };

    const [soundtrack, newsArticles, sourceBook] = await Promise.all([
      // 1. Resolve Soundtrack from Apple iTunes Search
      MusicApi.getMovieSoundtrack(ctx.title).catch(() => null),

      // 2. Resolve or dynamically generate high-value cinema news & editorial for this title
      NewsApi.getNewsForEntity(ctx).catch(() => []),

      // 3. Resolve Book Source Material from Open Library
      BooksApi.getBookForMovie(ctx.title).catch(() => null),
    ]);

    return {
      soundtrack,
      news: newsArticles,
      sourceBook,
    };
  },
};
