import { Platform } from 'react-native';

/**
 * Required fallback sibling for `search.web.tsx` / `search.native.tsx` (Expo Router).
 * Metro resolves `react-native-maps` to `shims/react-native-maps.web.js` on web — see metro.config.js.
 */
export default Platform.OS === 'web'
  ? require('./search.web').default
  : require('./search.native').default;
