import { Colors } from "@/constants/Colors";
import { useAudio } from "@/contexts/AudioContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Image } from "expo-image";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const { width, height } = Dimensions.get("window");

export function PodcastPlayer() {
  const { state, pauseAudio, resumeAudio, seekTo, hideFullscreenPlayer } =
    useAudio();
  const colorScheme = useColorScheme();

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (state.isPlaying) {
      pauseAudio();
    } else {
      resumeAudio();
    }
  };

  const handleSeek = (value: number) => {
    seekTo(value);
  };

  const handleClose = () => {
    hideFullscreenPlayer();
  };

  if (!state.showFullscreenPlayer || !state.currentEpisode) {
    return null;
  }

  return (
    <Modal
      visible={state.showFullscreenPlayer}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme].contentBackground },
        ]}
      >
        <ThemedView
          style={[
            styles.header,
            { backgroundColor: Colors[colorScheme].contentBackground },
          ]}
        >
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons
              name="chevron-down"
              size={28}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Now Playing</ThemedText>
          <View style={styles.placeholder} />
        </ThemedView>

        <ThemedView
          style={[
            styles.content,
            { backgroundColor: Colors[colorScheme].contentBackground },
          ]}
        >
          <ThemedView style={styles.artworkContainer}>
            <Image
              source={{ uri: state.currentEpisode.coverUrl }}
              style={styles.artwork}
              contentFit="cover"
            />
          </ThemedView>

          <ThemedView style={styles.episodeInfo}>
            <ThemedText style={styles.episodeTitle} numberOfLines={2}>
              {state.currentEpisode.title}
            </ThemedText>
            <ThemedText style={styles.episodeDescription} numberOfLines={3}>
              {state.currentEpisode.description}
            </ThemedText>
            <ThemedText style={styles.episodeDuration}>
              {state.currentEpisode.duration} •{" "}
              {state.currentEpisode.publishDate}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.progressContainer}>
            <Slider
              style={styles.progressSlider}
              minimumValue={0}
              maximumValue={state.duration}
              value={state.position}
              onSlidingComplete={handleSeek}
              minimumTrackTintColor={Colors[colorScheme ?? "light"].tint}
              maximumTrackTintColor={
                Colors[colorScheme ?? "light"].tabIconDefault
              }
              thumbTintColor={Colors[colorScheme ?? "light"].tint}
            />
            <View style={styles.timeContainer}>
              <ThemedText style={styles.timeText}>
                {formatTime(state.position)}
              </ThemedText>
              <ThemedText style={styles.timeText}>
                {formatTime(state.duration)}
              </ThemedText>
            </View>
          </ThemedView>

          <ThemedView style={styles.controls}>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons
                name="play-skip-back"
                size={32}
                color={Colors[colorScheme ?? "light"].text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.playButton,
                { backgroundColor: Colors[colorScheme ?? "light"].tint },
              ]}
              onPress={handlePlayPause}
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={Colors[colorScheme ?? "light"].background}
                />
              ) : (
                <Ionicons
                  name={state.isPlaying ? "pause" : "play"}
                  size={32}
                  color={Colors[colorScheme ?? "light"].background}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton}>
              <Ionicons
                name="play-skip-forward"
                size={32}
                color={Colors[colorScheme ?? "light"].text}
              />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  artworkContainer: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  artwork: {
    width: "100%",
    height: "100%",
  },
  episodeInfo: {
    alignItems: "center",
    marginBottom: 40,
    backgroundColor: "transparant",
    width: "100%",
  },
  episodeTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 30,
  },
  episodeDescription: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 8,
    lineHeight: 22,
  },
  episodeDuration: {
    fontSize: 14,
    opacity: 0.6,
  },
  progressContainer: {
    width: "100%",
    backgroundColor: "transparant",
    marginBottom: 0,
  },
  progressSlider: {
    width: "100%",
    backgroundColor: "transparant",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 12,
    opacity: 0.7,
  },
  controls: {
    flexDirection: "row",
    backgroundColor: "transparant",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
