import { TimeSlicer } from '../types/timeslicer';
import { yieldNow } from './yield';

/**
 * Creates a budget-aware time-slicer that yields control to the main thread
 * whenever processing time exceeds the allotted time budget (in ms).
 */
export function createTimeSlicer(budgetInMs = 10): TimeSlicer {
  let lastYieldTime = performance.now();

  async function yieldToMain(): Promise<void> {
    await yieldNow();
    lastYieldTime = performance.now();
  }

  return {
    async check(): Promise<boolean> {
      if (performance.now() - lastYieldTime > budgetInMs) {
        await yieldToMain();
        return true; // Yielded to main thread
      }
      return false; // Still within time budget
    },

    yield: yieldToMain,
  };
}
