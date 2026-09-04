import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BooksApi, BookAdaptation } from '@/services/books-api';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Search,
  Film,
  Sparkles,
  ExternalLink,
  Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Books() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredBooks, setFeaturedBooks] = useState<BookAdaptation[]>([]);
  const [searchResults, setSearchResults] = useState<BookAdaptation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      const res = await BooksApi.getFeaturedAdaptations();
      setFeaturedBooks(res);
      setLoading(false);
    };
    loadFeatured();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const res = await BooksApi.searchBookByTitle(searchQuery.trim());
    setSearchResults(res);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <SEOHead
        title="Books & Literary Source Material — Page to Screen"
        description="Discover the books, novels, and biographies that inspired cinema masterworks on OrangeFlix."
        url="https://orangeflixx.vercel.app/books"
      />

      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <Breadcrumbs items={[{ name: 'Books & Literary Adaptations', url: '/books' }]} />

        {/* Hero Header */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-gradient-to-br from-[#1b1c2b] via-[#10131e] to-[#251525] p-6 sm:p-10 shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Page to Screen Discovery Hub</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              From the <span className="text-amber-400">Pages</span> to Cinema
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Explore the novels, science-fiction epics, graphic novels, and biographies behind the greatest films and television series ever produced.
            </p>

            <form onSubmit={handleSearch} className="relative pt-3 flex max-w-lg items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search books, authors or adaptations (e.g. Dune, Harry Potter, Oppenheimer)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/50 border-white/10 text-xs text-white placeholder:text-slate-500 rounded-xl h-11"
                />
              </div>
              <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-black rounded-xl h-11 px-5 font-bold shadow-lg shadow-amber-500/25">
                Explore
              </Button>
            </form>

            {/* Quick Literary Genre Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">Popular:</span>
              {['Dune', 'Lord of the Rings', 'Frank Herbert', 'J.R.R. Tolkien', 'American Prometheus', 'The Godfather', 'Blade Runner'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    setLoading(true);
                    BooksApi.searchBookByTitle(tag).then((res) => {
                      setSearchResults(res);
                      setLoading(false);
                    });
                  }}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] hover:border-amber-500/40 text-slate-300 hover:text-white transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Search Results if active */}
        {searchQuery.trim() && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[.08] pb-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Results for &quot;{searchQuery}&quot;
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear Search
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {searchResults.map((book) => (
                <Card
                  key={book.id}
                  className="bg-gray-900/60 border-white/[.08] p-4 flex gap-4 overflow-hidden rounded-2xl hover:border-amber-500/40 transition-all shadow-lg"
                >
                  <div className="w-20 h-28 bg-gray-950 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md">
                    <img src={book.coverUrl} alt={book.bookTitle} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{book.bookTitle}</h4>
                      <p className="text-xs text-amber-400 mt-0.5">{book.author}</p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{book.synopsis}</p>
                    </div>
                    {book.openLibraryKey && (
                      <a
                        href={`https://openlibrary.org${book.openLibraryKey}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-amber-400 inline-flex items-center gap-1 mt-2"
                      >
                        Open Library details <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Featured Literary Adaptations */}
        <div className="space-y-6">
          <div className="border-b border-white/[.08] pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Essential Literary Adaptations & Masterworks
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Classic and modern source works translated to screen</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {featuredBooks.map((book) => (
              <Card
                key={book.id}
                className="bg-gray-900/50 border-white/[.08] hover:border-amber-500/40 transition-all overflow-hidden flex flex-col justify-between p-5 group rounded-2xl shadow-lg"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-36 bg-gray-950 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg group-hover:shadow-amber-500/10 transition-all">
                    <img
                      src={book.coverUrl}
                      alt={book.bookTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
                      Published {book.firstPublishYear}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                      {book.bookTitle}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">By {book.author}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                      {book.synopsis}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/[.07] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span className="line-clamp-1">{book.adaptedMovieTitle}</span>
                  </div>

                  <Button asChild size="sm" variant="outline" className="text-xs h-8 border-white/10 hover:border-amber-500/40 text-amber-400 rounded-lg">
                    <Link to={`/movies`}>Explore Film</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

