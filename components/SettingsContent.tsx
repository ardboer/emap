import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { brandManager } from "@/config/BrandManager";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useColorSchemeContext } from "@/contexts/ColorSchemeContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  checkNotificationPermission,
  subscribeToTopic,
  unsubscribeFromTopic,
} from "@/services/firebaseNotifications";
import { resetOnboarding } from "@/services/onboarding";
import { createSupportEmailUrl } from "@/utils/deviceInfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from "react-native";

interface SettingsContentProps {
  onClose?: () => void;
}

interface TopicSubscription {
  id: string;
  label: string;
  description: string;
  subscribed: boolean;
}

export function SettingsContent({ onClose }: SettingsContentProps) {
  const colorScheme = useColorScheme();
  const { mode, setMode } = useColorSchemeContext();
  const { user, isAuthenticated, isLoading, error, login, logout } = useAuth();
  const [notificationStatus, setNotificationStatus] = React.useState<{
    enabled: boolean;
    loading: boolean;
  }>({ enabled: false, loading: true });
  // Dark mode is enabled when mode is explicitly set to "dark"
  const darkModeEnabled = mode === "dark";
  const [showPaywall, setShowPaywall] = React.useState(true);
  const [forceLandscapeImages, setForceLandscapeImages] = React.useState(false);
  const [useColorGradient, setUseColorGradient] = React.useState(false);
  const [pushToken, setPushToken] = React.useState<string | null>(null);
  const [topicSubscriptions, setTopicSubscriptions] = React.useState<
    TopicSubscription[]
  >([]);
  const [cacheStats, setCacheStats] = React.useState<{
    totalKeys: number;
    totalSize: number;
    formattedSize: string;
  } | null>(null);

  // Get brand configuration for test article
  const { brandConfig, colors } = useBrandConfig();

  // Get article detail background color
  const themeColors = colors?.[colorScheme ?? "light"];
  const backgroundColor =
    (themeColors as any)?.contentBackground ||
    themeColors?.background ||
    Colors[colorScheme ?? "light"].background;
  const primaryColor = themeColors?.primary || "#007AFF";

  // Available topics for subscription (with brand prefix)
  const brandShortcode = brandManager.getActiveBrandShortcode();
  const AVAILABLE_TOPICS: Omit<TopicSubscription, "subscribed">[] = [
    {
      id: `${brandShortcode}-breaking`,
      label: "Breaking News",
      description: "Get notified about urgent breaking news",
    },
    {
      id: `${brandShortcode}-interview`,
      label: "Interviews",
      description: "Exclusive interviews with key figures",
    },
    {
      id: `${brandShortcode}-background`,
      label: "Background Stories",
      description: "In-depth analysis and background articles",
    },
  ];

  // Load cache stats, push token, notification status, and topics on component mount
  React.useEffect(() => {
    loadCacheStats();
    loadPushToken();
    loadNotificationStatus();
    loadTopicSubscriptions();
  }, []);

  // Auto-refresh notification status when app comes to foreground
  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        loadNotificationStatus();
      }
    });
    return () => subscription.remove();
  }, []);

  // Load paywall debug setting
  React.useEffect(() => {
    AsyncStorage.getItem("debug_show_paywall").then((value) => {
      if (value !== null) {
        setShowPaywall(value === "true");
      }
    });
  }, []);

  // Load force landscape images debug setting
  React.useEffect(() => {
    AsyncStorage.getItem("debug_force_landscape_images").then((value) => {
      if (value !== null) {
        setForceLandscapeImages(value === "true");
      }
    });
  }, []);

  // Load color gradient debug setting
  React.useEffect(() => {
    AsyncStorage.getItem("debug_use_color_gradient").then((value) => {
      if (value !== null) {
        setUseColorGradient(value === "true");
      }
    });
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

  const loadPushToken = async () => {
    try {
      const token = await AsyncStorage.getItem("expoPushToken");
      setPushToken(token);
    } catch (error) {
      console.error("Error loading push token:", error);
    }
  };

  const loadNotificationStatus = async () => {
    try {
      const hasPermission = await checkNotificationPermission();
      setNotificationStatus({ enabled: hasPermission, loading: false });
    } catch (error) {
      console.error("Error checking notification permission:", error);
      setNotificationStatus({ enabled: false, loading: false });
    }
  };

  const loadTopicSubscriptions = async () => {
    try {
      const storedTopics = await AsyncStorage.getItem("subscribedTopics");
      const subscribedTopicIds: string[] = storedTopics
        ? JSON.parse(storedTopics)
        : [];

      // Add brand topic to the list
      const brandShortcode = brandManager.getActiveBrandShortcode();
      const brandTopic = {
        id: brandShortcode,
        label: `${brandManager.getCurrentBrand().displayName} Updates`,
        description: "General updates and news from this publication",
        subscribed: subscribedTopicIds.includes(brandShortcode),
      };

      const topics: TopicSubscription[] = [
        brandTopic,
        ...AVAILABLE_TOPICS.map((topic) => ({
          ...topic,
          subscribed: subscribedTopicIds.includes(topic.id),
        })),
      ];

      setTopicSubscriptions(topics);
    } catch (error) {
      console.error("Error loading topic subscriptions:", error);
    }
  };

  const handleOpenNotificationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error("Error opening settings:", error);
      Alert.alert(
        "Cannot Open Settings",
        "Please open your device settings manually to change notification permissions.",
        [{ text: "OK" }]
      );
    }
  };

  const handleTopicToggle = async (topicId: string, currentValue: boolean) => {
    // Prevent toggling the brand topic
    const brandShortcode = brandManager.getActiveBrandShortcode();
    if (topicId === brandShortcode) {
      Alert.alert(
        "Cannot Disable",
        "You cannot unsubscribe from the main publication updates.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const newValue = !currentValue;

      // Update Firebase subscription
      if (newValue) {
        await subscribeToTopic(topicId);
      } else {
        await unsubscribeFromTopic(topicId);
      }

      // Update local state
      setTopicSubscriptions((prev) =>
        prev.map((topic) =>
          topic.id === topicId ? { ...topic, subscribed: newValue } : topic
        )
      );

      // Update AsyncStorage
      const updatedTopics = topicSubscriptions
        .filter((t) => t.id !== brandShortcode) // Exclude brand topic
        .map((t) => (t.id === topicId ? { ...t, subscribed: newValue } : t))
        .filter((t) => t.subscribed)
        .map((t) => t.id);

      await AsyncStorage.setItem(
        "subscribedTopics",
        JSON.stringify(updatedTopics)
      );

      console.log(
        `✅ ${
          newValue ? "Subscribed to" : "Unsubscribed from"
        } topic: ${topicId}`
      );
    } catch (error) {
      console.error("Error toggling topic subscription:", error);
      Alert.alert(
        "Error",
        "Failed to update topic subscription. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleCopyPushToken = async () => {
    if (pushToken) {
      await Clipboard.setStringAsync(pushToken);
      Alert.alert("Copied!", "Push token copied to clipboard", [
        { text: "OK" },
      ]);
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

  const handleClearCache = async () => {
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

  const handleResetOnboarding = async () => {
    Alert.alert(
      "Reset Onboarding",
      "This will reset the onboarding flag. The welcome flow will appear the next time you restart the app.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetOnboarding();
              Alert.alert(
                "Onboarding Reset",
                "The onboarding flag has been cleared. Restart the app to see the welcome flow again.",
                [{ text: "OK" }]
              );
            } catch (error) {
              console.error("Error resetting onboarding:", error);
              Alert.alert(
                "Error",
                "Failed to reset onboarding. Please try again.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  const handlePaywallToggle = async (value: boolean) => {
    setShowPaywall(value);
    await AsyncStorage.setItem("debug_show_paywall", value.toString());
  };

  const handleForceLandscapeToggle = async (value: boolean) => {
    setForceLandscapeImages(value);
    await AsyncStorage.setItem(
      "debug_force_landscape_images",
      value.toString()
    );

    // Clear highlights cache to force reload with new image setting
    try {
      const { cacheService } = await import("@/services/cache");
      await cacheService.remove("highlights");
      Alert.alert(
        "Setting Updated",
        "Highlights cache cleared. Pull to refresh the highlights tab to see the changes.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error clearing highlights cache:", error);
    }
  };
  const handleColorGradientToggle = async (value: boolean) => {
    setUseColorGradient(value);
    await AsyncStorage.setItem("debug_use_color_gradient", value.toString());

    Alert.alert(
      "Setting Updated",
      "Pull to refresh the highlights tab to see the changes.",
      [{ text: "OK" }]
    );
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
    <TouchableOpacity
      style={[
        styles.settingsItem,
        {
          backgroundColor: (themeColors as any)?.highlightBoxBg || "#00334C",
        },
      ]}
      onPress={onPress}
    >
      <ThemedView transparant style={styles.settingsItemLeft}>
        <IconSymbol name={icon} size={24} color={primaryColor} />
        <ThemedView transparant style={styles.settingsItemText}>
          <ThemedText style={styles.settingsItemTitle}>{title}</ThemedText>
          {subtitle && (
            <ThemedText style={styles.settingsItemSubtitle}>
              {subtitle}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
      {rightElement && (
        <ThemedView transparant style={styles.settingsItemRight}>
          {rightElement}
        </ThemedView>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={{ backgroundColor }}
    >
      {/* Account Section */}
      <ThemedView transparant style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Account
        </ThemedText>
        {!isAuthenticated ? (
          <>
            <SettingsItem
              title="Login"
              subtitle="Sign in to access your account"
              icon="person.circle.fill"
              onPress={login}
              rightElement={
                isLoading ? (
                  <ActivityIndicator size="small" color={primaryColor} />
                ) : (
                  <IconSymbol
                    name="chevron.right"
                    size={20}
                    color={primaryColor}
                  />
                )
              }
            />
            {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
          </>
        ) : (
          <>
            <ThemedView
              transparant
              style={[
                styles.userInfoContainer,
                {
                  backgroundColor:
                    (themeColors as any)?.highlightBoxBg || "#00334C",
                },
              ]}
            >
              <IconSymbol
                name="person.circle.fill"
                size={48}
                color={primaryColor}
              />
              <ThemedView transparant style={styles.userInfoText}>
                <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
                {user?.firstName && (
                  <ThemedText style={styles.userName}>
                    {user.firstName} {user.lastName}
                  </ThemedText>
                )}
              </ThemedView>
            </ThemedView>
            <SettingsItem
              title="Logout"
              subtitle="Sign out of your account"
              icon="rectangle.portrait.and.arrow.right"
              onPress={logout}
              rightElement={
                isLoading ? (
                  <ActivityIndicator size="small" color={primaryColor} />
                ) : (
                  <IconSymbol
                    name="chevron.right"
                    size={20}
                    color={primaryColor}
                  />
                )
              }
            />
            {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
          </>
        )}
      </ThemedView>

      {/* Notifications Section */}
      <ThemedView transparant style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Notifications
        </ThemedText>
        <SettingsItem
          title="Notification Settings"
          subtitle={
            notificationStatus.loading
              ? "Checking permission status..."
              : notificationStatus.enabled
              ? "Enabled - Tap to change in system settings"
              : "Disabled - Tap to enable in system settings"
          }
          icon="bell.fill"
          onPress={handleOpenNotificationSettings}
          rightElement={
            <IconSymbol name="chevron.right" size={20} color={primaryColor} />
          }
        />

        {/* Show topics only if notifications are enabled */}
        {false &&
          notificationStatus.enabled &&
          topicSubscriptions.length > 0 && (
            <>
              <ThemedText style={styles.sectionDescription}>
                Choose which topics you want to receive notifications about
              </ThemedText>
              {topicSubscriptions.map((topic) => (
                <SettingsItem
                  key={topic.id}
                  title={topic.label}
                  subtitle={topic.description}
                  icon="tag.fill"
                  rightElement={
                    <Switch
                      value={topic.subscribed}
                      onValueChange={() =>
                        handleTopicToggle(topic.id, topic.subscribed)
                      }
                      trackColor={{ false: "#767577", true: primaryColor }}
                      thumbColor={topic.subscribed ? "#00334C" : "#fff"}
                    />
                  }
                />
              ))}
            </>
          )}
      </ThemedView>

      <ThemedView transparant style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Content
        </ThemedText>
        <SettingsItem
          title="Dark Mode"
          subtitle={
            mode === "auto"
              ? "Following system settings"
              : mode === "dark"
              ? "Always dark"
              : "Always light"
          }
          icon="moon.fill"
          rightElement={
            <Switch
              value={darkModeEnabled}
              onValueChange={async (value) => {
                // When toggled on, force dark mode
                // When toggled off, return to system settings (auto)
                await setMode(value ? "dark" : "auto");
              }}
              trackColor={{ false: "#767577", true: primaryColor }}
              thumbColor={darkModeEnabled ? "#00334C" : "#fff"}
            />
          }
        />
        <SettingsItem
          title="Reading Preferences"
          subtitle="Customize your reading experience"
          icon="textformat"
          onPress={() => {}}
        />
      </ThemedView>

      <ThemedView transparant style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Storage
        </ThemedText>
        <SettingsItem
          title="Clear Cache"
          subtitle={
            cacheStats
              ? `${cacheStats.totalKeys} cached items (${cacheStats.formattedSize})`
              : "Loading cache information..."
          }
          icon="trash.fill"
          onPress={handleClearCache}
        />
      </ThemedView>

      <ThemedView transparant style={styles.section}>
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
          onPress={() => {
            const termsUrl = brandConfig?.termsOfServiceUrl;
            if (termsUrl) {
              Linking.openURL(termsUrl);
            }
          }}
        />
        <SettingsItem
          title="Version"
          subtitle="1.0.0"
          icon="info.circle.fill"
        />
      </ThemedView>

      <ThemedView transparant style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Debug
        </ThemedText>
        <ThemedView>
          {/* Test Article Button */}
          {brandConfig?.testArticleId && (
            <SettingsItem
              title="Test Article"
              subtitle={`Open test article for ${brandConfig.displayName} (ID: ${brandConfig.testArticleId})`}
              icon="doc.text"
              onPress={handleTestArticle}
            />
          )}
          {/* Reset Onboarding Button */}
          <SettingsItem
            title="Reset Onboarding"
            subtitle="Clear onboarding flag to see the welcome flow again"
            icon="arrow.counterclockwise"
            onPress={handleResetOnboarding}
          />
          {/* Crashlytics Debug Button - Only in DEV mode */}
          {__DEV__ && (
            <SettingsItem
              title="Crashlytics Debug"
              subtitle="Test crash reporting and error logging"
              icon="flame.fill"
              onPress={() => {
                router.push("/debug-crashlytics");
                onClose?.();
              }}
            />
          )}
        </ThemedView>
        <SettingsItem
          title="Show Paywall"
          subtitle="Enable paywall for testing"
          icon="ladybug.fill"
          rightElement={
            <Switch
              value={showPaywall}
              onValueChange={handlePaywallToggle}
              trackColor={{ false: "#767577", true: primaryColor }}
              thumbColor={showPaywall ? "#00334C" : "#fff"}
            />
          }
        />
        <SettingsItem
          title="Force Landscape Images"
          subtitle="Use landscape images (post_image) in highlights carousel for testing fallback"
          icon="photo.fill"
          rightElement={
            <Switch
              value={forceLandscapeImages}
              onValueChange={handleForceLandscapeToggle}
              trackColor={{ false: "#767577", true: primaryColor }}
              thumbColor={forceLandscapeImages ? "#00334C" : "#fff"}
            />
          }
        />
        {/* <SettingsItem
          title="Use Color Gradient Background"
          subtitle="Use dominant color gradient instead of blurred image for landscape items"
          icon="paintpalette.fill"
          rightElement={
            <Switch
              value={useColorGradient}
              onValueChange={handleColorGradientToggle}
              trackColor={{ false: "#767577", true: primaryColor }}
              thumbColor={useColorGradient ? "#00334C" : "#fff"}
            />
          }
        /> */}
        {pushToken && (
          <SettingsItem
            title="Push Token"
            subtitle={`${pushToken.substring(0, 30)}...`}
            icon="key.fill"
            onPress={handleCopyPushToken}
          />
        )}
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
  sectionDescription: {
    fontSize: 14,
    opacity: 0.7,
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
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  userInfoText: {
    marginLeft: 16,
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    opacity: 0.7,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 8,
    marginLeft: 20,
  },
});
