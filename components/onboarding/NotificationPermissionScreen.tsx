import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  getFCMToken,
  requestNotificationPermission,
} from "@/services/firebaseNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import { OnboardingStepProps } from "./types";
import { useBrandColors } from "./useBrandColors";

export function NotificationPermissionScreen({
  onNext,
  onSkip,
}: OnboardingStepProps) {
  const { primaryColor } = useBrandColors();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    if (isRequesting) return;

    setIsRequesting(true);

    try {
      // Request notification permissions using Firebase
      const permissionGranted = await requestNotificationPermission();

      if (permissionGranted) {
        // Permission granted - get the FCM token
        try {
          // Add a small delay to ensure native modules are fully initialized
          await new Promise((resolve) => setTimeout(resolve, 500));

          const token = await getFCMToken();

          if (token) {
            // Store the push token (already stored in firebaseNotifications service)
            // Store permission status
            await AsyncStorage.setItem("notificationPermissionGranted", "true");

            // Store the timestamp when permission was granted
            await AsyncStorage.setItem(
              "notificationPermissionGrantedAt",
              new Date().toISOString()
            );

            console.log("✅ FCM token obtained and stored:", token);

            // Proceed to next step without showing alert for smoother UX
            onNext();
          } else {
            console.log("⚠️ No FCM token obtained, but permission granted");

            // Even if token fails, mark permission as granted and continue
            await AsyncStorage.setItem("notificationPermissionGranted", "true");
            await AsyncStorage.setItem(
              "notificationPermissionGrantedAt",
              new Date().toISOString()
            );

            // Continue to next step - token can be obtained later
            onNext();
          }
        } catch (tokenError) {
          console.error("⚠️ Error getting FCM token:", tokenError);
          console.log("📝 Note: FCM token will be obtained in background");

          // Even if token fails, mark permission as granted and continue
          await AsyncStorage.setItem("notificationPermissionGranted", "true");
          await AsyncStorage.setItem(
            "notificationPermissionGrantedAt",
            new Date().toISOString()
          );

          // Continue to next step - token can be obtained later
          onNext();
        }
      } else {
        // Permission denied
        await AsyncStorage.setItem("notificationPermissionGranted", "false");
        await AsyncStorage.setItem(
          "notificationPermissionDeniedAt",
          new Date().toISOString()
        );

        Alert.alert(
          "Notifications Disabled",
          "You can enable notifications later in your device settings if you change your mind.",
          [{ text: "OK", onPress: () => onNext() }]
        );
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);

      Alert.alert(
        "Error",
        "There was a problem setting up notifications. You can try again later in settings.",
        [{ text: "OK", onPress: () => onNext() }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.iconContainer}>
          <IconSymbol name="bell.badge.fill" size={80} color={primaryColor} />
        </ThemedView>

        <ThemedText type="title" style={styles.title}>
          Enable Notifications
        </ThemedText>

        <ThemedText style={styles.description}>
          We&apos;ll ask your device for permission to send you notifications.
          You can always change this later in your device settings.
        </ThemedText>

        <ThemedView style={styles.infoBox}>
          <IconSymbol name="info.circle.fill" size={20} color={primaryColor} />
          <ThemedText style={styles.infoText}>
            Your notification preferences can be customized at any time in the
            app settings.
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={handleRequestPermission}
        >
          <ThemedText style={styles.primaryButtonText}>
            Allow Notifications
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <ThemedText style={styles.secondaryButtonText}>Not Now</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 32,
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
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(10, 126, 164, 0.1)",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    width: "100%",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
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
