class ViewModel {
  async prepare(data) {
    const slicer = createTimeSlicer(8); // 8ms 예산

    this.processedData = [];

    for (let i = 0; i < data.length; i++) {
      // 1. 무거운 연산 수행
      const item = this.heavyTransform(data[i]);
      this.processedData.push(item);

      // 2. 중간중간 브라우저에게 제어권 양보
      // 이 덕분에 마운트 전 "초기 로딩 애니메이션"이 멈추지 않습니다.
      await slicer.check();
    }

    this.isReady = true;
  }

  heavyTransform(item) {
    // 복잡한 비즈니스 로직
    return item;
  }
}
