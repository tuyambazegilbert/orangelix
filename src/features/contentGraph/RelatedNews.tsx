import { Link } from 'react-router-dom';
import { NewsArticle } from '@/services/news-api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, Calendar, ExternalLink, ArrowRight } from 'lucide-react';

interface RelatedNewsProps {
  news: NewsArticle[];
  isLoading?: boolean;
}

export default function RelatedNews({ news, isLoading }: RelatedNewsProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-gray-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-gray-800/60 rounded-xl" />
          <div className="h-32 bg-gray-800/60 rounded-xl" />
          <div className="h-32 bg-gray-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  // Gracefully omit if no authentic news or verified editorial exists for this title
  if (!news || news.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-orange-400" />
          Latest News & Cinema Editorial
        </h2>
        <Button asChild variant="ghost" size="sm" className="text-xs text-orange-400 hover:text-orange-300">
          <Link to="/news">
            View All News <ExternalLink className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {news.map((item) => {
          const formattedDate = item.publishedAt
            ? new Date(item.publishedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Recent';

          return (
            <Link
              key={item.id}
              to={`/news/${item.slug}`}
              className="group block"
            >
              <Card className="h-full bg-gray-900/60 border-gray-800 hover:border-orange-500/40 transition-all overflow-hidden flex flex-col justify-between shadow-md">
                <div className="relative h-36 w-full overflow-hidden bg-gray-950">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800';
                    }}
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                    <Badge className="bg-black/80 backdrop-blur-md text-[10px] text-orange-400 border border-white/10 font-medium">
                      {item.category}
                    </Badge>
                    {item.source && (
                      <Badge variant="outline" className="bg-black/60 backdrop-blur-md text-[9px] text-slate-300 border-white/10">
                        {item.source}
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Calendar className="w-3 h-3 text-orange-400" />
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>{item.readTime || '3 min read'}</span>
                    </div>

                    <h4 className="font-bold text-white text-xs line-clamp-2 group-hover:text-orange-400 transition-colors">
                      {item.title}
                    </h4>

                    <p className="text-gray-400 text-[11px] line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-orange-400 font-semibold group-hover:translate-x-0.5 transition-transform border-t border-white/[0.04]">
                    <span>Read Story</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
