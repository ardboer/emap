import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { carouselStyles } from "../styles/carouselStyles";

interface CarouselFooterProps {
  isLoadingMore: boolean;
  screenHeight: number;
  primaryColor?: string;
}

/**
 * Footer component for the carousel
 * Displays loading indicator when fetching more recommendations
 */
export function CarouselFooter({
  isLoadingMore,
  screenHeight,
  primaryColor,
}: CarouselFooterProps) {
  if (!isLoadingMore) return null;

  return (
    <View style={[carouselStyles.loadingFooter, { height: screenHeight }]}>
      <ActivityIndicator size="large" color={primaryColor} />
      <ThemedText style={carouselStyles.loadingText}>
        Loading more recommendations...
      </ThemedText>
    </View>
  );
}
