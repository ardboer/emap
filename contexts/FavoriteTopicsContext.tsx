import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// AsyncStorage key for favorite topics
const FAVORITE_TOPICS_KEY = "@news_favorite_topics";

interface FavoriteTopicsContextType {
  favoriteTopicIds: string[];
  isLoading: boolean;
  toggleFavorite: (topicId: string) => Promise<void>;
  isFavorite: (topicId: string) => boolean;
  loadFavorites: () => Promise<void>;
}

const FavoriteTopicsContext = createContext<
  FavoriteTopicsContextType | undefined
>(undefined);

export function FavoriteTopicsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [favoriteTopicIds, setFavoriteTopicIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorite topics from AsyncStorage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(FAVORITE_TOPICS_KEY);
      if (stored) {
        const favorites = JSON.parse(stored) as string[];
        setFavoriteTopicIds(favorites);
      }
    } catch (error) {
      console.error("Error loading favorite topics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (topicId: string) => {
    const newFavorites = favoriteTopicIds.includes(topicId)
      ? favoriteTopicIds.filter((id) => id !== topicId)
      : [...favoriteTopicIds, topicId];

    setFavoriteTopicIds(newFavorites);

    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem(
        FAVORITE_TOPICS_KEY,
        JSON.stringify(newFavorites)
      );
    } catch (error) {
      console.error("Error saving favorite topics:", error);
    }
  };

  const isFavorite = (topicId: string): boolean => {
    return favoriteTopicIds.includes(topicId);
  };

  return (
    <FavoriteTopicsContext.Provider
      value={{
        favoriteTopicIds,
        isLoading,
        toggleFavorite,
        isFavorite,
        loadFavorites,
      }}
    >
      {children}
    </FavoriteTopicsContext.Provider>
  );
}

export function useFavoriteTopics() {
  const context = useContext(FavoriteTopicsContext);
  if (context === undefined) {
    throw new Error(
      "useFavoriteTopics must be used within a FavoriteTopicsProvider"
    );
  }
  return context;
}
