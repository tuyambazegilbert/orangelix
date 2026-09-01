/**
 * OrangeFlix Global Floating Mini-Player Context
 * Allows videos to float and keep playing across any page or tab
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ActiveMediaSession {
  id: string;
  title: string;
  poster?: string | null;
  backdropUrl?: string | null;
  videoUrl?: string | null;
  youtubeVideoId?: string | null;
  country?: string;
  duration?: number;
  currentTime: number;
  isPlaying: boolean;
}

interface MiniPlayerContextType {
  activeSession: ActiveMediaSession | null;
  isMiniPlayerOpen: boolean;
  openMiniPlayer: (session: Partial<ActiveMediaSession> & { id: string; title: string }) => void;
  closeMiniPlayer: () => void;
  updateSession: (update: Partial<ActiveMediaSession>) => void;
  togglePlay: () => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextType | undefined>(undefined);

export const MiniPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<ActiveMediaSession | null>(null);
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false);

  const openMiniPlayer = useCallback(
    (session: Partial<ActiveMediaSession> & { id: string; title: string }) => {
      setActiveSession((prev) => ({
        id: session.id,
        title: session.title,
        poster: session.poster || prev?.poster || null,
        backdropUrl: session.backdropUrl || prev?.backdropUrl || null,
        videoUrl: session.videoUrl || prev?.videoUrl || null,
        youtubeVideoId: session.youtubeVideoId || prev?.youtubeVideoId || null,
        country: session.country || prev?.country || undefined,
        duration: session.duration || prev?.duration || 0,
        currentTime: session.currentTime ?? prev?.currentTime ?? 0,
        isPlaying: session.isPlaying ?? true,
      }));
      setIsMiniPlayerOpen(true);
    },
    []
  );

  const closeMiniPlayer = useCallback(() => {
    setIsMiniPlayerOpen(false);
    setActiveSession((prev) => (prev ? { ...prev, isPlaying: false } : null));
  }, []);

  const updateSession = useCallback((update: Partial<ActiveMediaSession>) => {
    setActiveSession((prev) => (prev ? { ...prev, ...update } : null));
  }, []);

  const togglePlay = useCallback(() => {
    setActiveSession((prev) => (prev ? { ...prev, isPlaying: !prev.isPlaying } : null));
  }, []);

  return (
    <MiniPlayerContext.Provider
      value={{
        activeSession,
        isMiniPlayerOpen,
        openMiniPlayer,
        closeMiniPlayer,
        updateSession,
        togglePlay,
      }}
    >
      {children}
    </MiniPlayerContext.Provider>
  );
};

export function useMiniPlayer() {
  const context = useContext(MiniPlayerContext);
  if (!context) {
    throw new Error('useMiniPlayer must be used within a MiniPlayerProvider');
  }
  return context;
}

