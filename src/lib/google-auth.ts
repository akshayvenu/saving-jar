import { GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut } from 'firebase/auth';
import { Alert, TurboModuleRegistry } from 'react-native';

import { auth } from '@/lib/firebase';
import { flushSync } from '@/lib/sync';
import { clearUser } from '@/store/useAuthStore';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let google: GoogleSigninModule | null = null;

/**
 * Loads Google Sign-In on first use rather than at import. The package throws while being
 * imported when its native module is missing (Expo Go, or a dev client built before it was
 * added), which would take down every route that imports this file.
 */
function loadGoogle(): GoogleSigninModule | null {
  if (google) return google;
  if (!TurboModuleRegistry.get('RNGoogleSignin')) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- must stay lazy, see above
  google = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  google.GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });
  return google;
}

/**
 * Signs in (or registers, on first use) with a Google account.
 * Resolves to `false` if the user dismissed the account picker; throws an Error with a
 * user-facing message otherwise.
 */
export async function signInWithGoogle(): Promise<boolean> {
  const g = loadGoogle();
  if (!g) {
    throw new Error(
      'Google sign-in is not available in this build. Rebuild the development client to enable it.',
    );
  }
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = g;
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

/** Resolves true if the user chose to sign out despite unsynced changes. */
const confirmDiscard = () =>
  new Promise<boolean>((resolve) =>
    Alert.alert(
      'Sign out anyway?',
      "Some changes haven't been backed up yet and will be lost if you sign out now.",
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Sign out', style: 'destructive', onPress: () => resolve(true) },
      ],
      { onDismiss: () => resolve(false) },
    ),
  );

export async function signOut() {
  if (!(await flushSync()) && !(await confirmDiscard())) return;
  await Promise.allSettled([loadGoogle()?.GoogleSignin.signOut(), firebaseSignOut(auth)]);
  clearUser();
}
