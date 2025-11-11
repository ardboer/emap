import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useConsent } from "../hooks/useConsent";
import { AdsConsentStatus } from "../services/consent";

interface ConsentDialogProps {
  visible: boolean;
  onClose?: () => void;
  showDebugInfo?: boolean;
}

/**
 * Consent Dialog Component
 * Displays consent status and allows users to manage consent preferences
 *
 * This component should be rendered at the app root level to ensure
 * consent is obtained before any ad requests are made.
 */
export function ConsentDialog({
  visible,
  onClose,
  showDebugInfo = __DEV__,
}: ConsentDialogProps) {
  const {
    consentState,
    isLoading,
    error,
    canRequestAds,
    consentStatusString,
    showConsentForm,
    resetConsent,
  } = useConsent();

  const handleShowConsentForm = async () => {
    await showConsentForm();
    onClose?.();
  };

  const handleResetConsent = async () => {
    await resetConsent();
  };

  const getStatusColor = () => {
    switch (consentState.status) {
      case AdsConsentStatus.OBTAINED:
        return "#4CAF50"; // Green
      case AdsConsentStatus.NOT_REQUIRED:
        return "#2196F3"; // Blue
      case AdsConsentStatus.REQUIRED:
        return "#FF9800"; // Orange
      case AdsConsentStatus.UNKNOWN:
      default:
        return "#9E9E9E"; // Gray
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Privacy & Consent</Text>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.content}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>
                  Loading consent information...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error</Text>
                <Text style={styles.errorText}>{error.message}</Text>
              </View>
            ) : (
              <>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor() },
                    ]}
                  />
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusLabel}>Consent Status</Text>
                    <Text style={styles.statusValue}>
                      {consentStatusString}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>
                    {canRequestAds
                      ? "You have provided consent for personalized ads. You can change your preferences at any time."
                      : "Consent is required to show personalized ads. Please review and accept our privacy policy."}
                  </Text>
                </View>

                {showDebugInfo && (
                  <View style={styles.debugContainer}>
                    <Text style={styles.debugTitle}>Debug Information</Text>
                    <Text style={styles.debugText}>
                      Status: {consentState.status}
                    </Text>
                    <Text style={styles.debugText}>
                      Can Request Ads: {canRequestAds ? "Yes" : "No"}
                    </Text>
                    <Text style={styles.debugText}>
                      Form Available:{" "}
                      {consentState.isConsentFormAvailable ? "Yes" : "No"}
                    </Text>
                    <Text style={styles.debugText}>
                      Last Updated:{" "}
                      {new Date(consentState.lastUpdated).toLocaleString()}
                    </Text>
                  </View>
                )}

                <View style={styles.buttonContainer}>
                  {consentState.isConsentFormAvailable && (
                    <TouchableOpacity
                      style={[styles.button, styles.primaryButton]}
                      onPress={handleShowConsentForm}
                      disabled={isLoading}
                    >
                      <Text style={styles.primaryButtonText}>
                        {consentState.status === AdsConsentStatus.REQUIRED
                          ? "Provide Consent"
                          : "Update Preferences"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {__DEV__ && (
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton]}
                      onPress={handleResetConsent}
                      disabled={isLoading}
                    >
                      <Text style={styles.secondaryButtonText}>
                        Reset Consent (Debug)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "100%",
    maxWidth: 500,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666666",
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  errorContainer: {
    padding: 20,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C62828",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#C62828",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666666",
  },
  debugContainer: {
    padding: 16,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E65100",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#E65100",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
});
