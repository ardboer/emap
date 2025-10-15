import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { OnboardingStepProps } from "./types";
import { useBrandColors } from "./useBrandColors";

export function LoginScreen({ onNext, onSkip }: OnboardingStepProps) {
  const { primaryColor } = useBrandColors();

  const handleLogin = () => {
    // TODO: Implement actual login flow
    // For now, just complete onboarding
    onNext();
  };

  const handleSignup = () => {
    // TODO: Implement actual signup flow
    // For now, just complete onboarding
    onNext();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.iconContainer}>
          <IconSymbol
            name="person.circle.fill"
            size={80}
            color={primaryColor}
          />
        </ThemedView>

        <ThemedText type="title" style={styles.title}>
          Sign In or Create Account
        </ThemedText>

        <ThemedText style={styles.description}>
          Create an account or sign in to sync your preferences across devices
          and access exclusive content.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={handleLogin}
        >
          <ThemedText style={styles.primaryButtonText}>Sign In</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: primaryColor }]}
          onPress={handleSignup}
        >
          <ThemedText
            style={[styles.secondaryButtonText, { color: primaryColor }]}
          >
            Create Account
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tertiaryButton} onPress={onSkip}>
          <ThemedText style={styles.tertiaryButtonText}>
            Continue Without Account
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
    backgroundColor: "transparent",
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tertiaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  tertiaryButtonText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
