import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

type ColorScheme = "light" | "dark";
type ColorSchemeMode = "auto" | "light" | "dark";

interface ColorSchemeContextType {
  colorScheme: ColorScheme;
  mode: ColorSchemeMode;
  setMode: (mode: ColorSchemeMode) => Promise<void>;
  isLoading: boolean;
}

const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(
  undefined
);

const STORAGE_KEY = "app_color_scheme_mode";

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [mode, setModeState] = useState<ColorSchemeMode>("auto");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preference on mount
  useEffect(() => {
    loadColorSchemeMode();
  }, []);

  const loadColorSchemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
      if (
        savedMode === "light" ||
        savedMode === "dark" ||
        savedMode === "auto"
      ) {
        setModeState(savedMode);
      }
    } catch (error) {
      console.error("Error loading color scheme mode:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setMode = async (newMode: ColorSchemeMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newMode);
      setModeState(newMode);
    } catch (error) {
      console.error("Error saving color scheme mode:", error);
    }
  };

  // Determine the actual color scheme to use
  const colorScheme: ColorScheme =
    mode === "auto"
      ? systemColorScheme ?? "light"
      : mode === "dark"
      ? "dark"
      : "light";

  return (
    <ColorSchemeContext.Provider
      value={{ colorScheme, mode, setMode, isLoading }}
    >
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorSchemeContext() {
  const context = useContext(ColorSchemeContext);
  if (context === undefined) {
    throw new Error(
      "useColorSchemeContext must be used within a ColorSchemeProvider"
    );
  }
  return context;
}
