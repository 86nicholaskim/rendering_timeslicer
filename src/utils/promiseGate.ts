import { PromiseGate } from '../types/timeslicer';

/**
 * Creates a Promise Gate mechanism used to manually control async flow execution.
 */
export function createPromiseGate(): PromiseGate {
  let resolveFn!: () => void;
  let promise = new Promise<void>((r) => {
    resolveFn = r;
  });

  return {
    wait: () => promise,
    open: () => {
      resolveFn();
      // Prepare fresh promise for next gate cycle
      promise = new Promise<void>((r) => {
        resolveFn = r;
      });
    },
  };
}
