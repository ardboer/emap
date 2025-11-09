# services/api.ts Refactoring Implementation Plan

## Executive Summary

This document provides a comprehensive, step-by-step plan to refactor the monolithic [`services/api.ts`](../services/api.ts) file (2,447 lines) into a modular, maintainable structure. The refactoring will eliminate ~80% code duplication, improve code organization, and maintain 100% backward compatibility.

**Current State:**

- Single file: 2,447 lines
- 40+ exported functions
- Heavy code duplication in Miso API calls
- Mixed concerns (WordPress, Miso, Magazine, utilities)

**Target State:**

- Modular structure under `services/api/`
- Shared utilities eliminate duplication
- Clear separation of concerns
- Barrel exports maintain backward compatibility

---

## 1. Proposed Directory Structure

### 1.1 Complete File Structure

```
services/
├── api.ts (LEGACY - will become barrel export)
└── api/
    ├── index.ts                          (~50 lines)  - Main barrel export
    ├── config.ts                         (~30 lines)  - API configuration
    ├── types.ts                          (~150 lines) - API-specific types
    │
    ├── wordpress/
    │   ├── index.ts                      (~20 lines)  - WordPress barrel export
    │   ├── articles.ts                   (~350 lines) - Article fetching
    │   ├── content.ts                    (~200 lines) - Content & structured data
    │   ├── menu.ts                       (~80 lines)  - Menu API
    │   ├── events.ts                     (~200 lines) - Events API
    │   ├── clinical.ts                   (~150 lines) - Clinical articles
    │   ├── search.ts                     (~80 lines)  - Search functionality
    │   └── categories.ts                 (~150 lines) - Category content
    │
    ├── miso/
    │   ├── index.ts                      (~20 lines)  - Miso barrel export
    │   ├── client.ts                     (~150 lines) - Shared Miso client
    │   ├── related.ts                    (~100 lines) - Related articles
    │   ├── trending.ts                   (~80 lines)  - Trending articles
    │   ├── recommended.ts                (~120 lines) - Recommended articles
    │   └── transformers.ts               (~100 lines) - Miso data transformers
    │
    ├── magazine/
    │   ├── index.ts                      (~20 lines)  - Magazine barrel export
    │   ├── editions.ts                   (~120 lines) - Edition management
    │   ├── pdf.ts                        (~150 lines) - PDF handling
    │   └── articles.ts                   (~100 lines) - Magazine articles
    │
    └── utils/
        ├── index.ts                      (~20 lines)  - Utils barrel export
        ├── transformers.ts               (~200 lines) - Data transformers
        ├── formatters.ts                 (~100 lines) - Date/text formatters
        ├── parsers.ts                    (~150 lines) - Content parsers
        ├── cache.ts                      (~80 lines)  - Cache helpers
        ├── media.ts                      (~80 lines)  - Media fetching
        └── nativeAds.ts                  (~120 lines) - Native ad injection
```

### 1.2 Function Distribution Map

#### WordPress Module (`services/api/wordpress/`)

**articles.ts** (~350 lines):

- `fetchArticles()` - Lines 332-381
- `fetchFeaturedArticles()` - Lines 487-544
- `fetchSingleArticle()` - Lines 547-627
- `fetchHighlightsWithRecommendations()` - Lines 1608-1699
- `fetchNewsArticles()` - Lines 1792-1794
- Helper: `transformHighlightsItemToArticle()` - Lines 213-308

**content.ts** (~200 lines):

- `fetchArticleContent()` - Lines 424-484
- `parseStructuredContent()` - Lines 384-421
- Helper: `transformPostToArticle()` - Lines 310-329

**menu.ts** (~80 lines):

- `fetchMenuItems()` - Lines 630-678

**events.ts** (~200 lines):

- `fetchEvents()` - Lines 721-781
- `fetchSingleEvent()` - Lines 784-862
- Helper: `transformWordPressEventToEvent()` - Lines 693-718
- Helper: `isValidEvent()` - Lines 681-690

**clinical.ts** (~150 lines):

- `fetchClinicalArticles()` - Lines 1977-2051
- Helper: `transformClinicalPostToArticle()` - Lines 1963-1974

**search.ts** (~80 lines):

- `fetchSearchResults()` - Lines 1912-1961

**categories.ts** (~150 lines):

- `fetchCategoryContent()` - Lines 1813-1909
- Helper: `transformCategoryPostToArticle()` - Lines 1797-1810

#### Miso Module (`services/api/miso/`)

**client.ts** (~150 lines) - NEW SHARED CLIENT:

```typescript
// Eliminates 80% duplication across Miso functions
interface MisoRequestConfig {
  endpoint: string;
  productId?: string;
  limit: number;
  excludeIds?: string[];
  userId?: string;
  isAuthenticated: boolean;
}

async function makeMisoRequest(config: MisoRequestConfig): Promise<any>
async function buildMisoRequestBody(config: MisoRequestConfig): Promise<any>
function getMisoUserId(userId?: string, isAuthenticated: boolean): Promise<{...}>
```

**related.ts** (~100 lines):

- `fetchRelatedArticles()` - Lines 865-1050 (refactored to use client)

**trending.ts** (~80 lines):

- `fetchTrendingArticles()` - Lines 1052-1215 (refactored to use client)

**recommended.ts** (~120 lines):

- `fetchRecommendedArticles()` - Lines 1217-1382 (refactored to use client)
- `fetchRecommendedArticlesWithExclude()` - Lines 1384-1566 (refactored to use client)

**transformers.ts** (~100 lines):

- `transformMisoProductToArticle()` - Extracted from lines 985-1022, 1159-1196, 1324-1361, 1487-1542
- `extractCategoryFromMisoProduct()` - Extracted common logic
- `extractArticleIdFromProductId()` - Extracted common logic

#### Magazine Module (`services/api/magazine/`)

**editions.ts** (~120 lines):

- `fetchMagazineEditions()` - Lines 2095-2135
- `fetchMagazineEditionData()` - Lines 2323-2376

**pdf.ts** (~150 lines):

- `fetchMagazinePDF()` - Lines 2187-2249
- `fetchMagazineCover()` - Lines 2141-2181
- `fetchPDFArticleDetail()` - Lines 2382-2447

**articles.ts** (~100 lines):

- `fetchMagazineArticle()` - Lines 2255-2317

#### Utils Module (`services/api/utils/`)

**transformers.ts** (~200 lines):

- `transformHighlightsItemToArticle()` - Lines 213-308
- `transformPostToArticle()` - Lines 310-329
- `transformWordPressEventToEvent()` - Lines 693-718
- `transformClinicalPostToArticle()` - Lines 1963-1974
- `transformCategoryPostToArticle()` - Lines 1797-1810

**formatters.ts** (~100 lines):

- `stripHtml()` - Lines 99-101
- `decodeHtmlEntities()` - Lines 104-120
- `formatDate()` - Lines 123-138
- `extractCategoryFromUrl()` - Lines 175-210

**parsers.ts** (~150 lines):

- `parseStructuredContent()` - Lines 384-421

**cache.ts** (~80 lines):

- Cache helper wrappers for consistent caching patterns

**media.ts** (~80 lines):

- `fetchMediaUrl()` - Lines 141-154
- `fetchCategoryName()` - Lines 157-172

**nativeAds.ts** (~120 lines):

- `injectNativeAds()` - Lines 1702-1789
- `mixArticles()` - Lines 1576-1605

**config.ts** (~30 lines):

- `getApiConfig()` - Lines 20-27
- Re-export `brandManager` - Line 17

**types.ts** (~150 lines):

- All interface definitions from lines 39-96

---

## 2. Code Duplication Analysis

### 2.1 Identified Duplication Patterns

#### Pattern 1: Miso API Request Structure (80% duplicate)

**Current State** - Repeated in 4 functions:

```typescript
// Lines 865-1050, 1052-1215, 1217-1382, 1384-1566
// Each function repeats:
// 1. Brand config retrieval (10 lines)
// 2. User ID determination (15 lines)
// 3. Request body construction (20 lines)
// 4. Fetch call with headers (10 lines)
// 5. Response transformation (40 lines)
// 6. Cache handling (15 lines)
// 7. Error handling (15 lines)
// Total: ~125 lines × 4 = 500 lines of duplication
```

**After Refactoring** - Shared client:

```typescript
// services/api/miso/client.ts
export async function makeMisoRequest(config: MisoRequestConfig) {
  const brandConfig = brandManager.getCurrentBrand();
  const { apiKey, brandFilter, baseUrl } = brandConfig.misoConfig;

  // Determine user ID based on authentication
  const { userId, anonymousId } = await getMisoUserId(
    config.userId,
    config.isAuthenticated
  );

  // Build request body
  const requestBody = await buildMisoRequestBody({
    ...config,
    userId,
    anonymousId,
    brandFilter,
  });

  // Make request
  const response = await fetch(`${baseUrl}${config.endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Miso API request failed: ${response.status}`);
  }

  return response.json();
}
```

**Savings:** 500 lines → 150 lines (70% reduction)

#### Pattern 2: Miso Product Transformation (100% duplicate)

**Current State** - Repeated 4 times:

```typescript
// Lines 985-1022, 1159-1196, 1324-1361, 1487-1542
// Each function repeats identical transformation logic:
const articles = products.map((product: any) => {
  // Extract category (15 lines)
  let category = "News";
  if (product.categories && Array.isArray(product.categories)...) {
    // Complex nested logic
  }

  // Extract article ID (8 lines)
  let articleId = product.product_id || "";
  const idMatch = articleId.match(/\d+$/);
  if (idMatch) {
    articleId = idMatch[0];
  }

  // Return article object (10 lines)
  return {
    id: articleId,
    title: decodeHtmlEntities(stripHtml(product.title || "")),
    // ... more fields
  };
});
```

**After Refactoring:**

```typescript
// services/api/miso/transformers.ts
export function transformMisoProductToArticle(
  product: any,
  options?: { forceIsLandscape?: boolean }
): Article {
  return {
    id: extractArticleIdFromProductId(product.product_id),
    title: decodeHtmlEntities(stripHtml(product.title || "")),
    leadText: "",
    content: product.html || "",
    imageUrl: processImageUrl(product.cover_image),
    timestamp: formatDate(product.published_at || new Date().toISOString()),
    category: extractCategoryFromMisoProduct(product),
    isLandscape: options?.forceIsLandscape,
  };
}

export function extractCategoryFromMisoProduct(product: any): string {
  if (!product.categories || !Array.isArray(product.categories)) {
    return "News";
  }

  const firstCategoryArray = product.categories[0];
  if (Array.isArray(firstCategoryArray) && firstCategoryArray.length > 0) {
    return firstCategoryArray[0];
  } else if (typeof firstCategoryArray === "string") {
    return firstCategoryArray;
  }

  return "News";
}

export function extractArticleIdFromProductId(productId: string): string {
  const idMatch = productId?.match(/\d+$/);
  return idMatch ? idMatch[0] : productId || "";
}
```

**Savings:** 160 lines → 40 lines (75% reduction)

#### Pattern 3: Cache Handling (90% duplicate)

**Current State** - Repeated in 20+ functions:

```typescript
// Try to get from cache first
const cached = await cacheService.get<Type>(cacheKey, params);
if (cached) {
  console.log("Returning cached...");
  return cached;
}

try {
  // ... fetch logic

  // Cache the result
  await cacheService.set(cacheKey, result, params);
  return result;
} catch (error) {
  // Try to return stale cached data
  const staleCache = await cacheService.get<Type>(cacheKey, params);
  if (staleCache) {
    console.log("Returning stale cached...");
    return staleCache;
  }
  throw error;
}
```

**After Refactoring:**

```typescript
// services/api/utils/cache.ts
export async function withCache<T>(
  cacheKey: string,
  params: any,
  fetcher: () => Promise<T>,
  options?: { skipCache?: boolean }
): Promise<T> {
  const { cacheService } = await import("@/services/cache");

  // Try cache first
  if (!options?.skipCache) {
    const cached = await cacheService.get<T>(cacheKey, params);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return cached;
    }
  }

  try {
    const result = await fetcher();
    await cacheService.set(cacheKey, result, params);
    return result;
  } catch (error) {
    // Fallback to stale cache
    const staleCache = await cacheService.get<T>(cacheKey, params);
    if (staleCache) {
      console.log(`⚠️ Using stale cache: ${cacheKey}`);
      return staleCache;
    }
    throw error;
  }
}
```

**Usage:**

```typescript
export async function fetchArticles(): Promise<Article[]> {
  return withCache("highlights", { hash }, async () => {
    const { baseUrl } = getApiConfig();
    const response = await fetch(`${baseUrl}${HIGHLIGHTS_ENDPOINT}`);
    // ... rest of logic
  });
}
```

**Savings:** 300 lines → 50 lines (83% reduction)

### 2.2 Total Duplication Savings

| Pattern              | Current Lines | After Refactoring | Savings       |
| -------------------- | ------------- | ----------------- | ------------- |
| Miso API requests    | 500           | 150               | 350 (70%)     |
| Miso transformations | 160           | 40                | 120 (75%)     |
| Cache handling       | 300           | 50                | 250 (83%)     |
| **Total**            | **960**       | **240**           | **720 (75%)** |

---

## 3. Migration Strategy

### 3.1 Backward Compatibility Approach

**Phase 1: Create New Structure (No Breaking Changes)**

- Create all new files under `services/api/`
- Keep original `services/api.ts` untouched
- No imports need to change yet

**Phase 2: Implement Barrel Exports**

```typescript
// services/api.ts (becomes a barrel export)
// Re-export everything from new structure
export * from "./api/wordpress";
export * from "./api/miso";
export * from "./api/magazine";
export * from "./api/utils";
export { brandManager } from "./api/config";
```

**Phase 3: Gradual Migration**

- Existing imports continue to work: `import { fetchArticles } from '@/services/api'`
- New code can use specific imports: `import { fetchArticles } from '@/services/api/wordpress'`
- Both work simultaneously

**Phase 4: Optional Cleanup**

- After all tests pass, optionally update imports to use specific paths
- This is optional and can be done incrementally

### 3.2 Import Path Compatibility Matrix

| Current Import                    | After Refactoring             | Status        |
| --------------------------------- | ----------------------------- | ------------- |
| `from '@/services/api'`           | Still works via barrel export | ✅ Compatible |
| `from '@/services/api/wordpress'` | New specific import           | ✅ Available  |
| `from '@/services/api/miso'`      | New specific import           | ✅ Available  |

### 3.3 Testing at Each Step

**Step-by-Step Verification:**

1. Create new file → Run type check
2. Move function → Run unit tests
3. Update barrel export → Run integration tests
4. Complete module → Run E2E tests

---

## 4. Dependency Management

### 4.1 Current Import Dependencies

**Files importing from services/api.ts:**

1. `components/RecommendedBlockHorizontal.tsx` - `fetchRecommendedArticles`
2. `components/ArticleDetailView.tsx` - `fetchPDFArticleDetail`
3. `components/RichContentRenderer.tsx` - `brandManager`
4. `components/PDFViewer.tsx` - `fetchMagazinePDF`
5. `components/TrendingBlockHorizontal.tsx` - `fetchTrendingArticles`
6. `components/MagazineListView.tsx` - `fetchMagazineCover`, `fetchMagazineEditions`
7. `components/TrendingArticles.tsx` - `fetchTrendingArticles`
8. `constants/Layout.ts` - `brandManager`
9. `app/[...slug].tsx` - `getPostBySlug`
10. `app/event/[id].tsx` - `fetchSingleEvent`
11. `app/(tabs)/events.tsx` - `fetchEvents`
12. `app/(tabs)/clinical.tsx` - `brandManager`, `fetchCategoryContent`
13. `app/(tabs)/news.tsx` - `fetchMenuItems`, multiple functions
14. `app/(tabs)/index.tsx` - `fetchRecommendedArticlesWithExclude`, multiple functions
15. `app/search.tsx` - `fetchSearchResults`
16. `app/pdf-article/[editionId]/[articleId].tsx` - `fetchPDFArticleDetail`

**Total:** 16 files with 25+ import statements

### 4.2 No Changes Required

✅ **All existing imports will continue to work** via barrel exports in `services/api.ts`

### 4.3 Circular Dependency Prevention

**Potential Risk Areas:**

1. `utils/transformers.ts` ↔ `wordpress/articles.ts`
2. `miso/client.ts` ↔ `miso/transformers.ts`

**Prevention Strategy:**

- Keep transformers pure (no API calls)
- Keep API functions separate from transformers
- Use dependency injection where needed

**Dependency Flow:**

```
config.ts (no dependencies)
  ↓
types.ts (no dependencies)
  ↓
utils/* (depends on config, types)
  ↓
wordpress/*, miso/*, magazine/* (depends on utils, config, types)
  ↓
index.ts (barrel export, depends on all modules)
```

---

## 5. Implementation Phases

### Phase 1: Foundation Setup (2-3 hours)

**Goal:** Create directory structure and shared utilities

**Tasks:**

1. Create directory structure

   ```bash
   mkdir -p services/api/{wordpress,miso,magazine,utils}
   ```

2. Create `services/api/config.ts`

   - Move `getApiConfig()` function
   - Re-export `brandManager`
   - Add endpoint constants

3. Create `services/api/types.ts`

   - Move all interface definitions
   - Add JSDoc documentation

4. Create `services/api/utils/formatters.ts`

   - Move `stripHtml()`
   - Move `decodeHtmlEntities()`
   - Move `formatDate()`
   - Move `extractCategoryFromUrl()`

5. Create `services/api/utils/parsers.ts`

   - Move `parseStructuredContent()`

6. Create `services/api/utils/media.ts`
   - Move `fetchMediaUrl()`
   - Move `fetchCategoryName()`

**Testing:**

```bash
npm run type-check
npm run test -- services/api/utils
```

**Rollback:** Delete `services/api/` directory

---

### Phase 2: Miso Module (3-4 hours)

**Goal:** Eliminate Miso duplication with shared client

**Tasks:**

1. Create `services/api/miso/client.ts`

   - Implement `makeMisoRequest()`
   - Implement `buildMisoRequestBody()`
   - Implement `getMisoUserId()`
   - Add comprehensive logging

2. Create `services/api/miso/transformers.ts`

   - Implement `transformMisoProductToArticle()`
   - Implement `extractCategoryFromMisoProduct()`
   - Implement `extractArticleIdFromProductId()`
   - Implement `processImageUrl()`

3. Create `services/api/miso/related.ts`

   - Refactor `fetchRelatedArticles()` to use client
   - Reduce from 185 lines to ~100 lines

4. Create `services/api/miso/trending.ts`

   - Refactor `fetchTrendingArticles()` to use client
   - Reduce from 163 lines to ~80 lines

5. Create `services/api/miso/recommended.ts`

   - Refactor `fetchRecommendedArticles()` to use client
   - Refactor `fetchRecommendedArticlesWithExclude()` to use client
   - Reduce from 348 lines to ~120 lines

6. Create `services/api/miso/index.ts` (barrel export)

**Before/After Example:**

**Before** (fetchTrendingArticles - 163 lines):

```typescript
export async function fetchTrendingArticles(
  limit: number = 5,
  userId?: string,
  isAuthenticated: boolean = false
): Promise<Article[]> {
  const { cacheService } = await import("./cache");
  const cacheKey = "trending_articles";
  const { hash } = getApiConfig();

  const cached = await cacheService.get<Article[]>(cacheKey, { limit, hash });

  try {
    const brandConfig = brandManager.getCurrentBrand();
    if (!brandConfig.misoConfig) {
      console.warn("Miso configuration not found");
      return [];
    }

    const { apiKey, brandFilter, baseUrl } = brandConfig.misoConfig;
    const endpoint = `${baseUrl}/recommendation/user_to_trending`;

    let misoUserId: string | undefined;
    let misoAnonymousId: string | undefined;

    if (isAuthenticated && userId) {
      misoUserId = `sub:${userId}`;
      misoAnonymousId = undefined;
    } else {
      misoUserId = undefined;
      misoAnonymousId = await getAnonymousId();
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoISO = oneYearAgo.toISOString().split("T")[0] + "T00:00:00Z";

    const requestBody: any = {
      fl: ["*"],
      rows: limit,
      boost_fq: `published_at:[${oneYearAgoISO} TO *]`,
      fq: `brand:"${brandFilter}"`,
    };

    if (misoUserId) {
      requestBody.user_id = misoUserId;
    } else if (misoAnonymousId) {
      requestBody.anonymous_id = misoAnonymousId;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Miso API request failed: ${response.status}`);
    }

    const data = await response.json();
    const products = (data.data && data.data.products) || data.products || [];

    const trendingArticles: Article[] = products.map((product: any) => {
      let category = "News";
      if (product.categories && Array.isArray(product.categories)...) {
        // 15 lines of category extraction
      }

      let articleId = product.product_id || "";
      const idMatch = articleId.match(/\d+$/);
      if (idMatch) {
        articleId = idMatch[0];
      }

      return {
        id: articleId,
        title: decodeHtmlEntities(stripHtml(product.title || "")),
        leadText: "",
        content: product.html || "",
        imageUrl: product.cover_image || "https://picsum.photos/800/600?random=1",
        timestamp: formatDate(product.published_at || new Date().toISOString()),
        category,
      };
    });

    await cacheService.set(cacheKey, trendingArticles, { limit, hash });
    return trendingArticles;
  } catch (error) {
    console.error("Error fetching trending articles:", error);
    const staleCache = await cacheService.get<Article[]>(cacheKey, { limit });
    if (staleCache) {
      return staleCache;
    }
    return [];
  }
}
```

**After** (fetchTrendingArticles - 80 lines):

```typescript
import { makeMisoRequest } from "./client";
import { transformMisoProductToArticle } from "./transformers";
import { withCache } from "../utils/cache";
import { getApiConfig } from "../config";

export async function fetchTrendingArticles(
  limit: number = 5,
  userId?: string,
  isAuthenticated: boolean = false
): Promise<Article[]> {
  const { hash } = getApiConfig();

  return withCache("trending_articles", { limit, hash }, async () => {
    try {
      const data = await makeMisoRequest({
        endpoint: "/recommendation/user_to_trending",
        limit,
        userId,
        isAuthenticated,
      });

      const products = data.data?.products || data.products || [];
      return products.map(transformMisoProductToArticle);
    } catch (error) {
      console.error("Error fetching trending articles:", error);
      return [];
    }
  });
}
```

**Testing:**

```bash
npm run test -- services/api/miso
npm run test:integration -- miso
```

**Rollback:** Delete `services/api/miso/` directory

---

### Phase 3: WordPress Module (4-5 hours)

**Goal:** Organize WordPress API functions by domain

**Tasks:**

1. Create `services/api/utils/transformers.ts`

   - Move all WordPress transformer functions
   - Add unit tests for each transformer

2. Create `services/api/wordpress/articles.ts`

   - Move `fetchArticles()`
   - Move `fetchFeaturedArticles()`
   - Move `fetchSingleArticle()`
   - Move `fetchHighlightsWithRecommendations()`
   - Move `fetchNewsArticles()`

3. Create `services/api/wordpress/content.ts`

   - Move `fetchArticleContent()`
   - Move `parseStructuredContent()`

4. Create `services/api/wordpress/menu.ts`

   - Move `fetchMenuItems()`

5. Create `services/api/wordpress/events.ts`

   - Move `fetchEvents()`
   - Move `fetchSingleEvent()`

6. Create `services/api/wordpress/clinical.ts`

   - Move `fetchClinicalArticles()`

7. Create `services/api/wordpress/search.ts`

   - Move `fetchSearchResults()`
   - Move `getPostBySlug()`

8. Create `services/api/wordpress/categories.ts`

   - Move `fetchCategoryContent()`

9. Create `services/api/wordpress/index.ts` (barrel export)

**Testing:**

```bash
npm run test -- services/api/wordpress
npm run test:integration -- wordpress
```

**Rollback:** Delete `services/api/wordpress/` directory

---

### Phase 4: Magazine Module (2-3 hours)

**Goal:** Organize magazine/PDF API functions

**Tasks:**

1. Create `services/api/magazine/editions.ts`

   - Move `fetchMagazineEditions()`
   - Move `fetchMagazineEditionData()`

2. Create `services/api/magazine/pdf.ts`

   - Move `fetchMagazinePDF()`
   - Move `fetchMagazineCover()`
   - Move `fetchPDFArticleDetail()`

3. Create `services/api/magazine/articles.ts`

   - Move `fetchMagazineArticle()`

4. Create `services/api/magazine/index.ts` (barrel export)

**Testing:**

```bash
npm run test -- services/api/magazine
npm run test:integration -- magazine
```

**Rollback:** Delete `services/api/magazine/` directory

---

### Phase 5: Utilities & Native Ads (2 hours)

**Goal:** Complete utility functions and native ad logic

**Tasks:**

1. Create `services/api/utils/cache.ts`

   - Implement `withCache()` helper
   - Add cache invalidation utilities

2. Create `services/api/utils/nativeAds.ts`

   - Move `injectNativeAds()`
   - Move `mixArticles()`

3. Create `services/api/utils/index.ts` (barrel export)

**Testing:**

```bash
npm run test -- services/api/utils
```

**Rollback:** Delete utility files

---

### Phase 6: Barrel Exports & Integration (1-2 hours)

**Goal:** Create main barrel export and ensure backward compatibility

**Tasks:**

1. Create `services/api/index.ts`

   ```typescript
   // Main barrel export - maintains backward compatibility
   export * from "./wordpress";
   export * from "./miso";
   export * from "./magazine";
   export * from "./utils";
   export { brandManager, getApiConfig } from "./config";
   export * from "./types";
   ```

2. Update `services/api.ts` to re-export from new structure

   ```typescript
   // Legacy file - now just re-exports from modular structure
   // This ensures all existing imports continue to work
   export * from "./api";
   ```

3. Verify all existing imports still work

**Testing:**

````bash
npm run type-check
npm run test
npm run test:integration
npm run

**Rollback:** Revert `services/api.ts` and `services/api/index.ts`

---

### Phase 7: Final Verification & Documentation (1-2 hours)

**Goal:** Comprehensive testing and documentation

**Tasks:**

1. Run full test suite
   ```bash
   npm run test
   npm run test:integration
   npm run type-check
   npm run lint
````

2. Test all 16 files that import from `services/api.ts`

   - Verify no runtime errors
   - Check console for warnings
   - Test each feature manually

3. Update documentation

   - Add JSDoc comments to all new files
   - Update README if needed
   - Document new import patterns

4. Performance verification
   - Compare bundle size before/after
   - Check app startup time
   - Verify no memory leaks

**Success Criteria:**

- All tests pass
- No TypeScript errors
- No runtime errors in any screen
- Bundle size unchanged or smaller
- All existing functionality works

**Rollback:** Full rollback to original `services/api.ts`

---

## 6. Rollback Strategy

### 6.1 Rollback Points

Each phase has a clear rollback point:

| Phase   | Rollback Action                            | Risk Level |
| ------- | ------------------------------------------ | ---------- |
| Phase 1 | Delete `services/api/` directory           | Low        |
| Phase 2 | Delete `services/api/miso/` directory      | Low        |
| Phase 3 | Delete `services/api/wordpress/` directory | Low        |
| Phase 4 | Delete `services/api/magazine/` directory  | Low        |
| Phase 5 | Delete utility files                       | Low        |
| Phase 6 | Revert barrel exports                      | Medium     |
| Phase 7 | Full rollback                              | High       |

### 6.2 Full Rollback Procedure

If critical issues are discovered:

1. **Immediate Rollback:**

   ```bash
   git checkout HEAD -- services/api.ts
   rm -rf services/api/
   npm run type-check
   ```

2. **Verify Rollback:**

   - Run tests: `npm test`
   - Check all imports work
   - Test app functionality

3. **Document Issues:**
   - Record what went wrong
   - Note which phase failed
   - Plan fixes before retry

### 6.3 Partial Rollback

If only one module has issues:

```bash
# Example: Rollback only Miso module
rm -rf services/api/miso/
# Update services/api/index.ts to remove Miso exports
# Keep other modules intact
```

---

## 7. Success Criteria

### 7.1 Functional Requirements

✅ **All existing functionality must work identically:**

- [ ] All 40+ API functions work as before
- [ ] All 16 importing files work without changes
- [ ] Cache behavior unchanged
- [ ] Error handling unchanged
- [ ] Logging output similar

### 7.2 Code Quality Metrics

✅ **Improved code organization:**

- [ ] No file exceeds 400 lines
- [ ] Code duplication reduced by 70%+
- [ ] Clear separation of concerns
- [ ] Consistent naming conventions
- [ ] Comprehensive JSDoc comments

### 7.3 Performance Benchmarks

✅ **No performance degradation:**

- [ ] Bundle size: ≤ current size (or smaller)
- [ ] App startup time: ≤ current time
- [ ] API call latency: unchanged
- [ ] Memory usage: unchanged
- [ ] No new memory leaks

### 7.4 Developer Experience

✅ **Improved maintainability:**

- [ ] New developers can find functions easily
- [ ] Related functions grouped logically
- [ ] Import paths are intuitive
- [ ] Code is self-documenting
- [ ] Easy to add new features

### 7.5 Testing Coverage

✅ **Comprehensive test coverage:**

- [ ] All utility functions have unit tests
- [ ] All API functions have integration tests
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Cache behavior tested

---

## 8. Timeline & Resource Estimate

### 8.1 Detailed Timeline

| Phase                     | Duration        | Complexity | Dependencies |
| ------------------------- | --------------- | ---------- | ------------ |
| Phase 1: Foundation       | 2-3 hours       | Low        | None         |
| Phase 2: Miso Module      | 3-4 hours       | Medium     | Phase 1      |
| Phase 3: WordPress Module | 4-5 hours       | Medium     | Phase 1      |
| Phase 4: Magazine Module  | 2-3 hours       | Low        | Phase 1      |
| Phase 5: Utilities        | 2 hours         | Low        | Phase 1      |
| Phase 6: Integration      | 1-2 hours       | Medium     | Phases 1-5   |
| Phase 7: Verification     | 1-2 hours       | Low        | Phase 6      |
| **Total**                 | **15-21 hours** |            |              |

### 8.2 Recommended Approach

**Option A: Single Sprint (Recommended)**

- Complete all phases in 2-3 days
- Maintain focus and context
- Easier to track dependencies
- Lower risk of conflicts

**Option B: Incremental (Lower Risk)**

- Complete 1-2 phases per day
- Test thoroughly between phases
- Easier to rollback if needed
- Can pause if issues arise

**Option C: Parallel (Fastest)**

- Multiple developers work on different modules
- Requires careful coordination
- Higher risk of conflicts
- Best for experienced teams

### 8.3 Resource Requirements

**Developer Skills Needed:**

- TypeScript/JavaScript expertise
- React Native experience
- Understanding of module systems
- Testing experience
- Git proficiency

**Tools Required:**

- Code editor (VS Code recommended)
- Node.js & npm
- Git for version control
- Testing framework (Jest)
- Type checker (TypeScript)

---

## 9. Risk Assessment & Mitigation

### 9.1 Identified Risks

| Risk                      | Probability | Impact | Mitigation                            |
| ------------------------- | ----------- | ------ | ------------------------------------- |
| Breaking existing imports | Low         | High   | Barrel exports maintain compatibility |
| Circular dependencies     | Medium      | Medium | Clear dependency hierarchy            |
| Performance regression    | Low         | High   | Benchmark before/after                |
| Incomplete migration      | Low         | Medium | Checklist for each function           |
| Test failures             | Medium      | Medium | Comprehensive testing at each phase   |
| Merge conflicts           | Medium      | Low    | Work in feature branch                |

### 9.2 Mitigation Strategies

**For Breaking Changes:**

- Use barrel exports to maintain all existing import paths
- Test all 16 importing files after each phase
- Keep original `services/api.ts` as fallback

**For Circular Dependencies:**

- Follow strict dependency hierarchy
- Keep transformers pure (no API calls)
- Use dependency injection where needed

**For Performance Issues:**

- Benchmark bundle size before starting
- Monitor app startup time
- Use React DevTools Profiler
- Check for unnecessary re-renders

**For Testing Issues:**

- Write tests as you migrate
- Use integration tests for API functions
- Mock external dependencies
- Test error scenarios

---

## 10. Post-Refactoring Improvements

### 10.1 Immediate Benefits

After completing the refactoring:

1. **Reduced Code Duplication**

   - 720 lines eliminated (75% reduction in duplicated code)
   - Easier to maintain and update

2. **Better Organization**

   - Functions grouped by domain
   - Easy to find related code
   - Clear module boundaries

3. **Improved Developer Experience**
   - Faster onboarding for new developers
   - Easier to add new features
   - Better code navigation

### 10.2 Future Enhancements

Once the refactoring is complete, consider:

1. **Add Comprehensive Tests**

   ```typescript
   // services/api/miso/__tests__/client.test.ts
   // services/api/wordpress/__tests__/articles.test.ts
   ```

2. **Add Request/Response Types**

   ```typescript
   // services/api/types.ts
   export interface MisoApiResponse<T> {
     data: { products: T[] };
     message?: string;
   }
   ```

3. **Add Request Cancellation**

   ```typescript
   // services/api/utils/request.ts
   export function createCancellableRequest(url: string) {
     const controller = new AbortController();
     // ...
   }
   ```

4. **Add Request Retry Logic**

   ```typescript
   // services/api/utils/retry.ts
   export async function withRetry<T>(
     fn: () => Promise<T>,
     maxRetries: number = 3
   ): Promise<T>;
   ```

5. **Add Request Queuing**
   ```typescript
   // services/api/utils/queue.ts
   export class RequestQueue {
     // Prevent too many simultaneous requests
   }
   ```

---

## 11. Conclusion

This refactoring plan provides a comprehensive, step-by-step approach to modernizing the [`services/api.ts`](../services/api.ts) file while maintaining 100% backward compatibility. The modular structure will:

- **Eliminate 75% of code duplication** (720 lines)
- **Improve code organization** with clear separation of concerns
- **Enhance maintainability** for future development
- **Maintain all existing functionality** without breaking changes
- **Provide clear rollback points** at each phase

### Key Success Factors

1. **Follow the phases sequentially** - Each phase builds on the previous
2. **Test thoroughly at each step** - Don't proceed until tests pass
3. **Use barrel exports** - Maintains backward compatibility
4. **Document as you go** - Add JSDoc comments to new files
5. **Monitor performance** - Benchmark before and after

### Next Steps

1. **Review this plan** with the team
2. **Get approval** to proceed
3. **Create a feature branch** for the refactoring
4. **Start with Phase 1** (Foundation Setup)
5. **Test thoroughly** after each phase
6. **Merge when complete** and all tests pass

### Estimated Timeline

- **Minimum:** 15 hours (experienced developer, no issues)
- **Expected:** 18 hours (normal pace with testing)
- **Maximum:** 21 hours (including documentation and edge cases)

**Recommended Schedule:** 2-3 days of focused work

---

## Appendix A: Quick Reference

### File Size Comparison

| Current             | After Refactoring      | Reduction               |
| ------------------- | ---------------------- | ----------------------- |
| 1 file: 2,447 lines | 25 files: ~2,200 lines | 10% smaller             |
| Heavy duplication   | Minimal duplication    | 75% less duplicate code |
| Mixed concerns      | Clear separation       | Better organization     |

### Import Pattern Examples

**Before (still works):**

```typescript
import { fetchArticles, fetchTrendingArticles } from "@/services/api";
```

**After (also works):**

```typescript
import { fetchArticles } from "@/services/api/wordpress";
import { fetchTrendingArticles } from "@/services/api/miso";
```

**Both patterns work!** Choose based on preference.

### Command Reference

```bash
# Create directory structure
mkdir -p services/api/{wordpress,miso,magazine,utils}

# Run type check
npm run type-check

# Run tests
npm test

# Run specific test
npm test -- services/api/miso

# Check bundle size
npm run build

# Full rollback
git checkout HEAD -- services/api.ts && rm -rf services/api/
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-09  
**Author:** Architecture Team  
**Status:** Ready for Implementation

```

```
