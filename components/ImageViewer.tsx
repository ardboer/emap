import React from "react";
import { StyleSheet, View } from "react-native";
import ImageView from "react-native-image-viewing";
import { ThemedText } from "./ThemedText";

interface ImageViewerProps {
  visible: boolean;
  imageUri: string;
  caption?: string;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  imageUri,
  caption,
  onClose,
}) => {
  const images = [
    {
      uri: imageUri,
    },
  ];

  return (
    <ImageView
      images={images}
      imageIndex={0}
      visible={visible}
      onRequestClose={onClose}
      FooterComponent={
        caption
          ? () => (
              <View style={styles.captionContainer}>
                <View style={styles.captionBackground}>
                  <ThemedText style={styles.caption}>{caption}</ThemedText>
                </View>
              </View>
            )
          : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  captionContainer: {
    padding: 16,
  },
  captionBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 16,
    borderRadius: 8,
  },
  caption: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
