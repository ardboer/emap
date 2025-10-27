// Brand registry and management
import { discoverBrandsSync, type BrandsRegistry } from "./brandDiscovery";

export interface MisoConfig {
  apiKey: string;
  publishableKey: string;
  brandFilter: string;
  endpoint: string;
}

export interface BrandConfig {
  shortcode: string;
  name: string;
  displayName: string;
  domain: string;
  bundleId?: string;
  apiConfig: {
    baseUrl: string;
    authUrl?: string;
    jwtSecret?: string;
    hash: string;
    authHash?: string;
    menuId?: number;
    maxNbOfItems?: number;
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
        headerBackground: string;
        searchIcon: string;
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
        headerBackground: string;
        searchIcon: string;
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
    iconBackgroundColor?: string;
  };
  features: {
    enablePodcasts: boolean;
    enablePaper: boolean;
    enableClinical: boolean;
    enableEvents: boolean;
    enableAsk: boolean;
    enableMagazine: boolean;
  };
  onboarding?: {
    editorQuote: string;
    editorImage?: string;
    editorName?: string;
    editorJobTitle?: string;
  };
  misoConfig?: MisoConfig;
  testArticleId?: string;
}

// Dynamically discover available brands from filesystem
// This replaces the hardcoded AVAILABLE_BRANDS object
let _cachedBrands: BrandsRegistry | null = null;

function getAvailableBrandsRegistry(): BrandsRegistry {
  if (!_cachedBrands) {
    _cachedBrands = discoverBrandsSync();

    // If discovery fails or returns empty, provide fallback to known brands
    if (Object.keys(_cachedBrands).length === 0) {
      console.warn(
        "⚠️ Brand discovery returned no brands, using fallback registry"
      );
      _cachedBrands = {
        nt: () => require("./nt/config.json"),
        cn: () => require("./cn/config.json"),
        jnl: () => require("./jnl/config.json"),
      };
    }
  }
  return _cachedBrands;
}

// Available brands registry - now dynamically populated
export const AVAILABLE_BRANDS = new Proxy({} as BrandsRegistry, {
  get(target, prop: string) {
    const registry = getAvailableBrandsRegistry();
    return registry[prop];
  },
  has(target, prop: string) {
    const registry = getAvailableBrandsRegistry();
    return prop in registry;
  },
  ownKeys(target) {
    const registry = getAvailableBrandsRegistry();
    return Object.keys(registry);
  },
  getOwnPropertyDescriptor(target, prop: string) {
    const registry = getAvailableBrandsRegistry();
    if (prop in registry) {
      return {
        enumerable: true,
        configurable: true,
      };
    }
    return undefined;
  },
});

// Type for brand shortcodes - now dynamically inferred
export type BrandShortcode = string;

// Validate shortcode format and existence
export function validateShortcode(
  shortcode: string
): shortcode is BrandShortcode {
  return /^[a-z0-9]{2,6}$/.test(shortcode) && shortcode in AVAILABLE_BRANDS;
}

// Get list of all available brand shortcodes
export function getAvailableBrands(): BrandShortcode[] {
  return Object.keys(getAvailableBrandsRegistry());
}

// Clear the cached brands registry (useful for testing)
export function clearBrandsCache(): void {
  _cachedBrands = null;
}
