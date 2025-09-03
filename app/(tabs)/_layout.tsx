import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { MiniPlayer } from "@/components/MiniPlayer";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { features } = useBrandConfig();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: true, // Enable headers by default
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: "absolute",
            },
            default: {},
          }),
        }}
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
            headerTitle: "News",
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
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            headerTitle: "Settings",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="gearshape.fill" color={color} />
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
