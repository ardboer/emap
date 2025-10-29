import { BrandConfig } from "@/brands";
import { brandManager } from "@/config/BrandManager";
import { useEffect, useState } from "react";

/**
 * Hook to access current brand configuration
 * Provides reactive access to brand settings throughout the app
 */
export function useBrandConfig() {
  // Initialize with current brand immediately to prevent flash
  const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(() => {
    try {
      return brandManager.getCurrentBrand();
    } catch (err) {
      console.error("Error loading initial brand configuration:", err);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify and update if needed
    const loadBrandConfig = async () => {
      try {
        const config = brandManager.getCurrentBrand();
        if (config !== brandConfig) {
          setBrandConfig(config);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load brand configuration"
        );
        console.error("Error loading brand configuration:", err);
      }
    };

    loadBrandConfig();
  }, []);

  /**
   * Switch to a different brand (useful for development/testing)
   */
  const switchBrand = async (shortcode: string) => {
    try {
      setLoading(true);
      setError(null);
      const config = brandManager.switchBrand(shortcode);
      setBrandConfig(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch brand");
      console.error("Error switching brand:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    brandConfig,
    loading,
    error,
    switchBrand,
    // Convenience accessors
    colors: brandConfig?.theme.colors,
    fonts: brandConfig?.theme.fonts,
    branding: brandConfig?.branding,
    apiConfig: brandConfig?.apiConfig,
    features: brandConfig?.features,
    paywall: brandConfig?.paywall,
    brandName: brandConfig?.displayName,
    shortcode: brandConfig?.shortcode,
  };
}

/**
 * Hook to get brand-specific asset paths
 */
export function useBrandAssets() {
  const { brandConfig } = useBrandConfig();

  const getAssetPath = (assetType: keyof BrandConfig["branding"]) => {
    if (!brandConfig) return null;
    return brandManager.getBrandAssetPath(assetType);
  };

  return {
    logoPath: getAssetPath("logo"),
    iconPath: getAssetPath("icon"),
    splashPath: getAssetPath("splash"),
    getAssetPath,
  };
}
