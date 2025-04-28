/**
 * 函数柯里化 (Function Currying)
 *
 * 作用：将一个接受多个参数的函数转换为一系列使用一个参数的函数。
 * 应用场景：参数复用、延迟执行、函数式编程。
 */

/**
 * 基础版柯里化函数
 * 固定参数个数的柯里化实现
 *
 * @param {Function} fn - 要柯里化的函数
 * @param {Number} arity - 函数参数的个数，默认为原函数的参数个数
 * @return {Function} - 柯里化后的函数
 */
function curry(fn, arity = fn.length) {
  // 定义辅助函数，收集已传入的参数
  function curried(...args) {
    // 如果已传入的参数个数大于等于原函数需要的参数个数，则执行原函数
    if (args.length >= arity) {
      return fn(...args);
    }

    // 否则，返回一个新函数，继续收集参数
    return function (...moreArgs) {
      // 将已有参数和新参数合并，递归调用柯里化函数
      return curried(...args, ...moreArgs);
    };
  }

  return curried;
}

/**
 * 高级柯里化函数
 * 支持占位符，可以跳过某些参数
 *
 * @param {Function} fn - 要柯里化的函数
 * @param {*} placeholder - 占位符，默认为undefined
 * @return {Function} - 柯里化后的函数
 */
function curryWithPlaceholder(fn, placeholder = undefined) {
  // 获取原函数的参数个数
  const arity = fn.length;

  // 定义辅助函数，收集参数，并处理占位符
  function curried(...args) {
    // 检查是否已收集到足够有效的参数
    // 有效参数：不是占位符的参数，或者对应位置有值的参数
    const isComplete =
      args.length >= arity &&
      args.slice(0, arity).every((arg, i) => arg !== placeholder);

    // 如果参数已足够，执行原函数
    if (isComplete) {
      return fn(...args);
    }

    // 否则返回新函数继续收集参数
    return function (...moreArgs) {
      // 将当前参数和新参数进行合并，处理占位符
      const combinedArgs = args.map((arg, i) =>
        // 如果当前参数是占位符，且有对应的新参数，则使用新参数
        arg === placeholder && i < moreArgs.length ? moreArgs[i] : arg
      );

      // 将剩余的新参数添加到合并后的参数数组
      const remainingArgs = moreArgs.slice(combinedArgs.length);

      // 递归调用，继续收集参数
      return curried(...combinedArgs, ...remainingArgs);
    };
  }

  return curried;
}

/**
 * 自动柯里化函数
 * 不限制参数个数，自动判断何时执行原函数
 *
 * @param {Function} fn - 要柯里化的函数
 * @return {Function} - 柯里化后的函数
 */
function autoCurry(fn) {
  // 定义辅助函数，收集参数
  function curried(...args) {
    // 如果没有参数传入，执行原函数
    if (args.length === 0) {
      return fn(...args);
    }

    // 否则，返回一个新函数，继续收集参数
    return function (...moreArgs) {
      // 如果没有新参数传入，则执行原函数
      if (moreArgs.length === 0) {
        return fn(...args);
      }

      // 否则，递归调用，继续收集参数
      return curried(...args, ...moreArgs);
    };
  }

  return curried;
}

// 测试柯里化函数
function testCurry() {
  // 定义一个求和函数
  function add(a, b, c) {
    return a + b + c;
  }

  console.log("原始函数：add(1, 2, 3) =", add(1, 2, 3));

  // 基础柯里化
  console.log("\n测试基础柯里化:");
  const curriedAdd = curry(add);
  console.log("curriedAdd(1)(2)(3) =", curriedAdd(1)(2)(3));
  console.log("curriedAdd(1, 2)(3) =", curriedAdd(1, 2)(3));
  console.log("curriedAdd(1)(2, 3) =", curriedAdd(1)(2, 3));
  console.log("curriedAdd(1, 2, 3) =", curriedAdd(1, 2, 3));

  // 带占位符的柯里化
  console.log("\n测试带占位符的柯里化:");
  const _ = {}; // 自定义占位符
  const curriedWithPlaceholder = curryWithPlaceholder(add, _);
  console.log(
    "curriedWithPlaceholder(1, _, 3)(2) =",
    curriedWithPlaceholder(1, _, 3)(2)
  );
  console.log(
    "curriedWithPlaceholder(_, 2, _)(1, 3) =",
    curriedWithPlaceholder(_, 2, _)(1, 3)
  );

  // 自动柯里化测试
  console.log("\n测试自动柯里化:");
  function multiplyAll(...args) {
    return args.reduce((acc, val) => acc * val, 1);
  }

  const autoCurried = autoCurry(multiplyAll);
  console.log("autoCurried(1)(2)(3)() =", autoCurried(1)(2)(3)());
  console.log("autoCurried(1, 2)(3, 4)() =", autoCurried(1, 2)(3, 4)());
}

// 运行测试
testCurry();

// 柯里化的实际应用示例
function curryApplications() {
  console.log("\n柯里化的实际应用示例:");

  // 1. 创建特定场景的函数
  const discount = (discountRate) => (price) => price * (1 - discountRate);

  const tenPercentDiscount = discount(0.1);
  const twentyPercentDiscount = discount(0.2);

  console.log(`商品原价100元，打9折后：${tenPercentDiscount(100)}元`);
  console.log(`商品原价100元，打8折后：${twentyPercentDiscount(100)}元`);

  // 2. 事件处理与日志记录
  const log = (level) => (message) => console.log(`[${level}]: ${message}`);

  const infoLog = log("INFO");
  const errorLog = log("ERROR");

  infoLog("应用启动成功");
  errorLog("网络连接失败");

  // 3. 数据处理管道
  const pipe =
    (...fns) =>
    (x) =>
      fns.reduce((v, f) => f(v), x);
  const add10 = (x) => x + 10;
  const multiply2 = (x) => x * 2;
  const subtract5 = (x) => x - 5;

  const compute = pipe(add10, multiply2, subtract5);
  console.log(`对数字5执行计算管道 (((5 + 10) * 2) - 5) = ${compute(5)}`);
}

// 运行实际应用示例
curryApplications();

/**
 * 函数柯里化实现总结：
 *
 * 1. 核心原理：
 *    利用闭包和递归，将一个多参数函数转换为一系列单参数（或部分参数）函数的调用链
 *
 * 2. 实现方式：
 *    - 基础版：固定参数个数，依次收集参数直到达到原函数所需参数个数
 *    - 带占位符：支持参数占位，允许填充任意位置的参数
 *    - 自动柯里化：根据调用方式自动判断何时执行原函数
 *
 * 3. 优点与应用：
 *    - 参数复用：固定部分参数，创建新的特定函数
 *    - 延迟计算：收集完所有参数才执行计算
 *    - 增强可读性：将多参数函数拆分成更小、更具语义化的单元
 *    - 函数式编程：有助于实现函数组合、管道操作等
 *
 * 4. 面试要点：
 *    - 理解闭包在柯里化中的作用
 *    - 掌握基本的参数收集和递归调用逻辑
 *    - 能够实现带占位符的高级柯里化
 *    - 了解柯里化在实际开发中的应用场景
 *    - 能够解释柯里化与偏函数应用的区别
 */

module.exports = {
  curry,
  curryWithPlaceholder,
  autoCurry,
};
