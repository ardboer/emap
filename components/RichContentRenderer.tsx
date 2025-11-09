import { DisplayAd } from "@/components/DisplayAd";
import { FadeInImage } from "@/components/FadeInImage";
import { getMaxContentWidth, isTablet } from "@/constants/Layout";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useImageViewer } from "@/hooks/useImageViewer";
import { brandManager } from "@/services/api";
import { displayAdManager } from "@/services/displayAdManager";
import { StructuredContentNode } from "@/types";
import React, { useEffect } from "react";
import {
  Dimensions,
  Linking,
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { ImageViewer } from "./ImageViewer";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const { width: screenWidth } = Dimensions.get("window");

// Themed text component for blockquotes and factboxes
const HighlightBoxText: React.FC<{
  style?: any;
  children: React.ReactNode;
  color?: string;
}> = ({ style, children, color = "#FFFFFF" }) => {
  return <RNText style={[style, { color }]}>{children}</RNText>;
};

// Helper function to calculate proper image dimensions
const calculateImageDimensions = (
  originalWidth?: number,
  originalHeight?: number,
  maxWidth?: number
) => {
  // Determine the appropriate max width based on device type
  const effectiveMaxWidth =
    maxWidth ?? (isTablet ? getMaxContentWidth() - 32 : screenWidth - 32);

  // Fallback dimensions if not provided
  if (!originalWidth || !originalHeight) {
    return { width: effectiveMaxWidth, height: 200 };
  }

  // If image fits within max width, use original dimensions
  if (originalWidth <= effectiveMaxWidth) {
    return { width: originalWidth, height: originalHeight };
  }

  // Scale down proportionally if image is too wide
  const aspectRatio = originalHeight / originalWidth;
  return {
    width: effectiveMaxWidth,
    height: Math.round(effectiveMaxWidth * aspectRatio),
  };
};

// Helper function to calculate gallery item dimensions
const calculateGalleryItemDimensions = (screenWidth: number) => {
  const containerPadding = 16; // Reduced total horizontal padding
  const itemSpacing = 6; // Further reduced space between items

  // Determine number of columns based on screen width - ensure minimum 2 columns
  let columns = 2; // Always start with at least 2 columns
  if (screenWidth > 768) {
    columns = 4;
  } else if (screenWidth > 600) {
    columns = 3;
  }

  const availableWidth = screenWidth - containerPadding;
  const totalSpacing = (columns - 1) * itemSpacing;
  const itemWidth = (availableWidth - totalSpacing) / columns;

  // Ensure minimum width for 2 columns even on very small screens
  const minItemWidth = (screenWidth - 32) / 2; // Force 2 columns minimum
  const finalItemWidth = Math.max(
    Math.floor(itemWidth),
    Math.floor(minItemWidth)
  );

  // Reduce width by 32 pixels as requested
  const adjustedWidth = Math.max(finalItemWidth - 32, 80); // Minimum 80px width

  return {
    width: adjustedWidth,
    height: adjustedWidth, // Square items
    columns,
    spacing: itemSpacing,
  };
};

// Helper function to extract gallery image from nested structure
const extractGalleryImage = (
  node: StructuredContentNode
): {
  imageUri?: string;
  linkUri?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
} | null => {
  // Look for dt > a > img structure
  if (node.type === "dt" && node.children) {
    const linkNode = node.children.find(
      (child) => child.typename === "HTMLLink"
    );
    if (linkNode && linkNode.children) {
      const imgNode = linkNode.children.find(
        (child) => child.typename === "HTMLRelation" && child.type === "img"
      );
      if (imgNode && imgNode.relation?.href) {
        return {
          imageUri: imgNode.relation.href,
          linkUri: linkNode.href,
          alt: imgNode.relation.alt,
          caption: imgNode.relation.caption,
          width: imgNode.relation.width,
          height: imgNode.relation.height,
        };
      }
    }
  }
  return null;
};

interface RichContentRendererProps {
  content: StructuredContentNode[];
  style?: any;
  articleId?: string;
}

interface RichContentNodeProps {
  node: StructuredContentNode;
  index: number;
  onImagePress: (imageUri: string, caption?: string) => void;
  forceHighlightBoxText?: boolean;
  isBlockquote?: boolean;
  isLink?: boolean;
}

interface RichContentTableCellProps {
  node: StructuredContentNode;
  isHeader: boolean;
  onImagePress: (imageUri: string, caption?: string) => void;
}

// Helper function to extract plain text from nested content nodes
const extractTextContent = (nodes: StructuredContentNode[]): string => {
  return nodes
    .map((node) => {
      if (node.typename === "HTMLTextNode") {
        return node.text || "";
      }
      if (node.children) {
        return extractTextContent(node.children);
      }
      return "";
    })
    .join("");
};

// Helper function to render inline content (text + links) within a single Text component
const renderInlineContent = (
  nodes: StructuredContentNode[],
  linkColor: string,
  handleLinkPress: (url: string) => void
): React.ReactNode[] => {
  return nodes.map((node, index) => {
    if (node.typename === "HTMLTextNode") {
      return node.text || "";
    }
    if (node.typename === "HTMLLink") {
      const linkText = node.children ? extractTextContent(node.children) : "";
      return (
        <React.Fragment key={index}>
          {" "}
          <RNText
            style={{ color: linkColor, textDecorationLine: "underline" }}
            onPress={() => node.href && handleLinkPress(node.href)}
          >
            {linkText}
          </RNText>{" "}
        </React.Fragment>
      );
    }
    if (node.typename === "HTMLElement") {
      // Handle inline formatting like strong, em, span
      if (node.type === "strong") {
        return (
          <RNText key={index} style={{ fontWeight: "bold" }}>
            {node.children
              ? renderInlineContent(node.children, linkColor, handleLinkPress)
              : ""}
          </RNText>
        );
      }
      if (node.type === "em") {
        return (
          <RNText key={index} style={{ fontStyle: "italic" }}>
            {node.children
              ? renderInlineContent(node.children, linkColor, handleLinkPress)
              : ""}
          </RNText>
        );
      }
      if (node.type === "span" && node.children) {
        return renderInlineContent(node.children, linkColor, handleLinkPress);
      }
    }
    return null;
  });
};

// Helper function to extract text content from a single node (for table cells)
const extractSingleNodeTextContent = (node: StructuredContentNode): string => {
  if (node.typename === "HTMLTextNode") {
    return node.text || "";
  }

  if (node.children) {
    return node.children.map(extractSingleNodeTextContent).join("");
  }

  return "";
};

const RichContentTableCell: React.FC<RichContentTableCellProps> = ({
  node,
  isHeader,
  onImagePress,
}) => {
  const { colors, fonts } = useBrandConfig();
  const colorScheme = useColorScheme();
  const themeColors = colors?.[colorScheme ?? "light"];
  const textContent = extractSingleNodeTextContent(node);
  return (
    <ThemedView
      style={[
        styles.tableCell,
        isHeader && styles.tableHeaderCell,
        {
          backgroundColor: isHeader
            ? themeColors?.highlightBoxBg || "#00334C"
            : themeColors?.highlightBoxBg || "#FFFFFF",
        },
      ]}
    >
      <ThemedText
        style={[
          styles.tableCellText,
          isHeader && { fontFamily: fonts?.primaryBold },
          isHeader && styles.tableHeaderText,
          isHeader && {
            color: themeColors?.highlightBoxText || "#FFFFFF",
          },
        ]}
      >
        {textContent}
      </ThemedText>
    </ThemedView>
  );
};

// Helper function to check if header contains only text (no complex formatting)
const isSimpleTextHeader = (nodes: StructuredContentNode[]): boolean => {
  return nodes.every((node) => {
    if (node.typename === "HTMLTextNode") {
      return true;
    }
    if (node.typename === "HTMLElement" && node.children) {
      // Allow simple formatting like strong, em, span
      if (["strong", "em", "span"].includes(node.type || "")) {
        return isSimpleTextHeader(node.children);
      }
    }
    return false;
  });
};

const RichContentNode: React.FC<RichContentNodeProps> = ({
  node,
  index,
  onImagePress,
  forceHighlightBoxText = false,
  isBlockquote = false,
  isLink = false,
}) => {
  const { colors, fonts } = useBrandConfig();
  const colorScheme = useColorScheme();
  const themeColors = colors?.[colorScheme ?? "light"];

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  // Handle text nodes
  if (node.typename === "HTMLTextNode") {
    if (forceHighlightBoxText) {
      const textStyle = isBlockquote
        ? [
            styles.blockquoteText,
            { fontFamily: fonts?.primaryItalic || "OpenSans-Italic" },
          ]
        : styles.inlineText;
      return (
        <HighlightBoxText
          style={textStyle}
          color={themeColors?.highlightBoxText}
        >
          {node.text || ""}
        </HighlightBoxText>
      );
    }
    // If inside a link, use RNText with link color to avoid ThemedText overriding it
    if (isLink) {
      return (
        <RNText
          style={[styles.link, { color: themeColors?.linkColor || "#007AFF" }]}
        >
          {node.text || ""}
        </RNText>
      );
    }
    return <ThemedText style={styles.inlineText}>{node.text || ""}</ThemedText>;
  }

  // Handle HTML elements
  if (node.typename === "HTMLElement") {
    const children = node.children ? (
      <RichContentRendererInternal
        content={node.children}
        onImagePress={onImagePress}
        forceHighlightBoxText={forceHighlightBoxText}
        isBlockquote={isBlockquote}
        isLink={isLink}
      />
    ) : null;

    switch (node.type) {
      case "h1":
        // For simple text headers, extract text to avoid nested ThemedText issues
        if (node.children && isSimpleTextHeader(node.children)) {
          const textContent = extractTextContent(node.children);
          if (forceHighlightBoxText) {
            return (
              <HighlightBoxText
                key={index}
                style={[styles.h1, { fontSize: 28, fontWeight: "bold" }]}
                color={themeColors?.highlightBoxText}
              >
                {textContent}
              </HighlightBoxText>
            );
          }
          return (
            <ThemedText key={index} type="title" style={styles.h1}>
              {textContent}
            </ThemedText>
          );
        }
        // For complex headers with formatting, render children but with header context
        if (forceHighlightBoxText) {
          return (
            <HighlightBoxText
              key={index}
              style={[styles.h1, { fontSize: 28, fontWeight: "bold" }]}
              color={themeColors?.highlightBoxText}
            >
              {children}
            </HighlightBoxText>
          );
        }
        return (
          <ThemedText key={index} type="title" style={styles.h1}>
            {children}
          </ThemedText>
        );

      case "h2":
        // For simple text headers, extract text to avoid nested ThemedText issues
        if (node.children && isSimpleTextHeader(node.children)) {
          const textContent = extractTextContent(node.children);
          if (forceHighlightBoxText) {
            return (
              <HighlightBoxText
                key={index}
                style={[styles.h2, { fontSize: 24, fontWeight: "bold" }]}
                color={themeColors?.highlightBoxText}
              >
                {textContent}
              </HighlightBoxText>
            );
          }
          return (
            <ThemedText key={index} type="subtitle" style={styles.h2}>
              {textContent}
            </ThemedText>
          );
        }
        // For complex headers with formatting, render children but with header context
        if (forceHighlightBoxText) {
          return (
            <HighlightBoxText
              key={index}
              style={[styles.h2, { fontSize: 24, fontWeight: "bold" }]}
              color={themeColors?.highlightBoxText}
            >
              {children}
            </HighlightBoxText>
          );
        }
        return (
          <ThemedText key={index} type="subtitle" style={styles.h2}>
            {children}
          </ThemedText>
        );

      case "h3":
        // For simple text headers, extract text to avoid nested ThemedText issues
        if (node.children && isSimpleTextHeader(node.children)) {
          const textContent = extractTextContent(node.children);
          if (forceHighlightBoxText) {
            return (
              <HighlightBoxText
                key={index}
                style={[styles.h3, { fontSize: 20, fontWeight: "bold" }]}
                color={themeColors?.highlightBoxText}
              >
                {textContent}
              </HighlightBoxText>
            );
          }
          return (
            <ThemedText key={index} style={styles.h3}>
              {textContent}
            </ThemedText>
          );
        }
        // For complex headers with formatting, render children but with header context
        if (forceHighlightBoxText) {
          return (
            <HighlightBoxText
              key={index}
              style={[styles.h3, { fontSize: 20, fontWeight: "bold" }]}
              color={themeColors?.highlightBoxText}
            >
              {children}
            </HighlightBoxText>
          );
        }
        return (
          <ThemedText key={index} style={styles.h3}>
            {children}
          </ThemedText>
        );

      case "h5":
        if (forceHighlightBoxText) {
          return (
            <HighlightBoxText
              key={index}
              style={[styles.h5, { fontSize: 16, fontWeight: "bold" }]}
            >
              {children}
            </HighlightBoxText>
          );
        }
        return (
          <ThemedText key={index} style={styles.h5}>
            {children}
          </ThemedText>
        );

      case "p":
        // Handle custom embeds (Spotify, etc.) within paragraphs
        if (
          node.children?.some((child) => child.typename === "HTMLCustomEmbed")
        ) {
          const embedNode = node.children.find(
            (child) => child.typename === "HTMLCustomEmbed"
          );
          if (embedNode) {
            // Render the embed directly, not wrapped in text
            return (
              <RichContentNode
                key={index}
                node={embedNode}
                index={index}
                onImagePress={onImagePress}
              />
            );
          }
        }

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
                  <FadeInImage
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

        if (forceHighlightBoxText) {
          return (
            <HighlightBoxText
              key={index}
              style={[
                styles.blockquoteText,
                { fontFamily: fonts?.primaryItalic || "OpenSans-Italic" },
              ]}
              color={themeColors?.highlightBoxText}
            >
              {children}
            </HighlightBoxText>
          );
        }

        // For paragraphs with mixed content (text + links), render inline
        // Check if paragraph contains links
        const hasLinks = node.children?.some(
          (child) => child.typename === "HTMLLink"
        );

        if (hasLinks && node.children) {
          // Render inline content to keep links in the same line as text
          return (
            <ThemedText key={index} style={styles.paragraph}>
              {renderInlineContent(
                node.children,
                themeColors?.linkColor || "#007AFF",
                handleLinkPress
              )}
            </ThemedText>
          );
        }

        // For paragraphs without links, use normal rendering
        return (
          <ThemedText key={index} style={styles.paragraph}>
            {children}
          </ThemedText>
        );

      case "strong":
        if (forceHighlightBoxText) {
          return (
            <HighlightBoxText
              key={index}
              style={styles.bold}
              color={themeColors?.highlightBoxText}
            >
              {children}
            </HighlightBoxText>
          );
        }
        return (
          <ThemedText key={index} style={styles.bold}>
            {children}
          </ThemedText>
        );

      case "em":
        if (forceHighlightBoxText) {
          return (
            <HighlightBoxText
              key={index}
              style={styles.italic}
              color={themeColors?.highlightBoxText}
            >
              {children}
            </HighlightBoxText>
          );
        }
        return (
          <ThemedText key={index} style={styles.italic}>
            {children}
          </ThemedText>
        );

      case "span":
        if (forceHighlightBoxText) {
          return (
            <HighlightBoxText
              key={index}
              style={styles.span}
              color={themeColors?.highlightBoxText}
            >
              {children}
            </HighlightBoxText>
          );
        }
        return (
          <ThemedText key={index} style={styles.span}>
            {children}
          </ThemedText>
        );

      case "blockquote":
        // For blockquotes, render with brand-specific styling
        const blockquoteStyle = [
          styles.blockquote,
          {
            backgroundColor: themeColors?.highlightBoxBg || "#00334C",
            borderTopColor: themeColors?.highlightBoxBorder || "#10D1F0",
          },
        ];

        // Check if blockquote has a title (first child is a heading or strong text)
        const hasTitle =
          node.children?.[0]?.type === "strong" ||
          node.children?.[0]?.type === "h3" ||
          node.children?.[0]?.type === "h5";

        if (hasTitle && node.children) {
          const titleNode = node.children[0];
          const titleText = extractTextContent([titleNode]);
          const restContent = node.children.slice(1);

          return (
            <View key={index} style={blockquoteStyle}>
              <HighlightBoxText
                style={styles.blockquoteTitle}
                color={themeColors?.highlightBoxText}
              >
                {titleText}
              </HighlightBoxText>
              {restContent.length > 0 && (
                <RichContentRendererInternal
                  content={restContent}
                  onImagePress={onImagePress}
                  forceHighlightBoxText={true}
                  isBlockquote={true}
                />
              )}
            </View>
          );
        }

        // Regular blockquote without title - render children with white text
        return (
          <View key={index} style={blockquoteStyle}>
            {node.children && (
              <RichContentRendererInternal
                content={node.children}
                onImagePress={onImagePress}
                forceHighlightBoxText={true}
                isBlockquote={true}
              />
            )}
          </View>
        );

      case "ul":
        return (
          <View key={index} style={styles.list}>
            {node.children?.map((child, childIndex) => (
              <View key={childIndex} style={styles.listItem}>
                {forceHighlightBoxText ? (
                  <HighlightBoxText
                    style={styles.bullet}
                    color={themeColors?.highlightBoxText}
                  >
                    •
                  </HighlightBoxText>
                ) : (
                  <ThemedText style={styles.bullet}>•</ThemedText>
                )}
                <View style={styles.listItemContent}>
                  <RichContentNode
                    node={child}
                    index={childIndex}
                    onImagePress={onImagePress}
                    forceHighlightBoxText={forceHighlightBoxText}
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
                {forceHighlightBoxText ? (
                  <HighlightBoxText
                    style={styles.bullet}
                    color={themeColors?.highlightBoxText}
                  >
                    {childIndex + 1}.
                  </HighlightBoxText>
                ) : (
                  <ThemedText style={styles.bullet}>
                    {childIndex + 1}.
                  </ThemedText>
                )}
                <View style={styles.listItemContent}>
                  <RichContentNode
                    node={child}
                    index={childIndex}
                    onImagePress={onImagePress}
                    forceHighlightBoxText={forceHighlightBoxText}
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
              <ThemedView style={styles.table}>{children}</ThemedView>
            </ScrollView>
          </ThemedView>
        );

      case "tbody":
        return <>{children}</>;

      case "tr":
        // Check if this is the first row (header row)
        const isHeaderRow = index === 0;
        return (
          <ThemedView
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
          </ThemedView>
        );

      case "td":
        // This case is now handled by RichContentTableCell component
        return null;

      case "div":
        // Handle special div classes
        if (node.class?.includes("factfile")) {
          const factBoxStyle = [
            styles.factBox,
            {
              backgroundColor: themeColors?.highlightBoxBg || "#00334C",
              borderTopColor: themeColors?.highlightBoxBorder || "#10D1F0",
            },
          ];

          return (
            <View key={index} style={factBoxStyle}>
              {node.children && (
                <RichContentRendererInternal
                  content={node.children}
                  onImagePress={onImagePress}
                  forceHighlightBoxText={true}
                />
              )}
            </View>
          );
        }

        if (node.class?.includes("gallery")) {
          // Enhanced gallery rendering
          const galleryItems =
            node.children?.filter(
              (child) =>
                child.type === "dl" && child.class?.includes("gallery-item")
            ) || [];

          const itemDimensions = calculateGalleryItemDimensions(screenWidth);

          return (
            <View style={styles.enhancedGallery}>
              {galleryItems.map((item, itemIndex) => {
                // Extract image data from the nested structure
                const dtNode = item.children?.find(
                  (child) => child.type === "dt"
                );
                const imageData = dtNode ? extractGalleryImage(dtNode) : null;

                if (!imageData?.imageUri) return null;

                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.enhancedGalleryItem,
                      {
                        width: itemDimensions.width,
                        height: itemDimensions.height,
                        marginRight:
                          (itemIndex + 1) % itemDimensions.columns === 0
                            ? 0
                            : itemDimensions.spacing,
                        marginBottom: itemDimensions.spacing,
                      },
                    ]}
                    onPress={() => {
                      if (imageData.linkUri) {
                        handleLinkPress(imageData.linkUri);
                      } else {
                        onImagePress(imageData.imageUri!, imageData.caption);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <FadeInImage
                      source={{ uri: imageData.imageUri }}
                      style={styles.enhancedGalleryImage}
                      contentFit="cover"
                    />
                    {imageData.caption && (
                      <ThemedText style={styles.enhancedGalleryCaption}>
                        {imageData.caption}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        }

        return <View key={index}>{children}</View>;

      case "dl":
        if (node.class?.includes("gallery-item")) {
          // Skip individual gallery items as they're handled by the gallery div
          return null;
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
    // Extract text content from link children
    const linkText = node.children ? extractTextContent(node.children) : "";

    // Render link inline using Text component with onPress
    return (
      <RNText
        key={index}
        style={[styles.link, { color: themeColors?.linkColor || "#007AFF" }]}
        onPress={() => node.href && handleLinkPress(node.href)}
      >
        {linkText}
      </RNText>
    );
  }

  // Handle custom embeds (YouTube, Spotify, etc.)
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

    // Check for Spotify embed
    const spotifyMatch = node.code.match(
      /open\.spotify\.com\/embed\/(episode|track|playlist|album)\/([a-zA-Z0-9]+)/
    );

    // Extract height from iframe if specified
    const heightMatch = node.code.match(/height=["']?(\d+)["']?/);
    const embedHeight = heightMatch ? parseInt(heightMatch[1], 10) : 300;

    // For Spotify and other embeds, use WebView with appropriate height
    const backgroundColor =
      themeColors?.background ||
      (colorScheme === "dark" ? "#000000" : "#FFFFFF");

    return (
      <View
        key={index}
        style={[
          styles.embedContainer,
          { height: embedHeight, backgroundColor },
        ]}
      >
        <WebView
          source={{
            html: `
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body {
                      margin: 0;
                      padding: 0;
                      overflow: hidden;
                      background-color: ${backgroundColor};
                    }
                    iframe {
                      border: none;
                      width: 100%;
                      height: 100%;
                    }
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
          scrollEnabled={false}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
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
          <FadeInImage
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
  forceHighlightBoxText?: boolean;
  isBlockquote?: boolean;
  isLink?: boolean;
}

const RichContentRendererInternal: React.FC<
  RichContentRendererInternalProps
> = ({
  content,
  style,
  articleId,
  onImagePress,
  forceHighlightBoxText = false,
  isBlockquote = false,
  isLink = false,
}) => {
  // Get brand configuration for display ads
  const brandConfig = brandManager.getCurrentBrand();

  // Initialize display ad manager with brand config
  useEffect(() => {
    if (brandConfig.displayAds) {
      displayAdManager.initialize(brandConfig.displayAds);
    }
  }, [brandConfig]);

  // Count total paragraphs first
  const totalParagraphs = content.filter(
    (node) => node.typename === "HTMLElement" && node.type === "p"
  ).length;

  // Calculate ad placements
  const adPlacements =
    displayAdManager.calculateArticleAdPlacements(totalParagraphs);

  // Count paragraphs to determine where to inject ads
  let paragraphCount = 0;

  return (
    <View style={style}>
      {content.map((node, index) => {
        // Count paragraphs
        if (node.typename === "HTMLElement" && node.type === "p") {
          paragraphCount++;

          // Check if we should inject an ad after this paragraph
          const adPlacement = adPlacements.find(
            (placement) => placement.position === paragraphCount
          );

          if (adPlacement) {
            return (
              <React.Fragment key={index}>
                <RichContentNode
                  node={node}
                  index={index}
                  onImagePress={onImagePress}
                  forceHighlightBoxText={forceHighlightBoxText}
                  isBlockquote={isBlockquote}
                  isLink={isLink}
                />
                <DisplayAd
                  context="article_detail"
                  size={adPlacement.size}
                  onAdLoaded={() =>
                    console.log(
                      `Article ad loaded at paragraph ${paragraphCount}`
                    )
                  }
                />
              </React.Fragment>
            );
          }
        }

        return (
          <RichContentNode
            key={index}
            node={node}
            index={index}
            onImagePress={onImagePress}
            forceHighlightBoxText={forceHighlightBoxText}
            isBlockquote={isBlockquote}
            isLink={isLink}
          />
        );
      })}
    </View>
  );
};

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  style,
  articleId,
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
        articleId={articleId}
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
    lineHeight: 22,
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
    borderTopWidth: 2,
    borderLeftWidth: 0,
    padding: 12,
    marginVertical: 16,
    borderRadius: 4,
    gap: 16,
  },
  blockquoteTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 25, // 1.3888888888888888 * 18
  },
  blockquoteText: {
    fontSize: 22,
    fontWeight: "400",
    lineHeight: 32,
    marginVertical: 8,
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
    fontSize: 16,
    lineHeight: 22,
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
    borderRadius: 8,
    overflow: "hidden",
    minWidth: screenWidth - 32,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    minHeight: 48,
  },
  tableHeaderRow: {
    borderBottomWidth: 2,
  },
  tableCell: {
    flex: 1,
    padding: 16,
    borderRightWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    width: 150,
  },
  tableHeaderCell: {
    borderRightWidth: 1,
  },
  tableCellText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    opacity: 0.9,
  },
  factBox: {
    borderTopWidth: 2,
    borderLeftWidth: 0,
    padding: 12,
    marginVertical: 16,
    borderRadius: 4,
    gap: 16,
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
  enhancedGallery: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  enhancedGalleryItem: {
    borderRadius: 8,
  },
  enhancedGalleryImage: {
    width: "100%",
    height: "80%",
    borderRadius: 8,
  },
  enhancedGalleryCaption: {
    fontSize: 12,
    fontStyle: "italic",
    padding: 8,
    textAlign: "center",
    opacity: 0.7,
    height: "20%",
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
