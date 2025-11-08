import { nativeAdService } from "./nativeAds";

/**
 * Manages native ad position calculations for the carousel
 * Handles preload/unload distance checks and position calculations
 */
class NativeAdPositionManager {
  /**
   * Check if a position should have a native ad
   */
  shouldShowAdAtPosition(position: number): boolean {
    return nativeAdService.shouldShowAdAtIndex(position);
  }

  /**
   * Get all ad positions up to a given maximum position
   * Useful for initial setup and endless scroll
   */
  getAdPositionsUpTo(maxPosition: number): number[] {
    const config = nativeAdService.getConfig();
    if (!config || !config.enabled) {
      return [];
    }

    const positions: number[] = [];
    const { firstAdPosition, adInterval } = config;

    // Calculate all ad positions from first position up to max
    for (let pos = firstAdPosition; pos <= maxPosition; pos += adInterval) {
      positions.push(pos);
    }

    return positions;
  }

  /**
   * Get the next ad position after the current position
   */
  getNextAdPosition(currentPosition: number): number | null {
    return nativeAdService.getNextAdPosition(currentPosition);
  }

  /**
   * Check if an ad at the given position should be preloaded
   * based on the current carousel position
   */
  shouldPreloadAd(adPosition: number, currentPosition: number): boolean {
    const config = nativeAdService.getConfig();
    if (!config || !config.enabled) {
      return false;
    }

    const { preloadDistance, unloadDistance } = config;
    const distance = adPosition - currentPosition;

    // Load if:
    // 1. We're at the ad position (distance === 0)
    // 2. Ad is ahead within preload distance (distance > 0 && distance <= preloadDistance)
    // 3. We're past the ad but within unload distance (for backward scrolling)
    return (
      distance === 0 ||
      (distance > 0 && distance <= preloadDistance) ||
      (distance < 0 && Math.abs(distance) <= unloadDistance)
    );
  }

  /**
   * Check if an ad at the given position should be unloaded
   * based on the current carousel position
   */
  shouldUnloadAd(adPosition: number, currentPosition: number): boolean {
    const config = nativeAdService.getConfig();
    if (!config || !config.enabled) {
      return false;
    }

    const { unloadDistance } = config;
    const distance = Math.abs(adPosition - currentPosition);

    // Unload if ad is beyond unload distance in either direction
    return distance > unloadDistance;
  }

  /**
   * Get all ad positions that should be loaded for the current position
   * This includes the current position and positions within preload distance
   */
  getPositionsToLoad(
    currentPosition: number,
    totalPositions: number
  ): number[] {
    const config = nativeAdService.getConfig();
    if (!config || !config.enabled) {
      return [];
    }

    const { preloadDistance } = config;
    const positionsToLoad: number[] = [];

    // Check all ad positions within range
    const allAdPositions = this.getAdPositionsUpTo(
      currentPosition + preloadDistance + 1
    );

    for (const adPos of allAdPositions) {
      if (
        adPos < totalPositions &&
        this.shouldPreloadAd(adPos, currentPosition)
      ) {
        positionsToLoad.push(adPos);
      }
    }

    return positionsToLoad;
  }

  /**
   * Get all ad positions that should be unloaded for the current position
   */
  getPositionsToUnload(
    currentPosition: number,
    loadedPositions: number[]
  ): number[] {
    const positionsToUnload: number[] = [];

    for (const adPos of loadedPositions) {
      if (this.shouldUnloadAd(adPos, currentPosition)) {
        positionsToUnload.push(adPos);
      }
    }

    return positionsToUnload;
  }

  /**
   * Check if we've reached the maximum ads per session limit
   */
  hasReachedAdLimit(loadedAdCount: number): boolean {
    const config = nativeAdService.getConfig();
    if (!config || !config.enabled) {
      return true;
    }

    const { maxAdsPerSession } = config;

    // If maxAdsPerSession is null or undefined, no limit
    if (maxAdsPerSession === null || maxAdsPerSession === undefined) {
      return false;
    }

    return loadedAdCount >= maxAdsPerSession;
  }

  /**
   * Get configuration for debugging
   */
  getConfig() {
    return nativeAdService.getConfig();
  }

  /**
   * Calculate distance between two positions
   */
  getDistance(position1: number, position2: number): number {
    return Math.abs(position1 - position2);
  }

  /**
   * Check if position is within viewing range (not too far ahead or behind)
   */
  isWithinViewingRange(adPosition: number, currentPosition: number): boolean {
    const config = nativeAdService.getConfig();
    if (!config) {
      return false;
    }

    const distance = this.getDistance(adPosition, currentPosition);
    const maxDistance = Math.max(config.preloadDistance, config.unloadDistance);

    return distance <= maxDistance;
  }
}

// Export singleton instance
export const nativeAdPositionManager = new NativeAdPositionManager();
export default nativeAdPositionManager;
