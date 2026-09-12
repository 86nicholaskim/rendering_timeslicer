import { PromiseGate } from '../types/timeslicer';

/**
 * [비동기 흐름 제어용 프라미스 게이트 (Promise Gate)]
 * 비동기 작업 흐름을 특정 지점에서 대기(wait)시키고, 
 * 외부 이벤트나 원하는 시점에 문을 열어(open) 진행시킬 수 있는 수동 컨트롤러입니다.
 */
export function createPromiseGate(): PromiseGate {
  let resolveFn!: () => void;
  let promise = new Promise<void>((r) => {
    resolveFn = r;
  });

  return {
    /** 문이 열릴 때까지 비동기 대기합니다. */
    wait: () => promise,

    /** 문을 열어 대기 중인 비동기 흐름을 통과시키고, 다음 통과를 위한 새 게이트를 준비합니다. */
    open: () => {
      resolveFn();
      // 다음 사이클을 위해 새로운 프라미스 준비
      promise = new Promise<void>((r) => {
        resolveFn = r;
      });
    },
  };
}
