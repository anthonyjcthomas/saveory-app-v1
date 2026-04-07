import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { deleteField, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseReady } from '../firebaseConfig.js';

/** Must stay in sync with `app.json` → `expo.extra.eas.projectId` (Expo Go sometimes omits manifest `extra`). */
const FALLBACK_EAS_PROJECT_ID = '84e2d133-27ae-4b09-b971-0dafc5a6f67a';

function resolveExpoProjectId(): string {
    const fromExpoConfig = Constants.expoConfig?.extra?.eas?.projectId;
    const fromEas = Constants.easConfig?.projectId;
    const manifestExtra = (
        Constants as unknown as {
            manifest?: { extra?: { eas?: { projectId?: string } } };
        }
    ).manifest?.extra?.eas?.projectId;
    const resolved = fromExpoConfig ?? fromEas ?? manifestExtra ?? FALLBACK_EAS_PROJECT_ID;
    if (!fromExpoConfig && !fromEas && !manifestExtra) {
        console.warn(
            '[Saveory] Using fallback EAS projectId for push token; ensure app.json extra.eas.projectId matches your Expo project.'
        );
    }
    return resolved;
}

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Requests notification permission. Returns false if denied or running on web / non-device.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    if (!Device.isDevice) return false;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Saveory',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    return finalStatus === 'granted';
}

/**
 * Obtains an Expo push token after permission is granted. Throws with the underlying error message on failure.
 */
export async function fetchExpoPushTokenOrThrow(): Promise<string> {
    const projectId = resolveExpoProjectId();
    try {
        const res = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = res.data;
        if (!token || typeof token !== 'string') {
            throw new Error('Expo returned an empty push token.');
        }
        return token;
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[Saveory] getExpoPushTokenAsync failed', e);
        throw new Error(msg);
    }
}

/**
 * Writes opt-in to Firestore as soon as the user grants notification permission, so the console shows progress
 * even if token fetch fails afterward.
 */
export async function saveDealAlertsIntent(uid: string): Promise<void> {
    if (!isFirebaseReady() || !db) {
        throw new Error('Firebase is not ready. Check EXPO_PUBLIC_FIREBASE_* in .env / EAS env.');
    }
    await setDoc(
        doc(db, 'users', uid),
        {
            dealAlertsOptIn: true,
            dealAlertsAttemptAt: serverTimestamp(),
        },
        { merge: true }
    );
}

export async function savePushTokenError(uid: string, message: string): Promise<void> {
    if (!isFirebaseReady() || !db) return;
    await setDoc(
        doc(db, 'users', uid),
        {
            pushTokenError: message,
        },
        { merge: true }
    );
}

/**
 * Requests OS permission and returns an Expo push token, or null if unavailable / denied.
 * Server-side: send via Expo Push API or FCM; store tokens in `users/{uid}` for targeting.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    const granted = await ensureNotificationPermission();
    if (!granted) return null;
    try {
        return await fetchExpoPushTokenOrThrow();
    } catch {
        return null;
    }
}

export async function savePushTokenForUser(uid: string, token: string): Promise<void> {
    if (!isFirebaseReady() || !db) {
        throw new Error('Firebase is not ready. Check EXPO_PUBLIC_FIREBASE_* in .env / EAS env.');
    }
    await setDoc(
        doc(db, 'users', uid),
        {
            expoPushToken: token,
            expoPushTokenUpdatedAt: serverTimestamp(),
            /** Used by Cloud Functions: only opted-in users receive deal alerts. */
            dealAlertsOptIn: true,
            pushTokenError: deleteField(),
        },
        { merge: true }
    );
}

export async function clearPushTokenForUser(uid: string): Promise<void> {
    if (!isFirebaseReady() || !db) {
        throw new Error('Firebase is not ready. Check EXPO_PUBLIC_FIREBASE_* in .env / EAS env.');
    }
    await setDoc(
        doc(db, 'users', uid),
        {
            expoPushToken: deleteField(),
            expoPushTokenUpdatedAt: deleteField(),
            dealAlertsOptIn: false,
            pushTokenError: deleteField(),
            dealAlertsAttemptAt: deleteField(),
        },
        { merge: true }
    );
}
