import PDFViewer from "@/components/PDFViewer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { MagazineEdition } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function PDFScreen() {
  const { brandName } = useBrandConfig();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [magazine, setMagazine] = useState<MagazineEdition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    // Create magazine object from ID
    setMagazine({
      id: id,
      title: formatMagazineTitle(id),
    });
    setLoading(false);
  }, [id]);

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

  const handleBack = () => {
    router.back();
  };

  if (loading || !magazine) {
    return (
      <View style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            Loading magazine...
          </ThemedText>
        </ThemedView>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: brandName || "Magazine",
          headerShown: true,
          headerBackTitle: "",
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBack}
              style={{ marginLeft: Platform.OS === "ios" ? 0 : 8 }}
            >
              <Ionicons
                name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
                size={28}
                color="#007AFF"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <PDFViewer magazine={magazine} onBack={handleBack} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
});
