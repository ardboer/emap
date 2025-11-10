import { NativeAdCarouselItem } from "@/components/NativeAdCarouselItem";
import { analyticsService } from "@/services/analytics";
import { Article } from "@/types";
import React from "react";
import { EdgeInsets } from "react-native-safe-area-context";

interface NativeAdItemProps {
  item: Article;
  index: number;
  insets: EdgeInsets;
}

export const NativeAdItem: React.FC<NativeAdItemProps> = ({
  item,
  index,
  insets,
}) => {
  return (
    <NativeAdCarouselItem
      item={item}
      position={index}
      shouldLoad={true}
      onAdClicked={() => {
        analyticsService.logEvent("native_ad_click", {
          position: index,
          ad_id: item.id,
        });
      }}
      onLoadComplete={(success) => {
        if (!success) {
          console.warn(`Native ad at position ${index} failed to load`);
        }
      }}
      insets={insets}
      showingProgress={false}
    />
  );
};
