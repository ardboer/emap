/**
 * Content Parsing Utilities
 *
 * This file contains functions for parsing and processing content from various sources.
 * Extracted from services/api.ts as part of the refactoring effort.
 */

import { StructuredContentNode } from "@/types";

/**
 * Strips HTML tags from a string
 *
 * @param html - The HTML string to strip tags from
 * @returns The text content without HTML tags
 *
 * @example
 * stripHtml('<p>Hello <strong>World</strong></p>') // Returns: 'Hello World'
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Decodes common HTML entities to their character equivalents
 *
 * Handles entities like:
 * - Quotes: &#8216;, &#8217;, &#8220;, &#8221;
 * - Dashes: &#8211;, &#8212;
 * - Special chars: &amp;, &lt;, &gt;, &quot;, &#039;
 *
 * @param text - The text containing HTML entities
 * @returns The text with entities decoded
 *
 * @example
 * decodeHtmlEntities('It&#8217;s a &quot;test&quot;') // Returns: "It's a "test""
 */
export function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    "&#8216;": "'",
    "&#8217;": "'",
    "&#8220;": '"',
    "&#8221;": '"',
    "&#8211;": "–",
    "&#8212;": "—",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
  };

  return text.replace(/&#?\w+;/g, (entity) => entities[entity] || entity);
}

/**
 * Parses structured content nodes into plain text
 *
 * Recursively processes a tree of StructuredContentNode objects and converts them
 * into formatted plain text. Handles:
 * - Text nodes: Direct text content
 * - Paragraphs: Adds line breaks between paragraphs
 * - Blockquotes: Wraps content in quotation marks
 * - Links: Extracts link text content
 *
 * @param nodes - Array of structured content nodes to parse
 * @returns Formatted plain text representation of the content
 *
 * @example
 * const nodes = [
 *   { typename: 'HTMLElement', type: 'p', children: [
 *     { typename: 'HTMLTextNode', text: 'Hello World' }
 *   ]}
 * ];
 * parseStructuredContent(nodes) // Returns: 'Hello World'
 */
export function parseStructuredContent(nodes: StructuredContentNode[]): string {
  let result = "";

  for (const node of nodes) {
    if (node.typename === "HTMLTextNode") {
      result += node.text || "";
    } else if (node.typename === "HTMLElement") {
      if (node.type === "p") {
        // Add paragraph break only if there's already content
        if (result.trim()) {
          result += "\n\n";
        }
      } else if (node.type === "blockquote") {
        if (result.trim()) {
          result += "\n\n";
        }
        result += '"';
      }

      if (node.children) {
        result += parseStructuredContent(node.children);
      }

      if (node.type === "blockquote") {
        result += '"';
        if (result.trim()) {
          result += "\n\n";
        }
      }
    } else if (node.typename === "HTMLLink") {
      if (node.children) {
        result += parseStructuredContent(node.children);
      }
    }
  }

  return result.trim();
}
