import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { featuredArticles, newsArticles } from "@/data/mockData";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Find the article in both featured and news articles
  const allArticles = [...featuredArticles, ...newsArticles];
  const article = allArticles.find((a) => a.id === id);

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="title">Article not found</ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.backButtonTop}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>

        <Image source={{ uri: article.imageUrl }} style={styles.headerImage} />

        <ThemedView style={styles.contentContainer}>
          <ThemedView style={styles.metaContainer}>
            <ThemedText style={styles.category}>{article.category}</ThemedText>
            <ThemedText style={styles.timestamp}>
              {article.timestamp}
            </ThemedText>
          </ThemedView>

          <ThemedText type="title" style={styles.title}>
            {article.title}
          </ThemedText>

          {article.subtitle && (
            <ThemedText type="subtitle" style={styles.subtitle}>
              {article.subtitle}
            </ThemedText>
          )}

          <ThemedText style={styles.leadText}>{article.leadText}</ThemedText>

          <ThemedView style={styles.divider} />

          <ThemedText style={styles.content}>{article.content}</ThemedText>

          {/* Add more content paragraphs for a more realistic article */}
          <ThemedText style={styles.content}>
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </ThemedText>

          <ThemedText style={styles.content}>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
            quae ab illo inventore veritatis et quasi architecto beatae vitae
            dicta sunt explicabo.
          </ThemedText>

          <ThemedText style={styles.content}>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut
            fugit, sed quia consequuntur magni dolores eos qui ratione
            voluptatem sequi nesciunt.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  backButtonTop: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },
  headerImage: {
    width: screenWidth,
    height: 250,
  },
  contentContainer: {
    padding: 20,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.7,
    textTransform: "uppercase",
  },
  timestamp: {
    fontSize: 14,
    opacity: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    opacity: 0.8,
    lineHeight: 24,
  },
  leadText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
    lineHeight: 24,
    opacity: 0.9,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.8,
  },
});
