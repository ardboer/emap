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
  const apiConfig = getApiConfig() as any;
  const { hash, menuId, baseUrl } = apiConfig;

  if (!menuId) {
    throw new Error("Menu ID not configured for this brand");
  }

  const response = await fetch(
    `${baseUrl}${ENDPOINTS.MENU}/${menuId}/?hash=${hash}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch menu items");
  }

  const menuData = await response.json();
  console.log("Menu response:", menuData);

  const menuItems = menuData.menu_items || [];

  return menuItems;
}
