/**
 * useInView Hook
 *
 * Custom hook for detecting when a component is approaching or within the viewport.
 * Used for lazy loading display ads with configurable threshold.
 *
 * Features:
 * - Tracks component position using onLayout
 * - Monitors scroll position
 * - Calculates distance from viewport
 * - Triggers callbacks at threshold
 * - Supports both entering and exiting viewport
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutRectangle, findNodeHandle } from "react-native";

export interface UseInViewOptions {
  /**
   * Distance in pixels before viewport to trigger onEnterView
   * Default: 250px
   */
  threshold?: number;

  /**
   * Additional margin around viewport
   * Default: 0
   */
  rootMargin?: number;

  /**
   * Fire callbacks only once
   * Default: false
   */
  once?: boolean;

  /**
   * Callback when component enters threshold
   */
  onEnterView?: () => void;

  /**
   * Callback when component exits threshold
   */
  onExitView?: () => void;

  /**
   * Enable/disable the hook
   * Default: true
   */
  enabled?: boolean;
}

export interface UseInViewEntry {
  /**
   * Whether component is currently in view
   */
  isIntersecting: boolean;

  /**
   * Component's layout rectangle
   */
  boundingClientRect: LayoutRectangle | null;

  /**
   * Distance from viewport (negative if in viewport)
   */
  distanceFromViewport: number;
}

export interface UseInViewResult {
  /**
   * Ref to attach to the component
   */
  ref: (node: any) => void;

  /**
   * Whether component is in view
   */
  inView: boolean;

  /**
   * Detailed intersection information
   */
  entry: UseInViewEntry;
}

/**
 * Hook to detect when a component is in or approaching the viewport
 */
export function useInView(options: UseInViewOptions = {}): UseInViewResult {
  const {
    threshold = 250,
    rootMargin = 0,
    once = false,
    onEnterView,
    onExitView,
    enabled = true,
  } = options;

  const [inView, setInView] = useState(false);
  const [entry, setEntry] = useState<UseInViewEntry>({
    isIntersecting: false,
    boundingClientRect: null,
    distanceFromViewport: Infinity,
  });

  const nodeRef = useRef<any>(null);
  const layoutRef = useRef<LayoutRectangle | null>(null);
  const hasTriggeredOnce = useRef(false);
  const previousInView = useRef(false);

  /**
   * Handle layout measurement
   */
  const handleLayout = useCallback(
    (event: any) => {
      if (!enabled) return;

      const layout = event.nativeEvent.layout;
      layoutRef.current = layout;

      // Measure position relative to window
      if (nodeRef.current) {
        const handle = findNodeHandle(nodeRef.current);
        if (handle) {
          // @ts-ignore - measureInWindow is available but not in types
          nodeRef.current.measureInWindow?.(
            (x: number, y: number, width: number, height: number) => {
              const windowHeight =
                require("react-native").Dimensions.get("window").height;
              const effectiveThreshold = threshold + rootMargin;

              // Calculate if component is in view or approaching
              const topEdge = y;
              const bottomEdge = y + height;
              const viewportBottom = windowHeight;

              // Distance from bottom of viewport to top of component
              const distanceFromViewport = topEdge - viewportBottom;

              // Component is "in view" if it's within threshold of viewport
              const isApproaching = distanceFromViewport <= effectiveThreshold;
              const isInViewport = topEdge < viewportBottom && bottomEdge > 0;
              const shouldBeInView = isApproaching || isInViewport;

              // Update entry
              setEntry({
                isIntersecting: shouldBeInView,
                boundingClientRect: { x, y, width, height },
                distanceFromViewport,
              });

              // Update inView state
              if (shouldBeInView !== previousInView.current) {
                if (once && hasTriggeredOnce.current && shouldBeInView) {
                  // Don't trigger again if once=true and already triggered
                  return;
                }

                setInView(shouldBeInView);
                previousInView.current = shouldBeInView;

                // Trigger callbacks
                if (shouldBeInView) {
                  hasTriggeredOnce.current = true;
                  onEnterView?.();
                } else {
                  onExitView?.();
                }
              }
            }
          );
        }
      }
    },
    [enabled, threshold, rootMargin, once, onEnterView, onExitView]
  );

  /**
   * Ref callback to attach to component
   */
  const ref = useCallback(
    (node: any) => {
      if (node) {
        nodeRef.current = node;

        // Trigger initial measurement
        setTimeout(() => {
          if (nodeRef.current && nodeRef.current.measure) {
            nodeRef.current.measure(
              (
                x: number,
                y: number,
                width: number,
                height: number,
                pageX: number,
                pageY: number
              ) => {
                handleLayout({
                  nativeEvent: {
                    layout: { x: pageX, y: pageY, width, height },
                  },
                });
              }
            );
          }
        }, 100);
      } else {
        nodeRef.current = null;
        layoutRef.current = null;
      }
    },
    [handleLayout]
  );

  /**
   * Set up scroll listener for continuous monitoring
   * Note: In a real implementation, you'd want to connect this to the parent ScrollView
   * For now, we'll rely on periodic checks
   */
  useEffect(() => {
    if (!enabled || !nodeRef.current) return;

    // Periodic check for position changes
    const interval = setInterval(() => {
      if (nodeRef.current && layoutRef.current) {
        handleLayout({
          nativeEvent: {
            layout: layoutRef.current,
          },
        });
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [enabled, handleLayout]);

  return {
    ref,
    inView,
    entry,
  };
}

export default useInView;
