/**
 * Notification Service
 * Handles notification validation and sending logic
 */

const { sendToTopic } = require("./firebaseAdmin");
const { brandExists } = require("./brandOperations");

/**
 * Validation rules for notifications
 */
const VALIDATION_RULES = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 65,
    message: "Title must be between 1 and 65 characters",
  },
  body: {
    required: true,
    minLength: 1,
    maxLength: 240,
    message: "Body must be between 1 and 240 characters",
  },
  brand: {
    required: true,
    message: "Brand is required and must be a valid brand shortcode",
  },
};

/**
 * Validate notification payload
 * @param {Object} payload - Notification payload
 * @param {string} payload.brand - Brand shortcode
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {Object} payload.data - Custom data (optional)
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
async function validateNotification(payload) {
  const errors = [];

  // Validate brand
  if (!payload.brand) {
    errors.push("Brand is required");
  } else {
    // Check if brand exists (async check)
    const exists = await brandExists(payload.brand);
    if (!exists) {
      errors.push(`Brand "${payload.brand}" not found`);
    }
  }

  // Validate title
  if (!payload.title) {
    errors.push("Title is required");
  } else {
    const titleLength = payload.title.trim().length;
    if (
      titleLength < VALIDATION_RULES.title.minLength ||
      titleLength > VALIDATION_RULES.title.maxLength
    ) {
      errors.push(VALIDATION_RULES.title.message);
    }
  }

  // Validate body
  if (!payload.body) {
    errors.push("Body is required");
  } else {
    const bodyLength = payload.body.trim().length;
    if (
      bodyLength < VALIDATION_RULES.body.minLength ||
      bodyLength > VALIDATION_RULES.body.maxLength
    ) {
      errors.push(VALIDATION_RULES.body.message);
    }
  }

  // Validate data if provided
  if (payload.data) {
    if (typeof payload.data !== "object") {
      errors.push("Data must be an object");
    } else {
      // Check if articleId is provided and is a string
      if (
        payload.data.articleId &&
        typeof payload.data.articleId !== "string"
      ) {
        errors.push("articleId must be a string");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Send article notification
 * @param {string} brand - Brand shortcode (cn, nt, jnl)
 * @param {Object} article - Article object
 * @param {string} article.id - Article ID
 * @param {string} article.title - Article title
 * @param {string} article.excerpt - Article excerpt
 * @param {Object} customization - Optional customization
 * @param {string} customization.title - Custom notification title (optional)
 * @param {string} customization.body - Custom notification body (optional)
 * @returns {Promise<Object>} Send result
 */
async function sendArticleNotification(brand, article, customization = {}) {
  try {
    // Build notification payload
    const notification = {
      brand,
      title: customization.title || article.title,
      body: customization.body || article.excerpt || "New article available",
      data: {
        type: "article",
        articleId: article.id.toString(), // Ensure articleId is a string
        timestamp: new Date().toISOString(),
      },
    };

    // Validate notification
    const validation = await validateNotification(notification);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Send notification
    const result = await sendToTopic(brand, notification);

    return {
      success: true,
      ...result,
      notification: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      },
    };
  } catch (error) {
    console.error("Error sending article notification:", error.message);
    throw error;
  }
}

/**
 * Send custom notification
 * @param {string} brand - Brand shortcode
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Custom data (optional)
 * @returns {Promise<Object>} Send result
 */
async function sendCustomNotification(brand, title, body, data = {}) {
  try {
    const notification = {
      brand,
      title,
      body,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
    };

    // Validate notification
    const validation = await validateNotification(notification);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Send notification
    const result = await sendToTopic(brand, notification);

    return {
      success: true,
      ...result,
      notification: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      },
    };
  } catch (error) {
    console.error("Error sending custom notification:", error.message);
    throw error;
  }
}

module.exports = {
  validateNotification,
  sendArticleNotification,
  sendCustomNotification,
  VALIDATION_RULES,
};
