import { useColorSchemeContext } from "@/contexts/ColorSchemeContext";
import { useEffect, useState } from "react";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 * This respects manual overrides set in the app settings.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { colorScheme } = useColorSchemeContext();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (hasHydrated) {
    return colorScheme;
  }

  return "light";
}
