import { useAuth } from "@/contexts/AuthContext";
import { checkArticleAccess } from "@/services/auth";
import { AccessControlResponse } from "@/types";
import { useCallback, useEffect, useState } from "react";

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
  const { accessToken, isAuthenticated } = useAuth();

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

  /**
   * Check article access
   */
  const checkAccess = useCallback(async () => {
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

    try {
      console.log("🔍 Starting access check for article:", articleId);
      setState((prev) => ({ ...prev, isChecking: true, error: null }));

      const response = await checkArticleAccess(
        articleId,
        accessToken || undefined
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
    }
  }, [articleId, accessToken]);

  /**
   * Recheck access (useful after authentication changes)
   */
  const recheckAccess = useCallback(async () => {
    console.log("🔄 Rechecking access for article:", articleId);
    await checkAccess();
  }, [checkAccess, articleId]);

  // Check access on mount and when auth state changes
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Recheck access when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log("🔐 User authenticated, rechecking access");
      recheckAccess();
    }
  }, [isAuthenticated, recheckAccess]);

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
     * (access denied and not currently checking)
     */
    shouldShowPaywall: !state.isAllowed && !state.isChecking,

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
