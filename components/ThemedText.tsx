import { useMemo } from "react";
import {
  PixelRatio,
  StyleSheet,
  Text,
  useWindowDimensions,
  type TextProps,
} from "react-native";

import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const { fonts } = useBrandConfig();
  useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();
  // Memoize font family to prevent re-renders causing font flash
  // Get the brand's primary font, fallback to System if not specified
  const fontFamily = useMemo(() => {
    return fonts?.primary && fonts.primary !== "System"
      ? fonts.primary
      : undefined;
  }, [fonts?.primary]);

  // Memoize the combined style to prevent unnecessary recalculations
  const textStyle = useMemo(() => {
    return [
      { color },
      fontFamily ? { fontFamily } : undefined,
      type === "default" ? styles.default : undefined,
      type === "title" ? styles.title : undefined,
      type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
      type === "subtitle" ? styles.subtitle : undefined,
      type === "link" ? styles.link : undefined,
      style,
    ];
  }, [color, fontFamily, type, style, fontScale]);
  console.log("text rerender", fontScale, style?.fontSize);
  return (
    <Text
      style={[textStyle]}
      {...rest}
      allowFontScaling={true}
      key={fontScale.toString()}
      maxFontSizeMultiplier={1.25}
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
