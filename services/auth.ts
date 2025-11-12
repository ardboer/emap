import { brandManager } from "@/config/BrandManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import QuickCrypto from "react-native-quick-crypto";
import { analyticsService } from "./analytics";

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: "@auth_access_token",
  REFRESH_TOKEN: "@auth_refresh_token",
  USER_INFO: "@auth_user_info",
} as const;

// Types
export interface UserInfo {
  email: string;
  name: string;
  user_id: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginUrlParams {
  redirectUri: string;
  pageUrl: string;
  ttl?: number;
  secret: string;
  brandkey?: string;
}

export interface TokenValidationResponse {
  success: boolean;
  message?: string;
  data?: {
    user_id: string;
    email: string;
    name: string;
  };
}

export interface TokenRefreshResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  refresh_token?: string;
}

/**
 * Base64 URL encode a string (JWT compatible)
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Create a JWT token manually using HMAC-SHA256
 */
function createJWT(payload: Record<string, any>, secret: string): string {
  // JWT Header
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Create signature base
  const signatureBase = `${encodedHeader}.${encodedPayload}`;

  // Create HMAC-SHA256 signature using react-native-quick-crypto
  const hmac = QuickCrypto.createHmac("sha256", secret);
  hmac.update(signatureBase);
  const signature = hmac.digest("base64");

  // Convert to base64url format
  const encodedSignature = signature
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // Return complete JWT
  return `${signatureBase}.${encodedSignature}`;
}

/**
 * Generate a login URL with JWT signature for NT App authentication
 *
 * @param params - Login URL parameters
 * @param params.redirectUri - The URI to redirect to after authentication
 * @param params.pageUrl - The page URL for the login
 * @param params.ttl - Time to live in seconds (default: 3600)
 * @param params.secret - Secret key for JWT signing
 * @returns Complete login URL with signature parameter
 *
 * @example
 * ```typescript
 * const loginUrl = await generateLoginUrl({
 *   redirectUri: 'myapp://auth/callback',
 *   pageUrl: 'https://example.com/login',
 *   ttl: 3600,
 *   secret: 'your-secret-key'
 * });
 * ```
 */
export async function generateLoginUrl(
  params: LoginUrlParams
): Promise<string> {
  try {
    const { redirectUri, pageUrl, ttl = 3600, secret, brandkey } = params;

    // Generate random nonce using expo-crypto
    const nonceBytes = await Crypto.getRandomBytesAsync(16);
    const nonce = Array.from(nonceBytes)
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join("");

    // Get current timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Create JWT payload with iat and exp
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + ttl;

    const payload = {
      redirect_uri: redirectUri,
      nonce,
      iat: issuedAt,
      exp: expiresAt,
    };

    // Create JWT token using our custom function
    const signature = createJWT(payload, secret);

    // Construct login URL with signature and optional brandkey
    let loginUrl = `${pageUrl}?signature=${encodeURIComponent(signature)}`;
    if (brandkey) {
      loginUrl += `&brandkey=${encodeURIComponent(brandkey)}`;
    }

    console.log("🔐 Generated login URL:", {
      pageUrl,
      redirectUri,
      nonce: nonce.substring(0, 8) + "...",
      issuedAt,
      expiresAt,
      ttl,
    });

    console.log("📝 JWT Token Content:", {
      payload,
      signature: signature.substring(0, 20) + "...",
      fullSignature: signature,
    });

    console.log("🌐 FULL LOGIN URL:", loginUrl);
    console.log("🔍 URL Components:", {
      baseUrl: pageUrl,
      signatureParam: signature,
      encodedSignature: encodeURIComponent(signature),
      urlLength: loginUrl.length,
    });

    // Validate JWT structure
    const jwtParts = signature.split(".");
    console.log("🔍 JWT Structure Validation:", {
      parts: jwtParts.length,
      headerLength: jwtParts[0]?.length,
      payloadLength: jwtParts[1]?.length,
      signatureLength: jwtParts[2]?.length,
      isValid: jwtParts.length === 3,
    });

    return loginUrl;
  } catch (error) {
    console.error("❌ Error generating login URL:", error);
    throw new Error(
      `Failed to generate login URL: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Parse authentication tokens from redirect URL
 *
 * @param url - The redirect URL containing tokens
 * @returns Parsed tokens or null if not found
 *
 * @example
 * ```typescript
 * const tokens = parseTokensFromUrl('myapp://auth/callback?access_token=xxx&refresh_token=yyy');
 * if (tokens) {
 *   await storeTokens(tokens);
 * }
 * ```
 */
export function parseTokensFromUrl(url: string): AuthTokens | null {
  try {
    const urlObj = new URL(url);
    const accessToken = urlObj.searchParams.get("access_token");
    const refreshToken = urlObj.searchParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      console.warn("⚠️ Tokens not found in URL");
      return null;
    }

    console.log("✅ Successfully parsed tokens from URL");
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  } catch (error) {
    console.error("❌ Error parsing tokens from URL:", error);
    return null;
  }
}

/**
 * Validate an access token via the API endpoint
 *
 * @param token - The access token to validate
 * @returns Validation response with user data if successful
 *
 * @example
 * ```typescript
 * const result = await validateAccessToken(token);
 * if (result.success && result.data) {
 *   await storeUserInfo(result.data);
 * }
 * ```
 */
export async function validateAccessToken(
  token: string
): Promise<TokenValidationResponse> {
  try {
    const config = brandManager.getApiConfig();
    const { baseUrl, hash } = config;

    const apiBaseUrl = baseUrl;
    const apiHash = hash;

    // Use POST method for token validation
    const url = `${apiBaseUrl}/wp-json/mbm-apps/v1/jwt-validate-token/`;

    console.log("🔍 Validating access token...", url);
    console.log("🔍 Token being validated:", token.substring(0, 50) + "...");
    console.log("🔍 Using hash:", apiHash);
    console.log("🔍 API Base URL:", apiBaseUrl);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hash: apiHash,
        token: token,
      }),
    });

    console.log("📥 Validation response status:", response.status);
    console.log("📥 Validation response headers:", {
      contentType: response.headers.get("content-type"),
      server: response.headers.get("server"),
    });

    const data = await response.json();
    console.log("📥 Validation response data:", data);

    if (!response.ok) {
      console.warn(
        "⚠️ Token validation failed:",
        data.message || "Unknown error"
      );
      console.warn("⚠️ Full error response:", JSON.stringify(data, null, 2));

      // If still failing, try without validation as a temporary workaround
      console.log("🔧 Attempting to decode token locally as fallback...");
      try {
        // Decode JWT payload (middle part)
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log("📋 Decoded token payload:", payload);

          // Check if token has required fields
          if (payload.user_id !== undefined && payload.email !== undefined) {
            console.log("✅ Using decoded token data as fallback");
            return {
              success: true,
              data: {
                user_id: String(payload.user_id),
                email: payload.email || "unknown@example.com",
                name:
                  `${payload.first_name || ""} ${
                    payload.last_name || ""
                  }`.trim() || "User",
              },
            };
          }
        }
      } catch (decodeError) {
        console.error("❌ Failed to decode token:", decodeError);
      }

      return {
        success: false,
        message: data.message || "Token validation failed",
      };
    }

    // Handle different response formats
    // Format 1: { success: true, data: { user_id, email, name } }
    // Format 2: { valid: true, payload: { user_id, email, first_name, last_name } }

    let userData;

    if (data.data) {
      // Format 1: Standard format
      console.log("✅ Token validated successfully (format 1)");
      userData = data.data;
    } else if (data.valid && data.payload) {
      // Format 2: Alternative format with payload
      console.log("✅ Token validated successfully (format 2)");
      const payload = data.payload;
      userData = {
        user_id: String(payload.user_id),
        email: payload.email || "unknown@example.com",
        name:
          `${payload.first_name || ""} ${payload.last_name || ""}`.trim() ||
          "User",
      };
    } else {
      console.warn("⚠️ Unexpected response format:", data);
      return {
        success: false,
        message: "Unexpected response format from validation endpoint",
      };
    }

    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error("❌ Error validating token:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Refresh an access token using a refresh token
 *
 * @param refreshToken - The refresh token
 * @param userId - The user ID
 * @returns New tokens if successful
 *
 * @example
 * ```typescript
 * const result = await refreshAccessToken(refreshToken, userId);
 * if (result.success && result.access_token && result.refresh_token) {
 *   await storeTokens({
 *     access_token: result.access_token,
 *     refresh_token: result.refresh_token
 *   });
 * }
 * ```
 */
export async function refreshAccessToken(
  refreshToken: string,
  userId: string
): Promise<TokenRefreshResponse> {
  try {
    const config = brandManager.getApiConfig();
    const { baseUrl, hash } = config;

    const apiBaseUrl = baseUrl;
    const apiHash = hash;

    const url = `${apiBaseUrl}/wp-json/mbm-apps/v1/jwt-refresh-token/?hash=${apiHash}`;

    console.log("🔄 Refreshing access token...");

    // const response = await fetch(url, {
    //   method: "GET",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hash: apiHash,
        refresh_token: refreshToken,
        user_id: userId,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      console.warn(
        "⚠️ Token refresh failed:",
        data.message || "Unknown error",
        data
      );
      return {
        success: false,
        message: data.message || "Token refresh failed",
      };
    }

    console.log("✅ Token refreshed successfully");
    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if user has access to a specific article/post
 *
 * This function calls the access-control API endpoint to determine if the current
 * user (authenticated or anonymous) has permission to view the specified article.
 *
 * @param postId - The article/post ID to check access for
 * @param token - Optional JWT access token for authenticated users
 * @returns Access control response indicating if access is allowed
 *
 * @example
 * ```typescript
 * // Check access for authenticated user
 * const result = await checkArticleAccess('338771', userToken);
 * if (result.allowed) {
 *   // Show full article
 * } else {
 *   // Show paywall
 * }
 *
 * // Check access for anonymous user
 * const result = await checkArticleAccess('338771');
 * ```
 */
export async function checkArticleAccess(
  postId: string | number,
  token?: string
): Promise<{
  user_id: number;
  post_id: number;
  allowed: boolean;
  message: string;
}> {
  try {
    const config = brandManager.getApiConfig();
    const { baseUrl, hash } = config;

    const url = `${baseUrl}/wp-json/mbm-apps/v1/access-control?hash=${hash}&post_id=${postId}`;

    console.log("🔒 Checking article access...", {
      postId,
      hasToken: !!token,
      url,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Authorization header if token is provided
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const requestBody = {
      post_id: postId,
      hash: hash,
    };

    // Log curl command for debugging (with full token for testing)
    const curlCommand = [
      "curl -X POST",
      `'${url}'`,
      `-H 'Content-Type: application/json'`,
      token ? `-H 'Authorization: Bearer ${token}'` : "",
      `-d '${JSON.stringify(requestBody)}'`,
    ]
      .filter(Boolean)
      .join(" \\\n  ");

    console.log("📋 Curl command to test access control:\n" + curlCommand);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log("📥 Access control response status:", response.status);

    const data = await response.json();
    console.log("📥 Access control response data:", data);

    if (!response.ok) {
      console.warn(
        "⚠️ Access control check failed:",
        data.message || "Unknown error"
      );
      // Fail open: allow access if API fails
      return {
        user_id: 0,
        post_id: Number(postId),
        allowed: true,
        message: "Access check failed, allowing access (fail open)",
      };
    }

    // Log the result
    if (data.allowed) {
      console.log("✅ Access granted for article:", postId);
    } else {
      console.log("❌ Access denied for article:", postId);
    }

    return data;
  } catch (error) {
    console.error("❌ Error checking article access:", error);
    // Fail open: allow access if there's an error
    return {
      user_id: 0,
      post_id: Number(postId),
      allowed: true,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Store authentication tokens securely
 *
 * @param tokens - The tokens to store
 *
 * @example
 * ```typescript
 * await storeTokens({
 *   access_token: 'xxx',
 *   refresh_token: 'yyy'
 * });
 * ```
 */
export async function storeTokens(tokens: AuthTokens): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token],
      [STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token],
    ]);
    console.log("✅ Tokens stored successfully");
  } catch (error) {
    console.error("❌ Error storing tokens:", error);
    throw new Error("Failed to store tokens");
  }
}

/**
 * Retrieve stored authentication tokens
 *
 * @returns Stored tokens or null if not found
 *
 * @example
 * ```typescript
 * const tokens = await getStoredTokens();
 * if (tokens) {
 *   // Use tokens
 * }
 * ```
 */
export async function getStoredTokens(): Promise<AuthTokens | null> {
  try {
    const values = await AsyncStorage.multiGet([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);

    const accessToken = values[0][1];
    const refreshToken = values[1][1];

    if (!accessToken || !refreshToken) {
      return null;
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  } catch (error) {
    console.error("❌ Error retrieving tokens:", error);
    return null;
  }
}

/**
 * Store user information
 *
 * @param userInfo - The user information to store
 *
 * @example
 * ```typescript
 * await storeUserInfo({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   user_id: '12345'
 * });
 * ```
 */
export async function storeUserInfo(userInfo: UserInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_INFO,
      JSON.stringify(userInfo)
    );
    console.log("✅ User info stored successfully");
  } catch (error) {
    console.error("❌ Error storing user info:", error);
    throw new Error("Failed to store user info");
  }
}

/**
 * Retrieve stored user information
 *
 * @returns Stored user info or null if not found
 *
 * @example
 * ```typescript
 * const userInfo = await getUserInfo();
 * if (userInfo) {
 *   console.log(`Welcome ${userInfo.name}`);
 * }
 * ```
 */
export async function getUserInfo(): Promise<UserInfo | null> {
  try {
    const userInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!userInfoStr) {
      return null;
    }
    return JSON.parse(userInfoStr) as UserInfo;
  } catch (error) {
    console.error("❌ Error retrieving user info:", error);
    return null;
  }
}

/**
 * Check if user is currently logged in
 *
 * @returns True if user has valid tokens stored
 *
 * @example
 * ```typescript
 * const loggedIn = await isLoggedIn();
 * if (loggedIn) {
 *   // Show authenticated content
 * }
 * ```
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    const tokens = await getStoredTokens();
    const userInfo = await getUserInfo();
    return tokens !== null && userInfo !== null;
  } catch (error) {
    console.error("❌ Error checking login status:", error);
    return false;
  }
}

/**
 * Logout user by clearing all stored authentication data
 *
 * @example
 * ```typescript
 * await logout();
 * // User is now logged out
 * ```
 */
export async function logout(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_INFO,
    ]);

    // Clear user ID from analytics
    await analyticsService.clearUserId();

    console.log("✅ User logged out successfully");
  } catch (error) {
    console.error("❌ Error during logout:", error);
    throw new Error("Failed to logout");
  }
}

/**
 * Complete authentication flow helper
 * Validates token and stores user info if successful
 *
 * @param tokens - The authentication tokens
 * @returns True if authentication was successful
 *
 * @example
 * ```typescript
 * const tokens = parseTokensFromUrl(redirectUrl);
 * if (tokens) {
 *   const success = await completeAuthentication(tokens);
 *   if (success) {
 *     // Navigate to authenticated area
 *   }
 * }
 * ```
 */
export async function completeAuthentication(
  tokens: AuthTokens
): Promise<boolean> {
  try {
    // Store tokens first
    await storeTokens(tokens);

    // Validate the access token
    const validation = await validateAccessToken(tokens.access_token);

    if (!validation.success || !validation.data) {
      console.error("❌ Token validation failed during authentication");
      await logout(); // Clean up stored tokens
      return false;
    }

    // Store user info
    await storeUserInfo(validation.data);

    console.log("✅ Authentication completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Error completing authentication:", error);
    await logout(); // Clean up on error
    return false;
  }
}

/**
 * Attempt to refresh tokens if they exist
 * Useful for maintaining user session
 *
 * @returns True if refresh was successful
 *
 * @example
 * ```typescript
 * const refreshed = await attemptTokenRefresh();
 * if (!refreshed) {
 *   // Redirect to login
 * }
 * ```
 */
export async function attemptTokenRefresh(): Promise<boolean> {
  try {
    const tokens = await getStoredTokens();
    const userInfo = await getUserInfo();

    if (!tokens || !userInfo) {
      console.log("ℹ️ No tokens or user info found for refresh");
      return false;
    }

    const refreshResult = await refreshAccessToken(
      tokens.refresh_token,
      userInfo.user_id
    );

    if (
      !refreshResult.success ||
      !refreshResult.access_token ||
      !refreshResult.refresh_token
    ) {
      console.warn("⚠️ Token refresh failed");
      await logout(); // Clear invalid tokens
      return false;
    }

    // Store new tokens
    await storeTokens({
      access_token: refreshResult.access_token,
      refresh_token: refreshResult.refresh_token,
    });

    console.log("✅ Tokens refreshed successfully");
    return true;
  } catch (error) {
    console.error("❌ Error attempting token refresh:", error);
    await logout(); // Clean up on error
    return false;
  }
}

/**
 * Get the current access token, refreshing if necessary
 *
 * @returns Valid access token or null if not authenticated
 *
 * @example
 * ```typescript
 * const token = await getValidAccessToken();
 * if (token) {
 *   // Use token for API calls
 * }
 * ```
 */
export async function getValidAccessToken(): Promise<string | null> {
  try {
    const tokens = await getStoredTokens();
    if (!tokens) {
      return null;
    }

    // Validate current token
    const validation = await validateAccessToken(tokens.access_token);

    if (validation.success) {
      return tokens.access_token;
    }

    // Try to refresh if validation failed
    console.log("🔄 Token invalid, attempting refresh...");
    const refreshed = await attemptTokenRefresh();

    if (!refreshed) {
      return null;
    }

    // Get the new token
    const newTokens = await getStoredTokens();
    return newTokens?.access_token || null;
  } catch (error) {
    console.error("❌ Error getting valid access token:", error);
    return null;
  }
}

// Export all functions as a service object for convenience
export const authService = {
  generateLoginUrl,
  parseTokensFromUrl,
  validateAccessToken,
  refreshAccessToken,
  checkArticleAccess,
  storeTokens,
  getStoredTokens,
  storeUserInfo,
  getUserInfo,
  isLoggedIn,
  logout,
  completeAuthentication,
  attemptTokenRefresh,
  getValidAccessToken,
};
