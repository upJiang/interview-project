/**
 * 节流函数 (Throttle)
 *
 * 作用：对于频繁触发的事件，在一定时间内只执行一次。
 * 应用场景：滚动事件处理、游戏中的按键响应、页面缩放等。
 *
 * @param {Function} fn - 需要节流的函数
 * @param {Number} wait - 等待时间(毫秒)
 * @param {Object} options - 配置选项
 * @param {Boolean} options.leading - 是否在开始时立即执行
 * @param {Boolean} options.trailing - 是否在结束时再执行一次
 * @return {Function} - 返回节流后的函数
 */
function throttle(fn, wait = 300, options = {}) {
  // 设置默认选项：默认开头执行且结尾也执行
  const defaultOptions = {
    leading: true, // 是否在开始时执行一次
    trailing: true, // 是否在结束时再执行一次
  };
  const opts = { ...defaultOptions, ...options };

  // 上一次执行的时间戳
  let lastExecTime = 0;
  // 定时器引用
  let timer = null;
  // 保存调用时的参数和上下文，用于trailing执行
  let context = null;
  let args = null;

  // 返回节流函数
  return function (...params) {
    // 保存当前函数调用的上下文和参数
    context = this;
    args = params;

    // 获取当前时间戳
    const now = Date.now();

    // 如果没有上次执行时间，且不需要leading执行，则设置上次执行时间为当前时间
    if (lastExecTime === 0 && opts.leading === false) {
      lastExecTime = now;
    }

    // 计算剩余等待时间
    const remaining = wait - (now - lastExecTime);

    // 如果没有剩余时间或者已经超过等待时间，可以执行函数
    if (remaining <= 0) {
      // 如果有计时器，清除它
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      // 执行函数
      fn.apply(context, args);
      // 更新上次执行时间
      lastExecTime = now;
      // 函数已执行，清空上下文和参数
      context = args = null;
    } else if (!timer && opts.trailing) {
      // 如果没有计时器，且需要trailing执行，则设置新的计时器
      timer = setTimeout(() => {
        // 如果leading为false，则第一次不执行时，更新lastExecTime为0
        lastExecTime = opts.leading === false ? 0 : Date.now();

        // 清除计时器
        timer = null;

        // 执行函数
        fn.apply(context, args);
        // 清空上下文和参数
        context = args = null;
      }, remaining);
    }
  };
}

// 带取消功能的节流函数
function throttleWithCancel(fn, wait = 300, options = {}) {
  const defaultOptions = {
    leading: true,
    trailing: true,
  };
  const opts = { ...defaultOptions, ...options };

  let lastExecTime = 0;
  let timer = null;
  let context = null;
  let args = null;

  // 定义节流包装函数
  function throttled(...params) {
    context = this;
    args = params;

    const now = Date.now();

    if (lastExecTime === 0 && opts.leading === false) {
      lastExecTime = now;
    }

    const remaining = wait - (now - lastExecTime);

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      fn.apply(context, args);
      lastExecTime = now;
      context = args = null;
    } else if (!timer && opts.trailing) {
      timer = setTimeout(() => {
        lastExecTime = opts.leading === false ? 0 : Date.now();
        timer = null;
        fn.apply(context, args);
        context = args = null;
      }, remaining);
    }
  }

  // 添加取消方法
  throttled.cancel = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastExecTime = 0;
    context = args = null;
  };

  return throttled;
}

// 时间戳实现的简单节流（开始时立即执行版本）
function throttleByTimestamp(fn, wait) {
  let lastExecTime = 0;

  return function (...args) {
    const now = Date.now();

    // 如果距离上次执行超过等待时间，才允许执行
    if (now - lastExecTime >= wait) {
      fn.apply(this, args);
      lastExecTime = now;
    }
  };
}

// 定时器实现的简单节流（结束时执行版本）
function throttleByTimer(fn, wait) {
  let timer = null;

  return function (...args) {
    // 如果没有定时器，才创建一个
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        fn.apply(this, args);
      }, wait);
    }
  };
}

// 测试节流函数
function testThrottle() {
  // 创建一个测试函数
  function logPosition(scrollY) {
    console.log(`[${new Date().toLocaleTimeString()}] 滚动位置: ${scrollY}`);
  }

  // 创建节流版本的函数（每500ms最多执行一次）
  const throttledLog = throttle(logPosition, 500);

  console.log("开始测试节流函数(模拟快速滚动):");

  // 模拟10次快速滚动，每50ms一次
  let i = 0;
  const scrollInterval = setInterval(() => {
    const scrollY = i * 100;
    console.log(`触发滚动事件 ${i + 1}，位置: ${scrollY}`);
    throttledLog(scrollY);

    i++;
    if (i >= 10) {
      clearInterval(scrollInterval);
      console.log("滚动事件触发结束");
    }
  }, 50);

  // 预期结果：在500ms的周期内，只有第一次和最后一次调用会被执行
  console.log("预期: throttledLog大约每500ms执行一次");
}

// 运行测试
testThrottle();

/**
 * 节流函数实现总结：
 *
 * 1. 核心原理：限制函数在一定时间内只能执行一次，与防抖不同的是，防抖是在等待时间后执行，
 *             而节流是保证一定时间内只执行一次。
 *
 * 2. 实现方式：
 *    - 时间戳方式：记录上次执行的时间戳，当前时间距离上次执行时间超过阈值才执行
 *    - 定时器方式：设置一个定时器，定时器存在期间不执行新的操作
 *    - 综合方式：结合时间戳和定时器，实现更精确的控制
 *
 * 3. 关键选项：
 *    - leading: 是否在开始时立即执行一次
 *    - trailing: 是否在结束后再执行一次
 *    上述两个选项不能同时为false，否则函数将永远不会执行
 *
 * 4. 应用场景：
 *    - 滚动事件：避免过多计算导致页面卡顿
 *    - 按钮点击：防止用户快速多次点击
 *    - 搜索联想：控制请求频率
 *
 * 5. 面试要点：
 *    - 理解节流和防抖的区别
 *    - 正确处理this和参数传递
 *    - 实现leading和trailing选项
 *    - 可取消功能的实现
 */

module.exports = {
  throttle,
  throttleWithCancel,
  throttleByTimestamp,
  throttleByTimer,
};
