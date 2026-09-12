import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BudgetPreset, TimeslicerConfig } from '../types/timeslicer';
import { detectDeviceSpec } from '../utils/deviceDetector';

interface TimeslicerConfigContextType {
  config: TimeslicerConfig;
  setBudgetPreset: (preset: BudgetPreset, source?: TimeslicerConfig['configSource']) => void;
  applyAutoDeviceDetection: () => void;
  simulateServerConfigFetch: (preset: BudgetPreset) => Promise<void>;
  updateCustomTimeBudget: (ms: number) => void;
}

const defaultConfig: TimeslicerConfig = {
  budgetPreset: BudgetPreset.BALANCED,
  timeBudgetMs: BudgetPreset.BALANCED,
  percentChunk: 0.08,
  configSource: 'DEFAULTS',
};

const TimeslicerConfigContext = createContext<TimeslicerConfigContextType | undefined>(undefined);

/**
 * [Timeslicer Config Provider]
 * 서버 Config 수신값이나 기기 사양 자동 감지 결과를 전달받아 
 * 전체 애플리케이션에 BudgetPreset 시간 예산을 유연하게 공급하는 React Context Provider입니다.
 */
export const TimeslicerConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<TimeslicerConfig>(defaultConfig);

  // BudgetPreset 이넘 지정 함수
  const setBudgetPreset = (
    preset: BudgetPreset,
    source: TimeslicerConfig['configSource'] = 'USER_MANUAL'
  ) => {
    setConfig((prev) => ({
      ...prev,
      budgetPreset: preset,
      timeBudgetMs: preset,
      configSource: source,
    }));
  };

  // 브라우저 하드웨어 사양 기반 자동 감지 및 예산 할당
  const applyAutoDeviceDetection = () => {
    const spec = detectDeviceSpec();
    setConfig((prev) => ({
      ...prev,
      budgetPreset: spec.recommendedPreset,
      timeBudgetMs: spec.recommendedPreset,
      configSource: 'AUTO_DETECTED',
      detectedTier: spec.tier,
    }));
  };

  // 서버 Config 수신 동적 연동 시뮬레이션
  const simulateServerConfigFetch = async (preset: BudgetPreset) => {
    await new Promise((r) => setTimeout(r, 300));
    setConfig((prev) => ({
      ...prev,
      budgetPreset: preset,
      timeBudgetMs: preset,
      configSource: 'SERVER_CONFIG',
    }));
  };

  // 임의 수동 ms 조정
  const updateCustomTimeBudget = (ms: number) => {
    setConfig((prev) => ({
      ...prev,
      timeBudgetMs: ms,
      configSource: 'USER_MANUAL',
    }));
  };

  return (
    <TimeslicerConfigContext.Provider
      value={{
        config,
        setBudgetPreset,
        applyAutoDeviceDetection,
        simulateServerConfigFetch,
        updateCustomTimeBudget,
      }}
    >
      {children}
    </TimeslicerConfigContext.Provider>
  );
};

export const useTimeslicerConfig = (): TimeslicerConfigContextType => {
  const context = useContext(TimeslicerConfigContext);
  if (!context) {
    throw new Error('useTimeslicerConfig must be used within a TimeslicerConfigProvider');
  }
  return context;
};
