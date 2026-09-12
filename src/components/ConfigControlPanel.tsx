import React, { useState } from 'react';
import { useTimeslicerConfig } from '../context/TimeslicerConfigContext';
import { BudgetPreset } from '../types/timeslicer';
import { detectDeviceSpec } from '../utils/deviceDetector';

export const ConfigControlPanel: React.FC = () => {
  const {
    config,
    setBudgetPreset,
    applyAutoDeviceDetection,
    simulateServerConfigFetch,
  } = useTimeslicerConfig();

  const [isServerLoading, setIsServerLoading] = useState(false);
  const detectedSpec = detectDeviceSpec();

  const presets = [
    { label: '저사양 (5ms)', value: BudgetPreset.LOW_SPEC },
    { label: '표준 균형 (10ms)', value: BudgetPreset.BALANCED },
    { label: '고사양 60fps (16.6ms)', value: BudgetPreset.HIGH_PERF },
    { label: '작업 우선 (33.3ms)', value: BudgetPreset.HEAVY_JOB },
    { label: 'LongTask 임계 (50ms)', value: BudgetPreset.LONG_TASK_MAX },
  ];

  const handleServerFetch = async (preset: BudgetPreset) => {
    setIsServerLoading(true);
    await simulateServerConfigFetch(preset);
    setIsServerLoading(false);
  };

  const getSourceBadge = () => {
    switch (config.configSource) {
      case 'AUTO_DETECTED':
        return { text: '📱 자동 기기 사양 감지 적용됨', bg: '#e3f2fd', color: '#1565c0' };
      case 'SERVER_CONFIG':
        return { text: '🌐 서버 Config 수신 적용됨', bg: '#e8f5e9', color: '#2e7d32' };
      case 'USER_MANUAL':
        return { text: '🛠️ 사용자 수신 튜닝 설정', bg: '#fff3e0', color: '#e65100' };
      default:
        return { text: '⚙️ 기본 설정', bg: '#f5f5f5', color: '#616161' };
    }
  };

  const badge = getSourceBadge();

  return (
    <div style={panelContainerStyle}>
      <div style={headerRowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#222' }}>
            ⚙️ Timeslicer Exec Budget Config Controller
          </h3>
          <span style={{ ...badgeStyle, background: badge.bg, color: badge.color }}>
            {badge.text}
          </span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0070f3' }}>
          현재 적용 예산: {config.timeBudgetMs} ms (BudgetPreset: {BudgetPreset[config.budgetPreset] ?? 'CUSTOM'})
        </div>
      </div>

      <div style={sectionGroupStyle}>
        {/* Preset Selector */}
        <div style={{ flex: 1 }}>
          <div style={labelStyle}>BudgetPreset 이넘 설정</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {presets.map((p) => {
              const isSelected = config.budgetPreset === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setBudgetPreset(p.value, 'USER_MANUAL')}
                  style={presetButtonStyle(isSelected)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Source Triggers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
          <div style={labelStyle}>동기화 및 자동 측정 유틸</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={applyAutoDeviceDetection}
              style={actionButtonStyle('#0288d1')}
              title={detectedSpec.description}
            >
              📱 기기 사양 자동 감지
            </button>

            <button
              onClick={() => handleServerFetch(BudgetPreset.HIGH_PERF)}
              disabled={isServerLoading}
              style={actionButtonStyle('#388e3c')}
            >
              {isServerLoading ? '서버 통신 중...' : '🌐 서버 Config 수신'}
            </button>
          </div>
        </div>
      </div>

      {config.configSource === 'AUTO_DETECTED' && (
        <div style={infoBoxStyle}>
          💡 {detectedSpec.description}
        </div>
      )}
    </div>
  );
};

const panelContainerStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '18px 24px',
  marginBottom: '25px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
  flexWrap: 'wrap',
  gap: '10px',
};

const badgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold',
};

const sectionGroupStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '20px',
  flexWrap: 'wrap',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#64748b',
  marginBottom: '8px',
};

const presetButtonStyle = (selected: boolean): React.CSSProperties => ({
  padding: '8px 14px',
  borderRadius: '6px',
  border: selected ? '2px solid #0070f3' : '1px solid #cbd5e1',
  background: selected ? '#eff6ff' : '#f8fafc',
  color: selected ? '#1e40af' : '#334155',
  fontWeight: selected ? 'bold' : 'normal',
  cursor: 'pointer',
  fontSize: '13px',
  transition: 'all 0.15s ease',
});

const actionButtonStyle = (bgColor: string): React.CSSProperties => ({
  padding: '8px 14px',
  borderRadius: '6px',
  border: 'none',
  background: bgColor,
  color: '#ffffff',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '12px',
  flex: 1,
  whiteSpace: 'nowrap',
});

const infoBoxStyle: React.CSSProperties = {
  marginTop: '14px',
  padding: '10px 14px',
  background: '#f0f9ff',
  borderLeft: '4px solid #0288d1',
  borderRadius: '4px',
  fontSize: '13px',
  color: '#0369a1',
};
