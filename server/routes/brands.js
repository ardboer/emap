/**
 * Brand Management Routes
 * Handles CRUD operations for brands
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  validateShortcode,
  validateBrandConfig,
  validateFileUpload,
} = require("../middleware/validation");
const {
  getAllBrands,
  getBrand,
  brandExists,
  createBrand,
  updateBrand,
  deleteBrand,
  saveBrandAsset,
  getBrandAsset,
} = require("../utils/brandOperations");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/svg+xml", "image/png", "image/jpeg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only SVG, PNG, and JPEG are allowed."));
    }
  },
});

/**
 * GET /api/brands
 * List all brands
 */
router.get("/", async (req, res) => {
  try {
    const brands = await getAllBrands();
    res.json({
      success: true,
      count: brands.length,
      brands,
    });
  } catch (error) {
    console.error("Error getting brands:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/brands/:shortcode
 * Get specific brand details
 */
router.get("/:shortcode", validateShortcode, async (req, res) => {
  try {
    const { shortcode } = req.params;
    const brand = await getBrand(shortcode);

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: `Brand ${shortcode} not found`,
      });
    }

    res.json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("Error getting brand:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brands
 * Create new brand
 */
router.post("/", validateBrandConfig, async (req, res) => {
  try {
    const config = req.body;
    const { shortcode } = config;

    // Validate shortcode format
    if (!/^[a-z0-9]{2,6}$/.test(shortcode)) {
      return res.status(400).json({
        success: false,
        error: "Invalid shortcode format",
      });
    }

    // Check if brand already exists
    if (await brandExists(shortcode)) {
      return res.status(409).json({
        success: false,
        error: `Brand ${shortcode} already exists`,
      });
    }

    const brand = await createBrand(shortcode, config);

    res.status(201).json({
      success: true,
      message: `Brand ${shortcode} created successfully`,
      brand,
    });
  } catch (error) {
    console.error("Error creating brand:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/brands/:shortcode
 * Update brand configuration
 */
router.put("/:shortcode", validateShortcode, async (req, res) => {
  try {
    const { shortcode } = req.params;
    const config = req.body;

    // Check if brand exists
    if (!(await brandExists(shortcode))) {
      return res.status(404).json({
        success: false,
        error: `Brand ${shortcode} not found`,
      });
    }

    const updatedBrand = await updateBrand(shortcode, config);

    res.json({
      success: true,
      message: `Brand ${shortcode} updated successfully`,
      brand: updatedBrand,
    });
  } catch (error) {
    console.error("Error updating brand:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/brands/:shortcode
 * Delete brand
 */
router.delete("/:shortcode", validateShortcode, async (req, res) => {
  try {
    const { shortcode } = req.params;

    // Check if brand exists
    if (!(await brandExists(shortcode))) {
      return res.status(404).json({
        success: false,
        error: `Brand ${shortcode} not found`,
      });
    }

    await deleteBrand(shortcode);

    res.json({
      success: true,
      message: `Brand ${shortcode} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting brand:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/brands/:shortcode/assets
 * Upload brand assets
 */
router.post(
  "/:shortcode/assets",
  validateShortcode,
  upload.single("file"),
  async (req, res) => {
    try {
      const { shortcode } = req.params;
      const { filename } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      // Check if brand exists
      if (!(await brandExists(shortcode))) {
        return res.status(404).json({
          success: false,
          error: `Brand ${shortcode} not found`,
        });
      }

      // Use provided filename or original filename
      const assetFilename = filename || req.file.originalname;

      // Validate filename
      const allowedFiles = [
        "logo.svg",
        "icon.png",
        "adaptive-icon.png",
        "favicon.png",
        "splash-icon.png",
        "icon-512.png",
      ];

      if (!allowedFiles.includes(assetFilename)) {
        return res.status(400).json({
          success: false,
          error: `Invalid filename. Allowed files: ${allowedFiles.join(", ")}`,
        });
      }

      await saveBrandAsset(shortcode, assetFilename, req.file.buffer);

      res.json({
        success: true,
        message: `Asset ${assetFilename} uploaded successfully`,
        filename: assetFilename,
      });
    } catch (error) {
      console.error("Error uploading asset:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/brands/:shortcode/assets/:filename
 * Get brand asset
 */
router.get(
  "/:shortcode/assets/:filename",
  validateShortcode,
  async (req, res) => {
    try {
      const { shortcode, filename } = req.params;

      const assetPath = await getBrandAsset(shortcode, filename);

      if (!assetPath) {
        return res.status(404).json({
          success: false,
          error: "Asset not found",
        });
      }

      // Determine content type
      const ext = path.extname(filename).toLowerCase();
      const contentTypes = {
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
      };

      const contentType = contentTypes[ext] || "application/octet-stream";

      res.setHeader("Content-Type", contentType);
      res.sendFile(assetPath);
    } catch (error) {
      console.error("Error getting asset:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

module.exports = router;
