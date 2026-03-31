

# Build ChitChat as a Native Mobile App

Capacitor is already set up in your project. No code changes are needed — the remaining steps happen on your local machine.

## Steps to Build the Native App

### 1. Export & Clone
- Click **"Export to GitHub"** in Lovable (top-right menu)
- Clone the repo locally: `git clone <your-repo-url>`

### 2. Install Dependencies
```bash
cd your-project
npm install
```

### 3. Add Native Platforms
```bash
npx cap add android    # For Android
npx cap add ios        # For iOS (Mac only, requires Xcode)
```

### 4. Build & Sync
```bash
npm run build
npx cap sync
```

### 5. Run on Device/Emulator
```bash
npx cap run android    # Opens in Android Studio
npx cap run ios        # Opens in Xcode (Mac only)
```

### 6. Generate Release Build (Android)
In Android Studio:
- **Build → Generate Signed Bundle / APK**
- Choose **Android App Bundle (.aab)** (required for Play Store)
- Sign with your keystore

## Requirements
- **Android**: Android Studio installed
- **iOS**: Mac with Xcode installed
- **Play Store**: Google Play Developer account ($25 one-time fee)
- **App Store**: Apple Developer account ($99/year)

## Hot Reload During Development
The current `capacitor.config.ts` points to your Lovable preview URL, so the app will load your live preview. For production release, remove the `server` block so it uses the local `dist` folder instead.

## Reference
For a detailed walkthrough, see the [Lovable mobile development guide](https://docs.lovable.dev).

