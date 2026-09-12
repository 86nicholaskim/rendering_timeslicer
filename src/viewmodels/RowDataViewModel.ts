import { TestMode, RowItem, PrepareResult } from '../types/timeslicer';
import { yieldNow } from '../utils/yield';

export class RowDataViewModel {
  public rows: RowItem[] = [];
  public onProgress: ((progress: number) => void) | null = null;

  /**
   * Prepares heavy row data using the specified time-slicing mode.
   *
   * @param totalSize Total number of rows to generate (e.g. 10,000,000)
   * @param mode Strategy mode ('BLOCKING' | 'EVERY' | 'TIME' | 'PERCENT')
   * @param timeBudgetMs Time budget in milliseconds for TIME mode (default 10ms)
   * @param percentChunk Chunk ratio for PERCENT mode (default 0.08 / 8%)
   */
  async prepare(
    totalSize: number,
    mode: TestMode = 'PERCENT',
    timeBudgetMs = 10,
    percentChunk = 0.08
  ): Promise<PrepareResult> {
    this.rows = [];
    const start = performance.now();
    const chunk8Percent = Math.max(1, Math.floor(totalSize * percentChunk));
    let lastYieldTime = performance.now();

    for (let i = 0; i < totalSize; i++) {
      this.rows.push({
        id: i,
        val: Math.random(),
        title: `Row Item #${i}`,
        timestamp: Date.now(),
      });

      if (mode === 'BLOCKING') {
        // ❌ Synchronous: No yield to main thread. Completely blocks UI render and ticks.
      } else if (mode === 'EVERY') {
        // ❌ Yields on every single loop iteration. Extremely safe UI but high overhead.
        await yieldNow();
        if (i % 100_000 === 0) {
          this.updateProgress(i, totalSize);
        }
      } else if (mode === 'TIME') {
        // ✅ Yields when execution time exceeds the budget (e.g., 10ms).
        if (performance.now() - lastYieldTime > timeBudgetMs) {
          await yieldNow();
          lastYieldTime = performance.now();
          this.updateProgress(i, totalSize);
        }
      } else if (mode === 'PERCENT') {
        // ✅ Yields at predefined percentage intervals (e.g. every 8% chunk).
        if (i > 0 && i % chunk8Percent === 0) {
          await yieldNow();
          this.updateProgress(i, totalSize);
        }
      }
    }

    this.updateProgress(totalSize, totalSize);
    const duration = performance.now() - start;

    return {
      data: this.rows,
      time: duration,
    };
  }

  private updateProgress(current: number, total: number): void {
    if (this.onProgress) {
      const percentage = Math.min(100, Math.floor((current / total) * 100));
      this.onProgress(percentage);
    }
  }
}
