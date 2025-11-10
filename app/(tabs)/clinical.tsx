import ArticleTeaser from "@/components/ArticleTeaser";
import ArticleTeaserHero from "@/components/ArticleTeaserHero";
import ArticleTeaserHorizontal from "@/components/ArticleTeaserHorizontal";
import { BlockHeader } from "@/components/BlockHeader";
import { DisplayAd } from "@/components/DisplayAd";
import GradientHeader from "@/components/GradientHeader";
import { NativeAdListItem } from "@/components/NativeAdListItem";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { getCenteredContentStyle } from "@/constants/Layout";
import { useThemeColor } from "@/hooks/useThemeColor";
import { analyticsService } from "@/services/analytics";
import { brandManager, fetchCategoryContent } from "@/services/api";
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

  // Track screen view when tab is focused
  useFocusEffect(
    useCallback(() => {
      analyticsService.logScreenView("Clinical", "ClinicalScreen");
    }, [])
  );

  const handleArticlePress = (article: Article) => {
    router.push(`/article/${article.id}`);
  };

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
    };
  }) => {
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
      totalSections?: number;
    };
  }) => {
    // Hide the first block's title
    if (section.index === 0) {
      return null;
    }

    // Use the totalSections passed from the section data
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

  // Prepare sections for SectionList
  let sections: {
    title: string;
    layout: string;
    description: string;
    data: Article[];
    index: number;
    totalSections?: number;
  }[] = [];

  if (categoryContent) {
    sections = categoryContent.blocks.map((block, index) => ({
      title: block.blockTitle,
      layout: block.blockLayout,
      description: block.blockDescription,
      data: block.articles,
      index,
    }));

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
