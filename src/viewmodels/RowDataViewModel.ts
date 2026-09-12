import { TestMode, RowItem, PrepareResult } from '../types/timeslicer';
import { yieldNow } from '../utils/yield';

/**
 * [대용량 데이터 생성 및 타임슬라이싱 벤치마크 뷰모델]
 * 1,000만 건 이상의 대용량 데이터를 가공할 때 
 * 4가지 처리 모드(동기/매루프/시간예산/청크비율)별 성능을 측정합니다.
 */
export class RowDataViewModel {
  public rows: RowItem[] = [];
  public onProgress: ((progress: number) => void) | null = null;

  /**
   * 대용량 행 데이터를 생성하면서 지정된 전략에 따라 메인 스레드에 제어권을 양보합니다.
   *
   * @param totalSize 생성할 총 데이터 개수 (예: 10,000,000 건)
   * @param mode 양보 전략 모드 ('BLOCKING' | 'EVERY' | 'TIME' | 'PERCENT')
   * @param timeBudgetMs TIME 모드의 시간 예산 (기본값: 10ms)
   * @param percentChunk PERCENT 모드의 청크 비율 (기본값: 0.08 / 8%)
   */
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
        // ❌ 동기 모드: 제어권 양보 없음. 메인 스레드를 점유하여 UI 프리징 유발.
      } else if (mode === 'EVERY') {
        // ❌ 매 루프 양보: 매 턴마다 yield. UI는 반응하나 잦은 스위칭으로 처리 속도 큼.
        await yieldNow();
        if (i % 100_000 === 0) {
          this.updateProgress(i, totalSize);
        }
      } else if (mode === 'TIME') {
        // ✅ 시간 예산 모드: 일정 시간(예: 10ms)이 지날 때마다 양보하여 스레드 쾌적도 유지.
        if (performance.now() - lastYieldTime > timeBudgetMs) {
          await yieldNow();
          lastYieldTime = performance.now();
          this.updateProgress(i, totalSize);
        }
      } else if (mode === 'PERCENT') {
        // ✅ 청크 비율 모드: 전체 연산량의 일정 비율(예: 8%)마다 양보. 연산 속도가 우수함.
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
