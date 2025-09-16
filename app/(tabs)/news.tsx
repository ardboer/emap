import SwipeableTabView from "@/components/SwipeableTabView";
import TabBar from "@/components/TabBar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { fetchMenuItems, fetchNewsArticles } from "@/services/api";
import { Article } from "@/types";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function NewsScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const [fetchedArticles, fetchedMenuItems] = await Promise.all([
        fetchNewsArticles(),
        fetchMenuItems(),
      ]);
      setArticles(fetchedArticles);
      setMenuItems(fetchedMenuItems);
    } catch (err) {
      setError("Failed to load data");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [fetchedArticles, fetchedMenuItems] = await Promise.all([
        fetchNewsArticles(),
        fetchMenuItems(),
      ]);
      setArticles(fetchedArticles);
      setMenuItems(fetchedMenuItems);
      setError(null);
    } catch (err) {
      setError("Failed to refresh data");
      console.error("Error refreshing data:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const handleArticlePress = (article: Article) => {
    router.push(`/article/${article.id}`);
  };

  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.articleContainer}
      onPress={() => handleArticlePress(item)}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.thumbnail}
        contentFit="cover"
      />
      <ThemedView style={styles.contentContainer}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.leadText} numberOfLines={2}>
          {item.leadText}
        </ThemedText>
        <ThemedView style={styles.metaContainer}>
          <ThemedText style={styles.category}>{item.category}</ThemedText>
          <ThemedText style={styles.timestamp}>{item.timestamp}</ThemedText>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );

  const renderTabContent = () => (
    <FlatList
      data={articles}
      renderItem={renderArticle}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.listContainer}
    />
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (error && articles.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Create tabs from menu items
  const tabs = menuItems.map((item) => ({
    id: item.ID.toString(),
    title: item.title,
    content: renderTabContent(),
  }));

  // If no menu items, show default tab
  if (tabs.length === 0) {
    tabs.push({
      id: "default",
      title: "News",
      content: renderTabContent(),
    });
  }

  return (
    <ThemedView style={styles.container}>
      <TabBar
        tabs={tabs}
        activeTabIndex={activeTabIndex}
        onTabPress={handleTabChange}
      />
      <SwipeableTabView
        tabs={tabs}
        activeTabIndex={activeTabIndex}
        onTabChange={handleTabChange}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  articleContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    overflow: "hidden",
  },
  thumbnail: {
    width: 120,
    alignSelf: "stretch",
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  leadText: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.7,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
