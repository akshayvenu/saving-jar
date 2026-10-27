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

if (!isServer) {
  // Firebase persists the session itself, so this store isn't persisted.
  onAuthStateChanged(auth, (u) =>
    useAuthStore.setState({
      initialized: true,
      user: u ? { uid: u.uid, name: u.displayName, email: u.email, photo: u.photoURL } : null,
    }),
  );
}
