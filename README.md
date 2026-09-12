# ⚡ Long Task & Rendering Chunking Testing Lab (TypeScript)
# ⚡ 롱태스크 및 렌더링 청킹 성능 실험실 (TypeScript)

---

## 🚀 Project Purpose / 프로젝트 목적

**English**  
This repository is a benchmark lab designed to prevent browser **Long Tasks** (> 50ms main thread blocking) during heavy data processing. It breaks heavy computation into asynchronous time-slices to preserve UI responsiveness, high FPS, and improve Core Web Vitals such as **INP** (Interaction to Next Paint) and **TBT** (Total Blocking Time).

**한국어**  
이 레포지토리는 대규모 데이터 가공 중 발생하는 브라우저 **롱태스크(Long Task)**(50ms 이상 메인 스레드 점유) 현상을 방지하기 위한 성능 비교 실험실입니다. 무거운 연산을 비동기 타임슬라이스(Time-slice)로 분할하여 UI 반응성 및 고프레임을 유지하고 **INP** 및 **TBT** 지표를 개선합니다.

---

## 📚 Documentation / 상세 문서

**English & 한국어**  
- 📐 [doc/architecture.md](file:///c:/myLec/rendering_timeslicer/doc/architecture.md): Technical architecture, `yieldNow()` implementation details, and module design. / 타임슬라이싱 시스템 설계, `yieldNow()` 유틸리티 구현 상세 및 모듈 구조
- 🧪 [doc/benchmark-guide.md](file:///c:/myLec/rendering_timeslicer/doc/benchmark-guide.md): 4 benchmark mode comparison and Chrome DevTools profiling guide. / 4가지 테스트 모드 비교 및 크롬 개발자 도구 성능 측정 가이드

---

## 🛠️ Benchmark Strategies in Code / 소스코드 기반 4가지 테스트 전략

**English**  
Based on [RowDataViewModel.ts](file:///c:/myLec/rendering_timeslicer/src/viewmodels/RowDataViewModel.ts), tests process `10,000,000` items (`WORK_SIZE`) under 4 strategy modes:
1. **`BLOCKING` (동기)**: Pure synchronous `for` loop with no yielding. Causes full main thread freeze (`RenderTickMonitor` halts).
2. **`EVERY` (매 루프 양보)**: Calls `yieldNow()` on every iteration. 100% UI safety, but highest context switching overhead.
3. **`TIME` (시간 예산 - 10ms)**: Calls `yieldNow()` when execution time exceeds `timeBudgetMs` (default `10ms`). Adaptive & standard recommendation.
4. **`PERCENT` (청크 분할 - 8%)**: Calls `yieldNow()` every `percentChunk` interval (default `8%` = every `800,000` items). Lowest yielding overhead with maximum processing throughput.

**한국어**  
[RowDataViewModel.ts](file:///c:/myLec/rendering_timeslicer/src/viewmodels/RowDataViewModel.ts) 구현을 기반으로 `10,000,000`건(`WORK_SIZE`)의 데이터를 아래 4가지 모드로 처리합니다:
1. **`BLOCKING` (동기)**: 양보 없이 순수 동기 `for` 루프 실행. 메인 스레드가 완전히 멈춤 (`RenderTickMonitor` 카운터 정지).
2. **`EVERY` (매 루프 양보)**: 매 루프마다 `yieldNow()` 호출. UI는 완벽히 안전하나 컨텍스트 스위칭 오버헤드가 가장 큼.
3. **`TIME` (시간 예산 - 10ms)**: 연산 시간이 `timeBudgetMs`(기본 `10ms`)를 초과할 때 `yieldNow()` 호출. 기기 맞춤형 표준 권장 방식.
4. **`PERCENT` (청크 분할 - 8%)**: `percentChunk`(기본 `8%` = `800,000`건 마다) 구간별로 `yieldNow()` 호출. 최소한의 양보 횟수로 최고의 연산 속도 기록.

---

## 📁 Source Code Directory Structure / 소스코드 디렉토리 구조

```text
rendering_timeslicer/
├── doc/
│   ├── architecture.md         # Technical Architecture & Code Specification (한영 병기)
│   └── benchmark-guide.md      # Performance Profiling & Benchmark Guide (한영 병기)
├── index.html                  # HTML Entry point -> /src/main.tsx
├── package.json                # Dependencies, type-check & build scripts
├── tsconfig.json               # TypeScript Compiler Configuration
├── tsconfig.node.json          # Vite Node Configuration
├── vite.config.ts              # Vite Config with @vitejs/plugin-react
└── src/
    ├── main.tsx                # Entrypoint rendering <App /> in StrictMode
    ├── App.tsx                 # Root component rendering <PerformanceLab />
    ├── types/
    │   └── timeslicer.ts       # TestMode, ModeResult, RowItem, ModernScheduler interfaces
    ├── utils/
    │   ├── yield.ts            # yieldNow() with scheduler.yield / MessageChannel / setTimeout
    │   ├── timeSlicer.ts       # createTimeSlicer(budgetInMs) utility
    │   └── promiseGate.ts      # createPromiseGate() utility
    ├── viewmodels/
    │   └── RowDataViewModel.ts # Data generator & time-slicing prepare() method
    └── components/
        ├── RenderTickMonitor.tsx # RAF-based tick counter showing live main-thread status
        ├── ModeCard.tsx          # Reusable UI card displaying title, progress & duration
        └── PerformanceLab.tsx    # Dashboard UI orchestrating 4-mode benchmark tests
```

---

## 💻 How to Run / 실행 방법

```bash
# Install dependencies / 의존성 설치
pnpm install # or npm install

# Start development server / 개발 서버 실행
pnpm dev # or npm run dev

# Run TypeScript type checking / 타입 검사
pnpm run type-check # or npm run type-check

# Build production bundle / 프로덕션 빌드
pnpm build # or npm run build
```
