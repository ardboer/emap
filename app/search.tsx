import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { fetchSearchResults } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

interface SearchResult {
  id: number;
  title: string;
  url: string;
  type: string;
  subtype: string;
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Brand configuration
  const { brandConfig } = useBrandConfig();
  const colorScheme = useColorScheme();
  const contentBackground = useThemeColor({}, "contentBackground");
  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icon");
  const primaryColor = useThemeColor({}, "tint");
  const buttonColor = useThemeColor({}, "highlightBoxBorder");

  // Get brand fonts
  const primaryFont = brandConfig?.theme.fonts.primary || "System";

  const handleSearch = async () => {
    if (!query.trim()) return;

    // Check for debug mode activation (case-insensitive)
    if (query.trim().toLowerCase() === "debugmode on") {
      try {
        await AsyncStorage.setItem("debug_mode_enabled", "true");
        Alert.alert(
          "Debug Mode Activated",
          "Debug options are now available in Settings.",
          [{ text: "OK" }]
        );
        // Clear the search query
        setQuery("");
        setHasSearched(false);
      } catch (error) {
        console.error("Error activating debug mode:", error);
        Alert.alert(
          "Error",
          "Failed to activate debug mode. Please try again.",
          [{ text: "OK" }]
        );
      }
      return; // Don't perform actual search
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const searchResults = await fetchSearchResults(query.trim());
      setResults(searchResults);
    } catch (err) {
      setError("Failed to search. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    // Navigate to the article using the ID from the URL or the result ID
    const articleId = result.id.toString();
    router.push(`/article/${articleId}?source=search`);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}
    >
      <ThemedText style={styles.resultTitle}>{item.title}</ThemedText>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    if (!hasSearched) {
      return (
        <ThemedView
          style={[styles.emptyState, { backgroundColor: contentBackground }]}
        >
          <Ionicons name="search" size={48} color="#ccc" />
          <ThemedText style={styles.emptyText}>
            Enter a search term to find articles
          </ThemedText>
        </ThemedView>
      );
    }

    if (results.length === 0) {
      return (
        <ThemedView
          style={[styles.emptyState, { backgroundColor: contentBackground }]}
        >
          <Ionicons name="document-text-outline" size={48} color="#ccc" />
          <ThemedText style={styles.emptyText}>
            No results found for &ldquo;{query}&rdquo;
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Try different keywords or check your spelling
          </ThemedText>
        </ThemedView>
      );
    }

    return null;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: contentBackground }]}
      edges={["top"]}
    >
      <ThemedView
        style={[styles.content, { backgroundColor: contentBackground }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { fontFamily: primaryFont }]}>
            Search
          </ThemedText>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchInputContainer,
              {
                backgroundColor: contentBackground,
              },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={iconColor}
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                {
                  fontFamily: primaryFont,
                  color: textColor,
                },
              ]}
              placeholder="Search articles..."
              placeholderTextColor={iconColor}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setQuery("");
                  setResults([]);
                  setHasSearched(false);
                  setError(null);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color={iconColor} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.searchButton,
              {
                backgroundColor: buttonColor,
                opacity: query.trim().length > 0 ? 1 : 0.5,
              },
            ]}
            onPress={handleSearch}
            disabled={!query.trim() || loading}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[styles.searchButtonText, { fontFamily: primaryFont }]}
            >
              Search
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={[styles.errorText, { fontFamily: primaryFont }]}>
              {error}
            </ThemedText>
          </View>
        )}

        {/* Loading Indicator */}
        {loading && (
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: contentBackground },
            ]}
          >
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText
              style={[styles.loadingText, { fontFamily: primaryFont }]}
            >
              Searching...
            </ThemedText>
          </View>
        )}

        {/* Results */}
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id.toString()}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            results.length === 0 ? styles.emptyListContainer : undefined,
            { backgroundColor: contentBackground },
          ]}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    maxWidth: isTablet ? 700 : undefined,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchButtonText: {
    color: "#000000",
    fontWeight: "600",
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  resultsList: {
    flex: 1,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyState: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
    opacity: 0.6,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.5,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
});
