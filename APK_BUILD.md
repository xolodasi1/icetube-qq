# Icetube 2.0 — Android APK Build Guide

This guide explains how to build the Icetube app as a native Android APK.

## Prerequisites (on your machine)

1. **Node.js 18+** — https://nodejs.org
2. **Java JDK 17** — https://adoptium.net
3. **Android Studio** — https://developer.android.com/studio (includes Android SDK & Gradle)
4. **Git** — https://git-scm.com

## Step-by-step

### 1. Clone / open the project

```bash
cd /path/to/icetube-qq
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add Capacitor Android platform

```bash
npx cap add android
```

### 4. Build the web app

```bash
npm run build
```

### 5. Sync Capacitor with Android project

```bash
npx cap sync android
```

### 6. Build the APK

Open the Android project in Android Studio:

```bash
npx cap open android
```

In Android Studio:
- Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- Wait for the build to complete
- Click **Build** again when it shows "BUILD SUCCESSFUL"

### 7. Find the APK

```
android/app/build/outputs/apk/release/app-release.apk
```

or for debug:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Quick build (one command)

On **Windows**:
```
scripts\build-apk.bat
```

On **Mac/Linux**:
```bash
chmod +x scripts/build-apk.sh
./scripts/build-apk.sh
```

---

## Configure Icons (optional but recommended)

Replace placeholders in `public/icons/`:
- `icon-72.png` — 72×72 px
- `icon-96.png` — 96×96 px
- `icon-128.png` — 128×128 px
- `icon-144.png` — 144×144 px
- `icon-152.png` — 152×152 px
- `icon-192.png` — 192×192 px
- `icon-384.png` — 384×384 px
- `icon-512.png` — 512×512 px

Use a square PNG with transparent background.

## Configure Splash Screen

Replace `public/icons/splash.png` with a 200×200 px PNG.

## Signing the APK (for release)

To create a signed release APK for the Play Store:

1. In Android Studio: **Build** → **Generate Signed Bundle / APK**
2. Select **APK**
3. Create or use existing keystore
4. Choose **release** build type
5. Click **Finish**

---

## Capacitor Config

See `capacitor.config.ts` for app configuration:
- App ID: `com.icetube.app`
- App Name: `Icetube`
- Web directory: `dist`
```

Let me also update the package.json to reflect the updated scripts.</think>Now let me finalize the package.json scripts properly:
<tool_call>read
<arg_key>filePath</arg_key>
<arg_value>H:\888\icetube-qq\package.json