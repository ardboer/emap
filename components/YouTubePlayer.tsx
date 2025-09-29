import { useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const { width: screenWidth } = Dimensions.get("window");

export type YouTubePlayerProps = {
  videoId: string;
  height?: number;
};

export function YouTubePlayerComponent({
  videoId,
  height = 220,
}: YouTubePlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleReady = () => {
    setLoading(false);
  };

  const handleError = (error: string) => {
    console.error("YouTube Player Error:", error);
    setError(true);
    setLoading(false);
  };

  if (error) {
    return (
      <ThemedView style={[styles.container, { height }]}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Unable to load video</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      <YoutubePlayer
        height={height}
        width={screenWidth - 32}
        videoId={videoId}
        onReady={handleReady}
        onError={handleError}
        initialPlayerParams={{
          preventFullScreen: false,
          controls: true,
          modestbranding: true,
          rel: false,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  errorText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
