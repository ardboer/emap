import AsyncStorage from "@react-native-async-storage/async-storage";

const PUSH_TOKEN_KEY = "expoPushToken";
const ALL_TOKENS_KEY = "allPushTokens";

export interface PushTokenRecord {
  token: string;
  brand: string;
  userId?: string;
  deviceId?: string;
  registeredAt: string;
  lastUpdated: string;
}

/**
 * Save the current device's push token
 */
export async function savePushToken(
  token: string,
  brand: string,
  userId?: string
): Promise<void> {
  try {
    // Save the current token
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // Get all tokens
    const allTokens = await getAllPushTokens();

    // Create or update the token record
    const tokenRecord: PushTokenRecord = {
      token,
      brand,
      userId,
      deviceId: await getDeviceId(),
      registeredAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    // Check if token already exists
    const existingIndex = allTokens.findIndex((t) => t.token === token);
    if (existingIndex >= 0) {
      // Update existing
      allTokens[existingIndex] = {
        ...allTokens[existingIndex],
        ...tokenRecord,
        registeredAt: allTokens[existingIndex].registeredAt, // Keep original registration date
      };
    } else {
      // Add new
      allTokens.push(tokenRecord);
    }

    // Save back to storage
    await AsyncStorage.setItem(ALL_TOKENS_KEY, JSON.stringify(allTokens));

    console.log("Push token saved:", token);
  } catch (error) {
    console.error("Error saving push token:", error);
    throw error;
  }
}

/**
 * Get all registered push tokens
 */
export async function getAllPushTokens(): Promise<PushTokenRecord[]> {
  try {
    const tokensJson = await AsyncStorage.getItem(ALL_TOKENS_KEY);
    if (tokensJson) {
      return JSON.parse(tokensJson);
    }
    return [];
  } catch (error) {
    console.error("Error getting all push tokens:", error);
    return [];
  }
}

/**
 * Get tokens for a specific brand
 */
export async function getTokensByBrand(
  brand: string
): Promise<PushTokenRecord[]> {
  const allTokens = await getAllPushTokens();
  return allTokens.filter((t) => t.brand === brand);
}

/**
 * Get the current device's push token
 */
export async function getCurrentPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch (error) {
    console.error("Error getting current push token:", error);
    return null;
  }
}

/**
 * Remove a specific token
 */
export async function removePushToken(token: string): Promise<void> {
  try {
    const allTokens = await getAllPushTokens();
    const filtered = allTokens.filter((t) => t.token !== token);
    await AsyncStorage.setItem(ALL_TOKENS_KEY, JSON.stringify(filtered));
    console.log("Push token removed:", token);
  } catch (error) {
    console.error("Error removing push token:", error);
    throw error;
  }
}

/**
 * Clear all tokens (for testing/debugging)
 */
export async function clearAllPushTokens(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ALL_TOKENS_KEY);
    console.log("All push tokens cleared");
  } catch (error) {
    console.error("Error clearing push tokens:", error);
    throw error;
  }
}

/**
 * Export all tokens to a format suitable for the notification script
 */
export async function exportTokensForScript(): Promise<{
  tokens: string[];
  brands: { [key: string]: string[] };
}> {
  const allTokens = await getAllPushTokens();

  const result = {
    tokens: allTokens.map((t) => t.token),
    brands: {} as { [key: string]: string[] },
  };

  // Group by brand
  allTokens.forEach((tokenRecord) => {
    if (!result.brands[tokenRecord.brand]) {
      result.brands[tokenRecord.brand] = [];
    }
    result.brands[tokenRecord.brand].push(tokenRecord.token);
  });

  return result;
}

/**
 * Get a unique device identifier (simplified version)
 */
async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await AsyncStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  } catch (error) {
    return `device_${Date.now()}`;
  }
}
