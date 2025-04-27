/**
 * 缺失的第一个正整数
 * 
 * 题目描述：
 * 给你一个未排序的整数数组 nums ，请你找出其中没有出现的最小的正整数。
 * 
 * 示例 1：
 * 输入：nums = [1,2,0]
 * 输出：3
 * 
 * 示例 2：
 * 输入：nums = [3,4,-1,1]
 * 输出：2
 * 
 * 示例 3：
 * 输入：nums = [7,8,9,11,12]
 * 输出：1
 */

/**
 * 方法一：哈希表解法
 * 
 * 思路：
 * 使用哈希表记录所有出现过的正整数，然后从1开始依次检查每个正整数是否在哈希表中
 * 
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 * 
 * @param {number[]} nums - 整数数组
 * @return {number} 缺失的第一个正整数
 */
function firstMissingPositiveMap(nums) {
  // 创建Map对象记录出现的正整数
  const map = new Map();
  
  // 遍历数组，将所有正整数加入Map
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] > 0) {
      map.set(nums[i], true);
    }
  }
  
  // 从1开始检查每个正整数是否存在
  let result = 1;
  while (map.has(result)) {
    result++;
  }
  
  return result;
}

/**
 * 方法二：Set解法
 * 
 * 思路：
 * 使用Set记录所有出现过的正整数，然后从1开始依次检查每个正整数是否在Set中
 * 
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 * 
 * @param {number[]} nums - 整数数组
 * @return {number} 缺失的第一个正整数
 */
function firstMissingPositiveSet(nums) {
  // 创建Set对象记录出现的正整数
  const set = new Set();
  
  // 遍历数组，将所有正整数加入Set
  for (const num of nums) {
    if (num > 0) {
      set.add(num);
    }
  }
  
  // 从1开始检查每个正整数是否存在
  let result = 1;
  while (set.has(result)) {
    result++;
  }
  
  return result;
}

/**
 * 方法三：原地哈希（高级解法）
 * 
 * 思路：
 * 利用数组本身作为哈希表，将数字放到对应的索引位置上
 * 例如：数字1应该放在nums[0]，数字2应该放在nums[1]，...
 * 然后遍历数组，第一个不满足nums[i] = i+1的位置对应的数字i+1就是缺失的第一个正整数
 * 
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 * 
 * @param {number[]} nums - 整数数组
 * @return {number} 缺失的第一个正整数
 */
function firstMissingPositive(nums) {
  const n = nums.length;
  
  // 第一步：将负数、0和大于n的数字替换为n+1
  // 因为我们只关心范围在[1,n]内的数字
  for (let i = 0; i < n; i++) {
    if (nums[i] <= 0 || nums[i] > n) {
      nums[i] = n + 1;
    }
  }
  
  // 第二步：将每个数对应的位置标记为负数
  for (let i = 0; i < n; i++) {
    // 取绝对值是因为该位置可能已经被标记为负数
    const num = Math.abs(nums[i]);
    
    // 只处理范围在[1,n]内的数字
    if (num <= n) {
      // 将对应索引处的数字标记为负数
      // 注意索引从0开始，所以num-1才是对应的索引
      nums[num - 1] = -Math.abs(nums[num - 1]);
    }
  }
  
  // 第三步：找到第一个正数的位置
  for (let i = 0; i < n; i++) {
    if (nums[i] > 0) {
      // 索引从0开始，所以缺失的第一个正整数是i+1
      return i + 1;
    }
  }
  
  // 如果数组中包含了1到n的所有数字，则返回n+1
  return n + 1;
}

// 测试
const nums1 = [1, 2, 0];
console.log("Map解法:", firstMissingPositiveMap(nums1)); // 3
console.log("Set解法:", firstMissingPositiveSet(nums1)); // 3
console.log("原地哈希解法:", firstMissingPositive(nums1)); // 3

const nums2 = [3, 4, -1, 1];
console.log("Map解法:", firstMissingPositiveMap(nums2)); // 2
console.log("Set解法:", firstMissingPositiveSet(nums2)); // 2
console.log("原地哈希解法:", firstMissingPositive([...nums2])); // 2

const nums3 = [7, 8, 9, 11, 12];
console.log("Map解法:", firstMissingPositiveMap(nums3)); // 1
console.log("Set解法:", firstMissingPositiveSet(nums3)); // 1
console.log("原地哈希解法:", firstMissingPositive([...nums3])); // 1

/**
 * 总结：
 * 
 * 1. Map/Set解法：简单易懂，时间和空间复杂度均为O(n)
 * 2. 原地哈希解法：较复杂但空间复杂度为O(1)，适合要求不使用额外空间的场景
 * 3. 对于数组问题，考虑能否利用数组本身的特性进行解题是一种重要思路
 * 4. 使用正负号作为标记是一种常见的原地标记技巧
 */ 