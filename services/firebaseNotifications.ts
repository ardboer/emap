import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import { PermissionsAndroid, Platform } from "react-native";
import { isFirebaseInitialized, isMessagingAvailable } from "./firebaseInit";

// Set up background message handler immediately
// This must be done at module load time, not inside a function
// messaging().setBackgroundMessageHandler(async (remoteMessage) => {
//   console.log("📬 Background message received:", remoteMessage);
//   // Handle background messages here if needed
//   // For example, you could update local storage or trigger a local notification
// });

const FCM_TOKEN_KEY = "fcmPushToken";

/**
 * Request notification permissions from the user
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available");
    return false;
  }

  try {
    // Android 13+ (API 33+) requires runtime permission request
    if (Platform.OS === "android" && Platform.Version >= 33) {
      console.log(
        "📱 Android 13+ detected - requesting POST_NOTIFICATIONS permission"
      );

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: "Enable Notifications",
          message: "Allow this app to send you notifications?",
          buttonPositive: "Allow",
          buttonNegative: "Don't Allow",
        }
      );

      const permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;

      if (permissionGranted) {
        console.log("✅ Android notification permission granted");
        return true;
      } else {
        console.log("❌ Android notification permission denied:", granted);
        return false;
      }
    }

    // iOS or older Android versions - use Firebase messaging API
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log("✅ Notification permission granted:", authStatus);
      return true;
    } else {
      console.log("❌ Notification permission denied:", authStatus);
      return false;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

/**
 * Check if notification permissions are granted
 * @returns Promise<boolean>
 */
export async function checkNotificationPermission(): Promise<boolean> {
  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available");
    return false;
  }

  try {
    // Android 13+ (API 33+) - check runtime permission
    if (Platform.OS === "android" && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted;
    }

    // iOS or older Android versions
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.error("Error checking notification permission:", error);
    return false;
  }
}

/**
 * Get the FCM token for this device
 * @returns Promise<string | null> - FCM token or null if failed
 */
export async function getFCMToken(): Promise<string | null> {
  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available - cannot get FCM token");
    return null;
  }

  try {
    // Get FCM token directly - messaging().getToken() will handle permission check
    const token = await messaging().getToken();

    if (token) {
      console.log("✅ FCM token obtained:", token);
      // Store the token
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      return token;
    } else {
      console.log("⚠️ No FCM token available");
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

/**
 * Get the stored FCM token from AsyncStorage
 * @returns Promise<string | null>
 */
export async function getStoredFCMToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error("Error getting stored FCM token:", error);
    return null;
  }
}

/**
 * Delete the FCM token (e.g., on logout)
 */
export async function deleteFCMToken(): Promise<void> {
  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available");
    return;
  }

  try {
    await messaging().deleteToken();
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    console.log("✅ FCM token deleted");
  } catch (error) {
    console.error("Error deleting FCM token:", error);
  }
}

/**
 * Set up FCM token refresh listener
 * @param callback - Function to call when token is refreshed
 * @returns Unsubscribe function
 */
export function onTokenRefresh(callback: (token: string) => void): () => void {
  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available");
    return () => {};
  }

  return messaging().onTokenRefresh(async (token) => {
    console.log("🔄 FCM token refreshed:", token);
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    callback(token);
  });
}

/**
 * Set up foreground message listener
 * @param callback - Function to call when message is received
 * @returns Unsubscribe function
 */
export function onMessageReceived(
  callback: (message: any) => void
): () => void {
  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available");
    return () => {};
  }

  return messaging().onMessage(async (remoteMessage) => {
    console.log("📬 Foreground message received:", remoteMessage);
    callback(remoteMessage);
  });
}

/**
 * Set up background message handler
 * This must be called outside of your application lifecycle (e.g., in index.js)
 */
export function setBackgroundMessageHandler(
  handler: (message: any) => Promise<void>
): void {
  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available");
    return;
  }

  messaging().setBackgroundMessageHandler(handler);
}

/**
 * Get the initial notification that opened the app (if any)
 * @returns Promise<any | null>
 */
export async function getInitialNotification(): Promise<any | null> {
  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available");
    return null;
  }

  try {
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      console.log("🎯 App opened from notification:", remoteMessage);
      return remoteMessage;
    }
    return null;
  } catch (error) {
    console.error("Error getting initial notification:", error);
    return null;
  }
}

/**
 * Set up notification opened listener (when app is in background)
 * @param callback - Function to call when notification is opened
 * @returns Unsubscribe function
 */
export function onNotificationOpened(
  callback: (message: any) => void
): () => void {
  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available");
    return () => {};
  }

  return messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log("👆 Notification opened app from background:", remoteMessage);
    callback(remoteMessage);
  });
}

/**
 * Subscribe to a topic
 * @param topic - Topic name to subscribe to
 */
export async function subscribeToTopic(topic: string): Promise<void> {
  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available");
    return;
  }

  try {
    await messaging().subscribeToTopic(topic);
    console.log(`✅ Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
  }
}

/**
 * Unsubscribe from a topic
 * @param topic - Topic name to unsubscribe from
 */
export async function unsubscribeFromTopic(topic: string): Promise<void> {
  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available");
    return;
  }

  try {
    await messaging().unsubscribeFromTopic(topic);
    console.log(`✅ Unsubscribed from topic: ${topic}`);
  } catch (error) {
    console.error(`Error unsubscribing from topic ${topic}:`, error);
  }
}

/**
 * Initialize Firebase Cloud Messaging
 * Call this early in your app lifecycle
 */
export async function initializeFirebaseMessaging(): Promise<void> {
  if (!isFirebaseInitialized()) {
    console.error("❌ Firebase not initialized - cannot initialize messaging");
    return;
  }

  if (!isMessagingAvailable()) {
    console.warn("⚠️ Firebase Messaging not available on this platform/device");
    return;
  }

  try {
    console.log("🔥 Initializing Firebase Cloud Messaging...");

    // Request permission
    const hasPermission = await requestNotificationPermission();

    if (hasPermission) {
      // Get FCM token
      await getFCMToken();
      console.log("✅ Firebase Cloud Messaging initialized");
    } else {
      console.log(
        "⚠️ Firebase Cloud Messaging not initialized - no permission"
      );
    }
  } catch (error) {
    console.error("Error initializing Firebase Cloud Messaging:", error);
  }
}
