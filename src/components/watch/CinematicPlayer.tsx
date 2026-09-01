import AdvancedCinematicPlayer from './AdvancedCinematicPlayer';

interface CinematicPlayerProps {
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

export default function CinematicPlayer(props: CinematicPlayerProps) {
  return <AdvancedCinematicPlayer {...props} />;
}
