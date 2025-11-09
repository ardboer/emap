import { useEffect, useState } from "react";
import { Dimensions } from "react-native";

export interface CarouselState {
  currentIndex: number;
  isPlaying: boolean;
  isUserInteracting: boolean;
  isCarouselVisible: boolean;
  screenDimensions: { width: number; height: number };
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsUserInteracting: (interacting: boolean) => void;
  setIsCarouselVisible: (visible: boolean) => void;
}

/**
 * Custom hook to manage carousel state
 * Handles current index, play state, user interaction, and screen dimensions
 */
export function useCarouselState(): CarouselState {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isCarouselVisible, setIsCarouselVisible] = useState(true);

  // Make screen dimensions reactive to orientation changes
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });

  // Handle device orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      const { width, height } = window;
      setScreenDimensions({ width, height });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    currentIndex,
    isPlaying,
    isUserInteracting,
    isCarouselVisible,
    screenDimensions,
    setCurrentIndex,
    setIsPlaying,
    setIsUserInteracting,
    setIsCarouselVisible,
  };
}
