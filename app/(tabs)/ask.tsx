import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React from "react";
import { StyleSheet } from "react-native";

export default function AskScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.centerContent}>
        <ThemedText type="title" style={styles.title}>
          Ask
        </ThemedText>
        <ThemedText style={styles.message}>
          This feature is in development
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    opacity: 0.7,
  },
});
