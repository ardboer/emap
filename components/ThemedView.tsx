import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  transparant?: boolean;
};

export function ThemedView({
  transparant,
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    {
      light: transparant ? "transparent" : lightColor,
      dark: transparant ? "transparent" : darkColor,
    },
    "background"
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
