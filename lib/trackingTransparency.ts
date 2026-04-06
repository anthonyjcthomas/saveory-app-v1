import { Platform } from 'react-native';

/** iOS ATT only; web/Android skip the native module so bundles stay valid. */
export async function requestTrackingPermissionsAsync(): Promise<{
  status: 'granted' | 'denied' | 'restricted' | 'undetermined';
}> {
  if (Platform.OS !== 'ios') {
    return { status: 'granted' };
  }
  const { requestTrackingPermissionsAsync: request } = await import('expo-tracking-transparency');
  return request();
}
