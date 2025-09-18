// Brand registry and management
export interface BrandConfig {
  shortcode: string;
  name: string;
  displayName: string;
  domain: string;
  apiConfig: {
    baseUrl: string;
    hash: string;
  };
  theme: {
    colors: {
      light: {
        primary: string;
        background: string;
        text: string;
        icon: string;
        tabIconDefault: string;
        tabIconSelected: string;
        tabBarBackground: string;
        progressIndicator: string;
      };
      dark: {
        primary: string;
        background: string;
        text: string;
        icon: string;
        tabIconDefault: string;
        tabIconSelected: string;
        tabBarBackground: string;
        progressIndicator: string;
      };
    };
    fonts: {
      primary: string;
      secondary: string;
    };
  };
  branding: {
    logo: string;
    icon: string;
    splash: string;
  };
  features: {
    enablePodcasts: boolean;
    enablePaper: boolean;
    enableClinical: boolean;
    enableEvents: boolean;
    enableAsk: boolean;
  };
}

// Available brands registry
export const AVAILABLE_BRANDS = {
  nt: () => require("./nt/config.json"),
  cn: () => require("./cn/config.json"),
  // Add more brands here as needed
} as const;

export type BrandShortcode = keyof typeof AVAILABLE_BRANDS;

// Validate shortcode format
export function validateShortcode(
  shortcode: string
): shortcode is BrandShortcode {
  return /^[a-z0-9]{2,6}$/.test(shortcode) && shortcode in AVAILABLE_BRANDS;
}

// Get list of all available brand shortcodes
export function getAvailableBrands(): BrandShortcode[] {
  return Object.keys(AVAILABLE_BRANDS) as BrandShortcode[];
}
