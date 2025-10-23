/**
 * Authentication Middleware
 * Implements HTTP Basic Authentication for notification endpoints
 */

/* global Buffer */

/**
 * Basic Authentication Middleware
 * Validates credentials from Authorization header
 */
function basicAuth(req, res, next) {
  // Get authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized(res);
  }

  try {
    // Decode base64 credentials
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8"
    );
    const [username, password] = credentials.split(":");

    // Get credentials from environment variables
    const validUsername = process.env.NOTIFICATION_USERNAME || "admin";
    const validPassword = process.env.NOTIFICATION_PASSWORD || "changeme";

    // Validate credentials
    if (username === validUsername && password === validPassword) {
      // Authentication successful
      next();
    } else {
      return unauthorized(res);
    }
  } catch (error) {
    console.error("Authentication error:", error.message);
    return unauthorized(res);
  }
}

/**
 * Send 401 Unauthorized response
 */
function unauthorized(res) {
  res.set("WWW-Authenticate", 'Basic realm="Notification API"');
  res.status(401).json({
    success: false,
    error: "Authentication required",
    message: "Please provide valid credentials",
  });
}

module.exports = {
  basicAuth,
};
