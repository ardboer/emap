import { Colors } from "@/constants/Colors";
import { ArticleStyles } from "@/styles/ArticleStyles";
import { useMemo } from "react";
import { TextStyle, ViewStyle } from "react-native";
import { useBrandConfig } from "./useBrandConfig";
import { useColorScheme } from "./useColorScheme";

/**
 * Article Styles with Theme Integration
 *
 * This hook merges layout styles from ArticleStyles.ts with brand-specific
 * colors and fonts from the brand configuration.
 *
 * Usage:
 * ```typescript
 * const styles = useArticleStyles();
 * <Text style={styles.h1}>Heading</Text>
 * ```
 *
 * Benefits:
 * - Single source of truth for all article styling
 * - Automatic theme switching (light/dark)
 * - Brand-aware colors and fonts
 * - Type-safe style access
 */
export function useArticleStyles() {
  const { fonts } = useBrandConfig();
  const colorScheme = useColorScheme();

  return useMemo(() => {
    const themeColors = Colors[colorScheme ?? "light"];

    // Helper to merge layout style with theme colors/fonts
    const withTheme = (
      layoutStyle: ViewStyle | TextStyle,
      overrides?: Partial<TextStyle>
    ) =>
      ({
        ...layoutStyle,
        color: themeColors.contentBodyText,
        fontFamily: fonts?.primary,
        ...overrides,
      } as TextStyle);

    return {
      // ============================================
      // PAGE LAYOUT (no theme needed)
      // ============================================
      container: ArticleStyles.container,
      scrollView: ArticleStyles.scrollView,
      scrollContent: ArticleStyles.scrollContent,
      contentContainer: {
        ...ArticleStyles.contentContainer,
        backgroundColor: themeColors.contentBackground,
      },

      // ============================================
      // HEADER SECTION (no theme needed)
      // ============================================
      headerContainer: ArticleStyles.headerContainer,
      headerImage: ArticleStyles.headerImage,
      headerSpacer: ArticleStyles.headerSpacer,

      // ============================================
      // NAVIGATION BUTTONS
      // ============================================
      backButtonTop: ArticleStyles.backButtonTop,
      backButtonContainer: {
        ...ArticleStyles.backButtonContainer,
        backgroundColor: themeColors.contentBackButtonBg,
      },
      backButtonText: {
        ...ArticleStyles.backButtonText,
        color: themeColors.contentBackButtonText,
        fontFamily: fonts?.primarySemiBold,
      },
      shareButtonTop: ArticleStyles.shareButtonTop,
      shareButtonContainer: {
        ...ArticleStyles.shareButtonContainer,
        backgroundColor: themeColors.contentBackButtonBg,
      },

      // ============================================
      // METADATA SECTION
      // ============================================
      metaContainer: ArticleStyles.metaContainer,
      authorInfoCompact: ArticleStyles.authorInfoCompact,
      authorIconCompact: ArticleStyles.authorIconCompact,
      authorNameCompact: {
        ...ArticleStyles.authorNameCompact,
        color: themeColors.contentMetaText,
        fontFamily: fonts?.primarySemiBold,
      },
      timestamp: {
        ...ArticleStyles.timestamp,
        color: themeColors.contentMetaText,
        fontFamily: fonts?.primaryMedium,
      },
      authorBioContainer: ArticleStyles.authorBioContainer,
      authorBio: {
        ...ArticleStyles.authorBio,
        color: themeColors.contentMetaText,
        fontFamily: fonts?.primary,
      },

      // ============================================
      // ARTICLE TITLE & SUBTITLE
      // ============================================
      title: {
        ...ArticleStyles.title,
        color: themeColors.contentTitleText,
        fontFamily: fonts?.primaryBold,
      },
      subtitle: {
        ...ArticleStyles.subtitle,
        color: themeColors.contentTitleText,
        fontFamily: fonts?.primaryBold,
      },
      leadText: {
        ...ArticleStyles.leadText,
        color: themeColors.contentTitleText,
        fontFamily: fonts?.primaryBold,
      },

      // ============================================
      // RICH CONTENT - TYPOGRAPHY
      // ============================================
      inlineText: withTheme(ArticleStyles.inlineText),

      h1: {
        ...ArticleStyles.h1,
        color: themeColors.contentTitleText,
        fontFamily: fonts?.primaryBold,
      },

      h2: {
        ...ArticleStyles.h2,
        color: themeColors.contentTitleText,
        fontFamily: fonts?.primaryBold,
      },

      h3: {
        ...ArticleStyles.h3,
        color: themeColors.contentTitleText,
        fontFamily: fonts?.primaryBold,
      },

      h5: {
        ...ArticleStyles.h5,
        color: themeColors.contentTitleText,
        fontFamily: fonts?.primaryBold,
      },

      paragraph: withTheme(ArticleStyles.paragraph),

      bold: {
        ...ArticleStyles.bold,
        fontFamily: fonts?.primaryBold,
      },

      italic: {
        ...ArticleStyles.italic,
        fontFamily: fonts?.primaryItalic || fonts?.primary,
      },

      span: withTheme(ArticleStyles.span),

      // ============================================
      // RICH CONTENT - BLOCKQUOTE
      // ============================================
      blockquote: {
        ...ArticleStyles.blockquote,
        backgroundColor: themeColors.highlightBoxBg,
        borderTopColor: themeColors.highlightBoxBorder,
      },

      blockquoteTitle: {
        ...ArticleStyles.blockquoteTitle,
        color: themeColors.highlightBoxText,
        fontFamily: fonts?.primaryBold,
      },

      blockquoteText: {
        ...ArticleStyles.blockquoteText,
        color: themeColors.highlightBoxText,
        fontFamily: fonts?.primaryItalic || fonts?.primary,
      },

      factBox: {
        ...ArticleStyles.factBox,
        backgroundColor: themeColors.highlightBoxBg,
        borderTopColor: themeColors.highlightBoxBorder,
      },

      // ============================================
      // RICH CONTENT - LISTS
      // ============================================
      list: ArticleStyles.list,
      listItem: ArticleStyles.listItem,
      bullet: withTheme(ArticleStyles.bullet),
      listItemContent: ArticleStyles.listItemContent,

      // ============================================
      // RICH CONTENT - LINKS
      // ============================================
      link: {
        ...ArticleStyles.link,
        color: (themeColors as any).linkColor || "#007AFF",
      },

      // ============================================
      // RICH CONTENT - IMAGES
      // ============================================
      imageContainer: ArticleStyles.imageContainer,
      imageLeft: ArticleStyles.imageLeft,
      imageCenter: ArticleStyles.imageCenter,
      imageFullWidth: ArticleStyles.imageFullWidth,
      image: ArticleStyles.image,
      imageLeftSize: ArticleStyles.imageLeftSize,
      imageCenterSize: ArticleStyles.imageCenterSize,
      imageFullSize: ArticleStyles.imageFullSize,
      imageCaption: withTheme(ArticleStyles.imageCaption, {
        fontStyle: "italic",
      }),

      // ============================================
      // RICH CONTENT - TABLES
      // ============================================
      tableContainer: ArticleStyles.tableContainer,
      tableScrollView: ArticleStyles.tableScrollView,
      table: {
        ...ArticleStyles.table,
        borderColor: themeColors.highlightBoxBorder,
      },
      tableRow: {
        ...ArticleStyles.tableRow,
        borderBottomColor: themeColors.highlightBoxBorder,
      },
      tableHeaderRow: {
        ...ArticleStyles.tableHeaderRow,
        borderBottomColor: themeColors.highlightBoxBorder,
      },
      tableCell: {
        ...ArticleStyles.tableCell,
        borderRightColor: themeColors.highlightBoxBorder,
        backgroundColor: themeColors.contentBackground,
      },
      tableHeaderCell: {
        ...ArticleStyles.tableHeaderCell,
        backgroundColor: themeColors.highlightBoxBg,
        borderRightColor: themeColors.highlightBoxBorder,
      },
      tableCellText: withTheme(ArticleStyles.tableCellText),
      tableHeaderText: {
        ...ArticleStyles.tableHeaderText,
        color: themeColors.highlightBoxText,
        fontFamily: fonts?.primaryBold,
      },

      // ============================================
      // RICH CONTENT - GALLERY
      // ============================================
      gallery: ArticleStyles.gallery,
      galleryItem: ArticleStyles.galleryItem,
      enhancedGallery: ArticleStyles.enhancedGallery,
      enhancedGalleryItem: ArticleStyles.enhancedGalleryItem,
      enhancedGalleryImage: ArticleStyles.enhancedGalleryImage,
      enhancedGalleryCaption: withTheme(ArticleStyles.enhancedGalleryCaption, {
        fontStyle: "italic",
      }),

      // ============================================
      // RICH CONTENT - VIDEO & EMBEDS
      // ============================================
      videoContainer: ArticleStyles.videoContainer,
      embedContainer: ArticleStyles.embedContainer,
      webView: ArticleStyles.webView,
      lineBreak: ArticleStyles.lineBreak,

      // ============================================
      // UTILITY STYLES
      // ============================================
      richContent: ArticleStyles.richContent,
      content: withTheme(ArticleStyles.content),
      centerContent: ArticleStyles.centerContent,
      loadingText: withTheme(ArticleStyles.loadingText),
      errorContainer: ArticleStyles.errorContainer,
      backButton: ArticleStyles.backButton,
      bannerAd: ArticleStyles.bannerAd,
      divider: ArticleStyles.divider,
      debugInfoContainer: ArticleStyles.debugInfoContainer,

      // ============================================
      // THEME COLORS (for direct access)
      // ============================================
      colors: {
        contentBackground: themeColors.contentBackground,
        contentTitleText: themeColors.contentTitleText,
        contentBodyText: themeColors.contentBodyText,
        contentMetaText: themeColors.contentMetaText,
        highlightBoxBg: themeColors.highlightBoxBg,
        highlightBoxText: themeColors.highlightBoxText,
        highlightBoxBorder: themeColors.highlightBoxBorder,
        linkColor: (themeColors as any).linkColor || "#007AFF",
        contentBackButtonBg: themeColors.contentBackButtonBg,
        contentBackButtonText: themeColors.contentBackButtonText,
      },

      // ============================================
      // FONTS (for direct access)
      // ============================================
      fonts: {
        primary: fonts?.primary,
        primaryBold: fonts?.primaryBold,
        primarySemiBold: fonts?.primarySemiBold,
        primaryMedium: fonts?.primaryMedium,
        primaryItalic: fonts?.primaryItalic || fonts?.primary,
      },
    };
  }, [fonts, colorScheme]);
}

/**
 * Type definition for themed article styles
 * Useful for TypeScript autocomplete and type checking
 */
export type ThemedArticleStyles = ReturnType<typeof useArticleStyles>;
