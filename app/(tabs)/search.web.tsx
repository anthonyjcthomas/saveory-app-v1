/**
 * Web stub for the Search/Map tab.
 *
 * react-native-maps and react-native-map-clustering use native Codegen modules
 * that cannot be bundled for web. Metro automatically serves this file instead
 * of search.tsx when the target platform is "web".
 *
 * Full web map support (Leaflet / Google Maps JS SDK) is a Phase 2 feature.
 */
import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { Stack } from 'expo-router';

export default function SearchPageWeb() {
  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <Image
                source={require('../../assets/images/Savor-Logo.webp')}
                style={styles.headerImage}
              />
            </View>
          ),
          headerStyle: { backgroundColor: '#ffffff' },
        }}
      />
      <View style={styles.container}>
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.title}>Map View</Text>
        <Text style={styles.subtitle}>
          The interactive map is available in the Saveory mobile app.
        </Text>
        <Text style={styles.hint}>
          Download the app on iOS or Android to explore deals near you on the map.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#264117',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  hint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
});
