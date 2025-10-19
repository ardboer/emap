/**
 * EMAP Brand Management Server
 * Backend API for brand CRUD operations and brand switching
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// Import routes
const brandsRouter = require("./routes/brands");
const systemRouter = require("./routes/system");

// Initialize Express app
const app = express();

// Configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "localhost";

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api/brands", brandsRouter);
app.use("/api/system", systemRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "EMAP Brand Management API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      brands: {
        list: "GET /api/brands",
        get: "GET /api/brands/:shortcode",
        create: "POST /api/brands",
        update: "PUT /api/brands/:shortcode",
        delete: "DELETE /api/brands/:shortcode",
        uploadAsset: "POST /api/brands/:shortcode/assets",
        getAsset: "GET /api/brands/:shortcode/assets/:filename",
      },
      system: {
        activeBrand: "GET /api/system/active-brand",
        switchBrand: "POST /api/system/switch-brand",
        prebuild: "POST /api/system/prebuild",
        prebuildStatus: "GET /api/system/prebuild-status",
        health: "GET /api/system/health",
      },
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  // Handle multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: "File too large. Maximum size is 5MB",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log("");
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║   EMAP Brand Management Server                         ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📚 API Documentation: http://${HOST}:${PORT}/`);
  console.log(`💚 Health Check: http://${HOST}:${PORT}/health`);
  console.log("");
  console.log("Available Endpoints:");
  console.log("  Brand Management:");
  console.log(`    GET    http://${HOST}:${PORT}/api/brands`);
  console.log(`    GET    http://${HOST}:${PORT}/api/brands/:shortcode`);
  console.log(`    POST   http://${HOST}:${PORT}/api/brands`);
  console.log(`    PUT    http://${HOST}:${PORT}/api/brands/:shortcode`);
  console.log(`    DELETE http://${HOST}:${PORT}/api/brands/:shortcode`);
  console.log("");
  console.log("  System Operations:");
  console.log(`    GET    http://${HOST}:${PORT}/api/system/active-brand`);
  console.log(`    POST   http://${HOST}:${PORT}/api/system/switch-brand`);
  console.log(`    POST   http://${HOST}:${PORT}/api/system/prebuild`);
  console.log(`    GET    http://${HOST}:${PORT}/api/system/prebuild-status`);
  console.log("");
  console.log("Press Ctrl+C to stop the server");
  console.log("");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\nSIGINT signal received: closing HTTP server");
  process.exit(0);
});

module.exports = app;
