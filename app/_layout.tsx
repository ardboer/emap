import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { OnboardingContainer } from "@/components/onboarding";
import { AudioProvider } from "@/contexts/AudioContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { hasCompletedOnboarding } from "@/services/onboarding";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
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
