/**
 * 函数记忆化 (Function Memoization)
 *
 * 作用：缓存函数的计算结果，避免重复计算。
 * 应用场景：优化递归计算、减少API调用、复杂计算优化等。
 */

/**
 * 基础版记忆化函数
 * 使用简单的键值对缓存结果
 *
 * @param {Function} fn - 需要记忆化的函数
 * @return {Function} - 记忆化后的函数
 */
function memoize(fn) {
  // 创建一个缓存对象
  const cache = {};

  // 返回记忆化后的函数
  return function (...args) {
    // 将参数转换为字符串作为缓存的键
    const key = JSON.stringify(args);

    // 如果缓存中已有结果，则直接返回
    if (key in cache) {
      return cache[key];
    }

    // 否则调用原函数，并缓存结果
    const result = fn.apply(this, args);
    cache[key] = result;

    return result;
  };
}

/**
 * 高级记忆化函数
 * 支持自定义缓存键的生成和最大缓存数
 *
 * @param {Function} fn - 需要记忆化的函数
 * @param {Object} options - 配置选项
 * @param {Function} options.resolver - 自定义键生成函数，默认使用JSON.stringify
 * @param {Number} options.maxSize - 最大缓存条目数量，默认无限制
 * @return {Function} - 记忆化后的函数
 */
function advancedMemoize(fn, options = {}) {
  // 设置默认选项
  const { resolver = (args) => JSON.stringify(args), maxSize = Infinity } =
    options;

  // 缓存对象和使用顺序记录
  const cache = new Map();
  const usage = new Map(); // 记录每个键的最后使用时间
  let callCount = 0;

  // 返回记忆化后的函数
  return function (...args) {
    // 使用自定义resolver生成缓存键
    const key = resolver(args);
    callCount++;

    // 如果缓存中存在该键
    if (cache.has(key)) {
      // 更新使用记录
      usage.set(key, callCount);
      // 返回缓存的结果
      return cache.get(key);
    }

    // 计算新结果
    const result = fn.apply(this, args);

    // 如果达到最大缓存数量，需要清理最久未使用的条目
    if (cache.size >= maxSize) {
      // 找出最久未使用的键
      let oldest = null;
      let oldestCount = Infinity;

      for (const [cacheKey, usageCount] of usage.entries()) {
        if (usageCount < oldestCount) {
          oldest = cacheKey;
          oldestCount = usageCount;
        }
      }

      // 如果找到最久未使用的键，则从缓存中移除
      if (oldest !== null) {
        cache.delete(oldest);
        usage.delete(oldest);
      }
    }

    // 缓存新结果并更新使用记录
    cache.set(key, result);
    usage.set(key, callCount);

    return result;
  };
}

/**
 * 支持单参数函数的简单记忆化
 * 针对只有一个参数的函数优化的记忆化实现
 *
 * @param {Function} fn - 需要记忆化的单参数函数
 * @return {Function} - 记忆化后的函数
 */
function memoizeOne(fn) {
  // 使用Map作为缓存，适合各种类型的键
  const cache = new Map();

  return function (arg) {
    // 对于单参数函数，直接使用参数作为键
    if (cache.has(arg)) {
      return cache.get(arg);
    }

    const result = fn.call(this, arg);
    cache.set(arg, result);

    return result;
  };
}

/**
 * 支持异步函数的记忆化
 * 可以记忆化返回Promise的函数
 *
 * @param {Function} fn - 需要记忆化的异步函数
 * @return {Function} - 记忆化后的异步函数
 */
function asyncMemoize(fn) {
  const cache = new Map();

  return async function (...args) {
    const key = JSON.stringify(args);

    // 检查缓存中是否已有此Promise的结果
    if (cache.has(key)) {
      return cache.get(key);
    }

    try {
      // 执行异步函数并等待结果
      const result = await fn.apply(this, args);
      // 缓存成功的结果
      cache.set(key, result);
      return result;
    } catch (error) {
      // 不缓存错误，直接抛出
      throw error;
    }
  };
}

// 测试函数记忆化
function testMemoize() {
  // 斐波那契数列计算函数（未优化，指数时间复杂度）
  function fibonacci(n) {
    console.log(`计算fibonacci(${n})`);
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  // 使用记忆化优化后的斐波那契函数
  const memoizedFib = (function () {
    const memo = {};

    function fib(n) {
      console.log(`计算memoizedFib(${n})`);
      if (n in memo) return memo[n];
      if (n <= 1) return n;

      memo[n] = fib(n - 1) + fib(n - 2);
      return memo[n];
    }

    return fib;
  })();

  // 使用我们的memoize函数优化
  function simpleFib(n) {
    console.log(`计算simpleFib(${n})`);
    if (n <= 1) return n;
    return simpleFib(n - 1) + simpleFib(n - 2);
  }

  const memoSimpleFib = memoize(simpleFib);

  // 测试常规斐波那契计算（会导致大量重复计算）
  console.log("\n常规斐波那契计算(n=5):");
  console.time("Regular Fibonacci");
  console.log(`结果: ${fibonacci(5)}`);
  console.timeEnd("Regular Fibonacci");

  // 测试手动记忆化的斐波那契
  console.log("\n手动记忆化的斐波那契(n=10):");
  console.time("Manual Memoized Fibonacci");
  console.log(`结果: ${memoizedFib(10)}`);
  console.timeEnd("Manual Memoized Fibonacci");

  // 测试使用memoize函数优化的斐波那契
  console.log("\n使用memoize函数优化的斐波那契(n=10):");
  console.time("Memoize Function");
  console.log(`结果: ${memoSimpleFib(10)}`);
  console.timeEnd("Memoize Function");

  // 测试重复调用
  console.log("\n测试重复调用缓存结果:");
  console.log(`再次调用: ${memoSimpleFib(10)}`); // 应该直接从缓存返回

  // 测试高级记忆化功能
  console.log("\n测试高级记忆化功能:");

  // 模拟昂贵的API调用
  let apiCallCount = 0;
  function expensiveApiCall(userId, productId) {
    apiCallCount++;
    console.log(
      `执行API调用 #${apiCallCount}: userId=${userId}, productId=${productId}`
    );
    return {
      data: `用户${userId}的产品${productId}信息`,
      timestamp: Date.now(),
    };
  }

  // 自定义键生成器，只基于userId做缓存
  const userBasedMemoize = advancedMemoize(expensiveApiCall, {
    resolver: (args) => args[0], // 只使用第一个参数(userId)作为键
    maxSize: 2, // 最多缓存2个用户的结果
  });

  console.log("第一次调用user1:", userBasedMemoize(1, 100));
  console.log("第二次调用user1(不同产品):", userBasedMemoize(1, 200)); // 应从缓存返回
  console.log("调用user2:", userBasedMemoize(2, 100)); // 新用户，执行API调用
  console.log("调用user3:", userBasedMemoize(3, 100)); // 超出缓存限制，执行API调用
  console.log("再次调用user1:", userBasedMemoize(1, 300)); // user1应该还在缓存中
  console.log("调用user2:", userBasedMemoize(2, 200)); // user2应该不在缓存中，被user3替换了

  // 测试异步记忆化
  console.log("\n测试异步记忆化:");

  // 模拟异步API调用
  let asyncCallCount = 0;
  async function fetchUserData(userId) {
    asyncCallCount++;
    console.log(`执行异步调用 #${asyncCallCount}: userId=${userId}`);

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 100));

    return { id: userId, name: `用户${userId}`, lastUpdated: Date.now() };
  }

  const memoizedFetch = asyncMemoize(fetchUserData);

  // 使用async/await执行异步测试
  (async () => {
    console.log("第一次获取user1:", await memoizedFetch(1));
    console.log("第二次获取user1:", await memoizedFetch(1)); // 应从缓存返回
    console.log("获取user2:", await memoizedFetch(2)); // 新用户，执行异步调用
    console.log("再次获取user1:", await memoizedFetch(1)); // 应从缓存返回
  })();
}

// 展示记忆化的真实应用
function memoizeApplications() {
  console.log("\n记忆化的真实应用示例:");

  // 1. 缓存计算密集型操作
  function calculateDistance(pointA, pointB) {
    console.log("计算两点间距离...");
    // 使用欧几里得距离公式
    const dx = pointB.x - pointA.x;
    const dy = pointB.y - pointA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  const memoizedDistance = memoize(calculateDistance);

  const pointA = { x: 0, y: 0 };
  const pointB = { x: 3, y: 4 };

  console.log("第一次计算距离:", memoizedDistance(pointA, pointB));
  console.log("再次计算相同距离:", memoizedDistance(pointA, pointB));
  console.log("不同点的距离:", memoizedDistance(pointA, { x: 6, y: 8 }));

  // 2. 优化DOM查询
  if (typeof document !== "undefined") {
    const getElementInfo = memoize((selector) => {
      console.log(`查询DOM元素: ${selector}`);
      const element = document.querySelector(selector);
      if (!element) return null;

      // 获取元素的各种计算属性
      const styles = window.getComputedStyle(element);
      return {
        width: styles.width,
        height: styles.height,
        position: styles.position,
        visibility: styles.visibility,
      };
    });

    // 在浏览器环境中可以测试DOM查询
    console.log("假设DOM查询示例...");
    console.log('getElementInfo("#header") 调用1次、2次会复用结果');
  }

  // 3. 递归算法优化 - 动态规划问题
  // 找零钱问题：给定一些面额的硬币和一个总金额，求最少需要多少个硬币
  function coinChange(coins, amount) {
    console.log(`计算coinChange(${amount})`);
    if (amount === 0) return 0;
    if (amount < 0) return -1;

    let minCoins = Infinity;

    for (const coin of coins) {
      const subproblem = coinChange(coins, amount - coin);
      if (subproblem !== -1) {
        minCoins = Math.min(minCoins, subproblem + 1);
      }
    }

    return minCoins === Infinity ? -1 : minCoins;
  }

  const memoizedCoinChange = (function () {
    const memo = {};

    return function (coins, amount) {
      // 使用金额作为键
      const key = amount;

      if (key in memo) return memo[key];

      console.log(`计算memoizedCoinChange(${amount})`);
      if (amount === 0) return 0;
      if (amount < 0) return -1;

      let minCoins = Infinity;

      for (const coin of coins) {
        const subproblem = memoizedCoinChange(coins, amount - coin);
        if (subproblem !== -1) {
          minCoins = Math.min(minCoins, subproblem + 1);
        }
      }

      memo[key] = minCoins === Infinity ? -1 : minCoins;
      return memo[key];
    };
  })();

  console.log("\n求解找零钱问题:");
  const coins = [1, 2, 5];
  const amount = 11;

  console.log("未优化解法:");
  console.time("未优化解法");
  // 对于较大的金额，未优化版本会超时，这里用一个小额测试
  console.log(`最少需要 ${coinChange(coins, 7)} 个硬币`);
  console.timeEnd("未优化解法");

  console.log("记忆化解法:");
  console.time("记忆化解法");
  console.log(`最少需要 ${memoizedCoinChange(coins, amount)} 个硬币`);
  console.timeEnd("记忆化解法");
}

// 运行测试和应用示例
testMemoize();
memoizeApplications();

/**
 * 函数记忆化实现总结：
 *
 * 1. 核心原理：
 *    函数记忆化是一种优化技术，通过缓存函数调用结果，避免重复计算，从而提高性能。
 *    特别适用于纯函数（相同输入总是产生相同输出，且无副作用）。
 *
 * 2. 实现方式：
 *    - 基础版：使用对象或Map存储函数调用结果，以参数字符串化值作为键
 *    - 高级版：支持自定义键生成函数、缓存大小限制和缓存淘汰策略
 *    - 特殊版：针对单参数函数或异步函数优化的实现
 *
 * 3. 关键考虑点：
 *    - 键的生成方式：如何将函数参数转换为缓存键
 *    - 缓存策略：缓存大小限制、淘汰策略（LRU、FIFO等）
 *    - 适用场景：函数必须是纯函数，否则可能导致错误结果
 *    - 内存占用：大型缓存可能导致内存占用过高
 *
 * 4. 应用场景：
 *    - 递归计算：如斐波那契数列、动态规划问题
 *    - API调用缓存：减少重复网络请求
 *    - 昂贵的计算操作：如图形渲染、复杂数学计算
 *    - DOM操作：缓存DOM查询结果
 *
 * 5. 面试要点：
 *    - 理解记忆化的基本原理和适用条件
 *    - 能够实现基本的记忆化函数
 *    - 懂得缓存键生成和管理的策略
 *    - 了解何时应该使用记忆化以及可能的缺点
 *    - 能够结合实际例子说明记忆化的好处
 */

module.exports = {
  memoize,
  advancedMemoize,
  memoizeOne,
  asyncMemoize,
};
