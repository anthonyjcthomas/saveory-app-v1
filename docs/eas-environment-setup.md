# EAS builds — environment variables (Firebase & Maps)

Cloud **`eas build`** jobs do **not** read `.env.local` on your Mac. Values must be available at **build time** so they are compiled into the app.

## Required for a working TestFlight / App Store binary

Add these in the **Expo dashboard** (same account as your project):

1. Go to [expo.dev](https://expo.dev) → your **Saveory** project → **Environment variables** (or **Secrets**, depending on Expo UI version).
2. Create variables for **production** (and **preview** if you use that profile), using the **same names** as in `.env.local`:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (native maps / directions)

3. Trigger a **new** iOS (or Android) production build after saving.

## Tie builds to the `production` environment

This repo’s `eas.json` sets `"environment": "production"` on the **production** build profile so `eas build --profile production` loads variables from the **Production** environment in the Expo dashboard. If you use a different profile, add the same variables there or set `environment` accordingly.

## Verify

On the build page on expo.dev, open **Environment variables** for that build and confirm the `EXPO_PUBLIC_*` entries are listed (values are often hidden).

## If you skip this

The app shows a **“Can’t start Saveory”** screen with a short explanation instead of crashing on launch, until you add variables and ship a new build.

More detail: [Using environment variables in EAS](https://docs.expo.dev/eas/environment-variables/usage/).
