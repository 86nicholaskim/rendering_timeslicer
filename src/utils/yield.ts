import { ModernScheduler } from '../types/timeslicer';

/**
 * Yields execution back to the browser main thread to allow rendering,
 * user interactions, and event loop processing to take place.
 */
export const yieldNow = (): Promise<void> => {
  const scheduler = (globalThis as unknown as { scheduler?: ModernScheduler }).scheduler;
  if (scheduler?.yield) {
    return scheduler.yield();
  }

  if (globalThis.MessageChannel) {
    return new Promise((resolve) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = () => resolve();
      port2.postMessage(null);
    });
  }

  return new Promise((resolve) => setTimeout(resolve, 0));
};
