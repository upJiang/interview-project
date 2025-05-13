/**
 * 请求频率限制演示脚本
 */

document.addEventListener("DOMContentLoaded", () => {
  // 获取DOM元素
  const debounceInput = document.getElementById("debounceInput");
  const debounceResult = document.getElementById("debounceResult");

  const throttleButton = document.getElementById("throttleButton");
  const throttleResult = document.getElementById("throttleResult");

  const queueButton = document.getElementById("queueButton");
  const queueResult = document.getElementById("queueResult");

  const tokenBucketDisplay = document.getElementById("tokenBucketDisplay");
  const consumeTokenButton = document.getElementById("consumeTokenButton");
  const tokenBucketResult = document.getElementById("tokenBucketResult");

  // 初始化计数器
  let throttleCount = 0;
  let debounceCount = 0;
  let normalCount = 0;

  // 初始化时间戳
  let startTime = Date.now();

  //---------------
  // 防抖演示部分
  //---------------

  // 普通输入处理函数（无防抖）
  function handleInput(event) {
    normalCount++;
    const input = event.target.value;
    // 在实际应用中，这里可能会有API调用
    console.log(`普通处理: ${input} (调用次数: ${normalCount})`);
  }

  // 创建防抖函数
  const debouncedHandleInput = debounce(function (event) {
    debounceCount++;
    const input = event.target.value;
    debounceResult.textContent = `防抖后的值: "${input}" (调用次数: ${debounceCount}, 普通函数调用: ${normalCount})`;

    // 重置普通计数，便于演示对比
    normalCount = 0;
  }, 500); // 500ms防抖

  // 添加输入事件监听器
  debounceInput.addEventListener("input", (event) => {
    // 先调用普通处理
    handleInput(event);
    // 再调用防抖处理
    debouncedHandleInput(event);
  });

  //---------------
  // 节流演示部分
  //---------------

  // 普通点击处理函数（无节流）
  function handleClick() {
    const now = Date.now();
    const timeDiff = now - startTime;
    throttleCount++;
    throttleResult.textContent = `点击了 ${throttleCount} 次，普通函数每次都执行\n上次点击到现在: ${timeDiff}ms`;
    startTime = now;
  }

  // 创建节流函数
  const throttledHandleClick = throttle(function () {
    const now = Date.now();
    const timeDiff = now - startTime;
    throttleResult.textContent = `点击被节流处理，普通函数执行了 ${throttleCount} 次，但此函数只执行一次\n上次执行到现在: ${timeDiff}ms`;
    startTime = now;

    // 重置计数，便于演示
    throttleCount = 0;
  }, 1000); // 1000ms节流

  // 添加点击事件监听器
  throttleButton.addEventListener("click", () => {
    // 先调用普通处理
    handleClick();
    // 再调用节流处理
    throttledHandleClick();
  });

  //---------------
  // 请求队列演示部分
  //---------------

  // 创建请求队列实例
  const requestQueue = new RequestQueue(2); // 最多同时处理2个请求

  // 模拟API请求
  function mockApiRequest(id, delay) {
    return () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({ id, data: `Response from request ${id}` });
        }, delay);
      });
  }

  // 请求队列按钮点击事件
  queueButton.addEventListener("click", async () => {
    queueResult.innerHTML = "<p>开始发送5个请求，队列并发数为2...</p>";

    // 清空队列展示区
    const queueDisplay = document.createElement("div");
    queueDisplay.id = "queueDisplay";
    queueResult.appendChild(queueDisplay);

    // 创建5个请求，分别有不同的延迟时间
    const requestPromises = [];

    for (let i = 1; i <= 5; i++) {
      // 添加请求状态显示
      const requestStatus = document.createElement("div");
      requestStatus.id = `request-${i}`;
      requestStatus.textContent = `请求 ${i}: 等待中...`;
      requestStatus.style.padding = "5px";
      requestStatus.style.margin = "5px 0";
      requestStatus.style.backgroundColor = "#f8f9fa";
      requestStatus.style.border = "1px solid #dee2e6";
      requestStatus.style.borderRadius = "4px";
      queueDisplay.appendChild(requestStatus);

      // 添加请求到队列
      const delay = 1000 + Math.random() * 2000; // 1-3秒的随机延迟
      const promise = requestQueue
        .add(mockApiRequest(i, delay), i)
        .then((response) => {
          // 更新请求状态
          const status = document.getElementById(`request-${i}`);
          status.textContent = `请求 ${i}: 完成 (${response.data})`;
          status.style.backgroundColor = "#d4edda";
          status.style.borderColor = "#c3e6cb";
          return response;
        })
        .catch((error) => {
          // 更新请求状态为失败
          const status = document.getElementById(`request-${i}`);
          status.textContent = `请求 ${i}: 失败 (${error.message})`;
          status.style.backgroundColor = "#f8d7da";
          status.style.borderColor = "#f5c6cb";
          throw error;
        });

      requestPromises.push(promise);

      // 在发送请求时更新状态
      const status = document.getElementById(`request-${i}`);

      // 由于请求队列的限制，前两个请求立即处理，其余等待
      if (i <= 2) {
        status.textContent = `请求 ${i}: 处理中... (预计 ${delay}ms)`;
        status.style.backgroundColor = "#fff3cd";
        status.style.borderColor = "#ffeeba";
      }
    }

    // 等待所有请求完成
    try {
      await Promise.all(requestPromises);
      queueResult.innerHTML +=
        '<p style="margin-top:10px;color:#28a745;">所有请求已处理完成！</p>';
    } catch (error) {
      queueResult.innerHTML += `<p style="margin-top:10px;color:#dc3545;">请求过程中出现错误: ${error.message}</p>`;
    }
  });

  //---------------
  // 令牌桶演示部分
  //---------------

  // 创建令牌桶实例
  const tokenBucket = new TokenBucket(5, 1); // 容量5，每秒填充1个令牌

  // 更新令牌桶显示
  function updateTokenBucketDisplay() {
    const tokens = tokenBucket.getTokens();
    const percentage = (tokens / tokenBucket.capacity) * 100;

    tokenBucketDisplay.innerHTML = "";
    const filledPart = document.createElement("div");
    filledPart.style.width = `${percentage}%`;
    filledPart.style.height = "100%";
    filledPart.style.backgroundColor = "#28a745";
    filledPart.style.borderRadius = "4px";
    filledPart.style.transition = "width 0.3s";
    tokenBucketDisplay.appendChild(filledPart);

    tokenBucketResult.textContent = `当前令牌数: ${tokens.toFixed(2)}/${
      tokenBucket.capacity
    }`;
  }

  // 初始显示
  updateTokenBucketDisplay();

  // 设置定期更新显示
  setInterval(updateTokenBucketDisplay, 200); // 每200ms更新一次显示

  // 消耗令牌按钮点击事件
  consumeTokenButton.addEventListener("click", () => {
    const success = tokenBucket.consume(1);

    if (success) {
      tokenBucketResult.textContent = `成功消耗1个令牌，剩余: ${tokenBucket
        .getTokens()
        .toFixed(2)}/${tokenBucket.capacity}`;
      tokenBucketResult.style.color = "#28a745";

      // 模拟API调用
      tokenBucketResult.textContent += " - API调用成功";
    } else {
      tokenBucketResult.textContent = `令牌不足，请求被限流！请等待令牌填充。`;
      tokenBucketResult.style.color = "#dc3545";
    }

    // 更新显示
    updateTokenBucketDisplay();
  });
});

/**
 * 防抖函数
 * @param {Function} func 需要防抖的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 防抖处理后的函数
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func 需要节流的函数
 * @param {number} limit 时间间隔限制（毫秒）
 * @returns {Function} 节流处理后的函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 请求队列类
 */
class RequestQueue {
  constructor(concurrency = 2) {
    this.queue = [];
    this.pendingCount = 0;
    this.concurrency = concurrency;
  }

  // 添加请求到队列
  add(requestPromise, id) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestPromise,
        id,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  // 处理队列
  processQueue() {
    if (this.pendingCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const { requestPromise, id, resolve, reject } = this.queue.shift();
    this.pendingCount++;

    console.log(`开始处理请求: ${id}`);
    const status = document.getElementById(`request-${id}`);
    if (status) {
      status.textContent = `请求 ${id}: 处理中...`;
      status.style.backgroundColor = "#fff3cd";
      status.style.borderColor = "#ffeeba";
    }

    requestPromise()
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      })
      .finally(() => {
        this.pendingCount--;
        this.processQueue();
      });
  }
}

/**
 * 令牌桶类
 */
class TokenBucket {
  constructor(capacity, fillRate) {
    this.capacity = capacity; // 桶容量
    this.tokens = capacity; // 初始令牌数
    this.fillRate = fillRate; // 填充速率 (令牌/秒)
    this.lastFillTime = Date.now(); // 上次填充时间
  }

  // 填充令牌
  refill() {
    const now = Date.now();
    const elapsedTime = (now - this.lastFillTime) / 1000; // 转换为秒
    const newTokens = elapsedTime * this.fillRate;

    if (newTokens > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + newTokens);
      this.lastFillTime = now;
    }
  }

  // 尝试消耗令牌
  consume(count = 1) {
    this.refill();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }

    return false;
  }

  // 获取当前令牌数
  getTokens() {
    this.refill();
    return this.tokens;
  }
}
 