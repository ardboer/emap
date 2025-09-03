import { PodcastEpisode } from "@/types";
import { Audio } from "expo-av";
import React, { createContext, useContext, useReducer, useRef } from "react";

interface AudioState {
  currentEpisode: PodcastEpisode | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  showFullscreenPlayer: boolean;
  showMiniPlayer: boolean;
}

type AudioAction =
  | { type: "SET_EPISODE"; payload: PodcastEpisode }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_POSITION"; payload: number }
  | { type: "SET_DURATION"; payload: number }
  | { type: "SHOW_FULLSCREEN_PLAYER" }
  | { type: "HIDE_FULLSCREEN_PLAYER" }
  | { type: "SHOW_MINI_PLAYER" }
  | { type: "HIDE_MINI_PLAYER" }
  | { type: "RESET" };

const initialState: AudioState = {
  currentEpisode: null,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  showFullscreenPlayer: false,
  showMiniPlayer: false,
};

function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case "SET_EPISODE":
      return { ...state, currentEpisode: action.payload };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_POSITION":
      return { ...state, position: action.payload };
    case "SET_DURATION":
      return { ...state, duration: action.payload };
    case "SHOW_FULLSCREEN_PLAYER":
      return { ...state, showFullscreenPlayer: true };
    case "HIDE_FULLSCREEN_PLAYER":
      return { ...state, showFullscreenPlayer: false };
    case "SHOW_MINI_PLAYER":
      return { ...state, showMiniPlayer: true };
    case "HIDE_MINI_PLAYER":
      return { ...state, showMiniPlayer: false };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

interface AudioContextType {
  state: AudioState;
  playEpisode: (episode: PodcastEpisode) => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  showFullscreenPlayer: () => void;
  hideFullscreenPlayer: () => void;
  closeMiniPlayer: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  const soundRef = useRef<Audio.Sound | null>(null);
  const positionUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const updatePosition = async () => {
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.positionMillis !== undefined) {
          dispatch({ type: "SET_POSITION", payload: status.positionMillis });
          if (status.durationMillis !== undefined) {
            dispatch({ type: "SET_DURATION", payload: status.durationMillis });
          }
        }
      } catch (error) {
        console.error("Error updating position:", error);
      }
    }
  };

  const startPositionUpdates = () => {
    if (positionUpdateInterval.current) {
      clearInterval(positionUpdateInterval.current);
    }
    positionUpdateInterval.current = setInterval(updatePosition, 1000);
  };

  const stopPositionUpdates = () => {
    if (positionUpdateInterval.current) {
      clearInterval(positionUpdateInterval.current);
      positionUpdateInterval.current = null;
    }
  };

  const playEpisode = async (episode: PodcastEpisode) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Stop current audio if playing
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        stopPositionUpdates();
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load and play new audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: episode.audioUrl },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      dispatch({ type: "SET_EPISODE", payload: episode });
      dispatch({ type: "SET_PLAYING", payload: true });
      dispatch({ type: "SHOW_FULLSCREEN_PLAYER" });
      dispatch({ type: "SET_LOADING", payload: false });

      startPositionUpdates();

      // Set up playback status update
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          dispatch({ type: "SET_PLAYING", payload: status.isPlaying || false });
          if (status.positionMillis !== undefined) {
            dispatch({ type: "SET_POSITION", payload: status.positionMillis });
          }
          if (status.durationMillis !== undefined) {
            dispatch({ type: "SET_DURATION", payload: status.durationMillis });
          }
          if (status.didJustFinish) {
            dispatch({ type: "SET_PLAYING", payload: false });
            dispatch({ type: "SET_POSITION", payload: 0 });
            stopPositionUpdates();
          }
        }
      });
    } catch (error) {
      console.error("Error playing episode:", error);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const pauseAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        stopPositionUpdates();
      } catch (error) {
        console.error("Error pausing audio:", error);
      }
    }
  };

  const resumeAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.playAsync();
        startPositionUpdates();
      } catch (error) {
        console.error("Error resuming audio:", error);
      }
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        stopPositionUpdates();
        dispatch({ type: "RESET" });
      } catch (error) {
        console.error("Error stopping audio:", error);
      }
    }
  };

  const seekTo = async (position: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(position);
      } catch (error) {
        console.error("Error seeking:", error);
      }
    }
  };

  const showFullscreenPlayer = () => {
    dispatch({ type: "SHOW_FULLSCREEN_PLAYER" });
  };

  const hideFullscreenPlayer = () => {
    dispatch({ type: "HIDE_FULLSCREEN_PLAYER" });
    if (state.currentEpisode) {
      dispatch({ type: "SHOW_MINI_PLAYER" });
    }
  };

  const closeMiniPlayer = () => {
    dispatch({ type: "HIDE_MINI_PLAYER" });
    stopAudio();
  };

  return (
    <AudioContext.Provider
      value={{
        state,
        playEpisode,
        pauseAudio,
        resumeAudio,
        stopAudio,
        seekTo,
        showFullscreenPlayer,
        hideFullscreenPlayer,
        closeMiniPlayer,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
