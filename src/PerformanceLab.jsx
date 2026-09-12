import React, { useEffect, useState, useRef } from "react";

const WORK_SIZE = 30_000_000;

// --- 공통 양보 유틸리티 (2025 표준) ---
const yieldNow = () => {
  if (globalThis.scheduler?.yield) return scheduler.yield();
  return new Promise((r) => {
    const { port1, port2 } = new MessageChannel();
    port1.onmessage = r;
    port2.postMessage(null);
  });
};

export default function PerformanceLab() {
  const [tick, setTick] = useState(0);
  const [results, setResults] = useState({
    EVERY: { progress: 0, time: 0, isRunning: false },
    TIME: { progress: 0, time: 0, isRunning: false },
    PERCENT: { progress: 0, time: 0, isRunning: false },
  });

  // 🔍 렌더링 확인용 틱 (프리징 확인용)
  useEffect(() => {
    let raf;
    const loop = () => {
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 🔥 1. 매번 체크 모드 (가장 느리지만 안전함)
  const runEveryCheck = async () => {
    setResults((prev) => ({
      ...prev,
      EVERY: { ...prev.EVERY, isRunning: true, time: 0 },
    }));
    const start = performance.now();
    let data = [];
    for (let i = 0; i <= WORK_SIZE; i++) {
      data.push(i);
      await yieldNow(); // ❌ 매 루프마다 비동기 예약 (오버헤드 최악)
      if (i % 100000 === 0)
        setResults((p) => ({
          ...p,
          EVERY: { ...p.EVERY, progress: Math.floor((i / WORK_SIZE) * 100) },
        }));
    }
    setResults((p) => ({
      ...p,
      EVERY: {
        progress: 100,
        time: performance.now() - start,
        isRunning: false,
      },
    }));
  };

  // 🔥 2. 시간 기반 체크 (10ms 예산 모드)
  const runTimeBudget = async () => {
    setResults((prev) => ({
      ...prev,
      TIME: { ...prev.TIME, isRunning: true, time: 0 },
    }));
    const start = performance.now();
    let lastYield = performance.now();
    let data = [];
    for (let i = 0; i <= WORK_SIZE; i++) {
      data.push(i);
      if (performance.now() - lastYield > 10) {
        // ✅ 10ms마다 양보
        await yieldNow();
        lastYield = performance.now();
        setResults((p) => ({
          ...p,
          TIME: { ...p.TIME, progress: Math.floor((i / WORK_SIZE) * 100) },
        }));
      }
    }
    setResults((p) => ({
      ...p,
      TIME: {
        progress: 100,
        time: performance.now() - start,
        isRunning: false,
      },
    }));
  };

  // 🔥 3. 퍼센트 데미지 모드 (8% 구간 분할)
  const runPercentChunk = async () => {
    setResults((prev) => ({
      ...prev,
      PERCENT: { ...prev.PERCENT, isRunning: true, time: 0 },
    }));
    const start = performance.now();
    const chunk = Math.floor(WORK_SIZE * 0.08); // 8% 단위
    let data = [];
    for (let i = 0; i <= WORK_SIZE; i++) {
      data.push(i);
      if (i > 0 && i % chunk === 0) {
        // ✅ 딱 12번만 양보 (DPS 최강)
        await yieldNow();
        setResults((p) => ({
          ...p,
          PERCENT: {
            ...p.PERCENT,
            progress: Math.floor((i / WORK_SIZE) * 100),
          },
        }));
      }
    }
    setResults((p) => ({
      ...p,
      PERCENT: {
        progress: 100,
        time: performance.now() - start,
        isRunning: false,
      },
    }));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>🚀 연산 모드별 성능 비교 (2025)</h1>
      <div
        style={{
          background: "#000",
          color: "#0f0",
          padding: "10px",
          marginBottom: "20px",
          fontSize: "20px",
        }}
      >
        실시간 렌더링 틱: {tick} (멈추면 프리징!)
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
        }}
      >
        {/* 모드 1 */}
        <div style={cardStyle}>
          <h3>1. 매번 체크</h3>
          <p>매 루프 `await yield()`</p>
          <button onClick={runEveryCheck} disabled={results.EVERY.isRunning}>
            시작
          </button>
          <ProgressBar progress={results.EVERY.progress} color="#ff4444" />
          <p>소요 시간: {results.EVERY.time.toFixed(2)}ms</p>
        </div>

        {/* 모드 2 */}
        <div style={cardStyle}>
          <h3>2. 10ms 예산</h3>
          <p>시간 측정 후 양보</p>
          <button onClick={runTimeBudget} disabled={results.TIME.isRunning}>
            시작
          </button>
          <ProgressBar progress={results.TIME.progress} color="#ffbb33" />
          <p>소요 시간: {results.TIME.time.toFixed(2)}ms</p>
        </div>

        {/* 모드 3 */}
        <div style={cardStyle}>
          <h3>3. 8% 퍼센트</h3>
          <p>8% 구간마다 양보</p>
          <button
            onClick={runPercentChunk}
            disabled={results.PERCENT.isRunning}
          >
            시작
          </button>
          <ProgressBar progress={results.PERCENT.progress} color="#00C851" />
          <p>소요 시간: {results.PERCENT.time.toFixed(2)}ms</p>
        </div>
      </div>
    </div>
  );
}

// 재사용 UI 컴포넌트
const ProgressBar = ({ progress, color }) => (
  <div
    style={{
      background: "#eee",
      width: "100%",
      height: "20px",
      margin: "10px 0",
    }}
  >
    <div
      style={{
        width: `${progress}%`,
        height: "100%",
        background: color,
        transition: "width 0.2s",
      }}
    />
  </div>
);

const cardStyle = {
  border: "1px solid #ccc",
  padding: "15px",
  borderRadius: "8px",
  textAlign: "center",
};
