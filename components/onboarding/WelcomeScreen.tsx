import { BrandLogo } from "@/components/BrandLogo";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { OnboardingStepProps } from "./types";

export function WelcomeScreen({ onNext, onSkip }: OnboardingStepProps) {
  const { brandConfig, colors } = useBrandConfig();
  const primaryColor = colors?.light.primary || "#0a7ea4";

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        {/* Brand Logo */}
        <View style={styles.logoContainer}>
          <BrandLogo width={200} height={80} />
        </View>

        {/* Placeholder for editor image */}
        <View style={styles.imagePlaceholder}>
          <ThemedText style={styles.imagePlaceholderText}>👤</ThemedText>
        </View>

        <ThemedText type="title" style={styles.title}>
          Welcome to {brandConfig?.displayName || "Our App"}
        </ThemedText>

        <ThemedText style={styles.description}>
          Stay informed with the latest news, in-depth analysis, and exclusive
          content from our editorial team.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={onNext}
        >
          <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <ThemedText style={styles.secondaryButtonText}>
            Skip for now
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
  logoContainer: {
    marginBottom: 32,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  imagePlaceholderText: {
    fontSize: 60,
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
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    opacity: 0.6,
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
