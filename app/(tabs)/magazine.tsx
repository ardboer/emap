import GradientHeader from "@/components/GradientHeader";
import MagazineListView from "@/components/MagazineListView";
import { ThemedView } from "@/components/ThemedView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { MagazineEdition } from "@/types";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";

export default function MagazineScreen() {
  const { features } = useBrandConfig();

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
    router.push(`/pdf/${magazine.id}`);
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  return (
    <ThemedView style={styles.container}>
      <GradientHeader onSearchPress={handleSearchPress} />
      <MagazineListView onMagazineSelect={handleMagazineSelect} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
