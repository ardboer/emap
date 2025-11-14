/**
 * WordPress Menu API
 *
 * Functions for fetching and managing WordPress menu items.
 * Provides navigation menu data for the application.
 */

import { HierarchicalMenuItem } from "@/types";
import { ENDPOINTS, getApiConfig } from "./config";
import { organizeMenuHierarchy } from "./menuUtils";

/**
 * Fetch menu items from menu API
 *
 * Retrieves navigation menu items for the current brand and organizes them
 * into a hierarchical structure with parent-child relationships.
 * The menu ID is configured per brand in the API configuration.
 *
 * @returns Promise resolving to array of hierarchical menu items
 * @throws Error if menuId is not configured for the brand
 *
 * @example
 * const menuItems = await fetchMenuItems();
 * // Returns: [
 * //   { ID: 1, title: "Home", hasChildren: false, children: [], ... },
 * //   { ID: 2, title: "Topics", hasChildren: true, children: [...], ... }
 * // ]
 */
export async function fetchMenuItems(): Promise<HierarchicalMenuItem[]> {
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

  // Organize flat menu items into hierarchical structure
  const hierarchicalMenu = organizeMenuHierarchy(menuItems);
  console.log("Hierarchical menu:", hierarchicalMenu);

  return hierarchicalMenu;
}
