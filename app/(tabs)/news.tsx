import ArticleTeaser from "@/components/ArticleTeaser";
import GradientHeader from "@/components/GradientHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import TopicsTabBar from "@/components/TopicsTabBar";
import { Colors } from "@/constants/Colors";
import {
  fetchCategoryContent,
  fetchMenuItems,
  fetchNewsArticles,
} from "@/services/api";
import { Article } from "@/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

export default function NewsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store articles per tab
  const [tabArticles, setTabArticles] = useState<{ [key: string]: Article[] }>(
    {}
  );
  const [tabLoadingStates, setTabLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [tabRefreshingStates, setTabRefreshingStates] = useState<{
    [key: string]: boolean;
  }>({});

  const loadInitialData = async () => {
    try {
      setError(null);
      const fetchedMenuItems = await fetchMenuItems();
      setMenuItems(fetchedMenuItems);

      // Load content for the first tab (Home or first menu item)
      if (fetchedMenuItems.length > 0) {
        await loadTabContent(0, fetchedMenuItems);
      }
    } catch (err) {
      setError("Failed to load data");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabContent = async (tabIndex: number, menuItemsToUse?: any[]) => {
    const items = menuItemsToUse || menuItems;
    if (items.length === 0) return;

    const menuItem = items[tabIndex];
    const tabKey = menuItem.object_id.toString();

    // Set loading state for this tab
    setTabLoadingStates((prev) => ({ ...prev, [tabKey]: true }));

    try {
      let articles: Article[];

      // Check if this is the "Home" tab
      if (menuItem.title === "Home") {
        articles = await fetchNewsArticles();
      } else {
        // Use the menu item's object_id to fetch category content
        articles = await fetchCategoryContent(menuItem.object_id.toString());
      }

      setTabArticles((prev) => ({ ...prev, [tabKey]: articles }));
    } catch (err) {
      console.error(`Error loading content for tab ${menuItem.title}:`, err);
      setTabArticles((prev) => ({ ...prev, [tabKey]: [] }));
    } finally {
      setTabLoadingStates((prev) => ({ ...prev, [tabKey]: false }));
    }
  };

  const onRefreshTab = async (tabIndex: number) => {
    if (menuItems.length === 0) return;

    const menuItem = menuItems[tabIndex];
    const tabKey = menuItem.object_id.toString();

    setTabRefreshingStates((prev) => ({ ...prev, [tabKey]: true }));

    try {
      let articles: Article[];

      if (menuItem.title === "Home") {
        articles = await fetchNewsArticles();
      } else {
        articles = await fetchCategoryContent(menuItem.object_id.toString());
      }

      setTabArticles((prev) => ({ ...prev, [tabKey]: articles }));
    } catch (err) {
      console.error(`Error refreshing content for tab ${menuItem.title}:`, err);
    } finally {
      setTabRefreshingStates((prev) => ({ ...prev, [tabKey]: false }));
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleArticlePress = (article: Article) => {
    router.push(`/article/${article.id}`);
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  const handleTabChange = async (index: number) => {
    setActiveTabIndex(index);

    // Load content for this tab if not already loaded
    const menuItem = menuItems[index];
    const tabKey = menuItem.object_id.toString();

    if (!tabArticles[tabKey] && !tabLoadingStates[tabKey]) {
      await loadTabContent(index);
    }
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <ArticleTeaser article={item} onPress={handleArticlePress} />
  );

  const renderTabContent = (tabIndex: number) => {
    if (menuItems.length === 0) return null;

    const menuItem = menuItems[tabIndex];
    const tabKey = menuItem.object_id.toString();
    const articles = tabArticles[tabKey] || [];
    const isLoading = tabLoadingStates[tabKey] || false;
    const isRefreshing = tabRefreshingStates[tabKey] || false;

    if (isLoading && articles.length === 0) {
      return (
        <ThemedView style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            Loading {menuItem.title}...
          </ThemedText>
        </ThemedView>
      );
    }

    return (
      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item, index) => item.id + index.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => onRefreshTab(tabIndex)}
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          { backgroundColor: Colors[colorScheme].articleListBackground },
        ]}
        ListEmptyComponent={
          <ThemedView style={styles.centerContent}>
            <ThemedText style={styles.emptyText}>
              No articles available
            </ThemedText>
          </ThemedView>
        }
      />
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (error && menuItems.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Create tabs from menu items
  const tabs = menuItems.map((item) => ({
    id: item.object_id.toString(),
    title: item.title,
  }));

  // If no menu items, show default tab
  if (tabs.length === 0) {
    tabs.push({
      id: "default",
      title: "News",
    });
  }

  // Get current tab's articles
  const currentMenuItemKey =
    menuItems[activeTabIndex]?.object_id.toString() || "default";
  const currentArticles = tabArticles[currentMenuItemKey] || [];
  const isCurrentTabLoading = tabLoadingStates[currentMenuItemKey] || false;
  const isCurrentTabRefreshing =
    tabRefreshingStates[currentMenuItemKey] || false;

  return (
    <ThemedView style={styles.container}>
      <GradientHeader onSearchPress={handleSearchPress} />
      <TopicsTabBar
        tabs={tabs}
        activeTabIndex={activeTabIndex}
        onTabChange={handleTabChange}
      />
      {isCurrentTabLoading && currentArticles.length === 0 ? (
        <ThemedView style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            Loading {menuItems[activeTabIndex]?.title || "articles"}...
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={currentArticles}
          renderItem={renderArticle}
          keyExtractor={(item, index) => item.id + index.toString()}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isCurrentTabRefreshing}
              onRefresh={() => onRefreshTab(activeTabIndex)}
            />
          }
          contentContainerStyle={[
            styles.listContainer,
            { backgroundColor: Colors[colorScheme].articleListBackground },
          ]}
          ListEmptyComponent={
            <ThemedView style={styles.centerContent}>
              <ThemedText style={styles.emptyText}>
                No articles available
              </ThemedText>
            </ThemedView>
          }
        />
      )}
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    padding: 20,
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
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.6,
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
