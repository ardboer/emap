import { ACTIVE_BRAND } from "@/config/brandKey";
import crashlytics from "@react-native-firebase/crashlytics";
import { Platform } from "react-native";

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

      // Set app version (from package.json)
      await crashlytics().setAttribute("app_version", "1.0.0");

      // Set OS version
      await crashlytics().setAttribute(
        "os_version",
        Platform.Version.toString()
      );

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
