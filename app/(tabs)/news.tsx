import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { newsArticles } from "@/data/mockData";
import { Article } from "@/types";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function NewsScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleArticlePress = (article: Article) => {
    router.push(`/article/${article.id}`);
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

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={newsArticles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
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
});
