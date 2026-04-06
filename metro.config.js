const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { resolve } = require('metro-resolver');

const config = getDefaultConfig(__dirname);

/**
 * Must delegate with `context.resolveRequest(...)` so Expo's resolver chain
 * (withMetroMultiPlatform → post-rewrites) stays intact. Capturing the previous
 * function at module load time is often undefined and falls through to bare
 * metro-resolver, which still resolves `react-native-maps` to native code →
 * MapMarkerNativeComponent → codegenNativeCommands on web.
 */
function isReactNativeMapsModule(moduleName) {
  if (moduleName === 'react-native-maps') return true;
  if (moduleName.startsWith('react-native-maps/')) return true;
  if (moduleName.includes(`${path.sep}react-native-maps${path.sep}`)) return true;
  return false;
}

function shouldShimMapsForPlatform(platform) {
  // Only resolve real native maps for explicit iOS/Android bundles. Web, SSR, and
  // resolver passes that omit `platform` must use the shim or codegen loads on web.
  return platform !== 'ios' && platform !== 'android';
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (shouldShimMapsForPlatform(platform) && isReactNativeMapsModule(moduleName)) {
    return {
      filePath: path.resolve(__dirname, 'shims/react-native-maps.web.js'),
      type: 'sourceFile',
    };
  }
  if (typeof context.resolveRequest === 'function') {
    return context.resolveRequest(context, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
