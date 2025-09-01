import { getAvailableBrands } from "@/brands";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * Development component for switching between brands
 * This should only be used in development/testing environments
 */
export function BrandSwitcher() {
  const { brandConfig, loading, switchBrand } = useBrandConfig();
  const availableBrands = getAvailableBrands();

  const handleBrandSwitch = async (shortcode: string) => {
    if (shortcode === brandConfig?.shortcode) return;

    Alert.alert(
      "Switch Brand",
      `Switch to brand "${shortcode}"? This will reload the app configuration.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          onPress: async () => {
            try {
              await switchBrand(shortcode);
              Alert.alert("Success", `Switched to brand: ${shortcode}`);
            } catch (error) {
              Alert.alert("Error", `Failed to switch brand: ${error}`);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading brands...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Brand Switcher (Development)</Text>
      <Text style={styles.subtitle}>
        Current: {brandConfig?.displayName} ({brandConfig?.shortcode})
      </Text>

      <View style={styles.brandList}>
        {availableBrands.map((shortcode) => (
          <TouchableOpacity
            key={shortcode}
            style={[
              styles.brandButton,
              brandConfig?.shortcode === shortcode && styles.activeBrand,
            ]}
            onPress={() => handleBrandSwitch(shortcode)}
          >
            <Text
              style={[
                styles.brandButtonText,
                brandConfig?.shortcode === shortcode && styles.activeBrandText,
              ]}
            >
              {shortcode.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  brandList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  brandButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  activeBrand: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  brandButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  activeBrandText: {
    color: "#fff",
  },
});
