# Firebase Crashlytics Implementation Plan

## Overview

This document outlines the implementation plan for integrating Firebase Crashlytics into the EMAP React Native app to automatically capture crashes, track errors, and provide detailed debugging information.

## Goals

- ✅ Automatic capture of all JavaScript errors and native crashes
- ✅ User identification in crash reports (user ID)
- ✅ Custom attributes tracking (brand, app version, device info)
- ✅ Debug test option for developers
- ✅ Non-fatal error logging for handled exceptions
- ✅ Integration with existing Firebase setup

## Current State Analysis

### Existing Firebase Setup

- ✅ Firebase already configured with Analytics and Messaging
- ✅ `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) present
- ✅ Firebase initialized in [`services/firebaseInit.ts`](../services/firebaseInit.ts)
- ✅ Firebase app configured in [`ios/emap/AppDelegate.swift`](../ios/emap/AppDelegate.swift)
- ✅ Google Services plugin applied in [`android/app/build.gradle`](../android/app/build.gradle)

### App Architecture

- React Native with Expo (SDK 54)
- Expo Router for navigation
- Multi-brand support (NT/CN)
- TypeScript codebase
- Existing analytics service at [`services/analytics.ts`](../services/analytics.ts)

## Implementation Steps

### 1. Install Dependencies

```bash
npm install @react-native-firebase/crashlytics
```

**Version**: Should match existing Firebase packages (^23.4.1)

### 2. Android Configuration

#### 2.1 Update `android/build.gradle`

Add Crashlytics Gradle plugin to buildscript dependencies:

```gradle
buildscript {
  dependencies {
    // ... existing dependencies
    classpath('com.google.firebase:firebase-crashlytics-gradle:3.0.2')
  }
}
```

#### 2.2 Update `android/app/build.gradle`

Apply Crashlytics plugin after other Firebase plugins:

```gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.google.gms.google-services"
apply plugin: "com.google.firebase.crashlytics"  // Add this line
apply plugin: "com.facebook.react"
```

#### 2.3 ProGuard Configuration

Ensure [`android/app/proguard-rules.pro`](../android/app/proguard-rules.pro) includes Crashlytics rules (usually auto-added).

### 3. iOS Configuration

#### 3.1 Update Podfile

No changes needed - Firebase Crashlytics will be auto-linked via Expo autolinking.

#### 3.2 Install Pods

```bash
cd ios && pod install && cd ..
```

#### 3.3 Upload Debug Symbols

For release builds, ensure dSYM files are uploaded. This is handled automatically by the Firebase Crashlytics Gradle plugin for Android and CocoaPods for iOS.

### 4. Create Crashlytics Service

Create [`services/crashlytics.ts`](../services/crashlytics.ts):

```typescript
import crashlytics from "@react-native-firebase/crashlytics";
import { Platform } from "react-native";
import { ACTIVE_BRAND } from "@/config/brandKey";

interface CrashlyticsService {
  initialize: () => Promise<void>;
  setUserId: (userId: string) => Promise<void>;
  setUserAttributes: (attributes: Record<string, string>) => Promise<void>;
  log: (message: string) => void;
  recordError: (error: Error, context?: string) => Promise<void>;
  setCrashlyticsCollectionEnabled: (enabled: boolean) => Promise<void>;
  testCrash: () => void;
  checkForUnsentReports: () => Promise<boolean>;
  sendUnsentReports: () => Promise<void>;
  deleteUnsentReports: () => Promise<void>;
}

class CrashlyticsServiceImpl implements CrashlyticsService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      console.log("🔥 Initializing Firebase Crashlytics...");

      // Enable Crashlytics collection
      await crashlytics().setCrashlyticsCollectionEnabled(true);

      // Set custom attributes
      await this.setDefaultAttributes();

      this.isInitialized = true;
      console.log("✅ Firebase Crashlytics initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing Crashlytics:", error);
      throw error;
    }
  }

  private async setDefaultAttributes(): Promise<void> {
    try {
      // Set brand
      await crashlytics().setAttribute("brand", ACTIVE_BRAND);

      // Set platform
      await crashlytics().setAttribute("platform", Platform.OS);

      // Set app version (from package.json or app.json)
      await crashlytics().setAttribute("app_version", "1.0.0");

      console.log("✅ Default Crashlytics attributes set");
    } catch (error) {
      console.error("❌ Error setting default attributes:", error);
    }
  }

  async setUserId(userId: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn("⚠️ Crashlytics not initialized, skipping setUserId");
      return;
    }

    try {
      await crashlytics().setUserId(userId);
      console.log("✅ Crashlytics user ID set:", userId);
    } catch (error) {
      console.error("❌ Error setting Crashlytics user ID:", error);
    }
  }

  async setUserAttributes(attributes: Record<string, string>): Promise<void> {
    if (!this.isInitialized) {
      console.warn(
        "⚠️ Crashlytics not initialized, skipping setUserAttributes"
      );
      return;
    }

    try {
      for (const [key, value] of Object.entries(attributes)) {
        await crashlytics().setAttribute(key, value);
      }
      console.log("✅ Crashlytics user attributes set:", attributes);
    } catch (error) {
      console.error("❌ Error setting Crashlytics user attributes:", error);
    }
  }

  log(message: string): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      crashlytics().log(message);
    } catch (error) {
      console.error("❌ Error logging to Crashlytics:", error);
    }
  }

  async recordError(error: Error, context?: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn("⚠️ Crashlytics not initialized, skipping recordError");
      return;
    }

    try {
      if (context) {
        this.log(`Error context: ${context}`);
      }

      await crashlytics().recordError(error);
      console.log("✅ Error recorded to Crashlytics:", error.message);
    } catch (err) {
      console.error("❌ Error recording to Crashlytics:", err);
    }
  }

  async setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void> {
    try {
      await crashlytics().setCrashlyticsCollectionEnabled(enabled);
      console.log(
        `✅ Crashlytics collection ${enabled ? "enabled" : "disabled"}`
      );
    } catch (error) {
      console.error("❌ Error setting Crashlytics collection:", error);
    }
  }

  testCrash(): void {
    console.log("💥 Testing Crashlytics - forcing crash...");
    crashlytics().crash();
  }

  async checkForUnsentReports(): Promise<boolean> {
    try {
      const hasReports = await crashlytics().checkForUnsentReports();
      console.log(`📊 Unsent crash reports: ${hasReports ? "Yes" : "No"}`);
      return hasReports;
    } catch (error) {
      console.error("❌ Error checking for unsent reports:", error);
      return false;
    }
  }

  async sendUnsentReports(): Promise<void> {
    try {
      await crashlytics().sendUnsentReports();
      console.log("✅ Unsent crash reports sent");
    } catch (error) {
      console.error("❌ Error sending unsent reports:", error);
    }
  }

  async deleteUnsentReports(): Promise<void> {
    try {
      await crashlytics().deleteUnsentReports();
      console.log("✅ Unsent crash reports deleted");
    } catch (error) {
      console.error("❌ Error deleting unsent reports:", error);
    }
  }
}

export const crashlyticsService = new CrashlyticsServiceImpl();
```

### 5. Create Error Boundary Component

Create [`components/ErrorBoundary.tsx`](../components/ErrorBoundary.tsx):

```typescript
import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { crashlyticsService } from "@/services/crashlytics";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("🚨 Error Boundary caught error:", error);
    console.error("🚨 Error Info:", errorInfo);

    // Log to Crashlytics
    crashlyticsService.log("Error Boundary caught error");
    crashlyticsService.log(`Component Stack: ${errorInfo.componentStack}`);
    crashlyticsService.recordError(error, "ErrorBoundary");
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            We've been notified and are working on a fix.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.error}>{this.state.error.toString()}</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  error: {
    fontSize: 12,
    color: "#d32f2f",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#ffebee",
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

### 6. Update App Layout

Modify [`app/_layout.tsx`](../app/_layout.tsx):

```typescript
// Add import
import { crashlyticsService } from '@/services/crashlytics';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// In the initializeApp function, after Firebase initialization:
const initializeApp = async () => {
  try {
    // Initialize Firebase
    const firebaseInitialized = await initializeFirebase();

    if (firebaseInitialized) {
      console.log('✅ Firebase initialized, setting up services...');

      // Initialize Crashlytics
      await crashlyticsService.initialize();

      // Setup notification handlers
      await setupNotificationHandlers();

      // Initialize Firebase Analytics
      await analyticsService.initialize();
    } else {
      console.warn('⚠️ Firebase initialization failed');
    }
  } catch (error) {
    console.error('❌ Error during app initialization:', error);
    // Log to Crashlytics if available
    crashlyticsService.recordError(error as Error, 'App Initialization');
  }
};

// Wrap the return statement with ErrorBoundary:
return (
  <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1, ... }}>
      {/* existing content */}
    </GestureHandlerRootView>
  </ErrorBoundary>
);
```

### 7. Update Auth Context

Modify [`contexts/AuthContext.tsx`](../contexts/AuthContext.tsx) to set user ID when user logs in:

```typescript
import { crashlyticsService } from "@/services/crashlytics";

// In login/authentication success:
await crashlyticsService.setUserId(user.id);
await crashlyticsService.setUserAttributes({
  email: user.email,
  subscription_status: user.subscriptionStatus,
  // Add other relevant user attributes
});

// On logout:
await crashlyticsService.setUserId("anonymous");
```

### 8. Create Debug Test Screen

Create [`app/(tabs)/debug.tsx`](<../app/(tabs)/debug.tsx>) (only visible in **DEV** mode):

```typescript
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { crashlyticsService } from "@/services/crashlytics";

export default function DebugScreen() {
  if (!__DEV__) {
    return null;
  }

  const handleTestCrash = () => {
    Alert.alert("Test Crash", "This will crash the app. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Crash",
        style: "destructive",
        onPress: () => crashlyticsService.testCrash(),
      },
    ]);
  };

  const handleTestError = async () => {
    try {
      throw new Error("Test non-fatal error from debug screen");
    } catch (error) {
      await crashlyticsService.recordError(error as Error, "Debug Screen Test");
      Alert.alert("Success", "Non-fatal error logged to Crashlytics");
    }
  };

  const handleCheckReports = async () => {
    const hasReports = await crashlyticsService.checkForUnsentReports();
    Alert.alert("Unsent Reports", hasReports ? "Yes" : "No");
  };

  const handleSendReports = async () => {
    await crashlyticsService.sendUnsentReports();
    Alert.alert("Success", "Unsent reports sent");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crashlytics Debug</Text>

      <TouchableOpacity style={styles.button} onPress={handleTestCrash}>
        <Text style={styles.buttonText}>Test Fatal Crash</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleTestError}>
        <Text style={styles.buttonText}>Test Non-Fatal Error</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleCheckReports}>
        <Text style={styles.buttonText}>Check Unsent Reports</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSendReports}>
        <Text style={styles.buttonText}>Send Unsent Reports</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Fatal crashes will restart the app{"\n"}• Reports appear in Firebase
          Console after ~5 minutes{"\n"}• Non-fatal errors are logged
          immediately{"\n"}• User ID and custom attributes are included
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  info: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
});
```

### 9. Global Error Handler

Add to [`app/_layout.tsx`](../app/_layout.tsx) or create [`utils/errorHandler.ts`](../utils/errorHandler.ts):

```typescript
import { crashlyticsService } from "@/services/crashlytics";

// Set up global error handler
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error("🚨 Global Error Handler:", error, "Fatal:", isFatal);

  crashlyticsService.log(`Global error (fatal: ${isFatal})`);
  crashlyticsService.recordError(
    error,
    isFatal ? "Fatal Error" : "Non-Fatal Error"
  );

  // Let the default handler also process the error
  if (isFatal) {
    // You might want to show a user-friendly error screen here
  }
});

// Handle unhandled promise rejections
const originalHandler = global.Promise.prototype.catch;
global.Promise.prototype.catch = function (onRejected) {
  return originalHandler.call(this, (error) => {
    console.error("🚨 Unhandled Promise Rejection:", error);
    crashlyticsService.recordError(error, "Unhandled Promise Rejection");

    if (onRejected) {
      return onRejected(error);
    }
    throw error;
  });
};
```

## Testing Strategy

### Manual Testing

1. **Test Fatal Crash**:

   - Use debug screen or call `crashlyticsService.testCrash()`
   - App should crash and restart
   - Check Firebase Console after 5 minutes

2. **Test Non-Fatal Error**:

   ```typescript
   try {
     throw new Error("Test error");
   } catch (error) {
     await crashlyticsService.recordError(error as Error, "Test Context");
   }
   ```

3. **Test Error Boundary**:

   - Create a component that throws an error
   - Verify error boundary catches it
   - Check Firebase Console

4. **Verify User Identification**:
   - Log in as a user
   - Trigger an error
   - Verify user ID appears in Firebase Console

### Automated Testing

Create test script [`scripts/test-crashlytics.js`](../scripts/test-crashlytics.js):

```javascript
// Test script to verify Crashlytics integration
// Run with: node scripts/test-crashlytics.js
```

## Firebase Console Setup

1. Navigate to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Crashlytics section
4. Enable Crashlytics if not already enabled
5. Wait for first crash report to appear (can take 5-10 minutes)

## Monitoring & Alerts

### Set Up Alerts

1. Go to Firebase Console > Crashlytics > Settings
2. Configure email alerts for:
   - New issues
   - Regressed issues
   - Velocity alerts (spike in crashes)

### Key Metrics to Monitor

- **Crash-free users**: Target > 99.5%
- **Crash-free sessions**: Target > 99.9%
- **Most impacted users**: Identify users with repeated crashes
- **Top crashes**: Focus on fixing highest-impact issues

## Best Practices

### When to Use Crashlytics

✅ **DO use for**:

- Fatal crashes (automatic)
- Unhandled exceptions
- Critical errors that affect user experience
- API failures that prevent core functionality
- Data corruption issues

❌ **DON'T use for**:

- Expected validation errors
- User input errors
- Network timeouts (unless critical)
- Debug logging (use console.log instead)

### Custom Logging

```typescript
// Add breadcrumbs before errors
crashlyticsService.log("User opened article screen");
crashlyticsService.log("Fetching article data...");
// ... error occurs
crashlyticsService.recordError(error, "Article Fetch");
```

### User Privacy

- Only log necessary user information
- Avoid logging sensitive data (passwords, tokens, etc.)
- Consider GDPR compliance
- Allow users to opt-out if required

## Troubleshooting

### Crashes Not Appearing

1. Wait 5-10 minutes after crash
2. Ensure app is in release mode (not debug)
3. Check Firebase Console for project selection
4. Verify `google-services.json` / `GoogleService-Info.plist` are correct
5. Check Gradle/CocoaPods build logs for errors

### Symbol Upload Issues

**Android**:

- Ensure ProGuard mapping files are uploaded
- Check `build/outputs/mapping/release/mapping.txt`

**iOS**:

- Ensure dSYM files are uploaded
- Check Xcode build settings for "Debug Information Format"

### Common Errors

1. **"Crashlytics not initialized"**: Ensure `initialize()` is called before other methods
2. **"No crash reports"**: Wait longer, check release build
3. **"Missing symbols"**: Upload dSYM/mapping files manually

## Documentation

### For Developers

Create [`docs/crashlytics-usage.md`](./crashlytics-usage.md) with:

- How to log errors
- When to use Crashlytics vs console.log
- How to test locally
- How to access Firebase Console

### For QA Team

- How to trigger test crashes
- What to look for in crash reports
- How to reproduce issues from crash reports

## Rollout Plan

1. **Phase 1**: Development testing

   - Test on development builds
   - Verify reports appear in console
   - Test all error scenarios

2. **Phase 2**: Beta testing

   - Deploy to internal testers
   - Monitor crash reports
   - Fix critical issues

3. **Phase 3**: Production rollout
   - Deploy to production
   - Monitor crash-free rate
   - Set up alerts
   - Regular review of top crashes

## Success Criteria

- ✅ Crashlytics successfully captures fatal crashes
- ✅ Non-fatal errors are logged correctly
- ✅ User identification works
- ✅ Custom attributes appear in reports
- ✅ Error boundary catches React errors
- ✅ Debug test screen works
- ✅ Crash-free rate > 99.5%
- ✅ Reports appear in Firebase Console within 10 minutes

## Timeline

- **Day 1**: Install dependencies, configure Android/iOS
- **Day 2**: Create service module, error boundary
- **Day 3**: Integrate with app, add debug screen
- **Day 4**: Testing and verification
- **Day 5**: Documentation and rollout

## Resources

- [Firebase Crashlytics Documentation](https://firebase.google.com/docs/crashlytics)
- [React Native Firebase Crashlytics](https://rnfirebase.io/crashlytics/usage)
- [Error Boundaries in React](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
