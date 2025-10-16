import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { OnboardingContainer } from "@/components/onboarding";
import { AudioProvider } from "@/contexts/AudioContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { hasCompletedOnboarding } from "@/services/onboarding";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );
  const lastHandledNotificationTime = useRef<number>(0);

  useEffect(() => {
    console.log("🚀 App starting - setting up notification handlers...");
    checkOnboardingStatus();

    // Call async function
    setupNotificationHandlers().catch((error) => {
      console.error("Error setting up notification handlers:", error);
    });

    // Handle app state changes (background to foreground)
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          console.log(
            "📱 App came to foreground - checking for notifications..."
          );
          const lastResponse =
            await Notifications.getLastNotificationResponseAsync();
          if (lastResponse) {
            const responseTime = lastResponse.notification.date;

            // Only handle if this notification is newer than the last one we handled
            if (responseTime > lastHandledNotificationTime.current) {
              console.log("🎯 Found new notification from background!");
              lastHandledNotificationTime.current = responseTime;
              handleNotificationResponse(lastResponse);
            } else {
              console.log("⏭️ Already handled this notification, skipping");
            }
          }
        }
      }
    );

    return () => {
      console.log("🛑 App unmounting - cleaning up notification listeners");
      subscription.remove();
      console.log("🛑 App unmounting - cleaning up notification listeners");
      // Cleanup notification listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
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

  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    console.log("👆 Notification tapped!");
    console.log("👆 Full response:", JSON.stringify(response, null, 2));

    // Update the last handled notification time
    const responseTime = response.notification.date;
    lastHandledNotificationTime.current = responseTime;
    console.log("⏰ Updated last handled time:", responseTime);

    const data = response.notification.request.content.data;
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
    console.log("📱 Setting up notification handlers...");

    try {
      // Check if app was opened by tapping a notification
      const lastNotificationResponse =
        await Notifications.getLastNotificationResponseAsync();
      console.log("🔍 Checking for last notification response...");

      if (lastNotificationResponse) {
        console.log("🎯 App was opened from notification!");
        handleNotificationResponse(lastNotificationResponse);
      } else {
        console.log("ℹ️ App was opened normally (not from notification)");
      }

      // Handle notifications received while app is in foreground
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("📬 Notification received:", notification);
          console.log(
            "📬 Notification data:",
            notification.request.content.data
          );
        });
      console.log("✅ Notification received listener registered");

      // Handle notification taps (when user taps on notification)
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("🔔 Response listener triggered!");
          handleNotificationResponse(response);
        });
      console.log("✅ Notification response listener registered");
      console.log("✅ All notification handlers set up successfully!");

      // Test that listeners are working
      console.log("🧪 Listeners registered:", {
        received: !!notificationListener.current,
        response: !!responseListener.current,
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
