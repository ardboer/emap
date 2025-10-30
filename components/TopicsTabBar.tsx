import { ThemedText } from "@/components/ThemedText";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";
import React, { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface TabItem {
  id: string;
  title: string;
}

interface TopicsTabBarProps {
  tabs: TabItem[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
}

export default function TopicsTabBar({
  tabs,
  activeTabIndex,
  onTabChange,
}: TopicsTabBarProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { brandConfig } = useBrandConfig();

  // Get brand-aware colors
  const topicsBackground = useThemeColor({}, "topicsBackground");
  const activeTabBg = useThemeColor({}, "topicsActiveTab");
  const activeTextColor = useThemeColor({}, "topicsActiveText");
  const inactiveTextColor = useThemeColor({}, "topicsInactiveText");

  // Get brand-specific font
  const fontFamily =
    brandConfig?.theme.fonts.primarySemiBold || "OpenSans-SemiBold";

  // Auto-scroll to keep active tab visible
  useEffect(() => {
    // Scroll logic can be added here if needed
  }, [activeTabIndex]);

  const handleTabPress = (index: number) => {
    onTabChange(index);
  };

  return (
    <View style={[styles.container, { backgroundColor: topicsBackground }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab, index) => {
          const isActive = index === activeTabIndex;
          const isFirst = index === 0;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isFirst ? styles.firstTab : styles.otherTab,
                isActive && [
                  styles.activeTab,
                  { backgroundColor: activeTabBg },
                ],
              ]}
              onPress={() => handleTabPress(index)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  { fontFamily },
                  {
                    color: isActive ? activeTextColor : inactiveTextColor,
                  },
                ]}
              >
                {tab.title.toUpperCase()}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 0,
  },
  tab: {
    justifyContent: "center",
    alignItems: "center",
    minWidth: 60,
  },
  firstTab: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  otherTab: {
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  activeTab: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 12,
    textAlign: "center",
  },
});
