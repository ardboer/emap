import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Dimensions,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface ImageViewerProps {
  visible: boolean;
  imageUri: string;
  caption?: string;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  imageUri,
  caption,
  onClose,
}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetTransform = () => {
    "worklet";
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = clamp(newScale, 0.5, 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      // Auto-reset if zoomed out too much
      if (scale.value < 1) {
        runOnJS(resetTransform)();
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow panning when zoomed in
      if (savedScale.value > 1) {
        const maxTranslateX = (screenWidth * (savedScale.value - 1)) / 2;
        const maxTranslateY = (screenHeight * (savedScale.value - 1)) / 2;

        translateX.value = clamp(
          savedTranslateX.value + event.translationX,
          -maxTranslateX,
          maxTranslateX
        );
        translateY.value = clamp(
          savedTranslateY.value + event.translationY,
          -maxTranslateY,
          maxTranslateY
        );
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        runOnJS(resetTransform)();
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, pinchGesture),
    panGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const handleClose = () => {
    resetTransform();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
        </SafeAreaView>

        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.imageContainer, animatedStyle]}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="contain"
              onError={(e) => console.log("Error loading fullscreen image:", e)}
            />
          </Animated.View>
        </GestureDetector>

        {caption && (
          <SafeAreaView style={styles.captionContainer}>
            <View style={styles.captionBackground}>
              <ThemedText style={styles.caption}>{caption}</ThemedText>
            </View>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 20,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    zIndex: 2,
  },
  imageContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  captionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  captionBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  caption: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
