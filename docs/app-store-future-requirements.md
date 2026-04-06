# App Store submission — future requirements (internal note)

## iOS / Xcode SDK minimum (Apple warning 90725)

As of builds uploaded around **April 2026**, Apple may show:

- **Warning:** `90725` — SDK version issue  
- **Message:** The app was built with the **iOS 18.5 SDK** (via the Xcode / image EAS used for that build).

**Deadline (from Apple):** Starting **April 28, 2026**, all **iOS and iPadOS** apps must be built with the **iOS 26 SDK** or later (included in **Xcode 26** or later) to **upload to App Store Connect** or **submit for distribution**.

### What to do before that date

1. Watch **Expo / EAS** release notes for supported **Xcode 26+** / **iOS 26 SDK** build images (`eas.json` / `image` field or default EAS image updates).
2. When available, trigger a new **`eas build --platform ios`** so the binary is produced with the new SDK.
3. Re-check **Apple Developer** news and [Expo — iOS build server / image](https://docs.expo.dev/build-reference/infrastructure/) for the exact image names.

This is a **forward-looking compliance** requirement, not necessarily blocking uploads **before** the deadline; treat the warning as a reminder to upgrade the build stack before **2026-04-28**.

---

*Captured from App Store Connect upload dialog (Saveory build 1.3.0 (39)).*
