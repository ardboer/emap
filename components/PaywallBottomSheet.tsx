import { BrandLogo } from "@/components/BrandLogo";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

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
  const { colors } = useBrandConfig();
  const translateY = React.useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
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
  }, [visible]);

  const isDark = colorScheme === "dark";
  const backgroundColor = Colors[colorScheme ?? "light"].background;
  const textColor = Colors[colorScheme ?? "light"].text;
  const primaryColor = colors?.[colorScheme ?? "light"].primary || "#007AFF";

  const benefits = [
    "Full access to all premium articles",
    "Ad-free reading experience",
    "Exclusive content and insights",
    "Support quality journalism",
  ];

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
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
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

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <BrandLogo width={140} height={50} />
            </View>

            {/* Headline */}
            <ThemedText type="title" style={styles.headline}>
              Unlock Premium Content
            </ThemedText>

            {/* Subheadline */}
            <ThemedText style={styles.subheadline}>
              Get unlimited access to all articles
            </ThemedText>

            {/* Benefits List */}
            <View style={styles.benefitsList}>
              {benefits.map((benefit, index) => (
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
                      color="#FFFFFF"
                      weight="bold"
                    />
                  </View>
                  <ThemedText style={styles.benefitText}>{benefit}</ThemedText>
                </View>
              ))}
            </View>

            {/* CTA Buttons */}
            <View style={styles.buttonContainer}>
              {/* Primary Button - Subscribe */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: primaryColor },
                ]}
                onPress={onSubscribe}
                activeOpacity={0.8}
              >
                <ThemedText
                  style={[styles.primaryButtonText, { color: "#000" }]}
                >
                  Subscribe Now
                </ThemedText>
              </TouchableOpacity>

              {/* Secondary Button - Sign In */}
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: primaryColor,
                    backgroundColor: isDark
                      ? Colors[colorScheme ?? "dark"].background
                      : "transparent",
                  },
                ]}
                onPress={onSignIn}
                activeOpacity={0.8}
              >
                <ThemedText
                  style={[styles.secondaryButtonText, { color: primaryColor }]}
                >
                  Sign In
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
    height: SHEET_HEIGHT,
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
});
