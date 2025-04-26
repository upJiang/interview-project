/**
 * 调度器
 * 
 * 调度器负责根据任务优先级安排任务的执行时机。
 * 这是一个简化版的调度器，实际的React调度器复杂得多。
 */

// 确保全局命名空间存在
window.MiniFiber = window.MiniFiber || {};

// 使用requestIdleCallback的简单polyfill
const requestIdleCallback = 
  window.requestIdleCallback || 
  function(callback) {
    // 简单的polyfill，使用setTimeout模拟
    const start = Date.now();
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
      });
    }, 1);
  };

// 取消调度
const cancelIdleCallback = 
  window.cancelIdleCallback || 
  function(id) {
    clearTimeout(id);
  };

/**
 * 任务优先级
 */
MiniFiber.PRIORITIES = {
  IMMEDIATE: 1, // 同步优先级，立即执行
  USER_BLOCKING: 2, // 用户阻塞优先级，如输入、点击等
  NORMAL: 3, // 正常优先级，如网络请求
  LOW: 4, // 低优先级，如隐藏内容的计算
  IDLE: 5, // 空闲优先级，如分析、预加载等
};

/**
 * 调度任务
 * @param {function} callback - 任务回调函数
 * @param {number} priority - 任务优先级
 * @returns {object} - 任务对象
 */
MiniFiber.scheduleTask = function(callback, priority = MiniFiber.PRIORITIES.NORMAL) {
  const task = {
    id: requestIdleCallback((deadline) => {
      // 执行任务
      callback(deadline);
    }),
    priority,
    callback,
  };
  
  return task;
};

/**
 * 取消任务
 * @param {object} task - 要取消的任务
 */
MiniFiber.cancelTask = function(task) {
  cancelIdleCallback(task.id);
};