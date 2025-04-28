// Web Worker 中的计算处理

// 监听主线程消息
self.addEventListener("message", function (e) {
  console.log("Worker 收到消息:", e.data);

  if (e.data.number !== undefined) {
    const number = e.data.number;

    try {
      // 执行计算
      const result = fibonacci(number);

      // 将结果发送回主线程
      self.postMessage({
        result: result,
      });
    } catch (error) {
      console.error("Worker 计算错误:", error);
      self.postMessage({
        error: error.message,
      });
    }
  }
});

// 斐波那契数列计算函数
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 在 Worker 启动时向主线程发送通知
self.postMessage({ status: "Worker 已启动" });
