/**
 * OrangeFlix Floating Mini-Player
 * Floats in the corner of the screen allowing seamless multi-tasking across pages.
 */

import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Play,
  Pause,
  Maximize2,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  PictureInPicture,
} from 'lucide-react';
import { useMiniPlayer } from '@/contexts/MiniPlayerContext';
import { Badge } from '@/components/ui/badge';

export default function FloatingMiniPlayer() {
  const { activeSession, isMiniPlayerOpen, closeMiniPlayer, updateSession, togglePlay } = useMiniPlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);

  // If user is currently on the watch page for this title, hide the floating mini-player to prevent duplicates
  const isCurrentlyOnWatchPage =
    location.pathname.includes('/watch/') || location.pathname.includes('/movies/');

  useEffect(() => {
    if (!videoRef.current || !activeSession) return;
    if (activeSession.isPlaying) {
      void videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [activeSession?.isPlaying]);

  if (!isMiniPlayerOpen || !activeSession || isCurrentlyOnWatchPage) {
    return null;
  }

  const handleExpand = () => {
    if (activeSession.id.startsWith('geo-')) {
      const slug = activeSession.id.replace(/^geo-/, '');
      navigate(`/${activeSession.country?.toLowerCase() || 'rw'}/movies/${slug}`);
    } else {
      navigate(`/watch/${activeSession.id}`);
    }
  };

  const handleNativePiP = async () => {
    try {
      if (videoRef.current && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      }
    } catch (err) {
      console.warn('[FloatingMiniPlayer] Native PiP notice:', err);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 w-72 sm:w-84 md:w-96 rounded-2xl overflow-hidden border border-orange-500/40 bg-[#090d16]/95 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-all duration-300 animate-in slide-in-from-bottom-5">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-black/80 to-transparent border-b border-white/[.08]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[9px] px-1.5 py-0">
            OrangeFlix Pop-Up
          </Badge>
          <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[180px]">
            {activeSession.title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleNativePiP}
            className="w-6 h-6 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Float over other apps (WhatsApp, etc.)"
          >
            <PictureInPicture className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExpand}
            className="w-6 h-6 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Expand to Full Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={closeMiniPlayer}
            className="w-6 h-6 rounded-lg hover:bg-red-500/20 text-slate-300 hover:text-red-400 flex items-center justify-center transition"
            title="Close Pop-up"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Content */}
      <div className="relative aspect-video w-full bg-black group/mini">
        {activeSession.videoUrl ? (
          <video
            ref={videoRef}
            src={activeSession.videoUrl}
            poster={activeSession.poster || activeSession.backdropUrl || undefined}
            className="w-full h-full object-contain"
            onTimeUpdate={(e) => {
              updateSession({ currentTime: e.currentTarget.currentTime });
            }}
          />
        ) : activeSession.youtubeVideoId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${activeSession.youtubeVideoId}?autoplay=1&controls=0&modestbranding=1&rel=0`}
            title={activeSession.title}
            className="w-full h-full border-0 pointer-events-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="w-full h-full grid place-items-center bg-gray-900 text-slate-400 text-xs">
            {activeSession.poster && (
              <img
                src={activeSession.poster}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            )}
            <p className="relative z-10 font-medium">Playing on OrangeFlix</p>
          </div>
        )}

        {/* Floating Quick Action Overlay on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/mini:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
              }
            }}
            className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:scale-110 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/50 hover:scale-110 transition"
          >
            {activeSession.isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = videoRef.current.currentTime + 10;
              }
            }}
            className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:scale-110 transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

