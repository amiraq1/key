
import { layoutOptimizer } from './layoutOptimizer';

interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

export const PerformanceTester = {
  startTime: 0,
  frameCount: 0,
  lastFpsTime: 0,
  isMonitoring: false,
  rafId: null as number | null,

  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.startTime = performance.now();
    this.lastFpsTime = performance.now();
    this.frameCount = 0;
    
    console.log("[Performance] Monitoring started");
    this.loop();
  },

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    const totalTime = performance.now() - this.startTime;
    console.log(`[Performance] Monitoring stopped. Total time: ${Math.round(totalTime)}ms`);
  },

  loop() {
    if (!this.isMonitoring) return;

    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsTime;

    if (elapsed >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / elapsed);
      console.log(`[Performance] FPS: ${fps}`);
      
      // Memory Check (Chrome/Chromium only)
      const memory = (performance as any).memory as MemoryInfo;
      if (memory) {
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        console.log(`[Performance] Memory: ${usedMB} MB`);
      }

      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    this.rafId = requestAnimationFrame(() => this.loop());
  },

  /**
   * Measures the execution time of a synchronous operation.
   * Logs a warning if it exceeds 1ms (simulating the Kotlin threshold).
   */
  measureOperation<T>(name: string, operation: () => T): T {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;

    if (duration > 1) {
      console.warn(`[Performance] Slow operation: ${name} took ${duration.toFixed(3)}ms`);
    }
    return result;
  },

  /**
   * Runs a stress test on the layout optimizer to benchmark rendering logic.
   */
  runBenchmark(iterations: number = 5000): Promise<string> {
    return new Promise((resolve) => {
      console.log(`[Performance] Starting benchmark with ${iterations} iterations...`);
      
      const start = performance.now();
      
      // Stress test: heavily request cached styles
      for (let i = 0; i < iterations; i++) {
         // Simulate random key widths
         const width = 1 + (Math.random() * 2); 
         const scale = 0.5 + (Math.random() * 1.5);
         layoutOptimizer.getFlexStyle(width, scale);
      }

      const duration = performance.now() - start;
      const avgTimeUs = (duration * 1000) / iterations; // microseconds
      const opsPerSec = Math.round(1000000000 / (avgTimeUs * 1000)); // approx

      const report = `Benchmark Completed:
      - Iterations: ${iterations}
      - Total Time: ${duration.toFixed(2)}ms
      - Avg per Op: ${avgTimeUs.toFixed(2)}μs
      - Ops/Sec: ${opsPerSec.toLocaleString()}`;

      console.log(report);
      resolve(report);
    });
  }
};
