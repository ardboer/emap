import { Tabs, router } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import { CalendarDotsIcon } from "@/components/icons/CalendarDotsIcon";
import { HighlightsIcon } from "@/components/icons/HighlightsIcon";
import { NewspaperIcon } from "@/components/icons/NewspaperIcon";
import { QuestionIcon } from "@/components/icons/QuestionIcon";
import { StethoscopeIcon } from "@/components/icons/StethoscopeIcon";
import { MiniPlayer } from "@/components/MiniPlayer";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { features, brandConfig } = useBrandConfig();
  const insets = useSafeAreaInsets();

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
            marginTop: 0,
            marginBottom: 0,
            paddingTop: 4,
            paddingBottom: Math.max(8, insets.bottom),
            paddingLeft: 0,
            paddingRight: 0,
            height: 60 + Math.max(0, insets.bottom - 8),
          },
          tabBarLabelStyle: {
            textTransform: "uppercase",
            fontSize: 9,
            fontFamily: "OpenSans-Medium",
            letterSpacing: 0.36,
          },
        }}
        initialRouteName={features?.enableHighlights ? "index" : "news"}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Highlights",
            headerShown: false, // No header for highlighted tab (full-screen carousel)
            href: !features?.enableHighlights ? null : undefined,
            tabBarIcon: ({ color }) => (
              <HighlightsIcon size={25} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              // Get the current route
              const state = navigation.getState();
              const currentRoute = state.routes[state.index];

              // If we're already on the index route, emit a custom event
              if (currentRoute.name === "index") {
                e.preventDefault();
                // Navigate to the same route to trigger the screen
                navigation.navigate("index", {
                  scrollToTop: true,
                  timestamp: Date.now(),
                });
              }
            },
          })}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: "Articles",
            headerShown: false, // Hide header - using custom GradientHeader in news.tsx
            tabBarIcon: ({ color }) => (
              <NewspaperIcon size={25} color={color} />
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
              <StethoscopeIcon size={25} color={color} />
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
              <CalendarDotsIcon size={25} color={color} />
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
            tabBarIcon: ({ color }) => <QuestionIcon size={25} color={color} />,
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
