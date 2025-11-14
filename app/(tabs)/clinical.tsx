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
import TrendingBlockHorizontal from "@/components/TrendingBlockHorizontal";
import { Colors } from "@/constants/Colors";
import { getCenteredContentStyle } from "@/constants/Layout";
import { useThemeColor } from "@/hooks/useThemeColor";
import { analyticsService } from "@/services/analytics";
import { brandManager, fetchCategoryContent } from "@/services/api";
import { formatArticleDetailDate } from "@/services/api/utils/formatters";
import { displayAdManager } from "@/services/displayAdManager";
import { nativeAdVariantManager } from "@/services/nativeAdVariantManager";
import { Article, CategoryContentResponse } from "@/types";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

// Clinical category ID
const CLINICAL_CATEGORY_ID = "161366";

export default function ClinicalScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [categoryContent, setCategoryContent] =
    useState<CategoryContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const loadClinicalContent = async () => {
    try {
      setError(null);
      const content = await fetchCategoryContent(CLINICAL_CATEGORY_ID);
      setCategoryContent(content);
    } catch (err) {
      setError("Failed to load clinical articles");
      console.error("Error loading clinical content:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setError(null);
      const content = await fetchCategoryContent(CLINICAL_CATEGORY_ID);
      setCategoryContent(content);
    } catch (err) {
      setError("Failed to refresh clinical articles");
      console.error("Error refreshing clinical content:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClinicalContent();
  }, []);

  // Track screen view and refresh data when tab is focused
  useFocusEffect(
    useCallback(() => {
      analyticsService.logScreenView("Clinical", "ClinicalScreen");

      // Refresh clinical content silently when coming into view
      // Only if we already have data (not initial load)
      if (categoryContent && !loading && !refreshing) {
        fetchCategoryContent(CLINICAL_CATEGORY_ID)
          .then((content) => {
            setCategoryContent(content);
            setError(null);
          })
          .catch((err) => {
            console.error("Error refreshing clinical content on focus:", err);
            // Don't show error to user for background refresh
          });
      }
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

  const renderArticle = ({
    item,
    index,
    section,
  }: {
    item: Article;
    index: number;
    section: any;
  }) => {
    // Don't render items for trending or recommended blocks (they have custom rendering)
    if (section.isTrendingBlock || section.isRecommendedBlock) {
      return null;
    }

    // Check if this is the horizontal block - render horizontal scroll
    if (section.index === HORIZONTAL_BLOCK_INDEX) {
      return null; // Horizontal items are rendered in renderSectionFooter
    }

    // Check if this position should show a native ad
    if (
      nativeAdVariantManager.shouldShowAdAtPosition(
        "clinical",
        index,
        section.index
      )
    ) {
      return (
        <NativeAdListItem
          position={index}
          viewType="clinical"
          blockIndex={section.index}
          onAdLoaded={(pos) =>
            console.log(`Native ad loaded at position ${pos} in clinical`)
          }
          onAdFailed={(pos) =>
            console.log(`Native ad failed at position ${pos} in clinical`)
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
      isRecommendedBlock?: boolean;
      data: Article[];
      totalSections?: number;
    };
  }) => {
    // Hide the first block's title
    if (section.index === 0) {
      return null;
    }

    // Use the totalSections passed from prepareSections
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
        <GradientHeader
          onSearchPress={handleSearchPress}
          showUserIcon={true}
          onUserPress={() => setSettingsDrawerVisible(true)}
        />
        <SkeletonLoader variant="list" count={8} />
      </ThemedView>
    );
  }

  if (error && !categoryContent) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <GradientHeader
          onSearchPress={handleSearchPress}
          showUserIcon={true}
          onUserPress={() => setSettingsDrawerVisible(true)}
        />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadClinicalContent}
        >
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Prepare sections for SectionList with trending and recommended blocks
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

  if (categoryContent) {
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

  const hasContent =
    sections.length > 0 && sections.some((s) => s.data.length > 0);

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: contentBackground }]}
    >
      <GradientHeader
        onSearchPress={handleSearchPress}
        showUserIcon={true}
        onUserPress={() => setSettingsDrawerVisible(true)}
      />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContainer,
          { backgroundColor: Colors[colorScheme].articleListBackground },
        ]}
        ListEmptyComponent={
          !loading && !hasContent ? (
            <ThemedView style={styles.centerContent}>
              <ThemedText style={styles.emptyText}>
                No clinical articles available
              </ThemedText>
            </ThemedView>
          ) : null
        }
        stickySectionHeadersEnabled={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={100}
        initialNumToRender={5}
        windowSize={5}
        // Additional optimizations for smooth scrolling
        onEndReachedThreshold={0.5}
        disableVirtualization={false}
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
