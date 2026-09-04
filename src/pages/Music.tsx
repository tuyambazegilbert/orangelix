import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MusicApi, SoundtrackAlbum, SoundtrackTrack } from '@/services/music-api';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Music2,
  Play,
  Pause,
  Search,
  Disc3,
  Sparkles,
  ExternalLink,
  Volume2,
  Film,
} from 'lucide-react';
import { SoundtrackSkeleton } from '@/components/ui/Skeletons';
import { toast } from 'sonner';

export default function Music() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    albums: SoundtrackAlbum[];
    tracks: SoundtrackTrack[];
  }>({ albums: [], tracks: [] });
  const [featuredAlbums, setFeaturedAlbums] = useState<SoundtrackAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  // Audio player state
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      const res = await MusicApi.getFeaturedSoundtracks();
      setFeaturedAlbums(res);
      setLoading(false);
    };
    loadFeatured();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const res = await MusicApi.searchMovieSoundtrack(searchQuery.trim());
    setSearchResults(res);
    setLoading(false);
  };

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

  if (loading && featuredAlbums.length === 0) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white">
        <SEOHead
          title="Movie & TV Soundtracks — Cinema Music Discovery"
          description="Stream official motion picture soundtracks, score themes, and composer masterworks on OrangeFlix."
          url="https://orangeflixx.vercel.app/music"
        />
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          <Breadcrumbs items={[{ name: 'Music & Soundtracks', url: '/music' }]} />
          <SoundtrackSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <SEOHead
        title="Movie & TV Soundtracks — Cinema Music Discovery"
        description="Stream official motion picture soundtracks, score themes, and composer masterworks on OrangeFlix."
        url="https://orangeflixx.vercel.app/music"
      />

      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <Breadcrumbs items={[{ name: 'Music & Soundtracks', url: '/music' }]} />

        {/* Hero Header */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-gradient-to-br from-[#12192c] via-[#0b101c] to-[#1e1329] p-6 sm:p-10 shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold">
              <Disc3 className="w-3.5 h-3.5 animate-spin text-orange-400" />
              <span>Cinema Soundtracks & Scores</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              The Sound of <span className="text-orange-400">Cinema</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Explore unforgettable orchestral scores and official soundtracks from legendary composers like Hans Zimmer, Ludwig Göransson, Ennio Morricone, and John Williams.
            </p>

            <form onSubmit={handleSearch} className="relative pt-3 flex max-w-lg items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search soundtrack (e.g. Dune, Interstellar, Oppenheimer)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/50 border-white/10 text-xs text-white placeholder:text-slate-500 rounded-xl h-11"
                />
              </div>
              <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 rounded-xl h-11 px-5 font-bold shadow-lg shadow-orange-500/25">
                Search
              </Button>
            </form>

            {/* Quick Composer / Theme Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">Popular:</span>
              {['Dune', 'Interstellar', 'Hans Zimmer', 'Ludwig Göransson', 'Oppenheimer', 'The Batman', 'Inception'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    setLoading(true);
                    MusicApi.searchMovieSoundtrack(tag).then((res) => {
                      setSearchResults(res);
                      setLoading(false);
                    });
                  }}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] hover:border-orange-500/40 text-slate-300 hover:text-white transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Search Results if active */}
        {searchQuery.trim() && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[.08] pb-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Music2 className="w-5 h-5 text-orange-400" />
                Results for &quot;{searchQuery}&quot;
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear Search
              </Button>
            </div>

            {searchResults.tracks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tracks & Audio Previews</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {searchResults.tracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-900/60 border border-white/[.08] hover:border-orange-500/30 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => togglePlayTrack(track)}
                          className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 transition ${
                            playingTrackId === track.id
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40'
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
                          <h4 className="text-xs font-bold text-white truncate">{track.trackName}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{track.artistName} • {track.collectionName}</p>
                        </div>
                      </div>

                      {track.previewUrl && (
                        <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-mono shrink-0">
                          30s
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Featured Soundtrack Albums Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[.08] pb-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-orange-400" />
                Featured Motion Picture Soundtracks
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Iconic albums available for high-fidelity discovery</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {featuredAlbums.map((album) => (
              <Card
                key={album.id}
                className="bg-gray-900/60 border-white/[.08] hover:border-orange-500/40 transition-all overflow-hidden flex flex-col justify-between group rounded-2xl shadow-lg"
              >
                <div className="relative aspect-square bg-gray-950 overflow-hidden">
                  <img
                    src={album.artworkUrl}
                    alt={album.collectionName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSearchQuery(album.collectionName);
                        MusicApi.searchMovieSoundtrack(album.collectionName).then(setSearchResults);
                      }}
                      className="bg-orange-500 hover:bg-orange-600 rounded-full text-xs shadow-lg font-bold"
                    >
                      <Play className="w-3.5 h-3.5 mr-1" /> View Tracks
                    </Button>
                  </div>
                </div>

                <CardContent className="p-3.5">
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                    {album.collectionName}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {album.artistName}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-white/[.06]">
                    <span>{album.trackCount} Tracks</span>
                    <span>{new Date(album.releaseDate).getFullYear()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

