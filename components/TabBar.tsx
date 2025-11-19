import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get("window");

interface TabBarProps {
  tabs: { id: string; title: string }[];
  activeTabIndex: number;
  onTabPress: (index: number) => void;
}

export default function TabBar({
  tabs,
  activeTabIndex,
  onTabPress,
}: TabBarProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [tabLayouts, setTabLayouts] = React.useState<
    { x: number; width: number }[]
  >([]);

  // Theme colors
  const primaryColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

  // Animated values for indicator
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  // Update indicator position when active tab changes
  useEffect(() => {
    if (tabLayouts.length > 0 && tabLayouts[activeTabIndex]) {
      const activeTab = tabLayouts[activeTabIndex];
      indicatorX.value = withSpring(activeTab.x, {
        damping: 20,
        stiffness: 90,
      });
      indicatorWidth.value = withSpring(activeTab.width, {
        damping: 20,
        stiffness: 90,
      });

      // Auto-scroll to keep active tab visible
      scrollViewRef.current?.scrollTo({
        x: Math.max(0, activeTab.x - screenWidth / 2 + activeTab.width / 2),
        animated: true,
      });
    }
  }, [activeTabIndex, tabLayouts]);

  // Handle tab layout measurements
  const handleTabLayout = (index: number, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => {
      const newLayouts = [...prev];
      newLayouts[index] = { x, width };
      return newLayouts;
    });
  };

  // Animated style for indicator
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorX.value }],
      width: indicatorWidth.value,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(index)}
            onLayout={(event) => handleTabLayout(index, event)}
            activeOpacity={0.7}
          >
            <ThemedText
              disableFontScaling
              style={[
                styles.tabText,
                {
                  color: index === activeTabIndex ? primaryColor : textColor,
                  opacity: index === activeTabIndex ? 1 : 0.6,
                },
              ]}
            >
              {tab.title}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: primaryColor },
          indicatorStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    minWidth: screenWidth,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
  },
});
