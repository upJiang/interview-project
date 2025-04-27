/**
 * 有效的括号
 * 
 * 题目描述：
 * 给定一个只包括 '('，')'，'{'，'}'，'['，']' 的字符串，判断字符串是否有效。
 * 
 * 有效字符串需满足：
 * 1. 左括号必须用相同类型的右括号闭合。
 * 2. 左括号必须以正确的顺序闭合。
 * 3. 注意空字符串可被认为是有效字符串。
 * 
 * 示例：
 * 输入: "()"
 * 输出: true
 * 
 * 输入: "()[]{}"
 * 输出: true
 * 
 * 输入: "(]"
 * 输出: false
 * 
 * 输入: "([)]"
 * 输出: false
 * 
 * 输入: "{[]}"
 * 输出: true
 */

/**
 * 判断括号字符串是否有效
 * 
 * 思路：
 * 1. 使用栈来匹配括号
 * 2. 遇到左括号，将其推入栈中
 * 3. 遇到右括号，检查栈顶元素是否是对应的左括号
 *    - 如果是，则栈顶元素出栈
 *    - 如果不是，则返回false
 * 4. 最后检查栈是否为空，如果为空则所有括号都匹配，否则存在未匹配的左括号
 * 
 * 时间复杂度：O(n)，其中n是字符串的长度
 * 空间复杂度：O(n)，最坏情况下，所有字符都是左括号，栈的大小为n
 * 
 * @param {string} s - 由括号组成的字符串
 * @return {boolean} 字符串是否有效
 */
function isValid(s) {
  // 空字符串直接返回true
  if (s === "") {
    return true;
  }
  
  // 字符串长度为奇数时，括号无法配对，直接返回false
  if (s.length % 2 !== 0) {
    return false;
  }
  
  // 定义括号匹配对
  const bracketMap = {
    '(': ')',
    '{': '}',
    '[': ']'
  };
  
  // 栈存储待匹配的左括号
  const stack = [];
  
  // 遍历字符串
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    
    // 如果是左括号，入栈
    if (bracketMap[char]) {
      stack.push(char);
    } else {
      // 如果是右括号
      // 栈为空 或 栈顶元素不匹配当前字符，返回false
      const topChar = stack.pop();
      if (bracketMap[topChar] !== char) {
        return false;
      }
    }
  }
  
  // 如果栈为空，则所有括号都匹配
  return stack.length === 0;
}

/**
 * 优化版本：提前对第一个字符进行检查
 * 
 * @param {string} s - 由括号组成的字符串
 * @return {boolean} 字符串是否有效
 */
function isValidOptimized(s) {
  // 空字符串直接返回true
  if (s === "") {
    return true;
  }
  
  // 字符串长度为奇数时，括号无法配对，直接返回false
  if (s.length % 2 !== 0) {
    return false;
  }
  
  // 第一个字符是右括号，直接返回false
  if (s[0] === ')' || s[0] === '}' || s[0] === ']') {
    return false;
  }
  
  // 最后一个字符是左括号，直接返回false
  if (s[s.length - 1] === '(' || s[s.length - 1] === '{' || s[s.length - 1] === '[') {
    return false;
  }
  
  // 定义括号匹配对
  const bracketMap = {
    '(': ')',
    '{': '}',
    '[': ']'
  };
  
  // 栈存储待匹配的左括号
  const stack = [];
  
  // 遍历字符串
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    
    // 如果是左括号，入栈
    if (bracketMap[char]) {
      stack.push(char);
    } else {
      // 如果是右括号
      // 栈为空 或 栈顶元素不匹配当前字符，返回false
      const topChar = stack.pop();
      if (bracketMap[topChar] !== char) {
        return false;
      }
    }
  }
  
  // 如果栈为空，则所有括号都匹配
  return stack.length === 0;
}

/**
 * 拓展问题：生成有效的括号组合
 * 
 * 题目描述：
 * 给出 n 代表生成括号的对数，请你写出一个函数，使其能够生成所有可能的并且有效的括号组合。
 * 
 * 示例：
 * 输入: n = 3
 * 输出: [
 *   "((()))",
 *   "(()())",
 *   "(())()",
 *   "()(())",
 *   "()()()"
 * ]
 * 
 * 思路：回溯法
 * 1. 保持跟踪到目前为止放置的左括号和右括号的数目
 * 2. 如果左括号数量小于n，可以放一个左括号
 * 3. 如果右括号数量小于左括号的数量，可以放一个右括号
 * 
 * 时间复杂度：O(4^n / sqrt(n))，卡特兰数的渐近行为
 * 空间复杂度：O(n)，递归深度最多2n
 * 
 * @param {number} n - 括号对数
 * @return {string[]} 所有可能的有效括号组合
 */
function generateParenthesis(n) {
  const result = [];
  
  // 回溯函数
  function backtrack(s, left, right) {
    // 如果字符串长度达到2n，说明已经使用了n对括号
    if (s.length === 2 * n) {
      result.push(s);
      return;
    }
    
    // 如果左括号数量小于n，可以添加左括号
    if (left < n) {
      backtrack(s + '(', left + 1, right);
    }
    
    // 如果右括号数量小于左括号数量，可以添加右括号
    if (right < left) {
      backtrack(s + ')', left, right + 1);
    }
  }
  
  // 开始回溯，初始状态：空字符串，0个左括号，0个右括号
  backtrack('', 0, 0);
  
  return result;
}

// 测试用例
console.log(isValid("()")); // true
console.log(isValid("()[]{}")); // true
console.log(isValid("(]")); // false
console.log(isValid("([)]")); // false
console.log(isValid("{[]}")); // true
console.log(isValid("")); // true
console.log(isValid("[")); // false

console.log("\n优化版本测试：");
console.log(isValidOptimized("()")); // true
console.log(isValidOptimized("()[]{}")); // true
console.log(isValidOptimized("(]")); // false
console.log(isValidOptimized("([)]")); // false
console.log(isValidOptimized("{[]}")); // true

console.log("\n生成括号测试：");
console.log(generateParenthesis(3));
/*
[
  "((()))",
  "(()())",
  "(())()",
  "()(())",
  "()()()"
]
*/

/**
 * 总结：
 * 
 * 1. 括号匹配问题是栈的经典应用场景
 * 2. 栈非常适合处理具有"后进先出"特性的问题，如括号匹配
 * 3. 在处理括号问题时，可以通过提前检查字符串的特性进行优化
 * 4. 生成有效括号组合是回溯法的典型应用
 * 5. 在面试中遇到类似"验证"或"匹配"的问题时，考虑使用栈来解决
 */ 