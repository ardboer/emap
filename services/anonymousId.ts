import AsyncStorage from "@react-native-async-storage/async-storage";

const ANONYMOUS_ID_KEY = "@miso_anonymous_id";

/**
 * Generate a persistent anonymous ID in Google Analytics format
 * Format: timestamp.random (e.g., "1658570109.1761120937")
 *
 * This ID is stored in AsyncStorage and persists across app sessions.
 * It's used for anonymous user tracking in Miso API calls.
 */
export async function getAnonymousId(): Promise<string> {
  try {
    // Try to get existing ID from storage
    const existingId = await AsyncStorage.getItem(ANONYMOUS_ID_KEY);

    if (existingId) {
      console.log("Using existing anonymous ID:", existingId);
      return existingId;
    }

    // Generate new ID in Google Analytics format
    const timestamp = Date.now();
    const random = Math.random().toString().substring(2, 12);
    const newId = `${timestamp}.${random}`;

    // Store the new ID
    await AsyncStorage.setItem(ANONYMOUS_ID_KEY, newId);
    console.log("Generated new anonymous ID:", newId);

    return newId;
  } catch (error) {
    console.error("Error managing anonymous ID:", error);

    // Fallback: generate a temporary ID without storage
    // This ensures the app continues to work even if storage fails
    const timestamp = Date.now();
    const random = Math.random().toString().substring(2, 12);
    const fallbackId = `${timestamp}.${random}`;
    console.warn("Using fallback anonymous ID (not persisted):", fallbackId);

    return fallbackId;
  }
}

/**
 * Clear the stored anonymous ID
 * Useful for testing or when user opts out of tracking
 */
export async function clearAnonymousId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ANONYMOUS_ID_KEY);
    console.log("Anonymous ID cleared");
  } catch (error) {
    console.error("Error clearing anonymous ID:", error);
  }
}
