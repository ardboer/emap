import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { setOnboardingCompleted } from "@/services/onboarding";
import React, { useState } from "react";
import { Modal, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LoginScreen } from "./LoginScreen";
import { NotificationAlertScreen } from "./NotificationAlertScreen";
import { NotificationPermissionScreen } from "./NotificationPermissionScreen";
import { TopicSelectionScreen } from "./TopicSelectionScreen";
import { TrackingAlertScreen } from "./TrackingAlertScreen";
import { TrackingPermissionScreen } from "./TrackingPermissionScreen";
import { OnboardingStep } from "./types";
import { useBrandColors } from "./useBrandColors";
import { WelcomeScreen } from "./WelcomeScreen";

interface OnboardingContainerProps {
  onComplete: () => void;
}

export function OnboardingContainer({ onComplete }: OnboardingContainerProps) {
  const { primaryColor } = useBrandColors();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Define the steps based on platform
  const getSteps = (): OnboardingStep[] => {
    const baseSteps: OnboardingStep[] = [
      "welcome",
      // "notification-alert",
      "notification-permission",
      // "topic-selection",
    ];

    // Add iOS-specific steps
    if (Platform.OS === "ios") {
      baseSteps.push(
        // "tracking-alert",
        "tracking-permission"
      );
    }

    // Add login as final step
    // baseSteps.push("login");

    return baseSteps;
  };

  const steps = getSteps();
  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    // Skip to the last step (login) or complete if already there
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(steps.length - 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await setOnboardingCompleted();
      onComplete();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Still complete even if there's an error saving
      onComplete();
    }
  };

  const renderCurrentStep = () => {
    const stepProps = {
      onNext: handleNext,
      onBack: handleBack,
      onSkip: handleSkip,
    };

    switch (currentStep) {
      case "welcome":
        return <WelcomeScreen {...stepProps} />;
      case "notification-alert":
        return <NotificationAlertScreen {...stepProps} />;
      case "notification-permission":
        return <NotificationPermissionScreen {...stepProps} />;
      case "topic-selection":
        return <TopicSelectionScreen {...stepProps} />;
      case "tracking-alert":
        return <TrackingAlertScreen {...stepProps} />;
      case "tracking-permission":
        return <TrackingPermissionScreen {...stepProps} />;
      case "login":
        return <LoginScreen {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ThemedView style={styles.container}>
          {/* Header with progress and back button */}
          <ThemedView style={styles.header}>
            {currentStepIndex > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <IconSymbol
                  name="chevron.left"
                  size={24}
                  color={primaryColor}
                />
                <ThemedText
                  style={[styles.backButtonText, { color: primaryColor }]}
                >
                  Back
                </ThemedText>
              </TouchableOpacity>
            )}

            <ThemedView style={styles.progressContainer}>
              <ThemedText style={styles.progressText}>
                {currentStepIndex + 1} of {totalSteps}
              </ThemedText>
              <ThemedView style={styles.progressBarContainer}>
                {steps.map((_, index) => (
                  <ThemedView
                    key={index}
                    style={[
                      styles.progressBarSegment,
                      index <= currentStepIndex && [
                        styles.progressBarSegmentActive,
                        { backgroundColor: primaryColor },
                      ],
                    ]}
                  />
                ))}
              </ThemedView>
            </ThemedView>

            {currentStepIndex && (
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <ThemedText
                  style={[styles.skipButtonText, { color: primaryColor }]}
                >
                  {/* Skip */}
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>

          {/* Current step content */}
          <ThemedView style={styles.stepContent}>
            {renderCurrentStep()}
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 70,
  },
  backButtonText: {
    fontSize: 16,
  },
  progressContainer: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    opacity: 0.6,
  },
  progressBarContainer: {
    flexDirection: "row",
    gap: 4,
    width: "100%",
    maxWidth: 200,
  },
  progressBarSegment: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 2,
  },
  progressBarSegmentActive: {
    // backgroundColor set dynamically
  },
  skipButton: {
    minWidth: 70,
    alignItems: "flex-end",
  },
  skipButtonText: {
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
});
