import { ThemedView } from "@/components/ThemedView";
import { MagazineEdition } from "@/types";
import { Image } from "expo-image";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";

interface MagazineListItemProps {
  magazine: MagazineEdition;
  onPress: (magazine: MagazineEdition) => void;
}

export default function MagazineListItem({
  magazine,
  onPress,
}: MagazineListItemProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    onPress(magazine);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Format magazine title from ID (e.g., "2024-01-15" -> "January 15, 2024")
  const formatMagazineTitle = (id: string): string => {
    try {
      // Try to parse as date if it looks like a date format
      if (id.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(id);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      // Otherwise, just format the ID nicely
      return id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    } catch {
      return id;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Open magazine ${formatMagazineTitle(magazine.id)}`}
    >
      <ThemedView style={styles.imageContainer}>
        {imageLoading && (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#666" />
          </ThemedView>
        )}
        <Image
          source={{
            uri: imageError
              ? "https://picsum.photos/300/400?random=magazine"
              : magazine.coverUrl ||
                "https://picsum.photos/300/400?random=magazine",
          }}
          style={styles.coverImage}
          contentFit="cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 20,
    marginHorizontal: 8,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxWidth: 180,
  },
  imageContainer: {
    position: "relative",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  coverImage: {
    width: "100%",
    height: 240,
  },
  contentContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    marginBottom: 6,
    lineHeight: 20,
    textAlign: "center",
  },
  publishDate: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: "italic",
    textAlign: "center",
  },
});
