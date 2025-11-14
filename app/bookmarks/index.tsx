import BookmarksList from "@/components/BookmarksList";
import GradientHeader from "@/components/GradientHeader";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { analyticsService } from "@/services/analytics";
import { router, Stack, useFocusEffect } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

export default function BookmarksScreen() {
  const { bookmarkedArticles } = useBookmarks();
  const backgroundColor = useThemeColor({}, "articleListBackground");
  const [settingsDrawerVisible, setSettingsDrawerVisible] =
    React.useState(false);

  // Log screen view when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      analyticsService.logScreenView("bookmarks_list", "BookmarksScreen", {
        bookmark_count: bookmarkedArticles.length,
      });
      analyticsService.logBookmarksListViewed(bookmarkedArticles.length);
    }, [bookmarkedArticles.length])
  );

  const handleBack = () => {
    router.back();
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ThemedView
        style={[styles.container, { backgroundColor: backgroundColor }]}
      >
        <GradientHeader
          onSearchPress={handleSearchPress}
          showBackButton={true}
          onBackPress={handleBack}
          showUserIcon={true}
          onUserPress={() => setSettingsDrawerVisible(true)}
        />
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            My Bookmarks
          </ThemedText>
          <ThemedText style={styles.count}>
            {bookmarkedArticles.length}{" "}
            {bookmarkedArticles.length === 1 ? "article" : "articles"}
          </ThemedText>
        </ThemedView>
        <BookmarksList />
        <SettingsDrawer
          visible={settingsDrawerVisible}
          onClose={() => setSettingsDrawerVisible(false)}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  count: {
    fontSize: 14,
    opacity: 0.7,
  },
});
