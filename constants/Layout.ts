import { brandManager } from "@/services/api";
import { Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

/**
 * Default maximum width for list content on tablets
 * This ensures content doesn't stretch too wide on large screens
 */
const DEFAULT_MAX_CONTENT_WIDTH = 800;

/**
 * Check if current device is likely a tablet based on screen width
 */
export const isTablet = screenWidth >= 768;

/**
 * Get the maximum content width from brand config or use default
 */
export const getMaxContentWidth = (): number => {
  const brandConfig = brandManager.getCurrentBrand();
  return brandConfig?.layout?.maxContentWidth ?? DEFAULT_MAX_CONTENT_WIDTH;
};

/**
 * Get centered container style for list views on tablets
 * Uses the maxContentWidth from brand config
 */
export const getCenteredContentStyle = () => {
  const maxContentWidth = getMaxContentWidth();
  if (isTablet && screenWidth > maxContentWidth) {
    return {
      alignSelf: "center" as const,
      width: maxContentWidth,
    };
  }
  return {};
};
