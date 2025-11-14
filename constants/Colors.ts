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
        searchIcon: "#B3F4FF",
        newsHeaderGradientStart: "#00334C",
        newsHeaderGradientEnd: "#011620",
        topicsBackground: "#00334C",
        topicsActiveTab: "#FFFFFF",
        topicsActiveText: "#00334C",
        topicsInactiveText: "#B3F4FF",
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
        searchIcon: "#B3F4FF",
        newsHeaderGradientStart: "#00334C",
        newsHeaderGradientEnd: "#011620",
        topicsBackground: "#00334C",
        topicsActiveTab: "#FFFFFF",
        topicsActiveText: "#00334C",
        topicsInactiveText: "#B3F4FF",
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
    searchIcon: brandColors.light.searchIcon,
    newsHeaderGradientStart:
      (brandColors.light as any).newsHeaderGradientStart || "#00334C",
    newsHeaderGradientEnd:
      (brandColors.light as any).newsHeaderGradientEnd || "#011620",
    topicsBackground: (brandColors.light as any).topicsBackground || "#00334C",
    topicsActiveTab: (brandColors.light as any).topicsActiveTab || "#011620",
    topicsActiveText: (brandColors.light as any).topicsActiveText || "#011620",
    topicsInactiveText:
      (brandColors.light as any).topicsInactiveText || "#B3F4FF",
    contentBackground:
      (brandColors.light as any).contentBackground || "#FFFFFF",
    contentTitleText: (brandColors.light as any).contentTitleText || "#00334C",
    contentBodyText: (brandColors.light as any).contentBodyText || "#011620",
    contentMetaText: (brandColors.light as any).contentMetaText || "#00334C",
    contentBackButtonBg:
      (brandColors.light as any).contentBackButtonBg || "#00334C",
    contentBackButtonText:
      (brandColors.light as any).contentBackButtonText || "#B3F4FF",
    highlightBoxBg: (brandColors.light as any).highlightBoxBg || "#00334C",
    highlightBoxText: (brandColors.light as any).highlightBoxText || "#FFFFFF",
    highlightBoxBorder:
      (brandColors.light as any).highlightBoxBorder || "#10D1F0",
    articleListBackground:
      (brandColors.light as any).articleListBackground || "#FFFFFF",
    articleTeaserTitleText:
      (brandColors.light as any).articleTeaserTitleText || "#00334C",
    linkColor: (brandColors.light as any).linkColor || "#FF0000",
    recommendedBadgeBg:
      (brandColors.light as any).recommendedBadgeBg ||
      "rgba(16, 209, 240, 0.9)",
  },
  dark: {
    text: brandColors.dark.text,
    background: brandColors.dark.background,
    tint: brandColors.dark.primary,
    icon: brandColors.dark.icon,
    tabIconDefault: brandColors.dark.tabIconDefault,
    tabIconSelected: brandColors.dark.tabIconSelected,
    headerBackground: brandColors.dark.headerBackground,
    searchIcon: brandColors.dark.searchIcon,
    newsHeaderGradientStart:
      (brandColors.dark as any).newsHeaderGradientStart || "#00334C",
    newsHeaderGradientEnd:
      (brandColors.dark as any).newsHeaderGradientEnd || "#011620",
    topicsBackground: (brandColors.dark as any).topicsBackground || "#00334C",
    topicsActiveTab: (brandColors.dark as any).topicsActiveTab || "#011620",
    topicsActiveText: (brandColors.dark as any).topicsActiveText || "#011620",
    topicsInactiveText:
      (brandColors.dark as any).topicsInactiveText || "#B3F4FF",
    contentBackground: (brandColors.dark as any).contentBackground || "#011620",
    contentTitleText: (brandColors.dark as any).contentTitleText || "#FFFFFF",
    contentBodyText: (brandColors.dark as any).contentBodyText || "#FFFFFF",
    contentMetaText: (brandColors.dark as any).contentMetaText || "#85E7F7",
    contentBackButtonBg:
      (brandColors.dark as any).contentBackButtonBg || "#00334C",
    contentBackButtonText:
      (brandColors.dark as any).contentBackButtonText || "#B3F4FF",
    highlightBoxBg: (brandColors.dark as any).highlightBoxBg || "#00334C",
    highlightBoxText: (brandColors.dark as any).highlightBoxText || "#FFFFFF",
    highlightBoxBorder:
      (brandColors.dark as any).highlightBoxBorder || "#10D1F0",
    articleListBackground:
      (brandColors.dark as any).articleListBackground || "#011620",
    articleTeaserTitleText:
      (brandColors.dark as any).articleTeaserTitleText || "#FFFFFF",
    linkColor: (brandColors.dark as any).linkColor || "#FF0000",
    recommendedBadgeBg:
      (brandColors.dark as any).recommendedBadgeBg || "rgba(16, 209, 240, 0.9)",
  },
};
