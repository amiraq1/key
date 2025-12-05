
import React from 'react';

type StyleMap = Map<string, React.CSSProperties>;

class LayoutOptimizerService {
  private flexStyleCache: StyleMap = new Map();
  private measurementCache: Map<string, number> = new Map();
  
  constructor() {
      // Pre-populate common sizes to avoid initial cache misses
      this.getFlexStyle(1, 1);
      this.getFlexStyle(1.5, 1);
      this.getFlexStyle(2, 1);
      this.precalculateMeasurements();
  }

  initialize() {
      this.precalculateMeasurements();
      window.addEventListener('resize', () => this.precalculateMeasurements());
  }

  private precalculateMeasurements() {
      if (typeof window === 'undefined') return;
      
      const screenWidth = window.innerWidth;
      // Calculate pixel values for common relative widths (approximate, for absolute positioning needs)
      // Assuming 10 keys per row
      const keyUnit = Math.floor(screenWidth / 10);
      
      this.measurementCache.set('key_small', Math.floor(keyUnit * 0.8));
      this.measurementCache.set('key_medium', keyUnit);
      this.measurementCache.set('key_large', Math.floor(keyUnit * 1.2));
  }

  /**
   * Returns a cached style object for the given flex parameters.
   * Reduces Garbage Collection overhead and enables React.memo optimization 
   * by maintaining referential equality of the style object.
   */
  getFlexStyle(baseWidth: number, scale: number = 1.0): React.CSSProperties {
    // Normalize to 2 decimal places to avoid cache explosion from floating point jitters
    const w = Math.round(baseWidth * 100) / 100;
    const s = Math.round(scale * 100) / 100;
    const key = `${w}-${s}`;
    
    if (!this.flexStyleCache.has(key)) {
      const style = { flex: w * s };
      this.flexStyleCache.set(key, style);
    }
    
    return this.flexStyleCache.get(key)!;
  }

  /**
   * Gets a cached pixel measurement for standard key sizes.
   */
  getCachedMeasurement(key: 'key_small' | 'key_medium' | 'key_large'): number {
      return this.measurementCache.get(key) || 0;
  }

  /**
   * Batch layout updates helper.
   * In React 18+ automatic batching exists, but this provides an explicit hook
   * if we needed to coordinate non-React DOM manipulations.
   */
  batchLayoutUpdates(updates: () => void) {
      // In a real DOM manipulation scenario, we might use requestAnimationFrame here
      updates();
  }

  clearCache() {
    this.flexStyleCache.clear();
    this.measurementCache.clear();
  }
}

export const layoutOptimizer = new LayoutOptimizerService();
