import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAudio } from "@/contexts/AudioContext";
import { podcastCategories } from "@/data/mockData";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { PodcastEpisode } from "@/types";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function PodcastsScreen() {
  const { playEpisode } = useAudio();
  const { features } = useBrandConfig();

  useEffect(() => {
    if (!features?.enablePodcasts) {
      router.replace("/(tabs)/news");
    }
  }, [features]);

  if (!features?.enablePodcasts) {
    return null;
  }

  const handlePodcastPress = (episode: PodcastEpisode) => {
    playEpisode(episode);
  };

  const renderPodcastCard = ({ item }: { item: PodcastEpisode }) => (
    <TouchableOpacity
      style={styles.podcastCard}
      onPress={() => handlePodcastPress(item)}
    >
      <Image source={{ uri: item.coverUrl }} style={styles.podcastCover} />
      <ThemedView style={styles.podcastInfo}>
        <ThemedText style={styles.podcastTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.podcastDuration}>{item.duration}</ThemedText>
        <ThemedText style={styles.podcastDate}>{item.publishDate}</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  const renderCategory = (category: any) => (
    <ThemedView key={category.id} style={styles.categoryContainer}>
      <ThemedText type="subtitle" style={styles.categoryTitle}>
        {category.name}
      </ThemedText>
      <FlatList
        data={category.episodes}
        renderItem={renderPodcastCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.podcastList}
      />
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {podcastCategories.map(renderCategory)}
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
    fontWeight: "600",
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
});
