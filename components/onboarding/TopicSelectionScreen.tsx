import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { MOCK_TOPICS, OnboardingStepProps } from "./types";
import { useBrandColors } from "./useBrandColors";

export function TopicSelectionScreen({ onNext, onSkip }: OnboardingStepProps) {
  const { primaryColor } = useBrandColors();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleContinue = () => {
    // TODO: Save selected topics to user preferences
    onNext();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Choose Your Topics
          </ThemedText>

          <ThemedText style={styles.description}>
            Select the topics you&apos;re interested in to personalize your
            notification experience.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.topicsList}>
          {MOCK_TOPICS.map((topic) => {
            const isSelected = selectedTopics.includes(topic.id);
            return (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicCard,
                  isSelected && styles.topicCardSelected,
                ]}
                onPress={() => toggleTopic(topic.id)}
              >
                <ThemedView style={styles.topicCardContent}>
                  <ThemedView style={styles.topicCardHeader}>
                    <ThemedText
                      style={[
                        styles.topicLabel,
                        isSelected && styles.topicLabelSelected,
                      ]}
                    >
                      {topic.label}
                    </ThemedText>
                    {isSelected && (
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={24}
                        color={primaryColor}
                      />
                    )}
                  </ThemedView>
                  <ThemedText
                    style={[
                      styles.topicDescription,
                      isSelected && styles.topicDescriptionSelected,
                    ]}
                  >
                    {topic.description}
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>
            );
          })}
        </ThemedView>
      </ScrollView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: primaryColor },
            selectedTopics.length === 0 && styles.primaryButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedTopics.length === 0}
        >
          <ThemedText style={styles.primaryButtonText}>
            Continue {selectedTopics.length > 0 && `(${selectedTopics.length})`}
          </ThemedText>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
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
  },
  topicsList: {
    gap: 12,
  },
  topicCard: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
  },
  topicCardSelected: {
    borderColor: "rgba(10, 126, 164, 0.8)",
    backgroundColor: "rgba(10, 126, 164, 0.05)",
  },
  topicCardContent: {
    gap: 8,
  },
  topicCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topicLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  topicLabelSelected: {
    opacity: 1,
  },
  topicDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  topicDescriptionSelected: {
    opacity: 0.8,
  },
  buttonContainer: {
    padding: 24,
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.5,
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
