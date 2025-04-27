/**
 * 两数之和问题
 * 
 * 题目描述：
 * 给定一个整数数组 nums 和一个目标值 target，请你在该数组中找出和为目标值的那两个整数，
 * 并返回他们的数组下标。
 * 
 * 示例：
 * 输入：nums = [2, 7, 11, 15], target = 9
 * 输出：[0, 1]
 * 解释：因为 nums[0] + nums[1] = 2 + 7 = 9，所以返回 [0, 1]
 */

/**
 * 方法一：暴力解法
 * 
 * 思路：
 * 通过双重循环遍历数组中所有可能的两数组合，找到和为target的组合
 * 
 * 时间复杂度：O(n²)
 * 空间复杂度：O(1)
 * 
 * @param {number[]} nums - 整数数组
 * @param {number} target - 目标值
 * @return {number[]} 满足条件的两个数的下标
 */
function twoSumBruteForce(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  // 如果找不到符合条件的组合，返回空数组
  return [];
}

/**
 * 方法二：哈希表(Map)解法
 * 
 * 思路：
 * 利用哈希表将查找时间从O(n)降低到O(1)
 * 关键点: 几乎所有的求和问题，都可以转化为求差问题
 * 
 * 步骤:
 * 1. 创建一个Map存储每个元素的值和索引
 * 2. 遍历数组，对每个元素x，检查Map中是否有target-x的键
 * 3. 如果有，返回对应的索引；如果没有，将当前元素及其索引加入Map
 * 
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 * 
 * @param {number[]} nums - 整数数组
 * @param {number} target - 目标值
 * @return {number[]} 满足条件的两个数的下标
 */
function twoSum(nums, target) {
  // 创建哈希表存储元素和对应的索引
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    // 检查complement是否在哈希表中
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    // 将当前元素及其索引加入哈希表
    map.set(nums[i], i);
  }
  
  // 如果找不到符合条件的组合，返回空数组
  return [];
}

// 测试
const nums1 = [2, 7, 11, 15];
const target1 = 9;
console.log("暴力解法:", twoSumBruteForce(nums1, target1)); // [0, 1]
console.log("哈希表解法:", twoSum(nums1, target1)); // [0, 1]

const nums2 = [3, 2, 4];
const target2 = 6;
console.log("暴力解法:", twoSumBruteForce(nums2, target2)); // [1, 2]
console.log("哈希表解法:", twoSum(nums2, target2)); // [1, 2]

const nums3 = [3, 3];
const target3 = 6;
console.log("暴力解法:", twoSumBruteForce(nums3, target3)); // [0, 1]
console.log("哈希表解法:", twoSum(nums3, target3)); // [0, 1]

/**
 * 总结：
 * 
 * 1. 暴力解法简单直观，但时间复杂度较高O(n²)
 * 2. 哈希表解法利用空间换时间，将时间复杂度降低到O(n)
 * 3. 求和问题转化为求差问题是解决此类问题的常用思路
 * 4. Map的has()和get()方法时间复杂度为O(1)，是解决查找问题的高效工具
 */ 