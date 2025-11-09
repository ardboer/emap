import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface SearchResult {
  id: number;
  title: string;
  url: string;
  type: string;
  subtype: string;
}

interface SearchTeaserProps {
  result: SearchResult;
  onPress?: (result: SearchResult) => void;
}

export default function SearchTeaser({ result, onPress }: SearchTeaserProps) {
  const { brandConfig } = useBrandConfig();
  const contentBackground = useThemeColor({}, "contentBackground");
  const primaryFont = brandConfig?.theme.fonts.primary || "System";

  const handlePress = () => {
    if (onPress) {
      onPress(result);
    } else {
      // Navigate to the article using the ID
      const articleId = result.id.toString();
      router.push(`/article/${articleId}`);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <ThemedView
        style={[styles.content, { backgroundColor: contentBackground }]}
      >
        <ThemedText
          style={[styles.title, { fontFamily: primaryFont }]}
          numberOfLines={3}
        >
          {result.title}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
});
