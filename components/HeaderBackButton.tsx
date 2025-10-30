import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";

interface HeaderBackButtonProps {
  onPress?: () => void;
  color?: string;
}

/**
 * Reusable header back button component for consistent navigation throughout the app.
 * Shows only a back arrow icon without any text.
 */
export function HeaderBackButton({
  onPress,
  color = "#007AFF",
}: HeaderBackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.6}
    >
      <Ionicons
        name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
        size={28}
        color={color}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: Platform.OS === "ios" ? 0 : 8,
    padding: 4,
  },
});
