import MagazineListView from "@/components/MagazineListView";
import PDFViewer from "@/components/PDFViewer";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { MagazineEdition } from "@/types";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

type ViewState = "list" | "pdf";

export default function MagazineScreen() {
  const { features } = useBrandConfig();
  const [currentView, setCurrentView] = useState<ViewState>("list");
  const [selectedMagazine, setSelectedMagazine] =
    useState<MagazineEdition | null>(null);

  useEffect(() => {
    if (!features?.enableMagazine) {
      router.replace("/(tabs)/news");
    }
  }, [features?.enableMagazine]);

  if (!features?.enableMagazine) {
    return null;
  }

  const handleMagazineSelect = (magazine: MagazineEdition) => {
    console.log("📖 Magazine selected:", magazine.id);
    setSelectedMagazine(magazine);
    setCurrentView("pdf");
  };

  const handleBackToList = () => {
    console.log("🔙 Returning to magazine list");
    setCurrentView("list");
    setSelectedMagazine(null);
  };

  return (
    <View style={styles.container}>
      {currentView === "list" && (
        <MagazineListView onMagazineSelect={handleMagazineSelect} />
      )}

      {currentView === "pdf" && selectedMagazine && (
        <PDFViewer magazine={selectedMagazine} onBack={handleBackToList} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
