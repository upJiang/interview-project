// DOM 元素
const numberInput = document.getElementById("number");
const calcMainButton = document.getElementById("calc-main");
const calcWorkerButton = document.getElementById("calc-worker");
const resultValue = document.getElementById("result-value");
const calculationTime = document.getElementById("calculation-time");
const testUiButton = document.getElementById("test-ui");
const clickCounter = document.getElementById("click-counter");

// 点击计数器
let clicks = 0;
testUiButton.addEventListener("click", () => {
  clicks++;
  clickCounter.textContent = `点击次数: ${clicks}`;
});

// 主线程计算斐波那契数列
calcMainButton.addEventListener("click", () => {
  const n = parseInt(numberInput.value);

  // 验证输入
  if (isNaN(n) || n <= 0) {
    alert("请输入一个正整数");
    return;
  }

  resultValue.textContent = "计算中...";
  calculationTime.textContent = "计算中...";

  // 延迟执行以允许UI更新
  setTimeout(() => {
    const startTime = performance.now();

    // 在主线程上执行计算
    const result = fibonacci(n);

    const endTime = performance.now();
    const timeTaken = endTime - startTime;

    // 更新结果
    resultValue.textContent = result;
    calculationTime.textContent = `${timeTaken.toFixed(2)} ms`;
  }, 50);
});

// Web Worker 计算斐波那契数列
calcWorkerButton.addEventListener("click", () => {
  const n = parseInt(numberInput.value);

  // 验证输入
  if (isNaN(n) || n <= 0) {
    alert("请输入一个正整数");
    return;
  }

  resultValue.textContent = "计算中...";
  calculationTime.textContent = "计算中...";

  const startTime = performance.now();

  // 创建 Web Worker
  const worker = new Worker("worker.js");

  // 发送数据到 Worker
  worker.postMessage({ number: n });

  // 接收 Worker 的计算结果
  worker.onmessage = function (e) {
    const result = e.data.result;
    const endTime = performance.now();
    const timeTaken = endTime - startTime;

    // 更新结果
    resultValue.textContent = result;
    calculationTime.textContent = `${timeTaken.toFixed(2)} ms`;

    // 终止 Worker
    worker.terminate();
  };

  // 处理 Worker 错误
  worker.onerror = function (error) {
    console.error("Worker 错误:", error);
    resultValue.textContent = "计算出错";
    calculationTime.textContent = "-";

    // 终止 Worker
    worker.terminate();
  };
});

// 斐波那契数列计算函数 (递归实现，低效但便于演示)
function fibonacci(n) {
  // 使用递归实现，效率低但可以明显看出耗时差异
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
