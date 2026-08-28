import { useEffect } from 'react';

export interface StructuredDataProps {
  data: Record<string, unknown>;
  id?: string;
}

export default function StructuredData({ data, id = 'structured-data-jsonld' }: StructuredDataProps) {
  useEffect(() => {
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);

    return () => {
      const existing = document.getElementById(id);
      if (existing) {
        existing.remove();
      }
    };
  }, [data, id]);

  return null;
}

export const SchemaGenerators = {
  movie(movie: {
    title: string;
    description?: string;
    imageUrl?: string;
    releaseYear?: number;
    rating?: number;
    genres?: string[];
    director?: string;
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: movie.title,
      description: movie.description || `${movie.title} on OrangeFlix`,
      image: movie.imageUrl,
      dateCreated: movie.releaseYear ? `${movie.releaseYear}-01-01` : undefined,
      genre: movie.genres || ['Action'],
      ...(movie.director && {
        director: {
          '@type': 'Person',
          name: movie.director,
        },
      }),
      ...(movie.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: movie.rating,
          bestRating: 10,
          worstRating: 1,
          ratingCount: 150,
        },
      }),
    };
  },

  tvSeries(show: {
    title: string;
    description?: string;
    imageUrl?: string;
    releaseYear?: number;
    rating?: number;
    genres?: string[];
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'TVSeries',
      name: show.title,
      description: show.description || `${show.title} on OrangeFlix`,
      image: show.imageUrl,
      dateCreated: show.releaseYear ? `${show.releaseYear}-01-01` : undefined,
      genre: show.genres || ['Drama'],
      ...(show.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: show.rating,
          bestRating: 10,
          worstRating: 1,
          ratingCount: 200,
        },
      }),
    };
  },

  person(person: {
    name: string;
    biography?: string;
    profileUrl?: string;
    knownFor?: string;
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: person.name,
      description: person.biography,
      image: person.profileUrl,
      jobTitle: person.knownFor || 'Actor / Filmmaker',
    };
  },

  article(article: {
    title: string;
    summary: string;
    imageUrl: string;
    publishedAt: string;
    author: string;
    url?: string;
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.summary,
      image: [article.imageUrl],
      datePublished: article.publishedAt,
      author: {
        '@type': 'Person',
        name: article.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'OrangeFlix Cinema Wire',
        logo: {
          '@type': 'ImageObject',
          url: 'https://orangeflixx.vercel.app/android-chrome-192x192.png',
        },
      },
    };
  },

  breadcrumbs(items: Array<{ name: string; url: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `https://orangeflixx.vercel.app${item.url.startsWith('/') ? item.url : `/${item.url}`}`,
      })),
    };
  },
};

