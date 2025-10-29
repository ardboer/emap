import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { OnboardingContainer } from "@/components/onboarding";
import { AudioProvider } from "@/contexts/AudioContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { analyticsService } from "@/services/analytics";
import { initializeFirebase } from "@/services/firebaseInit";
import {
  getInitialNotification,
  onMessageReceived,
  onNotificationOpened,
} from "@/services/firebaseNotifications";
import { hasCompletedOnboarding } from "@/services/onboarding";
import { getAllFonts } from "@/utils/fontLoader";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  // Automatically load all fonts from assets/fonts directory
  const [loaded] = useFonts(getAllFonts());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const notificationUnsubscribe = useRef<(() => void) | undefined>(undefined);
  const messageUnsubscribe = useRef<(() => void) | undefined>(undefined);
  const lastHandledNotificationTime = useRef<number>(0);

  // App state tracking for analytics
  const appState = useRef(AppState.currentState);
  const previousRoute = useRef<string | null>(null);

  useEffect(() => {
    console.log("🚀 App starting - initializing Firebase...");

    // Initialize Firebase first, then set up notification handlers and analytics
    const initializeApp = async () => {
      try {
        // Initialize Firebase
        const firebaseInitialized = await initializeFirebase();

        if (firebaseInitialized) {
          console.log(
            "✅ Firebase initialized, setting up notification handlers and analytics..."
          );
          await setupNotificationHandlers();

          // Initialize Firebase Analytics
          await analyticsService.initialize();
        } else {
          console.warn(
            "⚠️ Firebase initialization failed - notifications and analytics will not work"
          );
        }
      } catch (error) {
        console.error("❌ Error during app initialization:", error);
      }
    };

    checkOnboardingStatus();
    initializeApp();

    return () => {
      console.log(
        "🛑 App unmounting - cleaning up listeners and ending session"
      );
      // Cleanup notification listeners
      if (notificationUnsubscribe.current) {
        notificationUnsubscribe.current();
      }
      if (messageUnsubscribe.current) {
        messageUnsubscribe.current();
      }

      // End analytics session
      analyticsService.endSession();
    };
  }, []);

  // Track app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // App came to foreground
      await analyticsService.logAppForeground(appState.current);
      console.log("📱 App came to foreground");
    } else if (
      appState.current === "active" &&
      nextAppState.match(/inactive|background/)
    ) {
      // App went to background
      await analyticsService.logAppBackground(nextAppState);
      console.log("📱 App went to background");
    }

    appState.current = nextAppState;
  };

  // Track navigation changes
  useEffect(() => {
    if (!pathname) return;

    const currentRoute = pathname;

    if (previousRoute.current && previousRoute.current !== currentRoute) {
      // Log navigation event
      analyticsService.logNavigation(previousRoute.current, currentRoute, {
        segments: segments.join("/"),
      });
      console.log(`📍 Navigation: ${previousRoute.current} → ${currentRoute}`);
    }

    previousRoute.current = currentRoute;
  }, [pathname, segments]);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await hasCompletedOnboarding();
      setShowOnboarding(!completed);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // If there's an error, don't show onboarding
      setShowOnboarding(false);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleNotificationResponse = (remoteMessage: any) => {
    console.log("👆 Notification tapped!");
    console.log("👆 Full message:", JSON.stringify(remoteMessage, null, 2));

    // Update the last handled notification time
    const responseTime = Date.now();
    lastHandledNotificationTime.current = responseTime;
    console.log("⏰ Updated last handled time:", responseTime);

    const data = remoteMessage.data;
    console.log("👆 Notification data:", data);

    // Handle article notifications
    if (data && data.type === "article" && data.articleId) {
      console.log("📰 Opening article:", data.articleId);
      // Use setTimeout to ensure router is ready
      setTimeout(() => {
        router.push(`/article/${data.articleId}`);
      }, 100);
    } else {
      console.log("⚠️ No article data found in notification");
      console.log("⚠️ Data type:", data?.type);
      console.log("⚠️ Article ID:", data?.articleId);
    }
  };

  const setupNotificationHandlers = async () => {
    console.log("📱 Setting up Firebase notification handlers...");

    try {
      // Check if app was opened by tapping a notification
      const initialNotification = await getInitialNotification();
      console.log("🔍 Checking for initial notification...");

      if (initialNotification) {
        console.log("🎯 App was opened from notification!");
        handleNotificationResponse(initialNotification);
      } else {
        console.log("ℹ️ App was opened normally (not from notification)");
      }

      // Handle notifications received while app is in foreground
      messageUnsubscribe.current = onMessageReceived((remoteMessage) => {
        console.log("📬 Foreground notification received:", remoteMessage);
        console.log("📬 Notification data:", remoteMessage.data);
      });
      console.log("✅ Foreground message listener registered");

      // Handle notification taps (when user taps on notification from background)
      notificationUnsubscribe.current = onNotificationOpened(
        (remoteMessage) => {
          console.log("🔔 Notification opened from background!");
          handleNotificationResponse(remoteMessage);
        }
      );
      console.log("✅ Notification opened listener registered");
      console.log("✅ All Firebase notification handlers set up successfully!");

      // Test that listeners are working
      console.log("🧪 Listeners registered:", {
        message: !!messageUnsubscribe.current,
        opened: !!notificationUnsubscribe.current,
      });
    } catch (error) {
      console.error("❌ Error setting up notification handlers:", error);
    }
  };
  // Deep linking is now handled by the catch-all route: app/[...slug].tsx
  // Expo Router automatically routes URLs to the appropriate screen

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (!loaded || isCheckingOnboarding) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AudioProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false, title: "" }}
              />
              <Stack.Screen
                name="article/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="event/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="pdf/[id]"
                options={{
                  headerBackTitle: " ",
                }}
              />
              <Stack.Screen
                name="search"
                options={{
                  presentation: "modal",
                  headerShown: false,
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
            {showOnboarding && (
              <OnboardingContainer onComplete={handleOnboardingComplete} />
            )}
          </ThemeProvider>
        </AudioProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
