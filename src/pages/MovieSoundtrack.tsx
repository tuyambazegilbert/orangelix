import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMovieDetails, useSeriesDetails } from '@/hooks/use-tmdb';
import { MusicApi, SoundtrackAlbum, SoundtrackTrack, SoundtrackItem } from '@/services/music-api';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Music2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Volume1,
  Search,
  Disc3,
  ExternalLink,
  Film,
  Sparkles,
  Share2,
  Headphones,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MovieSoundtrack() {
  const { id } = useParams<{ id: string }>();
  const rawId = id ? parseInt(id, 10) : undefined;
  const { data: movie, isLoading: isMovieLoading } = useMovieDetails(rawId);
  const { data: series, isLoading: isSeriesLoading } = useSeriesDetails(!movie ? rawId : null);
  const media = movie || series;
  const isMediaLoading = isMovieLoading && isSeriesLoading;

  // Soundtrack data state
  const [soundtrackData, setSoundtrackData] = useState<{
    albums: SoundtrackAlbum[];
    tracks: SoundtrackTrack[];
    primaryItem: SoundtrackItem | null;
  }>({ albums: [], tracks: [], primaryItem: null });
  const [loadingTracks, setLoadingTracks] = useState(true);

  // In-page search & filter
  const [trackSearch, setTrackSearch] = useState('');

  // Featured discovery tracks & albums
  const [featuredSoundtracks, setFeaturedSoundtracks] = useState<SoundtrackAlbum[]>([]);

  // Live Audio Engine State
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch Soundtrack for current title
  useEffect(() => {
    if (!media?.title) return;
    const composer = media.crew?.find(
      (c) => c.job === 'Original Music Composer' || c.job === 'Music' || c.department === 'Sound'
    )?.name;

    const loadSoundtrack = async () => {
      setLoadingTracks(true);
      try {
        const [searchRes, fullItem] = await Promise.all([
          MusicApi.searchMovieSoundtrack(media.title, composer),
          MusicApi.getMovieSoundtrack(
            media.title,
            composer,
            media.posterUrl || media.backdropUrl
          ),
        ]);

        const resolvedTracks =
          fullItem?.tracks && fullItem.tracks.length > 0
            ? fullItem.tracks
            : searchRes.tracks;

        setSoundtrackData({
          albums: searchRes.albums,
          tracks: resolvedTracks,
          primaryItem: fullItem,
        });

        if (resolvedTracks.length > 0) {
          setCurrentTrackIndex(0);
        }
      } catch (err) {
        console.error('[MovieSoundtrack] Failed to load soundtrack:', err);
      } finally {
        setLoadingTracks(false);
      }
    };

    loadSoundtrack();
  }, [media?.title, media?.crew, media?.posterUrl, media?.backdropUrl]);

  // Load curated featured soundtracks for bottom rail
  useEffect(() => {
    MusicApi.getFeaturedSoundtracks().then((res) => {
      setFeaturedSoundtracks(res.slice(0, 8));
    });
  }, []);

  // Filtered tracks based on in-page search
  const filteredTracks = useMemo(() => {
    const list = soundtrackData.tracks;
    if (!trackSearch.trim()) return list;
    const q = trackSearch.toLowerCase().trim();
    return list.filter(
      (t) =>
        t.trackName.toLowerCase().includes(q) ||
        t.artistName.toLowerCase().includes(q) ||
        t.collectionName.toLowerCase().includes(q)
    );
  }, [soundtrackData.tracks, trackSearch]);

  const activeTrack =
    currentTrackIndex !== null && soundtrackData.tracks[currentTrackIndex]
      ? soundtrackData.tracks[currentTrackIndex]
      : soundtrackData.tracks[0] || null;

  const activeAlbum =
    soundtrackData.albums[0] || null;

  const displayArtwork =
    activeTrack?.artworkUrl ||
    activeAlbum?.artworkUrl ||
    soundtrackData.primaryItem?.albumArtwork ||
    media?.posterUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800';

  const composerName =
    media?.crew?.find(
      (c) => c.job === 'Original Music Composer' || c.job === 'Music'
    )?.name ||
    activeAlbum?.artistName ||
    soundtrackData.primaryItem?.artistName ||
    'Original Motion Picture Score';

  // Audio lifecycle handler
  const playTrackAtIndex = (index: number) => {
    const track = soundtrackData.tracks[index];
    if (!track) return;

    if (!track.previewUrl) {
      toast.error(`No preview audio available for "${track.trackName}"`);
      return;
    }

    if (currentTrackIndex === index && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = track.previewUrl;
    audio.volume = isMuted ? 0 : volume;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setCurrentTrackIndex(index);
        toast.success(`Playing: ${track.trackName}`, {
          description: track.artistName,
          duration: 2500,
        });
      })
      .catch((err) => {
        console.warn('[Audio] play interrupted:', err);
      });

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 30);
    };

    audio.onended = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNextTrack();
      }
    };
  };

  const toggleMasterPlay = () => {
    if (!activeTrack) {
      if (soundtrackData.tracks.length > 0) {
        playTrackAtIndex(0);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (currentTrackIndex === null) {
        playTrackAtIndex(0);
      } else if (audioRef.current && audioRef.current.src) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        playTrackAtIndex(currentTrackIndex);
      }
    }
  };

  const handleNextTrack = () => {
    if (soundtrackData.tracks.length === 0) return;
    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * soundtrackData.tracks.length);
      playTrackAtIndex(nextIdx);
    } else {
      const nextIdx =
        currentTrackIndex !== null
          ? (currentTrackIndex + 1) % soundtrackData.tracks.length
          : 0;
      playTrackAtIndex(nextIdx);
    }
  };

  const handlePrevTrack = () => {
    if (soundtrackData.tracks.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prevIdx =
      currentTrackIndex !== null
        ? (currentTrackIndex - 1 + soundtrackData.tracks.length) %
          soundtrackData.tracks.length
        : 0;
    playTrackAtIndex(prevIdx);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 0.85;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Soundtrack link copied to clipboard!');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <SEOHead
        title={
          media
            ? `${media.title} — Official Motion Picture Soundtrack & Score`
            : 'Motion Picture Soundtrack'
        }
        description={`Stream authentic official score and soundtrack tracks for ${
          media?.title || 'this title'
        } on OrangeFlix.`}
      />

      {/* Dynamic Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-25">
        <div
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[140px] bg-gradient-to-br from-orange-600/30 to-amber-600/10"
        />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[160px] bg-gradient-to-tl from-violet-600/20 to-orange-500/10" />
      </div>

      <div className="relative z-10 max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              {
                name: media?.mediaType === 'tv' ? 'TV Series' : 'Movies',
                url: media?.mediaType === 'tv' ? '/series' : '/movies',
              },
              ...(media
                ? [
                    {
                      name: media.title,
                      url: `/${media.mediaType === 'tv' ? 'series' : 'movie'}/${
                        media.tmdbId
                      }`,
                    },
                  ]
                : []),
              { name: 'Soundtrack Studio', url: `/music/movie/${id}` },
            ]}
          />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-8 border-white/10 bg-white/[0.04] text-xs text-slate-300 hover:text-white hover:border-orange-500/40"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> Share
            </Button>
            {media && (
              <Button
                asChild
                size="sm"
                className="h-8 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/25"
              >
                <Link to={`/watch/${media.mediaType || 'movie'}-${media.tmdbId}`}>
                  <Film className="w-3.5 h-3.5 mr-1.5" /> Watch {media.mediaType === 'tv' ? 'Series' : 'Movie'}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Master Cinema Banner Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[.09] bg-gradient-to-r from-gray-900/90 via-[#0d121f]/95 to-[#170e24]/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8">
            {/* Album / Film Vinyl Mockup */}
            <div className="relative group shrink-0">
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl shadow-black/80">
                <img
                  src={displayArtwork}
                  alt={media?.title || 'Soundtrack'}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-medium text-white/90">
                  <span className="flex items-center gap-1 font-mono">
                    <Music2 className="w-3.5 h-3.5 text-orange-400" />
                    {soundtrackData.tracks.length} Tracks
                  </span>
                  {activeAlbum?.releaseDate && (
                    <span>{new Date(activeAlbum.releaseDate).getFullYear()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Title & Metadata Details */}
            <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge className="bg-orange-500 text-white font-bold text-xs uppercase tracking-wider px-2.5 py-0.5 shadow-md shadow-orange-500/30">
                  <Disc3 className="w-3.5 h-3.5 mr-1" />
                  Official Cinema Soundtrack & Score
                </Badge>
                {media?.releaseDate && (
                  <Badge variant="outline" className="border-white/15 text-slate-300 text-xs">
                    {new Date(media.releaseDate).getFullYear()}
                  </Badge>
                )}
                {media?.voteAverage && (
                  <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-xs font-semibold">
                    ★ {media.voteAverage.toFixed(1)} Rating
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none">
                {media?.title || 'Original'} <span className="text-orange-400">Soundtrack</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 font-medium">
                Composed & Curated by <span className="text-white font-semibold">{composerName}</span>
              </p>

              <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 max-w-3xl leading-relaxed">
                {soundtrackData.primaryItem?.albumName || activeAlbum?.collectionName
                  ? `Official high-fidelity original recording for "${media?.title}". Includes licensed themes, ambient scores, and full motion picture compositions.`
                  : media?.overview || 'Experience the complete sonic journey.'}
              </p>

              {/* Master Header Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Button
                  onClick={toggleMasterPlay}
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 rounded-xl shadow-xl shadow-orange-500/30 transition-transform active:scale-95"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" /> Pause Preview
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2 ml-0.5" /> Play Soundtrack Samples
                    </>
                  )}
                </Button>

                {soundtrackData.primaryItem?.collectionViewUrl && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-white/15 bg-white/[0.04] text-slate-200 hover:text-white hover:border-orange-500/40 rounded-xl"
                  >
                    <a
                      href={soundtrackData.primaryItem.collectionViewUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2 text-orange-400" />
                      Listen on Apple Music
                    </a>
                  </Button>
                )}

                {media && (
                  <Button
                    asChild
                    variant="ghost"
                    size="lg"
                    className="text-slate-400 hover:text-white rounded-xl"
                  >
                    <Link to={`/${media.mediaType === 'tv' ? 'series' : 'movie'}/${id}`}>
                      View Title Overview <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 12-Column Studio Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 4-COL: Sticky Studio Player & Turntable Deck */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
            <Card className="bg-gradient-to-b from-gray-900/90 to-[#0c101d]/90 border-white/[.09] shadow-2xl backdrop-blur-2xl overflow-hidden">
              <CardContent className="p-6 space-y-6">
                {/* Turntable / Vinyl Visualizer Deck */}
                <div className="relative aspect-square max-w-[280px] mx-auto flex items-center justify-center">
                  {/* Vinyl Grooves Body */}
                  <div
                    className={`relative w-full h-full rounded-full border-8 border-gray-950 shadow-2xl shadow-black flex items-center justify-center transition-all ${
                      isPlaying ? 'rotate-animation' : ''
                    }`}
                    style={{
                      background:
                        'radial-gradient(circle, #202020 0%, #111 25%, #222 45%, #0d0d0d 65%, #181818 85%, #080808 100%)',
                    }}
                  >
                    {/* Vinyl Grooves concentric rings */}
                    <div className="absolute inset-3 rounded-full border border-white/[0.04]" />
                    <div className="absolute inset-8 rounded-full border border-white/[0.04]" />
                    <div className="absolute inset-14 rounded-full border border-white/[0.04]" />
                    <div className="absolute inset-20 rounded-full border border-white/[0.05]" />

                    {/* Center Album Artwork Sticker */}
                    <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-gray-900 shadow-inner">
                      <img
                        src={displayArtwork}
                        alt="Album Label"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-gray-950 border-2 border-white/40" />
                    </div>
                  </div>

                  {/* Pulsing visualizer glow when playing */}
                  {isPlaying && (
                    <div className="absolute inset-0 rounded-full border-2 border-orange-500/40 animate-ping pointer-events-none opacity-40" />
                  )}
                </div>

                {/* Now Playing Title & Animated Frequency Equalizer */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1.5 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                      <Headphones className="w-3 h-3 text-orange-400" />
                      {isPlaying ? 'Now Auditioning' : 'Track Preview'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white truncate px-2">
                    {activeTrack?.trackName || 'Select a track to play'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {activeTrack?.artistName || composerName}
                  </p>

                  {/* 7-Bar CSS Audio Visualizer */}
                  <div className="flex items-end justify-center gap-1.5 h-6 pt-1">
                    {[0.6, 1.2, 0.4, 0.9, 1.5, 0.7, 1.1].map((speed, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full bg-gradient-to-t from-orange-500 to-amber-300 transition-all ${
                          isPlaying ? 'animate-bounce' : 'h-1 opacity-30'
                        }`}
                        style={{
                          height: isPlaying ? `${Math.max(8, (i % 4) * 6 + 10)}px` : '4px',
                          animationDuration: `${speed}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Audio Seek Bar & Time Display */}
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min={0}
                    max={duration || 30}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>{formatSeconds(currentTime)}</span>
                    <span className="text-orange-400/80">30s Preview</span>
                    <span>{formatSeconds(duration)}</span>
                  </div>
                </div>

                {/* Player Controls Deck */}
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={`p-2 rounded-lg transition ${
                      isShuffle ? 'text-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Toggle Shuffle"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePrevTrack}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition"
                    title="Previous Track"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  {/* Primary Play/Pause Orb */}
                  <button
                    onClick={toggleMasterPlay}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white grid place-items-center shadow-lg shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-1" />
                    )}
                  </button>

                  <button
                    onClick={handleNextTrack}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition"
                    title="Next Track"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setIsRepeat(!isRepeat)}
                    className={`p-2 rounded-lg transition ${
                      isRepeat ? 'text-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Toggle Repeat"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* Volume Deck */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center gap-3">
                  <button
                    onClick={toggleMute}
                    className="text-slate-400 hover:text-white transition"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-orange-400" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="text-[11px] font-mono text-slate-500 w-8 text-right">
                    {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Composer & Score Insights Spotlight */}
            <Card className="bg-gray-900/60 border-white/[0.08] backdrop-blur-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 grid place-items-center shrink-0">
                  <Disc3 className="w-6 h-6 text-orange-400" />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                    Cinema Sound Architecture
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">{composerName}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Featuring authentic orchestral arrangements and thematic leitmotifs tailored for {media?.title}.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT 8-COL: High-Density Studio Track Matrix */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-6">
            {/* Explorer Bar: Search & Multi-Album Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gray-900/60 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Filter tracks by title, composer, theme..."
                  value={trackSearch}
                  onChange={(e) => setTrackSearch(e.target.value)}
                  className="pl-9 bg-black/40 border-white/10 text-xs rounded-xl h-9 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                  {filteredTracks.length} {filteredTracks.length === 1 ? 'Track' : 'Tracks'}
                </span>
                {trackSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTrackSearch('')}
                    className="h-8 text-xs text-slate-400 hover:text-white"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>

            {/* Tracklist High-Density Table / List */}
            {loadingTracks ? (
              <div className="py-20 text-center space-y-3 bg-gray-900/40 rounded-3xl border border-white/[0.06]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto" />
                <p className="text-xs text-slate-400">Loading licensed motion picture master recordings...</p>
              </div>
            ) : filteredTracks.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-gray-900/40 rounded-3xl border border-white/[0.06] p-8">
                <Music2 className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No tracks match your query</h3>
                <p className="text-xs text-slate-400">
                  Try adjusting your search keywords or clear the filter to view all tracks.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTrackSearch('')}
                  className="text-xs border-white/10"
                >
                  Reset Search
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTracks.map((track, idx) => {
                  const isCurrent = activeTrack?.id === track.id;
                  const isCurrentPlaying = isCurrent && isPlaying;
                  const originalIndex = soundtrackData.tracks.findIndex((t) => t.id === track.id);

                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrackAtIndex(originalIndex >= 0 ? originalIndex : idx)}
                      className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-gradient-to-r from-orange-500/15 via-gray-900/80 to-gray-900/90 border-orange-500/50 shadow-lg shadow-orange-500/10'
                          : 'bg-gray-900/50 border-white/[0.07] hover:border-white/20 hover:bg-gray-900/80'
                      }`}
                    >
                      {/* Left: Play Icon / Track Number & Titles */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <button
                          type="button"
                          className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 transition ${
                            isCurrentPlaying
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40'
                              : isCurrent
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                              : 'bg-white/[0.06] text-slate-400 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-md'
                          }`}
                        >
                          {isCurrentPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500">
                              #{String(track.trackNumber || idx + 1).padStart(2, '0')}
                            </span>
                            <h4
                              className={`text-sm font-bold truncate transition-colors ${
                                isCurrent ? 'text-orange-400' : 'text-white group-hover:text-orange-300'
                              }`}
                            >
                              {track.trackName}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {track.artistName} {track.collectionName ? `• ${track.collectionName}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right: Audio Preview Badge & Duration & Links */}
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {isCurrentPlaying && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-orange-400">
                            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                            Playing
                          </span>
                        )}

                        {track.previewUrl && (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400">
                            30s Preview
                          </span>
                        )}

                        {track.trackTimeMillis && (
                          <span className="text-xs font-mono text-slate-400">
                            {Math.floor(track.trackTimeMillis / 60000)}:
                            {String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}
                          </span>
                        )}

                        {track.trackViewUrl && (
                          <a
                            href={track.trackViewUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-slate-500 hover:text-orange-400 hover:bg-white/[0.05] rounded-lg transition"
                            title="Open in Apple Music"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM RAIL: Iconic Motion Picture Soundtracks Carousel */}
        {featuredSoundtracks.length > 0 && (
          <div className="pt-10 border-t border-white/[0.08] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  Iconic Master Soundtracks & Scores
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Explore benchmark film scores by world-renowned composers
                </p>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                <Link to="/music">
                  Soundtrack Hub <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {featuredSoundtracks.map((album) => (
                <div
                  key={album.id}
                  onClick={() => {
                    MusicApi.searchMovieSoundtrack(album.collectionName, album.artistName).then((res) => {
                      if (res.tracks.length > 0) {
                        setSoundtrackData({
                          albums: res.albums,
                          tracks: res.tracks,
                          primaryItem: null,
                        });
                        playTrackAtIndex(0);
                        toast.success(`Loaded: ${album.collectionName}`);
                      }
                    });
                  }}
                  className="group cursor-pointer rounded-2xl bg-gray-900/60 border border-white/[0.08] hover:border-orange-500/40 p-2.5 transition-all flex flex-col justify-between"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-black relative mb-2">
                    <img
                      src={album.artworkUrl}
                      alt={album.collectionName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-orange-500 text-white grid place-items-center shadow-lg">
                        <Play className="w-4 h-4 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                      {album.collectionName}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {album.artistName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Embedded rotating vinyl CSS */}
      <style>{`
        @keyframes vinylSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotate-animation {
          animation: vinylSpin 7s linear infinite;
        }
      `}</style>
    </div>
  );
}


