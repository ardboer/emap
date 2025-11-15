import { ThemedText } from "@/components/ThemedText";
import TopicsBottomSheet from "@/components/TopicsBottomSheet";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFavoriteTopics } from "@/hooks/useFavoriteTopics";
import { useThemeColor } from "@/hooks/useThemeColor";
import { HierarchicalMenuItem, MenuItem } from "@/types";
import React, { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

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
  const { favoriteTopicIds } = useFavoriteTopics();
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const colorScheme = useColorScheme();

  // Get brand-aware colors for parent row
  const topicsBackground = useThemeColor({}, "topicsBackground");
  const activeTabBg = useThemeColor({}, "topicsChildBackground");
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

  // Find the first parent with children
  const firstParentWithChildren = useMemo(() => {
    return tabs.find((tab) => tab.hasChildren);
  }, [tabs]);

  // Build tabs with favorite topics inserted after first item, excluding parents with children
  const tabsWithFavorites = useMemo(() => {
    if (tabs.length === 0) return tabs;

    // Filter out tabs that have children (they'll be accessed via the icon button)
    const tabsWithoutChildren = tabs.filter((tab) => !tab.hasChildren);

    // Get all child topics from all parents
    const allChildTopics: MenuItem[] = [];
    tabs.forEach((tab) => {
      if (tab.children) {
        allChildTopics.push(...tab.children);
      }
    });

    // Filter to get only favorited child topics
    const favoriteTopics = allChildTopics.filter((topic) =>
      favoriteTopicIds.includes(topic.ID.toString())
    );

    if (favoriteTopics.length === 0) return tabsWithoutChildren;

    // Insert favorite topics after the first item
    const result = [...tabsWithoutChildren];
    favoriteTopics.forEach((favTopic, index) => {
      // Create a special menu item for each favorite
      const favoriteMenuItem: HierarchicalMenuItem = {
        ...favTopic,
        hasChildren: false,
        // Mark it as a favorite with a special prefix in the ID
        ID: Number(`9${favTopic.ID}`), // Prefix with 9 to make it unique
      };
      result.splice(1 + index, 0, favoriteMenuItem);
    });

    return result;
  }, [tabs, favoriteTopicIds]);

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
    // Convert MenuItem to HierarchicalMenuItem
    const hierarchicalChild: HierarchicalMenuItem = {
      ...childItem,
      hasChildren: false,
    };
    onChildTabChange(hierarchicalChild, activeParentIndex);
    setBottomSheetVisible(false);
  };

  // Handle icon button press - opens bottom sheet for first parent with children
  const handleIconPress = () => {
    if (firstParentWithChildren) {
      const parentIndex = tabs.findIndex(
        (tab) => tab.ID === firstParentWithChildren.ID
      );
      onParentTabChange(parentIndex, firstParentWithChildren);
      setBottomSheetVisible(true);
    }
  };

  // Check if icon should be highlighted (when a child of the parent with children is selected)
  const isIconHighlighted = useMemo(() => {
    if (!firstParentWithChildren || !activeChildId) return false;
    return (
      firstParentWithChildren.children?.some(
        (child) => child.ID.toString() === activeChildId
      ) || false
    );
  }, [firstParentWithChildren, activeChildId]);

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
          style={styles.scrollView}
        >
          {tabsWithFavorites.map((tab, index) => {
            const isHighlighted = isParentHighlighted(index, tab);
            const isFirst = index === 0;
            // Check if this is a favorite topic (ID starts with 9)
            const isFavoriteTopic = tab.ID.toString().startsWith("9");

            return (
              <TouchableOpacity
                key={tab.ID}
                style={[
                  styles.tab,
                  isFirst ? styles.firstTab : styles.otherTab,
                  isHighlighted && [
                    styles.activeTab,
                    { backgroundColor: activeTabBg },
                    // Only apply border radius in light mode
                    colorScheme === "light" && styles.activeTabLightMode,
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
                  {isFavoriteTopic && "★ "}
                  {tab.title.toUpperCase()}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Fixed Icon Button - Shows when there's a parent with children */}
        {firstParentWithChildren && (
          <TouchableOpacity
            style={[
              styles.iconButton,
              isIconHighlighted && [
                styles.iconButtonActive,
                { backgroundColor: activeTabBg },
              ],
            ]}
            onPress={handleIconPress}
            activeOpacity={0.7}
          >
            <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
              <Rect
                width={40}
                height={40}
                fill={isIconHighlighted ? activeTabBg : "#011620"}
              />
              <Path
                d="M10.625 13.75C10.625 13.5428 10.7073 13.3441 10.8538 13.1976C11.0003 13.0511 11.199 12.9688 11.4062 12.9688H28.5938C28.801 12.9688 28.9997 13.0511 29.1462 13.1976C29.2927 13.3441 29.375 13.5428 29.375 13.75C29.375 13.9572 29.2927 14.1559 29.1462 14.3024C28.9997 14.4489 28.801 14.5312 28.5938 14.5312H11.4062C11.199 14.5312 11.0003 14.4489 10.8538 14.3024C10.7073 14.1559 10.625 13.9572 10.625 13.75ZM11.4062 20.7812H28.5938C28.801 20.7812 28.9997 20.6989 29.1462 20.5524C29.2927 20.4059 29.375 20.2072 29.375 20C29.375 19.7928 29.2927 19.5941 29.1462 19.4476C28.9997 19.3011 28.801 19.2188 28.5938 19.2188H11.4062C11.199 19.2188 11.0003 19.3011 10.8538 19.4476C10.7073 19.5941 10.625 19.7928 10.625 20C10.625 20.2072 10.7073 20.4059 10.8538 20.5524C11.0003 20.6989 11.199 20.7812 11.4062 20.7812ZM21.5625 25.4688H11.4062C11.199 25.4688 11.0003 25.5511 10.8538 25.6976C10.7073 25.8441 10.625 26.0428 10.625 26.25C10.625 26.4572 10.7073 26.6559 10.8538 26.8024C11.0003 26.9489 11.199 27.0312 11.4062 27.0312H21.5625C21.7697 27.0312 21.9684 26.9489 22.1149 26.8024C22.2614 26.6559 22.3438 26.4572 22.3438 26.25C22.3438 26.0428 22.2614 25.8441 22.1149 25.6976C21.9684 25.5511 21.7697 25.4688 21.5625 25.4688ZM30.1562 25.4688H28.5938V23.9062C28.5938 23.699 28.5114 23.5003 28.3649 23.3538C28.2184 23.2073 28.0197 23.125 27.8125 23.125C27.6053 23.125 27.4066 23.2073 27.2601 23.3538C27.1136 23.5003 27.0312 23.699 27.0312 23.9062V25.4688H25.4688C25.2615 25.4688 25.0628 25.5511 24.9163 25.6976C24.7698 25.8441 24.6875 26.0428 24.6875 26.25C24.6875 26.4572 24.7698 26.6559 24.9163 26.8024C25.0628 26.9489 25.2615 27.0312 25.4688 27.0312H27.0312V28.5938C27.0312 28.801 27.1136 28.9997 27.2601 29.1462C27.4066 29.2927 27.6053 29.375 27.8125 29.375C28.0197 29.375 28.2184 29.2927 28.3649 29.1462C28.5114 28.9997 28.5938 28.801 28.5938 28.5938V27.0312H30.1562C30.3635 27.0312 30.5622 26.9489 30.7087 26.8024C30.8552 26.6559 30.9375 26.4572 30.9375 26.25C30.9375 26.0428 30.8552 25.8441 30.7087 25.6976C30.5622 25.5511 30.3635 25.4688 30.1562 25.4688Z"
                fill={inactiveTextColor}
              />
            </Svg>
          </TouchableOpacity>
        )}
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
    flexDirection: "row",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 0,
    paddingLeft: 16, // Aligns first item with content below
    paddingRight: 16, // Provides right edge padding
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
    // Border radius is conditionally applied via activeTabLightMode
  },
  activeTabLightMode: {
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
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconButtonActive: {
    // Background color applied via style prop
  },
});
