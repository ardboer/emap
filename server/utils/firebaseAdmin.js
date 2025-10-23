/**
 * Firebase Admin SDK Utility
 * Manages Firebase Admin SDK initialization with shared service account
 * and provides functions to send notifications to FCM topics
 */

/* global __dirname */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Store initialized Firebase app (single shared instance)
let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK with shared service account
 * @returns {admin.app.App} Firebase app instance
 */
function initializeFirebaseApp() {
  // Return existing app if already initialized
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Try to find service account key (check multiple possible names)
    const configDir = path.join(__dirname, "../config/firebase");
    const possibleFiles = [
      "service-account.json",
      "firebase-service-account.json",
      "emap-service-account.json",
    ];

    let serviceAccountPath = null;

    // Check if config directory exists
    if (!fs.existsSync(configDir)) {
      throw new Error(`Firebase config directory not found at ${configDir}`);
    }

    // Find the first available service account file
    for (const filename of possibleFiles) {
      const filePath = path.join(configDir, filename);
      if (fs.existsSync(filePath)) {
        serviceAccountPath = filePath;
        break;
      }
    }

    // If no standard name found, check for any JSON file
    if (!serviceAccountPath) {
      const files = fs.readdirSync(configDir);
      const jsonFile = files.find((f) => f.endsWith(".json"));
      if (jsonFile) {
        serviceAccountPath = path.join(configDir, jsonFile);
      }
    }

    if (!serviceAccountPath) {
      throw new Error(
        `No Firebase service account key found in ${configDir}. ` +
          `Please add a service account JSON file (e.g., service-account.json)`
      );
    }

    // Read and parse service account
    const serviceAccount = require(serviceAccountPath);

    // Initialize Firebase app (single shared instance)
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log(
      `✓ Firebase Admin initialized with service account from: ${path.basename(
        serviceAccountPath
      )}`
    );

    return firebaseApp;
  } catch (error) {
    console.error(`✗ Failed to initialize Firebase:`, error.message);
    throw error;
  }
}

/**
 * Get Firebase app instance
 * @returns {admin.app.App} Firebase app instance
 */
function getFirebaseApp() {
  if (!firebaseApp) {
    return initializeFirebaseApp();
  }
  return firebaseApp;
}

/**
 * Send notification to a topic
 * @param {string} brand - Brand shortcode (topic name)
 * @param {Object} notification - Notification payload
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} notification.data - Custom data payload
 * @returns {Promise<Object>} FCM response
 */
async function sendToTopic(brand, notification) {
  try {
    // Get or initialize Firebase app (shared instance)
    const app = getFirebaseApp();

    // Validate notification payload
    if (!notification.title || !notification.body) {
      throw new Error("Notification must include title and body");
    }

    // Build FCM message
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      topic: brand, // Topic name matches brand shortcode
    };

    // Ensure data values are strings (FCM requirement)
    Object.keys(message.data).forEach((key) => {
      if (typeof message.data[key] !== "string") {
        message.data[key] = String(message.data[key]);
      }
    });

    // Send message
    const response = await app.messaging().send(message);

    console.log(`✓ Notification sent to topic "${brand}":`, response);

    return {
      success: true,
      messageId: response,
      brand,
      topic: brand,
    };
  } catch (error) {
    console.error(
      `✗ Failed to send notification to topic "${brand}":`,
      error.message
    );
    throw error;
  }
}

/**
 * Test Firebase connection
 * @returns {Promise<Object>} Connection status
 */
async function testConnection() {
  try {
    const app = getFirebaseApp();

    // Try to get the messaging instance to verify connection
    const messaging = app.messaging();

    return {
      success: true,
      message: `Firebase Admin SDK connected successfully`,
      projectId: app.options.credential.projectId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if Firebase is configured
 * @returns {boolean} True if service account file exists
 */
function isConfigured() {
  try {
    const configDir = path.join(__dirname, "../config/firebase");

    if (!fs.existsSync(configDir)) {
      return false;
    }

    const files = fs.readdirSync(configDir);
    return files.some((f) => f.endsWith(".json"));
  } catch (error) {
    return false;
  }
}

module.exports = {
  initializeFirebaseApp,
  getFirebaseApp,
  sendToTopic,
  testConnection,
  isConfigured,
};
