/**
 * JavaScript 事件循环 (Event Loop)
 *
 * 事件循环是JavaScript的一种机制，它使JavaScript能够执行非阻塞操作。
 * JavaScript是单线程的，事件循环允许它处理异步操作，同时保持单线程的特性。
 *
 * 事件循环主要包括以下几个核心概念：
 * 1. 调用栈(Call Stack)：用于跟踪函数调用
 * 2. 任务队列(Task Queue/Callback Queue)：存放异步回调函数
 * 3. 微任务队列(Microtask Queue)：优先级高于任务队列的异步任务队列
 * 4. Web API(浏览器环境)/Node API(Node.js环境)：提供异步功能的API
 */

// 1. 同步代码与事件循环
console.log("===== 同步代码与事件循环 =====");

console.log("1"); // 直接进入调用栈并执行

setTimeout(function () {
  console.log("2"); // 放入任务队列，等待调用栈清空后执行
}, 0);

console.log("3"); // 直接进入调用栈并执行

// 输出顺序：1, 3, 2

// 2. 宏任务(Macrotask)与微任务(Microtask)
console.log("\n===== 宏任务与微任务 =====");

console.log("1 - 同步代码开始"); // 同步代码

setTimeout(function () {
  console.log("2 - 宏任务(setTimeout)"); // 宏任务
}, 0);

Promise.resolve().then(function () {
  console.log("3 - 微任务(Promise)"); // 微任务
});

console.log("4 - 同步代码结束"); // 同步代码

// 输出顺序：1 - 同步代码开始, 4 - 同步代码结束, 3 - 微任务(Promise), 2 - 宏任务(setTimeout)

/**
 * 解释：
 * 1. 首先执行所有同步代码（1和4）
 * 2. 调用栈清空后，检查微任务队列并执行所有微任务（3）
 * 3. 最后执行宏任务队列中的任务（2）
 */

// 3. 宏任务和微任务的例子
console.log("\n===== 宏任务和微任务的例子 =====");

console.log("Script start"); // 同步

setTimeout(function () {
  console.log("setTimeout 1"); // 宏任务1
}, 0);

setTimeout(function () {
  console.log("setTimeout 2"); // 宏任务2
}, 0);

Promise.resolve()
  .then(function () {
    console.log("Promise 1"); // 微任务1
  })
  .then(function () {
    console.log("Promise 2"); // 微任务2
  });

console.log("Script end"); // 同步

// 输出顺序：Script start, Script end, Promise 1, Promise 2, setTimeout 1, setTimeout 2

// 4. 复杂的事件循环示例
console.log("\n===== 复杂的事件循环示例 =====");

console.log("Start"); // 同步1

setTimeout(function () {
  console.log("setTimeout 1"); // 宏任务1

  Promise.resolve().then(function () {
    console.log("Promise inside setTimeout"); // setTimeout回调内的微任务
  });
}, 0);

Promise.resolve().then(function () {
  console.log("Promise 1"); // 微任务1

  setTimeout(function () {
    console.log("setTimeout inside Promise"); // Promise回调内的宏任务
  }, 0);
});

console.log("End"); // 同步2

// 输出顺序：Start, End, Promise 1, setTimeout 1, Promise inside setTimeout, setTimeout inside Promise

/**
 * 解释：
 * 1. 执行同步代码：Start, End
 * 2. 执行微任务队列：Promise 1（并注册新的宏任务setTimeout inside Promise）
 * 3. 执行宏任务队列第一项：setTimeout 1（并注册新的微任务Promise inside setTimeout）
 * 4. 执行新的微任务队列：Promise inside setTimeout
 * 5. 执行宏任务队列下一项：setTimeout inside Promise
 */

// 5. 常见的宏任务和微任务
console.log("\n===== 常见的宏任务和微任务 =====");

/**
 * 宏任务(Macrotasks)包括：
 * - setTimeout
 * - setInterval
 * - setImmediate (Node.js)
 * - I/O操作
 * - UI渲染
 * - requestAnimationFrame (浏览器)
 */

/**
 * 微任务(Microtasks)包括：
 * - Promise.then/catch/finally
 * - process.nextTick (Node.js)
 * - queueMicrotask
 * - MutationObserver (浏览器)
 */

// 6. 使用queueMicrotask显式创建微任务
console.log("\n===== 使用queueMicrotask =====");

console.log("Start");

setTimeout(() => console.log("setTimeout"), 0);

queueMicrotask(() => console.log("queueMicrotask"));

Promise.resolve().then(() => console.log("Promise.then"));

console.log("End");

// 输出顺序：Start, End, queueMicrotask, Promise.then, setTimeout

// 7. Node.js中的process.nextTick
console.log("\n===== Node.js中的process.nextTick =====");

// 在Node.js环境中，process.nextTick的优先级高于Promise
// 以下代码在Node.js环境中执行，浏览器环境会报错

/*
console.log('Start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise.then');
});

process.nextTick(() => {
  console.log('process.nextTick');
});

console.log('End');

// 输出顺序(Node.js环境)：Start, End, process.nextTick, Promise.then, setTimeout
*/

// 8. 事件循环和错误处理
console.log("\n===== 事件循环和错误处理 =====");

Promise.resolve()
  .then(() => {
    throw new Error("Promise error");
  })
  .catch((err) => {
    console.log("Caught error in Promise:", err.message);
  });

setTimeout(() => {
  try {
    throw new Error("setTimeout error");
  } catch (err) {
    console.log("Caught error in setTimeout:", err.message);
  }
}, 0);

// 9. 动手实现一个简单的事件循环
console.log("\n===== 简单事件循环实现 =====");

class SimpleEventLoop {
  constructor() {
    this.macroTaskQueue = [];
    this.microTaskQueue = [];
    this.executing = false;
  }

  addMacroTask(task) {
    this.macroTaskQueue.push(task);
    this.run();
  }

  addMicroTask(task) {
    this.microTaskQueue.push(task);
    this.run();
  }

  run() {
    if (this.executing) return;
    this.executing = true;

    // 持续执行直到两个队列都为空
    while (this.microTaskQueue.length > 0 || this.macroTaskQueue.length > 0) {
      // 先执行所有微任务
      while (this.microTaskQueue.length > 0) {
        const microTask = this.microTaskQueue.shift();
        microTask();
      }

      // 如果还有宏任务，执行一个宏任务
      if (this.macroTaskQueue.length > 0) {
        const macroTask = this.macroTaskQueue.shift();
        macroTask();
      }
    }

    this.executing = false;
  }
}

const eventLoop = new SimpleEventLoop();

eventLoop.addMacroTask(() => console.log("Macro Task 1"));
eventLoop.addMicroTask(() => console.log("Micro Task 1"));
eventLoop.addMacroTask(() => console.log("Macro Task 2"));
eventLoop.addMicroTask(() => {
  console.log("Micro Task 2");
  // 微任务里面添加微任务，会在当前循环中执行
  eventLoop.addMicroTask(() => console.log("Nested Micro Task"));
});

// 输出顺序：Micro Task 1, Micro Task 2, Nested Micro Task, Macro Task 1, Macro Task 2

/**
 * 10. 事件循环在浏览器和Node.js中的区别
 *
 * 浏览器事件循环：
 * - 每执行完一个宏任务，就执行所有微任务
 *
 * Node.js事件循环（v11之前）：
 * - 每个阶段结束后才执行对应阶段的微任务
 * - 多个阶段：timers, I/O callbacks, idle/prepare, poll, check, close callbacks
 *
 * Node.js事件循环（v11及之后）：
 * - 更接近浏览器行为，每个宏任务执行后立即执行微任务
 */

/**
 * 面试中常见问题：
 *
 * 1. 什么是JavaScript事件循环？为什么需要事件循环？
 * 2. 宏任务和微任务的区别是什么？分别举例说明。
 * 3. setTimeout(fn, 0)的回调函数会立即执行吗？为什么？
 * 4. Promise.then和setTimeout的执行顺序是怎样的？为什么？
 * 5. 浏览器和Node.js中的事件循环有什么区别？
 * 6. process.nextTick和Promise.then的优先级哪个更高？
 * 7. 请解释以下代码的输出顺序及原因：
 *    console.log(1);
 *    setTimeout(() => console.log(2), 0);
 *    Promise.resolve().then(() => console.log(3));
 *    console.log(4);
 * 8. 如何使用事件循环的知识优化异步代码的性能？
 */

/**
 * 面试问题参考答案：
 *
 * 1. 什么是JavaScript事件循环？为什么需要事件循环？
 *
 * 答：JavaScript事件循环是一种执行模型，用于协调代码执行、收集和处理事件以及执行队列中的子任务。
 *
 * JavaScript是单线程语言，这意味着它一次只能执行一个任务。然而，Web应用程序需要处理用户交互、网络请求、定时器等异步操作，而不阻塞主线程的执行。事件循环就是解决这个问题的机制。
 *
 * 事件循环的主要优势：
 * - 保持UI响应性（不阻塞）
 * - 高效处理网络请求
 * - 支持大量并发操作
 * - 简化异步编程模型
 *
 * 事件循环允许JavaScript实现非阻塞I/O操作，尽管JavaScript是单线程的。它通过将操作委托给浏览器或Node.js等宿主环境，然后在操作完成时将回调放入任务队列，等待执行。
 *
 * 2. 宏任务和微任务的区别是什么？分别举例说明。
 *
 * 答：宏任务和微任务是事件循环中两种不同类型的任务，它们主要区别在于执行时机和优先级。
 *
 * 宏任务(Macrotask)：
 * - 由宿主环境(浏览器、Node.js)提供的标准异步API创建
 * - 每次事件循环只会从队列中取出一个宏任务执行
 * - 执行完一个宏任务后，会先清空微任务队列，再执行下一个宏任务
 *
 * 宏任务例子：
 * - setTimeout/setInterval
 * - setImmediate (Node.js)
 * - requestAnimationFrame (浏览器)
 * - I/O操作
 * - UI渲染事件
 * - script标签整体代码
 *
 * 微任务(Microtask)：
 * - 通常由JavaScript引擎提供的API创建
 * - 在当前宏任务执行完后立即执行，清空整个微任务队列
 * - 微任务可以在当前宏任务结束前插队执行
 * - 具有比宏任务更高的优先级
 *
 * 微任务例子：
 * - Promise.then/catch/finally
 * - process.nextTick (Node.js)
 * - queueMicrotask
 * - MutationObserver (浏览器)
 * - async/await (本质上是Promise)
 *
 * 3. setTimeout(fn, 0)的回调函数会立即执行吗？为什么？
 *
 * 答：setTimeout(fn, 0)的回调函数不会立即执行，而是在下一次事件循环的宏任务阶段执行。
 *
 * 原因如下：
 * 1. setTimeout(fn, 0)将回调函数放入宏任务队列，即使延时设为0
 * 2. 当前执行栈中的代码（当前宏任务）必须先执行完毕
 * 3. 执行栈清空后，会先检查并执行所有微任务
 * 4. 微任务队列清空后，才会从宏任务队列取出setTimeout的回调执行
 *
 * 需要注意的是，setTimeout的实际延迟通常会比指定的延迟更长。浏览器通常有一个最小延迟限制（一般为4ms），Node.js环境下最小延迟通常为1ms。此外，如果主线程繁忙，延迟会进一步增加。
 *
 * 所以，setTimeout(fn, 0)实际上是"在当前执行栈清空后尽快执行"，而非真正的"立即执行"。
 *
 * 4. Promise.then和setTimeout的执行顺序是怎样的？为什么？
 *
 * 答：Promise.then总是先于setTimeout执行，即使setTimeout的延时为0。
 *
 * 这是因为：
 * 1. Promise.then的回调被放入微任务队列
 * 2. setTimeout的回调被放入宏任务队列
 * 3. 在事件循环中，当前宏任务执行完毕后，会先清空微任务队列，再执行下一个宏任务
 *
 * 示例代码：
 * ```javascript
 * console.log('start');
 * setTimeout(() => console.log('timeout'), 0);
 * Promise.resolve().then(() => console.log('promise'));
 * console.log('end');
 * ```
 *
 * 执行顺序：
 * 1. 'start' - 同步代码直接执行
 * 2. 'end' - 同步代码直接执行
 * 3. 'promise' - 微任务，在当前宏任务结束后立即执行
 * 4. 'timeout' - 宏任务，在下一个事件循环中执行
 *
 * 这种执行顺序保证了Promise可以尽快得到处理，提高了异步操作的响应性。
 *
 * 5. 浏览器和Node.js中的事件循环有什么区别？
 *
 * 答：浏览器和Node.js的事件循环虽然概念类似，但实现和行为有一些重要差异：
 *
 * 浏览器事件循环：
 * - 简单的循环模型，只有宏任务队列和微任务队列
 * - 每个宏任务执行完后，立即清空所有微任务
 * - 然后进行UI渲染，再执行下一个宏任务
 *
 * Node.js事件循环(v11之前)：
 * - 更复杂的阶段性模型，有多个阶段
 * - 主要阶段：timers, I/O callbacks, idle/prepare, poll, check, close callbacks
 * - 微任务在特定阶段之间执行，而不是每个宏任务后立即执行
 * - process.nextTick的优先级高于Promise.then
 *
 * Node.js事件循环(v11及之后)：
 * - 更接近浏览器行为
 * - 每个阶段内的每个宏任务执行完后立即执行微任务
 * - 但仍保留了多阶段设计和process.nextTick
 *
 * 实际开发中，主要要注意：
 * 1. Node.js中process.nextTick的优先级最高
 * 2. Node.js有针对I/O操作的特殊优化
 * 3. 在较老版本Node.js中，微任务执行时机不同
 *
 * 6. process.nextTick和Promise.then的优先级哪个更高？
 *
 * 答：在Node.js环境中，process.nextTick的优先级高于Promise.then。
 *
 * Node.js维护两个队列：
 * - nextTick队列：通过process.nextTick()添加的回调
 * - Promise微任务队列：Promise回调等其他微任务
 *
 * 在事件循环的每个阶段之间，Node.js会优先清空nextTick队列，然后才处理Promise微任务队列。
 *
 * 示例代码：
 * ```javascript
 * Promise.resolve().then(() => console.log('promise'));
 * process.nextTick(() => console.log('nextTick'));
 * ```
 *
 * 输出顺序：
 * 1. 'nextTick'
 * 2. 'promise'
 *
 * 这种设计允许开发者在所有其他微任务之前插入必须执行的代码，适用于需要在当前操作完成后立即执行但又不想创建新的I/O循环的情况。
 *
 * 7. 请解释以下代码的输出顺序及原因：
 *    console.log(1);
 *    setTimeout(() => console.log(2), 0);
 *    Promise.resolve().then(() => console.log(3));
 *    console.log(4);
 *
 * 答：输出顺序是：1, 4, 3, 2
 *
 * 详细解释：
 * 1. console.log(1) - 同步代码，立即执行并打印1
 * 2. setTimeout(() => console.log(2), 0) - 将回调函数放入宏任务队列
 * 3. Promise.resolve().then(() => console.log(3)) - 将回调函数放入微任务队列
 * 4. console.log(4) - 同步代码，立即执行并打印4
 * 5. 至此，调用栈清空，开始检查微任务队列
 * 6. 执行微任务队列中的Promise回调，打印3
 * 7. 微任务队列清空，从宏任务队列取出setTimeout回调执行，打印2
 *
 * 这个例子完美展示了事件循环的执行顺序：
 * - 先执行所有同步代码
 * - 然后执行微任务
 * - 最后执行宏任务
 *
 * 8. 如何使用事件循环的知识优化异步代码的性能？
 *
 * 答：理解事件循环可以帮助优化异步代码性能，以下是几种常见策略：
 *
 * 1. 利用微任务优先级：
 *    - 对于需要尽快执行但又不能阻塞主线程的操作，使用Promise或queueMicrotask而非setTimeout
 *    - 微任务可以在下一个宏任务开始前执行，提高响应速度
 *
 * 2. 避免阻塞事件循环：
 *    - 将计算密集型任务拆分为小块，使用setTimeout(fn, 0)让出执行权
 *    - 考虑使用Web Workers处理耗时计算，避免阻塞主线程
 *
 * 3. 合理批处理：
 *    - 避免频繁创建独立的微任务或宏任务
 *    - 收集并批量处理更新，减少任务切换开销
 *
 * 4. 适当使用宏任务延迟：
 *    - 非关键操作可以放入宏任务队列，避免阻塞重要微任务
 *    - UI相关操作考虑使用requestAnimationFrame而非setTimeout
 *
 * 5. 合理调度I/O操作：
 *    - 在Node.js中，了解不同阶段的特性，将相关操作安排在合适的阶段
 *    - 使用setImmediate代替setTimeout(fn, 0)处理I/O回调
 *
 * 6. 避免长时间运行的任务：
 *    - 任何任务运行时间超过16ms可能导致页面掉帧
 *    - 将大型任务拆分，或移到Web Worker中
 *
 * 7. 预测和预加载：
 *    - 利用空闲时间预加载可能需要的资源
 *    - 使用requestIdleCallback在浏览器空闲时执行低优先级任务
 *
 * 正确理解和利用事件循环，可以显著提高JavaScript应用的性能和响应性。
 */
