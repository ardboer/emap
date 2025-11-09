import GradientHeader from "@/components/GradientHeader";
import PDFViewer from "@/components/PDFViewer";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { MagazineEdition } from "@/types";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";

export default function PDFScreen() {
  const { brandName } = useBrandConfig();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [magazine, setMagazine] = useState<MagazineEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);

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

  const handleSearchPress = () => {
    router.push("/search");
  };

  if (loading || !magazine) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            Loading magazine...
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ThemedView style={styles.container}>
        <GradientHeader
          onSearchPress={handleSearchPress}
          showBackButton={true}
          onBackPress={handleBack}
          showUserIcon={true}
          onUserPress={() => setSettingsDrawerVisible(true)}
        />
        <PDFViewer magazine={magazine} onBack={handleBack} />
        <SettingsDrawer
          visible={settingsDrawerVisible}
          onClose={() => setSettingsDrawerVisible(false)}
        />
      </ThemedView>
    </>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
});
