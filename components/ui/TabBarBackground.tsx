import { useColorScheme } from "@/hooks/useColorScheme";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { StyleSheet, View } from "react-native";

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

  // For index tab, return fully transparent (null means no background)
  return null;
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
