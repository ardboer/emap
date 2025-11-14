import { ThemedText } from "@/components/ThemedText";
import TopicsBottomSheet from "@/components/TopicsBottomSheet";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";
import { HierarchicalMenuItem, MenuItem } from "@/types";
import React, { useRef, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface TopicsTabBarProps {
  tabs: HierarchicalMenuItem[];
  activeParentIndex: number;
  activeChildId: string | null;
  expandedParentId: string | null;
  onParentTabChange: (index: number, item: HierarchicalMenuItem) => void;
  onChildTabChange: (
    childItem: HierarchicalMenuItem,
    parentIndex: number
  ) => void;
}

export default function TopicsTabBar({
  tabs,
  activeParentIndex,
  activeChildId,
  expandedParentId,
  onParentTabChange,
  onChildTabChange,
}: TopicsTabBarProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { brandConfig } = useBrandConfig();
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  // Get brand-aware colors for parent row
  const topicsBackground = useThemeColor({}, "topicsBackground");
  const activeTabBg = useThemeColor({}, "topicsActiveTab");
  const activeTextColor = useThemeColor({}, "topicsActiveText");
  const inactiveTextColor = useThemeColor({}, "topicsInactiveText");

  // Get brand-aware colors for child row
  const childRowBg = useThemeColor({}, "topicsChildBackground");
  const activeChildTabBg = useThemeColor({}, "topicsChildActiveTab");
  const activeChildTextColor = useThemeColor({}, "topicsChildActiveText");
  const inactiveChildTextColor = useThemeColor({}, "topicsChildInactiveText");

  // Get brand-specific font
  const fontFamily =
    brandConfig?.theme.fonts.primarySemiBold || "OpenSans-SemiBold";

  // Get currently expanded parent's children
  const expandedParent = tabs.find(
    (tab) => tab.ID.toString() === expandedParentId
  );
  const childItems = expandedParent?.children || [];

  // Determine if parent should be highlighted
  const isParentHighlighted = (
    index: number,
    tab: HierarchicalMenuItem
  ): boolean => {
    // Highlight if it's the active parent
    if (index === activeParentIndex) return true;

    // Highlight if one of its children is selected
    if (activeChildId && tab.children) {
      return tab.children.some(
        (child) => child.ID.toString() === activeChildId
      );
    }

    return false;
  };

  const handleParentPress = (index: number, item: HierarchicalMenuItem) => {
    if (item.hasChildren) {
      // Open bottom sheet instead of showing horizontal scroll
      setBottomSheetVisible(true);
    }
    onParentTabChange(index, item);
  };

  const handleChildPress = (childItem: MenuItem) => {
    onChildTabChange(childItem, activeParentIndex);
    setBottomSheetVisible(false);
  };

  // Get selected child name for display
  const getSelectedChildName = (): string | null => {
    if (!activeChildId || !expandedParent) return null;
    const selectedChild = expandedParent.children?.find(
      (child) => child.ID.toString() === activeChildId
    );
    return selectedChild?.title || null;
  };

  const selectedChildName = getSelectedChildName();

  return (
    <View style={styles.container}>
      {/* Parent Row */}
      <View style={[styles.parentRow, { backgroundColor: topicsBackground }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {tabs.map((tab, index) => {
            const isHighlighted = isParentHighlighted(index, tab);
            const isFirst = index === 0;

            return (
              <TouchableOpacity
                key={tab.ID}
                style={[
                  styles.tab,
                  isFirst ? styles.firstTab : styles.otherTab,
                  isHighlighted && [
                    styles.activeTab,
                    { backgroundColor: activeTabBg },
                  ],
                ]}
                onPress={() => handleParentPress(index, tab)}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.tabText,
                    { fontFamily },
                    {
                      color: isHighlighted
                        ? activeTextColor
                        : inactiveTextColor,
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

      {/* Selected Topic Indicator - Shows which child topic is selected */}
      {selectedChildName && (
        <View
          style={[styles.selectedTopicRow, { backgroundColor: childRowBg }]}
        >
          <ThemedText
            style={[styles.selectedTopicText, { fontFamily, color: "#FFFFFF" }]}
          >
            {selectedChildName}
          </ThemedText>
          <TouchableOpacity
            onPress={() => setBottomSheetVisible(true)}
            style={styles.changeTopicButton}
          >
            <ThemedText
              style={[
                styles.changeTopicButtonText,
                { color: inactiveChildTextColor },
              ]}
            >
              Change topic
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Sheet for Topic Selection */}
      <TopicsBottomSheet
        visible={bottomSheetVisible}
        topics={childItems}
        selectedTopicId={activeChildId}
        onSelectTopic={handleChildPress}
        onClose={() => setBottomSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No padding here - each row handles its own padding
  },
  parentRow: {
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
    paddingHorizontal: 8,
    lineHeight: 16,
    textAlign: "center",
  },
  selectedTopicRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedTopicText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  changeTopicButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  changeTopicButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
