import * as Location from 'expo-location';
import { Platform } from 'react-native';

const POSITION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  mayShowUserSettingsDialog: true,
};

export async function getCurrentPositionOrFallback(): Promise<Location.LocationObject | null> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') {
    return null;
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    return null;
  }

  try {
    return await Location.getCurrentPositionAsync(POSITION_OPTIONS);
  } catch {
    /* fall through */
  }

  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: 180000,
    requiredAccuracy: 2000,
  });
  if (lastKnown) {
    return lastKnown;
  }

  if (Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
      return await Location.getCurrentPositionAsync(POSITION_OPTIONS);
    } catch {
      return null;
    }
  }

  return null;
}
