# Multi-Brand News App Architecture

This codebase supports multiple news brands using the same WordPress CMS and API structure. Each brand can have its own configuration, colors, fonts, logos, and API settings.

## Architecture Overview

### Brand Configuration System

- **Brands Directory**: `brands/` contains all brand-specific configurations
- **Shortcodes**: Each brand uses a 2-6 character alphanumeric shortcode (e.g., `nt` for Nursing Times)
- **Configuration Files**: Each brand has a `config.json` with theme, API, and branding settings
- **Assets**: Brand-specific logos, icons, and images are stored in each brand's assets folder

### Directory Structure

```
brands/
├── index.ts              # Brand registry and validation
├── nt/                   # Nursing Times brand
│   ├── config.json       # Brand configuration
│   ├── logo.svg          # Brand logo (source for all assets)
│   └── assets/           # Auto-generated brand assets (24 total)
│       ├── icon.png      # Main app icon (512×512)
│       ├── adaptive-icon.png  # Android adaptive icon
│       ├── favicon.png   # Web favicon (32×32)
│       ├── splash-icon.png    # Splash screen icon
│       └── icon-512.png  # Google Play Store icon
└── [brand-shortcode]/    # Additional brands...
    ├── config.json
    ├── logo.svg          # Brand logo SVG
    └── assets/           # Auto-generated assets
```

### SVG-Based Asset Generation

The system automatically generates **24 platform-specific assets** from a single `logo.svg` file:

- **iOS**: 6 app icon sizes + 3 splash logo scales
- **Android**: Play Store icon + 5 mipmap densities + 5 drawable densities
- **Web/Expo**: favicon, main icon, adaptive icon, splash icon

All assets are generated during the prebuild process with automatic validation and quality checks.

📖 **[Complete SVG Asset Generation Guide](docs/svg-asset-generation-guide.md)**

## Adding a New Brand

### 1. Create Brand Directory

```bash
mkdir brands/[shortcode]
mkdir brands/[shortcode]/assets
```

### 2. Create Configuration File

Create `brands/[shortcode]/config.json`:

```json
{
  "shortcode": "shortcode",
  "name": "Brand Name",
  "displayName": "Brand Display Name",
  "domain": "example.com",
  "apiConfig": {
    "baseUrl": "https://www.example.com",
    "hash": "your-api-hash"
  },
  "theme": {
    "colors": {
      "light": {
        "primary": "#0a7ea4",
        "background": "#fff",
        "text": "#11181C",
        "icon": "#687076",
        "tabIconDefault": "#687076",
        "tabIconSelected": "#0a7ea4"
      },
      "dark": {
        "primary": "#fff",
        "background": "#151718",
        "text": "#ECEDEE",
        "icon": "#9BA1A6",
        "tabIconDefault": "#9BA1A6",
        "tabIconSelected": "#fff"
      }
    },
    "fonts": {
      "primary": "System",
      "secondary": "System"
    }
  },
  "branding": {
    "logo": "./assets/logo.png",
    "icon": "./assets/icon.png",
    "splash": "./assets/splash.png"
  }
}
```

### 3. Add Assets

Place brand-specific assets in `brands/[shortcode]/assets/`:

- `logo.png` - Main brand logo
- `icon.png` - App icon
- `splash.png` - Splash screen image

### 4. Register Brand

Add the new brand to `brands/index.ts`:

```typescript
export const AVAILABLE_BRANDS = {
  nt: () => require("./nt/config.json"),
  [shortcode]: () => require("./[shortcode]/config.json"),
  // Add more brands here
} as const;
```

## Brand Switching

### Environment Variable (Build-time)

Set the `EXPO_PUBLIC_BRAND` environment variable:

```bash
# .env file
EXPO_PUBLIC_BRAND=nt

# Or command line
EXPO_PUBLIC_BRAND=nt npm start
```

### Runtime Switching (Development)

Use the Brand Switcher component in the Settings page (only visible in development mode):

1. Open the app
2. Navigate to Settings
3. Find the "Development" section
4. Use the Brand Switcher to change brands

## Using Brand Configuration in Components

### Using the Hook

```typescript
import { useBrandConfig } from "@/hooks/useBrandConfig";

function MyComponent() {
  const { brandConfig, colors, brandName, loading } = useBrandConfig();

  if (loading) return <LoadingSpinner />;

  return (
    <View style={{ backgroundColor: colors?.light.background }}>
      <Text>{brandName}</Text>
    </View>
  );
}
```

### Using Brand Manager Directly

```typescript
import { brandManager } from "@/config/BrandManager";

// Get current brand
const brand = brandManager.getCurrentBrand();

// Get API config
const apiConfig = brandManager.getApiConfig();

// Get theme colors
const themeConfig = brandManager.getThemeConfig();
```

### Accessing Brand Assets

```typescript
import { useBrandAssets } from "@/hooks/useBrandConfig";

function LogoComponent() {
  const { logoPath } = useBrandAssets();

  return <Image source={{ uri: logoPath }} />;
}
```

## Key Features

### ✅ Implemented

- **Brand Configuration System**: Complete JSON-based configuration
- **Shortcode Validation**: Ensures safe, consistent brand identifiers
- **Dynamic Theming**: Colors and fonts loaded from brand config
- **API Integration**: Brand-aware WordPress API calls
- **Asset Management**: Brand-specific logos, icons, and images
- **Development Tools**: Runtime brand switching for testing
- **Environment Support**: Build-time brand selection via environment variables
- **Type Safety**: Full TypeScript support with proper interfaces

### 🔧 Architecture Benefits

- **Single Codebase**: One app supports unlimited brands
- **Easy Deployment**: Switch brands via environment variable
- **Scalable**: Add new brands without touching core code
- **Maintainable**: Clean separation of brand-specific and shared code
- **Developer Friendly**: Runtime switching for easy testing

## Development Workflow

### Testing Multiple Brands

1. Create configurations for different brands
2. Use the Brand Switcher in Settings to test different brands
3. Verify colors, API calls, and assets load correctly
4. Test both light and dark themes

### Deployment

1. Set `EXPO_PUBLIC_BRAND` environment variable to desired brand
2. Build and deploy as normal
3. Each deployment will use the specified brand configuration

## Troubleshooting

### Brand Not Loading

- Check shortcode format (2-6 lowercase alphanumeric characters)
- Verify brand is registered in `brands/index.ts`
- Ensure `config.json` is valid JSON
- Check console for error messages

### Assets Not Displaying

- Verify asset paths in brand configuration
- Ensure assets exist in `brands/[shortcode]/assets/`
- Check file permissions and naming

### API Errors

- Verify `baseUrl` and `hash` in brand's `apiConfig`
- Test API endpoints manually
- Check network connectivity and CORS settings

## API Architecture

The app uses a **modular API architecture** organized by domain:

```
services/api/
├── index.ts              # Main barrel export (backward compatible)
├── types.ts              # Shared type definitions
├── wordpress/            # WordPress CMS API
│   ├── articles.ts       # Article fetching & management
│   ├── content.ts        # Content parsing & transformation
│   ├── media.ts          # Media URL resolution
│   ├── menu.ts           # Navigation & menus
│   ├── events.ts         # Events management
│   ├── clinical.ts       # Clinical posts
│   ├── search.ts         # Search functionality
│   └── category.ts       # Category content
├── miso/                 # AI-powered recommendations
│   ├── highlights.ts     # Highlights generation
│   ├── recommended.ts    # Recommended articles
│   ├── related.ts        # Related content
│   └── trending.ts       # Trending articles
├── magazine/             # Digital magazine/ePaper
│   ├── editions.ts       # Edition management
│   └── articles.ts       # Magazine articles
└── utils/                # Shared utilities
    ├── formatters.ts     # Date & text formatting
    ├── parsers.ts        # HTML parsing & sanitization
    ├── transformers.ts   # Content transformation
    └── validators.ts     # Data validation
```

### Using the API

**Option 1: Import from main barrel (recommended for compatibility)**

```typescript
import { fetchArticles, fetchSingleArticle } from "@/services/api";
```

**Option 2: Import from specific modules (better tree-shaking)**

```typescript
import { fetchArticles } from "@/services/api/wordpress";
import { fetchHighlights } from "@/services/api/miso";
import { fetchEditions } from "@/services/api/magazine";
```

📖 **[Complete API Refactoring Documentation](docs/api-refactoring-complete.md)**

## Example Brands

### Nursing Times (nt)

- **Domain**: nursingtimes.net
- **Colors**: Blue theme (#0a7ea4)
- **API**: WordPress with structured content

### Adding More Brands

Follow the same pattern as Nursing Times:

1. Create shortcode (e.g., `hm` for Health Magazine)
2. Set up configuration with appropriate colors and API settings
3. Add brand-specific assets
4. Register in the brand registry
5. Test with Brand Switcher

This architecture allows unlimited brands while maintaining a single, maintainable codebase.
