/**
 * 防抖函数 (Debounce)
 *
 * 作用：对于频繁触发的事件，在指定时间内，只执行最后一次触发的事件。
 * 应用场景：输入框搜索、窗口调整大小、按钮快速点击等。
 *
 * @param {Function} fn - 需要防抖的函数
 * @param {Number} wait - 等待时间(毫秒)
 * @param {Boolean} immediate - 是否立即执行(第一次触发时立刻执行)
 * @return {Function} - 返回防抖后的函数
 */
function debounce(fn, wait = 300, immediate = false) {
  // 定义一个定时器变量，用于存储定时器ID
  let timer = null;

  // 定义一个变量，用于记录是否已经执行过函数（用于immediate模式）
  let hasInvoked = false;

  // 返回一个闭包函数
  return function (...args) {
    // 保存函数执行上下文的this引用
    const context = this;

    // 如果immediate为true且没有执行过函数，立即执行
    if (immediate && !hasInvoked) {
      fn.apply(context, args);
      hasInvoked = true; // 标记为已执行
      return;
    }

    // 如果存在定时器，则清除之前的定时器
    if (timer) {
      clearTimeout(timer);
    }

    // 设置新的定时器，wait毫秒后执行函数
    timer = setTimeout(() => {
      fn.apply(context, args); // 使用保存的上下文和参数执行原函数
      hasInvoked = false; // 执行后重置标记，允许再次immediate执行
    }, wait);
  };
}

// 带取消功能的防抖函数
function debounceWithCancel(fn, wait = 300, immediate = false) {
  let timer = null;
  let hasInvoked = false;

  // 定义防抖包装函数
  function debounced(...args) {
    const context = this;

    if (immediate && !hasInvoked) {
      fn.apply(context, args);
      hasInvoked = true;
      return;
    }

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      fn.apply(context, args);
      hasInvoked = false;
    }, wait);
  }

  // 添加取消方法
  debounced.cancel = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    hasInvoked = false;
  };

  return debounced;
}

// 测试防抖函数
function testDebounce() {
  // 创建一个测试函数
  function logMessage(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  // 创建防抖版本的函数
  const debouncedLog = debounce(logMessage, 1000);

  // 模拟频繁调用
  console.log("开始测试防抖函数(快速连续调用5次):");
  debouncedLog("调用1");
  debouncedLog("调用2");
  debouncedLog("调用3");
  debouncedLog("调用4");
  debouncedLog("调用5");

  // 预期结果：只有最后一次调用会在1秒后执行
  console.log('预期: 1秒后只会看到"调用5"被执行');

  // 测试immediate模式
  console.log("\n测试immediate模式:");
  const immediateLog = debounce(logMessage, 1000, true);

  // 第一次调用会立即执行
  immediateLog("immediate调用1"); // 立即执行

  // 后续连续调用
  setTimeout(() => {
    immediateLog("immediate调用2");
    immediateLog("immediate调用3");
  }, 500);

  // 预期结果：immediate调用1立即执行，而连续的调用会在最后一次调用1秒后执行
}

// 运行测试
testDebounce();

/**
 * 防抖函数实现总结：
 *
 * 1. 核心原理：使用闭包和setTimeout延迟函数执行，在延迟时间内如果再次触发则重置定时器
 *
 * 2. 实现步骤：
 *    - 创建一个闭包，保存定时器变量
 *    - 返回一个函数，该函数会在调用时设置一个新的定时器
 *    - 如果在等待时间内再次调用，则清除之前的定时器并重新设置
 *    - 最终只有最后一次调用会被执行
 *
 * 3. 关键点：
 *    - 使用apply保证this上下文和参数的正确传递
 *    - immediate参数允许第一次调用立即执行
 *    - cancel方法允许手动取消防抖
 *
 * 4. 面试要点：
 *    - 理解闭包在此处的应用
 *    - this指向的处理
 *    - immediate模式的实现
 *    - 取消功能的实现
 */

module.exports = {
  debounce,
  debounceWithCancel,
};
