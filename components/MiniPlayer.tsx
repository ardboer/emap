import { FadeInImage } from "@/components/FadeInImage";
import { Colors } from "@/constants/Colors";
import { useAudio } from "@/contexts/AudioContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const { width } = Dimensions.get("window");

export function MiniPlayer() {
  const {
    state,
    pauseAudio,
    resumeAudio,
    showFullscreenPlayer,
    closeMiniPlayer,
  } = useAudio();
  const colorScheme = useColorScheme();

  const handlePlayPause = () => {
    if (state.isPlaying) {
      pauseAudio();
    } else {
      resumeAudio();
    }
  };

  const handlePlayerPress = () => {
    showFullscreenPlayer();
  };

  const handleClose = () => {
    closeMiniPlayer();
  };

  if (!state.showMiniPlayer || !state.currentEpisode) {
    return null;
  }

  const progressPercentage =
    state.duration > 0 ? (state.position / state.duration) * 100 : 0;

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: Colors[colorScheme ?? "light"].contentBackground,
          borderTopColor: Colors[colorScheme ?? "light"].tabIconDefault,
        },
      ]}
    >
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progressPercentage}%`,
              backgroundColor: Colors[colorScheme ?? "light"].tint,
            },
          ]}
        />
      </View>

      <TouchableOpacity
        style={styles.playerContent}
        onPress={handlePlayerPress}
        activeOpacity={0.8}
      >
        <View style={styles.leftContent}>
          <FadeInImage
            source={{ uri: state.currentEpisode.coverUrl }}
            style={styles.artwork}
            contentFit="cover"
          />
          <View style={styles.episodeInfo}>
            <ThemedText style={styles.episodeTitle} numberOfLines={1}>
              {state.currentEpisode.title}
            </ThemedText>
            <ThemedText style={styles.episodeDuration} numberOfLines={1}>
              {state.currentEpisode.duration}
            </ThemedText>
          </View>
        </View>

        <View style={styles.rightContent}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            disabled={state.isLoading}
          >
            {state.isLoading ? (
              <ActivityIndicator
                size="small"
                color={Colors[colorScheme ?? "light"].text}
              />
            ) : (
              <Ionicons
                name={state.isPlaying ? "pause" : "play"}
                size={24}
                color={Colors[colorScheme ?? "light"].text}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons
              name="close"
              size={20}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 83, // Height of tab bar + some padding
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: "rgba(0,0,0,0.1)",
    width: "100%",
  },
  progressBar: {
    height: "100%",
  },
  playerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 42,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  artwork: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: 8,
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 1,
  },
  episodeDuration: {
    fontSize: 11,
    opacity: 0.7,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playButton: {
    padding: 6,
  },
  closeButton: {
    padding: 6,
  },
});
