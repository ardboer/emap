import { Tabs, router } from "expo-router";
import React from "react";
import { Platform, TouchableOpacity } from "react-native";

import { BrandLogo } from "@/components/BrandLogo";
import { HapticTab } from "@/components/HapticTab";
import { MiniPlayer } from "@/components/MiniPlayer";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import TabBarBackgroundIOS from "@/components/ui/TabBarBackground.ios";
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
  const headerBackgroundColor =
    themeColors?.headerBackground ||
    Colors[colorScheme ?? "light"].headerBackground;

  // Handle search icon press
  const handleSearchPress = () => {
    router.push("/search");
  };

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor,
          tabBarInactiveTintColor,
          headerShown: true, // Enable headers by default
          tabBarButton: HapticTab,
          tabBarBackground: Platform.select({
            ios: route.name === "index" ? undefined : TabBarBackgroundIOS,
            default:
              route.name === "index"
                ? () => null
                : () => <TabBarBackground shouldRender={false} />,
          }),
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              backgroundColor:
                route.name === "index" ? "transparent" : tabBarBackgroundColor,
              borderTopWidth: route.name === "index" ? 0 : undefined,
              shadowOpacity: route.name === "index" ? 0 : undefined,
            },
            default: {
              position: "absolute",
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
            title: "Highlights",
            headerShown: false, // No header for highlighted tab (full-screen carousel)
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="star.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: "Articles",
            headerTitle: "",
            headerShadowVisible: false,
            headerStyle: {
              borderBottomWidth: 0,
              backgroundColor: headerBackgroundColor,
            },
            headerLeft: () => (
              <BrandLogo width={100} height={32} style={{ marginLeft: 16 }} />
            ),
            headerRight: () => (
              <TouchableOpacity
                style={{ marginRight: 16, padding: 8 }}
                onPress={handleSearchPress}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={24} color="#666" />
              </TouchableOpacity>
            ),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="newspaper.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="clinical"
          options={{
            title: "Clinical",
            headerTitle: "",
            headerShadowVisible: false,
            headerStyle: {
              borderBottomWidth: 0,
              backgroundColor: headerBackgroundColor,
            },
            headerLeft: () => (
              <BrandLogo width={100} height={32} style={{ marginLeft: 16 }} />
            ),
            headerRight: () => (
              <TouchableOpacity
                style={{ marginRight: 16, padding: 8 }}
                onPress={handleSearchPress}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={24} color="#666" />
              </TouchableOpacity>
            ),
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
            headerTitle: "",
            headerShadowVisible: false,
            headerStyle: {
              borderBottomWidth: 0,
              backgroundColor: headerBackgroundColor,
            },
            headerLeft: () => (
              <BrandLogo width={100} height={32} style={{ marginLeft: 16 }} />
            ),
            headerRight: () => (
              <TouchableOpacity
                style={{ marginRight: 16, padding: 8 }}
                onPress={handleSearchPress}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={24} color="#666" />
              </TouchableOpacity>
            ),
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
            headerShadowVisible: false,
            headerStyle: {
              borderBottomWidth: 0,
              backgroundColor: headerBackgroundColor,
            },
            headerLeft: () => (
              <BrandLogo width={100} height={32} style={{ marginLeft: 16 }} />
            ),
            headerRight: () => (
              <TouchableOpacity
                style={{ marginRight: 16, padding: 8 }}
                onPress={handleSearchPress}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={24} color="#666" />
              </TouchableOpacity>
            ),
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
            headerTitle: "",
            headerShadowVisible: false,
            headerStyle: {
              borderBottomWidth: 0,
              backgroundColor: headerBackgroundColor,
            },
            headerLeft: () => (
              <BrandLogo width={100} height={32} style={{ marginLeft: 16 }} />
            ),
            headerRight: () => (
              <TouchableOpacity
                style={{ marginRight: 16, padding: 8 }}
                onPress={handleSearchPress}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={24} color="#666" />
              </TouchableOpacity>
            ),
            href: features?.enableMagazine ? "/(tabs)/magazine" : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="book.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="paper"
          options={{
            title: "Paper",
            headerTitle: "Paper",
            headerShadowVisible: false,
            headerStyle: {
              borderBottomWidth: 0,
              backgroundColor: headerBackgroundColor,
            },
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
            headerShadowVisible: false,
            headerStyle: {
              borderBottomWidth: 0,
              backgroundColor: headerBackgroundColor,
            },
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
