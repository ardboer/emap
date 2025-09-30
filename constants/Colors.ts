/**
 * Brand-aware colors that are loaded from the active brand configuration.
 * Colors are defined in the light and dark mode and loaded dynamically.
 */

import { brandManager } from "@/config/BrandManager";

// Get colors from active brand configuration
function getBrandColors() {
  try {
    const themeConfig = brandManager.getThemeConfig();
    return themeConfig.colors;
  } catch (error) {
    console.warn("Failed to load brand colors, using fallback:", error);
    // Fallback colors if brand loading fails
    return {
      light: {
        primary: "#0a7ea4",
        background: "#fff",
        text: "#11181C",
        icon: "#687076",
        tabIconDefault: "#687076",
        tabIconSelected: "#0a7ea4",
        tabBarBackground: "#fff",
        progressIndicator: "#0a7ea4",
        headerBackground: "#fff",
      },
      dark: {
        primary: "#fff",
        background: "#151718",
        text: "#ECEDEE",
        icon: "#9BA1A6",
        tabIconDefault: "#9BA1A6",
        tabIconSelected: "#fff",
        tabBarBackground: "#151718",
        progressIndicator: "#fff",
        headerBackground: "#151718",
      },
    };
  }
}

const brandColors = getBrandColors();

export const Colors = {
  light: {
    text: brandColors.light.text,
    background: brandColors.light.background,
    tint: brandColors.light.primary,
    icon: brandColors.light.icon,
    tabIconDefault: brandColors.light.tabIconDefault,
    tabIconSelected: brandColors.light.tabIconSelected,
    headerBackground: brandColors.light.headerBackground,
  },
  dark: {
    text: brandColors.dark.text,
    background: brandColors.dark.background,
    tint: brandColors.dark.primary,
    icon: brandColors.dark.icon,
    tabIconDefault: brandColors.dark.tabIconDefault,
    tabIconSelected: brandColors.dark.tabIconSelected,
    headerBackground: brandColors.dark.headerBackground,
  },
};
