import { StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, ScrollView } from "react-native";
import { getAuth, signInWithEmailAndPassword, signInAnonymously, sendPasswordResetEmail } from "firebase/auth";
import { Text, View } from "@/components/Themed";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleLogin = () => {
    signInWithEmailAndPassword(getAuth(), email, password)
      .then((user) => {
        if (user) router.replace("/(tabs)");
      })
      .catch(() => {
        Alert.alert('Login Error', "Incorrect Username or Password");
      });
  };

  const handleSignUpRedirect = () => {
    router.back();
  };

  const handleGuestLogin = () => {
    signInAnonymously(getAuth())
      .then(() => {
        router.replace("/(tabs)");
      })
      .catch(() => {
        Alert.alert('Login Error', "Unable to continue as guest");
      });
  };

  const handleForgotPassword = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert(
        "Email required",
        "Type your email in the field above, then tap Forgot password."
      );
      return;
    }
    sendPasswordResetEmail(getAuth(), trimmed)
      .then(() =>
        Alert.alert(
          "Check your email",
          "If an account exists for that address, you’ll receive a reset link from Firebase."
        )
      )
      .catch((e: { message?: string }) =>
        Alert.alert("Could not send email", e.message ?? "Try again later.")
      );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Log in to continue</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            onChangeText={(text) => setEmail(text)}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
            <Text style={styles.buttonText}>Continue as Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotWrap}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={handleSignUpRedirect}>
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backButtonText}>Back to Signup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={() => router.push('/DeleteAccount')}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#264117",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#264117",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    marginBottom: 12,
    color: '#000',
  },
  forgotWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotText: {
    color: '#ffffff',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 30,
  },
  button: {
    width: "100%",
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#264117",
    fontWeight: "600",
    fontSize: 16,
  },
  guestButton: {
    width: "100%",
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 5,
  },
  deleteButton: {
    marginTop: 30,
    alignItems: "center",
  },
  deleteText: {
    color: "#FF0000",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
