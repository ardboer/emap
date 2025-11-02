# Firebase Crashlytics Usage Guide

Quick reference for developers working with Firebase Crashlytics in the EMAP app.

## Quick Start

### Import the Service

```typescript
import { crashlyticsService } from "@/services/crashlytics";
```

## Common Use Cases

### 1. Log Non-Fatal Errors

Use this for handled exceptions that you want to track:

```typescript
try {
  await fetchArticleData(articleId);
} catch (error) {
  // Log to Crashlytics with context
  await crashlyticsService.recordError(
    error as Error,
    "Failed to fetch article data"
  );

  // Show user-friendly message
  showErrorToast("Unable to load article");
}
```

### 2. Add Breadcrumbs

Add context before operations that might fail:

```typescript
// Before critical operation
crashlyticsService.log("User attempting to save article");
crashlyticsService.log(`Article ID: ${articleId}`);

try {
  await saveArticle(articleId);
  crashlyticsService.log("Article saved successfully");
} catch (error) {
  // Error will include breadcrumbs
  await crashlyticsService.recordError(error as Error, "Save Article Failed");
}
```

### 3. Set User Context

Set user information after authentication:

```typescript
// After successful login
await crashlyticsService.setUserId(user.id);
await crashlyticsService.setUserAttributes({
  email: user.email,
  subscription_status: user.subscriptionStatus,
  brand: ACTIVE_BRAND,
});
```

### 4. Track Custom Attributes

Add custom attributes for specific scenarios:

```typescript
// Set custom attributes
await crashlyticsService.setUserAttributes({
  last_article_viewed: articleId,
  preferred_category: category,
  notification_enabled: "true",
});
```

### 5. API Error Handling

```typescript
async function fetchData(endpoint: string) {
  crashlyticsService.log(`API call: ${endpoint}`);

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      const error = new Error(`API Error: ${response.status}`);
      await crashlyticsService.recordError(error, `API ${endpoint}`);
      throw error;
    }

    return await response.json();
  } catch (error) {
    crashlyticsService.log(`API call failed: ${endpoint}`);
    await crashlyticsService.recordError(error as Error, "API Call");
    throw error;
  }
}
```

## When to Use Crashlytics

### ✅ DO Use For

- **Fatal Crashes**: Automatically captured
- **Unhandled Exceptions**: Caught by global handler
- **Critical Errors**: Errors that break core functionality
- **API Failures**: When backend calls fail unexpectedly
- **Data Corruption**: When data is in an invalid state
- **Navigation Errors**: When routing fails
- **Payment Errors**: Transaction failures
- **Authentication Errors**: Login/logout issues

### ❌ DON'T Use For

- **Expected Validation**: User input validation errors
- **Network Timeouts**: Expected network issues
- **User Cancellations**: User-initiated actions
- **Debug Logging**: Use `console.log` instead
- **Sensitive Data**: Never log passwords, tokens, etc.
- **Spam**: Don't log the same error repeatedly

## Code Examples

### Error Boundary Integration

Already implemented in [`components/ErrorBoundary.tsx`](../components/ErrorBoundary.tsx):

```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Wrap components that might throw errors
<ErrorBoundary>
  <ArticleList />
</ErrorBoundary>;
```

### Custom Error Classes

```typescript
class ArticleNotFoundError extends Error {
  constructor(articleId: string) {
    super(`Article not found: ${articleId}`);
    this.name = "ArticleNotFoundError";
  }
}

try {
  const article = await getArticle(id);
  if (!article) {
    throw new ArticleNotFoundError(id);
  }
} catch (error) {
  await crashlyticsService.recordError(error as Error, "Article Fetch");
}
```

### Async Error Handling

```typescript
// Good: Proper async error handling
async function loadUserData() {
  try {
    crashlyticsService.log("Loading user data");
    const data = await fetchUserData();
    return data;
  } catch (error) {
    await crashlyticsService.recordError(error as Error, "Load User Data");
    throw error; // Re-throw if needed
  }
}

// Bad: Silent failure
async function loadUserData() {
  try {
    return await fetchUserData();
  } catch (error) {
    // Error is lost!
    return null;
  }
}
```

### Promise Rejection Handling

```typescript
// Good: Explicit error handling
Promise.all([fetchArticles(), fetchCategories(), fetchTrending()])
  .then(([articles, categories, trending]) => {
    // Handle success
  })
  .catch(async (error) => {
    await crashlyticsService.recordError(error, "Parallel Data Fetch");
    // Handle error
  });

// Also good: Async/await
try {
  const results = await Promise.all([
    fetchArticles(),
    fetchCategories(),
    fetchTrending(),
  ]);
} catch (error) {
  await crashlyticsService.recordError(error as Error, "Parallel Data Fetch");
}
```

## Testing

### Test in Development

```typescript
// Force a test crash (app will restart)
crashlyticsService.testCrash();

// Test non-fatal error
try {
  throw new Error("Test error from development");
} catch (error) {
  await crashlyticsService.recordError(error as Error, "Dev Test");
}
```

### Use Debug Screen

Navigate to the debug tab (only visible in `__DEV__` mode):

1. Open app in development mode
2. Go to Debug tab
3. Use test buttons:
   - **Test Fatal Crash**: Crashes the app
   - **Test Non-Fatal Error**: Logs an error
   - **Check Unsent Reports**: See pending reports
   - **Send Unsent Reports**: Force send reports

### Verify in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Crashlytics
4. Wait 5-10 minutes for reports to appear
5. Check for your test errors

## Best Practices

### 1. Add Context

```typescript
// Bad: No context
await crashlyticsService.recordError(error);

// Good: With context
await crashlyticsService.recordError(error, "Article Save Failed");
crashlyticsService.log(`Article ID: ${articleId}`);
crashlyticsService.log(`User ID: ${userId}`);
```

### 2. Don't Over-Log

```typescript
// Bad: Logging every API call
for (const article of articles) {
  crashlyticsService.log(`Processing article ${article.id}`);
}

// Good: Log important milestones
crashlyticsService.log(`Processing ${articles.length} articles`);
```

### 3. Protect Sensitive Data

```typescript
// Bad: Logging sensitive data
crashlyticsService.log(`User password: ${password}`);
crashlyticsService.log(`Auth token: ${token}`);

// Good: Log without sensitive data
crashlyticsService.log("User authentication attempt");
await crashlyticsService.setUserId(user.id); // ID only, not email/password
```

### 4. Use Appropriate Error Levels

```typescript
// Critical errors: Use recordError
await crashlyticsService.recordError(error, "Payment Failed");

// Informational: Use log
crashlyticsService.log("User viewed article");

// Don't log everything as an error
// Bad:
await crashlyticsService.recordError(new Error("User clicked button"));
```

## Integration with Other Services

### With Analytics

```typescript
try {
  await performAction();
  analyticsService.logEvent("action_success");
} catch (error) {
  await crashlyticsService.recordError(error as Error, "Action Failed");
  analyticsService.logEvent("action_error", { error: error.message });
}
```

### With Auth Context

```typescript
// In AuthContext after login
const login = async (email: string, password: string) => {
  try {
    const user = await authService.login(email, password);

    // Set Crashlytics user context
    await crashlyticsService.setUserId(user.id);
    await crashlyticsService.setUserAttributes({
      email: user.email,
      subscription: user.subscription,
    });

    return user;
  } catch (error) {
    await crashlyticsService.recordError(error as Error, "Login Failed");
    throw error;
  }
};
```

## Debugging Tips

### Check Initialization

```typescript
// Verify Crashlytics is initialized
console.log("Crashlytics initialized:", crashlyticsService.isInitialized);
```

### View Logs

```typescript
// Add verbose logging during debugging
crashlyticsService.log("Step 1: Fetching data");
crashlyticsService.log("Step 2: Processing data");
crashlyticsService.log("Step 3: Saving data");
```

### Test Error Scenarios

```typescript
// Create test scenarios
if (__DEV__) {
  // Test error handling
  const testError = async () => {
    try {
      throw new Error("Test error scenario");
    } catch (error) {
      await crashlyticsService.recordError(error as Error, "Test Scenario");
    }
  };
}
```

## Common Patterns

### Retry Logic with Logging

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      crashlyticsService.log(`Fetch attempt ${i + 1} for ${url}`);
      const response = await fetch(url);
      return response;
    } catch (error) {
      if (i === maxRetries - 1) {
        // Last attempt failed
        await crashlyticsService.recordError(
          error as Error,
          `Fetch failed after ${maxRetries} attempts`
        );
        throw error;
      }
      crashlyticsService.log(`Retry ${i + 1} failed, trying again...`);
    }
  }
}
```

### Graceful Degradation

```typescript
async function loadArticleWithFallback(id: string) {
  try {
    // Try primary source
    return await fetchArticleFromAPI(id);
  } catch (error) {
    crashlyticsService.log("Primary API failed, trying cache");

    try {
      // Try cache
      return await getArticleFromCache(id);
    } catch (cacheError) {
      // Both failed
      await crashlyticsService.recordError(
        error as Error,
        "Article Load Failed (API and Cache)"
      );
      throw error;
    }
  }
}
```

### Batch Operations

```typescript
async function processBatch(items: Item[]) {
  const errors: Error[] = [];

  crashlyticsService.log(`Processing batch of ${items.length} items`);

  for (const item of items) {
    try {
      await processItem(item);
    } catch (error) {
      errors.push(error as Error);
      crashlyticsService.log(`Item ${item.id} failed`);
    }
  }

  if (errors.length > 0) {
    await crashlyticsService.recordError(
      new Error(`Batch processing: ${errors.length} failures`),
      "Batch Processing"
    );
  }

  return { success: items.length - errors.length, failed: errors.length };
}
```

## FAQ

### Q: Will Crashlytics slow down my app?

A: No, the impact is minimal (~50-100ms on startup). Reports are sent in the background.

### Q: How long until crashes appear in the console?

A: Usually 5-10 minutes. In some cases up to 1 hour.

### Q: Can I test in development mode?

A: Yes, but reports are more reliable in release builds.

### Q: What happens if the user is offline?

A: Reports are queued and sent when connectivity is restored.

### Q: Can users opt-out of crash reporting?

A: Yes, you can implement this with `setCrashlyticsCollectionEnabled(false)`.

### Q: How do I see which users are affected?

A: User IDs appear in crash reports if you've called `setUserId()`.

### Q: Can I delete crash reports?

A: No, but you can mark them as resolved or closed in the Firebase Console.

### Q: How much does Crashlytics cost?

A: It's free as part of Firebase.

## Resources

- [Implementation Plan](./firebase-crashlytics-implementation-plan.md)
- [Architecture Diagram](./crashlytics-architecture.md)
- [Firebase Crashlytics Docs](https://firebase.google.com/docs/crashlytics)
- [React Native Firebase](https://rnfirebase.io/crashlytics/usage)

## Support

For issues or questions:

1. Check Firebase Console for error details
2. Review implementation plan
3. Test with debug screen
4. Check initialization logs
5. Contact team lead if issues persist
