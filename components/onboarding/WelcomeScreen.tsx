import { getBrandEditorImage } from "@/brands/editorImageRegistry";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import React, { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { OnboardingStepProps } from "./types";

export function WelcomeScreen({ onNext, onSkip }: OnboardingStepProps) {
  const { brandConfig, colors } = useBrandConfig();
  const primaryColor = colors?.light.primary || "#0a7ea4";
  const [imageError, setImageError] = useState(false);

  // Determine editor image source using auto-generated registry
  let editorImageSource = null;
  if (
    brandConfig?.onboarding?.editorImage &&
    !imageError &&
    brandConfig.shortcode
  ) {
    editorImageSource = getBrandEditorImage(brandConfig.shortcode);
  }

  // Get editor quote or use default
  const editorQuote =
    brandConfig?.onboarding?.editorQuote &&
    brandConfig.onboarding.editorQuote.trim() !== ""
      ? brandConfig.onboarding.editorQuote
      : "Stay informed with the latest news, in-depth analysis, and exclusive content from our editorial team.";

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        {/* Brand Logo */}
        <View style={styles.logoContainer}>
          <BrandLogo width={200} height={80} variant="header" />
        </View>

        {/* Editor image or placeholder */}
        <View style={styles.editorSection}>
          {editorImageSource ? (
            <Image
              source={editorImageSource}
              style={styles.editorImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ThemedText style={styles.imagePlaceholderText}>👤</ThemedText>
            </View>
          )}

          {/* Editor name and title */}
          {brandConfig?.onboarding?.editorName && (
            <View style={styles.editorInfo}>
              <ThemedText style={styles.editorName}>
                {brandConfig.onboarding.editorName}
              </ThemedText>
              {brandConfig.onboarding.editorJobTitle && (
                <ThemedText style={styles.editorJobTitle}>
                  - {brandConfig.onboarding.editorJobTitle}
                </ThemedText>
              )}
            </View>
          )}
        </View>

        <ThemedText type="title" style={styles.title}>
          Welcome to {brandConfig?.displayName || "Our App"}
        </ThemedText>

        <ThemedText style={styles.description}>{editorQuote}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={onNext}
        >
          <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
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
  editorSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  editorImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  editorInfo: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  editorName: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  editorJobTitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  imagePlaceholderText: {
    fontSize: 40,
    lineHeight: 100,
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
