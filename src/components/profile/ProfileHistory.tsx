import { useState } from 'react';
import { WatchHistoryItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Trash2,
  Play,
  Film,
  Tv,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';

interface ProfileHistoryProps {
  watchHistory: WatchHistoryItem[];
  onRemoveItem: (contentId: string) => void;
  onClearHistory: () => void;
}

export default function ProfileHistory({
  watchHistory,
  onRemoveItem,
  onClearHistory,
}: ProfileHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');

  const filteredHistory = watchHistory.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = mediaFilter === 'all' || item.mediaType === mediaFilter;
    return matchesSearch && matchesType;
  });

  // Group items by time period
  const groupHistory = (items: WatchHistoryItem[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const groups: { [key: string]: WatchHistoryItem[] } = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Earlier: [],
    };

    items.forEach((item) => {
      const itemDate = new Date(item.watchedAt);
      if (itemDate >= today) {
        groups.Today.push(item);
      } else if (itemDate >= yesterday) {
        groups.Yesterday.push(item);
      } else if (itemDate >= thisWeek) {
        groups['This Week'].push(item);
      } else {
        groups.Earlier.push(item);
      }
    });

    return groups;
  };

  const grouped = groupHistory(filteredHistory);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-2 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-orange-400" />
            Watch History & Timeline
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">
            {watchHistory.length} total streaming sessions recorded
          </p>
        </div>

        {watchHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your entire watch history?')) {
                onClearHistory();
              }
            }}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Clear All History
          </Button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Search watch history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-900 border-gray-800 text-white text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800 w-full sm:w-auto">
          <button
            onClick={() => setMediaFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mediaFilter === 'all' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setMediaFilter('movie')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              mediaFilter === 'movie' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-3 h-3" /> Movies
          </button>
          <button
            onClick={() => setMediaFilter('tv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              mediaFilter === 'tv' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="w-3 h-3" /> Series
          </button>
        </div>
      </div>

      {/* Timeline Groups */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([period, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={period} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                    {period}
                  </h3>
                  <span className="text-xs text-gray-500">({items.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((item) => {
                    const duration = item.durationSeconds || 7200;
                    const pct = Math.min(100, Math.round((item.progressSeconds / duration) * 100));
                    const isFinished = pct >= 95;

                    return (
                      <Card
                        key={item.contentId}
                        className="bg-gray-900/70 border-gray-800 hover:border-orange-500/30 transition-all overflow-hidden"
                      >
                        <CardContent className="p-3 flex items-center gap-3.5">
                          <div className="relative w-16 h-20 bg-gray-950 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={item.posterUrl || POSTER_FALLBACK}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            {isFinished && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Badge className="bg-emerald-500 text-white text-[9px] px-1 py-0 font-bold">
                                  Done
                                </Badge>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase font-bold border-orange-500/30 text-orange-400 py-0"
                              >
                                {item.mediaType === 'tv' ? 'Series' : 'Movie'}
                              </Badge>
                              <span className="text-[10px] text-gray-500">
                                {new Date(item.watchedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <h4 className="text-white font-bold text-sm truncate">{item.title}</h4>

                            <div className="space-y-1 pt-0.5">
                              <Progress value={pct} className="h-1 bg-gray-800" />
                              <div className="flex justify-between text-[10px] text-gray-400">
                                <span>{pct}% watched</span>
                                <span>
                                  {Math.round(item.progressSeconds / 60)} /{' '}
                                  {Math.round(duration / 60)} min
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              asChild
                              className="h-8 px-2.5 bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              <Link to={`/watch/${item.contentId}`}>
                                <Play className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemoveItem(item.contentId)}
                              className="h-8 px-2.5 text-gray-500 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900/40 rounded-3xl border border-gray-800 space-y-3">
          <History className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No viewing history found</h3>
          <p className="text-gray-400 text-xs max-w-sm mx-auto">
            {searchQuery
              ? 'No titles match your search criteria.'
              : "When you stream movies and series, they'll appear in your personal timeline."}
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white text-xs mt-2">
            <Link to="/movies">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Explore OrangeFlix Catalog
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

