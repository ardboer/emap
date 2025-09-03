import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";

export default function PaperScreen() {
  const { features } = useBrandConfig();

  useEffect(() => {
    if (!features?.enablePaper) {
      router.replace("/(tabs)/news");
    }
  }, [features]);

  if (!features?.enablePaper) {
    return null;
  }
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Paper
        </ThemedText>
        <ThemedText style={styles.message}>Not yet available</ThemedText>
        <ThemedText style={styles.description}>
          The digital paper experience is coming soon. Stay tuned for updates!
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    marginBottom: 12,
    opacity: 0.8,
  },
  description: {
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 20,
  },
});
