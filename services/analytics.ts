import { brandManager } from "@/config/BrandManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAnalytics,
  logEvent,
  logScreenView,
  logSearch,
  setAnalyticsCollectionEnabled,
  setUserProperty,
} from "@react-native-firebase/analytics";
import { getApp } from "@react-native-firebase/app";

const ANALYTICS_ENABLED_KEY = "analytics_enabled";

/**
 * Firebase Analytics Service
 * Provides comprehensive tracking for user behavior, screen views, and carousel interactions
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
   * Log screen view with automatic time tracking
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Calculate time on previous screen
      if (this.currentScreen && this.screenStartTime) {
        const timeOnScreen = Date.now() - this.screenStartTime;
        await this.logEvent("screen_time", {
          screen_name: this.currentScreen,
          duration_ms: timeOnScreen,
          duration_seconds: Math.round(timeOnScreen / 1000),
        });
      }

      // Log new screen view
      if (!this.analytics) return;
      await logScreenView(this.analytics, {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });

      this.currentScreen = screenName;
      this.screenStartTime = Date.now();
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
      console.log(`📊 Analytics Event: ${eventName}`, {
        params: Object.keys(eventData).length,
        brand: brandConfig.shortcode,
      });

      if (!this.analytics) return;
      await logEvent(this.analytics, eventName, eventData);
    } catch (error) {
      console.error(`❌ Error logging event ${eventName}:`, error);
    }
  }

  /**
   * Calculate scroll depth metrics for carousel
   */
  calculateScrollDepthMetrics(
    maxIndex: number,
    totalArticles: number,
    indexesViewed: Set<number>
  ): {
    scroll_depth_percentage: number;
    unique_view_percentage: number;
    completion_rate: number;
    reached_end: boolean;
    drop_off_index: number | null;
  } {
    const scrollDepthPercentage = ((maxIndex + 1) / totalArticles) * 100;
    const uniqueViewPercentage = (indexesViewed.size / totalArticles) * 100;
    const completionRate =
      maxIndex === totalArticles - 1 ? 100 : scrollDepthPercentage;

    return {
      scroll_depth_percentage: Math.round(scrollDepthPercentage),
      unique_view_percentage: Math.round(uniqueViewPercentage),
      completion_rate: Math.round(completionRate),
      reached_end: maxIndex === totalArticles - 1,
      drop_off_index: maxIndex < totalArticles - 1 ? maxIndex : null,
    };
  }

  /**
   * Analyze scroll velocity patterns
   */
  analyzeScrollVelocity(
    velocityData: { from: number; to: number; duration: number }[]
  ): {
    avg_transition_duration_ms: number;
    min_transition_duration_ms: number;
    max_transition_duration_ms: number;
    total_transitions: number;
  } | null {
    if (velocityData.length === 0) return null;

    const durations = velocityData.map((v) => v.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    return {
      avg_transition_duration_ms: Math.round(avgDuration),
      min_transition_duration_ms: minDuration,
      max_transition_duration_ms: maxDuration,
      total_transitions: velocityData.length,
    };
  }

  /**
   * Log app foreground event
   */
  async logAppForeground(previousState: string): Promise<void> {
    await this.logEvent("app_foreground", {
      previous_state: previousState,
    });
  }

  /**
   * Log app background event
   */
  async logAppBackground(nextState: string): Promise<void> {
    await this.logEvent("app_went_background", {
      next_state: nextState,
    });
  }

  /**
   * Log navigation event
   */
  async logNavigation(
    fromScreen: string,
    toScreen: string,
    params?: Record<string, any>
  ): Promise<void> {
    await this.logEvent("screen_navigation", {
      from_screen: fromScreen,
      to_screen: toScreen,
      params: params ? JSON.stringify(params) : undefined,
    });
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
