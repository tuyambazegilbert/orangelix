/**
 * OrangeFlix Book & Source Material Adapter
 * Powered by Open Library API (100% Free, Open Source, CORS-compliant, No API Key required)
 */

export interface BookAdaptation {
  id: string;
  bookTitle: string;
  author: string;
  firstPublishYear?: number;
  publishYear?: number;
  coverUrl: string;
  bookCoverUrl?: string;
  adaptedMovieTitle: string;
  adaptedMovieId: string;
  synopsis: string;
  notes?: string;
  openLibraryKey?: string;
  infoUrl?: string;
  pageCount?: number;
  publisher?: string;
  isbn?: string;
}

const FAMOUS_ADAPTATIONS: BookAdaptation[] = [
  {
    id: 'book-dune',
    bookTitle: 'Dune',
    author: 'Frank Herbert',
    firstPublishYear: 1965,
    publishYear: 1965,
    coverUrl: 'https://covers.openlibrary.org/b/id/11153218-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/11153218-L.jpg',
    adaptedMovieTitle: 'Dune',
    adaptedMovieId: 'movie-438631',
    synopsis: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the spice melange.',
    notes: 'Frank Herbert’s 1965 Hugo & Nebula-winning masterpiece served as the definitive foundation for Denis Villeneuve’s two-part cinematic adaptation.',
    infoUrl: 'https://openlibrary.org/works/OL893415W/Dune',
    pageCount: 688,
    publisher: 'Chilton Books',
  },
  {
    id: 'book-witcher',
    bookTitle: 'The Last Wish',
    author: 'Andrzej Sapkowski',
    firstPublishYear: 1993,
    publishYear: 1993,
    coverUrl: 'https://covers.openlibrary.org/b/id/10521258-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/10521258-L.jpg',
    adaptedMovieTitle: 'The Witcher',
    adaptedMovieId: 'tv-71912',
    synopsis: 'Geralt of Rivia is a witcher, a man whose magic powers make him a brilliant fighter and a merciless assassin. Yet his targets are the vile monsters that ravage the Continent.',
    notes: 'The foundational collection of short stories that introduced Geralt of Rivia, Yennefer, and Ciri, inspiring the television series and video game universe.',
    infoUrl: 'https://openlibrary.org/works/OL15039327W/The_Last_Wish',
    pageCount: 384,
    publisher: 'SuperNOWA / Gollancz',
  },
  {
    id: 'book-lotr',
    bookTitle: 'The Fellowship of the Ring',
    author: 'J.R.R. Tolkien',
    firstPublishYear: 1954,
    publishYear: 1954,
    coverUrl: 'https://covers.openlibrary.org/b/id/8591873-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/8591873-L.jpg',
    adaptedMovieTitle: 'The Lord of the Rings: The Fellowship of the Ring',
    adaptedMovieId: 'movie-120',
    synopsis: 'In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron, The Dark Lord, forged the One Ring. An epic struggle for the fate of Middle-earth begins.',
    notes: 'Tolkien’s monumental fantasy epic that defined modern world-building, adapted into Peter Jackson’s Academy Award-winning film trilogy.',
    infoUrl: 'https://openlibrary.org/works/OL27479W/The_Fellowship_of_the_Ring',
    pageCount: 432,
    publisher: 'George Allen & Unwin',
  },
  {
    id: 'book-bladerunner',
    bookTitle: 'Do Androids Dream of Electric Sheep?',
    author: 'Philip K. Dick',
    firstPublishYear: 1968,
    publishYear: 1968,
    coverUrl: 'https://covers.openlibrary.org/b/id/10574932-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/10574932-L.jpg',
    adaptedMovieTitle: 'Blade Runner',
    adaptedMovieId: 'movie-78',
    synopsis: 'By 2021, the World War has killed millions, driving entire species into extinction. Rick Deckard is a licensed bounty hunter tasked with retiring rogue Nexus-6 androids.',
    notes: 'Philip K. Dick’s seminal dystopian inquiry into artificial consciousness, empathy, and humanity that inspired Ridley Scott’s Blade Runner and Blade Runner 2049.',
    infoUrl: 'https://openlibrary.org/works/OL2172465W/Do_Androids_Dream_of_Electric_Sheep',
    pageCount: 224,
    publisher: 'Doubleday',
  },
  {
    id: 'book-oppenheimer',
    bookTitle: 'American Prometheus: The Triumph and Tragedy of J. Robert Oppenheimer',
    author: 'Kai Bird & Martin J. Sherwin',
    firstPublishYear: 2005,
    publishYear: 2005,
    coverUrl: 'https://covers.openlibrary.org/b/id/13812739-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/13812739-L.jpg',
    adaptedMovieTitle: 'Oppenheimer',
    adaptedMovieId: 'movie-872585',
    synopsis: 'The definitive Pulitzer Prize-winning biography of J. Robert Oppenheimer, the physicist who led the Manhattan Project to develop the atomic weapon that transformed world history.',
    notes: 'Researched over 25 years, this Pulitzer Prize-winning biography served as the direct source material for Christopher Nolan’s screenplay.',
    infoUrl: 'https://openlibrary.org/works/OL2717088W/American_Prometheus',
    pageCount: 784,
    publisher: 'Alfred A. Knopf',
  },
  {
    id: 'book-got',
    bookTitle: 'A Game of Thrones',
    author: 'George R.R. Martin',
    firstPublishYear: 1996,
    publishYear: 1996,
    coverUrl: 'https://covers.openlibrary.org/b/id/9255566-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/9255566-L.jpg',
    adaptedMovieTitle: 'Game of Thrones',
    adaptedMovieId: 'tv-1399',
    synopsis: 'Summers span decades. Winter can last a lifetime. And the struggle for the Iron Throne begins across the noble dynasties of Westeros.',
    notes: 'The inaugural volume in A Song of Ice and Fire, laying the intricate geopolitical and character foundations for HBO’s flagship television adaptation.',
    infoUrl: 'https://openlibrary.org/works/OL262758W/A_Game_of_Thrones',
    pageCount: 694,
    publisher: 'Bantam Spectra',
  },
  {
    id: 'book-godfather',
    bookTitle: 'The Godfather',
    author: 'Mario Puzo',
    firstPublishYear: 1969,
    publishYear: 1969,
    coverUrl: 'https://covers.openlibrary.org/b/id/8231856-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/8231856-L.jpg',
    adaptedMovieTitle: 'The Godfather',
    adaptedMovieId: 'movie-238',
    synopsis: 'The story of Don Vito Corleone, head of a powerful New York mafia family, and the succession of his youngest son, Michael, into leadership.',
    notes: 'Mario Puzo’s landmark crime novel that reshaped American pop culture, adapted into Francis Ford Coppola’s iconic Academy Award-winning cinema trilogy.',
    infoUrl: 'https://openlibrary.org/works/OL14933414W/The_Godfather',
    pageCount: 448,
    publisher: 'G. P. Putnam’s Sons',
  },
  {
    id: 'book-jurassic',
    bookTitle: 'Jurassic Park',
    author: 'Michael Crichton',
    firstPublishYear: 1990,
    publishYear: 1990,
    coverUrl: 'https://covers.openlibrary.org/b/id/8775432-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/8775432-L.jpg',
    adaptedMovieTitle: 'Jurassic Park',
    adaptedMovieId: 'movie-329',
    synopsis: 'An astonishing technique for recovering and cloning dinosaur DNA has been discovered. On a remote Costa Rican island, living prehistoric creatures roam a secret safari theme park.',
    notes: 'Michael Crichton’s high-concept techno-thriller that pioneered biotech cautionary fiction, brought to the screen by Steven Spielberg.',
    infoUrl: 'https://openlibrary.org/works/OL483391W/Jurassic_Park',
    pageCount: 400,
    publisher: 'Alfred A. Knopf',
  },
  {
    id: 'book-fightclub',
    bookTitle: 'Fight Club',
    author: 'Chuck Palahniuk',
    firstPublishYear: 1996,
    publishYear: 1996,
    coverUrl: 'https://covers.openlibrary.org/b/id/8226191-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/8226191-L.jpg',
    adaptedMovieTitle: 'Fight Club',
    adaptedMovieId: 'movie-550',
    synopsis: 'An insomniac office worker looking for a way to change his life crosses paths with a devil-may-care soap maker and forms an underground fight club.',
    notes: 'Chuck Palahniuk’s biting critique of late-stage consumerism and modern masculinity, adapted by David Fincher into a generational cult classic.',
    infoUrl: 'https://openlibrary.org/works/OL39347W/Fight_Club',
    pageCount: 208,
    publisher: 'W. W. Norton & Company',
  },
  {
    id: 'book-shining',
    bookTitle: 'The Shining',
    author: 'Stephen King',
    firstPublishYear: 1977,
    publishYear: 1977,
    coverUrl: 'https://covers.openlibrary.org/b/id/8315106-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/8315106-L.jpg',
    adaptedMovieTitle: 'The Shining',
    adaptedMovieId: 'movie-694',
    synopsis: 'Jack Torrance accepts a winter caretaker position at the isolated Overlook Hotel in the Colorado mountains, where sinister supernatural forces begin to unravel his sanity.',
    notes: 'Stephen King’s quintessential psychological horror novel, interpreted with chilling visual symmetry by Stanley Kubrick.',
    infoUrl: 'https://openlibrary.org/works/OL27479W/The_Shining',
    pageCount: 447,
    publisher: 'Doubleday',
  },
  {
    id: 'book-martian',
    bookTitle: 'The Martian',
    author: 'Andy Weir',
    firstPublishYear: 2011,
    publishYear: 2011,
    coverUrl: 'https://covers.openlibrary.org/b/id/11181816-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/11181816-L.jpg',
    adaptedMovieTitle: 'The Martian',
    adaptedMovieId: 'movie-286217',
    synopsis: 'Stranded alone on Mars after a dust storm forces his crew to evacuate, astronaut Mark Watney must rely on ingenuity, botanical science, and sheer willpower to survive.',
    notes: 'Andy Weir’s breakout hard science-fiction novel celebrated for its meticulous scientific realism, adapted by Ridley Scott and starring Matt Damon.',
    infoUrl: 'https://openlibrary.org/works/OL17352669W/The_Martian',
    pageCount: 369,
    publisher: 'Crown Publishing',
  },
  {
    id: 'book-queensgambit',
    bookTitle: 'The Queen’s Gambit',
    author: 'Walter Tevis',
    firstPublishYear: 1983,
    publishYear: 1983,
    coverUrl: 'https://covers.openlibrary.org/b/id/10523450-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/10523450-L.jpg',
    adaptedMovieTitle: 'The Queen’s Gambit',
    adaptedMovieId: 'tv-87739',
    synopsis: 'Orphaned at the tender age of eight, quiet and practical Beth Harmon discovers the game of chess and rapidly ascends the ranks of the international Grandmaster circuit.',
    notes: 'Walter Tevis’s coming-of-age novel exploring chess prodigy dynamics and addiction, which became a global cultural phenomenon in Netflix’s limited series.',
    infoUrl: 'https://openlibrary.org/works/OL3143301W/The_Queen%27s_Gambit',
    pageCount: 243,
    publisher: 'Random House',
  },
  {
    id: 'book-arrival',
    bookTitle: 'Stories of Your Life and Others',
    author: 'Ted Chiang',
    firstPublishYear: 2002,
    publishYear: 2002,
    coverUrl: 'https://covers.openlibrary.org/b/id/8314562-L.jpg',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/8314562-L.jpg',
    adaptedMovieTitle: 'Arrival',
    adaptedMovieId: 'movie-329865',
    synopsis: 'Linguist Dr. Louise Banks is enlisted by the military to decode the non-linear heptapod language when mysterious extraterrestrial spacecraft arrive on Earth.',
    notes: 'Ted Chiang’s Nebula Award-winning novella "Story of Your Life" provided the cerebral foundation for Denis Villeneuve’s masterpiece Arrival.',
    infoUrl: 'https://openlibrary.org/works/OL274719W/Stories_of_Your_Life_and_Others',
    pageCount: 281,
    publisher: 'Tor Books',
  },
];

export const BooksApi = {
  async getFeaturedAdaptations(): Promise<BookAdaptation[]> {
    return FAMOUS_ADAPTATIONS;
  },

  async searchGoogleBooks(title: string): Promise<BookAdaptation | null> {
    try {
      const cleanTitle = title.replace(/[:\-–]/g, ' ').replace(/\s+/g, ' ').trim();
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(cleanTitle)}&maxResults=5&printType=books`
      );
      if (!res.ok) return null;
      const data = await res.json() as {
        items?: Array<{
          id: string;
          volumeInfo?: {
            title?: string;
            authors?: string[];
            publishedDate?: string;
            description?: string;
            imageLinks?: { thumbnail?: string; smallThumbnail?: string };
            infoLink?: string;
            pageCount?: number;
            publisher?: string;
          };
        }>;
      };

      if (!data.items || data.items.length === 0) return null;

      const target = cleanTitle.toLowerCase();
      const match = data.items.find((item) => {
        const t = (item.volumeInfo?.title || '').toLowerCase();
        return t === target || t.includes(target) || target.includes(t);
      }) || data.items[0];

      const info = match.volumeInfo;
      if (!info || !info.title) return null;

      const author = info.authors && info.authors.length > 0 ? info.authors.join(', ') : 'Author';
      const rawCover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
      const coverUrl = rawCover
        ? rawCover.replace(/^http:\/\//i, 'https://').replace('&edge=curl', '')
        : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

      const year = info.publishedDate ? parseInt(info.publishedDate.substring(0, 4), 10) : undefined;

      return {
        id: `gbook-${match.id}`,
        bookTitle: info.title,
        author,
        firstPublishYear: year,
        publishYear: year,
        coverUrl,
        bookCoverUrl: coverUrl,
        adaptedMovieTitle: title,
        adaptedMovieId: `movie-${title.toLowerCase().replace(/\s+/g, '-')}`,
        synopsis: info.description || `Original published work by ${author}. Explore the pages that inspired this cinema story.`,
        notes: `Published by ${info.publisher || 'Acclaimed Press'}${year ? ` in ${year}` : ''}. Discovered via Google Books.`,
        infoUrl: info.infoLink || `https://books.google.com/books?q=${encodeURIComponent(info.title)}`,
        pageCount: info.pageCount,
        publisher: info.publisher,
      };
    } catch {
      return null;
    }
  },

  async searchBookByTitle(title: string): Promise<BookAdaptation[]> {
    const cleanTitle = title.replace(/[:\-–]/g, ' ').trim();
    try {
      const localMatches = FAMOUS_ADAPTATIONS.filter(
        (a) =>
          a.bookTitle.toLowerCase().includes(cleanTitle.toLowerCase()) ||
          a.adaptedMovieTitle.toLowerCase().includes(cleanTitle.toLowerCase())
      );

      const gBook = await this.searchGoogleBooks(title);

      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(cleanTitle)}&limit=6`
      );

      let olResults: BookAdaptation[] = [];
      if (response.ok) {
        const data = await response.json();
        const docs = (data.docs || []) as Array<Record<string, unknown>>;
        olResults = docs.map((doc, idx) => {
          const coverId = doc.cover_i;
          const coverUrl = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
            : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

          const authors = Array.isArray(doc.author_name)
            ? doc.author_name.join(', ')
            : 'Various Authors';

          const year = doc.first_publish_year ? Number(doc.first_publish_year) : undefined;

          return {
            id: `ol-${doc.key || idx}`,
            bookTitle: String(doc.title || cleanTitle),
            author: authors,
            firstPublishYear: year,
            publishYear: year,
            coverUrl,
            bookCoverUrl: coverUrl,
            adaptedMovieTitle: title,
            adaptedMovieId: `movie-${title.toLowerCase().replace(/\s+/g, '-')}`,
            synopsis: `Original literary work by ${authors}, published in ${year || 'classic era'}. Discover the pages that inspired cinema storytelling.`,
            notes: `First published in ${year || 'the literary canon'}. Open Library archive record: ${doc.key || ''}`,
            openLibraryKey: String(doc.key || ''),
            infoUrl: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
          };
        });
      }

      const combined: BookAdaptation[] = [...localMatches];
      if (gBook && !combined.some((b) => b.bookTitle.toLowerCase() === gBook.bookTitle.toLowerCase())) {
        combined.push(gBook);
      }
      olResults.forEach((b) => {
        if (!combined.some((c) => c.bookTitle.toLowerCase() === b.bookTitle.toLowerCase())) {
          combined.push(b);
        }
      });

      return combined;
    } catch (err) {
      console.warn('[BooksApi] Fetch failed:', err);
      return [];
    }
  },

  async getBookForMovie(movieTitle: string): Promise<BookAdaptation | null> {
    if (!movieTitle) return null;

    const clean = movieTitle.toLowerCase().trim();
    const known = FAMOUS_ADAPTATIONS.find(
      (a) =>
        a.adaptedMovieTitle.toLowerCase() === clean ||
        a.bookTitle.toLowerCase() === clean ||
        a.adaptedMovieTitle.toLowerCase().includes(clean) ||
        clean.includes(a.adaptedMovieTitle.toLowerCase()) ||
        clean.includes(a.bookTitle.toLowerCase()) ||
        a.bookTitle.toLowerCase().includes(clean)
    );
    if (known) return known;

    const googleBook = await this.searchGoogleBooks(movieTitle);
    if (googleBook) return googleBook;

    try {
      const results = await this.searchBookByTitle(movieTitle);
      return results.length > 0 ? results[0] : null;
    } catch {
      return null;
    }
  },
};

