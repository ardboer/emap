import { Tabs, router } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/HapticTab";
import { MiniPlayer } from "@/components/MiniPlayer";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";

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
  const headerBackgroundColor =
    themeColors?.headerBackground ||
    Colors[colorScheme ?? "light"].headerBackground;
  const searchIconColor =
    themeColors?.searchIcon || Colors[colorScheme ?? "light"].searchIcon;

  // Handle search icon press
  const handleSearchPress = () => {
    router.push("/search");
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor,
          tabBarInactiveTintColor,
          headerShown: true,
          tabBarButton: HapticTab,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: tabBarBackgroundColor,
            borderTopWidth: 0,
          },
          tabBarLabelStyle: {
            textTransform: "uppercase",
            fontSize: 9,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Highlights",
            headerShown: false, // No header for highlighted tab (full-screen carousel)
            href: features?.enableHighlights ? "/(tabs)/index" : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="star.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: "Articles",
            headerShown: false, // Hide header - using custom GradientHeader in news.tsx
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="newspaper.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="clinical"
          options={{
            title: "Clinical",
            headerShown: false, // Hide header - using custom GradientHeader in clinical.tsx
            href: features?.enableClinical ? "/(tabs)/clinical" : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="heart.text.square.fill"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: "Events",
            headerShown: false, // Hide header - using custom GradientHeader in events.tsx
            href: features?.enableEvents ? "/(tabs)/events" : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="calendar" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ask"
          options={{
            title: "Ask",
            headerTitle: "",
            headerShown: false,
            headerShadowVisible: false,
            headerStyle: {
              borderBottomWidth: 0,
              backgroundColor: headerBackgroundColor,
            },
            // headerLeft: () => (
            //   <BrandLogo
            //     width={100}
            //     height={32}
            //     style={{ marginLeft: 16, marginBottom: 8 }}
            //     variant="header"
            //   />
            // ),
            // headerRight: () => (
            //   <TouchableOpacity
            //     style={{ marginRight: 16, padding: 8 }}
            //     onPress={handleSearchPress}
            //     activeOpacity={0.7}
            //   >
            //     <Ionicons name="search" size={24} color={searchIconColor} />
            //   </TouchableOpacity>
            // ),
            href: features?.enableAsk ? "/(tabs)/ask" : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="questionmark.circle.fill"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="magazine"
          options={{
            title: "Magazine",
            headerShown: false, // Hide header - using custom GradientHeader in magazine.tsx
            href: features?.enableMagazine ? "/(tabs)/magazine" : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="book.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="podcasts"
          options={{
            title: "Podcasts",
            headerShown: false, // Hide header - using custom GradientHeader in podcasts.tsx
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
