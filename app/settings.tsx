import React, { useState } from 'react';
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useBusinessOwner } from '@/lib/businessOwner';
import {
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/firebaseConfig.js';
import { SCREEN_BACKGROUND, BRAND_GREEN } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const user = auth?.currentUser ?? null;
  const { isOwner, loading: ownerLoading } = useBusinessOwner();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

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
        `Firebase UID (paste this when creating businessOwners doc): ${uid || '(sign in first)'}\n\n` +
        'Business / venue name:\n' +
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
});
