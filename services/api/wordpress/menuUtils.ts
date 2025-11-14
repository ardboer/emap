/**
 * WordPress Menu Utility Functions
 *
 * Helper functions for organizing and managing hierarchical menu structures.
 * Provides utilities to transform flat menu items into parent-child relationships.
 */

import { HierarchicalMenuItem, MenuItem } from "@/types";

/**
 * Organize flat menu items into hierarchical structure
 *
 * Takes a flat array of menu items and organizes them into a hierarchy
 * where parent items (parent="0") contain their children.
 *
 * @param menuItems - Flat array of menu items from API
 * @returns Array of hierarchical menu items with children
 *
 * @example
 * const flatMenu = [
 *   { ID: 1, title: "Home", parent: "0", ... },
 *   { ID: 2, title: "Topics", parent: "0", ... },
 *   { ID: 3, title: "Cancer", parent: "2", ... }
 * ];
 * const hierarchical = organizeMenuHierarchy(flatMenu);
 * // Returns: [
 * //   { ID: 1, title: "Home", hasChildren: false, children: [] },
 * //   { ID: 2, title: "Topics", hasChildren: true, children: [{ ID: 3, ... }] }
 * // ]
 */
export function organizeMenuHierarchy(
  menuItems: MenuItem[]
): HierarchicalMenuItem[] {
  // Separate parents (top-level items) and children
  const parents = menuItems.filter((item) => item.parent === "0");
  const children = menuItems.filter((item) => item.parent !== "0");

  // Build hierarchy by attaching children to their parents
  return parents.map((parent) => {
    const parentChildren = children.filter(
      (child) => child.parent === parent.ID.toString()
    );

    return {
      ...parent,
      children: parentChildren,
      hasChildren: parentChildren.length > 0,
    };
  });
}

/**
 * Get all children for a specific parent ID
 *
 * Retrieves all menu items that are children of the specified parent.
 *
 * @param menuItems - Array of all menu items
 * @param parentId - ID of the parent item (as string)
 * @returns Array of child menu items
 *
 * @example
 * const children = getChildrenForParent(menuItems, "347763");
 * // Returns all items where parent === "347763"
 */
export function getChildrenForParent(
  menuItems: MenuItem[],
  parentId: string
): MenuItem[] {
  return menuItems.filter((item) => item.parent === parentId);
}

/**
 * Check if a menu item has children
 *
 * Determines whether a menu item has any child items.
 *
 * @param menuItems - Array of all menu items
 * @param itemId - ID of the item to check (as string)
 * @returns True if the item has children, false otherwise
 *
 * @example
 * const hasKids = hasChildren(menuItems, "347763");
 * // Returns true if any items have parent === "347763"
 */
export function hasChildren(menuItems: MenuItem[], itemId: string): boolean {
  return menuItems.some((item) => item.parent === itemId);
}

/**
 * Find parent item for a given child
 *
 * Locates the parent menu item for a specified child item.
 *
 * @param menuItems - Array of all menu items
 * @param childId - ID of the child item (as string)
 * @returns Parent menu item or null if not found or child is top-level
 *
 * @example
 * const parent = findParentItem(menuItems, "347769");
 * // Returns the menu item with ID matching the child's parent field
 */
export function findParentItem(
  menuItems: MenuItem[],
  childId: string
): MenuItem | null {
  const child = menuItems.find((item) => item.ID.toString() === childId);
  if (!child || child.parent === "0") return null;

  return menuItems.find((item) => item.ID.toString() === child.parent) || null;
}

/**
 * Get parent index in hierarchical menu
 *
 * Finds the index of a parent item in the hierarchical menu array.
 *
 * @param hierarchicalMenu - Array of hierarchical menu items
 * @param parentId - ID of the parent to find
 * @returns Index of the parent or -1 if not found
 */
export function getParentIndex(
  hierarchicalMenu: HierarchicalMenuItem[],
  parentId: string
): number {
  return hierarchicalMenu.findIndex((item) => item.ID.toString() === parentId);
}

/**
 * Check if a child belongs to a specific parent
 *
 * Verifies whether a child item belongs to the specified parent.
 *
 * @param childId - ID of the child item
 * @param parentId - ID of the parent item
 * @param menuItems - Array of all menu items
 * @returns True if child belongs to parent, false otherwise
 */
export function isChildOfParent(
  childId: string,
  parentId: string,
  menuItems: MenuItem[]
): boolean {
  const child = menuItems.find((item) => item.ID.toString() === childId);
  return child ? child.parent === parentId : false;
}
