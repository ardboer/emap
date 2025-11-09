/**
 * WordPress Menu API
 *
 * Functions for fetching and managing WordPress menu items.
 * Provides navigation menu data for the application.
 */

import { ENDPOINTS, getApiConfig } from "./config";

/**
 * Fetch menu items from menu API
 *
 * Retrieves navigation menu items for the current brand.
 * The menu ID is configured per brand in the API configuration.
 *
 * @returns Promise resolving to array of menu item objects
 * @throws Error if menuId is not configured for the brand
 *
 * @example
 * const menuItems = await fetchMenuItems();
 * // Returns: [{ id: 1, title: "Home", url: "/", ... }, ...]
 */
export async function fetchMenuItems(): Promise<any[]> {
  const { cacheService } = await import("../../cache");
  const cacheKey = "menu_items";
  const apiConfig = getApiConfig() as any;
  const { hash, menuId } = apiConfig;

  if (!menuId) {
    throw new Error("Menu ID not configured for this brand");
  }

  // Try to get from cache first
  const cached = await cacheService.get<any[]>(cacheKey, { menuId, hash });
  if (cached) {
    console.log("Returning cached menu items");
    return cached;
  }

  try {
    const { baseUrl } = apiConfig;
    const response = await fetch(
      `${baseUrl}${ENDPOINTS.MENU}/${menuId}/?hash=${hash}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch menu items");
    }

    const menuData = await response.json();
    console.log("Menu response:", menuData);

    const menuItems = menuData.menu_items || [];

    // Cache the result
    await cacheService.set(cacheKey, menuItems, { menuId, hash });

    return menuItems;
  } catch (error) {
    console.error("Error fetching menu items:", error);

    // Try to return stale cached data if available
    const staleCache = await cacheService.get<any[]>(cacheKey, { menuId });
    if (staleCache) {
      console.log("Returning stale cached menu items due to API error");
      return staleCache;
    }

    throw error;
  }
}
