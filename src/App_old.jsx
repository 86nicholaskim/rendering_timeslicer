import { useEffect, useState, useRef } from "react";

const WORK_SIZE = 50_000_000; // 더 확실한 차이를 위해 크기 상향

// 1. 최적화된 타임 슬라이서 유틸리티
const createTimeSlicer = (budget = 5) => {
  let lastYieldTime = performance.now();

  const yieldToMain = () => {
    if (globalThis.scheduler?.yield) return scheduler.yield();
    if (globalThis.MessageChannel) {
      return new Promise((resolve) => {
        const { port1, port2 } = new MessageChannel();
        port1.onmessage = resolve;
        port2.postMessage(null);
      });
    }
    return new Promise((resolve) => setTimeout(resolve, 0));
  };

  return {
    async check() {
      if (performance.now() - lastYieldTime > budget) {
        await yieldToMain();
        lastYieldTime = performance.now();
        return true;
      }
      return false;
    },
  };
};

export default function App() {
  const [tick, setTick] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [useSlice, setUseSlice] = useState(true);

  // 중단 제어를 위한 Ref
  const abortControllerRef = useRef(null);

  // 🔍 렌더링 확인용 RAF 루프
  useEffect(() => {
    let raf;
    const loop = () => {
      setTick((v) => v + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 🔥 메인 작업 함수
  const startTask = async () => {
    if (isWorking) return; // 이미 실행 중이면 무시

    setIsWorking(true);
    setProgress(0);

    // 이전 작업 취소용 컨트롤러
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    if (!useSlice) {
      // ❌ BLOCKING 모드
      let i = 0;
      while (i < WORK_SIZE) {
        i++;
      }
      setProgress(100);
      setIsWorking(false);
    } else {
      // ✅ TIME SLICE 모드
      const slicer = createTimeSlicer(8); // 8ms 예산
      let i = 0;

      while (i < WORK_SIZE) {
        if (signal.aborted) return; // 중단 체크

        i++;

        // 성능을 위해 1만 번마다 한 번씩만 시간을 체크하고 필요시 양보
        if (i % 10000 === 0) {
          await slicer.check();
          // 진행률 업데이트 (UI 업데이트 유도)
          setProgress(Math.floor((i / WORK_SIZE) * 100));
        }
      }

      setProgress(100);
      setIsWorking(false);
    }
  };

  const stopTask = () => {
    abortControllerRef.current?.abort();
    setIsWorking(false);
    setProgress(0);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Time Slicing Control (2025)</h1>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => setUseSlice(!useSlice)}
          style={{ background: useSlice ? "#e1f5fe" : "#ffebee" }}
        >
          모드: {useSlice ? "타임슬라이스" : "블로킹"}
        </button>

        {!isWorking ? (
          <button onClick={startTask} style={{ fontWeight: "bold" }}>
            작업 시작 ▶️
          </button>
        ) : (
          <button onClick={stopTask} style={{ color: "red" }}>
            중단 ⏹️
          </button>
        )}
      </div>

      <div
        style={{
          background: "#eee",
          width: "100%",
          height: "20px",
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#4caf50",
            borderRadius: "10px",
            transition: "width 0.1s",
          }}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        <div>
          렌더링 틱 (멈추면 프리징): <strong>{tick}</strong>
        </div>
        <div>진행률: {progress}%</div>
      </div>

      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        * 블로킹 모드에서는 시작 버튼을 누르는 순간 틱이 멈추고 버튼도 클릭되지
        않습니다.
        <br />* 타임슬라이스 모드에서는 작업 중에도 틱이 계속 올라가며 중단
        버튼도 동작합니다.
      </p>
    </div>
  );
}
