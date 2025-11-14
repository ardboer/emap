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
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import TopicsTabBar from "@/components/TopicsTabBar";
import TrendingBlockHorizontal from "@/components/TrendingBlockHorizontal";
import { Colors } from "@/constants/Colors";
import { getCenteredContentStyle } from "@/constants/Layout";
import { useThemeColor } from "@/hooks/useThemeColor";
import { analyticsService } from "@/services/analytics";
import {
  brandManager,
  fetchCategoryContent,
  fetchMenuItems,
} from "@/services/api";
import { formatArticleDetailDate } from "@/services/api/utils/formatters";
import { displayAdManager } from "@/services/displayAdManager";
import { nativeAdVariantManager } from "@/services/nativeAdVariantManager";
import {
  Article,
  CategoryContentResponse,
  HierarchicalMenuItem,
  MenuState,
} from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  RefreshControl,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

// AsyncStorage key for persisting selected child topics
const SELECTED_TOPICS_KEY = "@news_selected_topics";

const { width: screenWidth } = Dimensions.get("window");

export default function NewsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [menuItems, setMenuItems] = useState<HierarchicalMenuItem[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const contentBackground = useThemeColor({}, "contentBackground");

  // Menu state for hierarchical navigation
  const [menuState, setMenuState] = useState<MenuState>({
    expandedParentId: null,
    selectedChildId: null,
    selectedParentId: null,
  });

  // Refs to track if we've already refreshed on this focus
  const hasRefreshedOnFocus = useRef(false);

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
  // Helper functions for persisting selected topics
  const loadSelectedTopics = async (): Promise<Record<string, string>> => {
    try {
      const stored = await AsyncStorage.getItem(SELECTED_TOPICS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error loading selected topics:", error);
      return {};
    }
  };

  const saveSelectedTopic = async (parentId: string, childId: string) => {
    try {
      const stored = await loadSelectedTopics();
      stored[parentId] = childId;
      await AsyncStorage.setItem(SELECTED_TOPICS_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error("Error saving selected topic:", error);
    }
  };

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

  // Track screen view and refresh active category when tab is focused
  useFocusEffect(
    useCallback(() => {
      analyticsService.logScreenView("News", "NewsScreen");

      // Only refresh once per focus event
      if (!hasRefreshedOnFocus.current && menuItems.length > 0 && !loading) {
        const menuItem = menuItems[activeTabIndex];
        if (menuItem) {
          const tabKey = menuItem.object_id.toString();
          const isRefreshing = tabRefreshingStates[tabKey];

          // Only refresh if this tab already has content loaded and not currently refreshing
          if (tabContent[tabKey] && !isRefreshing) {
            hasRefreshedOnFocus.current = true;
            fetchCategoryContent(menuItem.object_id.toString())
              .then((categoryContent) => {
                setTabContent((prev) => ({
                  ...prev,
                  [tabKey]: categoryContent,
                }));
              })
              .catch((err) => {
                console.error(
                  `Error refreshing content for tab ${menuItem.title} on focus:`,
                  err
                );
                // Don't show error to user for background refresh
              });
          }
        }
      }

      // Reset the flag when the screen loses focus
      return () => {
        hasRefreshedOnFocus.current = false;
      };
    }, [])
  );

  const handleArticlePress = useCallback((article: Article) => {
    // Pre-format the date to avoid flickering
    const formattedDate = article.publishDate
      ? formatArticleDetailDate(article.publishDate).toUpperCase()
      : article.timestamp?.toUpperCase() || "RECENTLY";

    router.push({
      pathname: `/article/${article.id}` as any,
      params: {
        previewTitle: article.title,
        previewCategory: article.category || "",
        previewDate: formattedDate,
      },
    });
  }, []);

  const handleSearchPress = () => {
    router.push("/search");
  };

  const handleParentTabChange = async (
    index: number,
    item: HierarchicalMenuItem
  ) => {
    setActiveTabIndex(index);

    // Check if this is a favorite topic (ID starts with 9)
    const isFavoriteTopic = item.ID.toString().startsWith("9");

    if (isFavoriteTopic) {
      // This is a favorite topic - treat it like a selected child
      // Extract the original ID by removing the "9" prefix
      const originalId = item.ID.toString().substring(1);

      // Find the parent of this favorite topic
      const parentItem = menuItems.find((parent) =>
        parent.children?.some((child) => child.ID.toString() === originalId)
      );

      if (parentItem) {
        const parentId = parentItem.ID.toString();

        // Update menu state to show the second bar
        setMenuState((prev) => ({
          ...prev,
          expandedParentId: parentId,
          selectedChildId: originalId,
          selectedParentId: parentId,
        }));

        // Load content for this favorite topic
        const tabKey = item.object_id.toString();
        setTabLoadingStates((prev) => ({ ...prev, [tabKey]: true }));

        try {
          const categoryContent = await fetchCategoryContent(
            item.object_id.toString()
          );
          setTabContent((prev) => ({ ...prev, [tabKey]: categoryContent }));
        } catch (err) {
          console.error(
            `Error loading favorite topic content for ${item.title}:`,
            err
          );
        } finally {
          setTabLoadingStates((prev) => ({ ...prev, [tabKey]: false }));
        }
      }
    } else if (item.hasChildren) {
      // Load persisted topics from AsyncStorage
      const persistedTopics = await loadSelectedTopics();
      const parentId = item.ID.toString();

      // Determine which child to load:
      // 1. Check AsyncStorage for persisted selection
      // 2. If this parent was previously selected in current session, use that
      // 3. Otherwise, use the first child as default
      const persistedChildId = persistedTopics[parentId];
      const wasThisParentSelected = menuState.selectedParentId === parentId;
      const sessionChildId = wasThisParentSelected
        ? menuState.selectedChildId
        : null;

      const firstChild = item.children?.[0];

      // Priority: persisted > session > first child
      let childToLoad = firstChild;
      if (persistedChildId) {
        childToLoad =
          item.children?.find((c) => c.ID.toString() === persistedChildId) ||
          firstChild;
      } else if (sessionChildId) {
        childToLoad =
          item.children?.find((c) => c.ID.toString() === sessionChildId) ||
          firstChild;
      }

      // Update menu state with the selected child
      const newChildId = childToLoad?.ID.toString() || null;
      setMenuState((prev) => ({
        ...prev,
        expandedParentId: parentId,
        selectedChildId: newChildId,
        selectedParentId: parentId,
      }));

      // Always load the selected child's content (persisted, session, or first)
      if (childToLoad) {
        const tabKey = childToLoad.object_id.toString();
        setTabLoadingStates((prev) => ({ ...prev, [tabKey]: true }));

        try {
          const categoryContent = await fetchCategoryContent(
            childToLoad.object_id.toString()
          );
          setTabContent((prev) => ({ ...prev, [tabKey]: categoryContent }));
        } catch (err) {
          console.error(
            `Error loading child content for ${childToLoad.title}:`,
            err
          );
        } finally {
          setTabLoadingStates((prev) => ({ ...prev, [tabKey]: false }));
        }
      }
    } else {
      // Parent without children - fetch its content
      setMenuState((prev) => ({
        ...prev,
        expandedParentId: null,
        selectedChildId: null,
        selectedParentId: null,
      }));

      // Load content for this tab if not already loaded
      const tabKey = item.object_id.toString();

      if (!tabContent[tabKey]) {
        await loadTabContent(index);
      } else {
        // Refresh content silently when switching to a tab that already has content
        const isRefreshing = tabRefreshingStates[tabKey];
        if (!isRefreshing) {
          fetchCategoryContent(item.object_id.toString())
            .then((categoryContent) => {
              setTabContent((prev) => ({ ...prev, [tabKey]: categoryContent }));
            })
            .catch((err) => {
              console.error(
                `Error refreshing content for tab ${item.title}:`,
                err
              );
              // Don't show error to user for background refresh
            });
        }
      }
    }
  };

  const handleChildTabChange = async (
    childItem: HierarchicalMenuItem,
    parentIndex: number
  ) => {
    const childId = childItem.ID.toString();
    const parentId = childItem.parent;

    // Update menu state
    setMenuState((prev) => ({
      ...prev,
      selectedChildId: childId,
      selectedParentId: parentId,
    }));

    // Persist the selection to AsyncStorage
    await saveSelectedTopic(parentId, childId);

    // Fetch category content for the child
    const tabKey = childItem.object_id.toString();

    setTabLoadingStates((prev) => ({ ...prev, [tabKey]: true }));

    try {
      const categoryContent = await fetchCategoryContent(
        childItem.object_id.toString()
      );
      setTabContent((prev) => ({ ...prev, [tabKey]: categoryContent }));
    } catch (err) {
      console.error(`Error loading child content:`, err);
    } finally {
      setTabLoadingStates((prev) => ({ ...prev, [tabKey]: false }));
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
        nestedScrollEnabled={true}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        initialNumToRender={2}
        windowSize={5}
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
      totalSections?: number;
    };
  }) => {
    // Hide the first block's title
    if (section.index === 0) {
      return null;
    }

    // Use the totalSections passed from prepareSectionsForTab
    // This includes injected trending/recommended blocks
    const totalSections = section.totalSections || 0;

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
    // Use the current content key (either parent or selected child)
    const menuItemKey = getCurrentContentKey();
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
      totalSections?: number;
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

      // Check if recommended block should be injected (inject first to appear before trending)
      const brandConfig = brandManager.getCurrentBrand();
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
            title: "Recommended for you",
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

      // Check if trending block should be injected (inject second to appear after recommended)
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

      // Add totalSections to each section for display ad calculation
      const totalSections = sections.length;
      sections = sections.map((section) => ({
        ...section,
        totalSections,
      }));
    }

    return sections;
  };

  // Get the current content key (either parent or selected child)
  const getCurrentContentKey = (): string => {
    if (menuState.selectedChildId) {
      // Find the child item to get its object_id
      const parent = menuItems.find(
        (item) => item.ID.toString() === menuState.selectedParentId
      );
      const child = parent?.children?.find(
        (c) => c.ID.toString() === menuState.selectedChildId
      );
      return (
        child?.object_id.toString() ||
        menuItems[activeTabIndex]?.object_id.toString() ||
        "default"
      );
    }
    return menuItems[activeTabIndex]?.object_id.toString() || "default";
  };

  // Render content for current selection (parent or child)
  const renderTabContent = (tabIndex: number) => {
    const menuItemKey = getCurrentContentKey();
    const isTabLoading = tabLoadingStates[menuItemKey] || false;
    const isTabRefreshing = tabRefreshingStates[menuItemKey] || false;
    const hasTabContent = !!tabContent[menuItemKey];
    const sections = prepareSectionsForTab(tabIndex);
    const hasContent =
      sections.length > 0 && sections.some((s) => s.data.length > 0);

    // Show skeleton if loading OR if we haven't loaded content yet
    if ((isTabLoading || !hasTabContent) && !hasContent) {
      return <SkeletonLoader variant="list" count={6} />;
    }

    return (
      <SectionList
        sections={sections}
        renderItem={renderArticle}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        keyExtractor={(item, index) => item.id + index.toString()}
        getItemLayout={(data, index) => ({
          length: 130,
          offset: 130 * index,
          index,
        })}
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
          hasTabContent && !isTabLoading ? (
            <ThemedView style={styles.centerContent}>
              <ThemedText style={styles.emptyText}>
                No articles available
              </ThemedText>
            </ThemedView>
          ) : null
        }
        stickySectionHeadersEnabled={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={100}
        initialNumToRender={10}
        windowSize={5}
        // Additional optimizations for smooth scrolling
        onEndReachedThreshold={0.5}
        disableVirtualization={false}
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
        tabs={menuItems}
        activeParentIndex={activeTabIndex}
        activeChildId={menuState.selectedChildId}
        expandedParentId={menuState.expandedParentId}
        onParentTabChange={handleParentTabChange}
        onChildTabChange={handleChildTabChange}
      />
      {renderTabContent(activeTabIndex)}
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
