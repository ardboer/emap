import { getColors } from "react-native-image-colors";

/**
 * Extract dominant colors from an image URL
 * @param imageUrl - The URL of the image to extract colors from
 * @param articleId - Unique identifier for caching
 * @returns Array of color strings (hex format)
 */
export async function extractImageColors(
  imageUrl: string,
  articleId: string
): Promise<string[]> {
  try {
    const result = await getColors(imageUrl, {
      fallback: "#1a1a2e",
      cache: true,
      key: articleId,
    });

    if (result.platform === "android") {
      return [result.dominant, result.vibrant, result.darkVibrant].filter(
        Boolean
      ) as string[];
    } else if (result.platform === "ios") {
      return [result.secondary, result.secondary, result.secondary].filter(
        Boolean
      ) as string[];
    }
    return ["#1a1a2e", "#16213e", "#0f3460"];
  } catch (error) {
    console.error("Error extracting colors:", error);
    return ["#1a1a2e", "#16213e", "#0f3460"];
  }
}

/**
 * Extract colors for multiple articles in batch
 * @param articles - Array of articles with imageUrl and id
 * @returns Object mapping article IDs to color arrays
 */
export async function extractColorsForArticles(
  articles: { id: string; imageUrl: string; isLandscape?: boolean }[]
): Promise<{ [key: string]: string[] }> {
  const colors: { [key: string]: string[] } = {};

  for (const article of articles) {
    if (article.isLandscape) {
      colors[article.id] = await extractImageColors(
        article.imageUrl,
        article.id
      );
    }
  }

  return colors;
}
