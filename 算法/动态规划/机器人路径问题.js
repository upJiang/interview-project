/**
 * 机器人路径问题
 * 
 * 题目描述：
 * 一个机器人位于一个 m x n 网格的左上角（起始点在下图中标记为"开始"）。
 * 机器人每次只能向下或者向右移动一步。机器人试图达到网格的右下角（在下图中标记为"结束"）。
 * 问总共有多少条不同的路径？
 * 
 * 示例 1:
 * 输入: m = 3, n = 7
 * 输出: 28
 * 
 * 示例 2:
 * 输入: m = 3, n = 2
 * 输出: 3
 * 解释:
 * 从左上角开始，总共有 3 条路径可以到达右下角。
 * 1. 向右 -> 向下 -> 向下
 * 2. 向下 -> 向右 -> 向下
 * 3. 向下 -> 向下 -> 向右
 */

/**
 * 方法一：动态规划（二维数组）
 * 
 * 思路：
 * 1. 创建二维dp数组，dp[i][j]表示从起点到达位置(i,j)的路径数
 * 2. 初始条件：第一行和第一列的位置只能有一条路径到达，所以dp[0][j] = dp[i][0] = 1
 * 3. 状态转移方程：dp[i][j] = dp[i-1][j] + dp[i][j-1]
 *    (当前位置的路径数 = 从上方来的路径数 + 从左方来的路径数)
 * 
 * 时间复杂度：O(m*n)
 * 空间复杂度：O(m*n)
 * 
 * @param {number} m - 网格的行数
 * @param {number} n - 网格的列数
 * @return {number} 不同路径的数量
 */
function uniquePaths(m, n) {
  // 创建二维dp数组并初始化为0
  const dp = Array(m).fill().map(() => Array(n).fill(0));
  
  // 初始化第一行和第一列
  for (let i = 0; i < m; i++) {
    dp[i][0] = 1;
  }
  for (let j = 0; j < n; j++) {
    dp[0][j] = 1;
  }
  
  // 填充dp数组
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
    }
  }
  
  // 返回右下角的值
  return dp[m - 1][n - 1];
}

/**
 * 方法二：动态规划（空间优化 - 一维数组）
 * 
 * 思路：
 * 1. 由于当前位置只依赖上方和左方的值，可以使用一维数组优化空间
 * 2. dp[j]表示到达位置(i,j)的路径数，在每一行的遍历中更新
 * 3. 初始条件：一维数组dp初始化为1，表示第一行的所有位置路径数都为1
 * 4. 状态转移方程：dp[j] += dp[j-1]
 *    (当前dp[j]是上一行的值，dp[j-1]是当前行左侧的值)
 * 
 * 时间复杂度：O(m*n)
 * 空间复杂度：O(n)
 * 
 * @param {number} m - 网格的行数
 * @param {number} n - 网格的列数
 * @return {number} 不同路径的数量
 */
function uniquePathsOptimized(m, n) {
  // 创建一维dp数组并初始化为1（第一行的所有位置路径数都为1）
  const dp = new Array(n).fill(1);
  
  // 逐行更新dp数组
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      // dp[j] 是上方值，dp[j-1] 是左方值
      dp[j] += dp[j - 1];
    }
  }
  
  // 返回右下角的值
  return dp[n - 1];
}

/**
 * 方法三：数学方法（组合数学）
 * 
 * 思路：
 * 从左上角到右下角，总共需要移动 m-1 次向下和 n-1 次向右。
 * 所以总共需要移动 (m-1) + (n-1) = m+n-2 次。
 * 问题可以转化为：在 m+n-2 次移动中，选择 m-1 次向下移动（或选择 n-1 次向右移动）的方式数量。
 * 这是一个组合问题，答案是组合数 C(m+n-2, m-1) = C(m+n-2, n-1)
 * 
 * 时间复杂度：O(min(m,n))
 * 空间复杂度：O(1)
 * 
 * @param {number} m - 网格的行数
 * @param {number} n - 网格的列数
 * @return {number} 不同路径的数量
 */
function uniquePathsMath(m, n) {
  // 为了减少计算量，选择较小的数字作为组合数公式中的k
  const small = Math.min(m - 1, n - 1);
  const large = Math.max(m - 1, n - 1);
  const total = m + n - 2;
  
  // 计算组合数 C(total, small) = total! / (small! * (total - small)!)
  // 优化计算方式: C(total, small) = (total - small + 1) * ... * total / 1 * ... * small
  let result = 1;
  
  for (let i = 1; i <= small; i++) {
    // 使用浮点数运算避免整数溢出
    result = result * (total - small + i) / i;
  }
  
  return Math.round(result);
}

/**
 * 方法四：递归解法（带记忆化 - 用于理解问题）
 * 
 * 思路：
 * 1. 使用递归计算到达每个位置的路径数
 * 2. 使用记忆化数组避免重复计算
 * 
 * 时间复杂度：O(m*n)
 * 空间复杂度：O(m*n)
 * 
 * @param {number} m - 网格的行数
 * @param {number} n - 网格的列数
 * @return {number} 不同路径的数量
 */
function uniquePathsRecursive(m, n) {
  // 创建记忆化数组
  const memo = Array(m).fill().map(() => Array(n).fill(-1));
  
  function dp(i, j) {
    // 基本情况
    if (i === 0 || j === 0) {
      return 1;
    }
    
    // 如果已经计算过，直接返回结果
    if (memo[i][j] !== -1) {
      return memo[i][j];
    }
    
    // 计算当前位置的路径数
    memo[i][j] = dp(i - 1, j) + dp(i, j - 1);
    return memo[i][j];
  }
  
  return dp(m - 1, n - 1);
}

/**
 * 打印二维DP数组计算过程
 * 
 * @param {number} m - 网格的行数
 * @param {number} n - 网格的列数
 */
function printDPGrid(m, n) {
  console.log(`\n计算 ${m}x${n} 网格的路径数：`);
  
  // 创建并初始化dp数组
  const dp = Array(m).fill().map(() => Array(n).fill(0));
  
  // 初始化第一行和第一列
  for (let i = 0; i < m; i++) {
    dp[i][0] = 1;
  }
  for (let j = 0; j < n; j++) {
    dp[0][j] = 1;
  }
  
  console.log("初始化后的dp数组：");
  for (let i = 0; i < m; i++) {
    console.log(dp[i].join("\t"));
  }
  
  // 填充dp数组
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
      console.log(`计算dp[${i}][${j}] = dp[${i-1}][${j}](${dp[i-1][j]}) + dp[${i}][${j-1}](${dp[i][j-1]}) = ${dp[i][j]}`);
    }
  }
  
  console.log("\n最终的dp数组：");
  for (let i = 0; i < m; i++) {
    console.log(dp[i].join("\t"));
  }
  
  console.log(`\n从左上角到右下角共有 ${dp[m-1][n-1]} 条不同路径`);
  return dp[m - 1][n - 1];
}

/**
 * 打印一维DP数组优化过程
 * 
 * @param {number} m - 网格的行数
 * @param {number} n - 网格的列数
 */
function printDPOptimized(m, n) {
  console.log(`\n使用一维数组计算 ${m}x${n} 网格的路径数：`);
  
  // 创建一维dp数组并初始化为1
  const dp = new Array(n).fill(1);
  console.log(`初始化dp数组（第0行）: [${dp.join(', ')}]`);
  
  // 逐行更新dp数组
  for (let i = 1; i < m; i++) {
    console.log(`\n计算第${i}行：`);
    for (let j = 1; j < n; j++) {
      // dp[j] 是上方值，dp[j-1] 是左方值
      const topValue = dp[j];
      const leftValue = dp[j - 1];
      dp[j] += dp[j - 1];
      console.log(`dp[${j}] = ${topValue} + ${leftValue} = ${dp[j]}`);
    }
    console.log(`第${i}行计算后: [${dp.join(', ')}]`);
  }
  
  console.log(`\n从左上角到右下角共有 ${dp[n-1]} 条不同路径`);
  return dp[n - 1];
}

// 测试用例
console.log("二维动态规划解法:");
console.log(`3x7网格的路径数: ${uniquePaths(3, 7)}`); // 28
console.log(`3x2网格的路径数: ${uniquePaths(3, 2)}`); // 3
console.log(`7x3网格的路径数: ${uniquePaths(7, 3)}`); // 28
console.log(`3x3网格的路径数: ${uniquePaths(3, 3)}`); // 6

console.log("\n一维数组优化解法:");
console.log(`3x7网格的路径数: ${uniquePathsOptimized(3, 7)}`); // 28
console.log(`3x2网格的路径数: ${uniquePathsOptimized(3, 2)}`); // 3
console.log(`7x3网格的路径数: ${uniquePathsOptimized(7, 3)}`); // 28
console.log(`3x3网格的路径数: ${uniquePathsOptimized(3, 3)}`); // 6

console.log("\n数学方法解法:");
console.log(`3x7网格的路径数: ${uniquePathsMath(3, 7)}`); // 28
console.log(`3x2网格的路径数: ${uniquePathsMath(3, 2)}`); // 3
console.log(`7x3网格的路径数: ${uniquePathsMath(7, 3)}`); // 28
console.log(`3x3网格的路径数: ${uniquePathsMath(3, 3)}`); // 6

console.log("\n递归解法（带记忆化）:");
console.log(`3x7网格的路径数: ${uniquePathsRecursive(3, 7)}`); // 28
console.log(`3x2网格的路径数: ${uniquePathsRecursive(3, 2)}`); // 3

// 可视化DP过程（仅对小网格进行可视化）
printDPGrid(3, 3);
printDPOptimized(3, 3);

/**
 * 3x7网格的分析:
 * 
 * 二维DP数组的填充过程:
 * 1 1 1 1 1 1 1  <- 第一行初始化为1（只能从左边来）
 * 1 2 3 4 5 6 7  <- 第二行：每个位置 = 上方的值 + 左方的值
 * 1 3 6 10 15 21 28 <- 第三行：同样计算
 * 
 * 一维DP数组的优化过程:
 * 初始化: [1, 1, 1, 1, 1, 1, 1]  <- 表示第一行
 * 
 * 计算第1行:
 * - dp[1] = 1 + 1 = 2
 * - dp[2] = 1 + 2 = 3
 * ...
 * - dp[6] = 1 + 6 = 7
 * 第1行结果: [1, 2, 3, 4, 5, 6, 7]
 * 
 * 计算第2行:
 * - dp[1] = 1 + 1 = 2
 * - dp[2] = 2 + 3 = 5
 * ...
 * - dp[6] = 7 + 21 = 28
 * 第2行结果: [1, 3, 6, 10, 15, 21, 28]
 * 
 * 最终结果: dp[6] = 28
 */

/**
 * 总结:
 * 
 * 1. 二维动态规划:
 *    - 直观理解网格路径问题
 *    - 时间和空间复杂度都是O(m*n)
 * 
 * 2. 一维数组优化:
 *    - 减少空间复杂度到O(n)
 *    - 利用每次计算只依赖上方和左方的值
 * 
 * 3. 数学方法:
 *    - 最高效的解法，复杂度为O(min(m,n))
 *    - 将问题转化为组合数学问题
 * 
 * 4. 递归解法:
 *    - 更容易理解问题的本质
 *    - 需要记忆化优化以避免重复计算
 * 
 * 5. 机器人路径问题是动态规划的经典应用，关键在于:
 *    - 确定状态定义（到达位置(i,j)的路径数）
 *    - 确定初始条件（第一行和第一列都是1）
 *    - 确定状态转移方程（dp[i][j] = dp[i-1][j] + dp[i][j-1]）
 */ 