export type TestMode = 'BLOCKING' | 'EVERY' | 'TIME' | 'PERCENT';

export interface ModeResult {
  progress: number;
  time: number;
  isRunning: boolean;
}

export type BenchmarkResults = Record<TestMode, ModeResult>;

export interface RowItem {
  id: number;
  val: number;
  title?: string;
  timestamp?: number;
}

export interface PrepareResult {
  data?: RowItem[];
  time: number;
}

export interface TimeSlicer {
  check(): Promise<boolean>;
  yield(): Promise<void>;
}

export interface PromiseGate {
  wait(): Promise<void>;
  open(): void;
}

export interface ModernScheduler {
  yield?: () => Promise<void>;
}




