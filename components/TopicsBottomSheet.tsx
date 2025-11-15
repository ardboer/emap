import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useFavoriteTopics } from "@/hooks/useFavoriteTopics";
import { useThemeColor } from "@/hooks/useThemeColor";
import { MenuItem } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  FlatList,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

interface TopicsBottomSheetProps {
  visible: boolean;
  topics: MenuItem[];
  selectedTopicId: string | null;
  onSelectTopic: (topic: MenuItem) => void;
  onClose: () => void;
}

export default function TopicsBottomSheet({
  visible,
  topics,
  selectedTopicId,
  onSelectTopic,
  onClose,
}: TopicsBottomSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { brandConfig } = useBrandConfig();
  const { favoriteTopicIds, toggleFavorite } = useFavoriteTopics();
  const colorScheme = useColorScheme() ?? "light";

  // Get theme colors
  const backgroundColor = useThemeColor({}, "contentBackground");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "icon");
  const activeColor = useThemeColor({}, "topicsActiveTab");
  const activeTextColor = useThemeColor({}, "topicsActiveText");

  // Get brand-specific font and primary color
  const fontFamily =
    brandConfig?.theme.fonts.primarySemiBold || "OpenSans-SemiBold";
  const brandPrimaryColor =
    brandConfig?.theme.colors.light.primary || activeColor;

  // Use same color as ArticleTeaser title
  const titleColor = Colors[colorScheme].articleTeaserTitleText;

  // Filter and sort topics: favorites first, then alphabetically
  const filteredTopics = topics
    .filter((topic) =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aIsFavorite = favoriteTopicIds.includes(a.ID.toString());
      const bIsFavorite = favoriteTopicIds.includes(b.ID.toString());

      // Favorites come first
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      // Within same category (both favorite or both not), sort alphabetically
      return a.title.localeCompare(b.title);
    });

  const handleSelectTopic = (topic: MenuItem) => {
    setSearchQuery(""); // Clear search
    onSelectTopic(topic);
    onClose();
  };

  const renderTopicItem = ({ item }: { item: MenuItem }) => {
    const isSelected = item.ID.toString() === selectedTopicId;
    const isFavorite = favoriteTopicIds.includes(item.ID.toString());

    return (
      <View style={styles.topicItemContainer}>
        <TouchableOpacity
          style={[
            styles.topicItem,
            isSelected && [
              styles.selectedTopic,
              { borderColor: brandPrimaryColor },
            ],
          ]}
          onPress={() => handleSelectTopic(item)}
          activeOpacity={0.7}
        >
          <ImageBackground
            source={{
              uri:
                item.image_url ||
                "https://via.placeholder.com/300x200/cccccc/666666?text=No+Image",
            }}
            style={styles.topicImageBackground}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
              style={styles.gradientOverlay}
            >
              <ThemedText
                style={[styles.topicText, { fontFamily }]}
                numberOfLines={2}
              >
                {item.title}
              </ThemedText>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* Star/Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.ID.toString())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.starIcon, { color: brandPrimaryColor }]}>
            {isFavorite ? "★" : "☆"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.bottomSheetContainer}>
          <ThemedView style={[styles.bottomSheet, { backgroundColor }]}>
            {/* Header */}
            <View style={styles.header}>
              <ThemedText
                style={[styles.headerTitle, { fontFamily, color: titleColor }]}
              >
                All Topics
              </ThemedText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text
                  style={[styles.closeButtonText, { color: brandPrimaryColor }]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View
              style={[
                styles.searchContainer,
                { borderColor: brandPrimaryColor },
              ]}
            >
              <TextInput
                style={[styles.searchInput, { color: titleColor, fontFamily }]}
                placeholder="Search topics..."
                placeholderTextColor={borderColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Topics Grid */}
            <FlatList
              data={filteredTopics}
              renderItem={renderTopicItem}
              keyExtractor={(item) => item.ID.toString()}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <ThemedView style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>
                    No topics found
                  </ThemedText>
                </ThemedView>
              }
            />
          </ThemedView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheetContainer: {
    height: "80%",
  },
  bottomSheet: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "300",
  },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    height: 44,
    fontSize: 16,
  },
  gridContent: {
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  topicItemContainer: {
    flex: 1,
    marginHorizontal: 4,
    position: "relative",
  },
  topicItem: {
    flex: 1,
    borderRadius: 8,
    minHeight: 120,
    overflow: "hidden",
  },
  selectedTopic: {
    borderWidth: 3,
  },
  topicImageBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    minHeight: 120,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
  },
  topicText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "left",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  favoriteButton: {
    position: "absolute",
    top: 4,
    right: 4,
    padding: 4,
    zIndex: 10,
  },
  starIcon: {
    fontSize: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
