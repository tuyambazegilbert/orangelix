import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuthCredential,
  confirmPasswordReset as fbConfirmPasswordReset,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { AuthContextType, User } from '@/types';
import { AuthService } from '@/lib/auth';
import { firebaseAuth, firebaseEnabled } from '@/lib/firebase';
import { FirebaseData } from '@/lib/firebase-data';
import { EmailService } from '@/services/email-service';

const defaultAuthContext: AuthContextType = {
  currentUser: null,
  isLoading: false,
  login: async () => null,
  loginWithGoogle: async () => null,
  register: async () => null,
  logout: () => {},
  resetPassword: async () => false,
  confirmPasswordReset: async () => false,
  isLinkingAccount: false,
  pendingLinkEmail: null,
  linkAccountWithPassword: async () => null,
  cancelAccountLinking: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Account linking state (for auth/account-exists-with-different-credential)
  const [pendingCredential, setPendingCredential] = useState<AuthCredential | null>(null);
  const [pendingLinkEmail, setPendingLinkEmail] = useState<string | null>(null);
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);

  useEffect(() => {
    if (firebaseEnabled && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        if (!fbUser) {
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }

        try {
          // Canonical UID identity lookup & metadata touch
          const resolvedUser = await FirebaseData.ensureUserProfile(fbUser);
          setCurrentUser(resolvedUser);
        } catch (err) {
          console.warn('[Auth] Firestore profile sync failed, falling back to Firebase Auth identity:', err);
          const fallbackUser: User = {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'OrangeFlix Member',
            isAdmin: false,
            role: 'member',
            photoURL: fbUser.photoURL || '',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };
          setCurrentUser(fallbackUser);
        } finally {
          setIsLoading(false);
        }
      });
      return () => unsubscribe();
    }

    // Local authentication fallback for dev environments only when Firebase is unavailable
    setCurrentUser(AuthService.getCurrentUser());
    setIsLoading(false);
    return undefined;
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      if (firebaseEnabled && firebaseAuth) {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const user = await FirebaseData.ensureUserProfile(credential.user);
        setCurrentUser(user);
        return user;
      }

      // Local fallback
      const ok = await AuthService.login(email, password);
      if (ok) {
        const localUser = AuthService.getCurrentUser();
        setCurrentUser(localUser);
        return localUser;
      }
      return null;
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('[Auth Login Error]', error.code, error.message);
      throw err;
    }
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    if (!firebaseEnabled || !firebaseAuth) {
      // Local fallback
      const localUser: User = {
        id: 'google-local-dev-user',
        email: 'google.user@example.com',
        name: 'Google Member',
        isAdmin: false,
        role: 'member',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      setCurrentUser(localUser);
      return localUser;
    }

    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const credential = await signInWithPopup(firebaseAuth, provider);
      const user = await FirebaseData.ensureUserProfile(credential.user);
      if (user.isNewUser && user.email) {
        void EmailService.sendWelcomeEmail({ email: user.email, name: user.name });
      }
      setCurrentUser(user);
      return user;
    } catch (err: unknown) {
      const error = err as {
        code?: string;
        message?: string;
        customData?: { email?: string };
        email?: string;
      };
      console.error('[Auth Google Error]', error.code, error.message);

      // Handle account exists with different credential
      if (error.code === 'auth/account-exists-with-different-credential') {
        const pendingCred = GoogleAuthProvider.credentialFromError(err as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]);
        const email = error.customData?.email || error.email;

        if (pendingCred && email) {
          setPendingCredential(pendingCred);
          setPendingLinkEmail(email);
          setIsLinkingAccount(true);
        }
      }

      throw err;
    }
  };

  const loginWithGoogleOneTap = async (idToken: string): Promise<User | null> => {
    if (!firebaseEnabled || !firebaseAuth) return null;

    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(firebaseAuth, credential);
      const user = await FirebaseData.ensureUserProfile(userCredential.user);
      if (user.isNewUser && user.email) {
        void EmailService.sendWelcomeEmail({ email: user.email, name: user.name });
      }
      setCurrentUser(user);
      return user;
    } catch (err: unknown) {
      const error = err as {
        code?: string;
        message?: string;
        customData?: { email?: string };
        email?: string;
      };
      console.error('[Auth OneTap Error]', error.code, error.message);

      if (error.code === 'auth/account-exists-with-different-credential') {
        const pendingCred = GoogleAuthProvider.credential(idToken);
        const email = error.customData?.email || error.email;
        if (email) {
          setPendingCredential(pendingCred);
          setPendingLinkEmail(email);
          setIsLinkingAccount(true);
        }
      }

      throw err;
    }
  };

  const linkAccountWithPassword = async (password: string): Promise<User | null> => {
    if (!firebaseEnabled || !firebaseAuth || !pendingLinkEmail || !pendingCredential) {
      return null;
    }

    try {
      // 1. Sign in with the existing password provider to obtain the canonical Firebase user
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        pendingLinkEmail,
        password
      );

      // 2. Link the pending Google credential to this exact canonical user
      await linkWithCredential(userCredential.user, pendingCredential);

      // 3. Ensure user profile and cleanup state
      const unifiedUser = await FirebaseData.ensureUserProfile(userCredential.user);
      setPendingCredential(null);
      setPendingLinkEmail(null);
      setIsLinkingAccount(false);
      setCurrentUser(unifiedUser);

      return unifiedUser;
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('[Auth Linking Error]', error.code, error.message);
      throw err;
    }
  };

  const cancelAccountLinking = () => {
    setPendingCredential(null);
    setPendingLinkEmail(null);
    setIsLinkingAccount(false);
  };

  const register = async (email: string, password: string, name: string): Promise<User | null> => {
    try {
      if (firebaseEnabled && firebaseAuth) {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        await updateProfile(credential.user, { displayName: name });
        await sendEmailVerification(credential.user, {
          url: `${window.location.origin}/profile`,
          handleCodeInApp: false,
        });
        const user = await FirebaseData.ensureUserProfile(credential.user, { name });
        setCurrentUser(user);

        // Dispatch Welcome / Account Creation Congratulations Email
        void EmailService.sendWelcomeEmail({ email, name });

        return user;
      }

      // Local fallback
      const ok = await AuthService.register(email, password, name);
      if (ok) {
        const localUser = AuthService.getCurrentUser();
        setCurrentUser(localUser);

        // Dispatch Welcome Email for local user
        void EmailService.sendWelcomeEmail({ email, name });

        return localUser;
      }
      return null;
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('[Auth Register Error]', error.code, error.message);
      throw err;
    }
  };

  const logout = () => {
    if (firebaseEnabled && firebaseAuth) {
      void signOut(firebaseAuth);
    } else {
      AuthService.logout();
    }
    setCurrentUser(null);
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://orangeflixx.vercel.app';
    const customResetUrl = `${origin}/reset-password`;

    try {
      if (firebaseEnabled && firebaseAuth) {
        const response = await fetch('/api/generate-password-reset-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, continueUrl: customResetUrl }),
        });
        if (!response.ok) {
          throw new Error('Unable to create a secure password reset link.');
        }
        const { resetUrl, recipientName } = (await response.json()) as {
          resetUrl?: string;
          recipientName?: string;
        };
        if (!resetUrl) throw new Error('Firebase did not return a password reset link.');

        const sent = await EmailService.sendPasswordResetEmail({
          email,
          name: recipientName,
          resetUrl,
        });

        return sent;
      }

      const localReset = await AuthService.resetPassword(email);
      if (localReset) {
        void EmailService.sendPasswordResetEmail({
          email,
          resetUrl: customResetUrl,
        });
      }
      return localReset;
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('[Auth Reset Password Error]', error.code, error.message);
      return false;
    }
  };

  const confirmPasswordReset = async (oobCode: string, newPassword: string): Promise<boolean> => {
    try {
      if (firebaseEnabled && firebaseAuth) {
        await fbConfirmPasswordReset(firebaseAuth, oobCode, newPassword);
        return true;
      }
      return await AuthService.confirmPasswordReset(oobCode, newPassword);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('[Auth Confirm Password Reset Error]', error.code, error.message);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        loginWithGoogle,
        loginWithGoogleOneTap,
        register,
        logout,
        resetPassword,
        confirmPasswordReset,
        pendingLinkEmail,
        isLinkingAccount,
        linkAccountWithPassword,
        cancelAccountLinking,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
