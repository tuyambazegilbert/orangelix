import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { AuthContextType, User } from '@/types';
import { AuthService } from '@/lib/auth';
import { firebaseAuth, firebaseEnabled } from '@/lib/firebase';
import { FirebaseData } from '@/lib/firebase-data';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseUser = (user: FirebaseUser, isAdmin = false): User => ({
  id: user.uid,
  email: user.email || '',
  name: user.displayName || user.email?.split('@')[0] || 'OrangeFlix member',
  isAdmin,
  role: isAdmin ? 'admin' : 'member',
  createdAt: user.metadata.creationTime || new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (firebaseEnabled && firebaseAuth) {
      return onAuthStateChanged(firebaseAuth, async (fbUser) => {
        if (!fbUser) {
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }

        // Fetch Firestore user document to check isAdmin status
        const cloudProfile = await FirebaseData.getUserProfile(fbUser.uid);
        const resolvedUser = mapFirebaseUser(fbUser, cloudProfile?.isAdmin || false);
        if (cloudProfile?.name) {
          resolvedUser.name = cloudProfile.name;
        }

        setCurrentUser(resolvedUser);
        setIsLoading(false);
      });
    }

    // Local authentication fallback
    setCurrentUser(AuthService.getCurrentUser());
    setIsLoading(false);
    return undefined;
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      if (firebaseEnabled && firebaseAuth) {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const cloudProfile = await FirebaseData.getUserProfile(credential.user.uid);
        const user = mapFirebaseUser(credential.user, cloudProfile?.isAdmin || false);
        if (cloudProfile?.name) user.name = cloudProfile.name;

        await FirebaseData.saveProfile(user.id, user);
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
    } catch {
      return null;
    }
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    if (!firebaseEnabled || !firebaseAuth) return null;
    try {
      const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      const cloudProfile = await FirebaseData.getUserProfile(credential.user.uid);
      const user = mapFirebaseUser(credential.user, cloudProfile?.isAdmin || false);

      await FirebaseData.saveProfile(user.id, user);
      setCurrentUser(user);
      return user;
    } catch {
      return null;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<User | null> => {
    try {
      if (firebaseEnabled && firebaseAuth) {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        await updateProfile(credential.user, { displayName: name });
        const user: User = {
          ...mapFirebaseUser(credential.user, false),
          name,
        };
        await FirebaseData.saveProfile(user.id, user);
        setCurrentUser(user);
        return user;
      }

      // Local fallback
      const ok = await AuthService.register(email, password, name);
      if (ok) {
        const localUser = AuthService.getCurrentUser();
        setCurrentUser(localUser);
        return localUser;
      }
      return null;
    } catch {
      return null;
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
    if (!firebaseEnabled || !firebaseAuth) return false;
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
