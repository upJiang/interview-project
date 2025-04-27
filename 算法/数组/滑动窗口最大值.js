/**
 * 滑动窗口最大值
 * 
 * 题目描述：
 * 给定一个数组 nums 和滑动窗口的大小 k，请找出所有滑动窗口里的最大值。
 * 
 * 示例：
 * 输入: nums = [1,3,-1,-3,5,3,6,7], 和 k = 3
 * 输出: [3,3,5,5,6,7]
 * 解释:
 *   滑动窗口的位置                最大值
 * ---------------               -----
 * [1  3  -1] -3  5  3  6  7       3
 *  1 [3  -1  -3] 5  3  6  7       3
 *  1  3 [-1  -3  5] 3  6  7       5
 *  1  3  -1 [-3  5  3] 6  7       5
 *  1  3  -1  -3 [5  3  6] 7       6
 *  1  3  -1  -3  5 [3  6  7]      7
 */

/**
 * 方法一：暴力解法
 * 
 * 思路：
 * 遍历每个滑动窗口，在每个窗口中找出最大值
 * 
 * 时间复杂度：O(n*k)，其中n是数组长度，k是窗口大小
 * 空间复杂度：O(n-k+1)，用于存储结果
 * 
 * @param {number[]} nums - 输入数组
 * @param {number} k - 窗口大小
 * @return {number[]} 每个窗口的最大值组成的数组
 */
function maxSlidingWindowBrute(nums, k) {
  const result = [];
  const n = nums.length;
  
  // 如果数组为空或窗口大小为0，返回空数组
  if (n === 0 || k === 0) return result;
  
  // 遍历所有可能的窗口
  for (let i = 0; i <= n - k; i++) {
    let max = nums[i]; // 初始化当前窗口最大值
    
    // 遍历当前窗口中的所有元素找出最大值
    for (let j = i; j < i + k; j++) {
      max = Math.max(max, nums[j]);
    }
    
    result.push(max); // 将当前窗口最大值加入结果
  }
  
  return result;
}

/**
 * 方法二：双端队列 (Deque) 解法
 * 
 * 思路：
 * 使用双端队列存储有可能成为窗口最大值的元素的索引
 * 队列中的元素按照从大到小的顺序排列，保证队首元素始终是当前窗口的最大值
 * 
 * 时间复杂度：O(n)，每个元素最多入队和出队一次
 * 空间复杂度：O(k)，队列的大小最多为k
 * 
 * @param {number[]} nums - 输入数组
 * @param {number} k - 窗口大小
 * @return {number[]} 每个窗口的最大值组成的数组
 */
function maxSlidingWindow(nums, k) {
  const result = [];
  const deque = []; // 存储索引，而不是元素值
  const n = nums.length;
  
  // 如果数组为空或窗口大小为0，返回空数组
  if (n === 0 || k === 0) return result;
  
  // 处理第一个窗口
  for (let i = 0; i < k; i++) {
    // 移除队列中所有小于当前元素的值
    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }
    deque.push(i); // 将当前索引加入队列
  }
  
  // 将第一个窗口的最大值加入结果
  result.push(nums[deque[0]]);
  
  // 处理后续的窗口
  for (let i = k; i < n; i++) {
    // 移除队列中不在当前窗口范围内的元素（队首元素）
    if (deque[0] <= i - k) {
      deque.shift();
    }
    
    // 移除队列中所有小于当前元素的值
    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }
    
    deque.push(i); // 将当前索引加入队列
    result.push(nums[deque[0]]); // 将当前窗口的最大值加入结果
  }
  
  return result;
}

/**
 * 方法三：优化的暴力解法（分块）
 * 
 * 思路：
 * 将数组分成大小为k的块，预处理每个块的最大值
 * 然后对于每个窗口，只需要比较跨块的部分即可
 * 
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 * 
 * @param {number[]} nums - 输入数组
 * @param {number} k - 窗口大小
 * @return {number[]} 每个窗口的最大值组成的数组
 */
function maxSlidingWindowOptimized(nums, k) {
  const n = nums.length;
  
  // 如果数组为空或窗口大小为0，返回空数组
  if (n === 0 || k === 0) return [];
  if (k === 1) return nums; // 如果窗口大小为1，每个元素自身就是最大值
  
  const result = [];
  const leftMax = new Array(n);
  const rightMax = new Array(n);
  
  // 预处理每个块的左右最大值
  for (let i = 0; i < n; i++) {
    // 如果是块的开始，直接赋值
    if (i % k === 0) {
      leftMax[i] = nums[i];
    } else {
      // 否则，取前一个位置的最大值和当前值的最大值
      leftMax[i] = Math.max(leftMax[i - 1], nums[i]);
    }
    
    // 计算rightMax（从右往左）
    const j = n - 1 - i;
    // 如果是块的结束，直接赋值
    if (j % k === k - 1 || j === n - 1) {
      rightMax[j] = nums[j];
    } else {
      // 否则，取后一个位置的最大值和当前值的最大值
      rightMax[j] = Math.max(rightMax[j + 1], nums[j]);
    }
  }
  
  // 计算每个窗口的最大值
  for (let i = 0; i <= n - k; i++) {
    // 窗口的最大值是右边块的leftMax和左边块的rightMax的最大值
    result.push(Math.max(rightMax[i], leftMax[i + k - 1]));
  }
  
  return result;
}

// 测试
const nums1 = [1, 3, -1, -3, 5, 3, 6, 7];
const k1 = 3;

console.log("暴力解法:");
console.log(maxSlidingWindowBrute(nums1, k1)); // [3, 3, 5, 5, 6, 7]

console.log("\n双端队列解法:");
console.log(maxSlidingWindow(nums1, k1)); // [3, 3, 5, 5, 6, 7]

console.log("\n优化的暴力解法:");
console.log(maxSlidingWindowOptimized(nums1, k1)); // [3, 3, 5, 5, 6, 7]

// 更多测试用例
const nums2 = [1, -1];
const k2 = 1;
console.log("\n测试用例2:");
console.log(maxSlidingWindow(nums2, k2)); // [1, -1]

const nums3 = [9, 11];
const k3 = 2;
console.log("\n测试用例3:");
console.log(maxSlidingWindow(nums3, k3)); // [11]

const nums4 = [4, 3, 2, 1, 5, 6, 7, 8];
const k4 = 3;
console.log("\n测试用例4:");
console.log(maxSlidingWindow(nums4, k4)); // [4, 3, 5, 6, 7, 8]

/**
 * 总结：
 * 
 * 1. 暴力解法简单直观，但对于大数据集效率较低
 * 2. 双端队列解法是最优解，时间复杂度O(n)，通过维护递减队列确保最大值始终在队首
 * 3. 优化的暴力解法通过预处理分块信息降低了时间复杂度
 * 4. 滑动窗口是一种重要的算法思想，常用于解决数组和字符串的连续子序列问题
 * 5. 双端队列在需要在两端快速添加和删除元素的场景中非常有用
 */ 