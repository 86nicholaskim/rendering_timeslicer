# 🧪 Benchmark & Performance Measurement Guide
# 🧪 벤치마크 및 성능 측정 가이드

---

## 📊 4 Benchmark Modes in PerformanceLab / PerformanceLab의 4가지 벤치마크 모드

**English**  
[PerformanceLab.tsx](file:///c:/myLec/rendering_timeslicer/src/components/PerformanceLab.tsx) executes benchmarks over `10,000,000` items (`WORK_SIZE`). The table below outlines the 4 test modes implemented in [RowDataViewModel.ts](file:///c:/myLec/rendering_timeslicer/src/viewmodels/RowDataViewModel.ts):

**한국어**  
[PerformanceLab.tsx](file:///c:/myLec/rendering_timeslicer/src/components/PerformanceLab.tsx)는 `10,000,000`건(`WORK_SIZE`)의 데이터를 대상으로 벤치마크를 수행합니다. 아래 표는 [RowDataViewModel.ts](file:///c:/myLec/rendering_timeslicer/src/viewmodels/RowDataViewModel.ts)에 구현된 4가지 모드를 명세합니다:

| UI Title / UI 표시 제목 | TestMode | Code Strategy / 소스코드 제어 방식 | UI Responsiveness / UI 반응성 | Execution Speed / 연산 속도 |
| :--- | :--- | :--- | :--- | :--- |
| **❌ 동기 (Blocking)** | `'BLOCKING'` | Synchronous `for` loop, zero `yieldNow()` / 양보 없음 | 🔴 Completely frozen (`RenderTickMonitor` halts) / 완전 멈춤 | 🟢 Fastest execution (No async overhead) / 연산 자체는 가장 빠름 |
| **매 루프 양보 (Every)** | `'EVERY'` | Calls `await yieldNow()` on every loop iteration / 매 루프 양보 | 🟢 Extremely smooth / 매우 부드러움 | 🔴 Slowest (High context switching overhead) / 가장 느림 |
| **시간 예산 (Time - 10ms)** | `'TIME'` | Yields when `performance.now() - lastYieldTime > 10` | 🟢 Smooth (10ms < 50ms Long Task threshold) / 부드러움 | 🟡 Balanced & Adaptive / 균형 잡힌 속도 |
| **청크 분할 (Percent - 8%)** | `'PERCENT'` | Yields when `i % (WORK_SIZE * 0.08) === 0` | 🟡 Good (12 yields total) / 12회 분할 양보 | 🟢 High throughput / 빠른 연산 완료 |

---

## 🛠️ Chrome DevTools Profiling Guide / 크롬 개발자 도구 프로파일링 절차

**English**  
To capture main thread blocking times, Long Tasks, and frame rates:

**한국어**  
메인 스레드 차단 시간, Long Task 및 프레임 레이트를 측정하는 상세 절차입니다:

1. **Launch Dev Server / 개발 서버 실행**:
   ```bash
   pnpm dev   # or npm run dev
   ```
2. **Open DevTools Performance Panel / 개발자 도구 열기**:  
   Open `http://localhost:5173` in Chrome, press `F12`, and click the **Performance** tab.  
   크롬에서 `http://localhost:5173` 접속 후 `F12`를 눌러 **Performance (성능)** 탭으로 이동합니다.

3. **Start Profiling / 성능 기록 시작**:  
   Click the **Record (🔴)** button (`Ctrl + E`).  
   기록 버튼(🔴) 또는 `Ctrl + E` 키를 누릅니다.

4. **Trigger Mode Test / 테스트 모드 실행**:  
   Click **테스트 시작** on any mode card (e.g. `❌ 동기 (Blocking)` or `시간 예산 (Time - 10ms)`).  
   원하는 모드의 **테스트 시작** 버튼을 클릭합니다.

5. **Stop & Inspect Metrics / 기록 중단 및 결과 분석**:  
   Click **Stop**. Examine the following panel sections:
   - **Main Thread**: Red hashed triangles flag **Long Tasks** (> 50ms).
   - **Summary Tab**: Shows **Total Blocking Time (TBT)** and Scripting execution time.
   - **FPS Graph**: Green bar graph showing frame stability. Drops to 0 FPS during `BLOCKING` mode.

**한국어**  
   - **Main Thread (메인 스레드)**: 50ms를 초과한 구간에 빨간색 **Long Task** 경고가 표시됩니다.
   - **Summary Tab (요약 탭)**: **Total Blocking Time (TBT)** 및 Scripting 시간 수치를 확인합니다.
   - **FPS Graph**: 60 FPS 유지 여부를 확인합니다. `BLOCKING` 실행 시 0 FPS로 하강합니다.

---

## 💻 Commands / NPM 명령어 목록

```bash
# Start development server / 개발 서버 실행
pnpm dev             # or npm run dev

# Run TypeScript static type check / 타입 검사
pnpm run type-check  # or npm run type-check

# Build production dist / 프로덕션 빌드
pnpm build           # or npm run build

# Preview production build / 프로덕션 빌드 로컬 실행
pnpm preview         # or npm run preview
```
