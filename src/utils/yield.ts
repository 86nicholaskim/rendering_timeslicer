import { ModernScheduler } from '../types/timeslicer';

/**
 * [메인 스레드 제어권 양보 (Yield)]
 * 무거운 연산 중에 브라우저가 화면 렌더링이나 사용자 클릭 이벤트를 
 * 처리할 수 있도록 메인 스레드 제어권을 잠시 넘겨줍니다.
 */
export const yieldNow = (): Promise<void> => {
  // 1. 최신 브라우저 표준 scheduler.yield() 방식 (가장 효율적)
  const scheduler = (globalThis as unknown as { scheduler?: ModernScheduler }).scheduler;
  if (scheduler?.yield) {
    return scheduler.yield();
  }

  // 2. MessageChannel 방식 (매크로타스크 기반, 지연 없이 빠른 양보)
  if (globalThis.MessageChannel) {
    return new Promise((resolve) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = () => resolve();
      port2.postMessage(null);
    });
  }

  // 3. 타이머 방식 (구형 브라우저 대응, 최소 4ms 기본 지연 발생)
  return new Promise((resolve) => setTimeout(resolve, 0));
};
