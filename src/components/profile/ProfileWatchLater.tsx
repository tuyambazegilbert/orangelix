import { useState } from 'react';
import { Movie } from '@/types';
import { MediaItem } from '@/types/media';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Search,
  Trash2,
  Play,
  CheckCircle2,
  Film,
  Tv,
  Star,
  Sparkles,
} from 'lucide-react';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import { toast } from 'sonner';

interface ProfileWatchLaterProps {
  watchLater: (MediaItem | Movie)[];
  onRemoveWatchLater: (id: string) => void;
  onMarkAsWatched: (item: MediaItem | Movie) => void;
}

export default function ProfileWatchLater({
  watchLater,
  onRemoveWatchLater,
  onMarkAsWatched,
}: ProfileWatchLaterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredItems = watchLater.filter((item) => {
    const title = 'title' in item ? item.title : '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const isTv = ('mediaType' in item && item.mediaType === 'tv') || ('type' in item && item.type === 'Series');
    const matchesType =
      mediaFilter === 'all' || (mediaFilter === 'tv' && isTv) || (mediaFilter === 'movie' && !isTv);
    return matchesSearch && matchesType;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleBulkRemove = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Remove ${selectedIds.length} titles from your Watch Later queue?`)) {
      selectedIds.forEach((id) => onRemoveWatchLater(id));
      setSelectedIds([]);
      toast.success('Selected titles removed from Watch Later.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-2 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-yellow-400 fill-current" />
            Watch Later Queue
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">
            {watchLater.length} saved titles queued for your next session
          </p>
        </div>

        {selectedIds.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkRemove}
            className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Remove Selected ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Search & Bulk Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Search watch later list..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-900 border-gray-800 text-white text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {filteredItems.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={selectAll}
              className="text-gray-400 hover:text-white text-xs h-9"
            >
              {selectedIds.length === filteredItems.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}

          <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setMediaFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                mediaFilter === 'all' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMediaFilter('movie')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                mediaFilter === 'movie' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3" /> Movies
            </button>
            <button
              onClick={() => setMediaFilter('tv')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                mediaFilter === 'tv' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Tv className="w-3 h-3" /> Series
            </button>
          </div>
        </div>
      </div>

      {/* Queue List */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isTv = ('mediaType' in item && item.mediaType === 'tv') || ('type' in item && item.type === 'Series');
            const poster = 'posterUrl' in item ? item.posterUrl : ('imageUrl' in item ? item.imageUrl : POSTER_FALLBACK);
            const rating = 'voteAverage' in item ? item.voteAverage : ('rating' in item ? item.rating : 5.0);
            const year = 'releaseYear' in item ? item.releaseYear : 2026;
            const isSelected = selectedIds.includes(item.id);

            return (
              <Card
                key={item.id}
                className={`bg-gray-900/70 border transition-all ${
                  isSelected ? 'border-orange-500 bg-orange-500/5' : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <CardContent className="p-3.5 flex items-center gap-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(item.id)}
                    className="border-gray-700 data-[state=checked]:bg-orange-500"
                  />

                  <div className="w-14 h-20 bg-gray-950 rounded-lg overflow-hidden shrink-0 border border-gray-800">
                    <img src={poster || POSTER_FALLBACK} alt={item.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-bold border-yellow-500/30 text-yellow-400 py-0"
                      >
                        {isTv ? 'Series' : 'Movie'}
                      </Badge>
                      <span className="text-xs text-gray-500">{year}</span>
                      <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-current" /> {rating?.toFixed(1) || '5.0'}
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-sm truncate">{item.title}</h4>
                    <p className="text-gray-400 text-xs line-clamp-1">
                      {'overview' in item ? item.overview : ('description' in item ? item.description : '')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => onMarkAsWatched(item)}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:text-emerald-400 hover:border-emerald-500/40 text-xs hidden sm:flex"
                      title="Mark as watched"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Watched
                    </Button>
                    <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                      <Link to={`/watch/${item.id}`}>
                        <Play className="w-3.5 h-3.5 mr-1" />
                        Play
                      </Link>
                    </Button>
                    <button
                      onClick={() => onRemoveWatchLater(item.id)}
                      className="text-gray-500 hover:text-red-400 p-1.5"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900/40 rounded-3xl border border-gray-800 space-y-3">
          <Bookmark className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Your Watch Later queue is empty</h3>
          <p className="text-gray-400 text-xs max-w-sm mx-auto">
            {searchQuery
              ? 'No queued titles match your query.'
              : 'Add movies and series you want to watch soon by clicking "Watch Later" on any title.'}
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white text-xs mt-2">
            <Link to="/trending">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Explore Trending Releases
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

