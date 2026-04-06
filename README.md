# Saveory

Find **happy hours, deals, and events** near you in real time. Mobile-first **React Native (Expo)** app backed by **Firebase** (Auth + Firestore), with maps on **iOS/Android** (`react-native-maps`) and **web** (Google Maps JavaScript API).

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Maps (native vs web)](#maps-native-vs-web)
- [Scripts](#scripts)
- [Firestore model](#firestore-model)
- [Building & deployment notes](#building--deployment-notes)
- [License](#license)

---

## Features

- **Live deals feed** — Filter by distance, category, and “live now” (Chicago timezone for deal windows).
- **Map tab** — Native maps with markers, directions, and routes; web uses `@react-google-maps/api` + Firestore-backed pins.
- **All deals** — Browse by day, time, and category with distance sorting when location is available.
- **Bookmarks** — Saved spots (local/async storage via app context).
- **Establishment detail** — Deep link to `/Establishments/[id]` with Firestore-backed data.

---

## Architecture

```
Expo Router (file-based routes)
├── app/                    # Screens, layouts, tabs
├── components/             # Shared UI (categories, lists, headers, bookmarks context)
├── lib/                    # location, directions, haversine, maps helpers, ATT
├── types/                  # TypeScript types
├── shims/                  # Web stub for react-native-maps (Metro aliases on web)
├── firebaseConfig.js       # Firebase init + analytics helpers
├── app.config.js           # Dynamic Expo config (e.g. Google Maps native API keys)
└── metro.config.js         # Resolves react-native-maps → web shim on web only
```

- **State:** React hooks + context (e.g. bookmarks). Firestore is read with `getDocs` / `getDoc` where needed.
- **Location:** `expo-location` via `getCurrentPositionOrFallback()` (`lib/location.ts`), with parallel loads alongside Firestore where possible to reduce time-to-interactive.
- **Distance:** Shared Haversine helpers in `lib/haversine.ts` (km/miles) used by home, bookmarks, and establishment lists.

---

## Tech stack

| Area        | Choice |
|------------|--------|
| App runtime | Expo SDK ~53, React 19, React Native 0.79 |
| Navigation  | Expo Router 5 |
| Backend     | Firebase (Firestore; Auth as used in app) |
| Maps native | react-native-maps (Google on Android when configured) |
| Maps web    | `@react-google-maps/api`, `LoadScript` |
| Tooling     | TypeScript, Metro |

---

## Repository layout

- **`app/(tabs)/search.tsx`** — Re-exports `search.web` or `search.native` by platform (required fallback for Expo Router platform files).
- **`app/(tabs)/search.web.tsx` / `search.native.tsx`** — Separate implementations; web never imports native map codegen.
- **`metro.config.js`** — On **web**, resolves `react-native-maps` to `shims/react-native-maps.web.js` so the bundle never pulls `codegenNativeCommands`. **iOS/Android** keep the real package.
- **`app.config.js`** — Merges `app.json` and can inject `EXPO_PUBLIC_*` and native Google Maps keys for dev clients / EAS builds.

---

## Getting started

### Prerequisites

- Node.js LTS and npm
- For iOS: Xcode (macOS)
- For Android: Android Studio / SDK
- Firebase project with Firestore (and Auth if you use sign-in flows)

### Install

```bash
git clone <your-fork-or-repo-url>
cd saveory-app-v1
npm install
```

### Run the dev server

```bash
npx expo start
```

Then press `i` (iOS simulator), `a` (Android), or `w` (web). Use `--clear` if Metro cache causes stale resolution:

```bash
npx expo start --clear
```

### Export static web build

Output directory must be **inside** the project (Expo requirement), for example:

```bash
npx expo export --platform web --output-dir web-export
```

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in values. **Do not commit** `.env.local` (it is gitignored).

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_FIREBASE_*` | Firebase web SDK (`firebaseConfig.js`) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Web Maps JS, Geocoding, Directions; also referenced for native config in `app.config.js` |

Expo inlines `EXPO_PUBLIC_*` at build time. Restart the dev server after changing them.

---

## Maps (native vs web)

- **Web:** Uses Google Maps JavaScript API. Ensure the key has **Maps JavaScript API**, **Geocoding API**, and **Directions API** enabled as needed.
- **Android/iOS:** `react-native-maps` needs a valid Google Maps SDK setup for your platform; keys from `app.config.js` apply to **new dev clients / EAS builds**, not only JS reload.
- If you see errors importing `codegenNativeCommands` on web, confirm `metro.config.js` is unchanged and clear Metro cache.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | `expo start` |
| `npm run web` | `expo start --web` |
| `npm run ios` / `npm run android` | Start with platform hint |
| `npm run lint` | Expo lint |
| `npm test` | Jest (`jest-expo`) |

---

## Firestore model

Collections and fields evolve with the app; a typical **`establishments`** document includes fields such as:

- `name`, `location`, `latitude`, `longitude`, `cuisine`, `category`, `image`, `rating`
- `happy_hour_deals` — array of deals with `deal_list` (days), `start_time` / `end_time` (`HH:mm`), `details`, etc.

Deal filtering for “live now” uses **America/Chicago** in the home tab.

---

## Building & deployment notes

- **EAS Build:** Configure credentials and env in [EAS](https://docs.expo.dev/build/introduction/); native map keys and bundle IDs belong there for production.
- **Web:** Can be hosted as static files from `expo export` (e.g. Vercel, Netlify, S3) with correct `EXPO_PUBLIC_*` at build time.
- **App stores:** Follow Expo’s submission guides for iOS and Android; update version/build numbers in `app.json` / EAS config as required.

---

## License

MIT © Anthony Thomas
