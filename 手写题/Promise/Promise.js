/**
 * 手写Promise (符合Promise/A+规范)
 *
 * Promise是JavaScript中用于处理异步操作的对象，它代表一个在未来某个时间点会完成的操作的结果。
 * 这个实现遵循Promise/A+规范 (https://promisesaplus.com/)
 */

/**
 * Promise的三种状态
 */
const PENDING = "pending"; // 初始状态，既不是成功，也不是失败
const FULFILLED = "fulfilled"; // 操作成功完成
const REJECTED = "rejected"; // 操作失败

/**
 * Promise构造函数
 * @param {Function} executor 执行器函数(resolve, reject) => {}
 */
function MyPromise(executor) {
  // 保存当前Promise实例的this引用
  const self = this;

  // 初始化Promise的状态和值
  this.state = PENDING; // 初始状态为pending
  this.value = undefined; // 存储成功的值
  this.reason = undefined; // 存储失败的原因
  this.onFulfilledCallbacks = []; // 存储成功的回调函数数组
  this.onRejectedCallbacks = []; // 存储失败的回调函数数组

  /**
   * resolve函数 - 将Promise状态从pending更改为fulfilled
   * @param {*} value 成功的值
   */
  function resolve(value) {
    // 使用微任务模拟Promise的异步特性
    queueMicrotask(() => {
      // 只有在pending状态时才能转换到fulfilled状态
      if (self.state === PENDING) {
        self.state = FULFILLED;
        self.value = value;
        // 执行所有成功的回调
        self.onFulfilledCallbacks.forEach((callback) => {
          callback(value);
        });
      }
    });
  }

  /**
   * reject函数 - 将Promise状态从pending更改为rejected
   * @param {*} reason 失败的原因
   */
  function reject(reason) {
    // 使用微任务模拟Promise的异步特性
    queueMicrotask(() => {
      // 只有在pending状态时才能转换到rejected状态
      if (self.state === PENDING) {
        self.state = REJECTED;
        self.reason = reason;
        // 执行所有失败的回调
        self.onRejectedCallbacks.forEach((callback) => {
          callback(reason);
        });
      }
    });
  }

  // 立即执行执行器函数
  try {
    executor(resolve, reject);
  } catch (e) {
    // 如果执行器函数抛出异常，将Promise状态设为rejected
    reject(e);
  }
}

/**
 * 处理then中的返回值和新Promise的关系
 * @param {MyPromise} promise2 新的Promise实例
 * @param {*} x then中返回的值
 * @param {Function} resolve promise2的resolve函数
 * @param {Function} reject promise2的reject函数
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 如果promise2和x指向同一对象，则以TypeError拒绝执行promise2
  // 这是为了防止循环引用
  if (promise2 === x) {
    return reject(new TypeError("Chaining cycle detected for promise"));
  }

  // 如果x是一个Promise实例，则采用它的状态
  if (x instanceof MyPromise) {
    x.then(
      (value) => resolvePromise(promise2, value, resolve, reject),
      (reason) => reject(reason)
    );
    return;
  }

  // 如果x是一个对象或函数
  if (x !== null && (typeof x === "object" || typeof x === "function")) {
    let called = false; // 防止多次调用

    try {
      // 尝试获取x.then
      const then = x.then;

      // 如果then是一个函数，将x作为this调用它
      if (typeof then === "function") {
        try {
          then.call(
            x,
            // 如果resolvePromise以值y为参数被调用，则运行[[Resolve]](promise, y)
            (y) => {
              if (called) return;
              called = true;
              resolvePromise(promise2, y, resolve, reject);
            },
            // 如果rejectPromise以据因r为参数被调用，则以据因r拒绝promise
            (r) => {
              if (called) return;
              called = true;
              reject(r);
            }
          );
        } catch (e) {
          if (!called) {
            reject(e);
          }
        }
      } else {
        // 如果then不是函数，以x为参数执行promise
        resolve(x);
      }
    } catch (e) {
      // 如果取x.then的值抛出异常e，则以e为据因拒绝promise
      if (!called) {
        reject(e);
      }
    }
  } else {
    // 如果x不是对象或函数，以x为参数执行promise
    resolve(x);
  }
}

/**
 * then方法 - 添加Promise解析完成后的回调
 * @param {Function} onFulfilled 成功的回调
 * @param {Function} onRejected 失败的回调
 * @return {MyPromise} 返回一个新的Promise
 */
MyPromise.prototype.then = function (onFulfilled, onRejected) {
  // 处理非函数参数情况，实现值穿透
  onFulfilled =
    typeof onFulfilled === "function" ? onFulfilled : (value) => value;
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : (reason) => {
          throw reason;
        };

  const self = this;
  // 创建并返回一个新的Promise实例
  const promise2 = new MyPromise((resolve, reject) => {
    // 处理已完成状态
    if (self.state === FULFILLED) {
      queueMicrotask(() => {
        try {
          // 执行成功回调，获取返回值
          const x = onFulfilled(self.value);
          // 处理返回值与新Promise的关系
          resolvePromise(promise2, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }

    // 处理已拒绝状态
    if (self.state === REJECTED) {
      queueMicrotask(() => {
        try {
          // 执行失败回调，获取返回值
          const x = onRejected(self.reason);
          // 处理返回值与新Promise的关系
          resolvePromise(promise2, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }

    // 处理待定状态 - 存储回调函数
    if (self.state === PENDING) {
      // 存储成功的回调
      self.onFulfilledCallbacks.push((value) => {
        queueMicrotask(() => {
          try {
            const x = onFulfilled(value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      });

      // 存储失败的回调
      self.onRejectedCallbacks.push((reason) => {
        queueMicrotask(() => {
          try {
            const x = onRejected(reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  });

  return promise2;
};

/**
 * catch方法 - 添加Promise被拒绝时的回调
 * @param {Function} onRejected 失败的回调
 * @return {MyPromise} 返回一个新的Promise
 */
MyPromise.prototype.catch = function (onRejected) {
  // catch实际上是then的一个特例，只处理失败情况
  return this.then(null, onRejected);
};

/**
 * finally方法 - 无论Promise是成功还是失败，都会执行指定的回调函数
 * @param {Function} callback 无论如何都会执行的回调
 * @return {MyPromise} 返回一个新的Promise
 */
MyPromise.prototype.finally = function (callback) {
  return this.then(
    (value) => MyPromise.resolve(callback()).then(() => value),
    (reason) =>
      MyPromise.resolve(callback()).then(() => {
        throw reason;
      })
  );
};

/**
 * 静态resolve方法 - 返回一个以给定值解析后的Promise对象
 * @param {*} value 要解析的值
 * @return {MyPromise} 返回一个新的Promise
 */
MyPromise.resolve = function (value) {
  // 如果值是Promise实例，直接返回
  if (value instanceof MyPromise) {
    return value;
  }

  // 创建一个已解析的Promise
  return new MyPromise((resolve) => {
    resolve(value);
  });
};

/**
 * 静态reject方法 - 返回一个带有拒绝原因的Promise对象
 * @param {*} reason 拒绝的原因
 * @return {MyPromise} 返回一个新的Promise
 */
MyPromise.reject = function (reason) {
  // 创建一个已拒绝的Promise
  return new MyPromise((resolve, reject) => {
    reject(reason);
  });
};

/**
 * 静态all方法 - 等待所有Promise完成（或第一个拒绝）
 * @param {Array} promises 一个Promise的数组
 * @return {MyPromise} 返回一个新的Promise
 */
MyPromise.all = function (promises) {
  return new MyPromise((resolve, reject) => {
    // 检查参数是否为数组
    if (!Array.isArray(promises)) {
      return reject(new TypeError("promises must be an array"));
    }

    const results = [];
    let resolvedCount = 0;
    const len = promises.length;

    // 如果传入的是空数组，则直接返回空数组
    if (len === 0) {
      return resolve(results);
    }

    // 遍历所有Promise
    for (let i = 0; i < len; i++) {
      MyPromise.resolve(promises[i]).then(
        (value) => {
          // 保存成功的结果，保持原顺序
          results[i] = value;
          resolvedCount++;

          // 所有Promise都成功后，解析返回的Promise
          if (resolvedCount === len) {
            resolve(results);
          }
        },
        (reason) => {
          // 只要有一个Promise被拒绝，就拒绝返回的Promise
          reject(reason);
        }
      );
    }
  });
};

/**
 * 静态race方法 - 返回一个Promise，一旦迭代器中的某个promise解决或拒绝，返回的promise就会解决或拒绝
 * @param {Array} promises 一个Promise的数组
 * @return {MyPromise} 返回一个新的Promise
 */
MyPromise.race = function (promises) {
  return new MyPromise((resolve, reject) => {
    // 检查参数是否为数组
    if (!Array.isArray(promises)) {
      return reject(new TypeError("promises must be an array"));
    }

    // 如果传入的是空数组，则永远处于pending状态
    const len = promises.length;
    if (len === 0) return;

    // 遍历所有Promise
    for (let i = 0; i < len; i++) {
      MyPromise.resolve(promises[i]).then(resolve, reject);
    }
  });
};

/**
 * 静态allSettled方法 - 等待所有Promise都完成（无论是解决还是拒绝）
 * @param {Array} promises 一个Promise的数组
 * @return {MyPromise} 返回一个新的Promise
 */
MyPromise.allSettled = function (promises) {
  return new MyPromise((resolve, reject) => {
    // 检查参数是否为数组
    if (!Array.isArray(promises)) {
      return reject(new TypeError("promises must be an array"));
    }

    const results = [];
    let settledCount = 0;
    const len = promises.length;

    // 如果传入的是空数组，则直接返回空数组
    if (len === 0) {
      return resolve(results);
    }

    // 遍历所有Promise
    for (let i = 0; i < len; i++) {
      MyPromise.resolve(promises[i]).then(
        (value) => {
          // 记录解决状态
          results[i] = { status: "fulfilled", value };
          settledCount++;

          // 所有Promise都已完成
          if (settledCount === len) {
            resolve(results);
          }
        },
        (reason) => {
          // 记录拒绝状态
          results[i] = { status: "rejected", reason };
          settledCount++;

          // 所有Promise都已完成
          if (settledCount === len) {
            resolve(results);
          }
        }
      );
    }
  });
};

/**
 * 静态any方法 - 只要其中的一个Promise成功，就返回那个已成功的Promise
 * @param {Array} promises 一个Promise的数组
 * @return {MyPromise} 返回一个新的Promise
 */
MyPromise.any = function (promises) {
  return new MyPromise((resolve, reject) => {
    // 检查参数是否为数组
    if (!Array.isArray(promises)) {
      return reject(new TypeError("promises must be an array"));
    }

    const errors = [];
    let rejectedCount = 0;
    const len = promises.length;

    // 如果传入的是空数组，则拒绝返回的Promise
    if (len === 0) {
      return reject(new AggregateError("All promises were rejected"));
    }

    // 遍历所有Promise
    for (let i = 0; i < len; i++) {
      MyPromise.resolve(promises[i]).then(
        (value) => {
          // 只要有一个Promise成功，就解析返回的Promise
          resolve(value);
        },
        (reason) => {
          // 记录错误
          errors[i] = reason;
          rejectedCount++;

          // 所有Promise都失败后，拒绝返回的Promise
          if (rejectedCount === len) {
            reject(new AggregateError(errors, "All promises were rejected"));
          }
        }
      );
    }
  });
};

// 测试MyPromise的基本功能
function testMyPromise() {
  console.log("测试基本Promise功能:");

  // 创建一个会成功的Promise
  const successPromise = new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve("成功了!");
    }, 100);
  });

  successPromise.then(
    (value) => console.log("成功:", value),
    (reason) => console.log("失败:", reason)
  );

  // 创建一个会失败的Promise
  const failPromise = new MyPromise((resolve, reject) => {
    setTimeout(() => {
      reject("失败了!");
    }, 200);
  });

  failPromise
    .then(
      (value) => console.log("成功:", value),
      (reason) => {
        console.log("失败:", reason);
        return "失败后返回的值";
      }
    )
    .then((value) => console.log("链式调用结果:", value));

  // 测试异常处理
  const errorPromise = new MyPromise((resolve, reject) => {
    throw new Error("执行器中的错误");
  });

  errorPromise.catch((err) => {
    console.log("捕获到异常:", err.message);
  });

  // 测试链式调用
  new MyPromise((resolve) => resolve(1))
    .then((value) => {
      console.log("链式调用1:", value);
      return value + 1;
    })
    .then((value) => {
      console.log("链式调用2:", value);
      return value + 1;
    })
    .then((value) => {
      console.log("链式调用3:", value);
    });

  // 测试静态方法
  console.log("\n测试静态方法:");

  MyPromise.resolve("直接解析的值").then((value) => {
    console.log("MyPromise.resolve 结果:", value);
  });

  MyPromise.reject("直接拒绝的原因").catch((reason) => {
    console.log("MyPromise.reject 结果:", reason);
  });

  // 测试MyPromise.all
  const promises = [
    MyPromise.resolve(1),
    new MyPromise((resolve) => setTimeout(() => resolve(2), 100)),
    3,
  ];

  MyPromise.all(promises).then(
    (values) => console.log("MyPromise.all 成功结果:", values),
    (reason) => console.log("MyPromise.all 失败原因:", reason)
  );

  // 测试MyPromise.race
  MyPromise.race(promises).then(
    (value) => console.log("MyPromise.race 结果:", value),
    (reason) => console.log("MyPromise.race 失败原因:", reason)
  );

  // 测试MyPromise.allSettled
  const mixedPromises = [
    MyPromise.resolve(1),
    MyPromise.reject("错误"),
    new MyPromise((resolve) => setTimeout(() => resolve(3), 100)),
  ];

  MyPromise.allSettled(mixedPromises).then(
    (results) =>
      console.log("MyPromise.allSettled 结果:", JSON.stringify(results)),
    (reason) => console.log("这不应该发生:", reason)
  );

  // 测试MyPromise.any
  MyPromise.any(mixedPromises).then(
    (value) => console.log("MyPromise.any 结果:", value),
    (error) => console.log("MyPromise.any 所有Promise都失败:", error)
  );
}

// 运行测试
testMyPromise();

/**
 * Promise手写实现总结：
 *
 * 1. 核心概念：
 *    - Promise是一个代表异步操作最终完成或失败的对象
 *    - Promise有三种状态：pending(进行中)、fulfilled(已成功)、rejected(已失败)
 *    - 一旦状态改变，就不会再变，任何时候都可以得到这个结果
 *
 * 2. 实现难点：
 *    - 确保Promise/A+规范兼容性，特别是then方法的链式调用
 *    - 正确处理异步操作和回调队列
 *    - 实现Promise的异步特性（使用微任务队列）
 *    - 正确处理thenable对象和Promise之间的交互
 *
 * 3. 关键方法：
 *    - then(): 添加成功和失败回调，返回新的Promise
 *    - catch(): 专门处理失败情况
 *    - finally(): 无论成功失败都会执行
 *    - 静态方法：resolve, reject, all, race, allSettled, any
 *
 * 4. 面试要点：
 *    - 理解Promise的状态转换机制和异步特性
 *    - 掌握then方法的实现和链式调用原理
 *    - 了解Promise A+规范的核心要求
 *    - 能够说明各种静态方法的实现差异
 *    - 理解微任务在Promise实现中的作用
 */

module.exports = MyPromise;
