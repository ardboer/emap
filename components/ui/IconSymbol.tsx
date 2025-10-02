// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Existing mappings
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",

  // Tab bar icon mappings
  "star.fill": "star",
  "newspaper.fill": "article",
  "heart.text.square.fill": "favorite",
  calendar: "event",
  "questionmark.circle.fill": "help",
  "doc.text.fill": "description",
  "mic.fill": "mic",
  "book.fill": "book", // Magazine tab icon

  // Settings screen icon mappings
  "person.fill": "person", // User/profile icon
  "bell.fill": "notifications", // Notifications
  "moon.fill": "nightlight-round", // Dark mode
  textformat: "text-format", // Reading preferences
  "list.bullet": "list", // Categories
  "trash.fill": "delete", // Clear cache
  "lock.fill": "lock", // Privacy
  "doc.text": "description", // Test article
  "info.circle.fill": "info", // Version info

  // UI control icons
  xmark: "close", // Close button
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
