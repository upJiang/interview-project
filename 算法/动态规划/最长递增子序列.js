/**
 * 最长递增子序列问题（LIS - Longest Increasing Subsequence）
 * 
 * 题目描述：
 * 给你一个整数数组 nums，找到其中最长严格递增子序列的长度。
 * 子序列是由数组派生而来的序列，删除（或不删除）数组中的元素而不改变其余元素的顺序。
 * 
 * 示例 1：
 * 输入：nums = [10,9,2,5,3,7,101,18]
 * 输出：4
 * 解释：最长递增子序列是 [2,3,7,101]，因此长度为 4 。
 * 
 * 示例 2：
 * 输入：nums = [0,1,0,3,2,3]
 * 输出：4
 * 
 * 示例 3：
 * 输入：nums = [7,7,7,7,7,7,7]
 * 输出：1
 */

/**
 * 方法一：动态规划（经典解法）
 * 
 * 思路：
 * 1. 定义dp[i]为以nums[i]结尾的最长递增子序列的长度
 * 2. 对于每个nums[i]，遍历在它之前的所有nums[j]
 * 3. 如果nums[i] > nums[j]，说明nums[i]可以接在nums[j]后面形成更长的递增子序列
 * 4. dp[i] = max(dp[i], dp[j] + 1)
 * 5. 最终结果为dp数组中的最大值
 * 
 * 时间复杂度：O(n²)，其中n是数组的长度
 * 空间复杂度：O(n)，需要dp数组存储状态
 * 
 * @param {number[]} nums - 输入数组
 * @return {number} 最长递增子序列的长度
 */
function lengthOfLISDP(nums) {
  const n = nums.length;
  if (n === 0) return 0;
  
  // 初始化dp数组，默认值为1（每个元素自己可以构成长度为1的子序列）
  const dp = new Array(n).fill(1);
  
  // 最大递增子序列长度，至少为1
  let maxLength = 1;
  
  // 动态规划主循环
  for (let i = 1; i < n; i++) {
    // 遍历i之前的所有元素
    for (let j = 0; j < i; j++) {
      // 如果当前元素大于之前的元素，可以形成递增子序列
      if (nums[i] > nums[j]) {
        // 更新dp[i]为max(当前值, dp[j]+1)
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    // 更新最大长度
    maxLength = Math.max(maxLength, dp[i]);
  }
  
  return maxLength;
}

/**
 * 方法二：贪心 + 二分查找（优化解法）
 * 
 * 思路：
 * 1. 维护一个数组tails，其中tails[i]表示长度为i+1的所有递增子序列的结尾的最小值
 * 2. 对于每个nums[i]，在tails中找到大于等于nums[i]的最小值的位置j
 * 3. 更新tails[j] = nums[i]
 * 4. 如果找不到（即nums[i]大于tails中所有值），则将nums[i]添加到tails末尾
 * 5. 最终tails的长度即为最长递增子序列的长度
 * 
 * 时间复杂度：O(n log n)，其中n是数组的长度
 * 空间复杂度：O(n)，需要tails数组存储状态
 * 
 * @param {number[]} nums - 输入数组
 * @return {number} 最长递增子序列的长度
 */
function lengthOfLIS(nums) {
  const n = nums.length;
  if (n === 0) return 0;
  
  // tails[i]表示长度为i+1的所有递增子序列的结尾的最小值
  const tails = [nums[0]];
  
  for (let i = 1; i < n; i++) {
    // 如果nums[i]大于tails中的最后一个元素，直接添加到tails末尾
    if (nums[i] > tails[tails.length - 1]) {
      tails.push(nums[i]);
    } else {
      // 二分查找tails中第一个大于等于nums[i]的位置
      let left = 0;
      let right = tails.length - 1;
      
      while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (tails[mid] < nums[i]) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }
      
      // 更新tails[left]为nums[i]
      tails[left] = nums[i];
    }
  }
  
  // tails的长度即为最长递增子序列的长度
  return tails.length;
}

/**
 * 方法三：回溯法（仅用于生成最长递增子序列，不推荐用于求长度）
 * 
 * 思路：
 * 1. 使用回溯法遍历所有可能的子序列
 * 2. 保持当前子序列严格递增
 * 3. 记录最长子序列
 * 
 * 时间复杂度：O(2^n)，枚举所有可能的子序列
 * 空间复杂度：O(n)，递归栈和存储子序列的空间
 * 
 * @param {number[]} nums - 输入数组
 * @return {number[]} 最长递增子序列
 */
function findLISBacktracking(nums) {
  const n = nums.length;
  if (n === 0) return [];
  
  // 最长的递增子序列
  let maxSubsequence = [];
  
  // 回溯函数
  function backtrack(startIndex, current) {
    // 如果当前子序列比已知的最长子序列还长，更新最长子序列
    if (current.length > maxSubsequence.length) {
      maxSubsequence = [...current];
    }
    
    // 尝试选择从startIndex开始的每个元素
    for (let i = startIndex; i < n; i++) {
      // 如果current为空，或者当前元素大于current的最后一个元素
      if (current.length === 0 || nums[i] > current[current.length - 1]) {
        // 选择当前元素
        current.push(nums[i]);
        // 递归处理后续元素
        backtrack(i + 1, current);
        // 回溯，撤销选择
        current.pop();
      }
    }
  }
  
  // 从空序列开始回溯
  backtrack(0, []);
  
  return maxSubsequence;
}

/**
 * 方法四：动态规划（返回最长递增子序列）
 * 
 * 思路：
 * 1. 使用动态规划找到最长递增子序列的长度
 * 2. 同时记录每个位置的前驱节点
 * 3. 从最大长度的位置开始，根据前驱信息重建子序列
 * 
 * 时间复杂度：O(n²)，其中n是数组的长度
 * 空间复杂度：O(n)，需要dp数组和prev数组
 * 
 * @param {number[]} nums - 输入数组
 * @return {number[]} 最长递增子序列
 */
function findLISDP(nums) {
  const n = nums.length;
  if (n === 0) return [];
  
  // dp[i]表示以nums[i]结尾的最长递增子序列的长度
  const dp = new Array(n).fill(1);
  // prev[i]记录dp[i]的来源，即前驱节点的索引
  const prev = new Array(n).fill(-1);
  
  // 记录最大长度及其结束位置
  let maxLength = 1;
  let maxIndex = 0;
  
  // 动态规划主循环
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[i] > nums[j] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        prev[i] = j; // 记录前驱
      }
    }
    
    // 更新最大长度及其位置
    if (dp[i] > maxLength) {
      maxLength = dp[i];
      maxIndex = i;
    }
  }
  
  // 根据prev数组重建最长递增子序列
  const result = [];
  let currentIndex = maxIndex;
  
  while (currentIndex !== -1) {
    result.unshift(nums[currentIndex]);
    currentIndex = prev[currentIndex];
  }
  
  return result;
}

/**
 * 输出最长递增子序列示例
 */
function printLISExample(nums) {
  console.log(`\n原始数组: [${nums}]`);
  
  // 使用动态规划计算长度
  const length = lengthOfLISDP(nums);
  console.log(`最长递增子序列的长度 (DP): ${length}`);
  
  // 使用贪心+二分查找计算长度
  const optimizedLength = lengthOfLIS(nums);
  console.log(`最长递增子序列的长度 (优化): ${optimizedLength}`);
  
  // 使用回溯法找出实际子序列（仅适用于小数组）
  if (nums.length <= 15) {
    const subsequence = findLISBacktracking(nums);
    console.log(`最长递增子序列 (回溯法): [${subsequence}]`);
  }
  
  // 使用动态规划找出实际子序列
  const dpSubsequence = findLISDP(nums);
  console.log(`最长递增子序列 (DP): [${dpSubsequence}]`);
}

// 测试用例
const testCases = [
  [10, 9, 2, 5, 3, 7, 101, 18],
  [0, 1, 0, 3, 2, 3],
  [7, 7, 7, 7, 7, 7, 7],
  [2, 5, 3, 7],
  [1, 3, 6, 7, 9, 4, 10, 5, 6]
];

// 输出所有测试用例的结果
for (const nums of testCases) {
  printLISExample(nums);
}

// 性能测试 - 大数组
console.log("\n性能测试 - 大数组：");
const largeArray = [];
for (let i = 0; i < 1000; i++) {
  largeArray.push(Math.floor(Math.random() * 10000));
}

console.time("动态规划 (O(n²))");
const dpResult = lengthOfLISDP(largeArray);
console.timeEnd("动态规划 (O(n²))");
console.log(`最长递增子序列的长度: ${dpResult}`);

console.time("贪心+二分查找 (O(n log n))");
const optimizedResult = lengthOfLIS(largeArray);
console.timeEnd("贪心+二分查找 (O(n log n))");
console.log(`最长递增子序列的长度: ${optimizedResult}`);

/**
 * DP过程示例：[2, 5, 3, 7]
 * 
 * 初始化：dp = [1, 1, 1, 1]
 * 
 * i = 1, nums[1] = 5:
 *   j = 0, nums[0] = 2 < 5 => dp[1] = max(1, 1+1) = 2
 *   dp = [1, 2, 1, 1]
 * 
 * i = 2, nums[2] = 3:
 *   j = 0, nums[0] = 2 < 3 => dp[2] = max(1, 1+1) = 2
 *   j = 1, nums[1] = 5 > 3 => 不更新
 *   dp = [1, 2, 2, 1]
 * 
 * i = 3, nums[3] = 7:
 *   j = 0, nums[0] = 2 < 7 => dp[3] = max(1, 1+1) = 2
 *   j = 1, nums[1] = 5 < 7 => dp[3] = max(2, 2+1) = 3
 *   j = 2, nums[2] = 3 < 7 => dp[3] = max(3, 2+1) = 3
 *   dp = [1, 2, 2, 3]
 * 
 * 最长递增子序列的长度为 3
 * 最长递增子序列之一是 [2, 3, 7]
 * 
 * 贪心+二分查找过程：
 * 
 * 初始化：tails = [2]
 * 
 * i = 1, nums[1] = 5:
 *   5 > tails[0] = 2 => tails = [2, 5]
 * 
 * i = 2, nums[2] = 3:
 *   3 < tails[1] = 5 => 二分查找位置 1 => tails = [2, 3]
 * 
 * i = 3, nums[3] = 7:
 *   7 > tails[1] = 3 => tails = [2, 3, 7]
 * 
 * 最长递增子序列的长度为 3
 */

/**
 * 总结：
 * 
 * 1. 动态规划解法：
 *    - 时间复杂度O(n²)，容易理解
 *    - 可以通过回溯构建出实际的最长递增子序列
 *    
 * 2. 贪心+二分查找解法：
 *    - 时间复杂度优化到O(n log n)
 *    - tails数组中的元素不一定是实际最长递增子序列中的元素
 *    - 仅能求出长度，需要额外工作才能构建实际序列
 *    
 * 3. 回溯法：
 *    - 枚举所有可能，时间复杂度O(2^n)，仅适用于小规模数据
 *    - 可以找出所有最长递增子序列
 *    
 * 4. 实际应用时，首选贪心+二分查找解法求长度
 *    - 如果需要实际子序列，可使用动态规划+前驱记录
 */ 