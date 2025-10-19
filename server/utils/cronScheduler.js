/**
 * Cron Job Scheduler
 * Schedules periodic tasks like push credentials checking
 */

const cron = require("node-cron");
const { checkAllBrandsCredentials } = require("./pushCredentialsChecker");

let credentialsCheckJob = null;

/**
 * Start the push credentials check cron job
 * Runs once every 24 hours at 2 AM
 */
function startPushCredentialsCheck() {
  if (credentialsCheckJob) {
    console.log("Push credentials check job is already running");
    return;
  }

  // Schedule: Run at 2:00 AM every day
  // Cron format: minute hour day month weekday
  credentialsCheckJob = cron.schedule("0 2 * * *", async () => {
    console.log("\n[CRON] Starting scheduled push credentials check...");
    try {
      await checkAllBrandsCredentials();
      console.log("[CRON] Push credentials check completed successfully");
    } catch (error) {
      console.error("[CRON] Error during push credentials check:", error);
    }
  });

  console.log(
    "✓ Push credentials check cron job started (runs daily at 2:00 AM)"
  );

  // Run immediately on startup if cache is old
  setTimeout(async () => {
    console.log(
      "[STARTUP] Checking if initial push credentials check is needed..."
    );
    try {
      const { getAllCredentialsStatus } = require("./pushCredentialsChecker");
      const status = await getAllCredentialsStatus();

      // If no cache or cache is invalid, run check immediately
      if (
        Object.keys(status).length === 0 ||
        Object.values(status).some((s) => !s.cacheValid)
      ) {
        console.log("[STARTUP] Running initial push credentials check...");
        await checkAllBrandsCredentials();
      } else {
        console.log(
          "[STARTUP] Push credentials cache is valid, skipping initial check"
        );
      }
    } catch (error) {
      console.error(
        "[STARTUP] Error during initial push credentials check:",
        error
      );
    }
  }, 5000); // Wait 5 seconds after server start
}

/**
 * Stop the push credentials check cron job
 */
function stopPushCredentialsCheck() {
  if (credentialsCheckJob) {
    credentialsCheckJob.stop();
    credentialsCheckJob = null;
    console.log("✓ Push credentials check cron job stopped");
  }
}

/**
 * Start all cron jobs
 */
function startAllCronJobs() {
  console.log("\n=== Starting Cron Jobs ===");
  startPushCredentialsCheck();
  console.log("=== Cron Jobs Started ===\n");
}

/**
 * Stop all cron jobs
 */
function stopAllCronJobs() {
  console.log("\n=== Stopping Cron Jobs ===");
  stopPushCredentialsCheck();
  console.log("=== Cron Jobs Stopped ===\n");
}

module.exports = {
  startAllCronJobs,
  stopAllCronJobs,
  startPushCredentialsCheck,
  stopPushCredentialsCheck,
};
