import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth, db, isFirebaseReady } from '@/firebaseConfig.js';
import { useBusinessOwner } from '@/lib/businessOwner';
import {
  ensureNotificationPermission,
  fetchExpoPushTokenOrThrow,
  saveDealAlertsIntent,
  savePushTokenError,
  savePushTokenForUser,
  clearPushTokenForUser,
} from '@/lib/pushNotifications';
import {
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { SCREEN_BACKGROUND, BRAND_GREEN } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const user = auth?.currentUser ?? null;
  const { isOwner, loading: ownerLoading, profile } = useBusinessOwner();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [dealAlertsOn, setDealAlertsOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [manualPushAdmin, setManualPushAdmin] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastEstId, setBroadcastEstId] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid || user.isAnonymous || !db) {
        setDealAlertsOn(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.data();
        const tok = data?.expoPushToken;
        const optIn = data?.dealAlertsOptIn;
        const hasToken = typeof tok === 'string' && tok.length > 0;
        const optedIn = optIn !== false;
        if (hasToken && optIn === undefined) {
          await setDoc(doc(db, 'users', user.uid), { dealAlertsOptIn: true }, { merge: true });
        }
        if (!cancelled) setDealAlertsOn(hasToken && optedIn);
      } catch {
        if (!cancelled) setDealAlertsOn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.isAnonymous]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid || user.isAnonymous || !db) {
        setManualPushAdmin(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'adminPushSenders', user.uid));
        const ok = snap.exists() && snap.data()?.active !== false;
        if (!cancelled) setManualPushAdmin(ok);
      } catch {
        if (!cancelled) setManualPushAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.isAnonymous]);

  const canSendBroadcast = manualPushAdmin || isOwner;

  const handleSendManualBroadcast = async () => {
    if (!isFirebaseReady() || !app) {
      Alert.alert('Error', 'Firebase is not available.');
      return;
    }
    const title = broadcastTitle.trim();
    const body = broadcastBody.trim();
    if (!title || !body) {
      Alert.alert('Required', 'Enter a title and message.');
      return;
    }
    const establishmentId = broadcastEstId.trim();
    if (
      isOwner &&
      !manualPushAdmin &&
      establishmentId &&
      profile?.establishmentIds &&
      !profile.establishmentIds.includes(establishmentId)
    ) {
      Alert.alert(
        'Invalid listing ID',
        `Use one of your venue document IDs: ${profile.establishmentIds.join(', ')}`
      );
      return;
    }
    setBroadcastSending(true);
    try {
      const sendBroadcast = httpsCallable(getFunctions(app, 'us-central1'), 'sendManualBroadcast');
      const result = await sendBroadcast({
        title,
        body,
        ...(establishmentId ? { establishmentId } : {}),
      });
      const data = result.data as { recipientCount?: number; message?: string };
      Alert.alert(
        'Broadcast sent',
        data.message ?? `${data.recipientCount ?? 0} device(s) with deal alerts enabled.`
      );
      setBroadcastTitle('');
      setBroadcastBody('');
      setBroadcastEstId('');
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Send failed', err.message ?? 'Could not send broadcast.');
    } finally {
      setBroadcastSending(false);
    }
  };

  const handleDealAlertsToggle = async (value: boolean) => {
    if (!user?.uid || user.isAnonymous) {
      Alert.alert('Sign in', 'Use an email account to receive deal alerts.');
      return;
    }
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Push alerts are available on the mobile app.');
      return;
    }
    setPushBusy(true);
    try {
      if (value) {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          Alert.alert(
            'Notifications off',
            'Enable notifications for Saveory in system settings to get deal alerts.'
          );
          setDealAlertsOn(false);
          return;
        }
        // Persist opt-in immediately so Firestore shows `dealAlertsOptIn` even if token fetch fails.
        await saveDealAlertsIntent(user.uid);
        let token: string;
        try {
          token = await fetchExpoPushTokenOrThrow();
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          await savePushTokenError(user.uid, msg);
          Alert.alert(
            'Push token failed',
            `${msg}\n\nCheck that you are on a physical device with Expo Go updated. If this persists, try a development or production build (not Expo Go).`
          );
          setDealAlertsOn(false);
          return;
        }
        await savePushTokenForUser(user.uid, token);
        setDealAlertsOn(true);
      } else {
        await clearPushTokenForUser(user.uid);
        setDealAlertsOn(false);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Error', err.message ?? 'Could not update notification settings.');
      setDealAlertsOn(!value);
    } finally {
      setPushBusy(false);
    }
  };

  const handleReport = () => {
    if (user?.email) {
      const email = `mailto:saveoryapp@gmail.com?subject=User%20Report&body=Dear%20Support,%0D%0A%0D%0AI'm%20experiencing%20an%20issue%20with%20Saveory.%20Please%20assist%20me.%0D%0A%0D%0ARegards,%0D%0A${encodeURIComponent(user.email)}`;
      Linking.openURL(email).catch(() =>
        Alert.alert('Error', 'Could not open your email app.')
      );
    } else {
      Alert.alert(
        'Email unavailable',
        'Sign in with an email account to send a report, or email saveoryapp@gmail.com from another app.'
      );
    }
  };

  /** Opens email to you — include UID so you can create `businessOwners/{uid}` in Firestore. */
  const handleRequestBusinessListing = () => {
    const support = 'saveoryapp@gmail.com';
    const uid = user?.uid ?? '';
    const accountEmail = user?.email ?? '(guest — no email)';
    const subject = encodeURIComponent('Saveory — request business listing');
    const body = encodeURIComponent(
      "I'd like to manage my restaurant's deals on Saveory.\n\n" +
        `Account email: ${accountEmail}\n` +
        `Firebase UID (document ID for businessOwners): ${uid || '(sign in first)'}\n` +
        'Field: establishmentId = one venue, OR establishmentIds = array of venue doc IDs (e.g. ["Kollege Klub", "Other Place"]).\n\n' +
        'Business / venue name(s):\n' +
        'Address:\n' +
        'Phone:\n' +
        'Notes:\n'
    );
    Linking.openURL(`mailto:${support}?subject=${subject}&body=${body}`).catch(() =>
      Alert.alert('Error', 'Could not open your email app.')
    );
  };

  const handleSignOut = () => {
    if (!auth) return;
    signOut(auth)
      .then(() => router.replace('/landing'))
      .catch(() => Alert.alert('Error', 'Could not sign out.'));
  };

  const handleSendResetLink = () => {
    const email = user?.email;
    if (!email) {
      Alert.alert('Not available', 'Guest accounts cannot use email reset.');
      return;
    }
    if (!auth) return;
    sendPasswordResetEmail(auth, email)
      .then(() =>
        Alert.alert(
          'Check your email',
          'We sent a password reset link to your inbox.'
        )
      )
      .catch((e: Error) =>
        Alert.alert('Error', e.message || 'Could not send reset email.')
      );
  };

  const handleChangePassword = async () => {
    if (!user?.email) {
      Alert.alert(
        'Not available',
        'Password change applies to email sign-in. Guest accounts cannot set a password here.'
      );
      return;
    }
    if (!currentPassword.trim()) {
      Alert.alert('Current password', 'Enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('New password', 'Use at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your password was updated.');
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        Alert.alert('Error', 'Current password is incorrect.');
      } else {
        Alert.alert('Error', err.message || 'Could not update password.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: SCREEN_BACKGROUND },
          headerTintColor: BRAND_GREEN,
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {!ownerLoading ? (
            <>
              <Text style={[styles.sectionLabel, styles.sectionFirst]}>Business</Text>
              {isOwner ? (
                <TouchableOpacity
                  style={styles.rowButton}
                  onPress={() => router.push('/owner')}
                >
                  <Text style={styles.rowButtonText}>Business portal</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={styles.businessExplainer}>
                    (1) Tap below to email us. (2) We add your venue in Firebase. (3) Business portal unlocks
                    here for your account.
                  </Text>
                  <TouchableOpacity style={styles.rowButton} onPress={handleRequestBusinessListing}>
                    <Text style={styles.rowButtonText}>Request business listing</Text>
                  </TouchableOpacity>
                  <Text style={styles.businessHint}>
                    Use the Firebase UID in the email so we can link the right login.
                  </Text>
                </>
              )}
            </>
          ) : null}

          {Platform.OS !== 'web' ? (
            <>
              <Text style={styles.sectionLabel}>Alerts</Text>
              <View style={styles.switchRow}>
                <View style={styles.switchTextWrap}>
                  <Text style={styles.switchTitle}>Deal alerts</Text>
                  <Text style={styles.switchSubtitle}>
                    Get notified when venues update happy hour deals (opt in required).
                  </Text>
                </View>
                {pushBusy ? (
                  <ActivityIndicator color={BRAND_GREEN} />
                ) : (
                  <Switch
                    value={dealAlertsOn}
                    onValueChange={handleDealAlertsToggle}
                    trackColor={{ false: '#ccc', true: '#8fbc8f' }}
                    thumbColor={dealAlertsOn ? BRAND_GREEN : '#f4f3f4'}
                  />
                )}
              </View>
            </>
          ) : null}

          {canSendBroadcast ? (
            <>
              <Text style={styles.sectionLabel}>Send announcement</Text>
              <Text style={styles.adminBroadcastHint}>
                {manualPushAdmin
                  ? 'Sends a push to everyone who enabled Deal alerts and has a device token. Optional establishment ID opens that venue when tapped.'
                  : 'Sends a push to all users who enabled Deal alerts. If you add an establishment ID, it must be one of your listings (same ID as in Firestore / Business portal) so the app can open the right venue.'}
                {isOwner && profile?.establishmentIds?.length ? (
                  <Text style={styles.adminBroadcastVenueIds}>
                    {'\n\nYour listing ID(s): '}
                    {profile.establishmentIds.join(', ')}
                  </Text>
                ) : null}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Notification title"
                placeholderTextColor="#888"
                value={broadcastTitle}
                onChangeText={setBroadcastTitle}
              />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Message"
                placeholderTextColor="#888"
                value={broadcastBody}
                onChangeText={setBroadcastBody}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Establishment ID (optional, for deep link)"
                placeholderTextColor="#888"
                value={broadcastEstId}
                onChangeText={setBroadcastEstId}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.primaryButton, broadcastSending ? styles.disabled : null]}
                onPress={handleSendManualBroadcast}
                disabled={broadcastSending}
              >
                {broadcastSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send push to opted-in users</Text>
                )}
              </TouchableOpacity>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>Support</Text>
          <TouchableOpacity style={styles.rowButton} onPress={handleReport}>
            <Text style={styles.rowButtonText}>Report a problem</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Account</Text>
          {user?.email && !user.isAnonymous ? (
            <>
              <Text style={styles.hint}>
                Update your password below, or get a reset link by email.
              </Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSendResetLink}
              >
                <Text style={styles.secondaryButtonText}>
                  Email me a password reset link
                </Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Current password"
                placeholderTextColor="#888"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor="#888"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#888"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabled]}
                onPress={handleChangePassword}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Update password</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.hint}>
              Sign in with email and password to change your password here.
              Guests can use Report or sign out below.
            </Text>
          )}

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: SCREEN_BACKGROUND,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  sectionFirst: {
    marginTop: 0,
  },
  rowButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_GREEN,
  },
  hint: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  secondaryButton: {
    marginBottom: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: BRAND_GREEN,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
    color: '#111',
  },
  primaryButton: {
    backgroundColor: BRAND_GREEN,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
  signOutButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    marginTop: 8,
  },
  signOutText: {
    color: BRAND_GREEN,
    fontSize: 16,
    fontWeight: '700',
  },
  businessExplainer: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  businessHint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginTop: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  switchTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  switchSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  adminBroadcastHint: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 12,
  },
  adminBroadcastVenueIds: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
