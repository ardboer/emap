import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Switch, TouchableOpacity } from "react-native";

interface SettingsContentProps {
  onClose?: () => void;
}

export function SettingsContent({ onClose }: SettingsContentProps) {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [cacheStats, setCacheStats] = React.useState<{
    totalKeys: number;
    totalSize: number;
    formattedSize: string;
  } | null>(null);

  // Get brand configuration for test article
  const { brandConfig } = useBrandConfig();

  // Load cache stats on component mount
  React.useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      const { cacheService } = await import("@/services/cache");
      const stats = await cacheService.getCacheStats();
      setCacheStats({
        totalKeys: stats.totalKeys,
        totalSize: stats.totalSize,
        formattedSize: cacheService.formatCacheSize(stats.totalSize),
      });
    } catch (error) {
      console.error("Error loading cache stats:", error);
    }
  };

  const handleClearCache = async () => {
    const { Alert } = await import("react-native");

    Alert.alert(
      "Clear WordPress Cache",
      `This will remove all cached WordPress content (${
        cacheStats?.formattedSize || "unknown size"
      }). The app will need to reload content from the server.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear Cache",
          style: "destructive",
          onPress: async () => {
            try {
              const { cacheService } = await import("@/services/cache");
              await cacheService.clearAll();
              await loadCacheStats(); // Refresh stats

              Alert.alert(
                "Cache Cleared",
                "WordPress cache has been successfully cleared.",
                [{ text: "OK" }]
              );
            } catch (error) {
              console.error("Error clearing cache:", error);
              Alert.alert("Error", "Failed to clear cache. Please try again.", [
                { text: "OK" },
              ]);
            }
          },
        },
      ]
    );
  };

  const handleTestArticle = () => {
    if (brandConfig?.testArticleId) {
      router.push(`/article/${brandConfig.testArticleId}`);
      onClose?.(); // Close the drawer after navigation
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
          Storage
        </ThemedText>
        <SettingsItem
          title="Clear WordPress Cache"
          subtitle={
            cacheStats
              ? `${cacheStats.totalKeys} cached items (${cacheStats.formattedSize})`
              : "Loading cache information..."
          }
          icon="trash.fill"
          onPress={handleClearCache}
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
        {__DEV__ && (
          <ThemedView>
            {React.createElement(
              require("@/components/BrandSwitcher").BrandSwitcher
            )}
            {/* Test Article Button */}
            {brandConfig?.testArticleId && (
              <SettingsItem
                title="Test Article"
                subtitle={`Open test article for ${brandConfig.displayName} (ID: ${brandConfig.testArticleId})`}
                icon="doc.text"
                onPress={handleTestArticle}
              />
            )}
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          About
        </ThemedText>
        <SettingsItem
          title="Help & Support"
          subtitle="Get help and contact support"
          icon="questionmark.circle.fill"
          onPress={() => {}}
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
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
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
