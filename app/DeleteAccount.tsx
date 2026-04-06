import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';

export default function DeleteAccount() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  useNavigation().setOptions({ headerShown: false }); // Hides the header

  const handleDeleteAccount = () => {
    if (!auth) return;
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        deleteUser(user)
          .then(() => {
            Alert.alert('Account Deleted', 'The account has been successfully deleted.');
            router.replace('/landing'); // Navigate back to login screen after deletion
          })
          .catch((error) => {
            Alert.alert('Delete Error', 'Unable to delete the account. Please try again.');
          });
      })
      .catch((error) => {
        Alert.alert('Delete Error', 'Incorrect email or password.');
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.subtitle}>Enter your email and password to delete your account</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleDeleteAccount}>
        <Text style={styles.buttonText}>Delete Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.linkText}>Back to Login</Text>
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
    justifyContent: 'center',
    
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
    backgroundColor: '#FF0000', // Red background for delete button
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#ffffff', // White text
    fontWeight: '600',
    fontSize: 16,
  },
  linkText: {
    color: '#ffffff', // White text
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
