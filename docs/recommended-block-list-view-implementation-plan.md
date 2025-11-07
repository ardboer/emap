# Related Block List View Implementation Plan

## Overview

Add a new `relatedBlockListView` feature that displays personalized article recommendations in a horizontal scrollable list, similar to the existing `trendingBlockListView` but using Miso's `user_to_products` endpoint for personalized recommendations.

## Architecture

### Data Flow

```
User Authentication State
         ↓
RelatedBlockHorizontal Component
         ↓
fetchRecommendedArticles() [existing]
         ↓
Miso API: /recommendation/user_to_products
         ↓
Article[] with personalized recommendations
```

## Implementation Details

### 1. Brand Configuration Type Definition

**File:** [`brands/index.ts`](brands/index.ts:125-129)

Add new configuration interface after `trendingBlockListView`:

```typescript
relatedBlockListView?: {
  enabled: boolean;      // Whether to show the related articles block
  position: number;      // Position in the feed (e.g., 2 = after 2nd block)
  itemCount?: number;    // Number of articles to display (default: 5)
};
```

**Configuration Options:**

- `enabled`: Controls visibility of the related block
- `position`: Determines where in the feed the block appears (0-based index)
- `itemCount`: Number of articles to fetch and display (defaults to 5 if not specified)

### 2. Component Creation

**File:** `components/RelatedBlockHorizontal.tsx` (new file)

Create a new component based on [`TrendingBlockHorizontal.tsx`](components/TrendingBlockHorizontal.tsx) with these key differences:

**Key Changes:**

- Use [`fetchRecommendedArticles()`](services/api.ts:1164) instead of `fetchTrendingArticles()`
- Update component name and cache keys
- Update loading/error messages to reference "related articles"
- Keep the same UI/UX patterns (horizontal scroll, card layout, etc.)

**Component Structure:**

```typescript
interface RelatedBlockHorizontalProps {
  onArticlePress?: (article: Article) => void;
}

export default function RelatedBlockHorizontal({
  onArticlePress,
}: RelatedBlockHorizontalProps) {
  // State management
  const { user, isAuthenticated } = useAuth();
  const { brandConfig } = useBrandConfig();
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get item count from config
  const itemCount = brandConfig?.relatedBlockListView?.itemCount || 5;

  // Fetch articles using existing fetchRecommendedArticles()
  useEffect(() => {
    const loadRelatedArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const articles = await fetchRecommendedArticles(
          itemCount,
          user?.userId,
          isAuthenticated
        );
        setRelatedArticles(articles);
      } catch (err) {
        setError("Failed to load related articles");
        console.error("Error loading related articles:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRelatedArticles();
  }, [itemCount, user?.userId, isAuthenticated]);

  // Render logic (same as TrendingBlockHorizontal)
  // - Loading state with ActivityIndicator
  // - Error/empty state returns null
  // - FlatList with horizontal scroll
  // - ArticleTeaserHorizontal for each item
}
```

**Styling:**

- Reuse the same styles from `TrendingBlockHorizontal`
- Maintain consistent card width (70% of screen width)
- Same spacing and snap behavior

### 3. News Feed Integration

**File:** [`app/(tabs)/news.tsx`](<app/(tabs)/news.tsx>)

**Integration Points:**

1. **Import the new component:**

```typescript
import RelatedBlockHorizontal from "@/components/RelatedBlockHorizontal";
```

2. **Add section type detection:**
   In the section data preparation logic (around line 340), add support for `isRelatedBlock`:

```typescript
const relatedConfig = brandConfig.relatedBlockListView;

// When building sections, check if position matches
if (relatedConfig?.enabled && blockIndex === relatedConfig.position) {
  sections.push({
    title: "",
    data: [],
    isRelatedBlock: true,
  });
}
```

3. **Render the component:**
   In the `renderSectionHeader` or similar render function (around line 197):

```typescript
if (section.isRelatedBlock) {
  return <RelatedBlockHorizontal onArticlePress={handleArticlePress} />;
}
```

**Position Logic:**

- The `position` value determines where the block appears in the feed
- Position 0 = before first content block
- Position 1 = after first content block
- Position 2 = after second content block, etc.
- Similar to how `trendingBlockListView` is currently implemented

### 4. Brand Configuration Updates

**Files:** Brand-specific config files (e.g., `brands/nt/config.ts`, `brands/cn/config.ts`)

Add the new configuration to each brand that should use this feature:

```typescript
relatedBlockListView: {
  enabled: true,
  position: 2,        // Show after 2nd block
  itemCount: 5,       // Show 5 related articles
},
```

**Recommended Defaults:**

- `enabled`: `false` (opt-in feature)
- `position`: `2` (after second content block)
- `itemCount`: `5` (same as trending default)

## Technical Considerations

### API Endpoint

- **Endpoint:** `/recommendation/user_to_products`
- **Already implemented in:** [`fetchRecommendedArticles()`](services/api.ts:1164)
- **Authentication:** Supports both authenticated (`sub:userId`) and anonymous users
- **Caching:** Uses cache key `"recommended_articles"` with hash and limit parameters

### Caching Strategy

The existing `fetchRecommendedArticles()` function already implements:

- Primary cache with hash validation
- Stale cache fallback on API errors
- Cache invalidation based on limit and brand hash

### User Experience

- **Loading State:** Shows spinner with "Loading related articles..." message
- **Error Handling:** Silently fails (returns null) to avoid disrupting feed
- **Empty State:** Returns null if no articles available
- **Scroll Behavior:** Horizontal scroll with snap-to-card behavior
- **Card Size:** 70% of screen width + 12px spacing

### Performance

- Lazy loading: Component only fetches when mounted
- Cached results: Reduces API calls for repeated views
- Efficient re-renders: Uses React.memo patterns from existing components

## Testing Checklist

### Functional Testing

- [ ] Component renders correctly when enabled
- [ ] Component hidden when disabled in config
- [ ] Correct number of articles displayed based on `itemCount`
- [ ] Articles appear at correct `position` in feed
- [ ] Loading state displays properly
- [ ] Error state handled gracefully
- [ ] Article press navigation works

### Authentication Testing

- [ ] Works for authenticated users (uses `sub:userId`)
- [ ] Works for anonymous users (uses `anonymous_id`)
- [ ] Transitions correctly when user logs in/out

### Brand Configuration Testing

- [ ] Works with different `position` values (0, 1, 2, etc.)
- [ ] Works with different `itemCount` values (3, 5, 10, etc.)
- [ ] Respects `enabled: false` configuration
- [ ] Falls back to defaults when optional values not provided

### Edge Cases

- [ ] No articles returned from API
- [ ] API error/timeout
- [ ] Network offline
- [ ] Miso not configured for brand
- [ ] Invalid position value

## Comparison: Trending vs Related

| Feature         | TrendingBlockListView              | RelatedBlockListView               |
| --------------- | ---------------------------------- | ---------------------------------- |
| **Endpoint**    | `/recommendation/user_to_trending` | `/recommendation/user_to_products` |
| **Data Source** | Global trending articles           | Personalized recommendations       |
| **Function**    | `fetchTrendingArticles()`          | `fetchRecommendedArticles()`       |
| **Cache Key**   | `"trending_articles"`              | `"recommended_articles"`           |
| **Use Case**    | Show what's popular globally       | Show personalized content          |
| **Config**      | `trendingBlockListView`            | `relatedBlockListView`             |

## Implementation Order

1. ✅ **Planning & Documentation** (Current)
2. **Add Type Definition** - Update [`brands/index.ts`](brands/index.ts)
3. **Create Component** - New `components/RelatedBlockHorizontal.tsx`
4. **Integrate Component** - Update [`app/(tabs)/news.tsx`](<app/(tabs)/news.tsx>)
5. **Configure Brands** - Enable in brand configs
6. **Testing** - Verify all scenarios
7. **Documentation** - Update user-facing docs

## Files to Modify

### New Files

- `components/RelatedBlockHorizontal.tsx` - Main component

### Modified Files

- [`brands/index.ts`](brands/index.ts) - Add type definition
- [`app/(tabs)/news.tsx`](<app/(tabs)/news.tsx>) - Integrate component
- Brand config files (e.g., `brands/nt/config.ts`) - Add configuration

### No Changes Required

- [`services/api.ts`](services/api.ts) - Use existing `fetchRecommendedArticles()`
- [`services/miso.ts`](services/miso.ts) - No changes needed
- [`components/ArticleTeaserHorizontal.tsx`](components/ArticleTeaserHorizontal.tsx) - Reuse existing

## Success Criteria

✅ **Feature Complete When:**

1. Type definition added to brand config interface
2. `RelatedBlockHorizontal` component created and working
3. Component integrated into news feed with position support
4. At least one brand configured to use the feature
5. All test scenarios pass
6. Documentation updated

## Notes

- This feature reuses the existing `fetchRecommendedArticles()` function, avoiding code duplication
- The implementation mirrors `TrendingBlockHorizontal` for consistency
- Both trending and related blocks can be enabled simultaneously at different positions
- The feature is opt-in via brand configuration
