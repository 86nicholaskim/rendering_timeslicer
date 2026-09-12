// 함께 제공된 Gate 기능 (상태 제어용)
export function createPromiseGate() {
  let resolve;
  let promise = new Promise((r) => (resolve = r));

  return {
    wait: () => promise,
    open: () => {
      resolve();
      // 다음 대기자를 위해 새 프라미스 생성
      promise = new Promise((r) => (resolve = r));
    },
  };
}
