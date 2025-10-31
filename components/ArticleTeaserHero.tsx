import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Article } from "@/types";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface ArticleTeaserHeroProps {
  article: Article;
  onPress?: (article: Article) => void;
}

export default function ArticleTeaserHero({
  article,
  onPress,
}: ArticleTeaserHeroProps) {
  const colorScheme = useColorScheme() ?? "light";

  const handlePress = () => {
    if (onPress) {
      onPress(article);
    } else {
      console.log("opening article.id", article.id);
      router.push(`/article/${article.id}`);
    }
  };

  return (
    <TouchableOpacity style={styles.heroContainer} onPress={handlePress}>
      <ThemedView style={styles.imageContainer}>
        <Image
          source={{ uri: article.imageUrl }}
          style={styles.heroImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0, 0, 0, 0.8)"]}
          style={styles.gradient}
        >
          <ThemedView style={styles.contentContainer}>
            <ThemedText type="defaultSemiBold" style={styles.title}>
              {article.title}
            </ThemedText>
          </ThemedView>
        </LinearGradient>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    width: "100%",
    marginBottom: 16,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 3 / 2,
    backgroundColor: "transparent",
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
  },
  contentContainer: {
    padding: 16,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
