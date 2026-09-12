import React, { useEffect, useState, useRef, useMemo } from "react";

// // --- 1. 유틸리티: 타임 슬라이서 (2025 표준) ---
// const createTimeSlicer = (budget = 10) => {
//   let lastYieldTime = performance.now();
//   const yieldToMain = () => {
//     if (globalThis.scheduler?.yield) return scheduler.yield();
//     if (globalThis.MessageChannel) {
//       return new Promise((r) => {
//         const { port1, port2 } = new MessageChannel();
//         port1.onmessage = r;
//         port2.postMessage(null);
//       });
//     }
//     return new Promise((r) => setTimeout(r, 0));
//   };

//   return {
//     async check() {
//       if (performance.now() - lastYieldTime > budget) {
//         await yieldToMain();
//         lastYieldTime = performance.now();
//         return true;
//       }
//       return false;
//     },
//   };
// };

const createTimeSlicer = (budget = 10) => {
  let lastYieldTime = performance.now();

  // 내부에서만 쓰이는 실제 양보 함수
  const yieldToMain = () => {
    if (globalThis.scheduler?.yield) return scheduler.yield();
    if (globalThis.MessageChannel) {
      return new Promise((r) => {
        const { port1, port2 } = new MessageChannel();
        port1.onmessage = r;
        port2.postMessage(null);
      });
    }
    return new Promise((r) => setTimeout(r, 0));
  };

  return {
    // 💡 async를 제거하고 일반 함수로 만듭니다.
    check() {
      if (performance.now() - lastYieldTime > budget) {
        // 시간이 초과되었을 때만 Promise(비동기)를 반환합니다.
        return yieldToMain().then(() => {
          lastYieldTime = performance.now();
          return true;
        });
      }
      // 시간 내라면 'false'(값)를 즉시 반환하여 루프를 멈추지 않습니다.
      return false;
    },
  };
};

// --- 2. 뷰모델: 데이터 준비 로직 (비즈니스 로직 분리) ---
class DataViewModel {
  constructor() {
    this.data = [];
    this.isReady = false;
    this.onProgress = null; // 콜백으로 진행률 전달
  }

  async prepare(totalSize) {
    this.data = [];

    // 8% 구간(데미지) 미리 계산 (예: 3,000만 기준 240만 건)
    const chunkUnit = Math.floor(totalSize * 0.08);

    const yieldNow = () => {
      if (globalThis.scheduler?.yield) return scheduler.yield();
      return new Promise((r) => {
        const { port1, port2 } = new MessageChannel();
        port1.onmessage = r;
        port2.postMessage(null);
      });
    };

    for (let i = 0; i <= totalSize; i++) {
      this.data.push(i);

      // 🔍 8% 퍼센트 구간마다 쿨타임(Yield) 적용
      if (i > 0 && i % chunkUnit === 0) {
        // 1. UI 갱신 (프로그레스 바 8, 16, 24...)
        if (this.onProgress) {
          this.onProgress(Math.floor((i / totalSize) * 100));
        }

        // 2. 메인 스레드 양보 (렌더링 틱 확보)
        // 여기서 렌더링 스피너가 "휙"하고 돌아갑니다.
        await yieldNow();
      }
    }

    if (this.onProgress) this.onProgress(100);
    return this.data;
  }
}

// --- 3. 메인 뷰 컴포넌트 ---
function MainView({ data }) {
  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #4caf50",
        borderRadius: "10px",
      }}
    >
      <h2>✅ MainView 마운트 완료</h2>
      <p>
        총 {data.length.toLocaleString()} 개의 데이터가 뷰모델에 준비되었습니다.
      </p>
      <div
        style={{
          maxHeight: "200px",
          overflowY: "auto",
          background: "#f0f0f0",
          padding: "10px",
        }}
      >
        {/* 샘플로 일부 데이터만 출력 */}
        {data.slice(-10).map((v) => (
          <div key={v}>데이터 항목 #{v} 준비됨</div>
        ))}
      </div>
      <button
        onClick={() => alert("UI가 살아있습니다!")}
        style={{ marginTop: "10px" }}
      >
        클릭 반응 확인
      </button>
    </div>
  );
}

// --- 4. 루트 앱 컴포넌트 ---
export default function App() {
  const [tick, setTick] = useState(0);
  const [progress, setProgress] = useState(0);
  const [readyData, setReadyData] = useState(null);
  const viewModel = useMemo(() => new DataViewModel(), []);

  // 1. 렌더링 생존 확인용 (RAF)
  useEffect(() => {
    let raf;
    const loop = () => {
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 2. 리액트 마운트 전(혹은 초기 단계) 뷰모델 준비
  useEffect(() => {
    viewModel.onProgress = (p) => setProgress(p);

    // 3천만건의 헤비 태스크 시작
    viewModel.prepare(30_000_000).then((data) => {
      setReadyData(data);
    });
  }, [viewModel]);

  return (
    <div
      style={{ fontFamily: "sans-serif", padding: "30px", lineHeight: "1.6" }}
    >
      <h1>ViewModel Time-Slicing 데모</h1>

      <div
        style={{ marginBottom: "20px", padding: "10px", background: "#e3f2fd" }}
      >
        <div style={{ fontSize: "20px" }}>
          렌더링 틱: <strong style={{ color: "#1976d2" }}>{tick}</strong>
        </div>
        <p style={{ fontSize: "14px", color: "#666" }}>
          (팁: 타임 슬라이싱 덕분에 위 숫자가 멈추지 않고 올라갑니다.)
        </p>
      </div>

      {!readyData ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div
            className="spinner"
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3>뷰모델 준비 중... {progress}%</h3>
          <p>무거운 연산 중에도 스피너가 끊김 없이 돌아갑니다.</p>
        </div>
      ) : (
        <MainView data={readyData} />
      )}
    </div>
  );
}
