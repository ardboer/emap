import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useFavoriteTopics } from "@/hooks/useFavoriteTopics";
import { useThemeColor } from "@/hooks/useThemeColor";
import { MenuItem } from "@/types";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  // Define snap points
  const snapPoints = useMemo(() => ["75%"], []);

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

  // Control bottom sheet visibility
  React.useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  // Filter and sort topics: favorites first, then alphabetically
  const filteredTopics = useMemo(() => {
    return topics
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
  }, [topics, searchQuery, favoriteTopicIds]);

  // Group topics into rows of 2
  const topicRows = useMemo(() => {
    const rows: MenuItem[][] = [];
    for (let i = 0; i < filteredTopics.length; i += 2) {
      rows.push(filteredTopics.slice(i, i + 2));
    }
    return rows;
  }, [filteredTopics]);

  const handleSelectTopic = (topic: MenuItem) => {
    setSearchQuery(""); // Clear search
    onSelectTopic(topic);
    onClose();
  };

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    []
  );

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderTopicItem = (item: MenuItem) => {
    const isSelected = item.ID.toString() === selectedTopicId;
    const isFavorite = favoriteTopicIds.includes(item.ID.toString());

    return (
      <View key={item.ID} style={styles.topicItemContainer}>
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
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
      backgroundStyle={{ backgroundColor }}
      handleIndicatorStyle={{ backgroundColor: "#D1D1D6" }}
    >
      <>
        {/* Header */}
        <View style={[styles.header, { justifyContent: "flex-end" }]}>
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
          style={[styles.searchContainer, { borderColor: brandPrimaryColor }]}
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
        {topicRows.length > 0 ? (
          <BottomSheetScrollView contentContainerStyle={[styles.scrollContent]}>
            {topicRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((item) => renderTopicItem(item))}
              </View>
            ))}
          </BottomSheetScrollView>
        ) : (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No topics found</ThemedText>
          </ThemedView>
        )}
      </>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 8,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "300",
  },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    height: 44,
    fontSize: 16,
  },
  gridContainer: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
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
