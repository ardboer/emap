import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  type TextProps,
} from "react-native";

import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  disableFontScaling?: boolean;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  disableFontScaling = false,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const { fonts } = useBrandConfig();
  const { fontScale } = useWindowDimensions();
  // Memoize font family to prevent re-renders causing font flash
  // Get the brand's primary font, fallback to System if not specified
  const fontFamily = useMemo(() => {
    return fonts?.primary && fonts.primary !== "System"
      ? fonts.primary
      : undefined;
  }, [fonts?.primary]);

  // Memoize the combined style to prevent unnecessary recalculations
  const baseStyle =
    type === "default"
      ? styles.default
      : type === "title"
      ? styles.title
      : type === "defaultSemiBold"
      ? styles.defaultSemiBold
      : type === "subtitle"
      ? styles.subtitle
      : type === "link"
      ? styles.link
      : undefined;

  const baseFontSize = StyleSheet.flatten(style)?.fontSize ?? 16;
  const baseLineHeight = StyleSheet.flatten(style)?.lineHeight ?? 16;
  const clampedScale = Math.min(fontScale, 1.5);
  const scaledFontSize = baseFontSize * clampedScale;
  const scaledLineHeight = baseLineHeight * clampedScale;
  const textStyle = [
    { color },
    fontFamily ? { fontFamily } : undefined,
    type === "default" ? styles.default : undefined,
    type === "title" ? styles.title : undefined,
    type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
    type === "subtitle" ? styles.subtitle : undefined,
    type === "link" ? styles.link : undefined,
    style,
    {
      fontSize: disableFontScaling ? baseFontSize : scaledFontSize,
      lineHeight: disableFontScaling ? baseLineHeight : scaledLineHeight,
    },
  ];
  console.log("text rerender", fontScale, scaledFontSize);
  return (
    <Text
      style={[textStyle]}
      {...rest}
      allowFontScaling={false}
      key={scaledFontSize.toString()}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});
