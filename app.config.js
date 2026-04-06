/**
 * Extends static app.json with Google Maps native keys from EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.
 * Required for react-native-maps markers/tiles on Android (and iOS Google provider).
 */
const appJson = require('./app.json');

const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      config: {
        ...appJson.expo.ios?.config,
        googleMapsApiKey: key,
      },
    },
    android: {
      ...appJson.expo.android,
      config: {
        ...appJson.expo.android?.config,
        googleMaps: {
          apiKey: key,
        },
      },
    },
  },
};
