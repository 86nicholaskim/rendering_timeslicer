import React from 'react';
import { ModeResult } from '../types/timeslicer';

interface ModeCardProps {
  title: string;
  desc: string;
  result: ModeResult;
  onRun: () => void;
  color: string;
}

export const ModeCard: React.FC<ModeCardProps> = ({
  title,
  desc,
  result,
  onRun,
  color,
}) => {
  return (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{title}</h3>
      <p style={{ fontSize: '13px', color: '#666', height: '40px', margin: '0 0 15px 0' }}>
        {desc}
      </p>

      <button
        onClick={onRun}
        disabled={result.isRunning}
        style={buttonStyle(result.isRunning)}
      >
        {result.isRunning ? '가공 중...' : '테스트 시작'}
      </button>

      <div style={progressBg}>
        <div style={progressFill(result.progress, color)} />
      </div>

      <div style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '15px' }}>
        {result.time > 0 ? `⏱️ ${result.time.toFixed(2)} ms` : '---'}
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #e0e0e0',
  padding: '20px',
  borderRadius: '16px',
  textAlign: 'center',
  background: '#ffffff',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '10px 0',
  borderRadius: '8px',
  border: 'none',
  background: disabled ? '#cccccc' : '#222222',
  color: '#ffffff',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 'bold',
  marginBottom: '15px',
  transition: 'background 0.2s ease',
});

const progressBg: React.CSSProperties = {
  background: '#eeeeee',
  width: '100%',
  height: '12px',
  borderRadius: '6px',
  overflow: 'hidden',
};

const progressFill = (width: number, color: string): React.CSSProperties => ({
  width: `${width}%`,
  height: '100%',
  background: color,
  transition: 'width 0.3s ease',
});
