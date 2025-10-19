# Quick Start Guide

## Installation & Setup

1. **Install dependencies:**

   ```bash
   cd server
   npm install
   ```

2. **Start the server:**

   ```bash
   npm start
   ```

   The server will start at `http://localhost:3001`

## Quick Test Commands

### List all brands

```bash
curl http://localhost:3001/api/brands
```

### Get specific brand

```bash
curl http://localhost:3001/api/brands/cn
```

### Get active brand

```bash
curl http://localhost:3001/api/system/active-brand
```

### Switch brand (without prebuild)

```bash
curl -X POST http://localhost:3001/api/system/switch-brand \
  -H "Content-Type: application/json" \
  -d '{"shortcode": "cn", "runPrebuild": false}'
```

### Health check

```bash
curl http://localhost:3001/health
```

## Common Operations

### Create a new brand

```bash
curl -X POST http://localhost:3001/api/brands \
  -H "Content-Type: application/json" \
  -d @new-brand-config.json
```

### Update brand configuration

```bash
curl -X PUT http://localhost:3001/api/brands/cn \
  -H "Content-Type: application/json" \
  -d @updated-config.json
```

### Upload brand logo

```bash
curl -X POST http://localhost:3001/api/brands/cn/assets \
  -F "file=@./logo.svg" \
  -F "filename=logo.svg"
```

### Delete a brand

```bash
curl -X DELETE http://localhost:3001/api/brands/test
```

## Development Tips

- Use `npm run dev` for auto-reload during development
- Check server logs in the terminal for debugging
- API documentation available at `http://localhost:3001/`
- Full documentation in `README.md`

## Troubleshooting

**Port already in use?**

```bash
PORT=3002 npm start
```

**Need to see what's running?**

```bash
lsof -i :3001
```

For more details, see the full [README.md](./README.md)
