/**
 * Notification Routes
 * API endpoints for sending push notifications
 */

const express = require("express");
const router = express.Router();
const { basicAuth } = require("../middleware/auth");
const { fetchArticles, searchArticles } = require("../utils/wordpressApi");
const {
  sendArticleNotification,
  sendCustomNotification,
  validateNotification,
} = require("../utils/notificationService");
const { testConnection, isConfigured } = require("../utils/firebaseAdmin");
const { getAllBrands, brandExists } = require("../utils/brandOperations");

// Apply authentication to all routes (commented out for local development)
// router.use(basicAuth);

/**
 * GET /api/notifications/articles
 * Fetch articles from WordPress API
 */
router.get("/articles", async (req, res) => {
  try {
    const { brand, limit = 10, search = "" } = req.query;

    // Validate brand parameter
    if (!brand) {
      return res.status(400).json({
        success: false,
        error: "Brand parameter is required",
      });
    }

    // Check if brand exists
    if (!(await brandExists(brand))) {
      return res.status(400).json({
        success: false,
        error: `Invalid brand "${brand}". Brand not found.`,
      });
    }

    // Fetch articles
    let articles;
    if (search && search.trim()) {
      articles = await searchArticles(brand, search, parseInt(limit));
    } else {
      articles = await fetchArticles(brand, { limit: parseInt(limit) });
    }

    res.json({
      success: true,
      brand,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Error fetching articles:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch articles",
      message: error.message,
    });
  }
});

/**
 * POST /api/notifications/send
 * Send a notification to a topic
 */
router.post("/send", async (req, res) => {
  try {
    const { brand, title, body, data, articleId } = req.body;

    // Build notification payload
    const payload = {
      brand,
      title,
      body,
      data: data || {},
    };

    // If articleId is provided, add it to data
    if (articleId) {
      payload.data.articleId = articleId.toString();
      payload.data.type = "article";
    }

    // Validate notification
    const validation = await validateNotification(payload);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: validation.errors,
      });
    }

    // Check if Firebase is configured
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        error: "Firebase not configured",
        message: `Firebase service account not found. Please add the service account key file.`,
      });
    }

    // Send notification
    let result;
    if (articleId) {
      // Send as article notification
      result = await sendArticleNotification(
        brand,
        { id: articleId, title, excerpt: body },
        { title, body }
      );
    } else {
      // Send as custom notification
      result = await sendCustomNotification(brand, title, body, payload.data);
    }

    res.json({
      success: true,
      message: "Notification sent successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error sending notification:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to send notification",
      message: error.message,
    });
  }
});

/**
 * GET /api/notifications/test
 * Test Firebase connection for a brand
 */
router.get("/test", async (req, res) => {
  try {
    const { brand } = req.query;

    if (!brand) {
      return res.status(400).json({
        success: false,
        error: "Brand parameter is required",
      });
    }

    // Check if brand exists
    if (!(await brandExists(brand))) {
      return res.status(400).json({
        success: false,
        error: `Invalid brand "${brand}". Brand not found.`,
      });
    }

    // Check if configured
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        error: "Firebase not configured",
        message: `Service account key not found`,
        configured: false,
      });
    }

    // Test connection
    const result = await testConnection();

    if (result.success) {
      res.json({
        success: true,
        message: "Firebase connection successful",
        ...result,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Firebase connection failed",
        ...result,
      });
    }
  } catch (error) {
    console.error("Error testing Firebase connection:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to test connection",
      message: error.message,
    });
  }
});

/**
 * GET /api/notifications/status
 * Get Firebase configuration status and available brands
 */
router.get("/status", async (req, res) => {
  try {
    const firebaseConfigured = isConfigured();
    const brands = await getAllBrands();

    res.json({
      success: true,
      firebase: {
        configured: firebaseConfigured,
      },
      brands: brands.map((b) => ({
        shortcode: b.shortcode,
        name: b.name,
        displayName: b.displayName,
      })),
    });
  } catch (error) {
    console.error("Error getting status:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get status",
      message: error.message,
    });
  }
});

/**
 * GET /api/notifications/brands
 * Get list of available brands
 */
router.get("/brands", async (req, res) => {
  try {
    const brands = await getAllBrands();

    res.json({
      success: true,
      brands: brands.map((b) => ({
        shortcode: b.shortcode,
        name: b.name,
        displayName: b.displayName,
      })),
    });
  } catch (error) {
    console.error("Error getting brands:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get brands",
      message: error.message,
    });
  }
});

module.exports = router;
