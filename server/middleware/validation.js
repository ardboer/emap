/**
 * Validation Middleware
 * Validates request parameters and body for brand operations
 */

/**
 * Validate brand shortcode format
 * Must be 2-6 lowercase alphanumeric characters
 */
function validateShortcode(req, res, next) {
  const shortcode = req.params.shortcode || req.body.shortcode;

  if (!shortcode) {
    return res.status(400).json({
      error: "Shortcode is required",
    });
  }

  if (!/^[a-z0-9]{2,6}$/.test(shortcode)) {
    return res.status(400).json({
      error:
        "Invalid shortcode format. Must be 2-6 lowercase alphanumeric characters",
    });
  }

  next();
}

/**
 * Validate brand configuration structure
 * Ensures required fields are present
 */
function validateBrandConfig(req, res, next) {
  const config = req.body.config || req.body;

  // Required fields
  const requiredFields = ["shortcode", "name", "displayName", "domain"];
  const missingFields = requiredFields.filter((field) => !config[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: "Missing required fields",
      missingFields,
    });
  }

  // Validate nested structures exist
  if (
    !config.apiConfig ||
    !config.apiConfig.baseUrl ||
    !config.apiConfig.hash
  ) {
    return res.status(400).json({
      error: "Invalid apiConfig structure. Must include baseUrl and hash",
    });
  }

  if (!config.theme || !config.theme.colors || !config.theme.fonts) {
    return res.status(400).json({
      error: "Invalid theme structure. Must include colors and fonts",
    });
  }

  if (!config.branding || !config.branding.logo) {
    return res.status(400).json({
      error: "Invalid branding structure. Must include logo",
    });
  }

  if (!config.features) {
    return res.status(400).json({
      error: "Missing features configuration",
    });
  }

  next();
}

/**
 * Validate file upload
 */
function validateFileUpload(allowedTypes) {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    const files = req.files || [req.file];

    for (const file of files) {
      if (file && allowedTypes && !allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
        });
      }
    }

    next();
  };
}

/**
 * Validate brand switch request
 */
function validateBrandSwitch(req, res, next) {
  const { shortcode, runPrebuild } = req.body;

  if (!shortcode) {
    return res.status(400).json({
      error: "Shortcode is required for brand switching",
    });
  }

  if (!/^[a-z0-9]{2,6}$/.test(shortcode)) {
    return res.status(400).json({
      error: "Invalid shortcode format",
    });
  }

  if (runPrebuild !== undefined && typeof runPrebuild !== "boolean") {
    return res.status(400).json({
      error: "runPrebuild must be a boolean",
    });
  }

  next();
}

module.exports = {
  validateShortcode,
  validateBrandConfig,
  validateFileUpload,
  validateBrandSwitch,
};
