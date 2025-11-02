import { crashlyticsService } from "@/services/crashlytics";
import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DebugCrashlyticsScreen() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleTestCrash = () => {
    Alert.alert(
      "Test Fatal Crash",
      "This will crash the app immediately. The crash report will be sent on next app launch. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Crash App",
          style: "destructive",
          onPress: () => {
            addResult("Triggering fatal crash...");
            setTimeout(() => {
              crashlyticsService.testCrash();
            }, 500);
          },
        },
      ]
    );
  };

  const handleTestError = async () => {
    try {
      addResult("Testing non-fatal error...");
      throw new Error("Test non-fatal error from debug screen");
    } catch (error) {
      await crashlyticsService.recordError(error as Error, "Debug Screen Test");
      addResult("✅ Non-fatal error logged successfully");
      Alert.alert(
        "Success",
        "Non-fatal error logged to Crashlytics. Check Firebase Console in 5-10 minutes."
      );
    }
  };

  const handleTestWithBreadcrumbs = async () => {
    try {
      addResult("Adding breadcrumbs...");
      crashlyticsService.log("User opened debug screen");
      crashlyticsService.log("User clicked test button");
      crashlyticsService.log("About to trigger test error");

      throw new Error("Test error with breadcrumbs");
    } catch (error) {
      await crashlyticsService.recordError(
        error as Error,
        "Test with Breadcrumbs"
      );
      addResult("✅ Error with breadcrumbs logged");
      Alert.alert(
        "Success",
        "Error with breadcrumbs logged. Check Firebase Console."
      );
    }
  };

  const handleCheckReports = async () => {
    addResult("Checking for unsent reports...");
    const hasReports = await crashlyticsService.checkForUnsentReports();
    addResult(`Unsent reports: ${hasReports ? "Yes" : "No"}`);
    Alert.alert(
      "Unsent Reports",
      hasReports ? "Yes, there are unsent reports" : "No unsent reports"
    );
  };

  const handleSendReports = async () => {
    addResult("Sending unsent reports...");
    await crashlyticsService.sendUnsentReports();
    addResult("✅ Reports sent");
    Alert.alert("Success", "Unsent reports have been sent");
  };

  const handleDeleteReports = async () => {
    Alert.alert(
      "Delete Reports",
      "Are you sure you want to delete all unsent crash reports?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            addResult("Deleting unsent reports...");
            await crashlyticsService.deleteUnsentReports();
            addResult("✅ Reports deleted");
            Alert.alert("Success", "Unsent reports deleted");
          },
        },
      ]
    );
  };

  const handleSetCustomAttributes = async () => {
    addResult("Setting custom attributes...");
    await crashlyticsService.setUserAttributes({
      test_attribute: "test_value",
      debug_mode: "true",
      screen: "debug_crashlytics",
    });
    addResult("✅ Custom attributes set");
    Alert.alert("Success", "Custom attributes have been set");
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!__DEV__) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Debug" }} />
        <Text style={styles.title}>Debug Mode Only</Text>
        <Text style={styles.message}>
          This screen is only available in development mode.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Crashlytics Debug" }} />

      <View style={styles.header}>
        <Text style={styles.title}>🔥 Crashlytics Debug</Text>
        <Text style={styles.subtitle}>Test crash reporting functionality</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fatal Crashes</Text>
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleTestCrash}
        >
          <Text style={styles.buttonText}>💥 Test Fatal Crash</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          This will crash the app. Report will be sent on next launch.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Non-Fatal Errors</Text>
        <TouchableOpacity style={styles.button} onPress={handleTestError}>
          <Text style={styles.buttonText}>⚠️ Test Non-Fatal Error</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={handleTestWithBreadcrumbs}
        >
          <Text style={styles.buttonText}>📝 Test Error with Breadcrumbs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report Management</Text>
        <TouchableOpacity style={styles.button} onPress={handleCheckReports}>
          <Text style={styles.buttonText}>📊 Check Unsent Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleSendReports}>
          <Text style={styles.buttonText}>📤 Send Unsent Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleDeleteReports}
        >
          <Text style={styles.buttonText}>🗑️ Delete Unsent Reports</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Attributes</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSetCustomAttributes}
        >
          <Text style={styles.buttonText}>🏷️ Set Custom Attributes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          {testResults.length > 0 && (
            <TouchableOpacity onPress={clearResults}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.results}>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>No test results yet</Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))
          )}
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>ℹ️ Important Notes</Text>
        <Text style={styles.infoText}>
          • Fatal crashes restart the app immediately{"\n"}• Reports appear in
          Firebase Console after 5-10 minutes{"\n"}• Non-fatal errors are logged
          immediately{"\n"}• User ID and custom attributes are included in
          reports{"\n"}• Test in release builds for accurate results
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Firebase Console: console.firebase.google.com
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 15,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  dangerButton: {
    backgroundColor: "#d32f2f",
  },
  warningButton: {
    backgroundColor: "#f57c00",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    fontStyle: "italic",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  clearButton: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  results: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    minHeight: 100,
  },
  noResults: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
  resultText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 5,
    fontFamily: "monospace",
  },
  info: {
    margin: 20,
    padding: 15,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1976d2",
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
});
