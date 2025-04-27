/**
 * 合并有序数组
 * 
 * 题目描述：
 * 给你两个有序整数数组 nums1 和 nums2，请你将 nums2 合并到 nums1 中，使 nums1 成为一个有序数组。
 * 
 * 说明：
 * - 初始化 nums1 和 nums2 的元素数量分别为 m 和 n
 * - 你可以假设 nums1 有足够的空间（空间大小大于或等于 m + n）来保存 nums2 中的元素
 * 
 * 示例：
 * 输入：nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3
 * 输出：[1,2,2,3,5,6]
 * 解释：需要合并 [1,2,3] 和 [2,5,6]。
 * 合并后的结果是 [1,2,2,3,5,6]，其中斜体加粗标注的为 nums2 中的元素。
 */

/**
 * 方法一：简单解法 - 合并后排序
 * 
 * 思路：
 * 先将nums2合并到nums1中，然后对整个数组进行排序
 * 
 * 时间复杂度：O((m+n)log(m+n))，由排序决定
 * 空间复杂度：O(1)，不需要额外空间
 * 
 * @param {number[]} nums1 - 第一个有序数组，后面有足够的空间容纳nums2
 * @param {number} m - nums1中有效元素的个数
 * @param {number[]} nums2 - 第二个有序数组
 * @param {number} n - nums2中元素的个数
 * @return {void} 不返回任何值，直接修改nums1
 */
function mergeAndSort(nums1, m, nums2, n) {
  // 将nums2中的元素复制到nums1中
  for (let i = 0; i < n; i++) {
    nums1[m + i] = nums2[i];
  }
  
  // 对整个数组进行排序
  nums1.sort((a, b) => a - b);
}

/**
 * 方法二：双指针法 - 从前往后
 * 
 * 思路：
 * 使用双指针分别指向两个数组的开头，比较大小后放入一个新的数组，最后将结果复制回nums1
 * 
 * 时间复杂度：O(m+n)
 * 空间复杂度：O(m+n)，需要一个新数组存储结果
 * 
 * @param {number[]} nums1 - 第一个有序数组，后面有足够的空间容纳nums2
 * @param {number} m - nums1中有效元素的个数
 * @param {number[]} nums2 - 第二个有序数组
 * @param {number} n - nums2中元素的个数
 * @return {void} 不返回任何值，直接修改nums1
 */
function mergeWithExtraSpace(nums1, m, nums2, n) {
  // 创建一个新数组来存储合并结果
  const merged = new Array(m + n);
  
  // 双指针
  let p1 = 0; // nums1的指针
  let p2 = 0; // nums2的指针
  let p = 0;  // merged的指针
  
  // 比较两个数组的元素，将较小的放入merged
  while (p1 < m && p2 < n) {
    if (nums1[p1] <= nums2[p2]) {
      merged[p++] = nums1[p1++];
    } else {
      merged[p++] = nums2[p2++];
    }
  }
  
  // 如果nums1还有剩余元素
  while (p1 < m) {
    merged[p++] = nums1[p1++];
  }
  
  // 如果nums2还有剩余元素
  while (p2 < n) {
    merged[p++] = nums2[p2++];
  }
  
  // 将merged复制回nums1
  for (let i = 0; i < m + n; i++) {
    nums1[i] = merged[i];
  }
}

/**
 * 方法三：双指针法 - 从后往前（最优解）
 * 
 * 思路：
 * 从后往前遍历，依次将较大的元素放到nums1的末尾
 * 
 * 时间复杂度：O(m+n)
 * 空间复杂度：O(1)，不需要额外空间
 * 
 * @param {number[]} nums1 - 第一个有序数组，后面有足够的空间容纳nums2
 * @param {number} m - nums1中有效元素的个数
 * @param {number[]} nums2 - 第二个有序数组
 * @param {number} n - nums2中元素的个数
 * @return {void} 不返回任何值，直接修改nums1
 */
function merge(nums1, m, nums2, n) {
  // 双指针从后往前
  let p1 = m - 1; // nums1的指针
  let p2 = n - 1; // nums2的指针
  let p = m + n - 1; // nums1末尾的指针
  
  // 从后往前比较并填充nums1
  while (p1 >= 0 && p2 >= 0) {
    // 将较大的值放到nums1的末尾
    if (nums1[p1] > nums2[p2]) {
      nums1[p--] = nums1[p1--];
    } else {
      nums1[p--] = nums2[p2--];
    }
  }
  
  // 如果nums2还有剩余元素
  // 注意: 如果nums1还有剩余元素，它们已经在正确的位置上了
  while (p2 >= 0) {
    nums1[p--] = nums2[p2--];
  }
}

// 测试
function testMerge(mergeFn) {
  // 测试用例1
  const nums1_1 = [1, 2, 3, 0, 0, 0];
  const m1 = 3;
  const nums2_1 = [2, 5, 6];
  const n1 = 3;
  mergeFn(nums1_1, m1, nums2_1, n1);
  console.log(nums1_1); // [1, 2, 2, 3, 5, 6]
  
  // 测试用例2
  const nums1_2 = [1];
  const m2 = 1;
  const nums2_2 = [];
  const n2 = 0;
  mergeFn(nums1_2, m2, nums2_2, n2);
  console.log(nums1_2); // [1]
  
  // 测试用例3
  const nums1_3 = [0];
  const m3 = 0;
  const nums2_3 = [1];
  const n3 = 1;
  mergeFn(nums1_3, m3, nums2_3, n3);
  console.log(nums1_3); // [1]
}

console.log("合并后排序法测试：");
testMerge(mergeAndSort);

console.log("\n使用额外空间双指针法测试：");
testMerge(mergeWithExtraSpace);

console.log("\n原地双指针法测试：");
testMerge(merge);

/**
 * 总结：
 * 
 * 1. 合并后排序：简单直观，但没有利用数组已排序的特性，时间复杂度较高
 * 2. 从前往后双指针：利用了数组已排序的特性，但需要额外空间
 * 3. 从后往前双指针：既利用了数组已排序的特性，又不需要额外空间，是最优解
 * 4. 双指针技巧在处理有序数组时非常有用
 * 5. 从后往前遍历可以避免元素覆盖问题，是处理数组原地修改的常用技巧
 */ 