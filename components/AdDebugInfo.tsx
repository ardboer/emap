import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React from "react";
import { StyleSheet, View } from "react-native";

export interface AdDebugData {
  adUnitId: string;
  adType: "banner" | "native_list" | "native_carousel";
  requestResult: "success" | "failed" | "loading";
  loadTimeMs?: number;
  isTestAd: boolean;
  errorMessage?: string;
  position?: number;
  viewType?: string;
}

interface AdDebugInfoProps {
  data: AdDebugData;
  variant?: "inline" | "overlay";
}

/**
 * Reusable component to display ad debug information
 * Shows ad unit ID, request result, load time, and other debug data
 */
export function AdDebugInfo({ data, variant = "inline" }: AdDebugInfoProps) {
  const {
    adUnitId,
    adType,
    requestResult,
    loadTimeMs,
    isTestAd,
    errorMessage,
    position,
    viewType,
  } = data;

  const getStatusColor = () => {
    switch (requestResult) {
      case "success":
        return "#4CAF50";
      case "failed":
        return "#F44336";
      case "loading":
        return "#FF9800";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusText = () => {
    switch (requestResult) {
      case "success":
        return "✓ Loaded";
      case "failed":
        return "✗ Failed";
      case "loading":
        return "⏳ Loading";
      default:
        return "Unknown";
    }
  };

  if (variant === "overlay") {
    return (
      <View style={styles.overlayContainer}>
        <View style={[styles.overlayBadge, { borderColor: getStatusColor() }]}>
          <ThemedText style={styles.overlayTitle}>AD DEBUG</ThemedText>
          <ThemedText style={styles.overlayText}>
            {getStatusText()} • {isTestAd ? "Test" : "Prod"}
          </ThemedText>
          {loadTimeMs !== undefined && (
            <ThemedText style={styles.overlayText}>{loadTimeMs}ms</ThemedText>
          )}
          <ThemedText style={styles.overlayTextSmall} numberOfLines={1}>
            {adUnitId}
          </ThemedText>
          {errorMessage && (
            <ThemedText style={styles.overlayError} numberOfLines={1}>
              {errorMessage}
            </ThemedText>
          )}
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>🐛 Ad Debug Info</ThemedText>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
        >
          <ThemedText style={styles.statusText}>{getStatusText()}</ThemedText>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Type:</ThemedText>
          <ThemedText style={styles.value}>{adType}</ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Mode:</ThemedText>
          <ThemedText style={styles.value}>
            {isTestAd ? "Test Ad" : "Production"}
          </ThemedText>
        </View>

        {position !== undefined && (
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Position:</ThemedText>
            <ThemedText style={styles.value}>{position}</ThemedText>
          </View>
        )}

        {viewType && (
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>View:</ThemedText>
            <ThemedText style={styles.value}>{viewType}</ThemedText>
          </View>
        )}

        {loadTimeMs !== undefined && (
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Load Time:</ThemedText>
            <ThemedText style={styles.value}>{loadTimeMs}ms</ThemedText>
          </View>
        )}

        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Ad Unit ID:</ThemedText>
          <ThemedText style={styles.valueSmall} numberOfLines={1}>
            {adUnitId}
          </ThemedText>
        </View>

        {errorMessage && (
          <View style={styles.errorRow}>
            <ThemedText style={styles.label}>Error:</ThemedText>
            <ThemedText style={styles.errorText} numberOfLines={2}>
              {errorMessage}
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  infoGrid: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.7,
    flex: 0.4,
  },
  value: {
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.9,
    flex: 0.6,
    textAlign: "right",
  },
  valueSmall: {
    fontSize: 9,
    fontWeight: "400",
    opacity: 0.8,
    flex: 0.6,
    textAlign: "right",
  },
  errorRow: {
    flexDirection: "column",
    gap: 4,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 0, 0, 0.2)",
  },
  errorText: {
    fontSize: 10,
    color: "#F44336",
    opacity: 0.9,
  },
  overlayContainer: {
    position: "absolute",
    bottom: 64,
    marginBottom: 32,
    right: 16,
    zIndex: 100,
  },
  overlayBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    gap: 2,
  },
  overlayTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    opacity: 0.9,
  },
  overlayText: {
    fontSize: 9,
    fontWeight: "500",
    color: "#FFFFFF",
    opacity: 0.8,
  },
  overlayTextSmall: {
    fontSize: 8,
    fontWeight: "400",
    color: "#FFFFFF",
    opacity: 0.7,
  },
  overlayError: {
    fontSize: 8,
    fontWeight: "500",
    color: "#FF6B6B",
    opacity: 0.9,
  },
});

export default AdDebugInfo;
