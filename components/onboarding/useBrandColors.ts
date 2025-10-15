import { useBrandConfig } from "@/hooks/useBrandConfig";

/**
 * Hook to get brand-specific colors for onboarding screens
 */
export function useBrandColors() {
  const { colors } = useBrandConfig();

  return {
    primaryColor: colors?.light.primary || "#0a7ea4",
    backgroundColor: colors?.light.background || "#fff",
    textColor: colors?.light.text || "#11181C",
  };
}
