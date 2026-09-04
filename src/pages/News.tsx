import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { NewsApi, NewsArticle } from '@/services/news-api';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Clock, Newspaper, ArrowRight, Sparkles } from 'lucide-react';
import { NewsSkeleton } from '@/components/ui/Skeletons';

export default function News() {
  const { category: urlCategory } = useParams<{ category?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = NewsApi.getCategories();

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      if (searchQuery.trim()) {
        const res = await NewsApi.searchArticles(searchQuery);
        setArticles(res);
      } else {
        const res = await NewsApi.getArticles(selectedCategory);
        setArticles(res);
      }
      setLoading(false);
    };

    loadArticles();
  }, [selectedCategory, searchQuery]);

  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <SEOHead
        title="Entertainment News, Trailers & Industry Insights"
        description="Latest cinema news, streaming updates, movie trailers, Oscars race, and directorial insights on OrangeFlix."
        url="https://orangeflixx.vercel.app/news"
      />

      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <Breadcrumbs items={[{ name: 'Entertainment News & Editorial', url: '/news' }]} />

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-white/[.08] pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              <Newspaper className="w-4 h-4 text-orange-400" />
              <span>OrangeFlix Cinema Wire & Editorial</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Entertainment News & Insights
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Authentic industry reports, director interviews, film festival coverage, Oscar forecasts, and franchise deep-dives.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search news, topics, films, cast..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900/80 border-gray-800 text-xs rounded-xl h-11 text-white placeholder:text-slate-500 shadow-inner"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <Button
                key={cat}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSearchQuery('');
                }}
                className={
                  isActive
                    ? 'bg-orange-500 text-white rounded-full text-xs font-bold shadow-md shadow-orange-500/25 px-4 h-8'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 rounded-full text-xs hover:border-orange-500/40 hover:text-white px-4 h-8'
                }
              >
                {cat}
              </Button>
            );
          })}
        </div>

        {loading ? (
          <NewsSkeleton />
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/40 rounded-3xl border border-gray-800 p-8 space-y-3">
            <Newspaper className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No articles found</h3>
            <p className="text-xs text-slate-400">Try another category or search query.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Bento Grid Featured News Layout */}
            {featuredArticle && !searchQuery && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Main Hero Story (8 cols) */}
                <Link
                  to={`/news/${featuredArticle.slug}`}
                  className="lg:col-span-8 group relative block overflow-hidden rounded-3xl border border-white/[.08] bg-gray-900/60 shadow-2xl transition hover:border-orange-500/40 flex flex-col justify-between"
                >
                  <div className="relative aspect-video sm:aspect-[16/9] w-full overflow-hidden bg-gray-950">
                    <img
                      src={featuredArticle.imageUrl}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-orange-500 text-white font-bold text-xs shadow-md">
                        {featuredArticle.category}
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 space-y-2">
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-orange-400" />
                          {new Date(featuredArticle.publishedAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {featuredArticle.readTime}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-orange-400 transition-colors leading-tight">
                        {featuredArticle.title}
                      </h2>
                    </div>
                  </div>

                  <div className="p-6 pt-3 flex flex-col justify-between space-y-3">
                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                      {featuredArticle.summary}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-white/[.06] text-xs">
                      <span className="font-semibold text-slate-400">By {featuredArticle.author}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-orange-400 group-hover:translate-x-1 transition-transform">
                        Read full story <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Secondary Featured Stories (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
                  {remainingArticles.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      to={`/news/${item.slug}`}
                      className="group flex-1 flex flex-col justify-between overflow-hidden rounded-3xl border border-white/[.08] bg-gray-900/60 p-4 transition hover:border-orange-500/40 shadow-xl"
                    >
                      <div className="flex gap-4 items-start">
                        <div className="relative w-28 h-24 rounded-2xl overflow-hidden bg-gray-950 shrink-0 border border-white/10">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="text-orange-400 font-bold">{item.category}</span>
                            <span>•</span>
                            <span>{item.readTime}</span>
                          </div>
                          <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-2 group-hover:text-orange-400 transition-colors">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/[.06] flex items-center justify-between text-[11px] text-slate-400 mt-3">
                        <span>{item.author}</span>
                        <span className="text-orange-400 font-bold">Read →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Grid of All News Articles */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                Latest Cinema News & Reports
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {(searchQuery ? articles : remainingArticles.slice(2)).map((article) => (
                  <Link
                    key={article.id}
                    to={`/news/${article.slug}`}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[.08] bg-gray-900/50 p-4 transition hover:border-orange-500/40 hover:bg-gray-900/80 shadow-lg"
                  >
                    <div className="space-y-3.5">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-950">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md text-[10px] text-orange-300 border-white/10">
                          {article.category}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                      </div>

                      <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[.06] flex items-center justify-between text-xs text-slate-500">
                      <span>{article.author}</span>
                      <span className="text-orange-400 font-semibold group-hover:underline">Read Story →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

