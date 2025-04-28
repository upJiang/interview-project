/**
 * 异步并发控制 (Async Pool)
 *
 * 作用：控制并发执行的异步任务数量，避免同时执行过多任务导致资源占用过高。
 * 应用场景：批量请求API、并行下载文件、数据库批量操作等。
 */

/**
 * 基础版异步并发控制
 * 使用Promise实现
 *
 * @param {Function[]} tasks - 异步任务数组，每个任务是一个返回Promise的函数
 * @param {Number} limit - 最大并发数量
 * @return {Promise<any[]>} - 所有任务完成后的结果数组，顺序与任务数组一致
 */
function asyncPool(tasks, limit) {
  // 任务结果数组
  const results = [];
  // 当前执行的Promise数组
  const executing = [];

  // 为每个任务创建一个Promise，并分配执行位置
  tasks.forEach((task, index) => {
    // 为每个任务的结果分配位置
    results[index] = undefined;

    // 创建一个Promise，包装任务执行与结果存储
    const taskPromise = Promise.resolve()
      .then(() => task())
      .then((result) => {
        // 存储任务结果
        results[index] = result;
        // 从正在执行的数组中移除该任务
        executing.splice(executing.indexOf(taskPromise), 1);
      });

    // 添加到执行数组
    executing.push(taskPromise);

    // 如果达到并发限制，需要等待其中一个任务完成
    if (executing.length >= limit) {
      // 等待任意一个任务完成
      const executeNext = Promise.race(executing);
      // 在队列中的任务完成后，继续执行下一批
      executing.push(executeNext);
    }
  });

  // 等待所有任务完成
  return Promise.all(executing).then(() => results);
}

/**
 * 高级异步并发控制
 * 支持动态添加任务和错误处理
 *
 * @param {Number} limit - 最大并发数量
 * @return {Object} - 返回一个控制对象，包含添加任务和获取结果的方法
 */
function createAsyncPool(limit) {
  // 任务队列
  const taskQueue = [];
  // 当前正在执行的任务数量
  let runningCount = 0;
  // 任务结果
  const results = [];
  // 错误信息
  const errors = [];
  // 是否已暂停执行
  let paused = false;
  // 所有任务是否已完成的Promise
  let resolveAllDone;
  const allTasksDone = new Promise((resolve) => {
    resolveAllDone = resolve;
  });

  // 执行下一个任务的函数
  function runNextTask() {
    // 如果暂停或没有等待的任务，或已达到并发限制，则不执行
    if (paused || taskQueue.length === 0 || runningCount >= limit) {
      return;
    }

    // 取出队列中的下一个任务
    const { task, index } = taskQueue.shift();
    runningCount++;

    // 执行任务
    Promise.resolve()
      .then(() => task())
      .then((result) => {
        // 存储成功结果
        results[index] = { status: "fulfilled", value: result };
      })
      .catch((error) => {
        // 存储错误信息
        errors[index] = error;
        results[index] = { status: "rejected", reason: error };
      })
      .finally(() => {
        runningCount--;

        // 继续执行下一个任务
        runNextTask();

        // 检查是否所有任务都已完成
        if (runningCount === 0 && taskQueue.length === 0) {
          resolveAllDone();
        }
      });

    // 如果还有任务且未达到并发限制，继续执行
    if (taskQueue.length > 0 && runningCount < limit) {
      runNextTask();
    }
  }

  // 返回控制对象
  return {
    // 添加任务
    addTask(task) {
      const index = results.length;
      taskQueue.push({ task, index });
      results.push(undefined);

      // 如果未暂停且并发未达到限制，执行新任务
      if (!paused && runningCount < limit) {
        runNextTask();
      }

      return index; // 返回任务索引，可用于获取结果
    },

    // 批量添加任务
    addTasks(tasks) {
      return tasks.map((task) => this.addTask(task));
    },

    // 暂停任务执行
    pause() {
      paused = true;
    },

    // 恢复任务执行
    resume() {
      if (paused) {
        paused = false;

        // 恢复执行，尝试启动新任务
        while (runningCount < limit && taskQueue.length > 0) {
          runNextTask();
        }
      }
    },

    // 获取所有结果的Promise
    results() {
      return allTasksDone.then(() => results);
    },

    // 获取所有错误的Promise
    errors() {
      return allTasksDone.then(() => errors.filter((e) => e !== undefined));
    },

    // 获取当前状态
    status() {
      return {
        queued: taskQueue.length,
        running: runningCount,
        completed: results.filter((r) => r !== undefined).length,
        failed: errors.filter((e) => e !== undefined).length,
        paused,
      };
    },
  };
}

/**
 * ES6 最简实现的异步并发控制
 * 使用 async/await 语法
 *
 * @param {Iterable} iterable - 可迭代对象，每一项是一个异步函数
 * @param {Number} limit - 并发限制数量
 * @return {Promise<Array>} - 所有任务的结果数组
 */
async function asyncPoolSimple(iterable, limit) {
  const results = []; // 存储所有结果
  const executing = new Set(); // 正在执行的任务集合

  for (const [index, task] of [...iterable].entries()) {
    // 将任务包装成Promise
    const promise = Promise.resolve().then(() => task());
    results[index] = promise; // 保持原始顺序

    // 将任务添加到执行集合
    executing.add(promise);

    // 任务完成后从执行集合中移除
    promise.then(() => executing.delete(promise));

    // 如果达到并发限制，等待任意一个任务完成
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  // 等待所有Promise完成，并解析结果
  return Promise.all(results);
}

// 测试异步并发控制
function testAsyncPool() {
  // 模拟异步任务
  function createAsyncTask(id, delay, shouldFail = false) {
    return () =>
      new Promise((resolve, reject) => {
        console.log(`任务 ${id} 开始执行，预计耗时 ${delay}ms`);

        setTimeout(() => {
          if (shouldFail) {
            console.log(`任务 ${id} 执行失败`);
            reject(new Error(`任务 ${id} 失败`));
          } else {
            console.log(`任务 ${id} 执行完成`);
            resolve(`任务 ${id} 的结果`);
          }
        }, delay);
      });
  }

  // 创建一批测试任务
  const tasks = [
    createAsyncTask(1, 1000),
    createAsyncTask(2, 500),
    createAsyncTask(3, 2000),
    createAsyncTask(4, 800),
    createAsyncTask(5, 1500, true), // 这个任务会失败
    createAsyncTask(6, 1000),
    createAsyncTask(7, 2000),
    createAsyncTask(8, 500),
  ];

  // 测试基础版异步并发控制
  console.log("=== 测试基础版异步并发控制 (并发限制: 3) ===");
  console.time("基础版完成时间");

  asyncPool(tasks, 3)
    .then((results) => {
      console.log("所有任务执行结果:", results);
      console.timeEnd("基础版完成时间");
    })
    .catch((err) => {
      console.error("执行出错:", err);
      console.timeEnd("基础版完成时间");
    });

  // 测试高级版异步并发控制
  console.log("\n=== 测试高级版异步并发控制 (并发限制: 2) ===");
  console.time("高级版完成时间");

  const pool = createAsyncPool(2);

  // 添加初始任务
  pool.addTasks(tasks.slice(0, 4));

  // 3秒后添加更多任务
  setTimeout(() => {
    console.log("添加更多任务...");
    pool.addTasks(tasks.slice(4));

    // 显示当前状态
    console.log("当前状态:", pool.status());
  }, 3000);

  // 等待所有任务完成
  pool.results().then((results) => {
    console.log("所有任务执行结果:", results);
    console.log("失败的任务:", pool.errors());
    console.timeEnd("高级版完成时间");
  });

  // 使用简单版测试
  console.log("\n=== 测试简单版异步并发控制 (并发限制: 4) ===");
  console.time("简单版完成时间");

  asyncPoolSimple(tasks, 4)
    .then((results) => {
      console.log("所有任务执行结果:", results);
      console.timeEnd("简单版完成时间");
    })
    .catch((err) => {
      console.error("执行出错:", err);
      console.timeEnd("简单版完成时间");
    });
}

// 异步并发控制的实际应用示例
function asyncPoolApplications() {
  // 这里为简化演示，使用setTimeout模拟API调用
  function fetchData(id) {
    return () =>
      new Promise((resolve) => {
        const delay = Math.floor(Math.random() * 1000) + 500;
        setTimeout(
          () => resolve({ id, data: `Data from ${id}`, delay }),
          delay
        );
      });
  }

  // 1. API请求限流
  console.log("\n=== 应用示例: API请求限流 ===");

  const apiIds = Array.from({ length: 10 }, (_, i) => `api_${i + 1}`);
  const apiTasks = apiIds.map((id) => fetchData(id));

  console.time("API请求完成时间");
  asyncPoolSimple(apiTasks, 3).then((results) => {
    console.log(`所有${results.length}个API请求已完成，并发限制为3`);
    console.timeEnd("API请求完成时间");
  });

  // 2. 分批处理大数据
  console.log("\n=== 应用示例: 分批处理大数据 ===");

  // 模拟一个大型数据集
  const largeDataset = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    value: `Item ${i + 1}`,
  }));

  // 按批次处理
  async function processBatches(dataset, batchSize, concurrency) {
    // 将数据集分成多个批次
    const batches = [];
    for (let i = 0; i < dataset.length; i += batchSize) {
      batches.push(dataset.slice(i, i + batchSize));
    }

    // 为每个批次创建处理任务
    const batchTasks = batches.map((batch, index) => {
      return () =>
        new Promise((resolve) => {
          console.log(`处理批次 ${index + 1}，包含 ${batch.length} 条数据`);
          // 模拟处理时间
          setTimeout(() => {
            resolve(`批次 ${index + 1} 处理完成`);
          }, Math.random() * 1000 + 500);
        });
    });

    console.log(
      `将 ${dataset.length} 条数据分成 ${batches.length} 个批次，并发处理 ${concurrency} 个批次`
    );

    // 使用异步池并发处理批次
    return asyncPoolSimple(batchTasks, concurrency);
  }

  console.time("批处理完成时间");
  processBatches(largeDataset, 10, 4).then((results) => {
    console.log(`所有${results.length}个批次已处理完成`);
    console.timeEnd("批处理完成时间");
  });
}

// 运行测试和应用示例
//testAsyncPool();
asyncPoolApplications();

/**
 * 异步并发控制实现总结：
 *
 * 1. 核心原理：
 *    维护一个"正在执行"的任务池，当池中任务数量达到限制时，等待任务完成后再执行新任务，
 *    从而控制同时执行的异步任务数量。
 *
 * 2. 实现方式：
 *    - 基础版：使用Promise.race等待任意任务完成，然后继续执行下一个
 *    - 高级版：维护任务队列，支持动态添加、暂停恢复等功能
 *    - 简化版：利用async/await和Set实现更简洁的控制
 *
 * 3. 关键特性：
 *    - 并发控制：限制同时执行的任务数量
 *    - 结果顺序：保证结果数组与任务数组顺序一致
 *    - 错误处理：捕获并处理任务执行过程中的错误
 *    - 动态管理：支持动态添加任务、暂停恢复执行等
 *
 * 4. 应用场景：
 *    - API请求限流：避免同时发送过多请求导致服务器拒绝
 *    - 资源密集型任务：控制CPU或内存密集型任务的并发
 *    - 批量数据处理：分批处理大量数据
 *    - 并行下载：限制同时下载的文件数量
 *
 * 5. 面试要点：
 *    - 理解JavaScript的事件循环和异步特性
 *    - 掌握Promise的基本使用和组合方法
 *    - 了解如何处理并发任务的结果收集和错误处理
 *    - 能够解释为什么需要控制异步并发数量
 */

module.exports = {
  asyncPool,
  createAsyncPool,
  asyncPoolSimple,
};
