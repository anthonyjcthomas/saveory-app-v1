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

// Initialize Firebase app (guard against double-init in HMR / dev)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Auth persistence:
 * - Web + static export (Vercel / Node): use default browser persistence via getAuth — never
 *   import AsyncStorage at load time (RN persistence breaks expo export SSR).
 * - iOS/Android: AsyncStorage so sessions survive app restarts.
 */
/** @type {import('firebase/auth').Auth} */
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

// Analytics — only available in environments that support it (native, web).
// Initialized asynchronously; trackEvent() safely no-ops if not yet ready.
let _analytics = null;
isSupported()
  .then((supported) => {
    if (supported) _analytics = getAnalytics(app);
  })
  .catch(() => {});

/**
 * Log a Firebase Analytics event. Preserves the same event names that were
 * previously sent to Amplitude so historical naming stays consistent.
 * Safe to call before analytics finishes initializing — events are silently
 * dropped rather than throwing.
 */
export const trackEvent = (eventName, params = {}) => {
  if (_analytics) {
    logEvent(_analytics, eventName, params);
  }
};

export { app, auth, db };
