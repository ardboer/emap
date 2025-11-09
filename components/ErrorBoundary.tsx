import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 *
 * Catches React errors in child components and displays a user-friendly fallback UI.
 * Includes error logging for debugging purposes.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorView />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error("ErrorBoundary caught an error:", error);
    console.error("Error Info:", errorInfo);

    // Store error info in state for display
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // You can also log to an error reporting service here
    // Example: crashlytics.recordError(error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ThemedView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>⚠️</Text>
            <ThemedText style={styles.title}>
              Oops! Something went wrong
            </ThemedText>
            <ThemedText style={styles.message}>
              We&apos;re sorry for the inconvenience. The app encountered an
              unexpected error.
            </ThemedText>

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <ThemedText style={styles.errorTitle}>
                  Error Details (Dev Only):
                </ThemedText>
                <ThemedText style={styles.errorText}>
                  {this.state.error.toString()}
                </ThemedText>
                {this.state.errorInfo && (
                  <ThemedText style={styles.errorText}>
                    {this.state.errorInfo.componentStack}
                  </ThemedText>
                )}
              </ScrollView>
            )}
          </View>
        </ThemedView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
    opacity: 0.8,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorDetails: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 8,
    maxHeight: 200,
    width: "100%",
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#FF3B30",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 18,
    color: "#FF3B30",
  },
});
