import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * EAS production builds do not read `.env.local` — env must be set in Expo (EAS) project settings
 * or the build profile. Missing values leave `initializeApp` invalid and caused startup crashes on TestFlight.
 */
function hasRequiredFirebaseEnv() {
  return (
    typeof firebaseConfig.apiKey === 'string' &&
    firebaseConfig.apiKey.length > 0 &&
    typeof firebaseConfig.projectId === 'string' &&
    firebaseConfig.projectId.length > 0 &&
    typeof firebaseConfig.appId === 'string' &&
    firebaseConfig.appId.length > 0
  );
}

/** @param {import('firebase/app').FirebaseApp} appInstance */
function createAuthForApp(appInstance) {
  if (Platform.OS === 'web') {
    return getAuth(appInstance);
  }
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  try {
    return initializeAuth(appInstance, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(appInstance);
  }
}

/** @type {import('firebase/app').FirebaseApp | null} */
let app = null;
/** @type {import('firebase/auth').Auth | null} */
let auth = null;
/** @type {import('firebase/firestore').Firestore | null} */
let db = null;
/** @type {string | null} */
export let firebaseInitError = null;

let _analytics = null;

if (hasRequiredFirebaseEnv()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = createAuthForApp(app);
    db = getFirestore(app);

    isSupported()
      .then((supported) => {
        if (supported && app) _analytics = getAnalytics(app);
      })
      .catch(() => {});
  } catch (e) {
    firebaseInitError = e instanceof Error ? e.message : String(e);
    console.error('[Saveory] Firebase initialization failed:', e);
  }
} else {
  firebaseInitError =
    'Missing EXPO_PUBLIC_FIREBASE_* variables. Add them in EAS (Expo dashboard → Environment variables) for production builds, then rebuild.';
  console.error('[Saveory]', firebaseInitError);
}

export function isFirebaseReady() {
  return app != null && auth != null && db != null;
}

/**
 * Log a Firebase Analytics event.
 * Safe to call before analytics finishes initializing — events are silently dropped.
 */
export const trackEvent = (eventName, params = {}) => {
  if (_analytics) {
    logEvent(_analytics, eventName, params);
  }
};

export { app, auth, db };
