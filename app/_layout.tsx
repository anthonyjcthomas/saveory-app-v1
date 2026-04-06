import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme } from '@/components/useColorScheme';
import { onAuthStateChanged, User } from 'firebase/auth';
import { BookmarksProvider } from '@/components/BookmarksContext';
import { auth } from '../firebaseConfig.js';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Subscribe to auth state exactly once on mount.
  // Never put `router` in the dependency array — its reference changes on
  // every navigation, which would re-subscribe and create an infinite loop.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []); // intentionally empty — subscribe once

  // Handle navigation separately, only after loading resolves.
  // Only redirect AWAY FROM auth screens when logged in, and TO landing when not logged in.
  // Never redirect an authenticated user who is navigating within the app
  // (e.g. to Establishments/[id]) — that would bounce them back to tabs on every tap.
  useEffect(() => {
    if (loading) return;

    const inAuth =
      segments[0] === 'landing' ||
      segments[0] === 'login' ||
      segments[0] === 'register';

    if (user && inAuth) {
      // Logged-in user on an auth screen → send to app
      router.replace('/(tabs)');
    } else if (!user && !inAuth) {
      // Unauthenticated user anywhere else → require login
      router.replace('/landing');
    }
    // Otherwise: user is authenticated and on a valid app screen — do nothing.
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#264117" />
      </View>
    );
  }

  return (
    <BookmarksProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="landing" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              title: 'Home',
              headerBackTitle: '',
            }}
          />
          <Stack.Screen name="Establishments/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="settings" />
        </Stack>
      </ThemeProvider>
    </BookmarksProvider>
  );
}
