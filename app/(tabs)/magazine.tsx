import MagazineListView from "@/components/MagazineListView";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { MagazineEdition } from "@/types";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";

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

  return (
    <View style={styles.container}>
      <MagazineListView onMagazineSelect={handleMagazineSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
