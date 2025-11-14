import ArticleTeaser from "@/components/ArticleTeaser";
import GradientHeader from "@/components/GradientHeader";
import { NativeAdListItem } from "@/components/NativeAdListItem";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { getCenteredContentStyle } from "@/constants/Layout";
import { analyticsService } from "@/services/analytics";
import { fetchEvents } from "@/services/api";
import { nativeAdVariantManager } from "@/services/nativeAdVariantManager";
import { router, useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

export default function EventsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);

  // Initialize native ad variant manager
  useEffect(() => {
    if (!nativeAdVariantManager.isInitialized()) {
      nativeAdVariantManager.initialize();
    }
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const fetchedEvents = await fetchEvents();
      setEvents(fetchedEvents);
    } catch (err) {
      setError("Failed to load events");
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchedEvents = await fetchEvents();
      setEvents(fetchedEvents);
      setError(null);
    } catch (err) {
      setError("Failed to refresh events");
      console.error("Error refreshing events:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Track screen view and refresh data when tab is focused
  useFocusEffect(
    useCallback(() => {
      analyticsService.logScreenView("Events", "EventsScreen");

      // Refresh events data silently when coming into view
      // Only if we already have data (not initial load)
      if (events.length > 0 && !loading && !refreshing) {
        fetchEvents()
          .then((fetchedEvents) => {
            setEvents(fetchedEvents);
            setError(null);
          })
          .catch((err) => {
            console.error("Error refreshing events on focus:", err);
            // Don't show error to user for background refresh
          });
      }
    }, [])
  );

  const handleEventPress = async (event: any) => {
    // Check if event has a valid link property
    if (event.link && event.link.trim() !== "") {
      try {
        // Open the link in an in-app browser
        await WebBrowser.openBrowserAsync(event.link, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
          controlsColor: "#007AFF",
        });
      } catch (error) {
        console.error("Error opening browser:", error);
        // Fallback to event detail page if browser fails
        router.push(`/event/${event.id}`);
      }
    } else {
      // No link available, navigate to event detail page
      router.push(`/event/${event.id}`);
    }
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  const renderEvent = ({ item, index }: { item: any; index: number }) => {
    // Check if this position should show a native ad
    if (nativeAdVariantManager.shouldShowAdAtPosition("events", index)) {
      return (
        <NativeAdListItem
          position={index}
          viewType="events"
          onAdLoaded={(pos) =>
            console.log(`Native ad loaded at position ${pos} in events`)
          }
          onAdFailed={(pos) =>
            console.log(`Native ad failed at position ${pos} in events`)
          }
        />
      );
    }

    return (
      <ArticleTeaser article={item} onPress={() => handleEventPress(item)} />
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading events...</ThemedText>
      </ThemedView>
    );
  }

  if (error && events.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <GradientHeader
        onSearchPress={handleSearchPress}
        showUserIcon={true}
        onUserPress={() => setSettingsDrawerVisible(true)}
      />
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContainer,
          { backgroundColor: Colors[colorScheme].articleListBackground },
        ]}
      />
      <SettingsDrawer
        visible={settingsDrawerVisible}
        onClose={() => setSettingsDrawerVisible(false)}
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
    ...getCenteredContentStyle(),
  },
  eventContainer: {
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
  excerpt: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
