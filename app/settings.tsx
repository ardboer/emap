import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from "react-native";

// Helper function to create support email URL
function createSupportEmailUrl(email: string, brandName?: string): string {
  const subject = encodeURIComponent(`Support Request - ${brandName || "App"}`);
  const body = encodeURIComponent(
    `Please describe your issue:\n\n\n\n---\nDevice Information:\nPlatform: ${
      require("react-native").Platform.OS
    }\nVersion: ${require("react-native").Platform.Version}`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  // Get brand configuration for test article
  const { brandConfig } = useBrandConfig();

  // Debug logging
  React.useEffect(() => {
    console.log("Settings - brandConfig:", brandConfig);
    console.log("Settings - testArticleId:", brandConfig?.testArticleId);
    console.log("Settings - __DEV__:", __DEV__);
  }, [brandConfig]);

  const handleTestArticle = () => {
    if (brandConfig?.testArticleId) {
      router.push(`/article/${brandConfig.testArticleId}`);
    }
  };

  const handleHelpAndSupport = async () => {
    const supportEmail = brandConfig?.supportEmail;

    if (!supportEmail) {
      Alert.alert(
        "Support Unavailable",
        "Support email is not configured for this brand. Please contact us through our website.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const mailtoUrl = createSupportEmailUrl(
        supportEmail,
        brandConfig?.displayName || brandConfig?.name
      );

      const canOpen = await Linking.canOpenURL(mailtoUrl);

      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          "Email Client Not Available",
          `Please send an email to ${supportEmail} with your device information and issue description.`,
          [
            {
              text: "Copy Email",
              onPress: async () => {
                await Clipboard.setStringAsync(supportEmail);
                Alert.alert("Copied!", "Support email copied to clipboard");
              },
            },
            { text: "OK" },
          ]
        );
      }
    } catch (error) {
      console.error("Error opening support email:", error);
      Alert.alert(
        "Error",
        `Could not open email client. Please email us at ${supportEmail}`,
        [{ text: "OK" }]
      );
    }
  };

  const SettingsItem = ({
    title,
    subtitle,
    icon,
    onPress,
    rightElement,
  }: {
    title: string;
    subtitle?: string;
    icon: any;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <ThemedView style={styles.settingsItemLeft}>
        <IconSymbol name={icon} size={24} color="#666" />
        <ThemedView style={styles.settingsItemText}>
          <ThemedText style={styles.settingsItemTitle}>{title}</ThemedText>
          {subtitle && (
            <ThemedText style={styles.settingsItemSubtitle}>
              {subtitle}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
      {rightElement && (
        <ThemedView style={styles.settingsItemRight}>{rightElement}</ThemedView>
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Preferences
          </ThemedText>
          <SettingsItem
            title="Notifications"
            subtitle="Receive push notifications for breaking news"
            icon="bell.fill"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            }
          />
          <SettingsItem
            title="Dark Mode"
            subtitle="Switch between light and dark themes"
            icon="moon.fill"
            rightElement={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
              />
            }
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Content
          </ThemedText>
          <SettingsItem
            title="Reading Preferences"
            subtitle="Customize your reading experience"
            icon="textformat"
            onPress={() => {}}
          />
          <SettingsItem
            title="Categories"
            subtitle="Manage your news categories"
            icon="list.bullet"
            onPress={() => {}}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <SettingsItem
            title="Profile"
            subtitle="Manage your account settings"
            icon="person.fill"
            onPress={() => {}}
          />
          <SettingsItem
            title="Privacy"
            subtitle="Privacy and data settings"
            icon="lock.fill"
            onPress={() => {}}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Development
          </ThemedText>
          {/* Brand Switcher - Only show in development */}
          <ThemedView>
            {React.createElement(
              require("@/components/BrandSwitcher").BrandSwitcher
            )}
            {/* Test Article Button */}
            <SettingsItem
              title="Test Article"
              subtitle={`Open test article for ${
                brandConfig?.displayName || "Unknown"
              } (ID: ${brandConfig?.testArticleId || "Not found"})`}
              icon="doc.text"
              onPress={handleTestArticle}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            About
          </ThemedText>
          <SettingsItem
            title="Help & Support"
            subtitle="Get help and contact support"
            icon="questionmark.circle.fill"
            onPress={handleHelpAndSupport}
          />
          <SettingsItem
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            icon="doc.text.fill"
            onPress={() => {}}
          />
          <SettingsItem
            title="Version"
            subtitle="1.0.0"
            icon="info.circle.fill"
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  screenTitle: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    marginLeft: 4,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    // backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    marginBottom: 8,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingsItemText: {
    marginLeft: 16,
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  settingsItemRight: {
    marginLeft: 16,
  },
});
