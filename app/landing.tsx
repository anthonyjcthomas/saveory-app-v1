import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { signInWithEmailAndPassword, signInAnonymously, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';

export default function Landing() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = () => {
    if (!auth) return;
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Login successful
        router.replace('/(tabs)'); // Navigate to the main app
      })
      .catch((error) => {
        Alert.alert('Login Error', "Incorrect Username or Password");
      });
  };

  const handleGuestLogin = () => {
    if (!auth) return;
    signInAnonymously(auth)
      .then(() => {
        router.replace('/(tabs)');
      })
      .catch((error) => {
        Alert.alert('Guest Login Error', 'Unable to continue as guest');
      });
  };

  const handleForgotPassword = () => {
    if (!auth) return;
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert(
        'Email required',
        'Enter your email above, then tap Forgot password.'
      );
      return;
    }
    sendPasswordResetEmail(auth, trimmed)
      .then(() =>
        Alert.alert(
          'Check your email',
          'If an account exists for that address, you’ll receive a reset link from Firebase.'
        )
      )
      .catch((e: { message?: string }) =>
        Alert.alert('Could not send email', e.message ?? 'Try again later.')
      );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Saveory!</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        onChangeText={(text) => setEmail(text)}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        onChangeText={(text) => setPassword(text)}
        value={password}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
        <Text style={styles.buttonText}>Continue as Guest</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.forgotWrap} onPress={handleForgotPassword}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.businessLink}
        onPress={() => {
          const subject = encodeURIComponent('Saveory — request business listing');
          const body = encodeURIComponent(
            "I'd like to list my restaurant on Saveory.\n\n" +
              '(After you have an account, Settings can include your Firebase UID for faster setup.)\n\n' +
              'Business name:\n' +
              'City:\n' +
              'Contact:\n'
          );
          Linking.openURL(`mailto:saveoryapp@gmail.com?subject=${subject}&body=${body}`).catch(() =>
            Alert.alert('Error', 'Could not open your email app.')
          );
        }}
      >
        <Text style={styles.businessLinkText}>List your business</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={() => router.push('/DeleteAccount')}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#264117', // Dark green background
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff', // White text
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff', // White text
    marginBottom: 30,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ffffff', // White border
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    marginBottom: 20,
    color: '#000',
  },
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: '#ffffff', // White background
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#264117', // Dark green text
    fontWeight: '600',
    fontSize: 16,
  },
  guestButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#ffffff', // White background for guest button
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotWrap: {
    marginBottom: 20,
  },
  forgotText: {
    color: '#ffffff',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  linkText: {
    color: '#ffffff', // White text
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  businessLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  businessLinkText: {
    color: '#e8f5e9',
    fontSize: 15,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  deleteText: {
    color: '#FF0000', // Red text for delete account
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
