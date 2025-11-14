# Bookmark Feature Technical Specification

## 1. Overview

This document provides a comprehensive technical specification for implementing a bookmark feature in the EMAP mobile application. The feature allows users to save articles for later reading, with support for both authenticated and anonymous users, offline access, and seamless synchronization across sessions.

## 2. BookmarkContext Design

### 2.1 State Structure

```typescript
interface BookmarkState {
  bookmarks: Set<string>; // Set of article IDs for O(1) lookup
  bookmarkedArticles: Map<string, BookmarkedArticle>; // Full article data
  isLoading: boolean;
  error: string | null;
}

interface BookmarkedArticle {
  id: string;
  title: string;
  subtitle?: string;
  leadText: string;
  imageUrl: string;
  category: string;
  timestamp: string;
  publishDate?: string;
  link?: string;
  isLandscape?: boolean;
  source?: "wordpress" | "miso" | "native-ad";
  bookmarkedAt: number; // Unix timestamp when bookmarked
}

type BookmarkAction =
  | { type: "SET_LOADING"; payload: boolean }
  | {
      type: "SET_BOOKMARKS";
      payload: { ids: string[]; articles: BookmarkedArticle[] };
    }
  | { type: "ADD_BOOKMARK"; payload: BookmarkedArticle }
  | { type: "REMOVE_BOOKMARK"; payload: string }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ALL" };
```

### 2.2 Context Interface

```typescript
interface BookmarkContextType {
  // State
  bookmarks: Set<string>;
  bookmarkedArticles: BookmarkedArticle[];
  isLoading: boolean;
  error: string | null;

  // Methods
  addBookmark: (article: Article) => Promise<void>;
  removeBookmark: (articleId: string) => Promise<void>;
  isBookmarked: (articleId: string) => boolean;
  getBookmarks: () => BookmarkedArticle[];
  clearAllBookmarks: () => Promise<void>;
  syncBookmarks: () => Promise<void>;
}
```

### 2.3 Reducer Implementation

```typescript
function bookmarkReducer(
  state: BookmarkState,
  action: BookmarkAction
): BookmarkState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_BOOKMARKS":
      return {
        ...state,
        bookmarks: new Set(action.payload.ids),
        bookmarkedArticles: new Map(
          action.payload.articles.map((article) => [article.id, article])
        ),
        isLoading: false,
        error: null,
      };

    case "ADD_BOOKMARK":
      const newBookmarks = new Set(state.bookmarks);
      newBookmarks.add(action.payload.id);
      const newArticles = new Map(state.bookmarkedArticles);
      newArticles.set(action.payload.id, action.payload);
      return {
        ...state,
        bookmarks: newBookmarks,
        bookmarkedArticles: newArticles,
        error: null,
      };

    case "REMOVE_BOOKMARK":
      const updatedBookmarks = new Set(state.bookmarks);
      updatedBookmarks.delete(action.payload);
      const updatedArticles = new Map(state.bookmarkedArticles);
      updatedArticles.delete(action.payload);
      return {
        ...state,
        bookmarks: updatedBookmarks,
        bookmarkedArticles: updatedArticles,
        error: null,
      };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "CLEAR_ALL":
      return {
        ...state,
        bookmarks: new Set(),
        bookmarkedArticles: new Map(),
        error: null,
      };

    default:
      return state;
  }
}
```

### 2.4 Integration with AuthContext

The BookmarkContext will integrate with AuthContext to handle user-specific bookmarks:

```typescript
export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bookmarkReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const writeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load bookmarks on mount and when auth state changes
  useEffect(() => {
    loadBookmarks();
  }, [isAuthenticated, user?.userId]);

  // Sync bookmarks when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      syncBookmarksOnLogin();
    }
  }, [isAuthenticated, user?.userId]);
}
```

### 2.5 Anonymous vs Authenticated User Handling

**Anonymous Users:**

- Bookmarks stored in AsyncStorage with key: `bookmarks_anonymous`
- No server synchronization
- Data persists locally until app uninstall

**Authenticated Users:**

- Bookmarks stored in AsyncStorage with key: `bookmarks_user_{userId}`
- Future: Can be synced to server for cross-device access
- Separate storage per user account

### 2.6 Sync Strategy on Login/Logout

**On Login:**

1. Load anonymous bookmarks from `bookmarks_anonymous`
2. Load user bookmarks from `bookmarks_user_{userId}`
3. Merge both sets (union operation)
4. Save merged bookmarks to user's storage
5. Clear anonymous storage
6. Update context state

**On Logout:**

1. Save current bookmarks to anonymous storage
2. Clear user-specific storage reference
3. Update context state to use anonymous storage

```typescript
const syncBookmarksOnLogin = async () => {
  try {
    // Load anonymous bookmarks
    const anonymousData = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS);
    const anonymousBookmarks = anonymousData
      ? JSON.parse(anonymousData)
      : { ids: [], articles: [] };

    // Load user bookmarks
    const userKey = `${STORAGE_KEYS.USER_PREFIX}${user.userId}`;
    const userData = await AsyncStorage.getItem(userKey);
    const userBookmarks = userData
      ? JSON.parse(userData)
      : { ids: [], articles: [] };

    // Merge bookmarks (user bookmarks take precedence)
    const mergedIds = [
      ...new Set([...userBookmarks.ids, ...anonymousBookmarks.ids]),
    ];
    const mergedArticlesMap = new Map();

    // Add user bookmarks first
    userBookmarks.articles.forEach((article) =>
      mergedArticlesMap.set(article.id, article)
    );
    // Add anonymous bookmarks (won't overwrite existing)
    anonymousBookmarks.articles.forEach((article) => {
      if (!mergedArticlesMap.has(article.id)) {
        mergedArticlesMap.set(article.id, article);
      }
    });

    const mergedArticles = Array.from(mergedArticlesMap.values());

    // Save merged bookmarks to user storage
    await saveBookmarksToStorage(mergedIds, mergedArticles, userKey);

    // Clear anonymous storage
    await AsyncStorage.removeItem(STORAGE_KEYS.ANONYMOUS);

    // Update context
    dispatch({
      type: "SET_BOOKMARKS",
      payload: { ids: mergedIds, articles: mergedArticles },
    });

    console.log(`✅ Synced ${mergedIds.length} bookmarks on login`);
  } catch (error) {
    console.error("Error syncing bookmarks on login:", error);
  }
};
```

## 3. Storage Strategy

### 3.1 AsyncStorage Key Naming Convention

```typescript
const STORAGE_KEYS = {
  ANONYMOUS: "bookmarks_anonymous",
  USER_PREFIX: "bookmarks_user_",
  VERSION: "bookmarks_version",
};

const STORAGE_VERSION = "1.0";
```

### 3.2 Data Structure

```typescript
interface BookmarkStorageData {
  version: string;
  brand: string;
  ids: string[]; // Array of article IDs for quick loading
  articles: BookmarkedArticle[]; // Full article metadata
  lastModified: number; // Unix timestamp
}
```

**Storage Example:**

```json
{
  "version": "1.0",
  "brand": "jnl",
  "ids": ["12345", "67890"],
  "articles": [
    {
      "id": "12345",
      "title": "Article Title",
      "subtitle": "Article Subtitle",
      "leadText": "Lead text...",
      "imageUrl": "https://...",
      "category": "News",
      "timestamp": "2 hours ago",
      "publishDate": "2024-01-15T10:00:00Z",
      "link": "https://...",
      "isLandscape": true,
      "source": "wordpress",
      "bookmarkedAt": 1705315200000
    }
  ],
  "lastModified": 1705315200000
}
```

### 3.3 Migration Strategy

```typescript
const migrateBookmarkStorage = async (key: string): Promise<void> => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (!data) return;

    const parsed = JSON.parse(data);

    // Check version
    if (parsed.version === STORAGE_VERSION) return;

    // Migration logic based on version
    if (!parsed.version || parsed.version === "0.9") {
      // Migrate from v0.9 to v1.0
      const migrated: BookmarkStorageData = {
        version: STORAGE_VERSION,
        brand: brandManager.getCurrentBrand().shortcode,
        ids: parsed.ids || [],
        articles: parsed.articles || [],
        lastModified: Date.now(),
      };

      await AsyncStorage.setItem(key, JSON.stringify(migrated));
      console.log(
        `✅ Migrated bookmarks from v${parsed.version} to v${STORAGE_VERSION}`
      );
    }
  } catch (error) {
    console.error("Error migrating bookmark storage:", error);
  }
};
```

### 3.4 Performance Considerations

**In-Memory Set for Fast Lookups:**

- Use `Set<string>` for bookmark IDs in state
- O(1) lookup time for `isBookmarked()` checks
- Efficient for rendering bookmark button states

**Debounced AsyncStorage Writes:**

```typescript
const debouncedSaveBookmarks = useCallback(
  (ids: string[], articles: BookmarkedArticle[]) => {
    // Clear existing timeout
    if (writeTimeoutRef.current) {
      clearTimeout(writeTimeoutRef.current);
    }

    // Set new timeout for 500ms
    writeTimeoutRef.current = setTimeout(async () => {
      try {
        const storageKey =
          isAuthenticated && user
            ? `${STORAGE_KEYS.USER_PREFIX}${user.userId}`
            : STORAGE_KEYS.ANONYMOUS;

        await saveBookmarksToStorage(ids, articles, storageKey);
      } catch (error) {
        console.error("Error saving bookmarks:", error);
      }
    }, 500);
  },
  [isAuthenticated, user]
);
```

**Batch Operations:**

- Load all bookmarks once on app start
- Use in-memory state for all operations
- Persist to AsyncStorage in batches

## 4. Component Architecture

### 4.1 BookmarkButton Component

**File:** `components/BookmarkButton.tsx`

```typescript
interface BookmarkButtonProps {
  article: Article;
  style?: ViewStyle;
  iconSize?: number;
  iconColor?: string;
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export default function BookmarkButton({
  article,
  style,
  iconSize = 24,
  iconColor = "#FFFFFF",
  onBookmarkChange,
}: BookmarkButtonProps) {
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const bookmarked = isBookmarked(article.id);

  const handlePress = async () => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (bookmarked) {
        await removeBookmark(article.id);
        onBookmarkChange?.(false);
      } else {
        await addBookmark(article);
        onBookmarkChange?.(true);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Failed to update bookmark. Please try again.");
    }
  };

  return (
    <TouchableOpacity
      style={[styles.bookmarkButton, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel={bookmarked ? "Remove bookmark" : "Add bookmark"}
      accessibilityHint={
        bookmarked
          ? "Removes this article from your bookmarks"
          : "Saves this article to your bookmarks"
      }
      accessibilityRole="button"
    >
      <Ionicons
        name={bookmarked ? "bookmark" : "bookmark-outline"}
        size={iconSize}
        color={iconColor}
      />
    </TouchableOpacity>
  );
}
```

### 4.2 Integration Points in Article Teaser Components

**ArticleTeaserHero.tsx:**

```typescript
// Add BookmarkButton in the gradient overlay
<LinearGradient
  colors={["transparent", "rgba(0, 0, 0, 0.8)"]}
  style={styles.gradient}
>
  <ThemedView style={styles.contentContainer}>
    <ThemedView style={styles.headerRow}>
      <ThemedText type="defaultSemiBold" style={styles.title}>
        {article.title}
      </ThemedText>
      <BookmarkButton article={article} iconColor="#FFFFFF" iconSize={20} />
    </ThemedView>
  </ThemedView>
</LinearGradient>
```

**ArticleTeaserHorizontal.tsx:**

```typescript
// Add BookmarkButton in the content container
<ThemedView style={styles.contentContainer}>
  <ThemedView style={styles.headerRow}>
    <ThemedText style={styles.category}>{article.category}</ThemedText>
    <BookmarkButton article={article} iconSize={18} />
  </ThemedView>
  <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={3}>
    {article.title}
  </ThemedText>
</ThemedView>
```

**ArticleTeaser.tsx (standard list item):**

```typescript
// Add BookmarkButton next to the article title
<ThemedView style={styles.textContainer}>
  <ThemedView style={styles.titleRow}>
    <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
      {article.title}
    </ThemedText>
    <BookmarkButton article={article} iconSize={18} />
  </ThemedView>
  <ThemedText style={styles.excerpt} numberOfLines={2}>
    {article.leadText}
  </ThemedText>
</ThemedView>
```

### 4.3 BookmarksList Component

**File:** `components/BookmarksList.tsx`

```typescript
export default function BookmarksList() {
  const { bookmarkedArticles, isLoading, removeBookmark } = useBookmarks();
  const colorScheme = useColorScheme();

  if (isLoading) {
    return <ActivityIndicator size="large" />;
  }

  if (bookmarkedArticles.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Ionicons name="bookmark-outline" size={64} color="#999" />
        <ThemedText style={styles.emptyTitle}>No Bookmarks Yet</ThemedText>
        <ThemedText style={styles.emptyDescription}>
          Tap the bookmark icon on any article to save it for later
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={bookmarkedArticles}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ArticleTeaser
          article={item}
          onPress={() => router.push(`/article/${item.id}`)}
        />
      )}
      ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
      contentContainerStyle={styles.listContent}
    />
  );
}
```

### 4.4 Integration into SettingsContent

Add a new section in `components/SettingsContent.tsx`:

```typescript
// Add after the "Account" section
<ThemedView style={styles.section}>
  <ThemedText type="subtitle" style={styles.sectionTitle}>
    Saved Content
  </ThemedText>

  <TouchableOpacity
    style={styles.settingRow}
    onPress={() => {
      router.push("/bookmarks");
      onClose?.();
    }}
  >
    <ThemedView style={styles.settingLeft}>
      <Ionicons name="bookmark" size={20} color={primaryColor} />
      <ThemedText style={styles.settingLabel}>My Bookmarks</ThemedText>
    </ThemedView>
    <ThemedView style={styles.settingRight}>
      <ThemedText style={styles.settingValue}>
        {bookmarkedArticles.length}
      </ThemedText>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </ThemedView>
  </TouchableOpacity>
</ThemedView>
```

## 5. User Experience Flow

### 5.1 Bookmark/Unbookmark Interaction

**Flow:**

1. User taps bookmark icon on article
2. Haptic feedback triggers (light impact)
3. Icon animates from outline to filled (or vice versa)
4. Article added/removed from bookmarks
5. Optional: Toast notification "Article bookmarked" / "Bookmark removed"

**Visual States:**

- **Not Bookmarked:** `bookmark-outline` icon (outline style)
- **Bookmarked:** `bookmark` icon (filled style)
- **Loading:** Brief opacity change during save operation

### 5.2 Navigation to Bookmarks List

**Entry Points:**

1. Settings drawer → "My Bookmarks" option
2. Future: Dedicated tab in bottom navigation
3. Future: Quick access from article detail view

**Route:** `/bookmarks` (new screen)

### 5.3 Empty State Handling

**Empty State Design:**

```
┌─────────────────────────┐
│                         │
│    [Bookmark Icon]      │
│                         │
│   No Bookmarks Yet      │
│                         │
│  Tap the bookmark icon  │
│  on any article to save │
│  it for later           │
│                         │
└─────────────────────────┘
```

**Implementation:**

- Large bookmark-outline icon (64px)
- Clear heading and description
- Centered layout
- Subtle gray color scheme

## 6. Technical Considerations

### 6.1 Performance Optimization

**Debouncing AsyncStorage Writes:**

```typescript
// Debounce writes to prevent excessive I/O
const DEBOUNCE_DELAY = 500; // ms

// Use ref to track timeout
const writeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Debounced save function
const debouncedSave = (data: BookmarkStorageData) => {
  if (writeTimeoutRef.current) {
    clearTimeout(writeTimeoutRef.current);
  }

  writeTimeoutRef.current = setTimeout(async () => {
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
  }, DEBOUNCE_DELAY);
};
```

**Memoization:**

```typescript
// Memoize bookmarked articles array
const bookmarkedArticles = useMemo(() => {
  return Array.from(state.bookmarkedArticles.values()).sort(
    (a, b) => b.bookmarkedAt - a.bookmarkedAt
  ); // Sort by most recent
}, [state.bookmarkedArticles]);

// Memoize isBookmarked function
const isBookmarked = useCallback(
  (articleId: string) => state.bookmarks.has(articleId),
  [state.bookmarks]
);
```

### 6.2 Error Handling

**Storage Errors:**

```typescript
try {
  await AsyncStorage.setItem(key, value);
} catch (error) {
  if (error.message.includes("QuotaExceededError")) {
    // Handle storage quota exceeded
    Alert.alert(
      "Storage Full",
      "Unable to save bookmark. Please remove some bookmarks to free up space.",
      [{ text: "OK" }]
    );
  } else {
    // Generic error
    console.error("Error saving bookmark:", error);
    Alert.alert("Error", "Failed to save bookmark. Please try again.");
  }
}
```

**Network Errors (Future Server Sync):**

```typescript
// Implement retry logic with exponential backoff
const syncWithRetry = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await syncBookmarksToServer();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
};
```

### 6.3 Analytics Events

**Events to Track:**

```typescript
// Bookmark added
analyticsService.logEvent("bookmark_added", {
  article_id: article.id,
  article_title: article.title,
  article_category: article.category,
  source: article.source,
  user_authenticated: isAuthenticated,
});

// Bookmark removed
analyticsService.logEvent("bookmark_removed", {
  article_id: articleId,
  user_authenticated: isAuthenticated,
});

// Bookmarks list viewed
analyticsService.logScreenView("bookmarks_list", "BookmarksList", {
  bookmark_count: bookmarkedArticles.length,
});

// Bookmark clicked from list
analyticsService.logEvent("bookmark_clicked", {
  article_id: article.id,
  position: index,
  total_bookmarks: bookmarkedArticles.length,
});
```

### 6.4 Accessibility Considerations

**Screen Reader Support:**

```typescript
<TouchableOpacity
  accessibilityLabel={bookmarked ? "Remove bookmark" : "Add bookmark"}
  accessibilityHint={
    bookmarked
      ? "Removes this article from your bookmarks"
      : "Saves this article to your bookmarks for later reading"
  }
  accessibilityRole="button"
  accessibilityState={{ selected: bookmarked }}
>
```

**Haptic Feedback:**

```typescript
// Use appropriate haptic feedback for different actions
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // For bookmark toggle
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // For successful sync
```

**Color Contrast:**

- Ensure bookmark icon has sufficient contrast against background
- Use theme-aware colors from `Colors` constant
- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text

**Touch Target Size:**

- Minimum touch target: 44x44 points (iOS HIG)
- Add padding around icon if needed
- Ensure adequate spacing between bookmark button and other interactive elements

## 7. Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] Create `contexts/BookmarkContext.tsx`
- [ ] Implement bookmark reducer with all actions
- [ ] Add AsyncStorage integration with debouncing
- [ ] Implement anonymous/authenticated user handling
- [ ] Add login/logout sync logic
- [ ] Create storage migration system

### Phase 2: UI Components

- [ ] Create `components/BookmarkButton.tsx`
- [ ] Add haptic feedback and animations
- [ ] Integrate BookmarkButton into `ArticleTeaserHero`
- [ ] Integrate BookmarkButton into `ArticleTeaserHorizontal`
- [ ] Integrate BookmarkButton into ArticleTeaser (standard)
- [ ] Create `components/BookmarksList.tsx`
- [ ] Implement empty state design

### Phase 3: Navigation & Settings

- [ ] Create `/bookmarks` route in app directory
- [ ] Add bookmarks section to `SettingsContent`
- [ ] Add bookmark count display
- [ ] Implement navigation from settings to bookmarks list

### Phase 4: Analytics & Testing

- [ ] Add analytics events to `analyticsService`
- [ ] Test anonymous user bookmarks
- [ ] Test authenticated user bookmarks
- [ ] Test login/logout sync
- [ ] Test storage migration
- [ ] Test error handling
- [ ] Verify accessibility features

### Phase 5: Polish & Optimization

- [ ] Add loading states
- [ ] Optimize performance with memoization
- [ ] Add error boundaries
- [ ] Implement retry logic for failed operations
- [ ] Add unit tests for bookmark reducer
- [ ] Add integration tests for sync logic
- [ ] Update documentation

## 8. Future Enhancements

### 8.1 Server Synchronization

- Implement backend API for bookmark storage
- Add cross-device sync capability
- Implement conflict resolution for concurrent edits

### 8.2 Advanced Features

- Bookmark folders/collections
- Bookmark tags and filtering
- Search within bookmarks
- Export bookmarks (JSON, CSV)
- Bookmark sharing between users
- Reading progress tracking
- Offline article caching for bookmarked articles

### 8.3 UI Enhancements

- Swipe-to-delete in bookmarks list
- Bulk bookmark operations
- Sort options (date, title, category)
- Bookmark statistics and insights
- Visual bookmark indicators in article lists

## 9. Dependencies

**Required Packages:**

- `@react-native-async-storage/async-storage` (already installed)
- `expo-haptics` (already installed)
- `@expo/vector-icons` (already installed)

**No additional dependencies required.**

## 10. File Structure

```
contexts/
  └── BookmarkContext.tsx          # New file

components/
  ├── BookmarkButton.tsx           # New file
  ├── BookmarksList.tsx            # New file
  ├── ArticleTeaserHero.tsx        # Modified
  ├── ArticleTeaserHorizontal.tsx  # Modified
  └── SettingsContent.tsx          # Modified

app/
  └── bookmarks/
      └── index.tsx                # New file

types/
  └── index.ts                     # Modified (add BookmarkedArticle type)

services/
  └── analytics.ts                 # Modified (add bookmark events)
```

## 11. Conclusion

This technical specification provides a complete blueprint for implementing a robust bookmark feature that follows the existing architectural patterns in the EMAP application. The design prioritizes:

- **Performance:** Using Set for O(1) lookups and debounced storage writes
- **User Experience:** Seamless sync between anonymous and authenticated states
- **Maintainability:** Following established patterns from AuthContext and ColorSchemeContext
- **Accessibility:** Full screen reader support and haptic feedback
- **Scalability:** Designed to support future server synchronization

The implementation can be completed in phases, allowing for iterative development and testing while maintaining a working application throughout the process.
