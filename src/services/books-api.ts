/**
 * OrangeFlix Book & Source Material Adapter
 * Powered by Open Library API (100% Free, Open Source, CORS-compliant, No API Key required)
 */

export interface BookAdaptation {
  id: string;
  bookTitle: string;
  author: string;
  firstPublishYear?: number;
  coverUrl: string;
  adaptedMovieTitle: string;
  adaptedMovieId: string;
  synopsis: string;
  openLibraryKey?: string;
}

const FAMOUS_ADAPTATIONS: BookAdaptation[] = [
  {
    id: 'book-dune',
    bookTitle: 'Dune',
    author: 'Frank Herbert',
    firstPublishYear: 1965,
    coverUrl: 'https://covers.openlibrary.org/b/id/11153218-L.jpg',
    adaptedMovieTitle: 'Dune: Part One & Two',
    adaptedMovieId: 'movie-438631',
    synopsis: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the spice melange.',
  },
  {
    id: 'book-witcher',
    bookTitle: 'The Last Wish',
    author: 'Andrzej Sapkowski',
    firstPublishYear: 1993,
    coverUrl: 'https://covers.openlibrary.org/b/id/10521258-L.jpg',
    adaptedMovieTitle: 'The Witcher',
    adaptedMovieId: 'tv-71912',
    synopsis: 'Geralt of Rivia is a witcher, a man whose magic powers make him a brilliant fighter and a merciless assassin. Yet he is not an ordinary murderer: his targets are the vile monsters that ravage the land.',
  },
  {
    id: 'book-lotr',
    bookTitle: 'The Fellowship of the Ring',
    author: 'J.R.R. Tolkien',
    firstPublishYear: 1954,
    coverUrl: 'https://covers.openlibrary.org/b/id/8591873-L.jpg',
    adaptedMovieTitle: 'The Lord of the Rings',
    adaptedMovieId: 'movie-120',
    synopsis: 'In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron, The Dark Lord, forged the One Ring. An epic struggle for the fate of Middle-earth begins.',
  },
  {
    id: 'book-bladerunner',
    bookTitle: 'Do Androids Dream of Electric Sheep?',
    author: 'Philip K. Dick',
    firstPublishYear: 1968,
    coverUrl: 'https://covers.openlibrary.org/b/id/10574932-L.jpg',
    adaptedMovieTitle: 'Blade Runner 2049',
    adaptedMovieId: 'movie-335984',
    synopsis: 'By 2021, the World War has killed millions, driving entire species into extinction and sending humanity off-planet. Rick Deckard is a licensed bounty hunter tasked with retiring rogue androids.',
  },
  {
    id: 'book-oppenheimer',
    bookTitle: 'American Prometheus: The Triumph and Tragedy of J. Robert Oppenheimer',
    author: 'Kai Bird & Martin J. Sherwin',
    firstPublishYear: 2005,
    coverUrl: 'https://covers.openlibrary.org/b/id/13812739-L.jpg',
    adaptedMovieTitle: 'Oppenheimer',
    adaptedMovieId: 'movie-872585',
    synopsis: 'The definitive biography of J. Robert Oppenheimer, the physicist who led the Manhattan Project to develop the atomic weapon that ended World War II.',
  },
];

export const BooksApi = {
  async getFeaturedAdaptations(): Promise<BookAdaptation[]> {
    return FAMOUS_ADAPTATIONS;
  },

  async searchBookByTitle(title: string): Promise<BookAdaptation[]> {
    const cleanTitle = title.replace(/[:\-–]/g, ' ').trim();
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(cleanTitle)}&limit=6`
      );

      if (!response.ok) return [];

      const data = await response.json();
      const docs = (data.docs || []) as Array<Record<string, unknown>>;

      return docs.map((doc, idx) => {
        const coverId = doc.cover_i;
        const coverUrl = coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
          : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

        const authors = Array.isArray(doc.author_name)
          ? doc.author_name.join(', ')
          : 'Various Authors';

        return {
          id: `ol-${doc.key || idx}`,
          bookTitle: String(doc.title || cleanTitle),
          author: authors,
          firstPublishYear: doc.first_publish_year ? Number(doc.first_publish_year) : undefined,
          coverUrl,
          adaptedMovieTitle: title,
          adaptedMovieId: `movie-${title.toLowerCase().replace(/\s+/g, '-')}`,
          synopsis: `Original literary work by ${authors}, published in ${doc.first_publish_year || 'classic era'}. Discover the pages that inspired cinema storytelling.`,
          openLibraryKey: String(doc.key || ''),
        };
      });
    } catch (err) {
      console.warn('[BooksApi] Fetch failed, returning empty:', err);
      return [];
    }
  },
};

