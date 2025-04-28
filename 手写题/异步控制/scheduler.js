/**
 * 任务调度器 (Task Scheduler)
 *
 * 作用：管理和调度任务的执行，控制任务执行的时机和方式。
 * 应用场景：异步任务管理、控制任务执行频率、任务优先级处理等。
 */

/**
 * 基础任务调度器
 * 实现并发控制和任务执行顺序管理
 */
class Scheduler {
  /**
   * 创建一个任务调度器
   * @param {Number} maxConcurrent - 最大并发数
   */
  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent; // 最大并发数
    this.running = 0; // 当前正在运行的任务数
    this.queue = []; // 等待执行的任务队列
  }

  /**
   * 添加任务到调度器
   * @param {Function} task - 异步任务函数，返回Promise
   * @returns {Promise} 返回任务执行的Promise
   */
  add(task) {
    return new Promise((resolve, reject) => {
      // 将任务及其resolve、reject放入队列
      this.queue.push({
        task,
        resolve,
        reject,
      });

      // 尝试执行任务
      this.runNext();
    });
  }

  /**
   * 尝试执行下一个任务
   */
  runNext() {
    // 如果没有正在等待的任务，或者已达到最大并发数，则不执行
    if (this.queue.length === 0 || this.running >= this.maxConcurrent) {
      return;
    }

    // 取出队列中的下一个任务
    const { task, resolve, reject } = this.queue.shift();
    // 增加正在运行的任务计数
    this.running++;

    // 执行任务
    Promise.resolve()
      .then(() => task())
      .then(
        // 任务成功完成
        (result) => {
          resolve(result);
          this.running--;
          this.runNext(); // 尝试执行下一个任务
        },
        // 任务执行失败
        (error) => {
          reject(error);
          this.running--;
          this.runNext(); // 尝试执行下一个任务
        }
      );
  }
}

/**
 * 增强版任务调度器
 * 支持任务优先级、延迟执行、任务取消等
 */
class AdvancedScheduler {
  /**
   * 创建一个高级任务调度器
   * @param {Object} options - 配置选项
   * @param {Number} options.maxConcurrent - 最大并发数
   * @param {Boolean} options.autoStart - 是否自动开始执行任务
   */
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 2;
    this.autoStart = options.autoStart !== false;
    this.running = 0;
    this.queues = {
      high: [], // 高优先级队列
      normal: [], // 普通优先级队列
      low: [], // 低优先级队列
    };
    this.isPaused = false;
    this.taskCounter = 0; // 任务计数器，用于生成唯一ID
  }

  /**
   * 添加任务到调度器
   * @param {Function} task - 异步任务函数，返回Promise
   * @param {Object} options - 任务选项
   * @param {String} options.priority - 任务优先级，可选值：'high', 'normal', 'low'
   * @param {Number} options.delay - 延迟执行的时间(毫秒)
   * @param {String} options.id - 任务ID，用于取消任务，如不提供则自动生成
   * @returns {Promise} 返回任务执行的Promise和任务ID
   */
  add(task, options = {}) {
    const priority = options.priority || "normal";
    const delay = options.delay || 0;
    const id = options.id || `task_${++this.taskCounter}`;

    // 创建任务Promise
    let taskResolve, taskReject;
    const taskPromise = new Promise((resolve, reject) => {
      taskResolve = resolve;
      taskReject = reject;
    });

    // 创建任务对象
    const taskObj = {
      id,
      task,
      priority,
      resolve: taskResolve,
      reject: taskReject,
      added: Date.now(),
      canceled: false,
    };

    // 处理延迟执行
    if (delay > 0) {
      setTimeout(() => {
        // 如果任务未被取消，则添加到相应优先级的队列
        if (!taskObj.canceled) {
          this.queues[priority].push(taskObj);
          if (this.autoStart && !this.isPaused) {
            this.runNext();
          }
        }
      }, delay);
    } else {
      // 直接添加到相应优先级的队列
      this.queues[priority].push(taskObj);
      if (this.autoStart && !this.isPaused) {
        this.runNext();
      }
    }

    // 返回Promise和任务ID
    return {
      promise: taskPromise,
      id,
    };
  }

  /**
   * 取消任务
   * @param {String} id - 要取消的任务ID
   * @returns {Boolean} 是否成功取消
   */
  cancel(id) {
    // 在所有优先级队列中查找并取消任务
    for (const priority in this.queues) {
      const queue = this.queues[priority];
      const index = queue.findIndex((task) => task.id === id);

      if (index !== -1) {
        const task = queue[index];
        task.canceled = true;
        // 从队列中移除任务
        queue.splice(index, 1);
        // 拒绝任务的Promise
        task.reject(new Error("Task canceled"));
        return true;
      }
    }

    return false;
  }

  /**
   * 暂停调度器
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * 恢复调度器
   */
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.runNext();
    }
  }

  /**
   * 清空所有任务队列
   * @param {Boolean} rejectTasks - 是否拒绝所有等待中的任务
   */
  clear(rejectTasks = true) {
    for (const priority in this.queues) {
      const queue = this.queues[priority];

      if (rejectTasks) {
        // 拒绝所有等待中的任务
        queue.forEach((task) => {
          task.canceled = true;
          task.reject(new Error("Task canceled by scheduler clear"));
        });
      }

      // 清空队列
      this.queues[priority] = [];
    }
  }

  /**
   * 获取调度器当前状态
   * @returns {Object} 调度器状态信息
   */
  status() {
    return {
      running: this.running,
      queued: {
        high: this.queues.high.length,
        normal: this.queues.normal.length,
        low: this.queues.low.length,
        total:
          this.queues.high.length +
          this.queues.normal.length +
          this.queues.low.length,
      },
      isPaused: this.isPaused,
    };
  }

  /**
   * 尝试执行下一个任务
   */
  runNext() {
    // 如果调度器已暂停或已达到最大并发数，则不执行
    if (this.isPaused || this.running >= this.maxConcurrent) {
      return;
    }

    // 按优先级获取下一个任务
    let taskObj = null;
    if (this.queues.high.length > 0) {
      taskObj = this.queues.high.shift();
    } else if (this.queues.normal.length > 0) {
      taskObj = this.queues.normal.shift();
    } else if (this.queues.low.length > 0) {
      taskObj = this.queues.low.shift();
    } else {
      // 没有等待中的任务
      return;
    }

    // 如果任务已被取消，尝试下一个任务
    if (taskObj.canceled) {
      this.runNext();
      return;
    }

    // 增加正在运行的任务计数
    this.running++;

    // 执行任务
    Promise.resolve()
      .then(() => taskObj.task())
      .then(
        // 任务成功完成
        (result) => {
          if (!taskObj.canceled) {
            taskObj.resolve(result);
          }
          this.running--;
          this.runNext(); // 尝试执行下一个任务
        },
        // 任务执行失败
        (error) => {
          if (!taskObj.canceled) {
            taskObj.reject(error);
          }
          this.running--;
          this.runNext(); // 尝试执行下一个任务
        }
      );
  }
}

// 测试任务调度器
function testScheduler() {
  // 创建一个任务生成函数
  function createTask(id, duration, shouldFail = false) {
    return () =>
      new Promise((resolve, reject) => {
        console.log(`任务 ${id} 开始执行，预计耗时 ${duration}ms`);

        setTimeout(() => {
          if (shouldFail) {
            console.log(`任务 ${id} 执行失败`);
            reject(new Error(`任务 ${id} 失败`));
          } else {
            console.log(`任务 ${id} 执行完成`);
            resolve(`任务 ${id} 的结果`);
          }
        }, duration);
      });
  }

  // 测试基础调度器
  console.log("=== 测试基础调度器 (最大并发数: 2) ===");
  const scheduler = new Scheduler(2);

  console.time("基础调度器完成时间");

  // 添加多个任务
  Promise.all([
    scheduler.add(createTask(1, 1000)),
    scheduler.add(createTask(2, 500)),
    scheduler.add(createTask(3, 2000)),
    scheduler.add(createTask(4, 800, true)), // 这个任务会失败
    scheduler.add(createTask(5, 1500)),
  ]).then(
    (results) => {
      console.log("所有任务完成:", results);
      console.timeEnd("基础调度器完成时间");
    },
    (error) => {
      console.error("有任务失败:", error);
      console.timeEnd("基础调度器完成时间");
    }
  );

  // 测试高级调度器
  console.log("\n=== 测试高级调度器 ===");
  const advScheduler = new AdvancedScheduler({ maxConcurrent: 2 });

  console.time("高级调度器完成时间");

  // 添加不同优先级的任务
  const task1 = advScheduler.add(createTask("H1", 1000), { priority: "high" });
  const task2 = advScheduler.add(createTask("N1", 500), { priority: "normal" });
  const task3 = advScheduler.add(createTask("L1", 2000), { priority: "low" });
  const task4 = advScheduler.add(createTask("H2", 800), {
    priority: "high",
    delay: 2000,
  }); // 延迟执行
  const task5 = advScheduler.add(createTask("N2", 1500), {
    priority: "normal",
  });

  // 取消其中一个任务
  setTimeout(() => {
    console.log(`取消任务 N2 (ID: ${task5.id})`);
    advScheduler.cancel(task5.id);
    console.log("当前调度器状态:", advScheduler.status());

    // 暂停调度器
    console.log("暂停调度器");
    advScheduler.pause();

    // 3秒后恢复
    setTimeout(() => {
      console.log("恢复调度器");
      advScheduler.resume();
    }, 3000);
  }, 1000);

  // 等待所有任务完成
  Promise.all([
    task1.promise.catch((e) => e),
    task2.promise.catch((e) => e),
    task3.promise.catch((e) => e),
    task4.promise.catch((e) => e),
    task5.promise.catch((e) => e),
  ]).then((results) => {
    console.log("所有任务结果或错误:", results);
    console.timeEnd("高级调度器完成时间");
  });
}

// 任务调度器的实际应用示例
function schedulerApplications() {
  // 模拟API请求
  function apiRequest(
    endpoint,
    delay = Math.floor(Math.random() * 1000) + 500
  ) {
    return () =>
      new Promise((resolve) => {
        console.log(`请求 ${endpoint} 开始...`);
        setTimeout(() => {
          console.log(`请求 ${endpoint} 完成`);
          resolve({
            endpoint,
            data: `来自 ${endpoint} 的数据`,
            timestamp: Date.now(),
          });
        }, delay);
      });
  }

  // 1. 实现API请求的优先级队列
  console.log("\n=== 应用示例: API请求优先级队列 ===");

  const apiScheduler = new AdvancedScheduler({ maxConcurrent: 3 });

  // 添加用户关键操作（高优先级）
  console.log("添加用户关键操作请求 (高优先级)");
  const userTask = apiScheduler.add(apiRequest("/api/user/profile", 800), {
    priority: "high",
  });

  // 添加次要数据请求（普通优先级）
  console.log("添加次要数据请求 (普通优先级)");
  const dataTask1 = apiScheduler.add(apiRequest("/api/data/stats", 1000), {
    priority: "normal",
  });
  const dataTask2 = apiScheduler.add(apiRequest("/api/data/list", 1200), {
    priority: "normal",
  });

  // 添加背景分析请求（低优先级）
  console.log("添加背景分析请求 (低优先级)");
  const analyticsTask1 = apiScheduler.add(
    apiRequest("/api/analytics/users", 1500),
    { priority: "low" }
  );
  const analyticsTask2 = apiScheduler.add(
    apiRequest("/api/analytics/performance", 2000),
    { priority: "low" }
  );

  // 查看调度器状态
  console.log("当前调度器状态:", apiScheduler.status());

  // 等待所有请求完成
  Promise.all([
    userTask.promise,
    dataTask1.promise,
    dataTask2.promise,
    analyticsTask1.promise,
    analyticsTask2.promise,
  ]).then((results) => {
    console.log("所有API请求完成，结果数:", results.length);
  });

  // 2. 实现定时任务调度
  console.log("\n=== 应用示例: 定时任务调度 ===");

  function createPeriodicTask(name, interval, count = 3) {
    let counter = 0;

    function scheduleNext(scheduler) {
      if (counter >= count) return;

      const taskFn = () =>
        new Promise((resolve) => {
          console.log(`执行定时任务 ${name} (${++counter}/${count})`);
          resolve(`任务 ${name} 第 ${counter} 次执行结果`);
        });

      scheduler
        .add(taskFn, { delay: interval })
        .promise.then(() => scheduleNext(scheduler));
    }

    return scheduleNext;
  }

  const periodicScheduler = new AdvancedScheduler({ maxConcurrent: 5 });

  // 创建并启动定时任务
  const task1 = createPeriodicTask("快速任务", 1000, 5);
  const task2 = createPeriodicTask("中速任务", 2000, 3);
  const task3 = createPeriodicTask("慢速任务", 3000, 2);

  task1(periodicScheduler);
  task2(periodicScheduler);
  task3(periodicScheduler);
}

// 运行测试和应用示例
//testScheduler();
schedulerApplications();

/**
 * 任务调度器实现总结：
 *
 * 1. 核心功能：
 *    - 任务并发控制：限制同时执行的任务数量
 *    - 任务队列管理：按添加顺序或优先级执行任务
 *    - 动态调整：支持暂停、恢复、取消任务
 *
 * 2. 实现思路：
 *    - 使用队列存储待执行的任务
 *    - 跟踪当前正在执行的任务数量
 *    - 任务完成后自动从队列取出下一个任务执行
 *
 * 3. 高级特性：
 *    - 任务优先级：不同优先级的任务队列
 *    - 延迟执行：支持延迟一定时间后执行任务
 *    - 任务取消：在任务开始执行前可以取消
 *    - 状态报告：提供当前调度器状态的信息
 *
 * 4. 应用场景：
 *    - API请求管理：控制并发请求数量，设置请求优先级
 *    - 资源密集型操作：限制同时进行的资源密集型任务
 *    - 批量处理：分批处理大量数据
 *    - 定时任务：实现周期性任务调度
 *
 * 5. 面试要点：
 *    - 理解Promise和异步任务调度的关系
 *    - 掌握队列和优先级队列的实现
 *    - 了解如何处理任务的生命周期（添加、执行、完成、取消）
 *    - 能够解释为什么需要任务调度器及其在实际项目中的应用
 */

module.exports = {
  Scheduler,
  AdvancedScheduler,
};
