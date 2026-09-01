/**
 * OrangeFlix Advanced Bespoke Cinema Video Player (Pro Edition)
 * - Official OrangeFlix Branding & Watermark
 * - Clear Sound Deck with Volume Indicator & Audio Boost
 * - In-Player Brightness Adjustment & HUD
 * - Smart Touch/Mouse Gesture Controls (Left = Brightness, Right = Volume, Double-tap = Seek)
 * - Native System Picture-in-Picture (PiP) (Floats over WhatsApp, browser tabs, other apps)
 * - Floating In-App Pop-up Mini Player
 * - Screen Lock (Touch Lock) & Sleep Timer
 * - Dynamic Ambient Immersion Backglow
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Download,
  CheckCircle2,
  Tv,
  Sparkles,
  WifiOff,
  Sun,
  Moon,
  Lock,
  Unlock,
  PictureInPicture,
  PictureInPicture2,
  Clock,
  Ratio,
  Zap,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOfflineDownloads } from '@/hooks/use-offline-downloads';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useMiniPlayer } from '@/contexts/MiniPlayerContext';

interface AdvancedCinematicPlayerProps {
  id?: string;
  title: string;
  poster?: string | null;
  backdropUrl?: string | null;
  videoUrl?: string | null;
  trailerKey?: string | null;
  youtubeVideoId?: string | null;
  country?: string;
  durationMinutes?: number;
  initialProgress?: number;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
}

// Global typing for YouTube Iframe API
interface YouTubePlayerInstance {
  destroy?: () => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume?: (volume: number) => void;
  mute?: () => void;
  unMute?: () => void;
  setPlaybackRate?: (rate: number) => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
  getVideoLoadedFraction?: () => number;
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, unknown>;
      events?: {
        onReady?: (event: { target: YouTubePlayerInstance }) => void;
        onStateChange?: (event: { data: number; target: YouTubePlayerInstance }) => void;
      };
    }
  ) => YouTubePlayerInstance;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function AdvancedCinematicPlayer({
  id = 'stream-title',
  title,
  poster,
  backdropUrl,
  videoUrl,
  trailerKey,
  youtubeVideoId,
  country,
  durationMinutes,
  initialProgress = 0,
  onProgress,
  onEnded,
}: AdvancedCinematicPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);

  const { isOffline } = useNetworkStatus();
  const { startDownload, isDownloaded, getDownloadProgress } = useOfflineDownloads();
  const { openMiniPlayer } = useMiniPlayer();

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [duration, setDuration] = useState(durationMinutes ? durationMinutes * 60 : 0);
  const [bufferedPercent, setBufferedPercent] = useState(0);

  // Pro Sound & Display Controls
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [brightness, setBrightness] = useState<number>(1.0); // 0.4 to 1.6
  const [aspectRatioMode, setAspectRatioMode] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [quality, setQuality] = useState<string>('Auto (1080p)');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isScreenLocked, setIsScreenLocked] = useState(false);

  // Gesture & HUD States
  const [gestureHUD, setGestureHUD] = useState<{
    type: 'volume' | 'brightness' | 'seek-left' | 'seek-right' | null;
    value?: number | string;
  }>({ type: null });
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const lastTapTime = useRef<number>(0);

  // Sleep Timer
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);

  // Engine Setup
  const [ytApiReady, setYtApiReady] = useState(false);
  const [activeEngine, setActiveEngine] = useState<'html5' | 'youtube'>('html5');

  const effectiveYoutubeId = youtubeVideoId || trailerKey || null;
  const isYoutubeSource = Boolean(!videoUrl && effectiveYoutubeId);

  const alreadyDownloaded = isDownloaded(id);
  const downloadState = getDownloadProgress(id);

  // 1. Initialize Engine
  useEffect(() => {
    if (videoUrl || isOffline) {
      setActiveEngine('html5');
    } else if (isYoutubeSource) {
      setActiveEngine('youtube');
    } else {
      setActiveEngine('html5');
    }
  }, [videoUrl, isYoutubeSource, isOffline]);

  // 2. Load YouTube Iframe API Dynamically for chromeless streaming
  useEffect(() => {
    if (activeEngine !== 'youtube' || !effectiveYoutubeId) return;

    if (window.YT && window.YT.Player) {
      setYtApiReady(true);
      return;
    }

    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setYtApiReady(true);
      };
    } else {
      const checkYt = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setYtApiReady(true);
          clearInterval(checkYt);
        }
      }, 100);
      return () => clearInterval(checkYt);
    }
  }, [activeEngine, effectiveYoutubeId]);

  // 3. Initialize Chromeless YouTube Player
  useEffect(() => {
    if (activeEngine !== 'youtube' || !ytApiReady || !effectiveYoutubeId || !ytContainerRef.current) return;

    try {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy?.();
      }

      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId: effectiveYoutubeId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            const playerDuration = event.target.getDuration?.();
            if (playerDuration) setDuration(playerDuration);
            if (initialProgress > 0) event.target.seekTo?.(initialProgress, true);
          },
          onStateChange: (event) => {
            if (event.data === 1) setIsPlaying(true);
            if (event.data === 2) setIsPlaying(false);
            if (event.data === 0) {
              setIsPlaying(false);
              onEnded?.();
            }
          },
        },
      });
    } catch (err) {
      console.warn('[AdvancedCinematicPlayer] YouTube player init notice:', err);
    }

    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy?.();
        } catch {
          // ignore
        }
      }
    };
  }, [activeEngine, ytApiReady, effectiveYoutubeId, initialProgress, onEnded]);

  // 4. Update Interval for YouTube Engine
  useEffect(() => {
    if (activeEngine !== 'youtube' || !isPlaying) return;

    const interval = setInterval(() => {
      if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
        const time = ytPlayerRef.current.getCurrentTime() || 0;
        const dur = ytPlayerRef.current.getDuration() || duration;
        const loaded = ytPlayerRef.current.getVideoLoadedFraction?.() || 0;

        setCurrentTime(time);
        if (dur) setDuration(dur);
        setBufferedPercent(Math.round(loaded * 100));

        if (Math.floor(time) % 10 === 0) {
          onProgress?.(time, dur);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activeEngine, isPlaying, duration, onProgress]);

  // 5. Hide Controls Timer
  useEffect(() => {
    if (!isPlaying || isScreenLocked) {
      if (!isScreenLocked) setControlsVisible(true);
      return;
    }
    const timeout = setTimeout(() => setControlsVisible(false), 3000);
    return () => clearTimeout(timeout);
  }, [isPlaying, controlsVisible, isScreenLocked]);

  // 6. Sleep Timer Handler
  useEffect(() => {
    if (!sleepTimerMinutes || !isPlaying) return;
    const timer = setTimeout(() => {
      if (videoRef.current) videoRef.current.pause();
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo?.();
      setIsPlaying(false);
      setSleepTimerMinutes(null);
    }, sleepTimerMinutes * 60 * 1000);

    return () => clearTimeout(timer);
  }, [sleepTimerMinutes, isPlaying]);

  // Playback Control Methods
  const togglePlay = useCallback(() => {
    if (isScreenLocked) return;
    if (activeEngine === 'html5' && videoRef.current) {
      if (videoRef.current.paused) {
        void videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    } else if (activeEngine === 'youtube' && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo?.();
      } else {
        ytPlayerRef.current.playVideo?.();
      }
    }
    setControlsVisible(true);
  }, [activeEngine, isPlaying, isScreenLocked]);

  const seekRelative = useCallback(
    (seconds: number) => {
      if (isScreenLocked) return;
      if (activeEngine === 'html5' && videoRef.current) {
        const target = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
        videoRef.current.currentTime = target;
        setCurrentTime(target);
      } else if (activeEngine === 'youtube' && ytPlayerRef.current) {
        const current = ytPlayerRef.current.getCurrentTime?.() || 0;
        const target = Math.max(0, Math.min(duration, current + seconds));
        ytPlayerRef.current.seekTo?.(target, true);
        setCurrentTime(target);
      }
      // Show HUD ripple
      setGestureHUD({ type: seconds < 0 ? 'seek-left' : 'seek-right', value: `${Math.abs(seconds)}s` });
      setTimeout(() => setGestureHUD({ type: null }), 600);
      setControlsVisible(true);
    },
    [activeEngine, duration, isScreenLocked]
  );

  const handleSeekChange = (value: number) => {
    if (isScreenLocked) return;
    setCurrentTime(value);
    if (activeEngine === 'html5' && videoRef.current) {
      videoRef.current.currentTime = value;
    } else if (activeEngine === 'youtube' && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo?.(value, true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1.5, newVol));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (activeEngine === 'html5' && videoRef.current) {
      videoRef.current.volume = Math.min(1, clamped);
      videoRef.current.muted = clamped === 0;
    } else if (activeEngine === 'youtube' && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume?.(Math.round(Math.min(1, clamped) * 100));
      if (clamped === 0) ytPlayerRef.current.mute?.();
      else ytPlayerRef.current.unMute?.();
    }
    setGestureHUD({ type: 'volume', value: `${Math.round(clamped * 100)}%` });
    setTimeout(() => setGestureHUD({ type: null }), 1200);
  };

  const toggleMute = () => {
    if (isMuted || volume === 0) {
      handleVolumeChange(volume || 0.8);
    } else {
      handleVolumeChange(0);
    }
  };

  const handleBrightnessChange = (val: number) => {
    const clamped = Math.max(0.4, Math.min(1.6, val));
    setBrightness(clamped);
    setGestureHUD({ type: 'brightness', value: `${Math.round(clamped * 100)}%` });
    setTimeout(() => setGestureHUD({ type: null }), 1200);
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (activeEngine === 'html5' && videoRef.current) {
      videoRef.current.playbackRate = speed;
    } else if (activeEngine === 'youtube' && ytPlayerRef.current) {
      ytPlayerRef.current.setPlaybackRate?.(speed);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Native System Picture-in-Picture (Floats over WhatsApp, desktop, other apps)
  const toggleSystemPiP = async () => {
    try {
      if (videoRef.current && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } else {
        // Fallback: Open in-app floating pop-up
        openMiniPlayer({
          id,
          title,
          poster,
          backdropUrl,
          videoUrl,
          youtubeVideoId: effectiveYoutubeId,
          country,
          duration,
          currentTime,
          isPlaying,
        });
      }
    } catch (err) {
      console.warn('[AdvancedCinematicPlayer] PiP toggle notice:', err);
    }
  };

  // In-App Corner Pop-Up Mini Player
  const triggerInAppPopUp = () => {
    openMiniPlayer({
      id,
      title,
      poster,
      backdropUrl,
      videoUrl,
      youtubeVideoId: effectiveYoutubeId,
      country,
      duration,
      currentTime,
      isPlaying,
    });
  };

  const handleDownload = () => {
    void startDownload({
      id,
      title,
      mediaType: 'movie',
      posterUrl: poster || undefined,
      backdropUrl: backdropUrl || undefined,
      duration: durationMinutes,
      country,
      videoUrl: videoUrl || undefined,
      youtubeVideoId: effectiveYoutubeId || undefined,
    });
  };

  // Touch Gesture Handling (Left = Brightness, Right = Volume, Double-tap = Seek)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isScreenLocked) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isScreenLocked || touchStartY.current === null || touchStartX.current === null || !containerRef.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY.current - currentY;
    const rect = containerRef.current.getBoundingClientRect();
    const isLeftSide = touchStartX.current < rect.left + rect.width / 2;

    if (Math.abs(deltaY) > 8) {
      const step = deltaY / 400;
      if (isLeftSide) {
        // Adjust Brightness
        handleBrightnessChange(brightness + step);
      } else {
        // Adjust Volume
        handleVolumeChange(volume + step);
      }
      touchStartY.current = currentY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isScreenLocked) return;
    touchStartY.current = null;
    const now = Date.now();
    const isDoubleTap = now - lastTapTime.current < 300;
    lastTapTime.current = now;

    if (isDoubleTap && containerRef.current) {
      const touchX = e.changedTouches[0].clientX;
      const rect = containerRef.current.getBoundingClientRect();
      if (touchX < rect.left + rect.width / 2) {
        seekRelative(-10);
      } else {
        seekRelative(10);
      }
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          void toggleSystemPiP();
          break;
        case 'j':
        case 'J':
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'l':
        case 'L':
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setIsTheaterMode((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seekRelative, volume, isMuted, isScreenLocked]);

  return (
    <div
      className={`relative w-full transition-all duration-500 ${
        isTheaterMode ? 'max-w-none px-0' : 'max-w-6xl mx-auto'
      }`}
    >
      {/* 1. Dynamic Ambient Immersion Backglow */}
      {ambientGlow && (
        <div
          className="pointer-events-none absolute -inset-4 sm:-inset-8 rounded-3xl opacity-40 blur-3xl transition-all duration-700 -z-10"
          style={{
            background: isPlaying
              ? 'radial-gradient(circle, rgba(249, 115, 22, 0.45) 0%, rgba(139, 92, 246, 0.25) 50%, transparent 80%)'
              : 'radial-gradient(circle, rgba(249, 115, 22, 0.2) 0%, transparent 70%)',
          }}
        />
      )}

      {/* 2. Master Cinema Player Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseMove={() => !isScreenLocked && setControlsVisible(true)}
        onMouseLeave={() => isPlaying && !isScreenLocked && setControlsVisible(false)}
        className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-black shadow-[0_25px_70px_rgba(0,0,0,0.85)] aspect-video w-full select-none ${
          isFullscreen ? 'rounded-none border-none' : ''
        }`}
      >
        {/* Video Canvas Layer with Filtered Brightness */}
        <div
          className="w-full h-full"
          style={{
            filter: `brightness(${brightness})`,
          }}
        >
          {/* HTML5 Native Video Engine */}
          {activeEngine === 'html5' && (
            <video
              ref={videoRef}
              src={videoUrl || undefined}
              poster={poster || backdropUrl || undefined}
              className={`w-full h-full ${
                aspectRatioMode === 'cover'
                  ? 'object-cover'
                  : aspectRatioMode === 'fill'
                  ? 'object-fill'
                  : 'object-contain'
              } cursor-pointer`}
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => {
                const node = e.currentTarget;
                setCurrentTime(node.currentTime);
                if (node.duration) setDuration(node.duration);
                if (Math.floor(node.currentTime) % 10 === 0) {
                  onProgress?.(node.currentTime, node.duration);
                }
              }}
              onProgress={(e) => {
                const node = e.currentTarget;
                if (node.buffered.length > 0) {
                  const bufferedEnd = node.buffered.end(node.buffered.length - 1);
                  setBufferedPercent(Math.round((bufferedEnd / (node.duration || 1)) * 100));
                }
              }}
              onEnded={() => {
                setIsPlaying(false);
                onEnded?.();
              }}
            />
          )}

          {/* Chromeless YouTube Stream Engine Container */}
          {activeEngine === 'youtube' && (
            <div className="relative w-full h-full pointer-events-none">
              <div ref={ytContainerRef} className="w-full h-full pointer-events-none scale-105" />
              {/* Click Interceptor for custom play/pause */}
              <div
                className="absolute inset-0 z-10 cursor-pointer pointer-events-auto"
                onClick={togglePlay}
              />
            </div>
          )}
        </div>

        {/* 3. Official OrangeFlix Logo & Brand Watermark Overlay */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20 pointer-events-none flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/40">
            <span className="font-black text-xs">O</span>
          </div>
          <span className="text-[11px] font-black tracking-widest text-white drop-shadow-md">
            ORANGE<span className="text-orange-500">FLIX</span>
          </span>
          <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[9px] px-1 py-0.2 rounded font-mono font-bold">
            4K HDR
          </span>
        </div>

        {/* 4. Gesture HUD Overlays (Volume, Brightness & Seek Ripples) */}
        {gestureHUD.type && (
          <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
            {gestureHUD.type === 'volume' && (
              <div className="flex flex-col items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-2xl animate-in zoom-in-90 duration-150">
                <Volume2 className="w-8 h-8 text-orange-400" />
                <span className="text-sm font-bold text-white">Volume: {gestureHUD.value}</span>
              </div>
            )}
            {gestureHUD.type === 'brightness' && (
              <div className="flex flex-col items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-2xl animate-in zoom-in-90 duration-150">
                <Sun className="w-8 h-8 text-amber-400" />
                <span className="text-sm font-bold text-white">Brightness: {gestureHUD.value}</span>
              </div>
            )}
            {gestureHUD.type === 'seek-left' && (
              <div className="absolute left-12 flex flex-col items-center gap-1 bg-black/75 backdrop-blur-md px-5 py-3 rounded-2xl text-orange-400 animate-in fade-in zoom-in duration-200">
                <RotateCcw className="w-7 h-7 animate-spin" />
                <span className="text-xs font-black">- {gestureHUD.value}</span>
              </div>
            )}
            {gestureHUD.type === 'seek-right' && (
              <div className="absolute right-12 flex flex-col items-center gap-1 bg-black/75 backdrop-blur-md px-5 py-3 rounded-2xl text-orange-400 animate-in fade-in zoom-in duration-200">
                <RotateCw className="w-7 h-7 animate-spin" />
                <span className="text-xs font-black">+ {gestureHUD.value}</span>
              </div>
            )}
          </div>
        )}

        {/* 5. Screen Lock Overlay Icon */}
        <button
          onClick={() => setIsScreenLocked(!isScreenLocked)}
          className={`absolute left-4 top-16 sm:top-20 z-30 w-8 h-8 rounded-xl flex items-center justify-center transition ${
            isScreenLocked
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
              : 'bg-black/50 text-slate-400 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100'
          }`}
          title={isScreenLocked ? 'Unlock Screen Controls' : 'Lock Screen Controls'}
        >
          {isScreenLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>

        {/* 6. Top Floating Glassmorphism Title Bar */}
        <div
          className={`absolute inset-x-0 top-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
            controlsVisible && !isScreenLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-500/90 text-white font-bold text-[10px] px-2 py-0.5 shadow-md">
              Cinema Pro
            </Badge>
            {isOffline && (
              <Badge variant="outline" className="border-amber-400/50 bg-amber-500/10 text-amber-300 text-[10px] flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Offline Mode
              </Badge>
            )}
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide drop-shadow truncate max-w-xs sm:max-w-md">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Pop-up Mini Player (Allows playing while chatting on WhatsApp or browsing) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSystemPiP}
              className="h-7 px-2 text-[11px] rounded-lg border border-white/10 bg-black/40 text-slate-300 hover:text-white"
              title="Pop-up Mini Player (Play over WhatsApp, chats & other apps)"
            >
              <PictureInPicture className="w-3.5 h-3.5 mr-1 text-orange-400" /> Pop-Up
            </Button>

            {/* Ambient Glow Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAmbientGlow(!ambientGlow)}
              className={`h-7 px-2 text-[11px] rounded-lg border border-white/10 ${
                ambientGlow ? 'bg-orange-500/20 text-orange-300' : 'bg-black/40 text-slate-400'
              }`}
              title="Toggle Ambient Immersion Glow"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Glow
            </Button>
          </div>
        </div>

        {/* 7. Center Glowing Play/Pause Pulse Button */}
        {!isScreenLocked && (
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-orange-500/50 backdrop-blur-md transform transition-all duration-300 hover:scale-110 ${
              isPlaying ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
            ) : (
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
            )}
          </button>
        )}

        {/* 8. Custom Bottom Deck Controls Bar */}
        <div
          className={`absolute inset-x-0 bottom-0 z-30 px-4 pb-4 pt-16 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
            controlsVisible && !isScreenLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Timeline Scrubber */}
          <div className="relative mb-3.5 group/seek flex items-center">
            {/* Buffered Bar */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-white/20 rounded-full pointer-events-none"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Active Played Bar */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full pointer-events-none"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            {/* Interactive Range Input */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeekChange(Number(e.target.value))}
              className="w-full h-2 appearance-none bg-transparent cursor-pointer relative z-10 accent-orange-500 focus:outline-none"
              aria-label="Seek Video Timeline"
            />
          </div>

          {/* Controls Lower Row */}
          <div className="flex items-center justify-between gap-2 text-white">
            {/* Left Controls Deck */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition shadow-md shadow-orange-500/20"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => seekRelative(-10)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
                title="Rewind 10 seconds (J / ←)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => seekRelative(10)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
                title="Fast forward 10 seconds (L / →)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Clear Sound Button & Audio Level Slider */}
              <div className="flex items-center gap-1.5 bg-white/[.06] border border-white/10 px-2 py-1 rounded-xl">
                <button
                  onClick={toggleMute}
                  className="text-slate-300 hover:text-white flex items-center gap-1"
                  title="Clear Sound / Mute (M)"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : volume > 0.6 ? (
                    <Volume2 className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Volume1 className="w-4 h-4 text-orange-300" />
                  )}
                  <span className="text-[10px] font-mono font-bold text-slate-200">
                    {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                  </span>
                </button>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-12 sm:w-16 h-1 appearance-none bg-white/20 rounded-full cursor-pointer accent-orange-500"
                  aria-label="Volume Slider"
                />
              </div>

              {/* Time Display */}
              <span className="text-[11px] sm:text-xs font-mono text-slate-300 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Side Settings & Tools Deck */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Brightness Adjustment Tool */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-amber-400 transition"
                    title={`Brightness (${Math.round(brightness * 100)}%)`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900/95 border-gray-800 text-white w-48 p-3 backdrop-blur-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                    <span>Brightness</span>
                    <span>{Math.round(brightness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={1.6}
                    step={0.05}
                    value={brightness}
                    onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                    className="w-full h-1.5 appearance-none bg-white/20 rounded-full cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between gap-1 pt-1">
                    {[0.6, 1.0, 1.3].map((b) => (
                      <button
                        key={b}
                        onClick={() => handleBrightnessChange(b)}
                        className={`text-[10px] px-2 py-0.5 rounded border border-white/10 ${
                          brightness === b ? 'bg-amber-500 text-black font-bold' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {b === 0.6 ? 'Cinema' : b === 1.0 ? 'Standard' : 'Vivid'}
                      </button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* In-Player Offline Download Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={Boolean(alreadyDownloaded || downloadState?.status === 'downloading')}
                className={`h-8 px-2.5 rounded-xl border text-[11px] font-semibold transition ${
                  alreadyDownloaded
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : downloadState?.status === 'downloading'
                    ? 'border-orange-500/40 bg-orange-500/10 text-orange-400 animate-pulse'
                    : 'border-white/15 bg-white/[.06] text-white hover:bg-white/[.12]'
                }`}
                title="Download for Offline Playback"
              >
                {alreadyDownloaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Downloaded
                  </>
                ) : downloadState?.status === 'downloading' ? (
                  <>
                    <Download className="w-3.5 h-3.5 mr-1 animate-bounce" /> {downloadState.progress}%
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 mr-1" /> Download
                  </>
                )}
              </Button>

              {/* Settings Dropdown: Speed, Quality, Sleep Timer, Aspect Ratio */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
                    title="Cinema Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900/95 border-gray-800 text-white w-52 backdrop-blur-xl">
                  <DropdownMenuLabel className="text-xs text-orange-400">Playback Speed</DropdownMenuLabel>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <DropdownMenuItem
                      key={spd}
                      onClick={() => changeSpeed(spd)}
                      className={`text-xs cursor-pointer ${playbackSpeed === spd ? 'font-bold text-orange-400' : ''}`}
                    >
                      {spd === 1 ? 'Normal (1.0x)' : `${spd}x`}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuLabel className="text-xs text-orange-400">Aspect Ratio Fit</DropdownMenuLabel>
                  {[
                    { id: 'contain', label: '16:9 Fit (Standard)' },
                    { id: 'cover', label: 'Crop to Fill (Ultra-wide)' },
                    { id: 'fill', label: 'Stretch to Screen' },
                  ].map((aspect) => (
                    <DropdownMenuItem
                      key={aspect.id}
                      onClick={() => setAspectRatioMode(aspect.id as 'contain' | 'cover' | 'fill')}
                      className={`text-xs cursor-pointer ${aspectRatioMode === aspect.id ? 'font-bold text-orange-400' : ''}`}
                    >
                      {aspect.label}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuLabel className="text-xs text-orange-400">Sleep Timer</DropdownMenuLabel>
                  {[
                    { mins: null, label: 'Off' },
                    { mins: 15, label: '15 Minutes' },
                    { mins: 30, label: '30 Minutes' },
                    { mins: 60, label: '60 Minutes' },
                  ].map((timer) => (
                    <DropdownMenuItem
                      key={String(timer.mins)}
                      onClick={() => setSleepTimerMinutes(timer.mins)}
                      className={`text-xs cursor-pointer ${sleepTimerMinutes === timer.mins ? 'font-bold text-orange-400' : ''}`}
                    >
                      {timer.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Pop-up Video Mini Player Trigger */}
              <button
                onClick={triggerInAppPopUp}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
                title="Dock to Floating Mini Player"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>

              {/* Theater Mode Button */}
              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition ${
                  isTheaterMode ? 'text-orange-400' : 'text-slate-300 hover:text-white'
                }`}
                title="Theater Mode (T)"
              >
                <Tv className="w-4 h-4" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
                title="Toggle Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
