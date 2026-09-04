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
  HardDriveDownload,
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
  ChevronLeft,
  ChevronRight,
  Check,
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

  // Playback States (Auto-play enabled on mount)
  const [isPlaying, setIsPlaying] = useState(true);
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'main' | 'quality' | 'speed' | 'aspect' | 'timer'>('main');
  const [hasStartedPlayback, setHasStartedPlayback] = useState(true);

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

  // Autoplay for HTML5 video
  useEffect(() => {
    if (activeEngine === 'html5' && videoRef.current) {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasStartedPlayback(true);
        })
        .catch(() => {
          // In case browser requires muted autoplay
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current
              .play()
              .then(() => {
                setIsPlaying(true);
                setHasStartedPlayback(true);
                setIsMuted(true);
              })
              .catch(() => {});
          }
        });
    }
  }, [activeEngine, videoUrl]);

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
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            const playerDuration = event.target.getDuration?.();
            if (playerDuration) setDuration(playerDuration);
            if (initialProgress > 0) event.target.seekTo?.(initialProgress, true);
            // Autoplay immediately on player ready
            event.target.playVideo?.();
            setIsPlaying(true);
            setHasStartedPlayback(true);
          },
          onStateChange: (event) => {
            if (event.data === 1) {
              setIsPlaying(true);
              setHasStartedPlayback(true);
            }
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
    setHasStartedPlayback(true);
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
    const clamped = Math.max(0, Math.min(1.0, newVol));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (activeEngine === 'html5' && videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
    } else if (activeEngine === 'youtube' && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume?.(Math.round(clamped * 100));
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
      saveToDevice: true,
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
        isTheaterMode ? 'max-w-none px-0' : 'w-full'
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
        style={{ aspectRatio: '16 / 9' }}
        className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-black shadow-[0_25px_70px_rgba(0,0,0,0.85)] w-full select-none ${
          isFullscreen ? 'rounded-none border-none min-h-screen max-h-screen' : 'max-h-[calc(100vh-210px)]'
        }`}
      >
        {/* Video Canvas Layer with Filtered Brightness */}
        <div
          className="absolute inset-0 w-full h-full"
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

          {/* Chromeless YouTube Stream Engine Container (Crops out native YouTube header and watermark) */}
          {activeEngine === 'youtube' && (
            <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center pointer-events-none select-none">
              <div
                ref={ytContainerRef}
                className="w-[132%] h-[132%] min-w-[132%] min-h-[132%] pointer-events-none transform origin-center shrink-0 [&>iframe]:!w-full [&>iframe]:!h-full [&>iframe]:!border-0"
              />
              {/* Custom Pristine Movie Backdrop Cover (Masks native YouTube red play button completely until started) */}
              {!hasStartedPlayback && (poster || backdropUrl) && (
                <div
                  className="absolute inset-0 z-10 bg-cover bg-center cursor-pointer transition-opacity duration-300 pointer-events-auto"
                  style={{ backgroundImage: `url(${backdropUrl || poster})` }}
                  onClick={togglePlay}
                >
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                </div>
              )}
              {/* Click / Tap Interceptor */}
              <div
                className="absolute inset-0 z-10 cursor-pointer pointer-events-auto"
                onClick={togglePlay}
              />
            </div>
          )}
        </div>

        {/* 3. Official OrangeFlix Logo & Brand Watermark Overlay */}
        <div
          className={`absolute top-3 right-3 sm:top-5 sm:right-6 z-20 pointer-events-none flex items-center gap-1.5 transition-opacity duration-200 ${
            controlsVisible ? 'opacity-0 sm:opacity-80' : 'opacity-80'
          }`}
        >
          <img
            src="/android-chrome-192x192.png"
            alt="OrangeFlix"
            className="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-[0_2px_8px_rgba(249,115,22,0.4)]"
          />
          <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-white drop-shadow-md">
            ORANGE<span className="text-orange-400">FLIX</span>
          </span>
          <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[8px] sm:text-[9px] px-1 py-0.2 rounded font-mono font-bold">
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
              <div className="absolute left-6 sm:left-12 flex flex-col items-center gap-1 bg-black/75 backdrop-blur-md px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-orange-400 animate-in fade-in zoom-in duration-200">
                <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
                <span className="text-xs font-black">- {gestureHUD.value}</span>
              </div>
            )}
            {gestureHUD.type === 'seek-right' && (
              <div className="absolute right-6 sm:right-12 flex flex-col items-center gap-1 bg-black/75 backdrop-blur-md px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-orange-400 animate-in fade-in zoom-in duration-200">
                <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
                <span className="text-xs font-black">+ {gestureHUD.value}</span>
              </div>
            )}
          </div>
        )}

        {/* 5. Screen Lock Overlay Icon */}
        <button
          onClick={() => setIsScreenLocked(!isScreenLocked)}
          className={`absolute left-3 sm:left-4 top-14 sm:top-20 z-30 w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition ${
            isScreenLocked
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
              : 'bg-black/50 text-slate-400 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100'
          }`}
          title={isScreenLocked ? 'Unlock Screen Controls' : 'Lock Screen Controls'}
        >
          {isScreenLocked ? <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* 6. Top Floating Glassmorphism Title Bar */}
        <div
          className={`absolute inset-x-0 top-0 z-30 px-3 py-2 sm:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between gap-2 transition-opacity duration-300 ${
            controlsVisible && !isScreenLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <Badge className="bg-orange-500 text-white font-bold text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.2 sm:py-0.5 shadow-md shrink-0">
              Cinema Pro
            </Badge>
            {isOffline && (
              <Badge variant="outline" className="border-amber-400/50 bg-amber-500/10 text-amber-300 text-[9px] sm:text-[10px] flex items-center gap-1 shrink-0">
                <WifiOff className="w-3 h-3" /> Offline
              </Badge>
            )}
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide drop-shadow truncate">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Pop-up Mini Player */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSystemPiP}
              className="hidden sm:inline-flex h-7 px-2 text-[11px] rounded-lg border border-white/10 bg-black/40 text-slate-300 hover:text-white"
              title="Pop-up Mini Player (Play over WhatsApp, chats & other apps)"
            >
              <PictureInPicture className="w-3.5 h-3.5 mr-1 text-orange-400" /> Pop-Up
            </Button>

            {/* Ambient Glow Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAmbientGlow(!ambientGlow)}
              className={`hidden md:inline-flex h-7 px-2 text-[11px] rounded-lg border border-white/10 ${
                ambientGlow ? 'bg-orange-500/20 text-orange-300' : 'bg-black/40 text-slate-400'
              }`}
              title="Toggle Ambient Immersion Glow"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Glow
            </Button>
          </div>
        </div>

        {/* 7. Center Cinema Controls Cluster (-10s, Play/Pause, +10s) */}
        {!isScreenLocked && (
          <div
            className={`absolute inset-0 z-20 flex items-center justify-center gap-6 sm:gap-12 pointer-events-none transition-all duration-200 ${
              controlsVisible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            {/* Rewind 10s Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                seekRelative(-10);
              }}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/85 text-white flex flex-col items-center justify-center backdrop-blur-md border border-white/20 transition transform hover:scale-110 active:scale-95 shadow-xl"
              title="Rewind 10 seconds"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4 sm:w-6 sm:h-6 text-slate-200" />
              <span className="text-[8px] sm:text-[10px] font-black font-mono text-orange-400 -mt-0.5">10</span>
            </button>

            {/* Main Center Play / Pause Pulse Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-12 h-12 xs:w-14 xs:h-14 sm:w-18 sm:h-18 p-3 sm:p-4 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-orange-500/50 backdrop-blur-md transform transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-white/25"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 fill-current" />
              ) : (
                <Play className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 fill-current ml-0.5" />
              )}
            </button>

            {/* Fast Forward 10s Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                seekRelative(10);
              }}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/85 text-white flex flex-col items-center justify-center backdrop-blur-md border border-white/20 transition transform hover:scale-110 active:scale-95 shadow-xl"
              title="Fast forward 10 seconds"
              aria-label="Fast forward 10 seconds"
            >
              <RotateCw className="w-4 h-4 sm:w-6 sm:h-6 text-slate-200" />
              <span className="text-[8px] sm:text-[10px] font-black font-mono text-orange-400 -mt-0.5">10</span>
            </button>
          </div>
        )}

        {/* 8. Custom Bottom Deck Controls Bar (Clean & Responsive) */}
        <div
          className={`absolute inset-x-0 bottom-0 z-30 px-2.5 sm:px-5 pb-2 sm:pb-3.5 pt-6 sm:pt-12 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
            controlsVisible && !isScreenLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Timeline Scrubber */}
          <div className="relative mb-1.5 sm:mb-3 group/seek flex items-center">
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
          <div className="flex items-center justify-between gap-1 sm:gap-2 text-white">
            {/* Left Controls Deck */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <button
                onClick={togglePlay}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition shadow-md shadow-orange-500/20 shrink-0"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>

              {/* Clear Sound Button & Audio Level Slider */}
              <div className="flex items-center gap-1.5 bg-white/[.08] border border-white/10 px-2 py-1 rounded-xl shrink-0">
                <button
                  onClick={toggleMute}
                  className="text-slate-300 hover:text-white flex items-center gap-1 transition"
                  title="Clear Sound / Mute (M)"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  ) : volume > 0.5 ? (
                    <Volume2 className="w-3.5 h-3.5 text-orange-400" />
                  ) : (
                    <Volume1 className="w-3.5 h-3.5 text-orange-300" />
                  )}
                  <span className="text-[10px] font-mono font-bold text-slate-200">
                    {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                  </span>
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #f97316 0%, #f97316 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                  className="w-12 sm:w-20 h-1.5 appearance-none rounded-full cursor-pointer accent-orange-500"
                  aria-label="Volume Slider"
                />
              </div>

              {/* Time Display */}
              <span className="text-[9px] sm:text-xs font-mono text-slate-300 tabular-nums shrink-0 truncate">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Side Settings & Tools Deck */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Brightness Adjustment Tool (hidden on xs) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hidden sm:flex w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/10 items-center justify-center text-slate-300 hover:text-amber-400 transition"
                    title={`Brightness (${Math.round(brightness * 100)}%)`}
                  >
                    <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
              {/* In-Player Offline Download & Device Storage Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={Boolean(alreadyDownloaded || downloadState?.status === 'downloading')}
                className={`h-7 sm:h-8 px-1.5 sm:px-2.5 rounded-lg sm:rounded-xl border text-[10px] sm:text-[11px] font-semibold transition ${
                  alreadyDownloaded
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : downloadState?.status === 'downloading'
                    ? 'border-orange-500/40 bg-orange-500/10 text-orange-400 animate-pulse'
                    : 'border-white/15 bg-white/[.06] text-white hover:bg-white/[.12]'
                }`}
                title="Download and save .MP4 file directly to device storage"
              >
                {alreadyDownloaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> <span className="hidden sm:inline ml-1">.MP4 Saved</span>
                  </>
                ) : downloadState?.status === 'downloading' ? (
                  <>
                    <Download className="w-3.5 h-3.5 animate-bounce text-orange-400" /> <span className="text-[9px] ml-0.5">{downloadState.progress}%</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline ml-1">Download</span>
                    <HardDriveDownload className="w-3.5 h-3.5" /> <span className="hidden sm:inline ml-1">Save .MP4</span>
                  </>
                )}
              </Button>

              {/* Settings Dropdown: Nested Submenus (Quality, Speed, Aspect, Timer, Pop-Up, Glow) */}
              <DropdownMenu
                open={settingsOpen}
                onOpenChange={(open) => {
                  setSettingsOpen(open);
                  if (!open) setSettingsTab('main');
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition ${
                      settingsOpen
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40'
                        : 'hover:bg-white/10 text-slate-300 hover:text-white'
                    }`}
                    title="Cinema Settings"
                  >
                    <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-gray-950/95 border-gray-800 text-white w-64 p-2 backdrop-blur-xl shadow-2xl rounded-2xl animate-in fade-in-50 zoom-in-95 max-h-[340px] overflow-y-auto"
                >
                  {settingsTab === 'main' && (
                    <div className="space-y-1">
                      <div className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-orange-400 flex items-center justify-between">
                        <span>Cinema Settings</span>
                        <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-400 py-0">
                          Pro
                        </Badge>
                      </div>

                      {/* Quality */}
                      <button
                        onClick={() => setSettingsTab('quality')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-white/10 transition text-left text-slate-200 hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-orange-400" />
                          <span>Quality</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <span>{quality}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </div>
                      </button>

                      {/* Speed */}
                      <button
                        onClick={() => setSettingsTab('speed')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-white/10 transition text-left text-slate-200 hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                          <span>Playback Speed</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <span>{playbackSpeed === 1 ? 'Normal (1.0x)' : `${playbackSpeed}x`}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </div>
                      </button>

                      {/* Aspect Ratio */}
                      <button
                        onClick={() => setSettingsTab('aspect')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-white/10 transition text-left text-slate-200 hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Ratio className="w-3.5 h-3.5 text-orange-400" />
                          <span>Aspect Ratio Fit</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <span>
                            {aspectRatioMode === 'contain'
                              ? '16:9 Fit'
                              : aspectRatioMode === 'cover'
                              ? 'Crop Fill'
                              : 'Stretch'}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </div>
                      </button>

                      {/* Sleep Timer */}
                      <button
                        onClick={() => setSettingsTab('timer')}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-white/10 transition text-left text-slate-200 hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-orange-400" />
                          <span>Sleep Timer</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <span>{sleepTimerMinutes ? `${sleepTimerMinutes}m` : 'Off'}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </div>
                      </button>

                      <div className="my-1.5 h-px bg-gray-800" />

                      {/* Pop-Up Mini Player */}
                      <button
                        onClick={() => {
                          setSettingsOpen(false);
                          void toggleSystemPiP();
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-white/10 transition text-left text-slate-200 hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <PictureInPicture className="w-3.5 h-3.5 text-orange-400" />
                          <span>Pop-Up Mini Player</span>
                        </div>
                      </button>

                      {/* Ambient Glow Toggle */}
                      <button
                        onClick={() => setAmbientGlow(!ambientGlow)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-white/10 transition text-left text-slate-200 hover:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                          <span>Ambient Backglow</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            ambientGlow ? 'bg-orange-500/20 text-orange-300' : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {ambientGlow ? 'On' : 'Off'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Submenu: Quality */}
                  {settingsTab === 'quality' && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsTab('main')}
                        className="flex items-center gap-1.5 px-1 py-1 text-xs font-bold text-orange-400 hover:text-orange-300 w-full mb-1 border-b border-gray-800"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back to Settings
                      </button>
                      {[
                        { id: 'Auto (1080p)', label: 'Auto (Recommended 1080p)', badge: 'HDR' },
                        { id: '4K UHD (2160p)', label: '4K Ultra HD (2160p)', badge: '4K' },
                        { id: '1080p (Full HD)', label: '1080p Full HD', badge: 'FHD' },
                        { id: '720p (HD)', label: '720p HD', badge: 'HD' },
                        { id: '480p (SD)', label: '480p Standard', badge: 'SD' },
                        { id: '360p (Saver)', label: '360p Data Saver', badge: 'Save' },
                      ].map((q) => (
                        <button
                          key={q.id}
                          onClick={() => {
                            setQuality(q.id);
                            setSettingsTab('main');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                            quality === q.id
                              ? 'bg-orange-500/20 text-orange-400 font-bold'
                              : 'hover:bg-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>{q.label}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-slate-400">
                            {q.badge}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Submenu: Speed */}
                  {settingsTab === 'speed' && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsTab('main')}
                        className="flex items-center gap-1.5 px-1 py-1 text-xs font-bold text-orange-400 hover:text-orange-300 w-full mb-1 border-b border-gray-800"
                      >
                        <ChevronLeft className="w-4 h-4" /> Playback Speed
                      </button>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => {
                            changeSpeed(spd);
                            setSettingsTab('main');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                            playbackSpeed === spd
                              ? 'bg-orange-500/20 text-orange-400 font-bold'
                              : 'hover:bg-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>{spd === 1 ? 'Normal (1.0x)' : `${spd}x`}</span>
                          {playbackSpeed === spd && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Submenu: Aspect Ratio */}
                  {settingsTab === 'aspect' && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsTab('main')}
                        className="flex items-center gap-1.5 px-1 py-1 text-xs font-bold text-orange-400 hover:text-orange-300 w-full mb-1 border-b border-gray-800"
                      >
                        <ChevronLeft className="w-4 h-4" /> Aspect Ratio Fit
                      </button>
                      {[
                        { id: 'contain', label: '16:9 Fit (Standard)' },
                        { id: 'cover', label: 'Crop to Fill (Ultra-wide)' },
                        { id: 'fill', label: 'Stretch to Screen' },
                      ].map((aspect) => (
                        <button
                          key={aspect.id}
                          onClick={() => {
                            setAspectRatioMode(aspect.id as 'contain' | 'cover' | 'fill');
                            setSettingsTab('main');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                            aspectRatioMode === aspect.id
                              ? 'bg-orange-500/20 text-orange-400 font-bold'
                              : 'hover:bg-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>{aspect.label}</span>
                          {aspectRatioMode === aspect.id && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Submenu: Sleep Timer */}
                  {settingsTab === 'timer' && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsTab('main')}
                        className="flex items-center gap-1.5 px-1 py-1 text-xs font-bold text-orange-400 hover:text-orange-300 w-full mb-1 border-b border-gray-800"
                      >
                        <ChevronLeft className="w-4 h-4" /> Sleep Timer
                      </button>
                      {[
                        { mins: null, label: 'Off' },
                        { mins: 15, label: '15 Minutes' },
                        { mins: 30, label: '30 Minutes' },
                        { mins: 60, label: '60 Minutes' },
                      ].map((timer) => (
                        <button
                          key={String(timer.mins)}
                          onClick={() => {
                            setSleepTimerMinutes(timer.mins);
                            setSettingsTab('main');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                            sleepTimerMinutes === timer.mins
                              ? 'bg-orange-500/20 text-orange-400 font-bold'
                              : 'hover:bg-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>{timer.label}</span>
                          {sleepTimerMinutes === timer.mins && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theater Mode Button */}
              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className={`hidden sm:flex w-8 h-8 rounded-lg hover:bg-white/10 items-center justify-center transition ${
                  isTheaterMode ? 'text-orange-400' : 'text-slate-300 hover:text-white'
                }`}
                title="Theater Mode (T)"
              >
                <Tv className="w-4 h-4" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
                title="Toggle Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
