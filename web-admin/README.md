# Brand Management Web Admin

A modern React-based web interface for managing multi-brand configurations in your application.

## Features

- 🎨 **Visual Brand Management** - View all brands in an intuitive card-based interface
- ✏️ **Easy Editing** - Create, edit, and delete brands with a user-friendly form
- 🔄 **Brand Switching** - Switch between brands with optional prebuild execution
- 📝 **JSON Configuration** - Advanced JSON editor for complete control over brand settings
- 🖼️ **Asset Management** - Upload and manage logos, icons, and other brand assets
- 🔔 **Push Credentials Verification** - Check and verify EAS push notification setup for each brand
- 🎯 **Active Brand Indicator** - Clear visual feedback showing which brand is currently active
- 📱 **Responsive Design** - Works seamlessly on desktop and tablet devices

## Prerequisites

- Node.js 16+ and npm
- Backend API server running on `http://localhost:3001`
- EAS CLI available via npx (for push credentials verification) - no global install needed

## Installation

1. Navigate to the web-admin directory:

```bash
cd web-admin
```

2. Install dependencies:

```bash
npm install
```

## Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
web-admin/
├── index.html              # Main HTML file
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.jsx           # Application entry point
│   ├── App.jsx            # Main application component
│   ├── styles.css         # Global styles
│   ├── components/
│   │   ├── BrandList.jsx      # Brand cards grid display
│   │   ├── BrandForm.jsx      # Create/edit brand form
│   │   ├── BrandSwitcher.jsx  # Brand switching modal
│   │   └── ConfigEditor.jsx   # JSON configuration editor
│   └── services/
│       └── api.js         # API client for backend communication
```

## Usage Guide

### Dashboard Overview

The dashboard displays:

- Header with active brand information
- Quick brand switcher button
- Grid of all available brands
- Add new brand button

### Creating a New Brand

1. Click the **"+ Add New Brand"** button
2. Fill in the basic information:
   - **Shortcode**: Unique identifier (e.g., `cn`, `nt`, `jnl`)
   - **Name**: Full brand name
   - **Display Name**: Name shown in the app
   - **Domain**: Brand website URL
3. Switch to the **Configuration** tab to edit the full JSON config
4. Switch to the **Assets** tab to upload:
   - Logo (SVG file)
   - Icon images (PNG files)
   - Favicon
   - Splash screen icon
5. Click **"Create Brand"** to save

### Editing a Brand

1. Click the **"Edit"** button on any brand card
2. Modify the information in any of the three tabs:
   - **Basic Info**: Core brand details
   - **Configuration**: Full JSON configuration
   - **Assets**: Upload new assets
3. Click **"Update Brand"** to save changes

### Switching Active Brand

**Method 1: From Brand Card**

1. Click the **"Switch"** button on the desired brand card
2. Confirm the switch in the modal
3. Optionally enable "Run prebuild script" to copy assets

**Method 2: From Header**

1. Click the **"Switch"** button in the header
2. Select the brand from the dropdown
3. Optionally enable "Run prebuild script"
4. Click **"Switch Brand"**

### Deleting a Brand

1. Click the **"Delete"** button on a brand card
2. Confirm the deletion in the dialog
3. Note: You cannot delete the currently active brand

### Verifying Push Credentials

1. Locate the brand card you want to check
2. Click the green **"Check Push"** button
3. The system will:
   - Run EAS CLI to verify push notification credentials
   - Update the brand's configuration with the result
   - Display a status badge (✓ configured or ✗ not configured)
4. The result is permanently stored in the brand's `config.json`

For detailed information about push credentials verification, see [PUSH_CREDENTIALS_GUIDE.md](./PUSH_CREDENTIALS_GUIDE.md).

## Configuration

### API Endpoint

The frontend connects to the backend API at `http://localhost:3001/api`. To change this:

1. Edit `src/services/api.js`
2. Update the `API_BASE_URL` constant:

```javascript
const API_BASE_URL = "http://your-api-url:port/api";
```

### Port Configuration

To change the development server port:

1. Edit `vite.config.js`
2. Update the `server.port` value:

```javascript
server: {
  port: 3000, // Change to your desired port
}
```

## Brand Configuration Schema

The brand configuration JSON supports the following structure:

```json
{
  "shortcode": "cn",
  "name": "Construction News",
  "displayName": "Construction News",
  "domain": "https://www.constructionnews.co.uk/",
  "bundleId": "metropolis.co.uk.constructionnews",
  "apiConfig": {
    "baseUrl": "https://www.constructionnews.co.uk",
    "hash": "...",
    "menuId": 103571
  },
  "theme": {
    "colors": {
      "light": {
        "primary": "#FFDD00",
        "background": "#fff",
        "text": "#11181C"
      },
      "dark": {
        "primary": "#FFDD00",
        "background": "#151718",
        "text": "#ECEDEE"
      }
    }
  },
  "branding": {
    "logo": "./logo.svg",
    "icon": "./assets/icon.png",
    "iconBackgroundColor": "#ffffff"
  },
  "features": {
    "enablePodcasts": true,
    "enableClinical": false,
    "enableEvents": true,
    "enableAsk": false,
    "enableMagazine": false
  }
}
```

## Troubleshooting

### Backend Connection Issues

If you see "Failed to load brands" errors:

1. Ensure the backend server is running on `http://localhost:3001`
2. Check that CORS is properly configured on the backend
3. Verify the API endpoints are accessible

### Asset Upload Issues

If asset uploads fail:

1. Ensure the backend has write permissions to the brands directory
2. Check file size limits (if any)
3. Verify file formats (SVG for logos, PNG for icons)

### JSON Configuration Errors

If you see "Invalid JSON" errors:

1. Check for syntax errors in the JSON editor
2. Ensure all required fields are present
3. Validate JSON structure using a JSON validator

## Development

### Adding New Features

1. Create new components in `src/components/`
2. Add API methods in `src/services/api.js`
3. Update the main `App.jsx` to integrate new features

### Styling

The application uses plain CSS with a modern design system. Styles are located in:

- `src/styles.css` - Global styles and component styles

To customize the theme:

1. Edit color variables in `styles.css`
2. Modify component-specific styles as needed

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Toastify** - Notifications
- **Monaco Editor** - JSON editor

## API Endpoints Used

The frontend communicates with these backend endpoints:

- `GET /api/brands` - Get all brands
- `GET /api/system/active-brand` - Get active brand
- `GET /api/brands/:shortcode` - Get specific brand
- `POST /api/brands` - Create new brand
- `PUT /api/brands/:shortcode` - Update brand
- `DELETE /api/brands/:shortcode` - Delete brand
- `POST /api/system/switch-brand` - Switch active brand
- `POST /api/brands/:shortcode/logo` - Upload logo
- `POST /api/brands/:shortcode/assets/:assetName` - Upload asset
- `GET /api/brands/:shortcode/logo` - Get logo
- `GET /api/brands/:shortcode/assets/:assetName` - Get asset

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the backend API documentation
3. Check browser console for error messages

## License

This project is part of the multi-brand application system.
