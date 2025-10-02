import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface TabItem {
  id: string;
  title: string;
}

interface SwipeableTabViewEnhancedProps {
  tabs: TabItem[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  renderTabContent: (tabIndex: number) => React.ReactNode;
  preloadAdjacentTabs?: boolean;
}

export default function SwipeableTabViewEnhanced({
  tabs,
  activeTabIndex,
  onTabChange,
  renderTabContent,
  preloadAdjacentTabs = true,
}: SwipeableTabViewEnhancedProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(activeTabIndex);
  const [renderedTabs, setRenderedTabs] = useState<Set<number>>(
    new Set([activeTabIndex])
  );
  const isScrolling = useRef(false);

  // Determine which tabs should be rendered
  const getTabsToRender = useCallback(
    (index: number): number[] => {
      const tabsToRender = [index];

      if (preloadAdjacentTabs) {
        // Add adjacent tabs for smooth swiping
        if (index > 0) tabsToRender.push(index - 1);
        if (index < tabs.length - 1) tabsToRender.push(index + 1);
      }

      return tabsToRender;
    },
    [tabs.length, preloadAdjacentTabs]
  );

  // Update rendered tabs when active tab changes
  useEffect(() => {
    const tabsToRender = getTabsToRender(activeTabIndex);
    setRenderedTabs((prev) => {
      const newSet = new Set(prev);
      tabsToRender.forEach((index) => newSet.add(index));
      return newSet;
    });
  }, [activeTabIndex, getTabsToRender]);

  // Handle scroll events
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / screenWidth);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < tabs.length) {
      setCurrentIndex(newIndex);

      // Add new tabs to render set
      const tabsToRender = getTabsToRender(newIndex);
      setRenderedTabs((prev) => {
        const newSet = new Set(prev);
        tabsToRender.forEach((index) => newSet.add(index));
        return newSet;
      });

      onTabChange(newIndex);
    }
  };

  // Handle scroll begin
  const handleScrollBeginDrag = () => {
    isScrolling.current = true;
  };

  // Handle scroll end
  const handleScrollEndDrag = () => {
    isScrolling.current = false;
  };

  // Programmatically scroll to tab (when tab bar is tapped)
  useEffect(() => {
    if (activeTabIndex !== currentIndex && !isScrolling.current) {
      scrollViewRef.current?.scrollTo({
        x: activeTabIndex * screenWidth,
        animated: true,
      });
      setCurrentIndex(activeTabIndex);
    }
  }, [activeTabIndex, currentIndex]);

  // Render tab content with lazy loading
  const renderTab = (index: number) => {
    const shouldRender = renderedTabs.has(index);

    return (
      <View key={tabs[index].id} style={styles.tabContent}>
        {shouldRender ? (
          renderTabContent(index)
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((_, index) => renderTab(index))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: "row",
  },
  tabContent: {
    width: screenWidth,
    flex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
