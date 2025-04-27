/**
 * 爬楼梯问题
 * 
 * 题目描述：
 * 假设你正在爬楼梯。需要 n 阶你才能到达楼顶。
 * 每次你可以爬 1 或 2 个台阶。你有多少种不同的方法可以爬到楼顶呢？
 * 注意：给定 n 是一个正整数。
 * 
 * 示例 1：
 * 输入： 2
 * 输出： 2
 * 解释： 有两种方法可以爬到楼顶。
 * 1. 1 阶 + 1 阶
 * 2. 2 阶
 * 
 * 示例 2：
 * 输入： 3
 * 输出： 3
 * 解释： 有三种方法可以爬到楼顶。
 * 1. 1 阶 + 1 阶 + 1 阶
 * 2. 1 阶 + 2 阶
 * 3. 2 阶 + 1 阶
 */

/**
 * 方法一：递归法（不推荐 - 会超时）
 * 
 * 思路：
 * 要到达第n阶，可以从第n-1阶爬1阶，或从第n-2阶爬2阶。
 * 所以到达第n阶的方法数 = 到达第n-1阶的方法数 + 到达第n-2阶的方法数
 * 
 * 时间复杂度：O(2^n) - 指数级，会导致大数据超时
 * 空间复杂度：O(n) - 递归栈的深度
 * 
 * @param {number} n - 楼梯的阶数
 * @return {number} 爬到楼顶的方法数
 */
function climbStairsRecursive(n) {
  // 基本情况
  if (n === 1) {
    return 1;
  }
  if (n === 2) {
    return 2;
  }
  
  // 递归调用
  return climbStairsRecursive(n - 1) + climbStairsRecursive(n - 2);
}

/**
 * 方法二：记忆化递归
 * 
 * 思路：
 * 在递归法的基础上，使用数组来存储已经计算过的结果，避免重复计算
 * 
 * 时间复杂度：O(n) - 每个子问题只计算一次
 * 空间复杂度：O(n) - 记忆数组和递归栈的空间
 * 
 * @param {number} n - 楼梯的阶数
 * @return {number} 爬到楼顶的方法数
 */
function climbStairsMemo(n) {
  // 创建记忆数组，初始值为0
  const memo = new Array(n + 1).fill(0);
  
  function dp(i) {
    // 基本情况
    if (i === 1) {
      return 1;
    }
    if (i === 2) {
      return 2;
    }
    
    // 如果已经计算过，直接返回结果
    if (memo[i] !== 0) {
      return memo[i];
    }
    
    // 计算并存储结果
    memo[i] = dp(i - 1) + dp(i - 2);
    return memo[i];
  }
  
  return dp(n);
}

/**
 * 方法三：动态规划（自底向上）
 * 
 * 思路：
 * 创建一个数组，其中dp[i]表示爬到第i阶的方法数
 * 基本情况：dp[1] = 1, dp[2] = 2
 * 状态转移方程：dp[i] = dp[i-1] + dp[i-2]
 * 
 * 时间复杂度：O(n) - 遍历一次数组
 * 空间复杂度：O(n) - dp数组的空间
 * 
 * @param {number} n - 楼梯的阶数
 * @return {number} 爬到楼顶的方法数
 */
function climbStairsDP(n) {
  // 处理基本情况
  if (n === 1) {
    return 1;
  }
  
  // 创建dp数组
  const dp = new Array(n + 1);
  dp[1] = 1;
  dp[2] = 2;
  
  // 自底向上填充dp数组
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  
  return dp[n];
}

/**
 * 方法四：优化的动态规划（滚动数组）
 * 
 * 思路：
 * 由于每次状态转移只依赖前两个状态，所以不需要存储整个dp数组，
 * 只需要保存两个变量即可
 * 
 * 时间复杂度：O(n) - 遍历一次
 * 空间复杂度：O(1) - 只使用两个变量
 * 
 * @param {number} n - 楼梯的阶数
 * @return {number} 爬到楼顶的方法数
 */
function climbStairs(n) {
  // 处理基本情况
  if (n === 1) {
    return 1;
  }
  
  // 初始化首两阶的方法数
  let first = 1;   // 到达第1阶的方法数
  let second = 2;  // 到达第2阶的方法数
  
  // 从第3阶开始计算
  for (let i = 3; i <= n; i++) {
    const third = first + second;  // 到达第i阶的方法数
    first = second;                // 更新,准备计算下一阶
    second = third;                // 更新,准备计算下一阶
  }
  
  return second;  // 最终second存储的是到达第n阶的方法数
}

/**
 * 方法五：矩阵快速幂（高级解法）
 * 
 * 思路：
 * 将斐波那契数列的递推关系表示成矩阵形式，可以使用矩阵快速幂在O(log n)时间内求解
 * 
 * 时间复杂度：O(log n) - 快速幂的时间复杂度
 * 空间复杂度：O(1) - 只使用常数级别的空间
 * 
 * @param {number} n - 楼梯的阶数
 * @return {number} 爬到楼顶的方法数
 */
function climbStairsMatrix(n) {
  if (n === 1) {
    return 1;
  }
  
  // 矩阵乘法函数
  function multiply(a, b) {
    const c = new Array(2).fill(0).map(() => new Array(2).fill(0));
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        for (let k = 0; k < 2; k++) {
          c[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    return c;
  }
  
  // 矩阵快速幂函数
  function pow(a, n) {
    let ret = [[1, 0], [0, 1]]; // 初始化为单位矩阵
    while (n > 0) {
      if (n & 1) { // 如果n的二进制最低位为1
        ret = multiply(ret, a);
      }
      a = multiply(a, a);
      n >>= 1; // n右移一位，相当于n除以2
    }
    return ret;
  }
  
  // 基本矩阵
  const baseMatrix = [[1, 1], [1, 0]];
  // 计算矩阵的n-1次幂
  const result = pow(baseMatrix, n - 1);
  // 返回结果 (1*result[0][0] + 1*result[0][1])
  return result[0][0] + result[0][1];
}

/**
 * 方法六：公式法 - 使用斐波那契数列通项公式
 * 
 * 思路：
 * 爬楼梯问题实际上是求斐波那契数列的第n+1项
 * 可以直接使用斐波那契数列的通项公式
 * 
 * 时间复杂度：O(1) - 直接计算
 * 空间复杂度：O(1) - 只使用常数级别的空间
 * 
 * @param {number} n - 楼梯的阶数
 * @return {number} 爬到楼顶的方法数
 */
function climbStairsFormula(n) {
  const sqrt5 = Math.sqrt(5);
  const fibn = Math.pow((1 + sqrt5) / 2, n + 1) - Math.pow((1 - sqrt5) / 2, n + 1);
  return Math.round(fibn / sqrt5);
}

// 测试不同方法的结果
const testCases = [2, 3, 5, 10, 20];

console.log("爬楼梯问题 - 不同方法的结果比较：");
console.log("-------------------------------------");
console.log("n\t递归法\t记忆化递归\t动态规划\t优化DP\t矩阵快速幂\t公式法");

for (const n of testCases) {
  let recursiveResult = "超时";
  if (n <= 10) { // 避免大数递归超时
    recursiveResult = climbStairsRecursive(n);
  }
  
  console.log(`${n}\t${recursiveResult}\t${climbStairsMemo(n)}\t\t${climbStairsDP(n)}\t\t${climbStairs(n)}\t${climbStairsMatrix(n)}\t\t${climbStairsFormula(n)}`);
}

// 时间效率测试
console.log("\n时间效率测试（n = 40）：");
console.log("-------------------------------------");

const largeN = 40;

// 记忆化递归测试
console.time("记忆化递归");
climbStairsMemo(largeN);
console.timeEnd("记忆化递归");

// 动态规划测试
console.time("动态规划");
climbStairsDP(largeN);
console.timeEnd("动态规划");

// 优化的动态规划测试
console.time("优化的动态规划");
climbStairs(largeN);
console.timeEnd("优化的动态规划");

// 矩阵快速幂测试
console.time("矩阵快速幂");
climbStairsMatrix(largeN);
console.timeEnd("矩阵快速幂");

// 公式法测试
console.time("公式法");
climbStairsFormula(largeN);
console.timeEnd("公式法");

/**
 * 总结：
 * 
 * 1. 递归法：最直观，但时间复杂度高，会导致大数据超时
 * 2. 记忆化递归：在递归的基础上优化，解决了重复计算问题
 * 3. 动态规划：自底向上的解法，时间复杂度低
 * 4. 优化的动态规划：只保存必要的状态，空间复杂度优化为O(1)
 * 5. 矩阵快速幂：高级解法，可以在O(log n)时间内求解
 * 6. 公式法：直接使用通项公式，但可能存在浮点数精度问题
 * 
 * 在实际应用中，优化的动态规划（滚动数组）方法由于简单且高效，是最常用的解法。
 * 如果在极端大数下，可以考虑使用矩阵快速幂或公式法，但需要注意精度问题。
 */ 