import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { NewsApi, NewsArticle } from '@/services/news-api';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Clock, Newspaper, ArrowRight, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title="Entertainment News, Trailers & Industry Insights"
        description="Latest cinema news, streaming updates, movie trailers, Oscars race, and directorial insights on OrangeFlix."
        url="https://orangeflixx.vercel.app/news"
      />

      <div className="page-wrap py-8">
        <Breadcrumbs items={[{ name: 'Entertainment News', url: '/news' }]} />

        {/* Hero Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
              <Newspaper className="w-4 h-4" />
              <span>OrangeFlix Cinema Wire</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Entertainment News & Insights
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Original editorial, festival reports, trailer breakdowns, and technological breakthroughs across cinema.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search news, topics, films..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-900 border-gray-800 text-xs rounded-xl h-10"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-white/[.07] scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory.toLowerCase() === cat.toLowerCase() ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory(cat);
                setSearchQuery('');
              }}
              className={
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-orange-500 text-white rounded-full text-xs font-semibold'
                  : 'border-white/10 text-slate-300 rounded-full text-xs hover:border-orange-500/40'
              }
            >
              {cat}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
            <p className="text-xs text-slate-500">Loading cinema headlines...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/40 rounded-2xl border border-gray-800">
            <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No articles found</h3>
            <p className="text-xs text-slate-400 mt-1">Try another category or search query.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Featured Article */}
            {featuredArticle && !searchQuery && (
              <Link
                to={`/news/${featuredArticle.slug}`}
                className="group relative block overflow-hidden rounded-3xl border border-white/[.08] bg-gray-900/60 shadow-xl transition hover:border-orange-500/30"
              >
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="relative aspect-video md:aspect-[16/10] overflow-hidden bg-gray-950">
                    <img
                      src={featuredArticle.imageUrl}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-orange-500 text-white font-bold text-[11px]">
                        {featuredArticle.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-orange-400" />
                          {new Date(featuredArticle.publishedAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {featuredArticle.readTime}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-orange-400 transition-colors leading-tight">
                        {featuredArticle.title}
                      </h2>

                      <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                        {featuredArticle.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/[.08]">
                      <span className="text-xs font-semibold text-slate-400">By {featuredArticle.author}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 group-hover:translate-x-1 transition-transform">
                        Read full article <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid of Remaining Articles */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(searchQuery ? articles : remainingArticles).map((article) => (
                <Link
                  key={article.id}
                  to={`/news/${article.slug}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[.08] bg-gray-900/50 p-4 transition hover:border-white/20 hover:bg-gray-900/80"
                >
                  <div className="space-y-4">
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

                    <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[.06] flex items-center justify-between text-xs text-slate-500">
                    <span>{article.author}</span>
                    <span className="text-orange-400 font-medium group-hover:underline">Read →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

