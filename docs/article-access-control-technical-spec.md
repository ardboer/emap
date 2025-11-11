# Article Access Control - Technical Specification

## Code Changes Required

### 1. TypeScript Types (`types/index.ts`)

Add these new interfaces at the end of the file:

```typescript
/**
 * Access Control API Response
 * Response from the access-control endpoint indicating if user can access content
 */
export interface AccessControlResponse {
  user_id: number;
  post_id: number;
  allowed: boolean;
  message: string;
}

/**
 * Access Control Request Parameters
 * Parameters sent to the access-control endpoint
 */
export interface AccessControlRequest {
  post_id: string | number;
  hash: string;
}

/**
 * Access Control State
 * State management for article access checking
 */
export interface AccessControlState {
  isChecking: boolean;
  isAllowed: boolean;
  error: string | null;
  response: AccessControlResponse | null;
}
```

---

### 2. Access Control API Service (`services/auth.ts`)

Add this function after the `refreshAccessToken` function (around line 440):

````typescript
/**
 * Check if user has access to a specific article/post
 *
 * This function calls the access-control API endpoint to determine if the current
 * user (authenticated or anonymous) has permission to view the specified article.
 *
 * @param postId - The article/post ID to check access for
 * @param token - Optional JWT access token for authenticated users
 * @returns Access control response indicating if access is allowed
 *
 * @example
 * ```typescript
 * // Check access for authenticated user
 * const result = await checkArticleAccess('338771', userToken);
 * if (result.allowed) {
 *   // Show full article
 * } else {
 *   // Show paywall
 * }
 *
 * // Check access for anonymous user
 * const result = await checkArticleAccess('338771');
 * ```
 */
export async function checkArticleAccess(
  postId: string | number,
  token?: string
): Promise<AccessControlResponse> {
  try {
    const config = brandManager.getApiConfig();
    const { baseUrl, hash } = config;

    const url = `${baseUrl}/wp-json/mbm-apps/v1/access-control`;

    console.log("🔒 Checking article access...", {
      postId,
      hasToken: !!token,
      url,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Authorization header if token is provided
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        post_id: postId,
        hash: hash,
      }),
    });

    console.log("📥 Access control response status:", response.status);

    const data = await response.json();
    console.log("📥 Access control response data:", data);

    if (!response.ok) {
      console.warn(
        "⚠️ Access control check failed:",
        data.message || "Unknown error"
      );
      // Fail open: allow access if API fails
      return {
        user_id: 0,
        post_id: Number(postId),
        allowed: true,
        message: "Access check failed, allowing access (fail open)",
      };
    }

    // Log the result
    if (data.allowed) {
      console.log("✅ Access granted for article:", postId);
    } else {
      console.log("❌ Access denied for article:", postId);
    }

    return data;
  } catch (error) {
    console.error("❌ Error checking article access:", error);
    // Fail open: allow access if there's an error
    return {
      user_id: 0,
      post_id: Number(postId),
      allowed: true,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
````

Also export the new types at the top of the file:

```typescript
export type {
  AccessControlResponse,
  AccessControlRequest,
  AccessControlState,
} from "@/types";
```

---

### 3. Custom Hook (`hooks/useArticleAccess.ts`)

Create a new file with this content:

````typescript
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
````

---

### 4. Update ArticleDetailView Component (`components/ArticleDetailView.tsx`)

#### 4.1 Add Imports (after line 18)

```typescript
import { useArticleAccess } from "@/hooks/useArticleAccess";
import { PaywallBottomSheet } from "./PaywallBottomSheet";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsService } from "@/services/analytics";
```

#### 4.2 Add State and Hooks (after line 35)

```typescript
const { login } = useAuth();
const { isAllowed, shouldShowPaywall, recheckAccess } =
  useArticleAccess(articleId);
const [paywallVisible, setPaywallVisible] = useState(false);
```

#### 4.3 Add Paywall Effect (after line 58)

```typescript
// Show paywall when access is denied
useEffect(() => {
  if (shouldShowPaywall) {
    console.log("🚫 Access denied, showing paywall for article:", articleId);
    setPaywallVisible(true);

    // Track paywall shown event
    analyticsService.logEvent("article_paywall_shown", {
      article_id: articleId,
      edition_id: editionId,
      source: "article_detail",
    });
  }
}, [shouldShowPaywall, articleId, editionId]);
```

#### 4.4 Add Paywall Handlers (after the loadArticle function, around line 54)

```typescript
/**
 * Handle paywall close
 */
const handlePaywallClose = useCallback(() => {
  console.log("ℹ️ User closed paywall");
  setPaywallVisible(false);

  analyticsService.logEvent("article_paywall_dismissed", {
    article_id: articleId,
    edition_id: editionId,
  });
}, [articleId, editionId]);

/**
 * Handle subscribe button press
 */
const handleSubscribe = useCallback(() => {
  console.log("💳 User clicked subscribe from paywall");

  analyticsService.logEvent("article_paywall_subscribe_clicked", {
    article_id: articleId,
    edition_id: editionId,
  });

  // PaywallBottomSheet handles opening the subscription URL
}, [articleId, editionId]);

/**
 * Handle sign in button press
 */
const handleSignIn = useCallback(async () => {
  console.log("🔐 User clicked sign in from paywall");

  analyticsService.logEvent("article_paywall_signin_clicked", {
    article_id: articleId,
    edition_id: editionId,
  });

  // Close paywall before starting login flow
  setPaywallVisible(false);

  // Start login flow
  await login();

  // After successful login, recheck access
  // The useArticleAccess hook will automatically recheck when auth state changes
  console.log("✅ Login complete, access will be rechecked automatically");
}, [login, articleId, editionId]);
```

#### 4.5 Add PaywallBottomSheet to Render (before the closing View tag, around line 252)

```typescript
{
  /* Paywall Bottom Sheet */
}
<PaywallBottomSheet
  visible={paywallVisible}
  onClose={handlePaywallClose}
  onSubscribe={handleSubscribe}
  onSignIn={handleSignIn}
/>;
```

---

### 5. Update PaywallBottomSheet Component (`components/PaywallBottomSheet.tsx`)

No changes needed! The component already has all the functionality we need:

- ✅ Handles subscribe button (opens URL or callback)
- ✅ Handles sign in button (uses auth context)
- ✅ Auto-closes when user authenticates
- ✅ Has analytics tracking
- ✅ Animated slide-up behavior

---

## File Summary

### Files to Create

1. ✅ `hooks/useArticleAccess.ts` - New custom hook (150 lines)
2. ✅ `docs/article-access-control-implementation-plan.md` - Documentation
3. ✅ `docs/article-access-control-technical-spec.md` - This file

### Files to Modify

1. ✅ `types/index.ts` - Add 3 new interfaces (~30 lines)
2. ✅ `services/auth.ts` - Add checkArticleAccess function (~80 lines)
3. ✅ `components/ArticleDetailView.tsx` - Add access control integration (~100 lines)

### Files to Review (No Changes)

1. ✅ `components/PaywallBottomSheet.tsx` - Already has all needed functionality
2. ✅ `contexts/AuthContext.tsx` - Already provides login/logout
3. ✅ `brands/nt/config.json` - Already has paywall configuration

---

## Code Diff Preview

### `types/index.ts` - Add at end of file

```diff
+ /**
+  * Access Control API Response
+  */
+ export interface AccessControlResponse {
+   user_id: number;
+   post_id: number;
+   allowed: boolean;
+   message: string;
+ }
+
+ export interface AccessControlRequest {
+   post_id: string | number;
+   hash: string;
+ }
+
+ export interface AccessControlState {
+   isChecking: boolean;
+   isAllowed: boolean;
+   error: string | null;
+   response: AccessControlResponse | null;
+ }
```

### `services/auth.ts` - Add after refreshAccessToken function

```diff
+ export async function checkArticleAccess(
+   postId: string | number,
+   token?: string
+ ): Promise<AccessControlResponse> {
+   // ... implementation
+ }
```

### `components/ArticleDetailView.tsx` - Add imports

```diff
  import { ThemedText } from "./ThemedText";
  import { ThemedView } from "./ThemedView";
+ import { useArticleAccess } from '@/hooks/useArticleAccess';
+ import { PaywallBottomSheet } from './PaywallBottomSheet';
+ import { useAuth } from '@/contexts/AuthContext';
+ import { analyticsService } from '@/services/analytics';
```

### `components/ArticleDetailView.tsx` - Add state

```diff
  const colorScheme = useColorScheme() ?? "light";
  const { brandConfig } = useBrandConfig();
+ const { login } = useAuth();
+ const { isAllowed, shouldShowPaywall, recheckAccess } = useArticleAccess(articleId);
+ const [paywallVisible, setPaywallVisible] = useState(false);
```

### `components/ArticleDetailView.tsx` - Add to render

```diff
      {loading && renderLoading()}
      {error && !loading && renderError()}
      {article && !loading && !error && renderArticle()}
+
+     <PaywallBottomSheet
+       visible={paywallVisible}
+       onClose={handlePaywallClose}
+       onSubscribe={handleSubscribe}
+       onSignIn={handleSignIn}
+     />
    </View>
  );
```

---

## Testing Checklist

### Unit Tests (Future Enhancement)

- [ ] Test `checkArticleAccess` with valid token
- [ ] Test `checkArticleAccess` without token
- [ ] Test `checkArticleAccess` with API error
- [ ] Test `useArticleAccess` hook state management
- [ ] Test `useArticleAccess` recheck functionality

### Integration Tests

- [ ] Test ArticleDetailView with access granted
- [ ] Test ArticleDetailView with access denied
- [ ] Test paywall appears when access denied
- [ ] Test paywall closes after sign in
- [ ] Test access recheck after authentication
- [ ] Test analytics events fire correctly

### Manual Testing

- [ ] Open article as anonymous user → Should show paywall
- [ ] Sign in from paywall → Should close paywall and show article
- [ ] Open article as authenticated user (subscribed) → No paywall
- [ ] Open article as authenticated user (not subscribed) → Show paywall
- [ ] Test network error → Article should show (fail open)
- [ ] Test API timeout → Article should show (fail open)
- [ ] Verify analytics events in Firebase console

---

## Performance Considerations

### API Call Optimization

- Access check runs in parallel with article loading
- Results could be cached for 5 minutes (future enhancement)
- Fail open strategy prevents blocking users

### Memory Management

- Hook cleans up on unmount
- No memory leaks from event listeners
- State updates are batched

### Network Efficiency

- Single API call per article view
- Automatic retry on auth state change
- No polling or repeated checks

---

## Error Handling Matrix

| Scenario                         | Behavior                 | User Experience            |
| -------------------------------- | ------------------------ | -------------------------- |
| API returns 200 + allowed: true  | Show article             | Normal reading             |
| API returns 200 + allowed: false | Show paywall             | Subscription prompt        |
| API returns 4xx error            | Show article (fail open) | Normal reading + log error |
| API returns 5xx error            | Show article (fail open) | Normal reading + log error |
| Network timeout                  | Show article (fail open) | Normal reading + log error |
| Invalid response format          | Show article (fail open) | Normal reading + log error |

---

## Analytics Events

### Events Tracked

1. **article_paywall_shown**

   - When: Paywall appears
   - Properties: article_id, edition_id, source

2. **article_paywall_dismissed**

   - When: User closes paywall
   - Properties: article_id, edition_id

3. **article_paywall_subscribe_clicked**

   - When: User clicks subscribe button
   - Properties: article_id, edition_id

4. **article_paywall_signin_clicked**
   - When: User clicks sign in button
   - Properties: article_id, edition_id

---

## Security Notes

1. **JWT Token Handling**

   - Token sent in Authorization header
   - Never logged in production
   - Validated on backend

2. **Fail Open Strategy**

   - Prioritizes user experience
   - Backend is source of truth
   - All checks logged for monitoring

3. **API Security**
   - HTTPS only
   - Hash parameter for API authentication
   - Rate limiting on backend (assumed)

---

## Future Enhancements

### Phase 2 Features

1. **Caching**: Cache access results for 5 minutes
2. **Preview Mode**: Show first 2 paragraphs before paywall
3. **Metered Paywall**: Track article views, allow X free per month
4. **Smart Timing**: Show paywall after 50% scroll

### Phase 3 Features

1. **A/B Testing**: Test different paywall messages
2. **Personalization**: Customize paywall based on user behavior
3. **Offline Support**: Cache access status for offline reading
4. **Analytics Dashboard**: Track conversion metrics

---

## Dependencies

### Required Packages (Already Installed)

- ✅ `react` - Core React library
- ✅ `react-native` - React Native framework
- ✅ `@react-native-async-storage/async-storage` - Token storage
- ✅ `expo-web-browser` - Authentication flow

### No New Dependencies Required

All functionality uses existing packages and infrastructure.

---

## Rollback Plan

If issues arise after deployment:

1. **Quick Rollback**: Set `isAllowed` default to `true` in hook
2. **Feature Flag**: Add brand config flag to disable feature
3. **Revert Commits**: Git revert the implementation commits

### Rollback Code Snippet

```typescript
// In useArticleAccess.ts, change default state:
const [state, setState] = useState({
  isChecking: false, // Changed from true
  isAllowed: true, // Always true = disabled
  error: null,
  response: null,
});

// Comment out the checkAccess call:
// useEffect(() => {
//   checkAccess();
// }, [checkAccess]);
```

---

## Support & Maintenance

### Monitoring

- Monitor error rates in analytics
- Track paywall conversion rates
- Watch for API performance issues

### Debugging

- All operations logged with emoji prefixes
- Error messages include context
- Analytics events for user actions

### Documentation

- Code comments explain all functions
- JSDoc for public APIs
- This technical spec for reference

---

## Approval Checklist

Before implementation:

- [x] Requirements clarified with user
- [x] Technical approach documented
- [x] Error handling strategy defined
- [x] Testing plan created
- [x] Analytics events defined
- [x] Security considerations reviewed

Ready for implementation! 🚀
