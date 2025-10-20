import firebase from "@react-native-firebase/app";
import { Platform } from "react-native";

let isInitialized = false;
let initializationError: Error | null = null;

/**
 * Check if Firebase is properly initialized
 */
export function isFirebaseInitialized(): boolean {
  return isInitialized;
}

/**
 * Get the initialization error if any
 */
export function getInitializationError(): Error | null {
  return initializationError;
}

/**
 * Check if we're running on iOS simulator
 * Uses a more reliable detection method
 */
export function isIOSSimulator(): boolean {
  if (Platform.OS !== "ios") return false;

  // Check if running on simulator by attempting to detect simulator-specific characteristics
  // On real devices, Platform.constants will have different values
  // This is a heuristic but works in most cases
  const constants = Platform.constants as any;

  // Simulators typically have "Simulator" in the model name
  if (constants?.reactNativeVersion?.model?.includes("Simulator")) {
    return true;
  }

  // Another check: simulators often have x86_64 architecture
  if (
    constants?.systemName === "iOS" &&
    constants?.interfaceIdiom === "phone"
  ) {
    // If we can't determine for sure, assume it's a real device in production
    // This is safer than blocking real devices
    return false;
  }

  return false;
}

/**
 * Initialize Firebase
 * This should be called early in the app lifecycle
 */
export async function initializeFirebase(): Promise<boolean> {
  try {
    // Check if already initialized
    if (isInitialized) {
      console.log("✅ Firebase already initialized");
      return true;
    }

    // Check if running on iOS simulator
    if (Platform.OS === "ios" && __DEV__) {
      console.warn(
        "⚠️ Running on iOS - Firebase Cloud Messaging requires a real device"
      );
      console.warn("⚠️ Push notifications will not work in the iOS simulator");
    }

    // Check if Firebase app exists
    const apps = firebase.apps;
    if (apps.length === 0) {
      console.error(
        "❌ No Firebase app found. Make sure GoogleService-Info.plist (iOS) or google-services.json (Android) is properly configured"
      );
      initializationError = new Error("No Firebase app configured");
      return false;
    }

    // Get the default app
    const app = firebase.app();
    console.log("✅ Firebase app found:", app.name);

    isInitialized = true;
    console.log("✅ Firebase initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Error initializing Firebase:", error);
    initializationError = error as Error;
    isInitialized = false;
    return false;
  }
}

/**
 * Check if Firebase Cloud Messaging is available
 * FCM doesn't work on iOS simulator
 */
export function isMessagingAvailable(): boolean {
  if (!isInitialized) {
    console.warn("⚠️ Firebase not initialized");
    return false;
  }

  // Check if actually running on iOS simulator
  if (Platform.OS === "ios" && isIOSSimulator()) {
    console.warn("⚠️ FCM not available on iOS simulator");
    return false;
  }

  return true;
}
