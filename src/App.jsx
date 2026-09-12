import React, { useEffect, useState, useMemo } from "react";

const WORK_SIZE = 10_000_000; // 데이터 1,000만 건

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

class RowDataViewModel {
  constructor() {
    this.rows = [];
    this.onProgress = null;
  }

  async prepare(totalSize, mode = "PERCENT") {
    this.rows = [];
    const start = performance.now();
    const chunk8Percent = Math.floor(totalSize * 0.08);
    let lastYieldTime = performance.now();

    for (let i = 0; i < totalSize; i++) {
      this.rows.push({ id: i, val: Math.random() });

      // --- 🔍 모드별 전략 (블로킹 케이스 추가) ---
      if (mode === "BLOCKING") {
        // ❌ 아무런 양보(yield) 없음. 메인 스레드를 완전히 점유합니다.
        // 루프가 끝날 때까지 브라우저는 렌더링, 클릭, 애니메이션을 모두 멈춥니다.
      } else if (mode === "EVERY") {
        await yieldNow(); // 매 루프 양보 (안전하지만 매우 느림)
      } else if (mode === "TIME") {
        if (performance.now() - lastYieldTime > 10) {
          await yieldNow();
          lastYieldTime = performance.now();
          this.updateProgress(i, totalSize);
        }
      } else if (mode === "PERCENT") {
        if (i > 0 && i % chunk8Percent === 0) {
          await yieldNow(); // 8% 구간 양보 (최적의 속도)
          this.updateProgress(i, totalSize);
        }
      }
    }

    if (this.onProgress) this.onProgress(100);
    return { time: performance.now() - start };
  }

  updateProgress(i, totalSize) {
    if (this.onProgress) {
      this.onProgress(Math.floor((i / totalSize) * 100));
    }
  }
}

export default function App() {
  const [tick, setTick] = useState(0);
  const [results, setResults] = useState({
    BLOCKING: { progress: 0, time: 0, isRunning: false },
    EVERY: { progress: 0, time: 0, isRunning: false },
    TIME: { progress: 0, time: 0, isRunning: false },
    PERCENT: { progress: 0, time: 0, isRunning: false },
  });

  const viewModel = useMemo(() => new RowDataViewModel(), []);

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

    // BLOCKING 모드는 비동기가 아니지만 인터페이스를 위해 await 사용
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
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1>🏗️ 2025 ViewModel 성능 연구소</h1>
        <div style={tickBoxStyle}>
          실시간 렌더링 틱: {tick.toLocaleString()}
        </div>
        <p style={{ color: "#d32f2f", fontWeight: "bold" }}>
          ⚠️ BLOCKING 모드 실행 시 틱 숫자가 완전히 멈춥니다!
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "15px",
        }}
      >
        <ModeCard
          title="❌ 블로킹"
          desc="양보 없음. 화면이 완전히 프리징됩니다."
          result={results.BLOCKING}
          onRun={() => runTest("BLOCKING")}
          color="#212121"
        />
        <ModeCard
          title="매번 체크"
          desc="매 루프 yield. 가장 느림."
          result={results.EVERY}
          onRun={() => runTest("EVERY")}
          color="#ff4444"
        />
        <ModeCard
          title="10ms 예산"
          desc="시간 측정 기반. 기기 맞춤형."
          result={results.TIME}
          onRun={() => runTest("TIME")}
          color="#ffbb33"
        />
        <ModeCard
          title="8% 퍼센트"
          desc="최고 효율의 퍼센트 데미지."
          result={results.PERCENT}
          onRun={() => runTest("PERCENT")}
          color="#00C851"
        />
      </div>
    </div>
  );
}

function ModeCard({ title, desc, result, onRun, color }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 10px 0" }}>{title}</h3>
      <p style={{ fontSize: "12px", color: "#777", height: "40px" }}>{desc}</p>
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
  padding: "15px",
  borderRadius: "15px",
  textAlign: "center",
  background: "#fff",
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
});
const progressBg = {
  background: "#eee",
  width: "100%",
  height: "10px",
  borderRadius: "5px",
  overflow: "hidden",
  marginTop: "10px",
};
const progressFill = (width, color) => ({
  width: `${width}%`,
  height: "100%",
  background: color,
  transition: "width 0.3s ease",
});
