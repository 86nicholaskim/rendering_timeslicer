import { BudgetPreset, DeviceTier } from '../types/timeslicer';

export interface DeviceSpecResult {
  tier: DeviceTier;
  recommendedPreset: BudgetPreset;
  logicalCores: number;
  deviceMemoryGb: number | null;
  description: string;
}

/**
 * [기기 사양 자동 측정 및 BudgetPreset 이넘 매핑 유틸]
 * 브라우저 하드웨어 API(CPU 코어 수, RAM 메모리 용량)를 분석하여
 * 현재 실행 환경에 가장 알맞은 타임슬라이싱 예산 이넘(BudgetPreset)을 추천합니다.
 */
export function detectDeviceSpec(): DeviceSpecResult {
  const logicalCores = navigator.hardwareConcurrency || 4;
  // navigator.deviceMemory는 일부 브라우저(Chrome계열)에서 지원
  const deviceMemoryGb = (navigator as unknown as { deviceMemory?: number }).deviceMemory || null;

  let tier = DeviceTier.BALANCED;
  let recommendedPreset = BudgetPreset.BALANCED;
  let description = '';

  if (logicalCores <= 2 || (deviceMemoryGb !== null && deviceMemoryGb <= 2)) {
    tier = DeviceTier.LOW;
    recommendedPreset = BudgetPreset.LOW_SPEC;
    description = `저사양 기기 환경 (CPU 코어: ${logicalCores}개, RAM: ${deviceMemoryGb ?? '알수없음'}GB) ➔ UI 프레임 방어를 위해 5ms 예산 추천`;
  } else if (logicalCores >= 8 && (deviceMemoryGb === null || deviceMemoryGb >= 8)) {
    tier = DeviceTier.HIGH;
    recommendedPreset = BudgetPreset.HIGH_PERF;
    description = `고사양 기기 환경 (CPU 코어: ${logicalCores}개, RAM: ${deviceMemoryGb ?? '8+'}GB) ➔ 1프레임 모션 원활을 위해 16.6ms 예산 추천`;
  } else {
    tier = DeviceTier.BALANCED;
    recommendedPreset = BudgetPreset.BALANCED;
    description = `표준 균형 기기 환경 (CPU 코어: ${logicalCores}개, RAM: ${deviceMemoryGb ?? '표준'}GB) ➔ 표준 10ms 예산 추천`;
  }

  return {
    tier,
    recommendedPreset,
    logicalCores,
    deviceMemoryGb,
    description,
  };
}
