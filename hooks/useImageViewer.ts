import { useState } from "react";

interface ImageViewerState {
  visible: boolean;
  imageUri: string;
  caption?: string;
}

export const useImageViewer = () => {
  const [imageViewer, setImageViewer] = useState<ImageViewerState>({
    visible: false,
    imageUri: "",
    caption: undefined,
  });

  const openImageViewer = (imageUri: string, caption?: string) => {
    setImageViewer({
      visible: true,
      imageUri,
      caption,
    });
  };

  const closeImageViewer = () => {
    setImageViewer({
      visible: false,
      imageUri: "",
      caption: undefined,
    });
  };

  return {
    imageViewer,
    openImageViewer,
    closeImageViewer,
  };
};
