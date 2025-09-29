import { useImageViewer } from "@/hooks/useImageViewer";
import { StructuredContentNode } from "@/types";
import { Image } from "expo-image";
import React from "react";
import {
  Dimensions,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { ImageViewer } from "./ImageViewer";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const { width: screenWidth } = Dimensions.get("window");

// Helper function to calculate proper image dimensions
const calculateImageDimensions = (
  originalWidth?: number,
  originalHeight?: number,
  maxWidth: number = screenWidth - 32
) => {
  // Fallback dimensions if not provided
  if (!originalWidth || !originalHeight) {
    return { width: maxWidth, height: 200 };
  }

  // If image fits within max width, use original dimensions
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }

  // Scale down proportionally if image is too wide
  const aspectRatio = originalHeight / originalWidth;
  return {
    width: maxWidth,
    height: Math.round(maxWidth * aspectRatio),
  };
};

interface RichContentRendererProps {
  content: StructuredContentNode[];
  style?: any;
}

interface RichContentNodeProps {
  node: StructuredContentNode;
  index: number;
  onImagePress: (imageUri: string, caption?: string) => void;
}

interface RichContentTableCellProps {
  node: StructuredContentNode;
  isHeader: boolean;
  onImagePress: (imageUri: string, caption?: string) => void;
}

const RichContentTableCell: React.FC<RichContentTableCellProps> = ({
  node,
  isHeader,
  onImagePress,
}) => {
  // Extract text content from nested structure
  const extractTextContent = (node: StructuredContentNode): string => {
    if (node.typename === "HTMLTextNode") {
      return node.text || "";
    }

    if (node.children) {
      return node.children.map(extractTextContent).join("");
    }

    return "";
  };

  const textContent = extractTextContent(node);

  return (
    <ThemedView style={[styles.tableCell, isHeader && styles.tableHeaderCell]}>
      <ThemedText
        style={[styles.tableCellText, isHeader && styles.tableHeaderText]}
      >
        {textContent}
      </ThemedText>
    </ThemedView>
  );
};

const RichContentNode: React.FC<RichContentNodeProps> = ({
  node,
  index,
  onImagePress,
}) => {
  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  // Handle text nodes
  if (node.typename === "HTMLTextNode") {
    return <ThemedText style={styles.inlineText}>{node.text || ""}</ThemedText>;
  }

  // Handle HTML elements
  if (node.typename === "HTMLElement") {
    const children = node.children ? (
      <RichContentRendererInternal
        content={node.children}
        onImagePress={onImagePress}
      />
    ) : null;

    switch (node.type) {
      case "h1":
        return (
          <ThemedText key={index} type="title" style={styles.h1}>
            {children}
          </ThemedText>
        );

      case "h2":
        return (
          <ThemedText key={index} type="subtitle" style={styles.h2}>
            {children}
          </ThemedText>
        );

      case "h3":
        return (
          <ThemedText key={index} style={styles.h3}>
            {children}
          </ThemedText>
        );

      case "h5":
        return (
          <ThemedText key={index} style={styles.h5}>
            {children}
          </ThemedText>
        );

      case "p":
        // Handle images within paragraphs
        if (
          node.children?.some(
            (child) => child.type === "img" && child.typename === "HTMLRelation"
          )
        ) {
          const imageNode = node.children.find(
            (child) => child.type === "img" && child.typename === "HTMLRelation"
          );
          if (imageNode?.relation?.href) {
            const isLeftAligned = node.class?.includes("alignleft");
            const isCentered =
              node.class?.includes("aligncenter") ||
              node.class?.includes("alignnone");
            const isFullWidth = node.class?.includes("size-full");

            // Calculate proper image dimensions using API data
            const imageDimensions = calculateImageDimensions(
              imageNode.relation.width,
              imageNode.relation.height
            );

            return (
              <View
                key={index}
                style={[
                  styles.imageContainer,
                  isLeftAligned && styles.imageLeft,
                  isCentered && styles.imageCenter,
                  isFullWidth && styles.imageFullWidth,
                ]}
              >
                <TouchableOpacity
                  onPress={() =>
                    onImagePress(
                      imageNode.relation!.href,
                      imageNode.relation!.caption
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: imageNode.relation.href }}
                    style={{
                      width: imageDimensions.width,
                      height: imageDimensions.height,
                    }}
                    onError={(e) => console.log("error loading image", e)}
                    contentFit="contain"
                  />
                </TouchableOpacity>
                {imageNode.relation.caption && (
                  <ThemedText style={styles.imageCaption}>
                    {imageNode.relation.caption}
                  </ThemedText>
                )}
              </View>
            );
          }
        }

        return (
          <ThemedText key={index} style={styles.paragraph}>
            {children}
          </ThemedText>
        );

      case "strong":
        return (
          <ThemedText key={index} style={styles.bold}>
            {children}
          </ThemedText>
        );

      case "em":
        return (
          <ThemedText key={index} style={styles.italic}>
            {children}
          </ThemedText>
        );

      case "span":
        return (
          <ThemedText key={index} style={styles.span}>
            {children}
          </ThemedText>
        );

      case "blockquote":
        return (
          <ThemedView key={index} style={styles.blockquote}>
            <ThemedText style={styles.blockquoteText}>{children}</ThemedText>
          </ThemedView>
        );

      case "ul":
        return (
          <View key={index} style={styles.list}>
            {node.children?.map((child, childIndex) => (
              <View key={childIndex} style={styles.listItem}>
                <ThemedText style={styles.bullet}>•</ThemedText>
                <View style={styles.listItemContent}>
                  <RichContentNode
                    node={child}
                    index={childIndex}
                    onImagePress={onImagePress}
                  />
                </View>
              </View>
            ))}
          </View>
        );

      case "ol":
        return (
          <View key={index} style={styles.list}>
            {node.children?.map((child, childIndex) => (
              <View key={childIndex} style={styles.listItem}>
                <ThemedText style={styles.bullet}>{childIndex + 1}.</ThemedText>
                <View style={styles.listItemContent}>
                  <RichContentNode
                    node={child}
                    index={childIndex}
                    onImagePress={onImagePress}
                  />
                </View>
              </View>
            ))}
          </View>
        );

      case "li":
        return <>{children}</>;

      case "table":
        const { ScrollView } = require("react-native");
        return (
          <ThemedView key={index} style={styles.tableContainer}>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={true}
              style={styles.tableScrollView}
            >
              <View style={styles.table}>{children}</View>
            </ScrollView>
          </ThemedView>
        );

      case "tbody":
        return <>{children}</>;

      case "tr":
        // Check if this is the first row (header row)
        const isHeaderRow = index === 0;
        return (
          <View
            key={index}
            style={[styles.tableRow, isHeaderRow && styles.tableHeaderRow]}
          >
            {node.children?.map((cell, cellIndex) => (
              <RichContentTableCell
                key={cellIndex}
                node={cell}
                isHeader={isHeaderRow}
                onImagePress={onImagePress}
              />
            ))}
          </View>
        );

      case "td":
        // This case is now handled by RichContentTableCell component
        return null;

      case "div":
        // Handle special div classes
        if (node.class?.includes("factfile")) {
          return (
            <ThemedView key={index} style={styles.factBox}>
              {children}
            </ThemedView>
          );
        }

        if (node.class?.includes("gallery")) {
          return (
            <View key={index} style={styles.gallery}>
              {children}
            </View>
          );
        }

        return <View key={index}>{children}</View>;

      case "dl":
        if (node.class?.includes("gallery-item")) {
          return (
            <View key={index} style={styles.galleryItem}>
              {children}
            </View>
          );
        }
        return <>{children}</>;

      case "dt":
        return <>{children}</>;

      case "br":
        return <View key={index} style={styles.lineBreak} />;

      default:
        return <View key={index}>{children}</View>;
    }
  }

  // Handle links
  if (node.typename === "HTMLLink") {
    const children = node.children ? (
      <RichContentRendererInternal
        content={node.children}
        onImagePress={onImagePress}
      />
    ) : null;

    return (
      <ThemedText
        key={index}
        style={styles.link}
        onPress={() => node.href && handleLinkPress(node.href)}
      >
        {children}
      </ThemedText>
    );
  }

  // Handle custom embeds (YouTube, etc.)
  if (node.typename === "HTMLCustomEmbed" && node.code) {
    // Extract YouTube video ID from iframe
    const youtubeMatch = node.code.match(
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
    );
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      // Import YouTubePlayerComponent dynamically to avoid import issues
      const { YouTubePlayerComponent } = require("./YouTubePlayer");
      return <YouTubePlayerComponent key={index} videoId={videoId} />;
    }

    // For other embeds, use WebView
    return (
      <View key={index} style={styles.embedContainer}>
        <WebView
          source={{
            html: `
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { margin: 0; padding: 0; }
                  </style>
                </head>
                <body>
                  ${node.code}
                </body>
              </html>
            `,
          }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    );
  }

  // Handle image relations
  if (
    node.typename === "HTMLRelation" &&
    node.type === "img" &&
    node.relation?.href
  ) {
    // Calculate proper image dimensions using API data
    const imageDimensions = calculateImageDimensions(
      node.relation.width,
      node.relation.height
    );

    return (
      <View key={index} style={styles.imageContainer}>
        <TouchableOpacity
          onPress={() =>
            onImagePress(node.relation!.href, node.relation!.caption)
          }
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: node.relation.href }}
            style={{
              width: imageDimensions.width,
              height: imageDimensions.height,
              borderRadius: 8,
            }}
            contentFit="cover"
          />
        </TouchableOpacity>
        {node.relation.caption && (
          <ThemedText style={styles.imageCaption}>
            {node.relation.caption}
          </ThemedText>
        )}
      </View>
    );
  }

  // Fallback for unknown node types
  return null;
};

interface RichContentRendererInternalProps extends RichContentRendererProps {
  onImagePress: (imageUri: string, caption?: string) => void;
}

const RichContentRendererInternal: React.FC<
  RichContentRendererInternalProps
> = ({ content, style, onImagePress }) => {
  return (
    <View style={style}>
      {content.map((node, index) => (
        <RichContentNode
          key={index}
          node={node}
          index={index}
          onImagePress={onImagePress}
        />
      ))}
    </View>
  );
};

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  style,
}) => {
  const { imageViewer, openImageViewer, closeImageViewer } = useImageViewer();

  const handleImagePress = (imageUri: string, caption?: string) => {
    openImageViewer(imageUri, caption);
  };

  return (
    <>
      <RichContentRendererInternal
        content={content}
        style={style}
        onImagePress={handleImagePress}
      />
      <ImageViewer
        visible={imageViewer.visible}
        imageUri={imageViewer.imageUri}
        caption={imageViewer.caption}
        onClose={closeImageViewer}
      />
    </>
  );
};

const styles = StyleSheet.create({
  inlineText: {
    fontSize: 16,
    lineHeight: 24,
  },
  h1: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 16,
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 14,
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 12,
    lineHeight: 26,
  },
  h5: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
    lineHeight: 22,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  span: {
    fontSize: 16,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    paddingLeft: 16,
    marginVertical: 16,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    padding: 16,
    borderRadius: 8,
  },
  blockquoteText: {
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 24,
  },
  list: {
    marginVertical: 8,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
    minWidth: 20,
  },
  listItemContent: {
    flex: 1,
  },
  link: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  imageContainer: {
    marginVertical: 16,
  },
  imageLeft: {
    alignSelf: "flex-start",
    marginRight: 16,
    marginBottom: 8,
  },
  imageCenter: {
    alignSelf: "center",
  },
  imageFullWidth: {
    alignSelf: "stretch",
  },
  image: {
    borderRadius: 8,
    height: 200,
    width: screenWidth - 32,
  },
  imageLeftSize: {
    width: 150,
    height: 150,
  },
  imageCenterSize: {
    width: screenWidth * 0.8,
    height: 200,
  },
  imageFullSize: {
    width: "100%",
    height: 250,
  },
  imageCaption: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
    opacity: 0.7,
  },
  tableContainer: {
    marginVertical: 16,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableScrollView: {
    flex: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: 8,
    overflow: "hidden",
    minWidth: screenWidth - 32,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    minHeight: 48,
  },
  tableHeaderRow: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0, 0, 0, 0.2)",
  },
  tableCell: {
    flex: 1,
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    minHeight: 48,
    width: 150,
  },
  tableHeaderCell: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRightWidth: 1,
    borderRightColor: "rgba(0, 0, 0, 0.15)",
  },
  tableCellText: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(0, 0, 0, 0.8)",
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    color: "rgba(0, 0, 0, 0.9)",
  },
  factBox: {
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
    padding: 16,
    marginVertical: 16,
    borderRadius: 8,
  },
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 16,
    justifyContent: "space-between",
  },
  galleryItem: {
    width: "48%",
    marginBottom: 16,
  },
  videoContainer: {
    marginVertical: 16,
    height: 220,
    borderRadius: 8,
    overflow: "hidden",
  },
  embedContainer: {
    marginVertical: 16,
    height: 300,
    borderRadius: 8,
    overflow: "hidden",
  },
  webView: {
    flex: 1,
  },
  lineBreak: {
    height: 8,
  },
});
