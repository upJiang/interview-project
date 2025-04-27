/**
 * 字符串反转问题
 * 
 * 包含多种字符串反转的实现方法和相关问题
 */

/**
 * 方法一：使用内置方法 - 转数组、反转、拼接
 * 
 * 思路：
 * 1. 将字符串转为字符数组
 * 2. 反转数组
 * 3. 将数组转回字符串
 * 
 * 时间复杂度：O(n)，其中n是字符串的长度
 * 空间复杂度：O(n)，需要一个数组存储字符
 * 
 * @param {string} str - 输入字符串
 * @return {string} 反转后的字符串
 */
function reverseStringBuiltin(str) {
  return str.split('').reverse().join('');
}

/**
 * 方法二：使用for循环从后向前构建新字符串
 * 
 * 思路：
 * 1. 初始化一个空字符串作为结果
 * 2. 从原字符串的最后一个字符开始，逐个添加到结果字符串
 * 
 * 时间复杂度：O(n)，其中n是字符串的长度
 * 空间复杂度：O(n)，新字符串的空间
 * 
 * @param {string} str - 输入字符串
 * @return {string} 反转后的字符串
 */
function reverseStringLoop(str) {
  let result = '';
  for (let i = str.length - 1; i >= 0; i--) {
    result += str[i];
  }
  return result;
}

/**
 * 方法三：递归法
 * 
 * 思路：
 * 1. 基本情况：空字符串或单个字符，直接返回
 * 2. 递归情况：返回除第一个字符外的字符串反转结果加上第一个字符
 * 
 * 时间复杂度：O(n²)，由于字符串不可变，每次拼接需要O(n)时间
 * 空间复杂度：O(n)，递归调用栈的深度
 * 
 * @param {string} str - 输入字符串
 * @return {string} 反转后的字符串
 */
function reverseStringRecursive(str) {
  // 基本情况：空字符串或单个字符
  if (str.length <= 1) {
    return str;
  }
  
  // 递归情况：反转除第一个字符外的字符串，再加上第一个字符
  return reverseStringRecursive(str.substring(1)) + str[0];
}

/**
 * 方法四：使用分治法
 * 
 * 思路：
 * 1. 将字符串分为两半
 * 2. 递归反转每一半
 * 3. 合并结果：反转后的右半部分 + 反转后的左半部分
 * 
 * 时间复杂度：O(n log n)，每次递归处理一半的字符
 * 空间复杂度：O(n log n)，递归调用栈的深度
 * 
 * @param {string} str - 输入字符串
 * @return {string} 反转后的字符串
 */
function reverseStringDivideAndConquer(str) {
  if (str.length <= 1) {
    return str;
  }
  
  const mid = Math.floor(str.length / 2);
  const left = str.substring(0, mid);
  const right = str.substring(mid);
  
  return reverseStringDivideAndConquer(right) + reverseStringDivideAndConquer(left);
}

/**
 * 方法五：使用双指针原地交换（数组版本）
 * 
 * 思路：
 * 1. 将字符串转为字符数组
 * 2. 使用双指针从两端向中间移动，交换指针所指的字符
 * 3. 将数组转回字符串
 * 
 * 时间复杂度：O(n)，其中n是字符串的长度
 * 空间复杂度：O(n)，需要一个数组存储字符
 * 
 * @param {string} str - 输入字符串
 * @return {string} 反转后的字符串
 */
function reverseStringTwoPointers(str) {
  const arr = str.split('');
  let left = 0;
  let right = arr.length - 1;
  
  while (left < right) {
    // 交换左右指针指向的字符
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }
  
  return arr.join('');
}

/**
 * 相关问题一：反转单词顺序
 * 
 * 题目描述：
 * 给定一个字符串，反转字符串中的单词顺序，但单词内字符的顺序不变
 * 
 * 示例：
 * 输入: "the sky is blue"
 * 输出: "blue is sky the"
 * 
 * 思路：
 * 1. 按空格分割字符串成单词数组
 * 2. 反转数组
 * 3. 重新用空格连接
 * 
 * 时间复杂度：O(n)，其中n是字符串的长度
 * 空间复杂度：O(n)
 * 
 * @param {string} str - 输入字符串
 * @return {string} 单词顺序反转后的字符串
 */
function reverseWords(str) {
  // 去除多余空格并分割成单词数组
  const words = str.trim().split(/\s+/);
  return words.reverse().join(' ');
}

/**
 * 相关问题二：判断字符串是否是回文串
 * 
 * 题目描述：
 * 给定一个字符串，判断是否是回文串（正着读和倒着读一样）
 * 
 * 示例：
 * 输入: "level"
 * 输出: true
 * 
 * 输入: "hello"
 * 输出: false
 * 
 * 思路：
 * 使用双指针从两端向中间移动，比较字符是否相同
 * 
 * 时间复杂度：O(n)，其中n是字符串的长度
 * 空间复杂度：O(1)
 * 
 * @param {string} str - 输入字符串
 * @return {boolean} 是否是回文串
 */
function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;
  
  while (left < right) {
    if (str[left] !== str[right]) {
      return false;
    }
    left++;
    right--;
  }
  
  return true;
}

/**
 * 相关问题三：忽略大小写和非字母数字字符的回文判断
 * 
 * 题目描述：
 * 给定一个字符串，判断是否是回文串，只考虑字母和数字字符，忽略大小写
 * 
 * 示例：
 * 输入: "A man, a plan, a canal: Panama"
 * 输出: true
 * 
 * 输入: "race a car"
 * 输出: false
 * 
 * 思路：
 * 1. 预处理字符串，只保留字母和数字，并转为小写
 * 2. 使用双指针从两端向中间移动，比较字符是否相同
 * 
 * 时间复杂度：O(n)，其中n是字符串的长度
 * 空间复杂度：O(n)，预处理字符串需要额外空间
 * 
 * @param {string} str - 输入字符串
 * @return {boolean} 是否是回文串
 */
function isPalindromeIgnoreCase(str) {
  // 预处理：将字符串转为小写，并只保留字母和数字
  const processed = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // 使用双指针判断
  let left = 0;
  let right = processed.length - 1;
  
  while (left < right) {
    if (processed[left] !== processed[right]) {
      return false;
    }
    left++;
    right--;
  }
  
  return true;
}

// 测试字符串反转
const testStr = "Hello, World!";
console.log("原始字符串:", testStr);
console.log("内置方法反转:", reverseStringBuiltin(testStr));
console.log("循环法反转:", reverseStringLoop(testStr));
console.log("递归法反转:", reverseStringRecursive(testStr));
console.log("分治法反转:", reverseStringDivideAndConquer(testStr));
console.log("双指针法反转:", reverseStringTwoPointers(testStr));

// 测试单词反转
const sentence = "the sky is blue";
console.log("\n原始句子:", sentence);
console.log("单词顺序反转:", reverseWords(sentence));

// 测试回文串判断
console.log("\n回文串测试:");
console.log("'level' 是回文串:", isPalindrome("level"));
console.log("'hello' 是回文串:", isPalindrome("hello"));

// 测试忽略大小写和非字母数字字符的回文判断
console.log("\n忽略大小写和非字母数字字符的回文测试:");
console.log("'A man, a plan, a canal: Panama' 是回文串:", 
  isPalindromeIgnoreCase("A man, a plan, a canal: Panama"));
console.log("'race a car' 是回文串:", isPalindromeIgnoreCase("race a car"));

/**
 * 性能比较：
 * 
 * 在处理大字符串时，不同方法的性能差异:
 * 1. 内置方法（split+reverse+join）: 较好，JavaScript引擎内部做了优化
 * 2. 循环法：较好，但字符串拼接在JavaScript中可能导致性能问题
 * 3. 递归法：较差，由于字符串拼接和递归调用栈开销
 * 4. 分治法：中等，递归开销小于递归法
 * 5. 双指针法：最好，只进行一次数组操作和一半的交换操作
 * 
 * 应用场景：
 * - 小型字符串：任何方法都可接受
 * - 大型字符串：优先考虑内置方法或双指针法
 * - 需要在原地修改字符数组：双指针法
 * - 需要递归思路的相关问题：递归法或分治法
 */ 