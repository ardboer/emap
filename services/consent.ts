import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentInfo,
  AdsConsentStatus,
} from "react-native-google-mobile-ads";

/**
 * Consent Management Service
 * Implements IAB TCF 2.2 compliant consent management using Google UMP SDK
 *
 * CRITICAL: Must be initialized and consent obtained BEFORE any ad requests
 */

const CONSENT_STORAGE_KEY = "@consent_status";
const CONSENT_INFO_STORAGE_KEY = "@consent_info";

export interface ConsentState {
  status: AdsConsentStatus;
  canRequestAds: boolean;
  isConsentFormAvailable: boolean;
  lastUpdated: number;
}

class ConsentService {
  private consentInfo: AdsConsentInfo | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<ConsentState> | null = null;

  /**
   * Initialize consent management
   * Must be called before any ad requests
   *
   * @param debugGeography - Optional debug geography for testing
   * @param testDeviceIds - Optional test device IDs for debugging
   * @returns Promise<ConsentState> - Current consent state
   */
  async initialize(
    debugGeography?: AdsConsentDebugGeography,
    testDeviceIds?: string[]
  ): Promise<ConsentState> {
    // Return existing initialization if in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return cached state if already initialized
    if (this.isInitialized && this.consentInfo) {
      return this.getConsentState();
    }

    this.initializationPromise = this._initialize(
      debugGeography,
      testDeviceIds
    );

    try {
      const state = await this.initializationPromise;
      this.isInitialized = true;
      return state;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async _initialize(
    debugGeography?: AdsConsentDebugGeography,
    testDeviceIds?: string[]
  ): Promise<ConsentState> {
    try {
      console.log("[Consent] Initializing consent management...");

      // Configure debug settings if provided
      if (__DEV__ && (debugGeography || testDeviceIds)) {
        await AdsConsent.requestInfoUpdate({
          debugGeography,
          testDeviceIdentifiers: testDeviceIds,
        });
        console.log("[Consent] Debug settings applied:", {
          debugGeography,
          testDeviceIds,
        });
      } else {
        // Production: Request consent info update
        await AdsConsent.requestInfoUpdate();
      }

      // Get current consent information
      this.consentInfo = await AdsConsent.getConsentInfo();

      const state = this.getConsentState();

      // Cache consent state
      await this.cacheConsentState(state);

      console.log("[Consent] Initialization complete:", state);

      return state;
    } catch (error) {
      console.error("[Consent] Initialization failed:", error);

      // Check if it's a production consent screen configuration error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isConsentScreenError =
        errorMessage.toLowerCase().includes("consent screen") ||
        errorMessage.toLowerCase().includes("not configured for production") ||
        errorMessage.toLowerCase().includes("oauth") ||
        errorMessage.toLowerCase().includes("unverified app") ||
        errorMessage.toLowerCase().includes("no form(s) configured") ||
        errorMessage.toLowerCase().includes("failed to read publisher") ||
        errorMessage
          .toLowerCase()
          .includes("publisher's account configuration");

      if (isConsentScreenError && __DEV__) {
        console.warn(
          "⚠️ [Consent] Production consent screen not configured - treating as consent denied for testing"
        );
        console.warn("[Consent] Non-personalized ads will be allowed");

        // Set consentInfo to allow non-personalized ads
        this.consentInfo = {
          status: AdsConsentStatus.NOT_REQUIRED,
          isConsentFormAvailable: false,
        } as AdsConsentInfo;

        // Return a state that allows non-personalized ads
        const fallbackState: ConsentState = {
          status: AdsConsentStatus.NOT_REQUIRED,
          canRequestAds: true,
          isConsentFormAvailable: false,
          lastUpdated: Date.now(),
        };

        // Cache this fallback state
        await this.cacheConsentState(fallbackState);

        console.log(
          "[Consent] Fallback initialization complete:",
          fallbackState
        );

        // return fallbackState;
      }

      // Try to load cached consent state for other errors
      const cachedState = await this.loadCachedConsentState();
      if (cachedState) {
        console.log("[Consent] Using cached consent state");
        return cachedState;
      }

      throw error;
    }
  }

  /**
   * Show consent form if required
   * Should be called after initialization if consent is required
   *
   * @returns Promise<ConsentState> - Updated consent state after form interaction
   */
  async showConsentFormIfRequired(): Promise<ConsentState> {
    if (!this.isInitialized) {
      throw new Error("[Consent] Must initialize before showing consent form");
    }

    const state = this.getConsentState();

    // Check if consent form is available and required
    if (!state.isConsentFormAvailable) {
      console.log("[Consent] Consent form not available");
      return state;
    }

    if (
      state.status === AdsConsentStatus.OBTAINED ||
      state.status === AdsConsentStatus.NOT_REQUIRED
    ) {
      console.log("[Consent] Consent already obtained or not required");
      return state;
    }

    try {
      console.log("[Consent] Showing consent form...");

      // Show the consent form
      await AdsConsent.showForm();

      // Get updated consent info
      this.consentInfo = await AdsConsent.getConsentInfo();

      const updatedState = this.getConsentState();

      // Cache updated state
      await this.cacheConsentState(updatedState);

      console.log("[Consent] Consent form completed:", updatedState);

      return updatedState;
    } catch (error) {
      console.error("[Consent] Error showing consent form:", error);

      // Check if it's a production consent screen configuration error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isConsentScreenError =
        errorMessage.toLowerCase().includes("consent screen") ||
        errorMessage.toLowerCase().includes("not configured for production") ||
        errorMessage.toLowerCase().includes("oauth") ||
        errorMessage.toLowerCase().includes("unverified app") ||
        errorMessage.toLowerCase().includes("no form(s) configured") ||
        errorMessage.toLowerCase().includes("failed to read publisher") ||
        errorMessage
          .toLowerCase()
          .includes("publisher's account configuration");

      if (isConsentScreenError) {
        console.warn(
          "⚠️ [Consent] Production consent screen not configured - treating as consent denied"
        );
        console.warn("[Consent] Non-personalized ads will be allowed");

        // Return current state (which should already be set to allow non-personalized ads)
        return this.getConsentState();
      }

      throw error;
    }
  }

  /**
   * Reset consent state (for testing or user request)
   * WARNING: This will require user to provide consent again
   */
  async resetConsent(): Promise<void> {
    try {
      console.log("[Consent] Resetting consent...");

      await AdsConsent.reset();

      this.consentInfo = null;
      this.isInitialized = false;

      // Clear cached state
      await AsyncStorage.multiRemove([
        CONSENT_STORAGE_KEY,
        CONSENT_INFO_STORAGE_KEY,
      ]);

      console.log("[Consent] Consent reset complete");
    } catch (error) {
      console.error("[Consent] Error resetting consent:", error);
      throw error;
    }
  }

  /**
   * Get current consent state
   * @returns ConsentState - Current consent state
   */
  getConsentState(): ConsentState {
    if (!this.consentInfo) {
      return {
        status: AdsConsentStatus.UNKNOWN,
        canRequestAds: false,
        isConsentFormAvailable: false,
        lastUpdated: Date.now(),
      };
    }

    const canRequestAds = this.canRequestAds();

    return {
      status: this.consentInfo.status,
      canRequestAds,
      isConsentFormAvailable: this.consentInfo.isConsentFormAvailable,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Check if ads can be requested based on consent status
   * CRITICAL: Must return true before making any ad requests
   *
   * @returns boolean - True if ads can be requested
   */
  canRequestAds(): boolean {
    if (!this.consentInfo) {
      return false;
    }

    const { status } = this.consentInfo;

    // Ads can be requested if:
    // 1. Consent has been obtained
    // 2. Consent is not required (e.g., user not in EEA/UK)
    return (
      status === AdsConsentStatus.OBTAINED ||
      status === AdsConsentStatus.NOT_REQUIRED
    );
  }

  /**
   * Check if consent form should be shown
   * @returns boolean - True if consent form should be shown
   */
  shouldShowConsentForm(): boolean {
    if (!this.consentInfo) {
      return false;
    }

    return (
      this.consentInfo.isConsentFormAvailable &&
      this.consentInfo.status === AdsConsentStatus.REQUIRED
    );
  }

  /**
   * Get consent status string for debugging
   * @returns string - Human-readable consent status
   */
  getConsentStatusString(): string {
    if (!this.consentInfo) {
      return "Unknown";
    }

    switch (this.consentInfo.status) {
      case AdsConsentStatus.OBTAINED:
        return "Obtained";
      case AdsConsentStatus.NOT_REQUIRED:
        return "Not Required";
      case AdsConsentStatus.REQUIRED:
        return "Required";
      case AdsConsentStatus.UNKNOWN:
      default:
        return "Unknown";
    }
  }

  /**
   * Cache consent state to AsyncStorage
   */
  private async cacheConsentState(state: ConsentState): Promise<void> {
    try {
      await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
      if (this.consentInfo) {
        await AsyncStorage.setItem(
          CONSENT_INFO_STORAGE_KEY,
          JSON.stringify(this.consentInfo)
        );
      }
    } catch (error) {
      console.error("[Consent] Error caching consent state:", error);
    }
  }

  /**
   * Load cached consent state from AsyncStorage
   */
  private async loadCachedConsentState(): Promise<ConsentState | null> {
    try {
      const [stateJson, infoJson] = await AsyncStorage.multiGet([
        CONSENT_STORAGE_KEY,
        CONSENT_INFO_STORAGE_KEY,
      ]);

      if (stateJson[1] && infoJson[1]) {
        const state = JSON.parse(stateJson[1]) as ConsentState;
        this.consentInfo = JSON.parse(infoJson[1]) as AdsConsentInfo;
        return state;
      }

      return null;
    } catch (error) {
      console.error("[Consent] Error loading cached consent state:", error);
      return null;
    }
  }

  /**
   * Check if consent is stale and needs refresh
   * Consent should be refreshed periodically (e.g., every 30 days)
   *
   * @param maxAgeMs - Maximum age in milliseconds (default: 30 days)
   * @returns boolean - True if consent should be refreshed
   */
  async isConsentStale(
    maxAgeMs: number = 30 * 24 * 60 * 60 * 1000
  ): Promise<boolean> {
    try {
      const stateJson = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stateJson) {
        return true;
      }

      const state = JSON.parse(stateJson) as ConsentState;
      const age = Date.now() - state.lastUpdated;

      return age > maxAgeMs;
    } catch (error) {
      console.error("[Consent] Error checking consent age:", error);
      return true;
    }
  }
}

// Export singleton instance
export const consentService = new ConsentService();

// Export types and enums for convenience
export { AdsConsentDebugGeography, AdsConsentStatus };
