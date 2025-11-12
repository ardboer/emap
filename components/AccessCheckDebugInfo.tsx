import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { AccessControlResponse } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface AccessCheckDebugInfoProps {
  response: AccessControlResponse | null;
  isChecking: boolean;
  isAllowed: boolean;
  error: string | null;
}

export function AccessCheckDebugInfo({
  response,
  isChecking,
  isAllowed,
  error,
}: AccessCheckDebugInfoProps) {
  const colorScheme = useColorScheme();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if debug mode is enabled
  useEffect(() => {
    AsyncStorage.getItem("debug_access_check_enabled").then((value) => {
      setIsEnabled(value === "true");
    });
  }, []);

  // Don't render if debug mode is disabled
  if (!isEnabled) {
    return null;
  }

  const statusColor = isChecking
    ? Colors[colorScheme].tint
    : isAllowed
    ? "#4CAF50"
    : "#F44336";

  const statusText = isChecking
    ? "Checking..."
    : isAllowed
    ? "Access Granted"
    : "Access Denied";

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor:
            colorScheme === "dark"
              ? "rgba(0, 0, 0, 0.8)"
              : "rgba(255, 255, 255, 0.95)",
          borderColor: statusColor,
        },
      ]}
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.8}
    >
      {/* Compact View */}
      <ThemedView transparant style={styles.compactView}>
        <ThemedText style={[styles.statusText, { color: statusColor }]}>
          🔒 {statusText}
        </ThemedText>
        {response && (
          <ThemedText style={styles.userIdText}>
            User: {response.user_id || "Anonymous"}
          </ThemedText>
        )}
      </ThemedView>

      {/* Expanded View */}
      {isExpanded && (
        <ThemedView transparant style={styles.expandedView}>
          <ThemedText style={styles.label}>Status:</ThemedText>
          <ThemedText style={styles.value}>
            {isChecking
              ? "⏳ Checking"
              : isAllowed
              ? "✅ Allowed"
              : "❌ Denied"}
          </ThemedText>

          {response && (
            <>
              <ThemedText style={styles.label}>User ID:</ThemedText>
              <ThemedText style={styles.value}>{response.user_id}</ThemedText>

              <ThemedText style={styles.label}>Post ID:</ThemedText>
              <ThemedText style={styles.value}>{response.post_id}</ThemedText>

              <ThemedText style={styles.label}>Message:</ThemedText>
              <ThemedText style={styles.value}>{response.message}</ThemedText>
            </>
          )}

          {error && (
            <>
              <ThemedText style={[styles.label, { color: "#F44336" }]}>
                Error:
              </ThemedText>
              <ThemedText style={[styles.value, { color: "#F44336" }]}>
                {error}
              </ThemedText>
            </>
          )}

          <ThemedText style={styles.tapHint}>Tap to collapse</ThemedText>
        </ThemedView>
      )}

      {!isExpanded && (
        <ThemedText style={styles.tapHint}>Tap for details</ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compactView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  userIdText: {
    fontSize: 12,
    opacity: 0.7,
  },
  expandedView: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.3)",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    opacity: 0.7,
  },
  value: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: "monospace",
  },
  tapHint: {
    fontSize: 10,
    opacity: 0.5,
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
});
