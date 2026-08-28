import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMovieDetails } from '@/hooks/use-tmdb';
import { MusicApi, SoundtrackAlbum, SoundtrackTrack } from '@/services/music-api';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Music2,
  Play,
  Pause,
  ArrowLeft,
  Film,
  Disc3,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MovieSoundtrack() {
  const { id } = useParams<{ id: string }>();
  const movieId = id ? parseInt(id, 10) : undefined;
  const { data: movie, isLoading } = useMovieDetails(movieId);

  const [soundtrack, setSoundtrack] = useState<{
    albums: SoundtrackAlbum[];
    tracks: SoundtrackTrack[];
  }>({ albums: [], tracks: [] });
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!movie?.title) return;
    const loadSoundtrack = async () => {
      setLoadingTracks(true);
      const res = await MusicApi.searchMovieSoundtrack(movie.title);
      setSoundtrack(res);
      setLoadingTracks(false);
    };
    loadSoundtrack();
  }, [movie?.title]);

  const togglePlayTrack = (track: SoundtrackTrack) => {
    if (!track.previewUrl) {
      toast.error('No audio preview available for this track');
      return;
    }

    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.previewUrl;
        audioRef.current.play();
      } else {
        const audio = new Audio(track.previewUrl);
        audio.onended = () => setPlayingTrackId(null);
        audio.play();
        audioRef.current = audio;
      }
      setPlayingTrackId(track.id);
      toast.success(`Playing sample: ${track.trackName}`);
    }
  };

  const primaryAlbum = soundtrack.albums[0];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title={movie ? `${movie.title} — Official Soundtrack & Score` : 'Movie Soundtrack'}
        description={`Stream official motion picture soundtrack and score tracks for ${movie?.title || 'this title'} on OrangeFlix.`}
      />

      <div className="page-wrap py-8 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Movies', url: '/movies' },
            ...(movie ? [{ name: movie.title, url: `/movie/${movie.tmdbId}` }] : []),
            { name: 'Soundtrack', url: `/music/movie/${id}` },
          ]}
        />

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-gradient-to-br from-[#11192e] via-[#090e1a] to-[#1d122b] p-6 sm:p-8 mb-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-gray-950 shrink-0 border border-white/10 shadow-xl">
              <img
                src={
                  primaryAlbum?.artworkUrl ||
                  movie?.posterUrl ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'
                }
                alt={movie?.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold">
                <Disc3 className="w-3.5 h-3.5" />
                <span>Motion Picture Soundtrack</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                {movie?.title} Soundtrack
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                {primaryAlbum?.artistName || 'Original Score by Various Composers'}
              </p>

              <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-3">
                {movie && (
                  <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <Link to={`/watch/movie-${movie.tmdbId}`}>
                      <Film className="w-4 h-4 mr-1.5" /> Watch Film
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm" className="border-white/10 text-slate-300">
                  <Link to={`/movie/${id}`}>Film Details</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/[.08] pb-3">
            <Music2 className="w-5 h-5 text-orange-400" />
            Soundtrack Tracklist ({soundtrack.tracks.length})
          </h2>

          {loadingTracks ? (
            <div className="text-center py-12 text-xs text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
              Searching audio library...
            </div>
          ) : soundtrack.tracks.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/40 rounded-2xl border border-gray-800">
              <Music2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No official tracks found</p>
              <p className="text-xs text-slate-400 mt-1">This title does not have public audio preview licensing.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {soundtrack.tracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-900/50 border border-white/[.07] hover:border-orange-500/30 transition group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => togglePlayTrack(track)}
                      className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 transition ${
                        playingTrackId === track.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/10 text-slate-300 group-hover:bg-orange-500 group-hover:text-white'
                      }`}
                    >
                      {playingTrackId === track.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                        <h4 className="text-xs font-bold text-white truncate">{track.trackName}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{track.artistName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {track.trackTimeMillis && (
                      <span className="text-xs text-slate-500 font-mono">
                        {Math.floor(track.trackTimeMillis / 60000)}:
                        {String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}
                      </span>
                    )}
                    {track.trackViewUrl && (
                      <a
                        href={track.trackViewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-orange-400"
                        title="Listen on Apple Music"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

