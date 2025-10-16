#!/usr/bin/env node

/**
 * Send Push Notification Script
 *
 * This script sends push notifications using the Expo Push Notification API.
 *
 * Usage:
 *   # Send to a specific token
 *   node scripts/send-push-notification.js --token "ExponentPushToken[...]" --title "Hello" --body "Test message"
 *
 *   # Send to all tokens stored in a file
 *   node scripts/send-push-notification.js --all --title "Hello" --body "Test message"
 *
 *   # Send to a specific brand
 *   node scripts/send-push-notification.js --brand "nt" --title "Hello" --body "Test message"
 *
 *   # Interactive mode (prompts for input)
 *   node scripts/send-push-notification.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Configuration
const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
const TOKENS_FILE = path.join(__dirname, "../push-tokens.json");

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    token: null,
    all: false,
    brand: null,
    title: null,
    body: null,
    data: null,
    articleId: null,
    sound: "default",
    badge: null,
    priority: "default",
    channelId: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--token":
      case "-t":
        parsed.token = nextArg;
        i++;
        break;
      case "--all":
      case "-a":
        parsed.all = true;
        break;
      case "--brand":
      case "-B":
        parsed.brand = nextArg;
        i++;
        break;
      case "--title":
        parsed.title = nextArg;
        i++;
        break;
      case "--body":
      case "-b":
        parsed.body = nextArg;
        i++;
        break;
      case "--data":
      case "-d":
        try {
          parsed.data = JSON.parse(nextArg);
        } catch (e) {
          console.error("Error parsing data JSON:", e.message);
        }
        i++;
        break;
      case "--article":
      case "--article-id":
        parsed.articleId = nextArg;
        i++;
        break;
      case "--sound":
      case "-s":
        parsed.sound = nextArg;
        i++;
        break;
      case "--badge":
        parsed.badge = parseInt(nextArg, 10);
        i++;
        break;
      case "--priority":
      case "-p":
        parsed.priority = nextArg;
        i++;
        break;
      case "--channel":
      case "-c":
        parsed.channelId = nextArg;
        i++;
        break;
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
    }
  }

  return parsed;
}

function showHelp() {
  console.log(`
Send Push Notification Script

Usage:
  node scripts/send-push-notification.js [options]

Options:
  -t, --token <token>       Specific Expo push token to send to
  -a, --all                 Send to all tokens in push-tokens.json
  -B, --brand <brand>       Send to all tokens for a specific brand (nt, cn)
  --title <title>           Notification title
  -b, --body <body>         Notification body/message
  --article, --article-id   Article ID to open when notification is tapped
  -d, --data <json>         Custom data as JSON string
  -s, --sound <sound>       Sound to play (default: 'default')
  --badge <number>          Badge count
  -p, --priority <priority> Priority: default, normal, high
  -c, --channel <id>        Android notification channel ID
  -h, --help                Show this help message

Examples:
  # Send to specific token
  node scripts/send-push-notification.js \\
    --token "ExponentPushToken[...]" \\
    --title "Breaking News" \\
    --body "Check out the latest article"

  # Send to all tokens
  node scripts/send-push-notification.js \\
    --all \\
    --title "App Update" \\
    --body "New features available!"

  # Send to specific brand
  node scripts/send-push-notification.js \\
    --brand "nt" \\
    --title "Nursing Times Update" \\
    --body "New article published"

  # Send with article ID (opens article when tapped)
  node scripts/send-push-notification.js \\
    --token "ExponentPushToken[...]" \\
    --title "New Article" \\
    --body "Check out our latest story" \\
    --article "12345"

  # Interactive mode
  node scripts/send-push-notification.js

Token Storage:
  Tokens are stored in: ${TOKENS_FILE}
  Format:
  {
    "tokens": ["ExponentPushToken[...]", ...],
    "brands": {
      "nt": ["ExponentPushToken[...]", ...],
      "cn": ["ExponentPushToken[...]", ...]
    }
  }
`);
}

// Load tokens from file
function loadTokens() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, "utf8");
      const parsed = JSON.parse(data);
      return parsed.tokens || [];
    }
  } catch (error) {
    console.error("Error loading tokens:", error.message);
  }
  return [];
}

// Save tokens to file
function saveTokens(tokens) {
  try {
    const data = JSON.stringify({ tokens }, null, 2);
    fs.writeFileSync(TOKENS_FILE, data, "utf8");
    console.log(`Tokens saved to ${TOKENS_FILE}`);
  } catch (error) {
    console.error("Error saving tokens:", error.message);
  }
}

// Add a token to the file
function addToken(token) {
  const tokens = loadTokens();
  if (!tokens.includes(token)) {
    tokens.push(token);
    saveTokens(tokens);
    console.log("Token added successfully");
  } else {
    console.log("Token already exists");
  }
}

// Send push notification
async function sendPushNotification(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(messages);

    const options = {
      hostname: "exp.host",
      port: 443,
      path: "/--/api/v2/push/send",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (error) {
          reject(new Error("Failed to parse response: " + responseData));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Interactive mode
async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) =>
    new Promise((resolve) => rl.question(query, resolve));

  console.log("\n=== Push Notification Sender (Interactive Mode) ===\n");

  const mode = await question(
    "Send to (1) specific token, (2) all tokens, or (3) specific brand? [1/2/3]: "
  );

  let tokens = [];
  if (mode === "2") {
    tokens = loadTokens();
    if (tokens.length === 0) {
      console.log("No tokens found in push-tokens.json");
      rl.close();
      return;
    }
    console.log(`Found ${tokens.length} token(s)`);
  } else if (mode === "3") {
    const brand = await question("Enter brand (nt/cn): ");
    tokens = loadTokens(brand);
    if (tokens.length === 0) {
      console.log(`No tokens found for brand "${brand}"`);
      rl.close();
      return;
    }
    console.log(`Found ${tokens.length} token(s)`);
  } else {
    const token = await question("Enter Expo push token: ");
    if (!token || !token.startsWith("ExponentPushToken[")) {
      console.log("Invalid token format");
      rl.close();
      return;
    }
    tokens = [token];
  }

  const title = await question("Notification title: ");
  const body = await question("Notification body: ");
  const articleId = await question(
    "Article ID (optional, press Enter to skip): "
  );
  const sound =
    (await question("Sound (default/none) [default]: ")) || "default";

  rl.close();

  const data = { timestamp: new Date().toISOString() };
  if (articleId && articleId.trim()) {
    data.articleId = articleId.trim();
    data.type = "article";
  }

  const messages = tokens.map((token) => ({
    to: token,
    sound: sound === "none" ? null : sound,
    title,
    body,
    data,
  }));

  console.log("\n=== Notification Payload ===");
  console.log(JSON.stringify(messages, null, 2));
  console.log("\nSending notification(s)...");
  await sendNotifications(messages);
}

// Send notifications and handle response
async function sendNotifications(messages) {
  try {
    const response = await sendPushNotification(messages);

    console.log("\n=== Response ===");
    console.log(JSON.stringify(response, null, 2));

    if (response.data) {
      const successful = response.data.filter((r) => r.status === "ok").length;
      const failed = response.data.filter((r) => r.status === "error").length;

      console.log(`\n✓ Successful: ${successful}`);
      if (failed > 0) {
        console.log(`✗ Failed: ${failed}`);
        response.data.forEach((r, i) => {
          if (r.status === "error") {
            console.log(`  Token ${i + 1}: ${r.message}`);
          }
        });
      }
    }
  } catch (error) {
    console.error("\n✗ Error sending notification:", error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  const args = parseArgs();

  // If no arguments provided, run interactive mode
  if (!args.token && !args.all && !args.title && !args.body) {
    await interactiveMode();
    return;
  }

  // Validate required fields
  if (!args.title || !args.body) {
    console.error("Error: --title and --body are required");
    console.log("Use --help for usage information");
    process.exit(1);
  }

  // Get tokens
  let tokens = [];
  if (args.all) {
    tokens = loadTokens();
    if (tokens.length === 0) {
      console.error("Error: No tokens found in push-tokens.json");
      console.log(`Create the file at: ${TOKENS_FILE}`);
      console.log('Format: { "tokens": ["ExponentPushToken[...]", ...] }');
      process.exit(1);
    }
    console.log(`Sending to ${tokens.length} token(s)...`);
  } else if (args.brand) {
    tokens = loadTokens(args.brand);
    if (tokens.length === 0) {
      console.error(`Error: No tokens found for brand "${args.brand}"`);
      console.log(
        `Add tokens to the brands.${args.brand} array in ${TOKENS_FILE}`
      );
      process.exit(1);
    }
    console.log(
      `Sending to ${tokens.length} token(s) for brand "${args.brand}"...`
    );
  } else if (args.token) {
    if (!args.token.startsWith("ExponentPushToken[")) {
      console.error("Error: Invalid token format");
      console.log('Token should start with "ExponentPushToken["');
      process.exit(1);
    }
    tokens = [args.token];
  } else {
    console.error("Error: Either --token, --all, or --brand must be specified");
    process.exit(1);
  }

  // Build messages
  const messages = tokens.map((token) => {
    const message = {
      to: token,
      sound: args.sound === "none" ? null : args.sound,
      title: args.title,
      body: args.body,
    };

    // Build data object
    const data = args.data || {};

    // Add article ID if provided
    if (args.articleId) {
      data.articleId = args.articleId;
      data.type = "article";
    }

    // Add timestamp
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }

    message.data = data;

    if (args.badge !== null) message.badge = args.badge;
    if (args.priority !== "default") message.priority = args.priority;
    if (args.channelId) message.channelId = args.channelId;

    return message;
  });

  console.log("\n=== Notification Payload ===");
  console.log(JSON.stringify(messages, null, 2));
  console.log("\nSending notification(s)...");

  await sendNotifications(messages);
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
