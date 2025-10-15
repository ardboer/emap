import { useColorScheme } from "@/hooks/useColorScheme";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Platform, StyleSheet, View } from "react-native";

export default function TabBarBackground({
  shouldRender = true,
}: {
  shouldRender?: boolean;
}) {
  const colorScheme = useColorScheme();

  if (!shouldRender) {
    // For non-index tabs, return a semi-transparent background
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(21, 23, 24, 0.85)" // Semi-transparent dark background
                : "rgba(255, 255, 255, 0.85)", // Semi-transparent white background
          },
        ]}
      />
    );
  }

  // For index tab on Android in light mode, use opaque background
  if (Platform.OS === "android" && colorScheme === "light") {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "rgba(255, 255, 255, 1)", // Opaque white background
          },
        ]}
      />
    );
  }

  // For index tab on iOS or Android dark mode, return fully transparent
  return null;
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
