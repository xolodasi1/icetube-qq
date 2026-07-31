#!/bin/bash
set -e

echo "============================================"
echo "  Icetube 2.0 - Android APK Builder"
echo "============================================"
echo ""

echo "[1/4] Installing dependencies..."
npm install

echo "[2/4] Installing Capacitor..."
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/splash-screen @capacitor/status-bar @capacitor/app @capacitor/haptics @capacitor/keyboard

echo "[3/4] Building web app..."
npm run build

echo "[4/4] Syncing Capacitor Android project..."
npx cap sync android

echo ""
echo "============================================"
echo "  Building APK with Gradle..."
echo "============================================"
echo ""

cd android
./gradlew assembleRelease

echo ""
echo "============================================"
echo "  APK built successfully!"
echo "  Location: android/app/build/outputs/apk/release/app-release.apk"
echo "============================================"
echo ""
cd ..