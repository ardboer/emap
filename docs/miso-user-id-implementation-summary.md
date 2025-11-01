# Miso User ID Implementation Summary

## Overview

Updated all Miso API calls to properly use either `user_id` (for authenticated users) or `anonymous_id` (for anonymous users) according to Miso documentation. The implementation covers article tracking, related articles, and trending articles.

## Changes Made

### 1. Updated `services/miso.ts`

#### Interface Changes

**TrackArticleViewParams** - Added `isAuthenticated` parameter:

```typescript
interface TrackArticleViewParams {
  articleId: string;
  userId?: string;
  isAuthenticated: boolean; // NEW
  anonymousId: string;
}
```

**MisoInteractionPayload** - Made `user_id` and `anonymous_id` optional and mutually exclusive:

```typescript
interface MisoInteractionPayload {
  data: {
    type: "product_detail_page_view";
    product_ids: string[];
    timestamp: string;
    user_id?: string; // Now optional
    anonymous_id?: string; // Now optional
  }[];
}
```

#### Function Logic Changes

Updated `trackArticleView()` function to:

1. Determine which ID to use based on authentication status
2. Format authenticated user IDs with "sub:" prefix
3. Send only the appropriate ID (not both)
4. Add enhanced logging to show tracking mode

**Key Logic:**

```typescript
if (isAuthenticated && userId) {
  // Authenticated user: use "sub:" prefix for subscriber
  misoUserId = `sub:${userId}`;
  misoAnonymousId = undefined;
} else {
  // Anonymous user: use anonymous_id only
  misoUserId = undefined;
  misoAnonymousId = anonymousId;
}
```

**Payload Construction:**

```typescript
const payload: MisoInteractionPayload = {
  data: [
    {
      type: "product_detail_page_view",
      product_ids: [productId],
      timestamp,
      ...(misoUserId && { user_id: misoUserId }),
      ...(misoAnonymousId && { anonymous_id: misoAnonymousId }),
    },
  ],
};
```

### 2. Updated `app/article/[id].tsx`

Modified the `trackArticleView()` call to pass the `isAuthenticated` parameter:

```typescript
// Track article view with Miso
const anonymousId = await getAnonymousId();
trackArticleView({
  articleId: id,
  userId: user?.userId,
  isAuthenticated, // NEW
  anonymousId,
});
```

## Behavior

### Anonymous User (Not Logged In)

**Request Payload:**

```json
{
  "data": [
    {
      "type": "product_detail_page_view",
      "product_ids": ["NT-338478"],
      "timestamp": "2025-11-01T14:55:00.000Z",
      "anonymous_id": "1658570109.1761120937"
    }
  ]
}
```

**Console Output:**

```
📊 Miso Article View Tracking
📝 Tracking Parameters: {
  articleId: "338478",
  mode: "ANONYMOUS",
  userId: "N/A",
  anonymousId: "1658570109.1761120937"
}
```

### Authenticated User (Logged In)

**Request Payload:**

```json
{
  "data": [
    {
      "type": "product_detail_page_view",
      "product_ids": ["NT-338478"],
      "timestamp": "2025-11-01T14:55:00.000Z",
      "user_id": "sub:464219"
    }
  ]
}
```

**Console Output:**

```
📊 Miso Article View Tracking
📝 Tracking Parameters: {
  articleId: "338478",
  mode: "AUTHENTICATED",
  userId: "sub:464219",
  anonymousId: "N/A"
}
```

## Testing Checklist

- [ ] Test anonymous user viewing an article

  - Verify `anonymous_id` is sent
  - Verify `user_id` is NOT sent
  - Check console logs show "ANONYMOUS" mode

- [ ] Test authenticated user viewing an article

  - Verify `user_id` with "sub:" prefix is sent
  - Verify `anonymous_id` is NOT sent
  - Check console logs show "AUTHENTICATED" mode
  - Verify user_id format is "sub:464219" (example)

- [ ] Test user login transition

  - View article as anonymous
  - Log in
  - View another article
  - Verify tracking switches from anonymous_id to user_id

- [ ] Test user logout transition

  - View article as authenticated
  - Log out
  - View another article
  - Verify tracking switches from user_id to anonymous_id

- [ ] Verify Miso API accepts both formats
  - Check for 200 OK responses
  - Monitor Miso dashboard for tracking data
  - Ensure no errors in console

## Benefits

1. **Compliance**: Follows Miso API documentation exactly
2. **Better Personalization**: Proper user identification enables better recommendations
3. **Privacy**: Clear separation between authenticated and anonymous tracking
4. **Debugging**: Enhanced logging makes it easy to verify correct behavior
5. **Maintainability**: Clean, well-documented code for future enhancements

## Future Enhancements

If needed, support for "registered but not subscribed" users can be added:

```typescript
if (isAuthenticated && hasActiveSubscription) {
  misoUserId = `sub:${userId}`;
} else if (isAuthenticated && !hasActiveSubscription) {
  misoUserId = `reg:${userId}`;
} else {
  misoAnonymousId = anonymousId;
}
```

## Files Modified

1. `services/miso.ts` - Core tracking logic
2. `app/article/[id].tsx` - Article screen tracking call
3. `docs/miso-user-id-implementation-plan.md` - Implementation plan
4. `docs/miso-user-id-implementation-summary.md` - This summary

## Rollback

If issues arise, revert these commits:

- `services/miso.ts` - Revert to previous version
- `app/article/[id].tsx` - Remove `isAuthenticated` parameter

The system will fall back to sending both IDs (previous behavior).
