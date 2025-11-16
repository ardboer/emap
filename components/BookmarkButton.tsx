import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { analyticsService } from "@/services/analytics";
import { Article } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";

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
  const { isAuthenticated } = useAuth();
  const bookmarked = isBookmarked(article.id);

  const handlePress = async () => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (bookmarked) {
        await removeBookmark(article.id);
        onBookmarkChange?.(false);

        // Log analytics
        await analyticsService.logBookmarkRemoved(article.id, isAuthenticated);
      } else {
        await addBookmark(article);
        onBookmarkChange?.(true);

        // Log analytics
        await analyticsService.logBookmarkAdded(
          article.id,
          article.title,
          article.category,
          article.source,
          isAuthenticated
        );
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
          : "Saves this article to your bookmarks for later reading"
      }
      accessibilityRole="button"
      accessibilityState={{ selected: bookmarked }}
    >
      <Ionicons
        name={bookmarked ? "bookmark" : "bookmark-outline"}
        size={iconSize}
        color={iconColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bookmarkButton: {
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
