import ArticleTeaser from "@/components/ArticleTeaser";
import ArticleTeaserHero from "@/components/ArticleTeaserHero";
import ArticleTeaserHorizontal from "@/components/ArticleTeaserHorizontal";
import { BlockHeader } from "@/components/BlockHeader";
import GradientHeader from "@/components/GradientHeader";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import TopicsTabBar from "@/components/TopicsTabBar";
import TrendingBlockHorizontal from "@/components/TrendingBlockHorizontal";
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import {
  brandManager,
  fetchCategoryContent,
  fetchMenuItems,
} from "@/services/api";
import { Article, CategoryContentResponse } from "@/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  RefreshControl,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

// Configuration: Block index that should render horizontally
const HORIZONTAL_BLOCK_INDEX = 3;

export default function NewsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentBackground = useThemeColor({}, "contentBackground");
  // Store content per tab - all tabs now use grouped blocks structure
  const [tabContent, setTabContent] = useState<{
    [key: string]: CategoryContentResponse;
  }>({});
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
      // All tabs now use category content with blocks (including Home)
      const categoryContent = await fetchCategoryContent(
        menuItem.object_id.toString()
      );
      setTabContent((prev) => ({ ...prev, [tabKey]: categoryContent }));
    } catch (err) {
      console.error(`Error loading content for tab ${menuItem.title}:`, err);
      // Set empty category content on error
      setTabContent((prev) => ({
        ...prev,
        [tabKey]: {
          categoryInfo: { id: 0, name: "", description: "", slug: "" },
          blocks: [],
        },
      }));
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
      // All tabs now use category content with blocks
      const categoryContent = await fetchCategoryContent(
        menuItem.object_id.toString()
      );
      setTabContent((prev) => ({ ...prev, [tabKey]: categoryContent }));
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

    if (!tabContent[tabKey] && !tabLoadingStates[tabKey]) {
      await loadTabContent(index);
    }
  };

  const renderArticle = ({
    item,
    index,
    section,
  }: {
    item: Article;
    index: number;
    section: any;
  }) => {
    // Don't render items for trending block (it has custom rendering)
    if (section.isTrendingBlock) {
      return null;
    }

    // Check if this is the horizontal block - render horizontal scroll
    if (section.index === HORIZONTAL_BLOCK_INDEX) {
      return null; // Horizontal items are rendered in renderSectionFooter
    }

    // Use hero variant for the first article in each block (index 0)
    if (index === 0) {
      return <ArticleTeaserHero article={item} onPress={handleArticlePress} />;
    }
    return <ArticleTeaser article={item} onPress={handleArticlePress} />;
  };

  const renderSectionFooter = ({
    section,
  }: {
    section: {
      title: string;
      layout: string;
      description: string;
      data: Article[];
      index: number;
      isTrendingBlock?: boolean;
    };
  }) => {
    // Check if this is the trending block
    if (section.isTrendingBlock) {
      return <TrendingBlockHorizontal onArticlePress={handleArticlePress} />;
    }

    // Only render horizontal scroll for the configured block index
    if (section.index !== HORIZONTAL_BLOCK_INDEX || section.data.length === 0) {
      return null;
    }

    return (
      <FlatList
        data={section.data}
        renderItem={({ item }) => (
          <ArticleTeaserHorizontal
            article={item}
            onPress={handleArticlePress}
          />
        )}
        keyExtractor={(item, index) => `horizontal-${item.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
        snapToInterval={screenWidth * 0.7 + 12} // Card width + spacing
        decelerationRate="fast"
        snapToAlignment="start"
      />
    );
  };

  const renderSectionHeader = ({
    section,
  }: {
    section: {
      title: string;
      layout: string;
      description: string;
      index: number;
      isTrendingBlock?: boolean;
    };
  }) => {
    // Hide the first block's title
    if (section.index === 0) {
      return null;
    }

    return (
      <BlockHeader
        title={section.title}
        description={section.description}
        layout={section.layout}
      />
    );
  };

  if (loading) {
    return (
      <ThemedView
        style={[styles.container, { backgroundColor: contentBackground }]}
      >
        <GradientHeader onSearchPress={handleSearchPress} />
        <SkeletonLoader variant="list" count={8} />
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

  // Get current tab's content
  const currentMenuItemKey =
    menuItems[activeTabIndex]?.object_id.toString() || "default";
  const currentContent = tabContent[currentMenuItemKey];
  const isCurrentTabLoading = tabLoadingStates[currentMenuItemKey] || false;
  const isCurrentTabRefreshing =
    tabRefreshingStates[currentMenuItemKey] || false;

  // All tabs now use CategoryContentResponse with blocks
  const isCategoryContent =
    currentContent &&
    typeof currentContent === "object" &&
    "blocks" in currentContent;

  // Prepare sections for SectionList
  let sections: {
    title: string;
    layout: string;
    description: string;
    data: Article[];
    index: number;
    isTrendingBlock?: boolean;
  }[] = [];

  if (isCategoryContent) {
    // All tabs now have category content with blocks
    const categoryContent = currentContent as CategoryContentResponse;
    sections = categoryContent.blocks.map((block, index) => ({
      title: block.blockTitle,
      layout: block.blockLayout,
      description: block.blockDescription,
      data: block.articles,
      index,
    }));

    // Check if trending block should be injected
    const brandConfig = brandManager.getCurrentBrand();
    const trendingConfig = brandConfig.trendingBlockListView;

    if (
      trendingConfig &&
      trendingConfig.enabled &&
      trendingConfig.position !== null &&
      trendingConfig.position !== undefined
    ) {
      const position = trendingConfig.position;

      // Only inject if position is valid (within bounds or at the end)
      if (position >= 0 && position <= sections.length) {
        // Create trending block section
        const trendingSection = {
          title: "Trending",
          layout: "horizontal",
          description: "",
          data: [], // Empty data array since we render custom content
          index: position,
          isTrendingBlock: true,
        };

        // Insert at the specified position and update indices of following blocks
        sections.splice(position, 0, trendingSection);

        // Update indices for blocks after the trending block
        sections = sections.map((section, idx) => ({
          ...section,
          index: idx,
        }));
      }
    }
  }

  const hasContent =
    sections.length > 0 && sections.some((s) => s.data.length > 0);

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: contentBackground }]}
    >
      <GradientHeader onSearchPress={handleSearchPress} />
      <TopicsTabBar
        tabs={tabs}
        activeTabIndex={activeTabIndex}
        onTabChange={handleTabChange}
      />
      {isCurrentTabLoading && !hasContent ? (
        <SkeletonLoader variant="list" count={6} />
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderArticle}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
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
          stickySectionHeadersEnabled={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 45,
    backgroundColor: "transparent",
  },
  listContainer: {
    padding: 16,
  },
  horizontalScrollContent: {
    paddingRight: 16,
    paddingBottom: 16,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    padding: 20,
    backgroundColor: "transparent",
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
