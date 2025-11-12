import { brandManager } from "@/config/BrandManager";
import {
  logout as authLogout,
  refreshAccessToken as authRefreshToken,
  completeAuthentication,
  generateLoginUrl,
  getStoredTokens,
  getUserInfo,
  isTokenExpired,
  parseTokensFromUrl,
  UserInfo,
} from "@/services/auth";
import { crashlyticsService } from "@/services/crashlytics";
import * as WebBrowser from "expo-web-browser";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { Alert, Platform } from "react-native";

// Types
interface User {
  email: string;
  firstName: string;
  lastName: string;
  userId: string;
  subscriptionType?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User | null }
  | {
      type: "SET_TOKENS";
      payload: { accessToken: string; refreshToken: string };
    }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "LOGOUT" };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
        error: null,
      };
    case "SET_TOKENS":
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "LOGOUT":
      return {
        ...initialState,
        isLoading: false,
      };
    default:
      return state;
  }
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  getValidAccessToken: () => Promise<string | null>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Convert UserInfo from auth service to User type
   */
  const convertUserInfo = (userInfo: UserInfo): User => {
    // Split name into first and last name
    const nameParts = userInfo.name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
      email: userInfo.email,
      firstName,
      lastName,
      userId: userInfo.user_id,
      subscriptionType: undefined, // Can be extended later
    };
  };

  /**
   * Check authentication status on mount
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      console.log("🔍 Checking authentication status...");
      dispatch({ type: "SET_LOADING", payload: true });

      // Get stored tokens
      const tokens = await getStoredTokens();
      if (!tokens) {
        console.log("ℹ️ No stored tokens found");
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      // Get stored user info
      const userInfo = await getUserInfo();
      if (!userInfo) {
        console.log("ℹ️ No stored user info found");
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      // Update state with stored data
      dispatch({
        type: "SET_TOKENS",
        payload: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        },
      });
      const user = convertUserInfo(userInfo);
      dispatch({ type: "SET_USER", payload: user });

      // Set Crashlytics user ID
      await crashlyticsService.setUserId(user.userId);
      await crashlyticsService.setUserAttributes({
        email: user.email,
        subscription_type: user.subscriptionType || "unknown",
      });

      console.log("✅ Authentication status restored from storage");
    } catch (error) {
      console.error("❌ Error checking auth status:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to check authentication status",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  /**
   * Refresh the access token
   */
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log("🔄 Refreshing access token...");

      if (!state.refreshToken || !state.user?.userId) {
        console.warn("⚠️ Missing refresh token or user ID");
        return false;
      }

      const result = await authRefreshToken(
        state.refreshToken,
        state.user.userId
      );

      if (!result.success || !result.access_token || !result.refresh_token) {
        console.error("❌ Token refresh failed:", result.message);
        dispatch({
          type: "SET_ERROR",
          payload: result.message || "Failed to refresh token",
        });
        return false;
      }

      // Update tokens in state
      dispatch({
        type: "SET_TOKENS",
        payload: {
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
        },
      });

      console.log("✅ Access token refreshed successfully");
      return true;
    } catch (error) {
      console.error("❌ Error refreshing token:", error);
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to refresh token",
      });
      return false;
    }
  }, [state.refreshToken, state.user?.userId]);

  /**
   * Get a valid access token, refreshing if expired or expiring soon
   * This should be used instead of directly accessing state.accessToken
   * to ensure the token is always valid before use
   */
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    const currentToken = state.accessToken;

    if (!currentToken) {
      console.log("🔍 [GET-VALID-TOKEN] No access token available");
      return null;
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    if (isTokenExpired(currentToken, 300)) {
      console.log(
        "🔄 [GET-VALID-TOKEN] Token expired/expiring, attempting refresh..."
      );

      // Attempt to refresh the token
      const success = await refreshAccessToken();

      if (!success) {
        console.error("❌ [GET-VALID-TOKEN] Token refresh failed");
        return null;
      }

      console.log("✅ [GET-VALID-TOKEN] Token refreshed successfully");
      // Return the newly refreshed token from state
      return state.accessToken;
    }

    console.log("✅ [GET-VALID-TOKEN] Token is valid, returning current token");
    return currentToken;
  }, [state.accessToken, refreshAccessToken]);

  /**
   * Initiate login flow using expo-web-browser
   */
  const login = useCallback(async () => {
    try {
      console.log("🔐 Starting login flow...");
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      // Show alert before opening browser
      const userConfirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Sign In",
          "You will be redirected to a secure login page in your browser. After signing in, you'll be automatically returned to the app.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: "Continue",
              onPress: () => resolve(true),
            },
          ],
          { cancelable: false }
        );
      });

      // Check if user cancelled
      if (!userConfirmed) {
        console.log("ℹ️ User cancelled login");
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      // Get brand configuration
      const brandConfig = brandManager.getCurrentBrand();
      const { shortcode, apiConfig } = brandConfig;

      const authBaseUrl = apiConfig.baseUrl;

      // Generate redirect URI using app's custom scheme
      // The server must redirect to this scheme for the app to intercept it
      const redirectUri = `${shortcode}://auth/callback`;
      // const redirectUri = authBaseUrl.endsWith("/")
      //   ? authBaseUrl
      //   : `${authBaseUrl}/`;

      // Use authUrl if available, otherwise fall back to baseUrl
      const authUrl = apiConfig.authUrl || authBaseUrl;

      // Get login page URL from brand config
      const loginPageUrl = `${authUrl}/mobile-app-login/`;

      // Get secret from brand config, then environment, then fallback
      // Use authHash if available, otherwise fall back to hash
      const secret =
        apiConfig.authHash ||
        apiConfig.jwtSecret ||
        process.env.EXPO_PUBLIC_JWT_SECRET ||
        "your-secret-key";

      if (secret === "your-secret-key") {
        console.warn(
          "⚠️ Using default JWT secret! Please configure authHash or jwtSecret in brand config or EXPO_PUBLIC_JWT_SECRET environment variable"
        );
      }

      console.log("📱 Login configuration:", {
        secret,
        redirectUri,
        loginPageUrl,
        authUrl: apiConfig.authUrl ? "Using authUrl" : "Using baseUrl",
        authHash: apiConfig.authHash ? "Using authHash" : "Using fallback",
        brand: shortcode,
      });

      // Generate login URL with JWT signature
      const loginUrl = await generateLoginUrl({
        redirectUri,
        pageUrl: loginPageUrl,
        ttl: 3600,
        secret,
        brandkey: shortcode,
      });

      console.log("🌐 Opening authentication session...");
      console.log("📋 Login URL being opened:", loginUrl);
      console.log("📋 Redirect URI:", redirectUri);
      console.log("📋 URL Length:", loginUrl.length);

      // Test if URL is accessible first
      console.log("🧪 Testing URL accessibility...");
      console.log("add date now string to url");
      const now = Date.now();
      try {
        const testResponse = await fetch(loginUrl + "&key=" + now, {
          method: "HEAD",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
          },
        });
        console.log("✅ URL is accessible, status:", testResponse.status);
        console.log("📋 Response headers:", {
          contentType: testResponse.headers.get("content-type"),
          csp: testResponse.headers.get("content-security-policy"),
          xFrameOptions: testResponse.headers.get("x-frame-options"),
        });
      } catch (testError) {
        console.error("❌ URL accessibility test failed:", testError);
      }

      // Add cache-busting parameter to ensure fresh session
      // Use both query param and hash to bypass Chrome Custom Tabs caching
      const timestamp = Date.now();
      const cacheBustingUrl = `${loginUrl}${
        loginUrl.includes("?") ? "&" : "?"
      }_t=${timestamp}#t${timestamp}`;

      console.log("🔄 Cache-busting URL:", cacheBustingUrl);

      // On Android, we need to clear browser cache between login attempts
      // because Chrome Custom Tabs caches the page response aggressively
      if (Platform.OS === "android") {
        console.log("🧹 Clearing Android browser cache...");
        try {
          // Dismiss any previous browser
          await WebBrowser.dismissBrowser();
          // Warm up and cool down to try to clear cache
          await WebBrowser.warmUpAsync();
          await WebBrowser.coolDownAsync();

          // Add a small delay to ensure cache is cleared
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (e) {
          console.log("⚠️ Could not clear browser cache:", e);
        }
      }

      // Open authentication session in browser with explicit options
      console.log("🌐 Opening WebBrowser with options...");
      const result = await WebBrowser.openAuthSessionAsync(
        cacheBustingUrl,
        redirectUri,
        {
          // Use ephemeral session on both platforms to prevent caching
          // This is critical to avoid JWT token reuse issues
          preferEphemeralSession: true,
          // Show title for debugging
          showTitle: false,
          // Enable bar collapsing
          enableBarCollapsing: false,
          // On Android, don't create a new task - keep it in same context
          ...(Platform.OS === "android" && { createTask: false }),
        }
      );

      console.log("📥 Browser session result:", result.type);
      if (result.type === "success") {
        console.log("📥 Callback URL received:", result.url);
      }

      if (result.type === "success" && result.url) {
        console.log("✅ Authentication callback received");

        // Parse tokens from callback URL
        const tokens = parseTokensFromUrl(result.url);

        if (!tokens) {
          throw new Error("Failed to parse tokens from callback URL");
        }

        console.log("🔑 Tokens parsed successfully");

        // Complete authentication (validates token and stores user info)
        const success = await completeAuthentication(tokens);

        if (!success) {
          throw new Error("Failed to complete authentication");
        }

        // Get user info from storage
        const userInfo = await getUserInfo();
        if (!userInfo) {
          throw new Error("Failed to retrieve user information");
        }

        // Update state
        dispatch({
          type: "SET_TOKENS",
          payload: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          },
        });
        const user = convertUserInfo(userInfo);
        dispatch({ type: "SET_USER", payload: user });

        // Set Crashlytics user ID and attributes
        await crashlyticsService.setUserId(user.userId);
        await crashlyticsService.setUserAttributes({
          email: user.email,
          subscription_type: user.subscriptionType || "unknown",
        });

        console.log("✅ Login successful");
      } else if (result.type === "cancel") {
        console.log("ℹ️ User cancelled login");
        dispatch({ type: "SET_ERROR", payload: "Login cancelled" });
      } else {
        console.warn("⚠️ Unexpected browser result:", result.type);
        dispatch({
          type: "SET_ERROR",
          payload: "Login failed - unexpected result",
        });
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "An error occurred during login",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  /**
   * Logout user and clear all auth data
   */
  const logout = useCallback(async () => {
    try {
      console.log("🚪 Logging out...");
      dispatch({ type: "SET_LOADING", payload: true });

      // On Android, clear browser cache on logout to prevent white screen on next login
      if (Platform.OS === "android") {
        try {
          console.log("🧹 Clearing browser cache on logout...");
          await WebBrowser.warmUpAsync();
          await WebBrowser.coolDownAsync();
        } catch (e) {
          console.log("⚠️ Could not clear browser cache on logout:", e);
        }
      }

      // Clear stored auth data
      await authLogout();

      // Clear Crashlytics user ID
      await crashlyticsService.setUserId("anonymous");

      // Reset state
      dispatch({ type: "LOGOUT" });

      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to logout",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        error: state.error,
        login,
        logout,
        refreshAccessToken,
        getValidAccessToken,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
