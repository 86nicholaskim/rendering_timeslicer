import { TimeSlicer } from '../types/timeslicer';
import { yieldNow } from './yield';

/**
 * [시간 예산(Time Budget) 기반 타임슬라이서 생성]
 * 일정 연산 시간(기본 10ms)이 지나면 자동으로 메인 스레드에 제어권을 양보하도록 도와주는 도구입니다.
 */
export function createTimeSlicer(budgetInMs = 10): TimeSlicer {
  let lastYieldTime = performance.now(); // 마지막으로 양보했던 시각 기록

  // 메인 스레드에 제어권을 양보하고 마지막 양보 시각을 갱신합니다.
  async function yieldToMain(): Promise<void> {
    await yieldNow();
    lastYieldTime = performance.now();
  }

  return {
    /**
     * 반복문 내부에서 호출하여 시간 예산(ms)을 초과했는지 확인합니다.
     * 초과했다면 메인 스레드에 제어권을 양보(yield)하고 true를 반환합니다.
     */
    async check(): Promise<boolean> {
      if (performance.now() - lastYieldTime > budgetInMs) {
        await yieldToMain();
        return true; // 시간 초과로 제어권 양보 실행함
      }
      return false; // 아직 시간 예산 범위 내임
    },

    /** 조건 없이 강제로 메인 스레드에 제어권을 양보합니다. */
    yield: yieldToMain,
  };
}
