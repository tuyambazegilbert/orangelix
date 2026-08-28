import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseEnabled } from '@/lib/firebase';
import { User } from '@/types';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: string;
          }) => void;
          prompt: (momentListener?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          cancel: () => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

interface UseGoogleOneTapOptions {
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export function useGoogleOneTap({ onSuccess, onError, disabled = false }: UseGoogleOneTapOptions = {}) {
  const { currentUser, loginWithGoogleOneTap, isLinkingAccount } = useAuth();

  const handlePrompt = useCallback(() => {
    if (disabled || currentUser || isLinkingAccount || !firebaseEnabled) {
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      // One Tap requires OAuth Web Client ID
      return;
    }

    const initOneTap = () => {
      if (!window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              try {
                const user = await loginWithGoogleOneTap(response.credential);
                if (user && onSuccess) {
                  onSuccess(user);
                }
              } catch (err) {
                if (onError) {
                  onError(err as Error);
                }
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
        });

        window.google.accounts.id.prompt();
      } catch (err) {
        console.warn('[Google One Tap] Initialization skipped:', err);
      }
    };

    // Load GIS script if not present
    if (!window.google?.accounts?.id) {
      const existingScript = document.getElementById('google-gsi-client');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initOneTap;
        document.head.appendChild(script);
      }
    } else {
      initOneTap();
    }
  }, [currentUser, disabled, isLinkingAccount, loginWithGoogleOneTap, onError, onSuccess]);

  useEffect(() => {
    handlePrompt();

    return () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch {
          // Ignore cancellation errors on unmount
        }
      }
    };
  }, [handlePrompt]);

  return { promptOneTap: handlePrompt };
}

