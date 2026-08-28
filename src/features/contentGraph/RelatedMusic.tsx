import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SoundtrackItem } from '@/services/music-api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music2, Play, Pause, ExternalLink, Disc3, Volume2 } from 'lucide-react';

interface RelatedMusicProps {
  soundtrack: SoundtrackItem | null;
  tmdbId?: number;
  isLoading?: boolean;
}

export default function RelatedMusic({ soundtrack, tmdbId, isLoading }: RelatedMusicProps) {
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Reset playing state if soundtrack changes
    setPlayingTrackId(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [soundtrack]);

  const togglePreview = (trackId: number, previewUrl?: string) => {
    if (!previewUrl) return;

    if (playingTrackId === trackId) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(previewUrl);
      audioRef.current.play().catch(() => {});
      audioRef.current.onended = () => setPlayingTrackId(null);
      setPlayingTrackId(trackId);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-gray-800 rounded" />
        <div className="h-20 bg-gray-800/60 rounded-xl" />
      </div>
    );
  }

  // Gracefully omit if no authentic soundtrack release was found
  if (!soundtrack || !soundtrack.tracks || soundtrack.tracks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Music2 className="w-5 h-5 text-orange-400" />
          Motion Picture Soundtrack & Official Score
        </h2>
        {tmdbId ? (
          <Button asChild variant="ghost" size="sm" className="text-xs text-orange-400 hover:text-orange-300">
            <Link to={`/music/movie/${tmdbId}`}>
              View Full Album <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm" className="text-xs text-orange-400 hover:text-orange-300">
            <Link to="/music">
              Explore Music Hub <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        )}
      </div>

      <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl overflow-hidden hover:border-orange-500/30 transition-all">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10 shadow-lg">
                <img
                  src={soundtrack.albumArtwork}
                  alt={soundtrack.albumName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Disc3 className="w-6 h-6 text-white/60 animate-spin-slow" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-[10px]">
                    Official Soundtrack
                  </Badge>
                  <span className="text-xs text-gray-500">{soundtrack.releaseYear}</span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1">{soundtrack.albumName}</h4>
                <p className="text-xs text-gray-400">{soundtrack.artistName}</p>
              </div>
            </div>

            {tmdbId ? (
              <Button
                asChild
                size="sm"
                className="bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-orange-300 text-xs font-semibold shrink-0"
              >
                <Link to={`/music/movie/${tmdbId}`}>
                  <Volume2 className="w-3.5 h-3.5 mr-1 text-orange-400" />
                  Listen All ({soundtrack.trackCount} Tracks)
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-orange-300 text-xs font-semibold shrink-0"
              >
                <Link to="/music">
                  <Volume2 className="w-3.5 h-3.5 mr-1 text-orange-400" />
                  Listen In Music Hub
                </Link>
              </Button>
            )}
          </div>

          {/* Audio Sample Previews */}
          {soundtrack.tracks && soundtrack.tracks.length > 0 && (
            <div className="mt-5 space-y-2 border-t border-gray-800/80 pt-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Featured Track Samples (30s Audio Preview)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {soundtrack.tracks.slice(0, 3).map((track) => {
                  const isPlaying = playingTrackId === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isPlaying
                          ? 'bg-orange-500/10 border-orange-500/40 text-orange-300'
                          : 'bg-gray-950/60 border-gray-800 hover:border-gray-700 text-gray-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-medium text-white truncate">{track.trackName}</p>
                        <p className="text-[11px] text-gray-400 truncate">{track.artistName}</p>
                      </div>

                      {track.previewUrl && (
                        <button
                          onClick={() => togglePreview(track.id, track.previewUrl)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            isPlaying
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40'
                              : 'bg-white/10 text-white hover:bg-orange-500 hover:text-white'
                          }`}
                          aria-label={isPlaying ? 'Pause sample' : 'Play 30s sample'}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
