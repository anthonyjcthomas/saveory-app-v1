import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { deleteField, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseReady } from '../firebaseConfig.js';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Requests OS permission and returns an Expo push token, or null if unavailable / denied.
 * Server-side: send via Expo Push API or FCM; store tokens in `users/{uid}` for targeting.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    if (!Device.isDevice) {
        return null;
    }

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
    if (finalStatus !== 'granted') {
        return null;
    }

    const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
    if (!projectId) {
        console.warn('[Saveory] Missing EAS projectId — add `extra.eas.projectId` in app.json for push tokens.');
        return null;
    }

    const res = await Notifications.getExpoPushTokenAsync({ projectId });
    return res.data;
}

export async function savePushTokenForUser(uid: string, token: string): Promise<void> {
    if (!isFirebaseReady() || !db) return;
    await setDoc(
        doc(db, 'users', uid),
        {
            expoPushToken: token,
            expoPushTokenUpdatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

export async function clearPushTokenForUser(uid: string): Promise<void> {
    if (!isFirebaseReady() || !db) return;
    await setDoc(
        doc(db, 'users', uid),
        {
            expoPushToken: deleteField(),
            expoPushTokenUpdatedAt: deleteField(),
        },
        { merge: true }
    );
}
