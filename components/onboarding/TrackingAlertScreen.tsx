import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { OnboardingStepProps } from "./types";
import { useBrandColors } from "./useBrandColors";

export function TrackingAlertScreen({ onNext, onSkip }: OnboardingStepProps) {
  const { primaryColor } = useBrandColors();

  // This screen should only be shown on iOS
  if (Platform.OS !== "ios") {
    onNext();
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.iconContainer}>
          <IconSymbol name="hand.raised.fill" size={80} color={primaryColor} />
        </ThemedView>

        <ThemedText type="title" style={styles.title}>
          Privacy & Tracking
        </ThemedText>

        <ThemedText style={styles.description}>
          We respect your privacy. We&apos;ll ask for permission to track your
          activity across apps and websites to provide you with personalized
          content and better ad experiences.
        </ThemedText>

        <ThemedView style={styles.benefitsList}>
          <ThemedView style={styles.benefitItem}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={24}
              color="#4CAF50"
            />
            <ThemedText style={styles.benefitText}>
              Personalized content recommendations
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.benefitItem}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={24}
              color="#4CAF50"
            />
            <ThemedText style={styles.benefitText}>
              Relevant advertisements
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.benefitItem}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={24}
              color="#4CAF50"
            />
            <ThemedText style={styles.benefitText}>
              Support free content
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.infoBox}>
          <IconSymbol name="info.circle.fill" size={20} color={primaryColor} />
          <ThemedText style={styles.infoText}>
            You can change this setting anytime in your device&apos;s Settings
            app under Privacy & Security.
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={onNext}
        >
          <ThemedText style={styles.primaryButtonText}>Continue</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <ThemedText style={styles.secondaryButtonText}>Skip</ThemedText>
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
  benefitsList: {
    width: "100%",
    gap: 16,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
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
  infoText: {
    flex: 1,
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
