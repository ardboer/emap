import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { fetchMagazinePDF } from "@/services/api";
import { MagazineEdition } from "@/types";
import { parsePDFArticleUri } from "@/utils/pdfUriParser";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Pdf from "react-native-pdf";

interface PDFViewerProps {
  magazine: MagazineEdition;
  onBack: () => void;
}

export default function PDFViewer({ magazine, onBack }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfProgress, setPdfProgress] = useState(0);
  const currentPageRef = useRef(1);
  const currentScaleRef = useRef(1.0);
  const lastScaleChangeRef = useRef(0);

  const loadPDF = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 Loading PDF for magazine: ${magazine.id}`);

      const url = await fetchMagazinePDF(magazine.id);
      console.log(`📄 PDF URL loaded: ${url}`);

      setPdfUrl(url);
    } catch (err) {
      console.error("❌ Error loading PDF:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load PDF";
      setError(errorMessage);

      // Show alert for PDF loading error
      Alert.alert("Unable to load magazine", errorMessage, [
        { text: "Try Again", onPress: loadPDF },
        { text: "Go Back", onPress: onBack, style: "cancel" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [magazine.id, onBack]);

  useEffect(() => {
    loadPDF();
  }, [loadPDF]);

  const handlePdfLoadProgress = useCallback((progress: number) => {
    setPdfProgress(progress);
    console.log(`📊 PDF loading progress: ${Math.round(progress * 100)}%`);
  }, []);

  const handlePdfLoadComplete = useCallback(
    (numberOfPages: number, filePath: string) => {
      console.log(`✅ PDF loaded successfully: ${numberOfPages} pages`);
      console.log(`📁 File path: ${filePath}`);
      console.log(`🔗 Annotation rendering enabled: true`);
      setLoading(false);
    },
    []
  );

  const handlePdfError = useCallback(
    (error: any) => {
      console.error("❌ PDF rendering error:", error);
      setLoading(false);
      setError("Failed to display PDF");

      Alert.alert(
        "PDF Display Error",
        "There was a problem displaying this magazine. Please try again.",
        [
          { text: "Retry", onPress: loadPDF },
          { text: "Go Back", onPress: onBack, style: "cancel" },
        ]
      );
    },
    [loadPDF, onBack]
  );

  const handlePdfPressLink = useCallback((uri: string) => {
    const now = Date.now();
    const timeSinceScaleChange = now - lastScaleChangeRef.current;

    // Ignore link press if PDF is zoomed in OR if scale changed recently (within 500ms)
    if (currentScaleRef.current > 1.0 || timeSinceScaleChange < 500) {
      console.log(
        "🔗 PDF is zoomed or scale changed recently, ignoring link press"
      );
      return;
    }

    console.log("🔗 PDF annotation clicked:", uri);

    const parsed = parsePDFArticleUri(uri);
    if (parsed) {
      console.log("📄 Opening article:", parsed);
      router.push(`/pdf-article/${parsed.editionId}/${parsed.articleId}`);
    } else {
      console.warn("⚠️ Could not parse article URI:", uri);
      Alert.alert("Invalid Link", "This link format is not supported.", [
        { text: "OK" },
      ]);
    }
  }, []);

  // Test function to verify alert system works
  const testAlert = useCallback(() => {
    console.log("🧪 Test alert triggered");
    Alert.alert("Test Alert", "This is a test to verify alerts work", [
      { text: "OK" },
    ]);
  }, []);

  // Add a single tap handler as alternative
  const handleSingleTap = useCallback((page: number, x: number, y: number) => {
    console.log(
      `👆 Single tap detected on page ${page} at coordinates (${x}, ${y})`
    );
    // For testing - show alert on any tap
    Alert.alert(
      "Tap Detected",
      `Tapped page ${page} at (${Math.round(x)}, ${Math.round(y)})`,
      [{ text: "OK" }]
    );
  }, []);

  const formatMagazineTitle = (id: string): string => {
    try {
      if (id.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(id);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      return id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    } catch {
      return id;
    }
  };

  const renderHeader = () => (
    <ThemedView style={styles.header}>
      <ThemedView style={styles.headerContent}>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          {magazine.title || formatMagazineTitle(magazine.id)}
        </ThemedText>
      </ThemedView>
      {/* <TouchableOpacity
        style={styles.testButton}
        onPress={testAlert}
        accessibilityRole="button"
        accessibilityLabel="Test alert functionality"
      >
        <ThemedText style={styles.testButtonText}>Test</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.testButton, { backgroundColor: "#28A745" }]}
        onPress={() => {
          console.log("🧪 Switching to local test PDF");
          setPdfUrl(require("../assets/pdf/paper.pdf"));
        }}
        accessibilityRole="button"
        accessibilityLabel="Load local test PDF"
      >
        <ThemedText style={styles.testButtonText}>Local</ThemedText>
      </TouchableOpacity> */}
    </ThemedView>
  );

  const renderLoadingState = () => (
    <ThemedView style={styles.centerContainer}>
      <ActivityIndicator size="large" />
      <ThemedText style={styles.loadingText}>
        {pdfProgress > 0
          ? `Loading PDF... ${Math.round(pdfProgress * 100)}%`
          : "Preparing magazine..."}
      </ThemedText>
    </ThemedView>
  );

  const renderErrorState = () => (
    <ThemedView style={styles.centerContainer}>
      <Ionicons name="document-text-outline" size={64} color="#999" />
      <ThemedText style={styles.errorTitle}>Unable to load magazine</ThemedText>
      <ThemedText style={styles.errorMessage}>{error}</ThemedText>
      <TouchableOpacity style={styles.retryButton} onPress={loadPDF}>
        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  return (
    <>
      {loading && renderLoadingState()}

      {error && !loading && renderErrorState()}

      {pdfUrl && !loading && !error && (
        <GestureHandlerRootView
          style={{
            flex: 1,
            marginBottom: 70,
          }}
        >
          <Pdf
            source={
              typeof pdfUrl === "string" ? { uri: pdfUrl, cache: true } : pdfUrl
            }
            style={styles.pdf}
            onLoadProgress={handlePdfLoadProgress}
            onLoadComplete={handlePdfLoadComplete}
            onPageChanged={(page, numberOfPages) => {
              console.log(`📖 Page ${page} of ${numberOfPages}`);
              currentPageRef.current = page;
            }}
            onScaleChanged={(scale) => {
              console.log(`🔍 Scale changed: ${scale}`);
              currentScaleRef.current = scale;
              lastScaleChangeRef.current = Date.now();
            }}
            onError={handlePdfError}
            enableDoubleTapZoom={true}
            onPressLink={handlePdfPressLink}
            renderActivityIndicator={() => <ActivityIndicator size="large" />}
            trustAllCerts={false}
            enablePaging={true}
            spacing={10}
            singlePage={false}
            horizontal={true}
            fitPolicy={0}
            scale={1.0}
          />
        </GestureHandlerRootView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    position: "absolute",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButtonFloating: {
    position: "absolute",
    top: 20,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    backgroundColor: "transparent",
    // zIndex: 1000,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  testButton: {
    padding: 8,
    backgroundColor: "#FF6B6B",
    borderRadius: 4,
    marginLeft: 8,
  },
  testButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
