import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import {
  BRAND_VALIDATION,
  getBrandIndicator,
  validateBrandConfiguration,
} from "../config/brandValidation";

interface BrandValidatorProps {
  showIndicator?: boolean;
  onValidationError?: (errors: string[]) => void;
}

export function BrandValidator({
  showIndicator = __DEV__,
  onValidationError,
}: BrandValidatorProps) {
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  useEffect(() => {
    const result = validateBrandConfiguration();
    setValidationResult(result);

    if (!result.isValid) {
      console.error("🚨 BRAND VALIDATION FAILED:", result.errors);

      if (__DEV__) {
        Alert.alert(
          "🚨 Brand Configuration Error",
          `Brand validation failed:\n\n${result.errors.join(
            "\n"
          )}\n\nThis could indicate a brand mix-up!`,
          [{ text: "OK", style: "destructive" }]
        );
      }

      onValidationError?.(result.errors);
    }

    if (result.warnings.length > 0) {
      console.warn("⚠️ Brand validation warnings:", result.warnings);
    }
  }, [onValidationError]);

  if (!showIndicator || !validationResult) {
    return null;
  }

  const brandIndicator = getBrandIndicator();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.indicator,
          validationResult.isValid ? styles.valid : styles.invalid,
        ]}
      >
        {brandIndicator}
        {!validationResult.isValid && " ⚠️ BRAND ERROR"}
      </Text>

      {!validationResult.isValid && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Brand Validation Errors:</Text>
          {validationResult.errors.map((error, index) => (
            <Text key={index} style={styles.errorText}>
              • {error}
            </Text>
          ))}
        </View>
      )}

      {validationResult.warnings.length > 0 && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningTitle}>Warnings:</Text>
          {validationResult.warnings.map((warning, index) => (
            <Text key={index} style={styles.warningText}>
              • {warning}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    right: 10,
    zIndex: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 8,
    borderRadius: 8,
    maxWidth: 300,
  },
  indicator: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  valid: {
    color: "#4CAF50",
  },
  invalid: {
    color: "#F44336",
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    borderRadius: 4,
  },
  errorTitle: {
    color: "#F44336",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  errorText: {
    color: "#F44336",
    fontSize: 9,
    marginBottom: 2,
  },
  warningContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "rgba(255, 193, 7, 0.2)",
    borderRadius: 4,
  },
  warningTitle: {
    color: "#FFC107",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  warningText: {
    color: "#FFC107",
    fontSize: 9,
    marginBottom: 2,
  },
});

// Export validation utilities for use in other components
export { BRAND_VALIDATION, getBrandIndicator, validateBrandConfiguration };
