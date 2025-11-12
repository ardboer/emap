import { getPostBySlug } from "@/services/api";
import { router } from "expo-router";
import { Linking } from "react-native";

/**
 * Link Interceptor Utility
 *
 * Intercepts links to configured domains and converts them to custom scheme URLs
 * for seamless in-app navigation without requiring server-side .well-known configuration.
 *
 * This is a temporary solution until Universal Links / App Links are properly configured.
 */

interface LinkInterceptorConfig {
  domains: string[];
  customScheme: string;
}

/**
 * Check if a URL belongs to one of the configured domains
 */
export function isDomainLink(url: string, domains: string[]): boolean {
  try {
    const urlObj = new URL(url);
    return domains.some((domain) => {
      // Remove protocol and www prefix for comparison
      const normalizedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "");
      const normalizedHost = urlObj.hostname.replace(/^www\./, "");
      return normalizedHost === normalizedDomain;
    });
  } catch (error) {
    // Invalid URL
    return false;
  }
}

/**
 * Convert an HTTPS URL to a custom scheme URL
 * Example: https://nursingtimes.net/article/123 -> nt://article/123
 */
export function convertToCustomScheme(
  url: string,
  customScheme: string
): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search + urlObj.hash;
    return `${customScheme}:/${path}`;
  } catch (error) {
    console.error("Error converting URL to custom scheme:", error);
    return url;
  }
}

/**
 * Handle link press with interception logic
 *
 * @param url - The URL to open
 * @param config - Configuration with domains and custom scheme
 * @returns Promise that resolves when link is handled
 */
export async function handleLinkPress(
  url: string,
  config: LinkInterceptorConfig
): Promise<void> {
  try {
    console.log("🔗 Link pressed:", url);

    // Check if it's one of our domains
    if (isDomainLink(url, config.domains)) {
      console.log("✅ Domain link detected, attempting to resolve");

      try {
        // Extract the path from the URL
        const urlObj = new URL(url);
        const slug = urlObj.pathname.replace(/^\//, ""); // Remove leading slash

        console.log("🔗 Resolving slug to article ID:", slug);

        // Try to resolve the slug to an article ID
        const { id } = await getPostBySlug(slug);

        if (id) {
          console.log("✅ Successfully resolved to article ID:", id);
          console.log("🔗 Navigating directly to article");

          // Navigate directly to the article screen
          router.push(`/article/${id}`);
          return;
        }
      } catch (error) {
        console.log("⚠️ Could not resolve slug, falling back to WebView");
        // If we can't resolve the slug, open in WebView
        const encodedUrl = encodeURIComponent(url);
        router.push(`/webview?url=${encodedUrl}`);
        return;
      }
    } else {
      console.log("🌐 External link, opening in browser");
      // External link - open in browser
      await Linking.openURL(url);
    }
  } catch (error) {
    console.error("❌ Error handling link press:", error);
    // Fallback: try to open the original URL
    try {
      await Linking.openURL(url);
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError);
    }
  }
}

/**
 * Create JavaScript code to inject into WebViews for link interception
 *
 * This intercepts clicks on links within the WebView and sends them back to React Native
 * for processing through the link interceptor.
 *
 * @param domains - Array of domains to intercept
 * @returns JavaScript code as string
 */
export function createWebViewLinkInterceptor(domains: string[]): string {
  // Escape domains for use in regex
  const escapedDomains = domains.map((d) =>
    d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  return `
    (function() {
      const domains = ${JSON.stringify(escapedDomains)};
      
      function isDomainLink(url) {
        try {
          const urlObj = new URL(url, window.location.href);
          return domains.some(domain => {
            const normalizedDomain = domain.replace(/^(https?:\\/\\/)?(www\\.)?/, '');
            const normalizedHost = urlObj.hostname.replace(/^www\\./, '');
            return normalizedHost === normalizedDomain;
          });
        } catch (e) {
          return false;
        }
      }
      
      // Intercept all link clicks
      document.addEventListener('click', function(e) {
        let target = e.target;
        
        // Find the closest anchor tag
        while (target && target.tagName !== 'A') {
          target = target.parentElement;
        }
        
        if (target && target.tagName === 'A' && target.href) {
          const href = target.href;
          
          // Check if it's one of our domains
          if (isDomainLink(href)) {
            e.preventDefault();
            e.stopPropagation();
            
            // Send message to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'linkPress',
                url: href
              }));
            }
          }
        }
      }, true);
      
      console.log('🔗 Link interceptor initialized for domains:', domains);
    })();
    true;
  `;
}

/**
 * Get link interceptor configuration from brand config
 */
export function getLinkInterceptorConfig(
  brandConfig: any
): LinkInterceptorConfig {
  const domain = brandConfig?.domain || "";
  const customScheme = brandConfig?.shortcode || "emap";

  // Create list of domain variations
  const domains: string[] = [];

  if (domain) {
    // Remove trailing slash and protocol if present
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

    // Add both with and without www
    domains.push(cleanDomain);
    if (!cleanDomain.startsWith("www.")) {
      domains.push(`www.${cleanDomain}`);
    } else {
      domains.push(cleanDomain.replace(/^www\./, ""));
    }
  }

  return {
    domains,
    customScheme,
  };
}
