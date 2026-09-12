import React, { useMemo, useState } from 'react';
import { BenchmarkResults, TestMode } from '../types/timeslicer';
import { RowDataViewModel } from '../viewmodels/RowDataViewModel';
import { RenderTickMonitor } from './RenderTickMonitor';
import { ModeCard } from './ModeCard';

const WORK_SIZE = 10_000_000; // 1,000만 건 데이터 연산 기준

export const PerformanceLab: React.FC = () => {
  const [results, setResults] = useState<BenchmarkResults>({
    BLOCKING: { progress: 0, time: 0, isRunning: false },
    EVERY: { progress: 0, time: 0, isRunning: false },
    TIME: { progress: 0, time: 0, isRunning: false },
    PERCENT: { progress: 0, time: 0, isRunning: false },
  });

  const viewModel = useMemo(() => new RowDataViewModel(), []);

  const runTest = async (mode: TestMode) => {
    setResults((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], isRunning: true, progress: 0, time: 0 },
    }));

    viewModel.onProgress = (prog: number) => {
      setResults((prev) => ({
        ...prev,
        [mode]: { ...prev[mode], progress: prog },
      }));
    };

    const { time } = await viewModel.prepare(WORK_SIZE, mode);

    setResults((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], isRunning: false, time, progress: 100 },
    }));
  };

  return (
    <div style={containerStyle}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '15px', color: '#111' }}>
          ⚡ Long Task & Timesliced Rendering Lab
        </h1>
        <RenderTickMonitor />
        <p style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: '12px' }}>
          ⚠️ BLOCKING 모드 실행 시 실시간 틱과 브라우저 UI가 완전히 멈춥니다!
        </p>
        <p style={{ color: '#666', fontSize: '14px' }}>
          데이터 {WORK_SIZE.toLocaleString()} 건 생성 및 타임슬라이싱 성능 비교
        </p>
      </header>

      <div style={gridStyle}>
        <ModeCard
          title="❌ 동기 (Blocking)"
          desc="양보 없음. 메인 스레드를 완전히 점유하여 UI 프리징 유발."
          result={results.BLOCKING}
          onRun={() => runTest('BLOCKING')}
          color="#212121"
        />
        <ModeCard
          title="매 루프 양보 (Every)"
          desc="매 루프마다 yield. UI 반응성은 높으나 잦은 콘텍스트 스위칭으로 느림."
          result={results.EVERY}
          onRun={() => runTest('EVERY')}
          color="#ff4444"
        />
        <ModeCard
          title="시간 예산 (Time - 10ms)"
          desc="10ms 시간 예산 초과 시 양보. 기기 성능 맞춤형 표준 방식."
          result={results.TIME}
          onRun={() => runTest('TIME')}
          color="#ffbb33"
        />
        <ModeCard
          title="청크 분할 (Percent - 8%)"
          desc="8% 구간 분할 양보. 최소한의 쿨타임 양보로 높은 연산 속도 기록."
          result={results.PERCENT}
          onRun={() => runTest('PERCENT')}
          color="#00C851"
        />
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  padding: '40px 20px',
  maxWidth: '1200px',
  margin: '0 auto',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '20px',
};
