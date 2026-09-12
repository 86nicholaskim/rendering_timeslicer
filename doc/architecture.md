# 📐 Technical Architecture & Code Specification
# 📐 기술 아키텍처 및 소스코드 명세서

---

## 🏛️ Executive Summary / 요약 명세

**English**  
This document specifies the technical architecture, design patterns, and exact code implementations of `rendering_timeslicer`. The project evaluates 4 main-thread execution strategies over `10,000,000` data items to eliminate browser **Long Tasks** (> 50ms blocking duration).

**한국어**  
본 문서는 `rendering_timeslicer` 프로젝트의 기술 아키텍처, 디자인 패턴 및 실제 소스코드 명세를 설명합니다. 본 프로젝트는 `10,000,000`건의 데이터 연산 과정에서 브라우저 **롱태스크(Long Task)**(50ms 이상 차단)를 제거하기 위해 4가지 메인 스레드 실행 전략을 평가합니다.

---

## 🛠️ Code Specifications / 소스코드 명세

### 1. Type Definitions / 타입 명세 ([src/types/timeslicer.ts](file:///c:/myLec/rendering_timeslicer/src/types/timeslicer.ts))

```typescript
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
```

---

### 2. Yielding Implementation / 메인 스레드 양보 구현 ([src/utils/yield.ts](file:///c:/myLec/rendering_timeslicer/src/utils/yield.ts))

**English**  
`yieldNow()` uses a 3-tier fallback strategy to relinquish control back to the event loop:
1. `scheduler.yield()`: Modern Chrome/Edge prioritized task scheduler API.
2. `MessageChannel`: Macrotask queue fallback with zero minimum delay throttling.
3. `setTimeout(r, 0)`: Last-resort fallback.

**한국어**  
`yieldNow()`는 이벤트 루프에 제어권을 양보하기 위해 3단계 fallback 전략을 사용합니다:
1. `scheduler.yield()`: 최신 크롬/엣지 브라우저의 우선순위 스케줄링 API.
2. `MessageChannel`: 최소 지연 스로틀링(Throttling)이 없는 매크로태스크 큐 fallback.
3. `setTimeout(r, 0)`: 최종 fallback.

```typescript
import { ModernScheduler } from '../types/timeslicer';

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
```

---

### 3. Time-Slicer Utility / 타임슬라이서 유틸리티 ([src/utils/timeSlicer.ts](file:///c:/myLec/rendering_timeslicer/src/utils/timeSlicer.ts))

**English**  
`createTimeSlicer(budgetInMs = 10)` tracks elapsed computation time using `performance.now()`. When `elapsed > budgetInMs`, it invokes `yieldToMain()` and updates `lastYieldTime`.

**한국어**  
`createTimeSlicer(budgetInMs = 10)`는 `performance.now()`를 통해 연산 경과 시간을 추적합니다. `경과시간 > budgetInMs` 조건 달성 시 `yieldToMain()`을 호출하고 `lastYieldTime`을 갱신합니다.

```typescript
import { TimeSlicer } from '../types/timeslicer';
import { yieldNow } from './yield';

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
        return true;
      }
      return false;
    },

    yield: yieldToMain,
  };
}
```

---

### 4. ViewModel Layer / 뷰모델 명세 ([src/viewmodels/RowDataViewModel.ts](file:///c:/myLec/rendering_timeslicer/src/viewmodels/RowDataViewModel.ts))

**English**  
`RowDataViewModel` encapsulates array population (`totalSize` items) and time-slicing logic using `prepare(totalSize, mode, timeBudgetMs, percentChunk)`:
- `BLOCKING`: Synchronous execution without yielding.
- `EVERY`: `await yieldNow()` on every loop step (`i % 100_000 === 0` progress updates).
- `TIME`: Checks `performance.now() - lastYieldTime > timeBudgetMs` (default `10ms`).
- `PERCENT`: Checks `i % chunk8Percent === 0` (default `8%` = `totalSize * 0.08`).

**한국어**  
`RowDataViewModel`은 `prepare(totalSize, mode, timeBudgetMs, percentChunk)` 메서드를 통해 데이터 생성 및 타임슬라이싱 로직을 캡슐화합니다:
- `BLOCKING`: 양보 없는 순수 동기 루프 실행.
- `EVERY`: 모든 루프 단계에서 `await yieldNow()` 수행 (`100,000`건 마다 프로그레스 갱신).
- `TIME`: `performance.now() - lastYieldTime > timeBudgetMs` (기본 `10ms`) 조건 검사 후 양보.
- `PERCENT`: `i % chunk8Percent === 0` (기본 `8%` = `totalSize * 0.08`) 구간마다 양보.

```typescript
import { TestMode, RowItem, PrepareResult } from '../types/timeslicer';
import { yieldNow } from '../utils/yield';

export class RowDataViewModel {
  public rows: RowItem[] = [];
  public onProgress: ((progress: number) => void) | null = null;

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
        // Synchronous: No yield to main thread.
      } else if (mode === 'EVERY') {
        await yieldNow();
        if (i % 100_000 === 0) {
          this.updateProgress(i, totalSize);
        }
      } else if (mode === 'TIME') {
        if (performance.now() - lastYieldTime > timeBudgetMs) {
          await yieldNow();
          lastYieldTime = performance.now();
          this.updateProgress(i, totalSize);
        }
      } else if (mode === 'PERCENT') {
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
```

---

### 5. Component Layer / UI 컴포넌트 명세 ([src/components/](file:///c:/myLec/rendering_timeslicer/src/components/))

- **[RenderTickMonitor.tsx](file:///c:/myLec/rendering_timeslicer/src/components/RenderTickMonitor.tsx)**: Runs `requestAnimationFrame` loop maintaining `tick` state. When main thread locks during `BLOCKING` mode, frame callbacks pause, providing real-time visual proof of browser freeze.
- **[ModeCard.tsx](file:///c:/myLec/rendering_timeslicer/src/components/ModeCard.tsx)**: Receives `title`, `desc`, `result: ModeResult`, `onRun`, and `color` props to display benchmark progress and processing duration.
- **[PerformanceLab.tsx](file:///c:/myLec/rendering_timeslicer/src/components/PerformanceLab.tsx)**: Maintains `results: BenchmarkResults` state for `BLOCKING`, `EVERY`, `TIME`, and `PERCENT` modes over `WORK_SIZE = 10_000_000` items.
