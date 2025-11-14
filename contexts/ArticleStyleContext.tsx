import {
  ThemedArticleStyles,
  useArticleStyles,
} from "@/hooks/useArticleStyles";
import React, { createContext, ReactNode, useContext } from "react";

/**
 * Article Style Context
 *
 * This context provides article styles throughout the component tree,
 * preventing style overrides in recursive rendering scenarios.
 *
 * Key Benefits:
 * - Styles are provided at component level via context
 * - Children cannot accidentally override parent styles
 * - Consistent styling throughout recursive content rendering
 * - Single source of truth for all article styling
 *
 * Usage:
 * 1. Wrap your article page with <ArticleStyleProvider>
 * 2. Use useArticleStyleContext() in any child component
 * 3. Styles will be consistent throughout the tree
 *
 * Example:
 * ```tsx
 * // In article page
 * <ArticleStyleProvider>
 *   <ArticleContent />
 * </ArticleStyleProvider>
 *
 * // In any child component
 * const styles = useArticleStyleContext();
 * <Text style={styles.h1}>Heading</Text>
 * ```
 */

// Create the context with undefined as default
// This forces consumers to use the provider
const ArticleStyleContext = createContext<ThemedArticleStyles | undefined>(
  undefined
);

/**
 * Article Style Provider Props
 */
interface ArticleStyleProviderProps {
  children: ReactNode;
}

/**
 * Article Style Provider Component
 *
 * Wraps the article page and provides themed styles to all children.
 * Automatically handles theme switching and brand configuration.
 *
 * @param children - React children to provide styles to
 */
export function ArticleStyleProvider({ children }: ArticleStyleProviderProps) {
  // Get themed styles using the hook
  const styles = useArticleStyles();

  return (
    <ArticleStyleContext.Provider value={styles}>
      {children}
    </ArticleStyleContext.Provider>
  );
}

/**
 * Hook to access article styles from context
 *
 * This hook must be used within an ArticleStyleProvider.
 * It provides access to all themed article styles.
 *
 * @throws Error if used outside of ArticleStyleProvider
 * @returns Themed article styles object
 *
 * Example:
 * ```tsx
 * function MyComponent() {
 *   const styles = useArticleStyleContext();
 *   return <Text style={styles.paragraph}>Content</Text>;
 * }
 * ```
 */
export function useArticleStyleContext(): ThemedArticleStyles {
  const context = useContext(ArticleStyleContext);

  if (context === undefined) {
    throw new Error(
      "useArticleStyleContext must be used within an ArticleStyleProvider. " +
        "Wrap your article page with <ArticleStyleProvider> to use article styles."
    );
  }

  return context;
}

/**
 * Optional: Hook to check if we're inside an ArticleStyleProvider
 * Useful for components that can work with or without the provider
 *
 * @returns true if inside provider, false otherwise
 */
export function useHasArticleStyleContext(): boolean {
  const context = useContext(ArticleStyleContext);
  return context !== undefined;
}
