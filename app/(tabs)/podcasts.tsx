import GradientHeader from "@/components/GradientHeader";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useAudio } from "@/contexts/AudioContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";
import { fetchPodcastsByBrand } from "@/services/podcast";
import { PodcastCategory, PodcastEpisode } from "@/types";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function PodcastsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const { playEpisode } = useAudio();
  const { features, brandConfig } = useBrandConfig();
  const [categories, setCategories] = useState<PodcastCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!features?.enablePodcasts) {
      router.replace("/(tabs)/news");
    }
  }, [features]);

  useEffect(() => {
    loadPodcasts();
  }, [brandConfig]);

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Brand brandConfig:", brandConfig?.shortcode);
      console.log("Podcast feeds:", brandConfig?.podcastFeeds);
      console.log("Number of feeds:", brandConfig?.podcastFeeds?.length);

      // Check if brand has podcast feeds brandConfigured
      if (brandConfig?.podcastFeeds && brandConfig.podcastFeeds.length > 0) {
        console.log(
          `Loading podcasts from ${brandConfig.podcastFeeds.length} RSS feeds...`
        );
        const fetchedCategories = await fetchPodcastsByBrand(
          brandConfig.podcastFeeds
        );

        console.log(`Fetched ${fetchedCategories.length} categories`);

        if (fetchedCategories.length === 0) {
          setError("No podcast episodes available");
        }

        setCategories(fetchedCategories);
      } else {
        // No feeds brandConfigured - show empty state
        console.log(
          "No podcast feeds brandConfigured for brand:",
          brandConfig?.shortcode
        );
        setCategories([]);
        setError("No podcast feeds configured for this brand");
      }
    } catch (err) {
      console.error("Error loading podcasts:", err);
      setError("Failed to load podcasts. Please try again.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  if (!features?.enablePodcasts) {
    return null;
  }

  const isSingleFeed = categories.length === 1;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <GradientHeader onSearchPress={() => router.push("/search")} />
        <SkeletonLoader
          variant={
            brandConfig?.podcastFeeds && brandConfig.podcastFeeds.length === 1
              ? "podcast-vertical"
              : "podcast-horizontal"
          }
          count={brandConfig?.podcastFeeds?.length || 4}
        />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <GradientHeader onSearchPress={() => router.push("/search")} />
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          {brandConfig?.podcastFeeds && brandConfig.podcastFeeds.length > 0 && (
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: Colors[colorScheme].tabIconSelected },
              ]}
              onPress={loadPodcasts}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>
    );
  }

  if (categories.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <GradientHeader onSearchPress={() => router.push("/search")} />
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            No podcast episodes available
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const handlePodcastPress = (episode: PodcastEpisode) => {
    playEpisode(episode);
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  // Horizontal card for multiple feeds
  const renderHorizontalPodcastCard = ({ item }: { item: PodcastEpisode }) => (
    <TouchableOpacity
      style={[styles.podcastCard, { backgroundColor: "transparent" }]}
      onPress={() => handlePodcastPress(item)}
    >
      <Image source={{ uri: item.coverUrl }} style={styles.podcastCover} />
      <ThemedView
        style={[styles.podcastInfo, { backgroundColor: "transparent" }]}
      >
        <ThemedText style={styles.podcastTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.podcastDuration}>{item.duration}</ThemedText>
        <ThemedText style={styles.podcastDate}>{item.publishDate}</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  // Vertical card for single feed
  const renderVerticalPodcastCard = ({ item }: { item: PodcastEpisode }) => {
    return (
      <TouchableOpacity
        style={[
          styles.verticalPodcastCard,
          { backgroundColor: Colors[colorScheme].contentBackground },
        ]}
        onPress={() => handlePodcastPress(item)}
      >
        <Image
          source={{ uri: item.coverUrl }}
          style={styles.verticalPodcastCover}
          contentFit="cover"
          transition={200}
        />
        <ThemedView
          style={[
            styles.verticalPodcastInfo,
            { backgroundColor: "transparent" },
          ]}
        >
          <ThemedText style={styles.verticalPodcastTitle} numberOfLines={2}>
            {item.title}
          </ThemedText>
          <ThemedText
            style={styles.verticalPodcastDescription}
            numberOfLines={2}
          >
            {item.description}
          </ThemedText>
          <ThemedView
            style={[
              styles.verticalPodcastMeta,
              { backgroundColor: "transparent" },
            ]}
          >
            <ThemedText style={styles.podcastDuration}>
              {item.duration}
            </ThemedText>
            <ThemedText style={styles.podcastDate}>
              {" "}
              • {item.publishDate}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>
    );
  };

  const renderCategory = (category: any) => {
    console.log(
      "Rendering category:",
      category.name,
      "Episodes:",
      category.episodes.length,
      "Single feed:",
      isSingleFeed
    );
    return (
      <ThemedView
        key={category.id}
        style={[
          styles.categoryContainer,
          { backgroundColor: Colors[colorScheme].articleListBackground },
        ]}
      >
        <ThemedText type="subtitle" style={styles.categoryTitle}>
          {category.name}
        </ThemedText>
        {isSingleFeed ? (
          // For single feed, render episodes directly without FlatList
          <ThemedView
            style={[
              styles.verticalPodcastList,
              { backgroundColor: "transparent" },
            ]}
          >
            {category.episodes.map((episode: PodcastEpisode) => (
              <React.Fragment key={episode.id}>
                {renderVerticalPodcastCard({ item: episode })}
              </React.Fragment>
            ))}
          </ThemedView>
        ) : (
          // For multiple feeds, use horizontal FlatList
          <FlatList
            data={category.episodes}
            renderItem={renderHorizontalPodcastCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.podcastList}
          />
        )}
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <GradientHeader onSearchPress={handleSearchPress} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: Colors[colorScheme].articleListBackground },
        ]}
        style={{ backgroundColor: Colors[colorScheme].articleListBackground }}
      >
        {categories.map(renderCategory)}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  screenTitle: {
    marginBottom: 24,
  },
  categoryContainer: {
    marginBottom: 32,
  },
  categoryTitle: {
    marginBottom: 16,
    marginLeft: 4,
  },
  podcastList: {
    paddingLeft: 4,
  },
  podcastCard: {
    width: 160,
    marginRight: 16,
  },
  podcastCover: {
    width: 160,
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },
  podcastInfo: {
    paddingHorizontal: 4,
  },
  podcastTitle: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 18,
  },
  podcastDuration: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  podcastDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  verticalPodcastList: {
    gap: 12,
  },
  verticalPodcastCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verticalPodcastCover: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  verticalPodcastInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  verticalPodcastTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 22,
  },
  verticalPodcastDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: 8,
  },
  verticalPodcastMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
