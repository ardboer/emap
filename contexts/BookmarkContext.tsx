import { brandManager } from "@/config/BrandManager";
import { Article } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

// Use ReturnType to get the correct timeout type for the platform
type TimeoutId = ReturnType<typeof setTimeout>;

// Storage keys
const STORAGE_KEYS = {
  ANONYMOUS: "bookmarks_anonymous",
  USER_PREFIX: "bookmarks_user_",
  VERSION: "bookmarks_version",
};

const STORAGE_VERSION = "1.0";
const DEBOUNCE_DELAY = 500; // ms

// Types
export interface BookmarkedArticle {
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

interface BookmarkStorageData {
  version: string;
  brand: string;
  ids: string[];
  articles: BookmarkedArticle[];
  lastModified: number;
}

interface BookmarkState {
  bookmarks: Set<string>;
  bookmarkedArticles: Map<string, BookmarkedArticle>;
  isLoading: boolean;
  error: string | null;
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

interface BookmarkContextType {
  bookmarks: Set<string>;
  bookmarkedArticles: BookmarkedArticle[];
  isLoading: boolean;
  error: string | null;
  addBookmark: (article: Article) => Promise<void>;
  removeBookmark: (articleId: string) => Promise<void>;
  isBookmarked: (articleId: string) => boolean;
  getBookmarks: () => BookmarkedArticle[];
  clearAllBookmarks: () => Promise<void>;
  syncBookmarks: () => Promise<void>;
}

// Initial state
const initialState: BookmarkState = {
  bookmarks: new Set(),
  bookmarkedArticles: new Map(),
  isLoading: true,
  error: null,
};

// Reducer
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

// Context
const BookmarkContext = createContext<BookmarkContextType | undefined>(
  undefined
);

// Provider
export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bookmarkReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const writeTimeoutRef = useRef<TimeoutId | null>(null);

  // Get current storage key based on auth state
  const getStorageKey = useCallback(() => {
    if (isAuthenticated && user) {
      return `${STORAGE_KEYS.USER_PREFIX}${user.userId}`;
    }
    return STORAGE_KEYS.ANONYMOUS;
  }, [isAuthenticated, user]);

  // Convert Article to BookmarkedArticle
  const convertToBookmarkedArticle = useCallback(
    (article: Article): BookmarkedArticle => {
      return {
        id: article.id,
        title: article.title,
        subtitle: article.subtitle,
        leadText:
          typeof article.leadText === "string"
            ? article.leadText
            : article.leadText
                .map((node) => node.text || "")
                .join(" ")
                .substring(0, 200),
        imageUrl: article.imageUrl,
        category: article.category,
        timestamp: article.timestamp,
        publishDate: article.publishDate,
        link: article.link,
        isLandscape: article.isLandscape,
        source: article.source,
        bookmarkedAt: Date.now(),
      };
    },
    []
  );

  // Save bookmarks to storage (debounced)
  const saveBookmarksToStorage = useCallback(
    (ids: string[], articles: BookmarkedArticle[]) => {
      // Clear existing timeout
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
      }

      // Set new timeout
      writeTimeoutRef.current = setTimeout(async () => {
        try {
          const storageKey = getStorageKey();
          const data: BookmarkStorageData = {
            version: STORAGE_VERSION,
            brand: brandManager.getCurrentBrand().shortcode,
            ids,
            articles,
            lastModified: Date.now(),
          };

          await AsyncStorage.setItem(storageKey, JSON.stringify(data));
          console.log(
            `✅ Saved ${ids.length} bookmarks to storage (${storageKey})`
          );
        } catch (error) {
          console.error("Error saving bookmarks:", error);
          dispatch({
            type: "SET_ERROR",
            payload: "Failed to save bookmarks",
          });
        }
      }, DEBOUNCE_DELAY);
    },
    [getStorageKey]
  );

  // Load bookmarks from storage
  const loadBookmarks = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const storageKey = getStorageKey();
      const data = await AsyncStorage.getItem(storageKey);

      if (!data) {
        console.log("No bookmarks found in storage");
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      const parsed: BookmarkStorageData = JSON.parse(data);

      // Check version and migrate if needed
      if (parsed.version !== STORAGE_VERSION) {
        console.log(
          `Migrating bookmarks from v${parsed.version} to v${STORAGE_VERSION}`
        );
        // For now, just update version - add migration logic here if needed
        parsed.version = STORAGE_VERSION;
        await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
      }

      // Check brand match
      const currentBrand = brandManager.getCurrentBrand().shortcode;
      if (parsed.brand !== currentBrand) {
        console.log(
          `Brand mismatch: stored=${parsed.brand}, current=${currentBrand}`
        );
        // Could handle brand switching here - for now just load anyway
      }

      dispatch({
        type: "SET_BOOKMARKS",
        payload: { ids: parsed.ids, articles: parsed.articles },
      });

      console.log(`✅ Loaded ${parsed.ids.length} bookmarks from storage`);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load bookmarks",
      });
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [getStorageKey]);

  // Sync bookmarks when user logs in
  const syncBookmarksOnLogin = useCallback(async () => {
    if (!user) return;

    try {
      console.log("🔄 Syncing bookmarks on login...");

      // Load anonymous bookmarks
      const anonymousData = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS);
      const anonymousBookmarks: BookmarkStorageData = anonymousData
        ? JSON.parse(anonymousData)
        : {
            ids: [],
            articles: [],
            version: STORAGE_VERSION,
            brand: "",
            lastModified: 0,
          };

      // Load user bookmarks
      const userKey = `${STORAGE_KEYS.USER_PREFIX}${user.userId}`;
      const userData = await AsyncStorage.getItem(userKey);
      const userBookmarks: BookmarkStorageData = userData
        ? JSON.parse(userData)
        : {
            ids: [],
            articles: [],
            version: STORAGE_VERSION,
            brand: "",
            lastModified: 0,
          };

      // Merge bookmarks (user bookmarks take precedence)
      const mergedIds = [
        ...new Set([...userBookmarks.ids, ...anonymousBookmarks.ids]),
      ];
      const mergedArticlesMap = new Map<string, BookmarkedArticle>();

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
      const mergedData: BookmarkStorageData = {
        version: STORAGE_VERSION,
        brand: brandManager.getCurrentBrand().shortcode,
        ids: mergedIds,
        articles: mergedArticles,
        lastModified: Date.now(),
      };
      await AsyncStorage.setItem(userKey, JSON.stringify(mergedData));

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
  }, [user]);

  // Load bookmarks on mount and when auth state changes
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Sync bookmarks when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      syncBookmarksOnLogin();
    }
  }, [isAuthenticated, user?.userId, syncBookmarksOnLogin]);

  // Add bookmark
  const addBookmark = useCallback(
    async (article: Article) => {
      try {
        const bookmarkedArticle = convertToBookmarkedArticle(article);
        dispatch({ type: "ADD_BOOKMARK", payload: bookmarkedArticle });

        // Save to storage (debounced)
        const newIds = [...state.bookmarks, article.id];
        const newArticles = [
          ...Array.from(state.bookmarkedArticles.values()),
          bookmarkedArticle,
        ];
        saveBookmarksToStorage(newIds, newArticles);

        console.log(`✅ Bookmarked article: ${article.title}`);
      } catch (error) {
        console.error("Error adding bookmark:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to add bookmark",
        });
        throw error;
      }
    },
    [
      state.bookmarks,
      state.bookmarkedArticles,
      convertToBookmarkedArticle,
      saveBookmarksToStorage,
    ]
  );

  // Remove bookmark
  const removeBookmark = useCallback(
    async (articleId: string) => {
      try {
        dispatch({ type: "REMOVE_BOOKMARK", payload: articleId });

        // Save to storage (debounced)
        const newIds = Array.from(state.bookmarks).filter(
          (id) => id !== articleId
        );
        const newArticles = Array.from(
          state.bookmarkedArticles.values()
        ).filter((article) => article.id !== articleId);
        saveBookmarksToStorage(newIds, newArticles);

        console.log(`✅ Removed bookmark: ${articleId}`);
      } catch (error) {
        console.error("Error removing bookmark:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to remove bookmark",
        });
        throw error;
      }
    },
    [state.bookmarks, state.bookmarkedArticles, saveBookmarksToStorage]
  );

  // Check if article is bookmarked
  const isBookmarked = useCallback(
    (articleId: string) => state.bookmarks.has(articleId),
    [state.bookmarks]
  );

  // Get all bookmarks (sorted by most recent)
  const bookmarkedArticles = useMemo(() => {
    return Array.from(state.bookmarkedArticles.values()).sort(
      (a, b) => b.bookmarkedAt - a.bookmarkedAt
    );
  }, [state.bookmarkedArticles]);

  // Get bookmarks function
  const getBookmarks = useCallback(
    () => bookmarkedArticles,
    [bookmarkedArticles]
  );

  // Clear all bookmarks
  const clearAllBookmarks = useCallback(async () => {
    try {
      dispatch({ type: "CLEAR_ALL" });
      const storageKey = getStorageKey();
      await AsyncStorage.removeItem(storageKey);
      console.log("✅ Cleared all bookmarks");
    } catch (error) {
      console.error("Error clearing bookmarks:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to clear bookmarks",
      });
      throw error;
    }
  }, [getStorageKey]);

  // Sync bookmarks (reload from storage)
  const syncBookmarks = useCallback(async () => {
    await loadBookmarks();
  }, [loadBookmarks]);

  const value: BookmarkContextType = {
    bookmarks: state.bookmarks,
    bookmarkedArticles,
    isLoading: state.isLoading,
    error: state.error,
    addBookmark,
    removeBookmark,
    isBookmarked,
    getBookmarks,
    clearAllBookmarks,
    syncBookmarks,
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
}

// Hook
export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
}
