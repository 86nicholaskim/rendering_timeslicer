# 📂 src 디렉토리 구조 및 핵심 소스 안내

이 디렉토리는 **Long Task & Timesliced Rendering Lab**의 핵심 연산 로직과 UI 컴포넌트를 담고 있습니다.  
무거운 데이터 처리 중 브라우저 UI 멈춤(Freezing) 현상을 방지하기 위한 **타임슬라이싱(Time-Slicing)** 기법 및 기기/서버 Config별 동적 예산 제어 벤치마크 코드로 구성되어 있습니다.

---

## 🏗️ 폴더 및 핵심 파일 설명

### 1. `types/` (타입 및 이넘 정의)
* 📄 **[timeslicer.ts](file:///c:/myLec/rendering_timeslicer/src/types/timeslicer.ts)**
  * **`BudgetPreset` Enum**: 자바스크립트 실행 시간 예산 프리셋을 이넘으로 관리합니다.
    * `LOW_SPEC = 5` (5ms - 저사양 기기 / UI 반응성 최우선)
    * `BALANCED = 10` (10ms - 표준 균형 권장값)
    * `HIGH_PERF = 16.6` (16.6ms - 고사양 기기 / 60fps 1프레임 budget)
    * `HEAVY_JOB = 33.3` (33.3ms - 연산 우선 / 30fps budget)
    * `LONG_TASK_MAX = 50` (50ms - Long Task 임계 한계점)
  * **`DeviceTier` Enum**: 기기 사양 등급 이넘 (`LOW`, `BALANCED`, `HIGH`)
  * **`TimeslicerConfig`**: 동적 설정(예산 시간 ms, 청크 비율 %, 설정 소스) 인터페이스

---

### 2. `context/` (글로벌 Config 관리)
* 📄 **[TimeslicerConfigContext.tsx](file:///c:/myLec/rendering_timeslicer/src/context/TimeslicerConfigContext.tsx)**
  * **역할**: 서버 Config 수신 또는 기기 사양에 따라 유연하게 변경되는 `BudgetPreset` 시간 예산을 전체 애플리케이션에 공유하는 React Context & Provider입니다.
  * **제공 메서드**: `setBudgetPreset()`, `applyAutoDeviceDetection()`, `updateConfig()`

---

### 3. `utils/` (핵심 비동기 및 기기 감지 로직)
웹 브라우저 메인 스레드에 제어권을 양보(Yield)하거나 기기 사양을 감지하는 유틸리티 모듈입니다.

* 📄 **[deviceDetector.ts](file:///c:/myLec/rendering_timeslicer/src/utils/deviceDetector.ts)**
  * **역할**: 브라우저 하드웨어 API (`hardwareConcurrency`, `deviceMemory`)를 탐색하여 현재 기기 사양 등급(`DeviceTier`)과 권장 `BudgetPreset`을 자동으로 측정·반환합니다.
* 📄 **[yield.ts](file:///c:/myLec/rendering_timeslicer/src/utils/yield.ts)**
  * **역할**: 연산 중 메인 스레드로 제어권을 잠시 넘겨(yield) 화면 렌더링 및 이벤트를 처리합니다.
  * **작동 순서**: `scheduler.yield()` (최신 API) ➔ `MessageChannel` (매크로타스크) ➔ `setTimeout(0)` (폴백)
* 📄 **[timeSlicer.ts](file:///c:/myLec/rendering_timeslicer/src/utils/timeSlicer.ts)**
  * **역할**: 설정된 `BudgetPreset` 예산 시간마다 주기적으로 `yieldNow()`를 호출하여 메인 스레드 지연을 방지하는 타임슬라이서 도구입니다.
* 📄 **[promiseGate.ts](file:///c:/myLec/rendering_timeslicer/src/utils/promiseGate.ts)**
  * **역할**: 비동기 루프 실행을 중간에 수동으로 일시정지(`wait`)시켰다가 원할 때 재개(`open`)할 수 있는 게이트 컨트롤러입니다.

---

### 4. `viewmodels/` (비즈니스 연산 로직)
대용량 데이터 가공 및 타임슬라이싱 테스트 실행 로직이 포함되어 있습니다.

* 📄 **[RowDataViewModel.ts](file:///c:/myLec/rendering_timeslicer/src/viewmodels/RowDataViewModel.ts)**
  * **역할**: 1,000만 건 대용량 행 데이터를 가공하면서 `TimeslicerConfig`에 설정된 동적 예산 시간을 적용하여 성능을 측정합니다.
  * **4가지 실행 모드**:
    1. `BLOCKING`: 양보 없이 순수 동기 연산 (UI 완전히 멈춤)
    2. `EVERY`: 매 턴마다 양보 (안전하지만 스위칭 오버헤드로 처리속도 느림)
    3. `TIME`: `BudgetPreset` 예산 시간(5ms/10ms/16.6ms 등) 초과 시 양보 (유연한 표준 타임슬라이싱)
    4. `PERCENT`: 8% 청크 분할 시 양보 (연산 속도 우수 및 적절한 반응성)

---

### 5. `components/` (UI 컴포넌트)
* 📄 **[ConfigControlPanel.tsx](file:///c:/myLec/rendering_timeslicer/src/components/ConfigControlPanel.tsx)**: `BudgetPreset` Enum 선택 및 자동 기기 감지 적용 UI 컴포넌트
* 📄 **[PerformanceLab.tsx](file:///c:/myLec/rendering_timeslicer/src/components/PerformanceLab.tsx)**: 전체 벤치마크 테스트 대시보드 메인 페이지 (`TimeslicerConfigProvider` 연동)
* 📄 **[ModeCard.tsx](file:///c:/myLec/rendering_timeslicer/src/components/ModeCard.tsx)**: 모드별 테스트 카드
* 📄 **[RenderTickMonitor.tsx](file:///c:/myLec/rendering_timeslicer/src/components/RenderTickMonitor.tsx)**: 실시간 렌더링 프레임 틱 모니터링

---

### 6. 진입점 (Entry Point)
* 📄 **[main.tsx](file:///c:/myLec/rendering_timeslicer/src/main.tsx)**: React 루트 앱 렌더링 파일
