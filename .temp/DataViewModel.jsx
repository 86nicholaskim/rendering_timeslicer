// DataViewModel.js (또는 App.jsx 상단)

class RowDataViewModel {
  constructor() {
    this.rows = [];
    this.isReady = false;
    this.onProgress = null;
  }

  // 최적화된 양보 유틸리티 (메인 스레드 숨통 틔우기)
  async #yieldToMain() {
    const scheduler = globalThis.scheduler;
    if (scheduler?.yield) return await scheduler.yield();

    return new Promise((resolve) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = resolve;
      port2.postMessage(null);
    });
  }

  /**
   * @param {number} totalSize - 생성할 행 데이터 총 개수
   * @param {number} percentDamage - 양보할 구간 퍼센트 (기본 8%)
   */
  async prepare(totalSize, percentDamage = 0.08) {
    this.rows = [];
    this.isReady = false;

    // 💡 퍼센트 기반 구간 계산 (8% 데미지 구간)
    const chunkUnit = Math.floor(totalSize * percentDamage);
    const start = performance.now();

    for (let i = 0; i < totalSize; i++) {
      // 1. 실제 행 데이터 생성 (객체 생성 비용 발생)
      this.rows.push({
        id: i,
        title: `행 데이터 #${i}`,
        value: Math.random() * 100,
        timestamp: new Date().getTime(),
      });

      // 2. 설정한 퍼센트 구간(8%)마다 체크
      if (i > 0 && i % chunkUnit === 0) {
        // UI 진행률 업데이트
        if (this.onProgress) {
          const progress = Math.floor((i / totalSize) * 100);
          this.onProgress(progress);
        }

        // 🔥 메인 스레드에 제어권 양보 (이 시점에 리액트 틱이 올라감)
        await this.#yieldToMain();
      }
    }

    this.isReady = true;
    const end = performance.now();
    console.log(
      `[ViewModel] ${totalSize}행 준비 완료: ${(end - start).toFixed(2)}ms`
    );

    if (this.onProgress) this.onProgress(100);
    return this.rows;
  }
}
