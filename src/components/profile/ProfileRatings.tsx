import { useState } from 'react';
import { UserRating } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Star,
  Search,
  Trash2,
  Play,
  Film,
  Tv,
  Sparkles,
} from 'lucide-react';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import { toast } from 'sonner';

interface ProfileRatingsProps {
  ratings: UserRating[];
  onUpdateRating: (movieId: string, newScore: number) => void;
  onRemoveRating: (movieId: string) => void;
}

export default function ProfileRatings({
  ratings,
  onUpdateRating,
  onRemoveRating,
}: ProfileRatingsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRatings = ratings.filter((r) =>
    r.mediaTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStarClick = (movieId: string, score: number) => {
    onUpdateRating(movieId, score);
    toast.success(`Updated your rating to ${score} stars!`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-2 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
            My Ratings & Reviews
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">
            {ratings.length} titles you&apos;ve personally rated
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <Input
          type="text"
          placeholder="Search your rated titles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-gray-900 border-gray-800 text-white text-xs h-9"
        />
      </div>

      {/* Ratings Grid */}
      {filteredRatings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRatings.map((item) => (
            <Card
              key={item.movieId}
              className="bg-gray-900/70 border-gray-800 hover:border-yellow-500/30 transition-all overflow-hidden flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-3.5">
                  <div className="w-14 h-20 bg-gray-950 rounded-lg overflow-hidden shrink-0 border border-gray-800">
                    <img
                      src={item.posterUrl || POSTER_FALLBACK}
                      alt={item.mediaTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <Badge
                      variant="outline"
                      className="text-[9px] uppercase font-bold border-yellow-500/30 text-yellow-400 py-0"
                    >
                      {item.mediaType === 'tv' ? 'Series' : 'Movie'}
                    </Badge>
                    <h4 className="text-white font-bold text-sm truncate">{item.mediaTitle}</h4>
                    <p className="text-[11px] text-gray-500">
                      Rated on {new Date(item.ratedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Star Rating Interactive Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-800/80">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(item.movieId, star)}
                        className="text-yellow-400 hover:scale-125 transition-transform p-0.5"
                        title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= item.rating ? 'fill-current' : 'text-gray-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      asChild
                      variant="ghost"
                      className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                    >
                      <Link to={`/watch/${item.movieId}`}>
                        <Play className="w-3 h-3 mr-1" /> View
                      </Link>
                    </Button>
                    <button
                      onClick={() => onRemoveRating(item.movieId)}
                      className="text-gray-500 hover:text-red-400 p-1"
                      title="Delete rating"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900/40 rounded-3xl border border-gray-800 space-y-3">
          <Star className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No rated titles yet</h3>
          <p className="text-gray-400 text-xs max-w-sm mx-auto">
            {searchQuery
              ? 'No titles match your query.'
              : 'Rate movies and series as you watch them to build your taste recommendations.'}
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white text-xs mt-2">
            <Link to="/movies">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Browse & Rate Movies
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

