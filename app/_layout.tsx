import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { OnboardingContainer } from "@/components/onboarding";
import { AudioProvider } from "@/contexts/AudioContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { initializeFirebase } from "@/services/firebaseInit";
import {
  getInitialNotification,
  onMessageReceived,
  onNotificationOpened,
} from "@/services/firebaseNotifications";
import { hasCompletedOnboarding } from "@/services/onboarding";
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const notificationUnsubscribe = useRef<(() => void) | undefined>(undefined);
  const messageUnsubscribe = useRef<(() => void) | undefined>(undefined);
  const lastHandledNotificationTime = useRef<number>(0);

  useEffect(() => {
    console.log("🚀 App starting - initializing Firebase...");

    // Initialize Firebase first, then set up notification handlers
    const initializeApp = async () => {
      try {
        // Initialize Firebase
        const firebaseInitialized = await initializeFirebase();

        if (firebaseInitialized) {
          console.log(
            "✅ Firebase initialized, setting up notification handlers..."
          );
          await setupNotificationHandlers();
        } else {
          console.warn(
            "⚠️ Firebase initialization failed - notifications will not work"
          );
        }
      } catch (error) {
        console.error("❌ Error during app initialization:", error);
      }
    };

    checkOnboardingStatus();
    initializeApp();

    return () => {
      console.log("🛑 App unmounting - cleaning up notification listeners");
      // Cleanup notification listeners
      if (notificationUnsubscribe.current) {
        notificationUnsubscribe.current();
      }
      if (messageUnsubscribe.current) {
        messageUnsubscribe.current();
      }
    };
  }, []);

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

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (!loaded || isCheckingOnboarding) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AudioProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="article/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
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
    </GestureHandlerRootView>
  );
}
