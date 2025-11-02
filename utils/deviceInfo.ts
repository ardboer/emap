import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Gathers device and app information for support emails
 * @param brandName - The name of the current brand
 * @returns Formatted string with device information
 */
export function getDeviceInfo(brandName?: string): string {
  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ||
    Constants.expoConfig?.android?.versionCode ||
    "N/A";

  const deviceInfo = [
    "\n\n--- Device Information ---",
    `Brand: ${brandName || "Unknown"}`,
    `App Version: ${appVersion} (${buildNumber})`,
    `Platform: ${Platform.OS}`,
    `OS Version: ${Platform.Version}`,
    `Device: ${Constants.deviceName || "Unknown"}`,
  ];

  // Add platform-specific information
  if (Platform.OS === "ios") {
    deviceInfo.push(
      `iOS Model: ${Constants.platform?.ios?.model || "Unknown"}`
    );
  } else if (Platform.OS === "android") {
    deviceInfo.push(
      `Android Model: ${Constants.platform?.android?.model || "Unknown"}`
    );
  }

  return deviceInfo.join("\n");
}

/**
 * Creates a mailto URL for support emails with device info
 * @param supportEmail - The support email address
 * @param brandName - The name of the current brand
 * @returns Formatted mailto URL
 */
export function createSupportEmailUrl(
  supportEmail: string,
  brandName?: string
): string {
  const subject = `Support Request - ${brandName || "App"}`;
  const body = getDeviceInfo(brandName);

  // URL encode the subject and body
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  return `mailto:${supportEmail}?subject=${encodedSubject}&body=${encodedBody}`;
}
