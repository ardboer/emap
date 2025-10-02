import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { fetchMagazinePDF } from "@/services/api";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet } from "react-native";

export default function PDFViewerScreen() {
  const { features } = useBrandConfig();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!features?.enableMagazine) {
      router.replace("/(tabs)/news");
      return;
    }

    if (id) {
      loadPDF();
    }
  }, [features?.enableMagazine, id]);

  if (!features?.enableMagazine) {
    return null;
  }

  const loadPDF = async () => {
    try {
      setError(null);
      const url = await fetchMagazinePDF(id!);
      console.log("Fetched PDF URL:", url);

      // For testing, if the remote URL fails, try local PDF
      if (!url || url.includes("undefined") || url.includes("null")) {
        console.log("Using fallback local PDF");
        // Use local PDF as fallback for testing
        const localPdfUrl = `http://localhost:8081/pdf/${
          id === "cn" ? "cn.pdf" : "nt.pdf"
        }`;
        setPdfUrl(localPdfUrl);
      } else {
        setPdfUrl(url);
      }
    } catch (err) {
      console.error("Error loading PDF:", err);
      // Fallback to local PDF for testing
      console.log("Using local PDF as fallback due to error");
      const localPdfUrl = `http://localhost:8081/pdf/${
        id === "cn" ? "cn.pdf" : "nt.pdf"
      }`;
      setPdfUrl(localPdfUrl);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading PDF...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (!pdfUrl) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText style={styles.errorText}>No PDF URL available</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, styles.centerContent]}>
      <ThemedText style={styles.title}>Magazine PDF</ThemedText>
      <ThemedText style={styles.message}>
        Opening PDF in external viewer...
      </ThemedText>
      <ThemedText style={styles.urlText}>{pdfUrl}</ThemedText>
      {(() => {
        Linking.openURL(pdfUrl).catch((err: any) => {
          console.error("Failed to open PDF:", err);
          setError("Failed to open PDF");
        });
        return null;
      })()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  urlText: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.6,
    fontFamily: "monospace",
  },
});
