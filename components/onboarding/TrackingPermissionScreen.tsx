import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { OnboardingStepProps } from "./types";
import { useBrandColors } from "./useBrandColors";

export function TrackingPermissionScreen({
  onNext,
  onSkip,
}: OnboardingStepProps) {
  const { primaryColor } = useBrandColors();

  // This screen should only be shown on iOS
  if (Platform.OS !== "ios") {
    onNext();
    return null;
  }

  const handleRequestPermission = () => {
    // TODO: Implement actual tracking permission request using AppTrackingTransparency
    // For now, just proceed to next step
    onNext();
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
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={handleRequestPermission}
        >
          <ThemedText style={styles.primaryButtonText}>
            Request Permission
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <ThemedText style={styles.secondaryButtonText}>
            Ask Me Later
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    width: "100%",
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
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
