import { useGoogleOneTap } from '@/hooks/use-google-one-tap';
import { User } from '@/types';

interface GoogleOneTapProps {
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export default function GoogleOneTap({ onSuccess, onError, disabled }: GoogleOneTapProps) {
  useGoogleOneTap({ onSuccess, onError, disabled });
  return null;
}

