import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import {
  isTrackingAvailable,
  requestTrackingPermission,
} from "@/services/tracking";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { OnboardingStepProps } from "./types";
import { useBrandColors } from "./useBrandColors";

export function TrackingPermissionScreen({
  onNext,
  onSkip,
}: OnboardingStepProps) {
  const { primaryColor } = useBrandColors();
  const [isLoading, setIsLoading] = useState(false);
  const backgroundColorContent = useThemeColor({}, "contentBackground");
  // This screen should only be shown on iOS
  if (Platform.OS !== "ios") {
    onNext();
    return null;
  }

  // Check if tracking is available (iOS 14+)
  if (!isTrackingAvailable()) {
    // If ATT is not available, skip this step
    onNext();
    return null;
  }

  const handleRequestPermission = async () => {
    setIsLoading(true);

    try {
      const result = await requestTrackingPermission();

      // Log the result for debugging
      console.log("Tracking permission result:", result);

      // Proceed to next step regardless of the user's choice
      // The permission status is already stored in AsyncStorage by the service
      onNext();
    } catch (error) {
      console.error("Error requesting tracking permission:", error);

      // Show error feedback to user
      Alert.alert(
        "Permission Error",
        "There was an error requesting tracking permission. Please try again later.",
        [
          {
            text: "Continue",
            onPress: () => onNext(),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.iconContainer}>
          <IconSymbol name="shield.fill" size={80} color={primaryColor} />
        </ThemedView>

        <ThemedText type="title" style={styles.title}>
          Allow Tracking?
        </ThemedText>

        <ThemedText style={styles.description}>
          We&apos;ll now ask your device for permission to track your activity.
          This helps us provide you with a better experience.
        </ThemedText>

        <ThemedView style={styles.infoBox}>
          <IconSymbol name="lock.fill" size={20} color="#4CAF50" />
          <ThemedView style={styles.infoTextContainer}>
            <ThemedText style={styles.infoTitle}>
              Your Privacy Matters
            </ThemedText>
            <ThemedText style={styles.infoText}>
              We take your privacy seriously. Your data is never sold to third
              parties.
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: primaryColor },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleRequestPermission}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Continue</ThemedText>
          )}
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <ThemedText style={styles.secondaryButtonText}>
            Ask Me Later
          </ThemedText>
        </TouchableOpacity> */}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(10, 126, 164, 0.1)",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    width: "100%",
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
    backgroundColor: "rgba(10, 126, 164, 0)",
    padding: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 12,
    paddingBottom: 32,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
