/**
 * 分发饼干问题
 * 
 * 题目描述：
 * 假设你是一位幼儿园老师，需要给一群孩子分发饼干。
 * 每个孩子都有一个胃口值g，这是能让孩子满足的饼干最小尺寸；
 * 每块饼干都有一个尺寸s。
 * 如果 s >= g，则可以将饼干分配给该孩子，这个孩子会得到满足。
 * 你的目标是尽可能满足更多数量的孩子，并输出这个最大数值。
 * 
 * 示例 1:
 * 输入: g = [1,2,3], s = [1,1]
 * 输出: 1
 * 解释: 
 * 你有三个孩子和两块饼干，三个孩子的胃口值分别是：1,2,3。
 * 你只能满足一个孩子，因为第二个孩子需要一个尺寸为2的饼干，但你只有两个尺寸为1的饼干。
 * 
 * 示例 2:
 * 输入: g = [1,2], s = [1,2,3]
 * 输出: 2
 * 解释: 
 * 你有两个孩子和三块饼干，两个孩子的胃口值分别是1,2。
 * 你拥有的饼干数量和尺寸都足以让所有孩子满足。
 * 所以你应该输出2。
 */

/**
 * 方法一：贪心算法（排序+双指针）
 * 
 * 思路：
 * 1. 将孩子的胃口值和饼干尺寸数组分别排序
 * 2. 使用双指针遍历两个数组
 * 3. 尽可能用小饼干满足胃口小的孩子
 * 
 * 时间复杂度：O(n log n + m log m)，其中n是孩子数量，m是饼干数量，排序的复杂度
 * 空间复杂度：O(1)，不需要额外空间
 * 
 * @param {number[]} g - 孩子的胃口值数组
 * @param {number[]} s - 饼干尺寸数组
 * @return {number} 最多能满足的孩子数量
 */
function findContentChildren(g, s) {
  // 对胃口值和饼干尺寸进行升序排序
  g.sort((a, b) => a - b);
  s.sort((a, b) => a - b);
  
  let child = 0; // 当前处理的孩子索引
  let cookie = 0; // 当前处理的饼干索引
  
  // 遍历饼干数组，尝试满足每个孩子
  while (child < g.length && cookie < s.length) {
    // 如果当前饼干能满足当前孩子
    if (s[cookie] >= g[child]) {
      child++; // 孩子得到满足，处理下一个孩子
    }
    cookie++; // 无论是否满足，都尝试下一块饼干
  }
  
  // 返回满足的孩子数量
  return child;
}

/**
 * 方法二：贪心算法（优先满足胃口大的孩子）
 * 
 * 思路：
 * 1. 将孩子的胃口值和饼干尺寸数组分别排序
 * 2. 从大到小遍历，尝试用大饼干满足胃口大的孩子
 * 
 * 时间复杂度：O(n log n + m log m)
 * 空间复杂度：O(1)
 * 
 * @param {number[]} g - 孩子的胃口值数组
 * @param {number[]} s - 饼干尺寸数组
 * @return {number} 最多能满足的孩子数量
 */
function findContentChildrenReverse(g, s) {
  // 对胃口值和饼干尺寸进行降序排序
  g.sort((a, b) => b - a);
  s.sort((a, b) => b - a);
  
  let child = 0; // 当前处理的孩子索引
  let cookie = 0; // 当前处理的饼干索引
  let count = 0; // 满足的孩子数量
  
  // 遍历直到其中一个数组遍历完
  while (child < g.length && cookie < s.length) {
    // 如果当前饼干能满足当前孩子
    if (s[cookie] >= g[child]) {
      count++;
      child++;
      cookie++;
    } else {
      // 当前饼干不能满足当前孩子，尝试下一个孩子
      child++;
    }
  }
  
  return count;
}

/**
 * 示例测试函数
 * 
 * @param {number[]} g - 孩子的胃口值数组
 * @param {number[]} s - 饼干尺寸数组
 */
function testFindContentChildren(g, s) {
  console.log(`孩子胃口值: [${g}]`);
  console.log(`饼干尺寸: [${s}]`);
  
  const result1 = findContentChildren(g, s);
  console.log(`方法一（小饼干优先）结果: ${result1}`);
  
  const result2 = findContentChildrenReverse([...g], [...s]);
  console.log(`方法二（大饼干优先）结果: ${result2}`);
  
  console.log("------------------------");
}

/**
 * 可视化贪心过程
 * 
 * @param {number[]} g - 孩子的胃口值数组
 * @param {number[]} s - 饼干尺寸数组
 */
function visualizeGreedyProcess(g, s) {
  console.log("\n贪心过程可视化（小饼干优先）：");
  console.log(`原始数据 - 孩子胃口: [${g}], 饼干尺寸: [${s}]`);
  
  // 对胃口值和饼干尺寸进行升序排序
  const sortedG = [...g].sort((a, b) => a - b);
  const sortedS = [...s].sort((a, b) => a - b);
  
  console.log(`排序后 - 孩子胃口: [${sortedG}], 饼干尺寸: [${sortedS}]`);
  
  let child = 0;
  let cookie = 0;
  let satisfiedChildren = [];
  
  console.log("\n分配过程:");
  
  while (child < sortedG.length && cookie < sortedS.length) {
    console.log(`尝试用饼干 ${sortedS[cookie]} 满足胃口为 ${sortedG[child]} 的孩子`);
    
    if (sortedS[cookie] >= sortedG[child]) {
      console.log(`成功满足！孩子 ${child} (胃口: ${sortedG[child]}) 得到饼干 ${cookie} (尺寸: ${sortedS[cookie]})`);
      satisfiedChildren.push(sortedG[child]);
      child++;
    } else {
      console.log(`饼干太小，不能满足。尝试下一块饼干。`);
    }
    
    cookie++;
  }
  
  console.log(`\n最终结果: 满足了 ${satisfiedChildren.length} 个孩子，满足的胃口值: [${satisfiedChildren}]`);
}

// 测试用例
const testCases = [
  { g: [1, 2, 3], s: [1, 1] },
  { g: [1, 2], s: [1, 2, 3] },
  { g: [10, 9, 8, 7], s: [5, 6, 7, 8] },
  { g: [1, 2, 3, 4, 5], s: [3, 4, 5, 6, 7] },
  { g: [], s: [1, 2, 3] },
  { g: [1, 2, 3], s: [] }
];

// 运行测试
console.log("分发饼干问题测试：");
console.log("========================");

for (const testCase of testCases) {
  testFindContentChildren(testCase.g, testCase.s);
}

// 可视化贪心过程
visualizeGreedyProcess([1, 3, 2], [1, 2, 1]);

/**
 * 贪心算法分析：
 * 
 * 1. 贪心选择性质：
 *    - 在每一步中，我们都尝试用尽可能小的饼干来满足胃口尽可能小的孩子
 *    - 这样可以节约大饼干，用于满足胃口更大的孩子
 * 
 * 2. 最优子结构：
 *    - 问题的最优解包含其子问题的最优解
 *    - 在当前分配最优的情况下，剩余的子问题同样可以用贪心策略得到最优解
 * 
 * 3. 贪心算法与动态规划的区别：
 *    - 贪心算法：当下做局部最优选择，不能回退
 *    - 动态规划：保存子问题的解，根据子问题的解构建原问题的解
 * 
 * 4. 为什么这个问题适合贪心而非动态规划？
 *    - 问题具有贪心选择性质
 *    - 每一步的选择不会影响后续的选择策略
 *    - 无需回溯或比较多种方案，一次遍历即可得到全局最优解
 */ 