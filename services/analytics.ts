import { brandManager } from "@/config/BrandManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAnalytics,
  logEvent,
  logScreenView,
  logSearch,
  setAnalyticsCollectionEnabled,
  setUserId,
  setUserProperty,
} from "@react-native-firebase/analytics";
import { getApp } from "@react-native-firebase/app";
import { getUserInfo } from "./auth";

const ANALYTICS_ENABLED_KEY = "analytics_enabled";

/**
 * Firebase Analytics Service
 * Provides tracking for user behavior, screen views, and key interactions
 */
class AnalyticsService {
  private sessionStartTime: number | null = null;
  private screenStartTime: number | null = null;
  private currentScreen: string | null = null;
  private isInitialized: boolean = false;
  private analytics: ReturnType<typeof getAnalytics> | null = null;

  /**
   * Initialize Firebase Analytics
   * Sets up brand-specific user properties and starts session tracking
   */
  async initialize(): Promise<void> {
    console.log("🔥 Initializing Firebase Analytics...");

    try {
      // Initialize Firebase Analytics instance
      const app = getApp();
      this.analytics = getAnalytics(app);

      // Enable analytics collection explicitly
      await setAnalyticsCollectionEnabled(this.analytics, true);
      console.log("📊 Analytics collection explicitly enabled");

      // Check if analytics is enabled
      const enabled = await this.isAnalyticsEnabled();
      if (!enabled) {
        console.log("📊 Analytics disabled by user preference");
        return;
      }

      // Set brand as user property
      const brandConfig = brandManager.getCurrentBrand();
      await setUserProperty(this.analytics, "brand", brandConfig.shortcode);

      // Set enabled features as user properties (shortened to fit 36 char limit)
      const features = brandConfig.features;
      const enabledFeatures = Object.entries(features)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => {
          // Shorten feature names to fit within 36 character limit
          const shortNames: Record<string, string> = {
            enablePodcasts: "pod",
            enablePaper: "pap",
            enableClinical: "cli",
            enableEvents: "evt",
            enableAsk: "ask",
            enableMagazine: "mag",
          };
          return shortNames[feature] || feature.substring(0, 3);
        });

      // Join with comma, ensuring total length stays under 36 chars
      const featuresString = enabledFeatures.join(",");
      await setUserProperty(
        this.analytics,
        "features_enabled",
        featuresString.substring(0, 36)
      );

      // Get brand config for additional properties
      await setUserProperty(this.analytics, "brand_name", brandConfig.name);
      await setUserProperty(
        this.analytics,
        "bundle_id",
        brandConfig.bundleId || ""
      );

      // Set user ID if available
      await this.setUserIdFromAuth();

      // Start session tracking
      // Note: Using 'app_session_start' instead of 'session_start' because 'session_start' is a reserved Firebase event
      this.sessionStartTime = Date.now();
      await this.logEvent("app_session_start", {
        brand: brandConfig.shortcode,
        brand_name: brandConfig.name,
        timestamp: new Date().toISOString(),
      });

      this.isInitialized = true;
      console.log("✅ Firebase Analytics initialized successfully");
      console.log(`📊 Brand: ${brandConfig.shortcode} (${brandConfig.name})`);
      console.log(`📊 Features: ${featuresString}`);
    } catch (error) {
      console.error("❌ Error initializing Firebase Analytics:", error);
    }
  }

  /**
   * Check if analytics is enabled
   */
  async isAnalyticsEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(ANALYTICS_ENABLED_KEY);
      return enabled !== "false"; // Default to true if not set
    } catch (error) {
      console.error("Error checking analytics enabled status:", error);
      return true; // Default to enabled
    }
  }

  /**
   * Enable or disable analytics collection
   */
  async setAnalyticsEnabled(enabled: boolean): Promise<void> {
    try {
      if (!this.analytics) {
        const app = getApp();
        this.analytics = getAnalytics(app);
      }
      await setAnalyticsCollectionEnabled(this.analytics, enabled);
      await AsyncStorage.setItem(ANALYTICS_ENABLED_KEY, enabled.toString());
      console.log(`📊 Analytics ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error setting analytics enabled status:", error);
    }
  }

  /**
   * Set user ID from authentication if available
   */
  async setUserIdFromAuth(): Promise<void> {
    try {
      const userInfo = await getUserInfo();
      if (userInfo && userInfo.user_id) {
        if (!this.analytics) {
          const app = getApp();
          this.analytics = getAnalytics(app);
        }
        await setUserId(this.analytics, userInfo.user_id);
        console.log(`📊 User ID set: ${userInfo.user_id}`);
      }
    } catch (error) {
      console.error("Error setting user ID:", error);
    }
  }

  /**
   * Clear user ID from analytics (e.g., when user logs out)
   */
  async clearUserId(): Promise<void> {
    try {
      if (!this.analytics) {
        const app = getApp();
        this.analytics = getAnalytics(app);
      }
      await setUserId(this.analytics, null);
      console.log("📊 User ID cleared from analytics");
    } catch (error) {
      console.error("Error clearing user ID:", error);
    }
  }

  /**
   * Log screen view
   */
  async logScreenView(
    screenName: string,
    screenClass?: string,
    additionalParams?: Record<string, any>
  ): Promise<void> {
    if (!this.isInitialized) return;

    try {
      if (!this.analytics) return;

      const params: Record<string, any> = {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      };

      // Add any additional parameters (e.g., article_id, source for article detail)
      if (additionalParams) {
        Object.assign(params, additionalParams);
      }

      await logScreenView(this.analytics, params);

      this.currentScreen = screenName;
    } catch (error) {
      console.error("Error logging screen view:", error);
    }
  }

  /**
   * End current session and log duration
   */
  async endSession(): Promise<void> {
    if (!this.isInitialized || !this.sessionStartTime) return;

    try {
      const sessionDuration = Date.now() - this.sessionStartTime;
      // Note: Using 'app_session_end' instead of 'session_end' because 'session_end' is a reserved Firebase event
      await this.logEvent("app_session_end", {
        duration_ms: sessionDuration,
        duration_seconds: Math.round(sessionDuration / 1000),
        duration_minutes: Math.round(sessionDuration / 60000),
      });
      this.sessionStartTime = null;
    } catch (error) {
      console.error("Error ending session:", error);
    }
  }

  /**
   * Filter out null, undefined, and invalid values from parameters
   */
  private sanitizeParams(params?: Record<string, any>): Record<string, any> {
    if (!params) return {};

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      // Skip null, undefined, and NaN values
      if (value === null || value === undefined || Number.isNaN(value)) {
        continue;
      }

      // Only include valid types: string, number, boolean, or array
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        Array.isArray(value)
      ) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Log generic event with brand context
   */
  async logEvent(
    eventName: string,
    params?: Record<string, any>
  ): Promise<void> {
    if (!this.isInitialized) {
      console.log(`⚠️ Analytics not initialized, skipping event: ${eventName}`);
      return;
    }

    try {
      const brandConfig = brandManager.getCurrentBrand();
      const sanitizedParams = this.sanitizeParams(params);

      const eventData = {
        ...sanitizedParams,
        brand: brandConfig.shortcode,
        timestamp: Date.now(),
      };

      // Log to console for debugging
      // console.log(`📊 Analytics Event: ${eventName}`, {
      //   params: Object.keys(eventData).length,
      //   brand: brandConfig.shortcode,
      // });

      if (!this.analytics) return;
      await logEvent(this.analytics, eventName, eventData);
    } catch (error) {
      console.error(`❌ Error logging event ${eventName}:`, error);
    }
  }

  /**
   * Log article view
   */
  async logArticleView(
    articleId: string,
    articleTitle: string,
    category?: string
  ): Promise<void> {
    await this.logEvent("article_view", {
      article_id: articleId,
      article_title: articleTitle,
      article_category: category,
    });
  }

  /**
   * Log highlights view event
   */
  async logHighlightsView(
    index: number,
    articleId: string,
    articleTitle: string
  ): Promise<void> {
    await this.logEvent("highlights_view", {
      index,
      article_id: articleId,
      article_title: articleTitle,
    });
  }

  /**
   * Log highlights click event
   */
  async logHighlightsClick(
    index: number,
    articleId: string,
    articleTitle: string
  ): Promise<void> {
    await this.logEvent("highlights_click", {
      index,
      article_id: articleId,
      article_title: articleTitle,
    });
  }

  /**
   * Log search event
   */
  async logSearch(searchTerm: string, resultsCount: number): Promise<void> {
    if (!this.analytics) return;
    await logSearch(this.analytics, {
      search_term: searchTerm,
    });
    await this.logEvent("search_performed", {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
