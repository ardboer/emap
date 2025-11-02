import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export function DebugFloatingButton() {
  const router = useRouter();

  // Only show in development mode
  if (!__DEV__) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => router.push("/debug-crashlytics")}
    >
      <Text style={styles.buttonText}>🔥</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#d32f2f",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  buttonText: {
    fontSize: 24,
  },
});
