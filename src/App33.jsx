import React, { useEffect, useState, useRef } from "react";

const WORK_SIZE = 30_000_000;

// --- 🔍 안전한 양보 함수 (컴파일러 오류 방지형) ---
const yieldNow = () => {
  // 1. globalThis를 통해 접근하여 컴파일러의 "변수 미선언" 오류 회피
  const scheduler = globalThis.scheduler;
  if (scheduler?.yield) {
    return scheduler.yield();
  }

  // 2. Fallback: MessageChannel
  if (globalThis.MessageChannel) {
    return new Promise((r) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = r;
      port2.postMessage(null);
    });
  }

  // 3. Last Fallback: setTimeout
  return new Promise((r) => setTimeout(r, 0));
};

export default function App() {
  const [tick, setTick] = useState(0);
  const [results, setResults] = useState({
    EVERY: { progress: 0, time: 0, isRunning: false },
    TIME: { progress: 0, time: 0, isRunning: false },
    PERCENT: { progress: 0, time: 0, isRunning: false },
  });

  // 1. 렌더링 틱 카운터 (UI 생존 확인용)
  useEffect(() => {
    let raf;
    const loop = () => {
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 2. 모드 1: 매번 체크 (Every)
  const runEveryCheck = async () => {
    setResults((p) => ({
      ...p,
      EVERY: { ...p.EVERY, isRunning: true, time: 0, progress: 0 },
    }));
    const start = performance.now();
    let data = [];
    for (let i = 0; i <= WORK_SIZE; i++) {
      data.push(i);
      await yieldNow(); // ❌ 무조건 양보 (오버헤드 극심)
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

  // 3. 모드 2: 시간 기반 (Time - 10ms Budget)
  const runTimeBudget = async () => {
    setResults((p) => ({
      ...p,
      TIME: { ...p.TIME, isRunning: true, time: 0, progress: 0 },
    }));
    const start = performance.now();
    let lastYield = performance.now();
    let data = [];
    for (let i = 0; i <= WORK_SIZE; i++) {
      data.push(i);
      // 1,000번마다 한 번씩만 시간을 재서 오버헤드 감소 (선택 사항)
      if (i % 1000 === 0 && performance.now() - lastYield > 10) {
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

  // 4. 모드 3: 퍼센트 데미지 (Percent - 8% Chunk)
  const runPercentChunk = async () => {
    setResults((p) => ({
      ...p,
      PERCENT: { ...p.PERCENT, isRunning: true, time: 0, progress: 0 },
    }));
    const start = performance.now();
    const chunk = Math.floor(WORK_SIZE * 0.08); // 8% 지점
    let data = [];
    for (let i = 0; i <= WORK_SIZE; i++) {
      data.push(i);
      if (i > 0 && i % chunk === 0) {
        await yieldNow(); // 🎯 딱 12번만 양보
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
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>⚡ 연산 모드별 성능 비교 (2025)</h1>
      <div
        style={{
          background: "#1a1a1a",
          color: "#00ff00",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "30px",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        실시간 렌더링 틱: {tick.toLocaleString()}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
        }}
      >
        <Card
          title="1. 매번 체크"
          desc="매 루프 양보 (가장 느림)"
          result={results.EVERY}
          onRun={runEveryCheck}
          color="#ff4444"
        />

        <Card
          title="2. 10ms 예산"
          desc="시간 측정 기반 (권장)"
          result={results.TIME}
          onRun={runTimeBudget}
          color="#ffbb33"
        />

        <Card
          title="3. 8% 퍼센트"
          desc="8% 구간 분할 (최고 속도)"
          result={results.PERCENT}
          onRun={runPercentChunk}
          color="#00C851"
        />
      </div>
    </div>
  );
}

function Card({ title, desc, result, onRun, color }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      <h3>{title}</h3>
      <p style={{ fontSize: "14px", color: "#666" }}>{desc}</p>
      <button
        onClick={onRun}
        disabled={result.isRunning}
        style={{ padding: "8px 20px", cursor: "pointer", fontWeight: "bold" }}
      >
        {result.isRunning ? "연산 중..." : "테스트 시작"}
      </button>
      <div
        style={{
          background: "#eee",
          width: "100%",
          height: "15px",
          margin: "20px 0",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${result.progress}%`,
            height: "100%",
            background: color,
            transition: "width 0.2s",
          }}
        />
      </div>
      <div style={{ fontSize: "14px" }}>
        {result.time > 0 ? `⏱️ ${result.time.toFixed(2)}ms` : "기다리는 중..."}
      </div>
    </div>
  );
}
