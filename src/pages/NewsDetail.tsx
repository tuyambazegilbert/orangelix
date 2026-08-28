import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { NewsApi, NewsArticle } from '@/services/news-api';
import SEOHead from '@/components/seo/SEOHead';
import StructuredData, { SchemaGenerators } from '@/components/seo/StructuredData';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  User,
  Share2,
  Bookmark,
  ArrowLeft,
  Film,
  Sparkles,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(false);
      const res = await NewsApi.getArticleBySlug(slug);
      setArticle(res);
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Article URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold">Article not found</h1>
        <p className="text-slate-400 text-sm mt-2 mb-6">The story you requested does not exist.</p>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link to="/news">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to News Wire
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title={article.title}
        description={article.summary}
        image={article.imageUrl}
        type="article"
      />
      <StructuredData
        id="article-jsonld"
        data={SchemaGenerators.article({
          title: article.title,
          summary: article.summary,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt,
          author: article.author,
          url: window.location.href,
        })}
      />

      <article className="page-wrap py-8 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'News', url: '/news' },
            { name: article.category, url: `/news/category/${article.category.toLowerCase()}` },
            { name: article.title, url: `/news/${article.slug}` },
          ]}
        />

        {/* Category & Metadata Header */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <Badge className="bg-orange-500 text-white font-bold text-xs px-3 py-1">
              {article.category}
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Source: {article.source}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-white/[.08] text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <User className="w-4 h-4 text-orange-400" />
                {article.author}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                {article.readTime}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-white/10 text-slate-300 hover:border-orange-500/40 text-xs h-8"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Copied' : 'Share Article'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Artwork */}
        <div className="relative aspect-video rounded-3xl overflow-hidden mb-8 border border-white/[.08] shadow-2xl">
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        </div>

        {/* Related Movie/Series Connection Badge */}
        {article.relatedMovieId && article.relatedMovieTitle && (
          <div className="mb-8 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 grid place-items-center text-orange-400">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-orange-300 font-medium">Related Title in OrangeFlix</p>
                <h4 className="font-bold text-white text-sm">{article.relatedMovieTitle}</h4>
              </div>
            </div>
            <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 text-xs">
              <Link to={`/watch/${article.relatedMovieId}`}>Watch Now</Link>
            </Button>
          </div>
        )}

        {/* Body Content */}
        <div className="prose prose-invert max-w-none text-slate-300 text-base leading-relaxed space-y-6">
          <p className="text-lg font-medium text-slate-200 leading-relaxed italic border-l-2 border-orange-500 pl-4">
            {article.summary}
          </p>

          {article.content.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Tags */}
        <div className="mt-10 pt-6 border-t border-white/[.08] flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold mr-1">Topics:</span>
          {article.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-white/10 text-slate-400 text-xs bg-white/[.03]"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </article>
    </div>
  );
}

