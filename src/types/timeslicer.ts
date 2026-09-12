export type TestMode = 'BLOCKING' | 'EVERY' | 'TIME' | 'PERCENT';

/**
 * [자바스크립트 실행 시간 예산 (Budget Preset) Enum]
 * 기기 성능 사양 또는 서버 Config 설정값에 따라 유연하게 선택할 수 있는 예산시간(ms)입니다.
 */
export enum BudgetPreset {
  /** 저사양 기기 / UI 반응성 최우선 (5ms) */
  LOW_SPEC = 5,
  /** 표준 균형 값 (10ms - 기본 권장값) */
  BALANCED = 10,
  /** 고사양 기기 / 60fps 1프레임 budget (16.6ms) */
  HIGH_PERF = 16.6,
  /** 대용량 작업 우선 / 30fps budget (33.3ms) */
  HEAVY_JOB = 33.3,
  /** Long Task 기준 한계선 (50ms) */
  LONG_TASK_MAX = 50,
}

/**
 * [기기 사양 등급 Enum]
 */
export enum DeviceTier {
  LOW = 'LOW',
  BALANCED = 'BALANCED',
  HIGH = 'HIGH',
}

/**
 * [타임슬라이서 전역 설정 (Config) 인터페이스]
 */
export interface TimeslicerConfig {
  /** 현재 선택된 예산 프리셋 Enum (또는 수동 설정 ms) */
  budgetPreset: BudgetPreset;
  /** 실제 적용되는 예산 시간 (ms) */
  timeBudgetMs: number;
  /** 청크 분할 비율 (기본 0.08 / 8%) */
  percentChunk: number;
  /** 설정 출처 정보 (예: 'DEFAULTS' | 'AUTO_DETECTED' | 'SERVER_CONFIG' | 'USER_MANUAL') */
  configSource: 'DEFAULTS' | 'AUTO_DETECTED' | 'SERVER_CONFIG' | 'USER_MANUAL';
  /** 감지된 기기 등급 (자동 감지 시 기록) */
  detectedTier?: DeviceTier;
}

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
