import { Dimensions, StyleSheet } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

/**
 * Centralized Article Styling System
 *
 * This file contains ALL layout-related styles for article detail pages.
 *
 * IMPORTANT RULES:
 * - NO colors defined here (colors come from brand config)
 * - NO fonts defined here (fonts come from brand config)
 * - ONLY layout properties: fontSize, lineHeight, margins, padding, etc.
 *
 * To modify article styling:
 * 1. Layout changes: Edit this file
 * 2. Color changes: Edit brand config.json
 * 3. Font changes: Edit brand config.json
 *
 * Usage:
 * - Import ArticleStyles directly for layout-only styles
 * - Use useArticleStyles() hook for theme-aware styles (layout + colors + fonts)
 */
export const ArticleStyles = StyleSheet.create({
  // ============================================
  // PAGE LAYOUT
  // ============================================
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
    zIndex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  contentContainer: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 16,
    marginTop: -20,
    minHeight: screenHeight * 0.6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  // ============================================
  // HEADER SECTION
  // ============================================
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.4,
    zIndex: 0,
  },

  headerImage: {
    width: "100%",
    height: "100%",
  },

  headerSpacer: {
    height: screenHeight * 0.4,
  },

  // ============================================
  // NAVIGATION BUTTONS
  // ============================================
  backButtonTop: {
    position: "absolute",
    top: 8,
    left: 16,
    zIndex: 10,
  },

  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },

  backButtonText: {
    fontSize: 12,
    paddingTop: 4,
    lineHeight: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  shareButtonTop: {
    position: "absolute",
    top: 8,
    right: 16,
    zIndex: 10,
  },

  shareButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginTop: 16,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // ============================================
  // METADATA SECTION
  // ============================================
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  authorInfoCompact: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  authorIconCompact: {
    marginRight: 6,
  },

  authorNameCompact: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "600",
  },

  timestamp: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "500",
    textTransform: "uppercase",
  },

  authorBioContainer: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
  },

  authorBio: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },

  // ============================================
  // ARTICLE TITLE & SUBTITLE
  // ============================================
  title: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
    marginBottom: 18,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    marginBottom: 18,
  },

  leadText: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "400",
    marginBottom: 4,
  },

  // ============================================
  // RICH CONTENT - TYPOGRAPHY
  // ============================================
  inlineText: {
    fontSize: 17,
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

  // ============================================
  // RICH CONTENT - BLOCKQUOTE
  // ============================================
  blockquote: {
    borderTopWidth: 2,
    borderLeftWidth: 0,
    padding: 12,
    marginVertical: 16,
    marginBottom: 32,
    borderRadius: 4,
    gap: 16,
  },

  blockquoteTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 25,
  },

  blockquoteText: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 32,
    marginVertical: 8,
  },

  factBox: {
    borderTopWidth: 2,
    borderLeftWidth: 0,
    padding: 12,
    marginVertical: 16,
    marginBottom: 32,
    borderRadius: 4,
    gap: 16,
  },

  // ============================================
  // RICH CONTENT - LISTS
  // ============================================
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

  // ============================================
  // RICH CONTENT - LINKS
  // ============================================
  link: {
    textDecorationLine: "underline",
    fontSize: 16,
    lineHeight: 22,
  },

  // ============================================
  // RICH CONTENT - IMAGES
  // ============================================
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

  // ============================================
  // RICH CONTENT - TABLES
  // ============================================
  tableContainer: {
    marginVertical: 16,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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

  // ============================================
  // RICH CONTENT - GALLERY
  // ============================================
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

  // ============================================
  // RICH CONTENT - VIDEO & EMBEDS
  // ============================================
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

  // ============================================
  // UTILITY STYLES
  // ============================================
  richContent: {
    marginBottom: 16,
  },

  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.8,
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  backButton: {
    marginTop: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  bannerAd: {
    marginVertical: 20,
    alignSelf: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 8,
  },

  debugInfoContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 5,
  },
});

/**
 * Helper function to get screen dimensions
 * Useful for responsive calculations
 */
export const getScreenDimensions = () => ({
  width: screenWidth,
  height: screenHeight,
  headerHeight: screenHeight * 0.4,
});

/**
 * Type definition for article styles
 * Useful for TypeScript autocomplete
 */
export type ArticleStylesType = typeof ArticleStyles;
