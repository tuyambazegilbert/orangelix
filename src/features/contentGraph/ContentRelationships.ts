/**
 * OrangeFlix Content Graph - Entity Relationship Resolver
 * Interconnects Movies and TV Shows with Soundtracks, News, Source Material, and Talent.
 */

import { MusicApi, SoundtrackItem } from '@/services/music-api';
import { NewsApi, NewsArticle, EntityNewsContext } from '@/services/news-api';
import { BooksApi, BookAdaptation } from '@/services/books-api';
import { MediaCrew } from '@/types/media';

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
      crew?: MediaCrew[];
      director?: string;
      composer?: string;
      voteAverage?: number;
      voteCount?: number;
    };

export const ContentRelationships = {
  async resolveForMovie(
    input: MediaRelationshipInput,
    optionalTmdbId?: number,
    optionalGenres: string[] = []
  ): Promise<ContentEntityRelations> {
    let resolvedDirector: string | undefined;
    let resolvedComposer: string | undefined;

    if (typeof input !== 'string') {
      resolvedDirector = input.director || input.crew?.find((c) => c.job === 'Director' || c.job === 'Creator')?.name;
      resolvedComposer = input.composer || input.crew?.find((c) => c.job === 'Original Music Composer' || c.job === 'Music')?.name;
    }

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
            director: resolvedDirector,
            composer: resolvedComposer,
            voteAverage: input.voteAverage,
            voteCount: input.voteCount,
          };

    const [soundtrack, newsArticles, sourceBook] = await Promise.all([
      // 1. Resolve authentic Soundtrack from Apple iTunes Search targeted by title and composer
      MusicApi.getMovieSoundtrack(ctx.title, ctx.composer, ctx.posterUrl).catch(() => null),

      // 2. Resolve verified Wikipedia production archives, TMDB critic reviews, and factual cinema editorial
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
