import { useState } from 'react';
import { Movie } from '@/types';
import { MediaItem } from '@/types/media';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import {
  Heart,
  Search,
  Trash2,
  Play,
  Film,
  Tv,
  Star,
  BookmarkPlus,
  Share2,
  Sparkles,
} from 'lucide-react';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import { toast } from 'sonner';

interface ProfileFavoritesProps {
  favorites: (MediaItem | Movie)[];
  onRemoveFavorite: (id: string) => void;
  onAddToWatchLater: (id: string, item: MediaItem | Movie) => void;
}

export default function ProfileFavorites({
  favorites,
  onRemoveFavorite,
  onAddToWatchLater,
}: ProfileFavoritesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'rating' | 'year'>('recent');

  const filteredAndSorted = favorites
    .filter((item) => {
      const title = 'title' in item ? item.title : '';
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      const isTv = ('mediaType' in item && item.mediaType === 'tv') || ('type' in item && item.type === 'Series');
      const matchesType =
        mediaFilter === 'all' || (mediaFilter === 'tv' && isTv) || (mediaFilter === 'movie' && !isTv);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const titleA = 'title' in a ? a.title : '';
      const titleB = 'title' in b ? b.title : '';
      const ratingA = 'voteAverage' in a ? a.voteAverage : ('rating' in a ? a.rating : 0);
      const ratingB = 'voteAverage' in b ? b.voteAverage : ('rating' in b ? b.rating : 0);
      const yearA = 'releaseYear' in a ? a.releaseYear : 0;
      const yearB = 'releaseYear' in b ? b.releaseYear : 0;

      if (sortBy === 'title') return titleA.localeCompare(titleB);
      if (sortBy === 'rating') return (ratingB || 0) - (ratingA || 0);
      if (sortBy === 'year') return (yearB || 0) - (yearA || 0);
      return 0; // Default recent
    });

  const handleShare = (item: MediaItem | Movie) => {
    const isTv = ('mediaType' in item && item.mediaType === 'tv') || ('type' in item && item.type === 'Series');
    const path = isTv ? `/series/${item.id}` : `/movie/${item.id}`;
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-2 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500 fill-current" />
            My Saved Favorites
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">
            {favorites.length} titles in your curated favorites library
          </p>
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Search saved favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-900 border-gray-800 text-white text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 shrink-0">
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

          <Select value={sortBy} onValueChange={(val: 'recent' | 'title' | 'rating' | 'year') => setSortBy(val)}>
            <SelectTrigger className="bg-gray-900 border-gray-800 text-white text-xs h-9 w-36 shrink-0">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white text-xs">
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="year">Release Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Favorites Grid */}
      {filteredAndSorted.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAndSorted.map((item) => {
            const isTv = ('mediaType' in item && item.mediaType === 'tv') || ('type' in item && item.type === 'Series');
            const poster = 'posterUrl' in item ? item.posterUrl : ('imageUrl' in item ? item.imageUrl : POSTER_FALLBACK);
            const rating = 'voteAverage' in item ? item.voteAverage : ('rating' in item ? item.rating : 5.0);
            const year = 'releaseYear' in item ? item.releaseYear : 2026;
            const watchPath = `/watch/${item.id}`;

            return (
              <Card
                key={item.id}
                className="bg-gray-900/80 border-gray-800 hover:border-pink-500/40 transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div className="relative aspect-[2/3] bg-gray-950 overflow-hidden">
                  <img
                    src={poster || POSTER_FALLBACK}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-black/70 backdrop-blur-md text-yellow-400 border border-white/10 text-[10px] flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {rating?.toFixed(1) || '5.0'}
                    </Badge>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                    <Button asChild size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs">
                      <Link to={watchPath}>
                        <Play className="w-3.5 h-3.5 mr-1" />
                        Play Now
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddToWatchLater(item.id, item)}
                      className="w-full border-gray-700 bg-gray-900/80 text-gray-200 hover:text-white text-xs"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 mr-1" />
                      Watch Later
                    </Button>
                  </div>
                </div>

                <div className="p-3 space-y-1.5 bg-gray-950/40">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="uppercase font-semibold text-orange-400 text-[10px]">
                      {isTv ? 'Series' : 'Movie'}
                    </span>
                    <span>{year}</span>
                  </div>

                  <h4 className="text-white font-bold text-xs truncate" title={item.title}>
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-800/60">
                    <button
                      onClick={() => handleShare(item)}
                      className="text-gray-500 hover:text-gray-300 p-1"
                      title="Share link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveFavorite(item.id)}
                      className="text-gray-500 hover:text-red-400 p-1"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900/40 rounded-3xl border border-gray-800 space-y-3">
          <Heart className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No saved favorites yet</h3>
          <p className="text-gray-400 text-xs max-w-sm mx-auto">
            {searchQuery
              ? 'No favorites match your current filters.'
              : 'Click the heart icon on any movie or series to keep your top picks here.'}
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white text-xs mt-2">
            <Link to="/movies">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Discover Movies
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

