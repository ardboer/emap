import ArticleTeaser from "@/components/ArticleTeaser";
import ArticleTeaserHero from "@/components/ArticleTeaserHero";
import ArticleTeaserHorizontal from "@/components/ArticleTeaserHorizontal";
import { BlockHeader } from "@/components/BlockHeader";
import { DisplayAd } from "@/components/DisplayAd";
import GradientHeader from "@/components/GradientHeader";
import { NativeAdListItem } from "@/components/NativeAdListItem";
import RecommendedBlockHorizontal from "@/components/RecommendedBlockHorizontal";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import SwipeableTabView from "@/components/SwipeableTabView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import TopicsTabBar from "@/components/TopicsTabBar";
import TrendingBlockHorizontal from "@/components/TrendingBlockHorizontal";
import { Colors } from "@/constants/Colors";
import { getCenteredContentStyle } from "@/constants/Layout";
import { useThemeColor } from "@/hooks/useThemeColor";
import {
  brandManager,
  fetchCategoryContent,
  fetchMenuItems,
} from "@/services/api";
import { displayAdManager } from "@/services/displayAdManager";
import { nativeAdVariantManager } from "@/services/nativeAdVariantManager";
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

export default function NewsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const contentBackground = useThemeColor({}, "contentBackground");

  // Initialize display ad manager and native ad variant manager with brand config
  useEffect(() => {
    const brandConfig = brandManager.getCurrentBrand();
    if (brandConfig.displayAds) {
      displayAdManager.initialize(brandConfig.displayAds);
    }
    // Initialize native ad variant manager
    if (!nativeAdVariantManager.isInitialized()) {
      nativeAdVariantManager.initialize();
    }
  }, []);
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
    router.push(`/article/${article.id}?source=news`);
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

    // Check if this block should be horizontal based on config
    const brandConfig = brandManager.getCurrentBrand();
    const horizontalBlocksStr = brandConfig.layout?.horizontalBlocks || "";
    const horizontalBlockIndices = horizontalBlocksStr
      .split(",")
      .map((s: string) => parseInt(s.trim()))
      .filter((n: number) => !isNaN(n));

    // Use originalIndex to check against config (before trending/recommended injection)
    const checkIndex =
      section.originalIndex !== undefined
        ? section.originalIndex
        : section.index;
    if (horizontalBlockIndices.includes(checkIndex)) {
      return null; // Horizontal items are rendered in renderSectionFooter
    }

    // Check if this position should show a native ad
    const blockIndex =
      section.originalIndex !== undefined
        ? section.originalIndex
        : section.index;
    if (
      nativeAdVariantManager.shouldShowAdAtPosition("news", index, blockIndex)
    ) {
      return (
        <NativeAdListItem
          position={index}
          viewType="news"
          blockIndex={blockIndex}
          onAdLoaded={(pos) =>
            console.log(
              `Native ad loaded at position ${pos} in block ${blockIndex}`
            )
          }
          onAdFailed={(pos) =>
            console.log(
              `Native ad failed at position ${pos} in block ${blockIndex}`
            )
          }
        />
      );
    }

    // Use hero variant for the first article in each block (index 0)
    if (index === 0) {
      return (
        <ArticleTeaserHero
          article={item}
          onPress={handleArticlePress}
          source="news"
        />
      );
    }
    return (
      <ArticleTeaser
        article={item}
        onPress={handleArticlePress}
        source="news"
      />
    );
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
      originalIndex?: number;
      isTrendingBlock?: boolean;
      isRecommendedBlock?: boolean;
    };
  }) => {
    // Check if this is the trending block
    if (section.isTrendingBlock) {
      return <TrendingBlockHorizontal onArticlePress={handleArticlePress} />;
    }

    // Check if this is the recommended block
    if (section.isRecommendedBlock) {
      return <RecommendedBlockHorizontal onArticlePress={handleArticlePress} />;
    }

    // Check if this block should be horizontal based on config
    const brandConfig = brandManager.getCurrentBrand();
    const horizontalBlocksStr = brandConfig.layout?.horizontalBlocks || "";
    const horizontalBlockIndices = horizontalBlocksStr
      .split(",")
      .map((s: string) => parseInt(s.trim()))
      .filter((n: number) => !isNaN(n));

    // Use originalIndex to check against config (before trending/recommended injection)
    const checkIndex =
      section.originalIndex !== undefined
        ? section.originalIndex
        : section.index;

    // Only render horizontal scroll for configured block indices
    if (
      !horizontalBlockIndices.includes(checkIndex) ||
      section.data.length === 0
    ) {
      return null;
    }

    return (
      <FlatList
        data={section.data}
        renderItem={({ item }) => (
          <ArticleTeaserHorizontal
            article={item}
            source="news"
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
      data: Article[];
    };
  }) => {
    // Hide the first block's title
    if (section.index === 0) {
      return null;
    }

    // Get total sections count from the section's parent list
    // We'll pass this through the section data structure
    const totalSections = section.data?.length || 0;

    // Check if we should show an ad before this block
    const shouldShowAd = displayAdManager.shouldShowListAd(
      section.index,
      totalSections
    );

    return (
      <>
        {shouldShowAd && (
          <DisplayAd
            context="list_view"
            size={shouldShowAd.size}
            onAdLoaded={() =>
              console.log(`List ad loaded at block ${section.index}`)
            }
          />
        )}
        <BlockHeader
          title={section.title}
          description={section.description}
          layout={section.layout}
        />
      </>
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

  // Helper function to prepare sections for a given tab index
  const prepareSectionsForTab = (tabIndex: number) => {
    const menuItemKey = menuItems[tabIndex]?.object_id.toString() || "default";
    const content = tabContent[menuItemKey];

    // All tabs now use CategoryContentResponse with blocks
    const isCategoryContent =
      content && typeof content === "object" && "blocks" in content;

    // Prepare sections for SectionList
    let sections: {
      title: string;
      layout: string;
      description: string;
      data: Article[];
      index: number;
      originalIndex?: number;
      isTrendingBlock?: boolean;
      isRecommendedBlock?: boolean;
    }[] = [];

    if (isCategoryContent) {
      // All tabs now have category content with blocks
      const categoryContent = content as CategoryContentResponse;
      sections = categoryContent.blocks.map((block, index) => ({
        title: block.blockTitle,
        layout: block.blockLayout,
        description: block.blockDescription,
        data: block.articles,
        index,
        originalIndex: index, // Store original index before trending/recommended injection
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

          // Update indices for blocks after the trending block (but keep originalIndex)
          sections = sections.map((section, idx) => ({
            ...section,
            index: idx,
          }));
        }
      }

      // Check if recommended block should be injected
      const recommendedConfig = brandConfig.recommendedBlockListView;

      if (
        recommendedConfig &&
        recommendedConfig.enabled &&
        recommendedConfig.position !== null &&
        recommendedConfig.position !== undefined
      ) {
        const position = recommendedConfig.position;

        // Only inject if position is valid (within bounds or at the end)
        if (position >= 0 && position <= sections.length) {
          // Create recommended block section
          const recommendedSection = {
            title: "Recommended",
            layout: "horizontal",
            description: "",
            data: [], // Empty data array since we render custom content
            index: position,
            isRecommendedBlock: true,
          };

          // Insert at the specified position and update indices of following blocks
          sections.splice(position, 0, recommendedSection);

          // Update indices for blocks after the recommended block (but keep originalIndex)
          sections = sections.map((section, idx) => ({
            ...section,
            index: idx,
          }));
        }
      }
    }

    return sections;
  };

  // Render content for a specific tab
  const renderTabContent = (tabIndex: number) => {
    const menuItemKey = menuItems[tabIndex]?.object_id.toString() || "default";
    const isTabLoading = tabLoadingStates[menuItemKey] || false;
    const isTabRefreshing = tabRefreshingStates[menuItemKey] || false;
    const sections = prepareSectionsForTab(tabIndex);
    const hasContent =
      sections.length > 0 && sections.some((s) => s.data.length > 0);

    if (isTabLoading && !hasContent) {
      return <SkeletonLoader variant="list" count={6} />;
    }

    return (
      <SectionList
        sections={sections}
        renderItem={renderArticle}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        keyExtractor={(item, index) => item.id + index.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isTabRefreshing}
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
        stickySectionHeadersEnabled={false}
      />
    );
  };

  // Create tabs from menu items
  const tabs = menuItems.map((item, index) => ({
    id: item.object_id.toString(),
    title: item.title,
    content: renderTabContent(index),
  }));

  // If no menu items, show default tab
  if (tabs.length === 0) {
    tabs.push({
      id: "default",
      title: "News",
      content: renderTabContent(0),
    });
  }

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: contentBackground }]}
    >
      <GradientHeader
        onSearchPress={handleSearchPress}
        showUserIcon={true}
        onUserPress={() => setSettingsDrawerVisible(true)}
      />
      <TopicsTabBar
        tabs={tabs.map((t) => ({ id: t.id, title: t.title }))}
        activeTabIndex={activeTabIndex}
        onTabChange={handleTabChange}
      />
      <SwipeableTabView
        tabs={tabs}
        activeTabIndex={activeTabIndex}
        onTabChange={handleTabChange}
      />
      <SettingsDrawer
        visible={settingsDrawerVisible}
        onClose={() => setSettingsDrawerVisible(false)}
      />
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
    ...getCenteredContentStyle(),
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
