import { onAuthStateChanged } from 'firebase/auth';
import { create } from 'zustand';

import { auth } from '@/lib/firebase';

export interface AuthUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
}

interface AuthState {
  user: AuthUser | null;
  /** True once Firebase has reported the stored session (signed in or not). */
  initialized: boolean;
}

// Expo Router's web static render runs in Node; skip the listener there.
const isServer = typeof window === 'undefined';

export const useAuthStore = create<AuthState>()(() => ({ user: null, initialized: isServer }));

/** Stand-in account for development builds where Google Sign-In can't run (e.g. Expo Go). */
const DEV_USER: AuthUser = { uid: 'dev-user', name: 'Dev tester', email: null, photo: null };

/** Development only: skips the login screen with a local fake user. */
export const devSignIn = () => useAuthStore.setState({ user: DEV_USER });

/** Drops the signed-in user locally; Firebase's own listener only covers real accounts. */
export const clearUser = () => useAuthStore.setState({ user: null });

if (!isServer) {
  // Firebase persists the session itself, so this store isn't persisted.
  onAuthStateChanged(auth, (u) =>
    useAuthStore.setState({
      initialized: true,
      user: u ? { uid: u.uid, name: u.displayName, email: u.email, photo: u.photoURL } : null,
    }),
  );
}
