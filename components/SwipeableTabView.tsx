import React, { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get("window");

interface Tab {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface SwipeableTabViewProps {
  tabs: Tab[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
}

export default function SwipeableTabView({
  tabs,
  activeTabIndex,
  onTabChange,
}: SwipeableTabViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(activeTabIndex);

  // Animated value for smooth transitions
  const translateX = useSharedValue(-activeTabIndex * screenWidth);

  // Handle scroll events
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / screenWidth);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < tabs.length) {
      setCurrentIndex(newIndex);
      onTabChange(newIndex);
    }
  };

  // Programmatically scroll to tab (when tab bar is tapped)
  React.useEffect(() => {
    if (activeTabIndex !== currentIndex) {
      scrollViewRef.current?.scrollTo({
        x: activeTabIndex * screenWidth,
        animated: true,
      });
      setCurrentIndex(activeTabIndex);
    }
  }, [activeTabIndex]);

  // Animated style for smooth indicator movement
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(translateX.value, {
            damping: 20,
            stiffness: 90,
          }),
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab, index) => (
          <View key={tab.id} style={styles.tabContent}>
            {tab.content}
          </View>
        ))}
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
});
