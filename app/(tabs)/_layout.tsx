import { Tabs } from "expo-router";
import React from "react";
import { Platform, TouchableOpacity } from "react-native";

import { BrandLogo } from "@/components/BrandLogo";
import { HapticTab } from "@/components/HapticTab";
import { MiniPlayer } from "@/components/MiniPlayer";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { features, brandConfig } = useBrandConfig();

  // Get brand-specific colors
  const themeColors = brandConfig?.theme.colors[colorScheme ?? "light"];
  const tabBarActiveTintColor =
    themeColors?.tabIconSelected || Colors[colorScheme ?? "light"].tint;
  const tabBarInactiveTintColor =
    themeColors?.tabIconDefault ||
    Colors[colorScheme ?? "light"].tabIconDefault;
  const tabBarBackgroundColor =
    themeColors?.tabBarBackground || Colors[colorScheme ?? "light"].background;

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor,
          tabBarInactiveTintColor,
          headerShown: true, // Enable headers by default
          tabBarButton: HapticTab,
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              backgroundColor:
                route.name === "index" ? "transparent" : tabBarBackgroundColor,
              borderTopWidth: route.name === "index" ? 0 : undefined,
              shadowOpacity: route.name === "index" ? 0 : undefined,
            },
            default: {
              backgroundColor:
                route.name === "index" ? "transparent" : tabBarBackgroundColor,
              borderTopWidth: route.name === "index" ? 0 : undefined,
              elevation: route.name === "index" ? 0 : undefined,
            },
          }),
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Highlighted",
            headerShown: false, // No header for highlighted tab (full-screen carousel)
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="star.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: "News",
            headerTitle: "",
            headerShadowVisible: false,
            headerStyle: {
              borderBottomWidth: 0,
            },
            headerLeft: () => (
              <BrandLogo width={100} height={32} style={{ marginLeft: 16 }} />
            ),
            headerRight: () => (
              <TouchableOpacity style={{ marginRight: 16, padding: 8 }}>
                <Ionicons name="search" size={24} color="#666" />
              </TouchableOpacity>
            ),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="newspaper.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="paper"
          options={{
            title: "Paper",
            headerTitle: "Paper",
            href: features?.enablePaper ? "/(tabs)/paper" : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="doc.text.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="podcasts"
          options={{
            title: "Podcasts",
            headerTitle: "Podcasts",
            href: features?.enablePodcasts ? "/(tabs)/podcasts" : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="mic.fill" color={color} />
            ),
          }}
        />
      </Tabs>
      {features?.enablePodcasts && (
        <>
          <MiniPlayer />
          <PodcastPlayer />
        </>
      )}
    </>
  );
}
