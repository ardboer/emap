/**
 * System Operations Routes
 * Handles brand switching and prebuild operations
 */

const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const { validateBrandSwitch } = require("../middleware/validation");
const {
  getActiveBrand,
  getBrand,
  switchActiveBrand,
  brandExists,
} = require("../utils/brandOperations");

const {
  checkKeystoreAlias,
  getKeystoreStatus,
} = require("../utils/keystoreChecker");

const {
  verifyBrandFirebase,
  verifyAllBrands,
} = require("../utils/firebaseConfigChecker");

const router = express.Router();

// Store prebuild process status
let prebuildStatus = {
  running: false,
  brand: null,
  output: [],
  error: null,
  exitCode: null,
};

/**
 * GET /api/system/active-brand
 * Get currently active brand
 */
router.get("/active-brand", async (req, res) => {
  try {
    const activeBrandShortcode = await getActiveBrand();

    if (!activeBrandShortcode) {
      return res.status(404).json({
        success: false,
        error: "No active brand found",
      });
    }

    // Get the full brand configuration
    const brandConfig = await getBrand(activeBrandShortcode);

    if (!brandConfig) {
      return res.status(404).json({
        success: false,
        error: "Active brand configuration not found",
      });
    }

    res.json({
      success: true,
      activeBrand: {
        shortcode: activeBrandShortcode,
        ...brandConfig,
      },
    });
  } catch (error) {
    console.error("Error getting active brand:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/system/switch-brand
 * Switch active brand
 */
router.post("/switch-brand", validateBrandSwitch, async (req, res) => {
  try {
    const { shortcode, runPrebuild = false } = req.body;

    // Check if brand exists
    if (!(await brandExists(shortcode))) {
      return res.status(404).json({
        success: false,
        error: `Brand ${shortcode} not found`,
      });
    }

    // Switch the brand
    const result = await switchActiveBrand(shortcode);

    // Optionally run prebuild
    if (runPrebuild) {
      // Start prebuild in background
      runPrebuildScript(shortcode);

      res.json({
        success: true,
        message: `Brand switched to ${shortcode} and prebuild started`,
        ...result,
        prebuildStarted: true,
      });
    } else {
      res.json({
        success: true,
        message: `Brand switched to ${shortcode}`,
        ...result,
        prebuildStarted: false,
      });
    }
  } catch (error) {
    console.error("Error switching brand:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/system/prebuild
 * Run prebuild script for a brand
 */
router.post("/prebuild", async (req, res) => {
  try {
    const { shortcode } = req.body;

    if (!shortcode) {
      return res.status(400).json({
        success: false,
        error: "Shortcode is required",
      });
    }

    // Check if brand exists
    if (!(await brandExists(shortcode))) {
      return res.status(404).json({
        success: false,
        error: `Brand ${shortcode} not found`,
      });
    }

    // Check if prebuild is already running
    if (prebuildStatus.running) {
      return res.status(409).json({
        success: false,
        error: "Prebuild is already running",
        currentBrand: prebuildStatus.brand,
      });
    }

    // Start prebuild
    runPrebuildScript(shortcode);

    res.json({
      success: true,
      message: `Prebuild started for brand ${shortcode}`,
      brand: shortcode,
    });
  } catch (error) {
    console.error("Error starting prebuild:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/system/firebase-status
 * Get Firebase configuration status for all brands
 */
router.get("/firebase-status", async (req, res) => {
  try {
    const result = await verifyAllBrands();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Error checking Firebase status for all brands:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/system/firebase-status/:shortcode
 * Get Firebase configuration status for a specific brand
 */
router.get("/firebase-status/:shortcode", async (req, res) => {
  try {
    const { shortcode } = req.params;

    // Check if brand exists
    if (!(await brandExists(shortcode))) {
      return res.status(404).json({
        success: false,
        error: `Brand ${shortcode} not found`,
      });
    }

    const result = await verifyBrandFirebase(shortcode);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Error checking Firebase status:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/system/keystore-status/:shortcode
 * Get stored keystore alias status for a specific brand
 */
router.get("/keystore-status/:shortcode", async (req, res) => {
  try {
    const { shortcode } = req.params;

    const status = await getKeystoreStatus(shortcode);

    if (!status) {
      return res.json({
        success: true,
        keystoreStatus: {
          configured: false,
          details: "Not checked yet",
          lastChecked: null,
          alias: null,
        },
      });
    }

    res.json({
      success: true,
      keystoreStatus: status,
    });
  } catch (error) {
    console.error("Error getting keystore status:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/system/keystore-status/:shortcode/check
 * Check if brand's alias exists in production keystore
 */
router.post("/keystore-status/:shortcode/check", async (req, res) => {
  try {
    const { shortcode } = req.params;

    const brand = await getBrand(shortcode);
    if (!brand) {
      return res.status(404).json({
        success: false,
        error: `Brand ${shortcode} not found`,
      });
    }

    const status = await checkKeystoreAlias(shortcode);

    res.json({
      success: true,
      message: `Keystore status checked for ${shortcode}`,
      keystoreStatus: status,
    });
  } catch (error) {
    console.error("Error checking keystore status:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/system/prebuild-status
 * Check prebuild status
 */
router.get("/prebuild-status", (req, res) => {
  res.json({
    success: true,
    status: {
      running: prebuildStatus.running,
      brand: prebuildStatus.brand,
      outputLines: prebuildStatus.output.length,
      error: prebuildStatus.error,
      exitCode: prebuildStatus.exitCode,
      output: prebuildStatus.output.slice(-50), // Last 50 lines
    },
  });
});

/**
 * Helper function to run prebuild script
 */
function runPrebuildScript(shortcode) {
  // Reset status
  prebuildStatus = {
    running: true,
    brand: shortcode,
    output: [],
    error: null,
    exitCode: null,
  };

  // Get project root directory (one level up from server/)
  const projectRoot = path.join(process.cwd(), "..");

  // Run npx expo prebuild with brand environment variable
  const prebuild = spawn("npx", ["expo", "prebuild", "--clean"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      BRAND: shortcode,
    },
    shell: true,
  });

  // Capture stdout
  prebuild.stdout.on("data", (data) => {
    const output = data.toString();
    console.log(`[Prebuild ${shortcode}]:`, output);
    prebuildStatus.output.push(output);
  });

  // Capture stderr
  prebuild.stderr.on("data", (data) => {
    const output = data.toString();
    console.error(`[Prebuild ${shortcode} Error]:`, output);
    prebuildStatus.output.push(`ERROR: ${output}`);
  });

  // Handle process completion
  prebuild.on("close", (code) => {
    console.log(`[Prebuild ${shortcode}] Process exited with code ${code}`);
    prebuildStatus.running = false;
    prebuildStatus.exitCode = code;

    if (code !== 0) {
      prebuildStatus.error = `Prebuild failed with exit code ${code}`;
    }
  });

  // Handle process errors
  prebuild.on("error", (error) => {
    console.error(`[Prebuild ${shortcode}] Process error:`, error);
    prebuildStatus.running = false;
    prebuildStatus.error = error.message;
  });
}

/**
 * GET /api/system/health
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
