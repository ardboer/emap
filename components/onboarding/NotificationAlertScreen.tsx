import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { OnboardingStepProps } from "./types";
import { useBrandColors } from "./useBrandColors";

export function NotificationAlertScreen({
  onNext,
  onSkip,
}: OnboardingStepProps) {
  const { primaryColor } = useBrandColors();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.iconContainer}>
          <IconSymbol name="bell.fill" size={80} color={primaryColor} />
        </ThemedView>

        <ThemedText type="title" style={styles.title}>
          Stay Updated
        </ThemedText>

        <ThemedText style={styles.description}>
          Enable notifications to receive breaking news, exclusive interviews,
          and important updates directly on your device.
        </ThemedText>

        <ThemedView style={styles.benefitsList}>
          <ThemedView style={styles.benefitItem}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={24}
              color="#4CAF50"
            />
            <ThemedText style={styles.benefitText}>
              Breaking news alerts
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.benefitItem}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={24}
              color="#4CAF50"
            />
            <ThemedText style={styles.benefitText}>
              Personalized content updates
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.benefitItem}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={24}
              color="#4CAF50"
            />
            <ThemedText style={styles.benefitText}>
              Never miss important stories
            </ThemedText>
          </ThemedView>
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
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  benefitsList: {
    width: "100%",
    gap: 16,
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
