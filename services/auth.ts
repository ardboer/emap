import { brandManager } from "@/config/BrandManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import QuickCrypto from "react-native-quick-crypto";

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
    const { redirectUri, pageUrl, ttl = 3600, secret } = params;

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

    // Construct login URL with signature
    const loginUrl = `${pageUrl}?signature=${encodeURIComponent(signature)}`;

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
    });

    console.log("🌐 FULL LOGIN URL:", loginUrl);

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
    const { baseUrl, authUrl, hash, authHash } = config;

    // Use authUrl for authentication endpoints if available
    const apiBaseUrl = authUrl || baseUrl;
    // Use authHash for authentication endpoints if available, otherwise use regular hash
    const apiHash = authHash || hash;

    const url = `${apiBaseUrl}/wp-json/mbm-apps/v1/jwt-validate-token/?hash=${apiHash}&token=${encodeURIComponent(
      token
    )}`;

    console.log("🔍 Validating access token...");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn(
        "⚠️ Token validation failed:",
        data.message || "Unknown error"
      );
      return {
        success: false,
        message: data.message || "Token validation failed",
      };
    }

    console.log("✅ Token validated successfully");
    return {
      success: true,
      data: data.data,
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
    const { baseUrl, authUrl, hash, authHash } = config;

    // Use authUrl for authentication endpoints if available
    const apiBaseUrl = authUrl || baseUrl;
    // Use authHash for authentication endpoints if available, otherwise use regular hash
    const apiHash = authHash || hash;

    const url = `${apiBaseUrl}/wp-json/mbm-apps/v1/jwt-refresh-token/?hash=${apiHash}&refresh_token=${encodeURIComponent(
      refreshToken
    )}&user_id=${encodeURIComponent(userId)}`;

    console.log("🔄 Refreshing access token...");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn("⚠️ Token refresh failed:", data.message || "Unknown error");
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
