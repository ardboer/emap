import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { ScrollView, StyleSheet, Switch, TouchableOpacity } from "react-native";

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const SettingsItem = ({
    title,
    subtitle,
    icon,
    onPress,
    rightElement,
  }: {
    title: string;
    subtitle?: string;
    icon: string;
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
        <ThemedText type="title" style={styles.screenTitle}>
          Settings
        </ThemedText>

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
    backgroundColor: "rgba(0,0,0,0.05)",
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
