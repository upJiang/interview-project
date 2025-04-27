/**
 * 不相邻元素的最大和
 * 
 * 题目描述：
 * 给定一个非负整数数组，找到一个子序列，使得选出的元素不相邻且元素和最大。
 * 
 * 示例 1：
 * 输入：[1, 2, 3, 1]
 * 输出：4
 * 解释：选择索引 1 和 3 处的元素 (从0开始)，它们的和是 2 + 1 = 4，且它们不相邻。
 * 
 * 示例 2：
 * 输入：[2, 7, 9, 3, 1]
 * 输出：12
 * 解释：选择索引 1、3 和 4 处的元素 (从0开始)，它们的和是 7 + 3 + 1 = 11，且它们不相邻。
 * 
 * 示例 3：
 * 输入：[1, 2, 1, 4]
 * 输出：5
 * 解释：选择索引 1 和 3 处的元素 (从0开始)，它们的和是 2 + 4 = 6，且它们不相邻。
 */

/**
 * 方法一：动态规划
 * 
 * 思路：
 * 1. 定义状态：dp[i]表示前i个元素中选择不相邻元素能得到的最大和
 * 2. 状态转移方程：
 *    - 对于当前元素nums[i-1]，有两种选择：
 *      a. 不选择当前元素：dp[i] = dp[i-1]
 *      b. 选择当前元素（意味着不能选择前一个元素）：dp[i] = dp[i-2] + nums[i-1]
 *    - 取两种情况的最大值：dp[i] = Math.max(dp[i-1], dp[i-2] + nums[i-1])
 * 3. 初始状态：
 *    - dp[0] = 0（没有元素可选）
 *    - dp[1] = nums[0]（只有一个元素时，最大和就是该元素）
 * 
 * 时间复杂度：O(n)，其中n是数组的长度
 * 空间复杂度：O(n)，需要dp数组存储状态
 * 
 * @param {number[]} nums - 非负整数数组
 * @return {number} 不相邻元素的最大和
 */
function maxNonAdjacentSum(nums) {
  // 处理边界情况
  if (!nums || nums.length === 0) {
    return 0;
  }
  
  if (nums.length === 1) {
    return nums[0];
  }
  
  // 创建dp数组
  const dp = new Array(nums.length + 1).fill(0);
  
  // 初始状态
  dp[0] = 0;
  dp[1] = nums[0];
  
  // 动态规划填表
  for (let i = 2; i <= nums.length; i++) {
    // 转移方程：当前元素是否选择的两种情况取最大值
    dp[i] = Math.max(dp[i-1], dp[i-2] + nums[i-1]);
  }
  
  return dp[nums.length];
}

/**
 * 方法二：空间优化的动态规划
 * 
 * 思路：
 * 由于当前状态只依赖于前两个状态，可以使用两个变量来代替整个dp数组，减少空间使用
 * 
 * 时间复杂度：O(n)，其中n是数组的长度
 * 空间复杂度：O(1)，只使用了常数个变量
 * 
 * @param {number[]} nums - 非负整数数组
 * @return {number} 不相邻元素的最大和
 */
function maxNonAdjacentSumOptimized(nums) {
  // 处理边界情况
  if (!nums || nums.length === 0) {
    return 0;
  }
  
  if (nums.length === 1) {
    return nums[0];
  }
  
  // 使用两个变量代替dp数组
  let prevMax = 0;        // 相当于dp[i-2]
  let currMax = nums[0];  // 相当于dp[i-1]
  
  // 动态规划过程
  for (let i = 1; i < nums.length; i++) {
    // 保存当前的currMax，用于下一次迭代
    const temp = currMax;
    
    // 更新currMax
    currMax = Math.max(currMax, prevMax + nums[i]);
    
    // 更新prevMax
    prevMax = temp;
  }
  
  return currMax;
}

/**
 * 方法三：回溯法（适用于小规模数据，用于理解问题）
 * 
 * 思路：
 * 尝试每个位置选或不选的所有可能组合
 * 
 * 时间复杂度：O(2^n)，每个元素有选择和不选择两种状态
 * 空间复杂度：O(n)，递归栈的深度
 * 
 * @param {number[]} nums - 非负整数数组
 * @return {number} 不相邻元素的最大和
 */
function maxNonAdjacentSumBacktracking(nums) {
  // 递归函数：从index开始的子数组中能选出的最大和
  function backtrack(index) {
    // 基本情况
    if (index >= nums.length) {
      return 0;
    }
    
    // 选择当前元素，然后跳过下一个
    const selectCurrent = nums[index] + backtrack(index + 2);
    
    // 不选择当前元素
    const skipCurrent = backtrack(index + 1);
    
    // 返回两种选择的最大值
    return Math.max(selectCurrent, skipCurrent);
  }
  
  return backtrack(0);
}

/**
 * 计算并打印dp表过程示例
 * 
 * @param {number[]} nums - 非负整数数组
 */
function printDPTable(nums) {
  // 创建dp数组
  const dp = new Array(nums.length + 1).fill(0);
  
  // 初始状态
  dp[0] = 0;
  dp[1] = nums[0];
  
  console.log(`\n计算dp表过程 - 数组 [${nums}]：`);
  console.log(`dp[0] = 0 (没有元素)`);
  console.log(`dp[1] = ${nums[0]} (只有一个元素 ${nums[0]})`);
  
  // 动态规划填表
  for (let i = 2; i <= nums.length; i++) {
    const notTake = dp[i-1];
    const take = dp[i-2] + nums[i-1];
    dp[i] = Math.max(notTake, take);
    
    console.log(`dp[${i}] = max(dp[${i-1}]=${notTake}, dp[${i-2}]=${dp[i-2]} + nums[${i-1}]=${nums[i-1]}) = ${dp[i]}`);
  }
  
  console.log(`最终结果：${dp[nums.length]}`);
  return dp[nums.length];
}

// 测试用例
const testCases = [
  [1, 2, 3, 1],
  [2, 7, 9, 3, 1],
  [1, 2, 1, 4],
  [5, 1, 1, 5],
  [2, 4, 6, 2, 5]
];

// 使用动态规划解法测试
console.log("动态规划方法测试：");
for (const nums of testCases) {
  console.log(`输入: [${nums}]`);
  console.log(`输出: ${maxNonAdjacentSum(nums)}`);
  console.log("---");
}

// 使用空间优化的动态规划解法测试
console.log("\n空间优化的动态规划方法测试：");
for (const nums of testCases) {
  console.log(`输入: [${nums}]`);
  console.log(`输出: ${maxNonAdjacentSumOptimized(nums)}`);
  console.log("---");
}

// 使用回溯法测试（仅对小规模数据）
console.log("\n回溯法测试（仅对小规模数据）：");
for (const nums of testCases) {
  console.log(`输入: [${nums}]`);
  console.log(`输出: ${maxNonAdjacentSumBacktracking(nums)}`);
  console.log("---");
}

// 打印DP表计算过程
const dpTableExample = [2, 7, 9, 3, 1];
printDPTable(dpTableExample);

/**
 * 状态转移方程推导示例：
 * 
 * 考虑数组 [2, 7, 9, 3, 1]：
 * 
 * dp[0] = 0 (没有元素可选)
 * dp[1] = 2 (只有一个元素2，最大和是2)
 * 
 * 对于dp[2]：
 * - 不选择当前元素7：dp[1] = 2
 * - 选择当前元素7：dp[0] + 7 = 0 + 7 = 7
 * dp[2] = max(2, 7) = 7
 * 
 * 对于dp[3]：
 * - 不选择当前元素9：dp[2] = 7
 * - 选择当前元素9：dp[1] + 9 = 2 + 9 = 11
 * dp[3] = max(7, 11) = 11
 * 
 * 对于dp[4]：
 * - 不选择当前元素3：dp[3] = 11
 * - 选择当前元素3：dp[2] + 3 = 7 + 3 = 10
 * dp[4] = max(11, 10) = 11
 * 
 * 对于dp[5]：
 * - 不选择当前元素1：dp[4] = 11
 * - 选择当前元素1：dp[3] + 1 = 11 + 1 = 12
 * dp[5] = max(11, 12) = 12
 * 
 * 最终结果：dp[5] = 12
 */

/**
 * 总结：
 * 
 * 1. 动态规划解法：
 *    - 时间复杂度O(n)，空间复杂度O(n)
 *    - 通过dp数组存储中间状态，避免重复计算
 *    
 * 2. 空间优化的动态规划：
 *    - 时间复杂度O(n)，空间复杂度O(1)
 *    - 只需保存前两个状态，不需要完整dp数组
 *    
 * 3. 回溯法：
 *    - 时间复杂度O(2^n)，空间复杂度O(n)
 *    - 适合理解问题，但对大规模数据效率较低
 *    
 * 4. 状态转移方程的理解是关键：
 *    - 每个元素面临"选"或"不选"两种决策
 *    - 如果选当前元素，则不能选前一个元素
 *    - 核心公式：dp[i] = max(dp[i-1], dp[i-2] + nums[i-1])
 */ 