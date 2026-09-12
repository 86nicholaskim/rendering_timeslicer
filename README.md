# ⚡ Long Task & Rendering Chunking Testing Lab

이 레포지토리는 브라우저의 메인 스레드를 차단하는 **롱태스크(Long Task)** 현상을 방지하기 위해, 대규모 데이터 및 무거운 UI 렌더링을 여러 청크(Chunk)로 분할하는 다양한 **렌더링 분할 기술을 테스트하고 성능을 비교**하는 실험실입니다.

## 🚀 프로젝트 목적

- **롱태스크 탐지**: 50ms 이상 메인 스레드를 점유하는 CPU 집약적 렌더링 작업 확인
- **UX 개선**: 화면 얼어붙음(Freeze) 현상을 해결하여 INP(Interaction to Next Paint) 및 TBT(Total Blocking Time) 지표 개선
- **기법별 비교**: 동기식 렌더링과 다양한 비동기 분할 렌더링 기법의 성능 측정 및 분석

---

## 🛠️ 테스트 및 비교 기술

대량의 DOM 노드(예: 10,000개 이상의 리스트 아이템)를 생성할 때 아래 기법들을 적용하여 비교합니다.

1. **Synchronous Rendering (Baseline)**
   - 분할 없이 한 번에 모든 데이터를 렌더링하여 의도적으로 롱태스크를 유발합니다.
2. **`setTimeout` / `setInterval`**
   - 매크로태스크 큐(Macrotask Queue)를 이용해 브라우저에게 렌더링 양보(Yielding)를 수행합니다.
3. **`requestAnimationFrame` (rAF)**
   - 브라우저의 프레임 업데이트 주기(60Hz 기준 약 16.7ms)에 맞춰 렌더링을 최적화하여 분할합니다.
4. **`requestIdleCallback` (rIC)**
   - 브라우저가 남는 유휴 시간(Idle Time)을 활용해 메인 스레드 부하를 최소화하며 렌더링합니다.
5. **`scheduler.yield()` (Modern Web API)**
   - 최신 스케줄러 API를 활용해 우선순위를 유지하면서도 효율적으로 메인 스레드 제어권을 양보합니다.

---

## 📊 성능 측정 지표 (Performance Metrics)

크롬 개발자 도구(Lighthouse / Performance 탭) 및 `PerformanceObserver` API를 활용하여 다음 지표를 기록합니다.

- **Long Task Count**: 실행 시간 50ms를 초과한 태스크의 총 개수
- **Total Blocking Time (TBT)**: 메인 스레드가 차단된 총 시간
- **FPS (Frames Per Second)**: 렌더링 중 화면의 부드러움 정도 (프레임 드롭 여부)
- **Script Execution Time**: 순수 스크립트 실행 및 DOM 반영 완료까지 걸린 시간

---

## 📁 프로젝트 구조

---
