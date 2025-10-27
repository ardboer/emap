import AsyncStorage from "@react-native-async-storage/async-storage";
import * as TrackingTransparency from "expo-tracking-transparency";
import { Platform } from "react-native";

const TRACKING_PERMISSION_KEY = "@tracking_permission_status";

/**
 * Tracking permission status types
 */
export type TrackingStatus =
  | "authorized"
  | "denied"
  | "restricted"
  | "notDetermined"
  | "unavailable";

/**
 * Result of tracking permission request
 */
export interface TrackingPermissionResult {
  status: TrackingStatus;
  canTrack: boolean;
}

/**
 * Check if the device supports App Tracking Transparency
 * ATT is only available on iOS 14+
 */
export function isTrackingAvailable(): boolean {
  if (Platform.OS !== "ios") {
    return false;
  }

  // Check iOS version - ATT requires iOS 14+
  const version = parseInt(Platform.Version as string, 10);
  return version >= 14;
}

/**
 * Get the current tracking permission status
 * Returns the status from the system without requesting permission
 */
export async function getTrackingStatus(): Promise<TrackingStatus> {
  if (!isTrackingAvailable()) {
    return "unavailable";
  }

  try {
    const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
    return mapTrackingStatus(status);
  } catch (error) {
    console.error("Error getting tracking status:", error);
    return "unavailable";
  }
}

/**
 * Request tracking permission from the user
 * This will show the system ATT prompt
 */
export async function requestTrackingPermission(): Promise<TrackingPermissionResult> {
  if (!isTrackingAvailable()) {
    return {
      status: "unavailable",
      canTrack: false,
    };
  }

  try {
    const { status } =
      await TrackingTransparency.requestTrackingPermissionsAsync();
    const mappedStatus = mapTrackingStatus(status);
    const canTrack = mappedStatus === "authorized";

    // Store the permission status
    await storeTrackingPermission(mappedStatus);

    return {
      status: mappedStatus,
      canTrack,
    };
  } catch (error) {
    console.error("Error requesting tracking permission:", error);
    return {
      status: "unavailable",
      canTrack: false,
    };
  }
}

/**
 * Store the tracking permission status in AsyncStorage
 */
export async function storeTrackingPermission(
  status: TrackingStatus
): Promise<void> {
  try {
    await AsyncStorage.setItem(TRACKING_PERMISSION_KEY, status);
  } catch (error) {
    console.error("Error storing tracking permission:", error);
  }
}

/**
 * Retrieve the stored tracking permission status from AsyncStorage
 */
export async function getStoredTrackingPermission(): Promise<TrackingStatus | null> {
  try {
    const status = await AsyncStorage.getItem(TRACKING_PERMISSION_KEY);
    return status as TrackingStatus | null;
  } catch (error) {
    console.error("Error retrieving tracking permission:", error);
    return null;
  }
}

/**
 * Check if tracking is currently allowed
 * Combines system status check with stored preference
 */
export async function canTrack(): Promise<boolean> {
  if (!isTrackingAvailable()) {
    return false;
  }

  try {
    const status = await getTrackingStatus();
    return status === "authorized";
  } catch (error) {
    console.error("Error checking tracking permission:", error);
    return false;
  }
}

/**
 * Map expo-tracking-transparency status to our TrackingStatus type
 */
function mapTrackingStatus(
  status: TrackingTransparency.PermissionStatus
): TrackingStatus {
  switch (status) {
    case TrackingTransparency.PermissionStatus.GRANTED:
      return "authorized";
    case TrackingTransparency.PermissionStatus.DENIED:
      return "denied";
    case TrackingTransparency.PermissionStatus.RESTRICTED:
      return "restricted";
    case TrackingTransparency.PermissionStatus.UNDETERMINED:
      return "notDetermined";
    default:
      return "unavailable";
  }
}

/**
 * Clear stored tracking permission
 * Useful for testing or resetting app state
 */
export async function clearTrackingPermission(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TRACKING_PERMISSION_KEY);
  } catch (error) {
    console.error("Error clearing tracking permission:", error);
  }
}
