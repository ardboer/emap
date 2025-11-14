import { memo } from "react";
import { StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface BlockHeaderProps {
  title: string;
  description?: string;
  layout: string;
}

function BlockHeaderComponent({
  title,
  description,
  layout,
}: BlockHeaderProps) {
  // Skip rendering if no title
  if (!title) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {description && (
        <ThemedText style={styles.description}>{description}</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingRight: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
});

// Memoize component - prevents re-renders during scroll
export const BlockHeader = memo(
  BlockHeaderComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.title === nextProps.title &&
      prevProps.description === nextProps.description &&
      prevProps.layout === nextProps.layout
    );
  }
);
