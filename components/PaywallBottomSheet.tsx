import { BrandLogo } from "@/components/BrandLogo";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { getCenteredContentStyle } from "@/constants/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { analyticsService } from "@/services/analytics";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useRef } from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

interface PaywallBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  onSignIn: () => void;
  onAuthSuccess?: () => void;
}

export function PaywallBottomSheet({
  visible,
  onClose,
  onSubscribe,
  onSignIn,
  onAuthSuccess,
}: PaywallBottomSheetProps) {
  const colorScheme = useColorScheme();
  const { colors, paywall, fonts } = useBrandConfig();
  const { login, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Define snap points
  const snapPoints = useMemo(() => [], []);

  // Watch for authentication changes
  React.useEffect(() => {
    if (isAuthenticated && visible) {
      console.log(
        "[PaywallBottomSheet] User authenticated - paywall will hide automatically via access recheck"
      );
    }
  }, [isAuthenticated, visible]);

  // Control bottom sheet visibility
  React.useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();

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
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

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

  const isDark = colorScheme === "dark";
  const themeColors = colors?.[colorScheme ?? "light"];
  // Use contentBackground for consistency with article detail view
  const backgroundColor =
    (themeColors as any)?.contentBackground ||
    themeColors?.background ||
    Colors[colorScheme ?? "light"].background;
  const textColor = themeColors?.text || Colors[colorScheme ?? "light"].text;
  const primaryColor = themeColors?.primary || "#007AFF";
  const contentBackButtonText = useThemeColor({}, "contentBackButtonText");
  const progressIndicator = themeColors?.progressIndicator;

  const actionColor = useThemeColor({}, "actionColor");
  const articlePreTeaserTitleText = Colors.light.articlePreTeaserTitleText;

  // Backdrop component - non-dismissible
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior={"none"}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      // snapPoints={snapPoints}
      enablePanDownToClose={false}
      backdropComponent={renderBackdrop}
      enableDismissOnClose={false}
      backgroundStyle={{ backgroundColor }}
      handleIndicatorStyle={{ backgroundColor: "#D1D1D6" }}
      // bottomInset={insets.bottom}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom },
        ]}
      >
        {/* Content */}
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <BrandLogo width={140} height={50} variant="header" />
          </View>

          {/* Headline */}
          <ThemedText
            type="title"
            style={[styles.headline, { fontFamily: fonts?.primaryBold }]}
          >
            {paywallConfig.headline}
          </ThemedText>

          {/* Subheadline */}
          <ThemedText style={styles.subheadline}>
            {paywallConfig.subheadline}
          </ThemedText>

          {/* Benefits List - Only show if benefits are configured */}
          {paywallConfig.benefits && paywallConfig.benefits.length > 0 && (
            <View style={styles.benefitsList}>
              {paywallConfig.benefits.map((benefit: string, index: number) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.checkmarkContainer}>
                    <Svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill={progressIndicator}
                    >
                      <Path
                        d="M9.75 0C7.82164 0 5.93657 0.571828 4.33319 1.64317C2.72982 2.71451 1.48013 4.23726 0.742179 6.01884C0.00422452 7.80042 -0.188858 9.76082 0.187348 11.6521C0.563554 13.5434 1.49215 15.2807 2.85571 16.6443C4.21928 18.0079 5.95656 18.9365 7.84787 19.3127C9.73919 19.6889 11.6996 19.4958 13.4812 18.7578C15.2627 18.0199 16.7855 16.7702 17.8568 15.1668C18.9282 13.5634 19.5 11.6784 19.5 9.75C19.4973 7.16498 18.4692 4.68661 16.6413 2.85872C14.8134 1.03084 12.335 0.00272983 9.75 0ZM14.0306 8.03063L8.78063 13.2806C8.71097 13.3504 8.62826 13.4057 8.53721 13.4434C8.44616 13.4812 8.34857 13.5006 8.25 13.5006C8.15144 13.5006 8.05385 13.4812 7.9628 13.4434C7.87175 13.4057 7.78903 13.3504 7.71938 13.2806L5.46938 11.0306C5.32865 10.8899 5.24959 10.699 5.24959 10.5C5.24959 10.301 5.32865 10.1101 5.46938 9.96937C5.61011 9.82864 5.80098 9.74958 6 9.74958C6.19903 9.74958 6.3899 9.82864 6.53063 9.96937L8.25 11.6897L12.9694 6.96937C13.0391 6.89969 13.1218 6.84442 13.2128 6.8067C13.3039 6.76899 13.4015 6.74958 13.5 6.74958C13.5986 6.74958 13.6961 6.76899 13.7872 6.8067C13.8782 6.84442 13.9609 6.89969 14.0306 6.96937C14.1003 7.03906 14.1556 7.12178 14.1933 7.21283C14.231 7.30387 14.2504 7.40145 14.2504 7.5C14.2504 7.59855 14.231 7.69613 14.1933 7.78717C14.1556 7.87822 14.1003 7.96094 14.0306 8.03063Z"
                        fill={progressIndicator}
                      />
                    </Svg>
                  </View>
                  <ThemedText style={styles.benefitText}>{benefit}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* CTA Buttons */}
          <View style={styles.buttonContainer}>
            {/* Secondary Button - Sign In */}
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: contentBackButtonText,
                },
              ]}
              onPress={handleSecondaryButtonPress}
              activeOpacity={0.8}
            >
              <ThemedText
                style={[
                  styles.secondaryButtonText,
                  {
                    color: articlePreTeaserTitleText,
                    fontFamily: fonts?.primarySemiBold,
                  },
                ]}
              >
                {paywallConfig.secondaryButtonText}
              </ThemedText>
            </TouchableOpacity>
            {/* Primary Button - Subscribe */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: actionColor }]}
              onPress={handlePrimaryButtonPress}
              activeOpacity={0.8}
            >
              <ThemedText
                style={[
                  styles.primaryButtonText,
                  { color: textColor, fontFamily: fonts?.primarySemiBold },
                ]}
              >
                {paywallConfig.primaryButtonText}
              </ThemedText>
            </TouchableOpacity>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                onClose();
              }}
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
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    ...getCenteredContentStyle(),
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  headline: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
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
    marginBottom: 16,
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
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 18,
    lineHeight: 22,
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
