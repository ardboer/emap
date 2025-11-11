import { useState, useEffect, useCallback } from "react";
import {
  consentService,
  ConsentState,
  AdsConsentStatus,
  AdsConsentDebugGeography,
} from "../services/consent";

/**
 * React hook for managing consent state
 * Provides consent status and methods for showing consent form
 */
export function useConsent() {
  const [consentState, setConsentState] = useState<ConsentState>({
    status: AdsConsentStatus.UNKNOWN,
    canRequestAds: false,
    isConsentFormAvailable: false,
    lastUpdated: Date.now(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialize consent management
   */
  const initializeConsent = useCallback(
    async (
      debugGeography?: AdsConsentDebugGeography,
      testDeviceIds?: string[]
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        const state = await consentService.initialize(
          debugGeography,
          testDeviceIds
        );
        setConsentState(state);

        // Automatically show consent form if required
        if (
          state.isConsentFormAvailable &&
          state.status === AdsConsentStatus.REQUIRED
        ) {
          await showConsentForm();
        }
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to initialize consent");
        setError(error);
        console.error("[useConsent] Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Show consent form
   */
  const showConsentForm = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const state = await consentService.showConsentFormIfRequired();
      setConsentState(state);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to show consent form");
      setError(error);
      console.error("[useConsent] Show form error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset consent (for testing or user request)
   */
  const resetConsent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await consentService.resetConsent();

      // Re-initialize after reset
      await initializeConsent();
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to reset consent");
      setError(error);
      console.error("[useConsent] Reset error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [initializeConsent]);

  /**
   * Refresh consent state
   */
  const refreshConsentState = useCallback(() => {
    const state = consentService.getConsentState();
    setConsentState(state);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeConsent();
  }, [initializeConsent]);

  return {
    consentState,
    isLoading,
    error,
    canRequestAds: consentState.canRequestAds,
    shouldShowConsentForm:
      consentState.isConsentFormAvailable &&
      consentState.status === AdsConsentStatus.REQUIRED,
    consentStatus: consentState.status,
    consentStatusString: consentService.getConsentStatusString(),
    showConsentForm,
    resetConsent,
    refreshConsentState,
    initializeConsent,
  };
}
