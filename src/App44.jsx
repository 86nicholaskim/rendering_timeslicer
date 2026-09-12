import React, { useEffect, useState, useMemo } from "react";

const WORK_SIZE = 10_000_000; // 데이터 1,000만 건 기준

// --- 1. 공통 양보 유틸리티 (컴파일러 오류 방지) ---
const yieldNow = () => {
  const sc = globalThis.scheduler;
  if (sc?.yield) return sc.yield();
  if (globalThis.MessageChannel) {
    return new Promise((r) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = r;
      port2.postMessage(null);
    });
  }
  return new Promise((r) => setTimeout(r, 0));
};

// --- 2. 최적화된 데이터 뷰모델 ---
class RowDataViewModel {
  constructor() {
    this.rows = [];
    this.onProgress = null;
  }

  // 모드별 런타임 실행 (Strategy Pattern)
  async prepare(totalSize, mode = "PERCENT") {
    this.rows = [];
    const start = performance.now();
    const chunk8Percent = Math.floor(totalSize * 0.08); // 퍼센트 기준 (8%)
    let lastYieldTime = performance.now();

    for (let i = 0; i < totalSize; i++) {
      // 실제 데이터 생성 (메모리 점유 발생)
      this.rows.push({ id: i, val: Math.random() });

      // --- 모드별 양보 전략 ---
      if (mode === "EVERY") {
        await yieldNow(); // ❌ 매 루프 양보 (최악의 속도)
      } else if (mode === "TIME") {
        if (performance.now() - lastYieldTime > 10) {
          // ✅ 10ms 예산
          await yieldNow();
          lastYieldTime = performance.now();
          this.updateProgress(i, totalSize);
        }
      } else if (mode === "PERCENT") {
        if (i > 0 && i % chunk8Percent === 0) {
          // 🔥 8% 데미지 구간
          await yieldNow();
          this.updateProgress(i, totalSize);
        }
      }
    }

    if (this.onProgress) this.onProgress(100);
    return { data: this.rows, time: performance.now() - start };
  }

  updateProgress(i, totalSize) {
    if (this.onProgress) {
      this.onProgress(Math.floor((i / totalSize) * 100));
    }
  }
}

// --- 3. 메인 앱 컴포넌트 ---
export default function App() {
  const [tick, setTick] = useState(0);
  const [results, setResults] = useState({
    EVERY: { progress: 0, time: 0, isRunning: false },
    TIME: { progress: 0, time: 0, isRunning: false },
    PERCENT: { progress: 0, time: 0, isRunning: false },
  });

  const viewModel = useMemo(() => new RowDataViewModel(), []);

  // 렌더링 틱 (UI 프리징 감시자)
  useEffect(() => {
    let raf;
    const loop = () => {
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const runTest = async (mode) => {
    setResults((p) => ({
      ...p,
      [mode]: { ...p[mode], isRunning: true, progress: 0, time: 0 },
    }));

    viewModel.onProgress = (prog) => {
      setResults((p) => ({ ...p, [mode]: { ...p[mode], progress: prog } }));
    };

    const { time } = await viewModel.prepare(WORK_SIZE, mode);

    setResults((p) => ({
      ...p,
      [mode]: { ...p[mode], isRunning: false, time, progress: 100 },
    }));
  };

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1>🏗️ 2025 ViewModel 성능 연구소</h1>
        <div style={tickBoxStyle}>
          실시간 렌더링 틱: {tick.toLocaleString()}
        </div>
        <p style={{ color: "#666" }}>
          데이터 1,000만 건 생성 및 가공 시뮬레이션
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
        }}
      >
        <ModeCard
          title="매번 체크 (Every)"
          desc="매 루프 yield. UI는 완벽하나 연산은 가장 느림."
          result={results.EVERY}
          onRun={() => runTest("EVERY")}
          color="#ff4444"
        />
        <ModeCard
          title="10ms 예산 (Time)"
          desc="시간 측정 기반. 기기 성능에 맞춰 유동적으로 양보."
          result={results.TIME}
          onRun={() => runTest("TIME")}
          color="#ffbb33"
        />
        <ModeCard
          title="8% 퍼센트 (Percent)"
          desc="탱커용 퍼센트 데미지. 최소한의 양보로 최고 DPS 기록."
          result={results.PERCENT}
          onRun={() => runTest("PERCENT")}
          color="#00C851"
        />
      </div>
    </div>
  );
}

// --- UI 컴포넌트 ---
function ModeCard({ title, desc, result, onRun, color }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 10px 0" }}>{title}</h3>
      <p style={{ fontSize: "13px", color: "#777", height: "40px" }}>{desc}</p>
      <button
        onClick={onRun}
        disabled={result.isRunning}
        style={buttonStyle(result.isRunning)}
      >
        {result.isRunning ? "가공 중..." : "테스트 시작"}
      </button>

      <div style={progressBg}>
        <div style={progressFill(result.progress, color)} />
      </div>

      <div style={{ marginTop: "15px", fontWeight: "bold" }}>
        {result.time > 0 ? `⏱️ ${result.time.toFixed(2)} ms` : "---"}
      </div>
    </div>
  );
}

// --- 스타일 객체 ---
const tickBoxStyle = {
  background: "#1a1a1a",
  color: "#00ff00",
  padding: "15px",
  borderRadius: "8px",
  fontSize: "24px",
  fontWeight: "bold",
  display: "inline-block",
};

const cardStyle = {
  border: "1px solid #ddd",
  padding: "20px",
  borderRadius: "15px",
  textAlign: "center",
  background: "#fff",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
};

const buttonStyle = (disabled) => ({
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "none",
  background: disabled ? "#ccc" : "#333",
  color: "#fff",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: "bold",
  marginBottom: "15px",
});

const progressBg = {
  background: "#eee",
  width: "100%",
  height: "12px",
  borderRadius: "6px",
  overflow: "hidden",
};
const progressFill = (width, color) => ({
  width: `${width}%`,
  height: "100%",
  background: color,
  transition: "width 0.3s ease",
});
