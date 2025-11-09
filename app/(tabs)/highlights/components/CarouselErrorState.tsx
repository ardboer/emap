import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React from "react";
import { TouchableOpacity } from "react-native";
import { carouselStyles } from "../styles/carouselStyles";

interface CarouselErrorStateProps {
  error: string | null;
  onRetry: () => void;
  backgroundColor: string;
}

/**
 * Error state component for the carousel
 * Displays error message with retry button
 */
export function CarouselErrorState({
  error,
  onRetry,
  backgroundColor,
}: CarouselErrorStateProps) {
  return (
    <ThemedView
      style={[
        carouselStyles.container,
        carouselStyles.centerContent,
        { backgroundColor },
      ]}
    >
      <ThemedText style={carouselStyles.errorText}>
        {error || "No articles available"}
      </ThemedText>
      <TouchableOpacity style={carouselStyles.retryButton} onPress={onRetry}>
        <ThemedText style={carouselStyles.retryButtonText}>Retry</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}
