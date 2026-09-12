export function createTimeSlicer(budget = 10) {
  let lastYieldTime = performance.now();

  async function yieldToMain() {
    if (globalThis.scheduler?.yield) {
      await scheduler.yield();
    } else if (globalThis.MessageChannel) {
      await new Promise((resolve) => {
        const { port1, port2 } = new MessageChannel();
        port1.onmessage = resolve;
        port2.postMessage(null);
      });
    } else {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    // 양보 후 돌아온 시점을 기록하여 다음 budget 계산의 기준으로 삼음
    lastYieldTime = performance.now();
  }

  return {
    // 작업을 진행해도 되는지 확인하고, 시간이 다 됐으면 양보 후 true 반환
    async check() {
      if (performance.now() - lastYieldTime > budget) {
        await yieldToMain();
        return true; // 양보가 발생했음
      }
      return false; // 아직 시간 여유가 있음
    },
    // 강제로 제어권을 넘겨야 할 때 사용
    yield: yieldToMain,
  };
}
