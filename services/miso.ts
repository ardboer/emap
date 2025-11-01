import { brandManager } from "./api";

/**
 * Miso Interaction Tracking Service
 *
 * This service handles tracking user interactions with articles for the Miso recommendation engine.
 * It sends product detail page view events to the Miso API to improve personalized recommendations.
 */

interface TrackArticleViewParams {
  articleId: string;
  userId?: string;
  isAuthenticated: boolean;
  anonymousId: string;
}

interface MisoInteractionPayload {
  data: {
    type: "product_detail_page_view";
    product_ids: string[];
    timestamp: string;
    user_id?: string;
    anonymous_id?: string;
  }[];
}

/**
 * Track an article view event with Miso
 *
 * @param params - Tracking parameters
 * @param params.articleId - The numeric article ID (e.g., "338478")
 * @param params.userId - Optional authenticated user ID
 * @param params.anonymousId - Persistent anonymous ID for the user
 *
 * @returns Promise<boolean> - Returns true if tracking succeeded, false otherwise
 *
 * @example
 * ```typescript
 * await trackArticleView({
 *   articleId: "338478",
 *   userId: "user123",
 *   anonymousId: "1681123015.1761219735"
 * });
 * ```
 */
export async function trackArticleView({
  articleId,
  userId,
  isAuthenticated,
  anonymousId,
}: TrackArticleViewParams): Promise<boolean> {
  console.group("📊 Miso Article View Tracking");

  try {
    // Determine which ID to use based on authentication status
    let misoUserId: string | undefined;
    let misoAnonymousId: string | undefined;

    if (isAuthenticated && userId) {
      // Authenticated user: use "sub:" prefix for subscriber
      misoUserId = `sub:${userId}`;
      misoAnonymousId = undefined;
    } else {
      // Anonymous user: use anonymous_id only
      misoUserId = undefined;
      misoAnonymousId = anonymousId;
    }

    console.log("📝 Tracking Parameters:", {
      articleId,
      mode: isAuthenticated ? "AUTHENTICATED" : "ANONYMOUS",
      userId: misoUserId || "N/A",
      anonymousId: misoAnonymousId || "N/A",
    });

    // Get current brand configuration
    const brand = brandManager.getCurrentBrand();
    const brandKey = brand.shortcode.toUpperCase();

    console.log("🏷️ Brand Information:", {
      brandName: brand.name,
      brandKey,
      shortcode: brand.shortcode,
    });

    // Check if Miso is configured for this brand
    if (!brand.misoConfig) {
      console.warn("⚠️ Miso configuration not found for brand:", brand.name);
      console.groupEnd();
      return false;
    }

    // Construct the product ID in the format: BRANDKEY-articleId
    const productId = `${brandKey}-${articleId}`;
    console.log("🆔 Product ID:", productId);

    // Get Miso API configuration
    const { apiKey, baseUrl } = brand.misoConfig;
    const maskedApiKey = `${apiKey.substring(0, 8)}...${apiKey.substring(
      apiKey.length - 4
    )}`;
    console.log("🔑 API Key:", maskedApiKey);

    // Prepare the request payload with only the appropriate ID
    const timestamp = new Date().toISOString();
    const payload: MisoInteractionPayload = {
      data: [
        {
          type: "product_detail_page_view",
          product_ids: [productId],
          timestamp,
          ...(misoUserId && { user_id: misoUserId }),
          ...(misoAnonymousId && { anonymous_id: misoAnonymousId }),
        },
      ],
    };

    // Log request details
    const endpoint = `${baseUrl}/interactions`;
    console.log("🌐 Request Details:", {
      method: "POST",
      endpoint,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": maskedApiKey,
      },
      payload: JSON.stringify(payload, null, 2),
    });

    // Send the tracking request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });

    // Log response details
    console.log("📥 Response Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Miso API Error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      console.groupEnd();
      return false;
    }

    // Parse and log successful response
    const responseData = await response.json();
    console.log("✅ Tracking Successful:", responseData);
    console.groupEnd();
    return true;
  } catch (error) {
    console.error("❌ Miso Tracking Error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      articleId,
      userId,
      anonymousId,
    });
    console.groupEnd();
    return false;
  }
}
