import { useAuth } from "@/contexts/AuthContext";
import { checkArticleAccess } from "@/services/auth";
import { AccessControlResponse } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Custom hook to manage article access control
 *
 * This hook checks if the current user has access to a specific article
 * and provides state management for showing/hiding the paywall.
 *
 * @param articleId - The ID of the article to check access for
 * @returns Object containing access state and control functions
 *
 * @example
 * ```typescript
 * function ArticleDetailView({ articleId }) {
 *   const { isAllowed, shouldShowPaywall, recheckAccess } = useArticleAccess(articleId);
 *
 *   return (
 *     <View>
 *       <ArticleContent />
 *       {shouldShowPaywall && <PaywallBottomSheet />}
 *     </View>
 *   );
 * }
 * ```
 */
export function useArticleAccess(articleId: string) {
  const { getValidAccessToken, isAuthenticated } = useAuth();
  const isCheckingRef = useRef(false);
  const lastCheckKeyRef = useRef<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const authStateChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [debugNeverShowPaywall, setDebugNeverShowPaywall] = useState(false);

  const [state, setState] = useState<{
    isChecking: boolean;
    isAllowed: boolean;
    error: string | null;
    response: AccessControlResponse | null;
  }>({
    isChecking: true,
    isAllowed: true, // Default to true (fail open)
    error: null,
    response: null,
  });

  // Load debug never show paywall setting
  useEffect(() => {
    AsyncStorage.getItem("debug_never_show_paywall").then((value) => {
      setDebugNeverShowPaywall(value === "true");
    });
  }, []);

  /**
   * Check article access
   */
  const checkAccess = useCallback(
    async (force: boolean = false) => {
      if (!articleId) {
        console.warn("⚠️ No article ID provided for access check");
        setState({
          isChecking: false,
          isAllowed: true,
          error: "No article ID provided",
          response: null,
        });
        return;
      }

      // Check debug setting first - if enabled, always allow access
      // SAFETY: Only works in development mode to prevent production issues
      if (__DEV__) {
        const debugSetting = await AsyncStorage.getItem(
          "debug_never_show_paywall"
        );
        if (debugSetting === "true") {
          console.log("🔓 Debug mode: Never show paywall - allowing access");
          setState({
            isChecking: false,
            isAllowed: true,
            error: null,
            response: {
              allowed: true,
              user_id: 0,
              post_id: parseInt(articleId) || 0,
              message: "Debug mode: Never show paywall enabled",
            },
          });
          return;
        }
      }

      // Prevent duplicate checks if already checking
      if (isCheckingRef.current) {
        console.log("⏭️ Skipping duplicate access check (already in progress)");
        return;
      }

      try {
        isCheckingRef.current = true;

        console.log("🔍 Starting access check for article:", articleId);
        // Preserve isAllowed state during recheck to prevent paywall flash
        // Only update isAllowed when the check completes with a definitive result
        setState((prev) => ({ ...prev, isChecking: true, error: null }));

        // Get a valid token (will refresh if expired)
        const validToken = await getValidAccessToken();
        setCurrentToken(validToken);

        // Create a unique key for this article + token combination
        const tokenKey = validToken || "anonymous";
        const checkKey = `${articleId}:${tokenKey}`;

        // Prevent duplicate checks with same article + token (unless forced)
        if (!force && lastCheckKeyRef.current === checkKey) {
          console.log(
            "⏭️ Skipping duplicate access check (same article + token)"
          );
          isCheckingRef.current = false;
          setState((prev) => ({ ...prev, isChecking: false }));
          return;
        }

        lastCheckKeyRef.current = checkKey;

        const response = await checkArticleAccess(
          articleId,
          validToken || undefined
        );

        setState({
          isChecking: false,
          isAllowed: response.allowed,
          error: null,
          response,
        });

        console.log("✅ Access check complete:", {
          articleId,
          allowed: response.allowed,
          userId: response.user_id,
        });
      } catch (error) {
        console.error("❌ Error in access check:", error);
        // Fail open: allow access on error
        setState({
          isChecking: false,
          isAllowed: true,
          error: error instanceof Error ? error.message : "Unknown error",
          response: null,
        });
      } finally {
        isCheckingRef.current = false;
      }
    },
    [articleId, getValidAccessToken]
  );

  /**
   * Recheck access (useful after authentication changes)
   */
  const recheckAccess = useCallback(async () => {
    console.log("🔄 Rechecking access for article:", articleId);
    await checkAccess(true); // Force recheck
  }, [checkAccess, articleId]);

  // Check access on mount and when accessToken changes
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Watch for authentication state changes (login/logout)
  useEffect(() => {
    // Force recheck when auth state changes
    // This handles both login (isAuthenticated becomes true) and logout (becomes false)
    console.log("🔐 Auth state changed, forcing access recheck");

    // Clear any existing timer to prevent duplicate checks
    if (authStateChangeTimerRef.current) {
      clearTimeout(authStateChangeTimerRef.current);
    }

    // Add a small delay to ensure auth state has fully propagated
    // This is especially important on Android after browser-based login
    authStateChangeTimerRef.current = setTimeout(() => {
      checkAccess(true);
      authStateChangeTimerRef.current = null;
    }, 200);

    return () => {
      if (authStateChangeTimerRef.current) {
        clearTimeout(authStateChangeTimerRef.current);
        authStateChangeTimerRef.current = null;
      }
    };
  }, [isAuthenticated, checkAccess]);

  // Reset check key tracking when article changes
  useEffect(() => {
    lastCheckKeyRef.current = null;
  }, [articleId]);

  return {
    /**
     * Whether the access check is currently in progress
     */
    isChecking: state.isChecking,

    /**
     * Whether the user is allowed to access the article
     */
    isAllowed: state.isAllowed,

    /**
     * Whether the paywall should be shown
     * (access denied and not currently checking, and debug mode not enabled)
     * Note: debugNeverShowPaywall only works in __DEV__ mode for safety
     */
    shouldShowPaywall:
      !state.isAllowed &&
      !state.isChecking &&
      !(__DEV__ && debugNeverShowPaywall),

    /**
     * Error message if the access check failed
     */
    error: state.error,

    /**
     * Full response from the access control API
     */
    response: state.response,

    /**
     * Function to manually recheck access
     * (useful after authentication changes)
     */
    recheckAccess,
  };
}
