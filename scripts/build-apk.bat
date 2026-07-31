@echo off
echo ============================================
echo  Icetube 2.0 - Android APK Builder
echo ============================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo [2/4] Installing Capacitor...
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/splash-screen @capacitor/status-bar @capacitor/app @capacitor/haptics @capacitor/keyboard
if %errorlevel% neq 0 (
    echo ERROR: Capacitor install failed
    pause
    exit /b 1
)

echo [3/4] Building web app...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo [4/4] Syncing Capacitor Android project...
npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Building APK with Gradle...
echo ============================================
echo.

cd android
call gradlew assembleRelease
if %errorlevel% neq 0 (
    echo ERROR: Gradle build failed
    echo Try running: .\gradlew assembleDebug
    pause
    exit /b 1
)

echo.
echo ============================================
echo  APK built successfully!
echo  Location: android\app\build\outputs\apk\release\app-release.apk
echo ============================================
echo.
cd ..
pause