import { BrandLogo } from "@/components/BrandLogo";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { getCenteredContentStyle } from "@/constants/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";
import { analyticsService } from "@/services/analytics";
import React from "react";
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = 600;

interface PaywallBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  onSignIn: () => void;
}

export function PaywallBottomSheet({
  visible,
  onClose,
  onSubscribe,
  onSignIn,
}: PaywallBottomSheetProps) {
  const colorScheme = useColorScheme();
  const { colors, paywall } = useBrandConfig();
  const { login, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;

  // Automatically close paywall when user successfully logs in
  // NOTE: This is disabled when using access control API, as authentication
  // alone doesn't guarantee access - the API determines that
  React.useEffect(() => {
    // Only auto-close if user authenticates while paywall is visible
    // This helps with the sign-in flow, but we rely on the parent component
    // to control visibility based on actual access permissions
    if (isAuthenticated && visible) {
      console.log(
        "[PaywallBottomSheet] User authenticated, paywall will be controlled by access check"
      );
      // Don't auto-close - let the access control API determine if paywall should close
      // onClose();
    }
  }, [isAuthenticated, visible, onClose]);

  // Log safe area insets for debugging
  React.useEffect(() => {
    console.log("[PaywallBottomSheet] Platform:", Platform.OS);
    console.log("[PaywallBottomSheet] Safe Area Insets:", {
      top: insets.top,
      bottom: insets.bottom,
      left: insets.left,
      right: insets.right,
    });
    console.log("[PaywallBottomSheet] Screen Height:", SCREEN_HEIGHT);
    console.log("[PaywallBottomSheet] Sheet Height:", SHEET_HEIGHT);
  }, [insets]);

  // Get paywall configuration from brand config with fallbacks
  const paywallConfig = paywall || {
    headline: "Subscribe Today",
    subheadline: "Get unlimited access to all articles",
    benefits: [
      "6,000 peer reviewed clinical articles",
      "Latest news and expert analysis",
      "AI powered ASK Nursing Times tool",
      "Over 40 topics from anatomy to workforce",
    ],
    primaryButtonText: "Subscribe Now",
    secondaryButtonText: "Sign In",
  };

  // Handle primary button press - use URL if configured, otherwise callback
  const handlePrimaryButtonPress = React.useCallback(() => {
    // Log analytics event
    analyticsService.logEvent("paywall_subscribe_clicked", {
      button_text: paywallConfig.primaryButtonText,
      has_url: !!paywallConfig.primaryButtonUrl,
      url: paywallConfig.primaryButtonUrl || "callback",
      headline: paywallConfig.headline,
    });

    if (paywallConfig.primaryButtonUrl) {
      Linking.openURL(paywallConfig.primaryButtonUrl).catch((err) =>
        console.error("Failed to open subscription URL:", err)
      );
    } else {
      onSubscribe();
    }
  }, [paywallConfig, onSubscribe]);

  // Handle secondary button press - use auth context login (same as settings)
  const handleSecondaryButtonPress = React.useCallback(() => {
    // Log analytics event
    analyticsService.logEvent("paywall_signin_clicked", {
      button_text: paywallConfig.secondaryButtonText,
      headline: paywallConfig.headline,
    });

    // Use the same login flow as settings menu
    login();
  }, [paywallConfig, login]);

  React.useEffect(() => {
    if (visible) {
      // Log paywall shown event
      analyticsService.logEvent("paywall_shown", {
        headline: paywallConfig.headline,
        has_benefits: !!(
          paywallConfig.benefits && paywallConfig.benefits.length > 0
        ),
        benefits_count: paywallConfig.benefits?.length || 0,
        has_primary_url: !!paywallConfig.primaryButtonUrl,
        has_secondary_url: !!paywallConfig.secondaryButtonUrl,
      });

      // Animate sheet up with spring animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate sheet down
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, paywallConfig]);

  const isDark = colorScheme === "dark";
  const themeColors = colors?.[colorScheme ?? "light"];
  // Use contentBackground for consistency with article detail view
  const backgroundColor =
    (themeColors as any)?.contentBackground ||
    themeColors?.background ||
    Colors[colorScheme ?? "light"].background;
  const textColor = themeColors?.text || Colors[colorScheme ?? "light"].text;
  const primaryColor = themeColors?.primary || "#007AFF";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
      >
        <View style={styles.backdropTouchable} />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor,
            transform: [{ translateY }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
          {/* Handle Bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <BrandLogo width={140} height={50} variant="header" />
            </View>

            {/* Headline */}
            <ThemedText type="title" style={styles.headline}>
              {paywallConfig.headline}
            </ThemedText>

            {/* Subheadline */}
            <ThemedText style={styles.subheadline}>
              {paywallConfig.subheadline}
            </ThemedText>

            {/* Benefits List - Only show if benefits are configured */}
            {paywallConfig.benefits && paywallConfig.benefits.length > 0 && (
              <View style={styles.benefitsList}>
                {paywallConfig.benefits.map(
                  (benefit: string, index: number) => (
                    <View key={index} style={styles.benefitItem}>
                      <View
                        style={[
                          styles.checkmarkContainer,
                          { backgroundColor: primaryColor },
                        ]}
                      >
                        <IconSymbol
                          name="checkmark"
                          size={16}
                          color={isDark ? "#666" : "#ffffff"}
                          weight="bold"
                        />
                      </View>
                      <ThemedText style={styles.benefitText}>
                        {benefit}
                      </ThemedText>
                    </View>
                  )
                )}
              </View>
            )}

            {/* CTA Buttons */}
            <View style={styles.buttonContainer}>
              {/* Primary Button - Subscribe */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: primaryColor },
                ]}
                onPress={handlePrimaryButtonPress}
                activeOpacity={0.8}
              >
                <ThemedText
                  style={[styles.primaryButtonText, { color: "#000" }]}
                >
                  {paywallConfig.primaryButtonText}
                </ThemedText>
              </TouchableOpacity>

              {/* Secondary Button - Sign In */}
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: primaryColor,
                    backgroundColor: isDark ? backgroundColor : "transparent",
                  },
                ]}
                onPress={handleSecondaryButtonPress}
                activeOpacity={0.8}
              >
                <ThemedText
                  style={[styles.secondaryButtonText, { color: primaryColor }]}
                >
                  {paywallConfig.secondaryButtonText}
                </ThemedText>
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <ThemedText
                  style={[
                    styles.backButtonText,
                    { color: textColor },
                    Platform.OS === "android" && styles.backButtonTextAndroid,
                  ]}
                >
                  Go Back
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
  backdropTouchable: {
    flex: 1,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: SHEET_HEIGHT + (Platform.OS === "android" ? 60 : 0),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D1D6",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    ...getCenteredContentStyle(),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  headline: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 32,
  },
  benefitsList: {
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "400",
    opacity: 0.7,
    ...Platform.select({
      ios: {
        textDecorationLine: "underline",
      },
      android: {
        textDecorationLine: "underline",
        textDecorationStyle: "solid",
      },
    }),
  },
  backButtonTextAndroid: {
    textDecorationLine: "underline",
    textDecorationColor: undefined,
  },
});
