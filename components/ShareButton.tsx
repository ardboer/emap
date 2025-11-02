import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Platform,
  Share,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface ShareButtonProps {
  title: string;
  message: string;
  url: string;
  style?: ViewStyle;
  iconSize?: number;
  iconColor?: string;
  onShareSuccess?: () => void;
  onShareError?: (error: Error) => void;
}

export default function ShareButton({
  title,
  message,
  url,
  style,
  iconSize = 24,
  iconColor = "#FFFFFF",
  onShareSuccess,
  onShareError,
}: ShareButtonProps) {
  const handleShare = async () => {
    try {
      // Log the share URL for debugging
      console.log("[ShareButton] Attempting to share:", {
        title,
        url,
        message: message.substring(0, 50) + "...",
      });

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Construct share content
      const shareContent: {
        title?: string;
        message: string;
        url?: string;
      } = {
        message: `${title}\n\n${message}\n\nRead more: ${url}`,
      };

      // On iOS, we can use the url parameter separately
      if (Platform.OS === "ios") {
        shareContent.title = title;
        shareContent.url = url;
        shareContent.message = message;
      }

      const result = await Share.share(shareContent);

      if (result.action === Share.sharedAction) {
        console.log("[ShareButton] Article shared successfully");
        if (result.activityType) {
          console.log(`[ShareButton] Shared via: ${result.activityType}`);
        }
        console.log("[ShareButton] Shared URL:", url);
        onShareSuccess?.();
      } else if (result.action === Share.dismissedAction) {
        console.log("[ShareButton] Share dismissed by user");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to share article";
      console.error("Error sharing article:", errorMessage);
      onShareError?.(error as Error);

      // Show error alert to user
      Alert.alert(
        "Share Failed",
        "Unable to share this article. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.shareButton, style]}
      onPress={handleShare}
      activeOpacity={0.7}
      accessibilityLabel="Share article"
      accessibilityHint="Opens share menu to share this article"
      accessibilityRole="button"
    >
      <Ionicons name="share-outline" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shareButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
