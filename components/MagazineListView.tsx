import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { fetchMagazineCover, fetchMagazineEditions } from "@/services/api";
import { MagazineEdition } from "@/types";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import MagazineListItem from "./MagazineListItem";

interface MagazineListViewProps {
  onMagazineSelect: (magazine: MagazineEdition) => void;
}

export default function MagazineListView({
  onMagazineSelect,
}: MagazineListViewProps) {
  const [magazines, setMagazines] = useState<MagazineEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMagazines = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log("🔄 Loading magazine editions...");
      const editionIds = await fetchMagazineEditions();
      console.log("📚 Found editions:", editionIds);

      // Create magazine objects and fetch cover images
      const magazinePromises = editionIds.map(async (id) => {
        try {
          const coverUrl = await fetchMagazineCover(id);
          return {
            id,
            coverUrl,
          } as MagazineEdition;
        } catch (coverError) {
          console.warn(`Failed to fetch cover for ${id}:`, coverError);
          return {
            id,
            coverUrl: undefined,
          } as MagazineEdition;
        }
      });

      const magazinesWithCovers = await Promise.all(magazinePromises);
      console.log(
        "📖 Magazines with covers loaded:",
        magazinesWithCovers.length
      );

      setMagazines(magazinesWithCovers);
    } catch (err) {
      console.error("❌ Error loading magazines:", err);
      setError(err instanceof Error ? err.message : "Failed to load magazines");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMagazines();
  }, [loadMagazines]);

  const handleRefresh = useCallback(() => {
    loadMagazines(true);
  }, [loadMagazines]);

  const handleRetry = useCallback(() => {
    loadMagazines();
  }, [loadMagazines]);

  const renderMagazineItem = useCallback(
    ({ item }: { item: MagazineEdition }) => (
      <MagazineListItem magazine={item} onPress={onMagazineSelect} />
    ),
    [onMagazineSelect]
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#666" />
          <ThemedText style={styles.loadingText}>
            Loading magazines...
          </ThemedText>
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ThemedText style={styles.errorTitle}>
            Unable to load magazines
          </ThemedText>
          <ThemedText style={styles.errorMessage}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.emptyTitle}>
          No magazines available
        </ThemedText>
        <ThemedText style={styles.emptyMessage}>
          Check back later for new issues
        </ThemedText>
      </ThemedView>
    );
  };

  const renderHeader = () => (
    <ThemedView style={styles.header}>
      <ThemedText type="title" style={styles.headerTitle}>
        Magazines
      </ThemedText>
      <ThemedText style={styles.headerSubtitle}>
        Select a magazine to read
      </ThemedText>
    </ThemedView>
  );

  if (loading && magazines.length === 0) {
    return renderEmptyState();
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={magazines}
        renderItem={renderMagazineItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#666"]}
            tintColor="#666"
          />
        }
        contentContainerStyle={
          magazines.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={magazines.length > 1 ? styles.row : undefined}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
  },
  row: {
    justifyContent: "flex-start",
    paddingHorizontal: 8,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
});
