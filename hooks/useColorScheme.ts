import { useColorSchemeContext } from "@/contexts/ColorSchemeContext";

/**
 * Custom hook that returns the current color scheme.
 * This respects manual overrides set in the app settings.
 * Falls back to system color scheme when set to 'auto'.
 */
export function useColorScheme() {
  const { colorScheme } = useColorSchemeContext();
  return colorScheme;
}
