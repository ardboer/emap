import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import Share from "react-native-share";

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

      // Clean the title by removing any surrounding quotes that might be added
      const cleanTitle = title.replace(/^['"]|['"]$/g, "").trim();

      // Use react-native-share for better email subject line support
      // For email: subject line gets the title, url is added as clickable link
      // For WhatsApp/other apps: message includes title + line break + url
      const shareOptions = {
        title: cleanTitle,
        // message: `${cleanTitle}\n\n`,
        url: url,
        subject: cleanTitle, // Explicitly set email subject
      };

      const result = await Share.open(shareOptions);

      console.log("[ShareButton] Article shared successfully");
      console.log("[ShareButton] Shared URL:", url);
      onShareSuccess?.();
    } catch (error: any) {
      // User cancelled the share dialog
      if (error?.message === "User did not share") {
        console.log("[ShareButton] Share dismissed by user");
        return;
      }

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
