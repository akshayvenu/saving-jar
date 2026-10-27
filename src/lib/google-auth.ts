import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut } from 'firebase/auth';

import { auth } from '@/lib/firebase';

GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });

/**
 * Signs in (or registers, on first use) with a Google account.
 * Resolves to `false` if the user dismissed the account picker; throws an Error with a
 * user-facing message otherwise.
 */
export async function signInWithGoogle(): Promise<boolean> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return false;

    const { idToken } = response.data;
    if (!idToken) throw new Error('Google did not return an ID token. Please try again.');
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return true;
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return false;
      if (e.code === statusCodes.IN_PROGRESS) return false;
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services is missing or out of date on this device.');
      }
    }
    throw e instanceof Error ? e : new Error('Sign-in failed. Please try again.');
  }
}

export async function signOut() {
  await Promise.allSettled([GoogleSignin.signOut(), firebaseSignOut(auth)]);
}
