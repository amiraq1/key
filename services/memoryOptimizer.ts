
export interface Point {
  x: number;
  y: number;
}

class PointPool {
  private pool: Point[] = [];
  private maxPoolSize = 500; // Limit memory footprint

  /**
   * Gets a Point object from the pool or creates a new one.
   * Helps avoid Garbage Collection spikes during rapid touch events.
   */
  obtain(x: number, y: number): Point {
    if (this.pool.length > 0) {
      const p = this.pool.pop()!;
      p.x = x;
      p.y = y;
      return p;
    }
    return { x, y };
  }

  /**
   * Returns a list of Points back to the pool for reuse.
   */
  recycle(points: Point[]) {
    // Only recycle if we have space, otherwise let GC handle the excess
    if (this.pool.length < this.maxPoolSize) {
      // Take as many as we can fit
      const count = Math.min(points.length, this.maxPoolSize - this.pool.length);
      for (let i = 0; i < count; i++) {
        this.pool.push(points[i]);
      }
    }
    // Clear the array is handled by the caller setting length=0 or assigning []
  }
  
  /**
   * Clears the pool to free memory.
   */
  cleanup() {
      this.pool = [];
  }
}

export const pointPool = new PointPool();
