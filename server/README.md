# EMAP Brand Management Server

Backend API server for managing brands with CRUD operations and brand switching capabilities.

## Features

- ✅ Full CRUD operations for brands
- ✅ Brand switching with automatic config updates
- ✅ Asset management (logos, icons, splash screens)
- ✅ Prebuild script execution
- ✅ Dynamic brand discovery
- ✅ RESTful API design
- ✅ CORS enabled for web frontend
- ✅ File upload support

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Access to the parent project's `brands/` directory

## Installation

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3001` by default.

### Environment Variables

You can customize the server configuration using environment variables:

```bash
PORT=3001          # Server port (default: 3001)
HOST=localhost     # Server host (default: localhost)
```

Example:

```bash
PORT=4000 npm start
```

## API Documentation

### Base URL

```
http://localhost:3001
```

### Endpoints

#### Root Endpoint

```http
GET /
```

Returns API information and available endpoints.

#### Health Check

```http
GET /health
```

Returns server health status.

---

## Brand Management Endpoints

### List All Brands

```http
GET /api/brands
```

**Response:**

```json
{
  "success": true,
  "count": 3,
  "brands": [
    {
      "shortcode": "cn",
      "name": "Construction News",
      "displayName": "CN",
      "domain": "https://www.constructionnews.co.uk",
      ...
    }
  ]
}
```

### Get Brand Details

```http
GET /api/brands/:shortcode
```

**Parameters:**

- `shortcode` (path) - Brand shortcode (2-6 lowercase alphanumeric)

**Response:**

```json
{
  "success": true,
  "brand": {
    "shortcode": "cn",
    "name": "Construction News",
    ...
  }
}
```

### Create New Brand

```http
POST /api/brands
```

**Request Body:**

```json
{
  "shortcode": "test",
  "name": "Test Brand",
  "displayName": "Test",
  "domain": "https://test.example.com",
  "bundleId": "com.emap.test",
  "apiConfig": {
    "baseUrl": "https://test.example.com",
    "hash": "abc123"
  },
  "theme": {
    "colors": {
      "light": {
        "primary": "#007bff",
        "background": "#ffffff",
        "text": "#000000",
        "icon": "#666666",
        "tabIconDefault": "#999999",
        "tabIconSelected": "#007bff",
        "tabBarBackground": "#ffffff",
        "progressIndicator": "#007bff",
        "headerBackground": "#ffffff",
        "searchIcon": "#333333"
      },
      "dark": {
        "primary": "#007bff",
        "background": "#000000",
        "text": "#ffffff",
        "icon": "#cccccc",
        "tabIconDefault": "#999999",
        "tabIconSelected": "#007bff",
        "tabBarBackground": "#000000",
        "progressIndicator": "#007bff",
        "headerBackground": "#000000",
        "searchIcon": "#ffffff"
      }
    },
    "fonts": {
      "primary": "System",
      "secondary": "System"
    }
  },
  "branding": {
    "logo": "./logo.svg",
    "icon": "./assets/icon.png",
    "splash": "./assets/splash.png",
    "iconBackgroundColor": "#007bff"
  },
  "features": {
    "enablePodcasts": true,
    "enablePaper": true,
    "enableClinical": false,
    "enableEvents": true,
    "enableAsk": true,
    "enableMagazine": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Brand test created successfully",
  "brand": { ... }
}
```

### Update Brand

```http
PUT /api/brands/:shortcode
```

**Parameters:**

- `shortcode` (path) - Brand shortcode

**Request Body:** Same as Create Brand

**Response:**

```json
{
  "success": true,
  "message": "Brand test updated successfully",
  "brand": { ... }
}
```

### Delete Brand

```http
DELETE /api/brands/:shortcode
```

**Parameters:**

- `shortcode` (path) - Brand shortcode

**Response:**

```json
{
  "success": true,
  "message": "Brand test deleted successfully"
}
```

### Upload Brand Asset

```http
POST /api/brands/:shortcode/assets
```

**Parameters:**

- `shortcode` (path) - Brand shortcode

**Request:** `multipart/form-data`

- `file` (file) - Asset file to upload
- `filename` (string) - Target filename (optional)

**Allowed Filenames:**

- `logo.svg`
- `icon.png`
- `adaptive-icon.png`
- `favicon.png`
- `splash-icon.png`
- `icon-512.png`

**Example using curl:**

```bash
curl -X POST \
  http://localhost:3001/api/brands/cn/assets \
  -F "file=@/path/to/logo.svg" \
  -F "filename=logo.svg"
```

**Response:**

```json
{
  "success": true,
  "message": "Asset logo.svg uploaded successfully",
  "filename": "logo.svg"
}
```

### Get Brand Asset

```http
GET /api/brands/:shortcode/assets/:filename
```

**Parameters:**

- `shortcode` (path) - Brand shortcode
- `filename` (path) - Asset filename

**Response:** Binary file with appropriate content-type header

---

## System Operations Endpoints

### Get Active Brand

```http
GET /api/system/active-brand
```

**Response:**

```json
{
  "success": true,
  "activeBrand": "cn"
}
```

### Switch Active Brand

```http
POST /api/system/switch-brand
```

**Request Body:**

```json
{
  "shortcode": "nt",
  "runPrebuild": false
}
```

**Parameters:**

- `shortcode` (string, required) - Target brand shortcode
- `runPrebuild` (boolean, optional) - Whether to run prebuild script after switching (default: false)

**Response:**

```json
{
  "success": true,
  "message": "Brand switched to nt",
  "activeBrand": "nt",
  "brandConfig": { ... },
  "prebuildStarted": false
}
```

**What it does:**

1. Updates `config/brandKey.ts` with new ACTIVE_BRAND
2. Updates `app.json` with brand-specific configuration:
   - App name
   - Bundle identifiers (iOS/Android)
   - Icon paths
   - Splash screen configuration
   - Brand metadata
3. Optionally triggers prebuild script

### Run Prebuild Script

```http
POST /api/system/prebuild
```

**Request Body:**

```json
{
  "shortcode": "cn"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Prebuild started for brand cn",
  "brand": "cn"
}
```

**Note:** Prebuild runs asynchronously. Use the status endpoint to check progress.

### Get Prebuild Status

```http
GET /api/system/prebuild-status
```

**Response:**

```json
{
  "success": true,
  "status": {
    "running": false,
    "brand": "cn",
    "outputLines": 150,
    "error": null,
    "exitCode": 0,
    "output": ["...", "..."]
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `413` - Payload Too Large (file size limit exceeded)
- `500` - Internal Server Error

---

## Examples

### Example 1: List All Brands

```bash
curl http://localhost:3001/api/brands
```

### Example 2: Get Specific Brand

```bash
curl http://localhost:3001/api/brands/cn
```

### Example 3: Switch Brand

```bash
curl -X POST http://localhost:3001/api/system/switch-brand \
  -H "Content-Type: application/json" \
  -d '{"shortcode": "nt", "runPrebuild": false}'
```

### Example 4: Upload Logo

```bash
curl -X POST http://localhost:3001/api/brands/cn/assets \
  -F "file=@./logo.svg" \
  -F "filename=logo.svg"
```

### Example 5: Create New Brand

```bash
curl -X POST http://localhost:3001/api/brands \
  -H "Content-Type: application/json" \
  -d @new-brand-config.json
```

---

## Development

### Project Structure

```
server/
├── index.js                 # Main server file
├── package.json            # Dependencies
├── README.md              # This file
├── middleware/
│   └── validation.js      # Request validation
├── routes/
│   ├── brands.js         # Brand CRUD routes
│   └── system.js         # System operations routes
└── utils/
    └── brandOperations.js # Brand file operations
```

### Adding New Endpoints

1. Create route handler in appropriate file (`routes/brands.js` or `routes/system.js`)
2. Add validation middleware if needed
3. Implement business logic in `utils/brandOperations.js`
4. Update this README with endpoint documentation

### Testing

You can test the API using:

- **curl** (command line)
- **Postman** (GUI)
- **Thunder Client** (VS Code extension)
- **REST Client** (VS Code extension)

---

## Troubleshooting

### Server won't start

**Error:** `EADDRINUSE: address already in use`

**Solution:** Another process is using port 3001. Either:

- Stop the other process
- Use a different port: `PORT=3002 npm start`

### Cannot find brands directory

**Error:** `Failed to get brands: ENOENT`

**Solution:** Ensure you're running the server from the correct location and the `brands/` directory exists in the parent directory.

### File upload fails

**Error:** `File too large`

**Solution:** Files must be under 5MB. Compress or resize the file.

### Prebuild fails

**Error:** `Prebuild failed with exit code 1`

**Solution:** Check the prebuild output in the status endpoint. Common issues:

- Missing dependencies
- Invalid brand configuration
- Expo CLI not installed

---

## Security Notes

⚠️ **Important:** This server is designed for local development only.

For production use, you should:

- Add authentication/authorization
- Implement rate limiting
- Validate file uploads more strictly
- Use HTTPS
- Restrict CORS origins
- Add input sanitization
- Implement proper logging
- Add monitoring and alerting

---

## License

MIT

---

## Support

For issues or questions, please refer to the main project documentation or create an issue in the project repository.
