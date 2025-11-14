import ArticleTeaser from "@/components/ArticleTeaser";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatArticleDetailDate } from "@/services/api/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  useColorScheme,
} from "react-native";

export default function BookmarksList() {
  const { bookmarkedArticles, isLoading } = useBookmarks();
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, "articleListBackground");

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (bookmarkedArticles.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Ionicons
          name="bookmark-outline"
          size={64}
          color={colorScheme === "dark" ? "#666" : "#999"}
        />
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
          article={item as any}
          onPress={() => {
            // Pre-format the date to avoid flickering
            const formattedDate = item.publishDate
              ? formatArticleDetailDate(item.publishDate).toUpperCase()
              : item.timestamp?.toUpperCase() || "RECENTLY";

            router.push({
              pathname: `/article/${item.id}` as any,
              params: {
                previewTitle: item.title,
                previewCategory: item.category || "",
                previewDate: formattedDate,
              },
            });
          }}
        />
      )}
      ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
      contentContainerStyle={[
        styles.listContent,
        { backgroundColor: backgroundColor },
      ]}
      style={{ backgroundColor }}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "transparent",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 20,
    backgroundColor: "transparent",
  },
  listContent: {
    padding: 16,
    backgroundColor: "transparent",
  },
  separator: {
    height: 16,
  },
});
