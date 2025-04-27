/**
 * 01背包问题
 * 
 * 题目描述：
 * 有N件物品和一个容量为V的背包。第i件物品的重量是w[i]，价值是v[i]。
 * 求解将哪些物品装入背包，可使这些物品的总重量不超过背包容量，且总价值最大。
 * 
 * 注意：每种物品只有一件（01背包问题），要么选择放入背包，要么选择不放。
 */

/**
 * 方法一：动态规划（二维数组）
 * 
 * 思路：
 * 1. 创建一个二维数组dp，dp[i][j]表示前i个物品放入容量为j的背包的最大价值
 * 2. 状态转移方程：
 *    - 不放入第i个物品：dp[i][j] = dp[i-1][j]
 *    - 放入第i个物品：dp[i][j] = dp[i-1][j-w[i]] + v[i]
 *    - 取两种情况的最大值：dp[i][j] = max(dp[i-1][j], dp[i-1][j-w[i]] + v[i])
 * 
 * 时间复杂度：O(N*V)，其中N是物品数量，V是背包容量
 * 空间复杂度：O(N*V)
 * 
 * @param {number[]} weights - 物品重量数组
 * @param {number[]} values - 物品价值数组
 * @param {number} capacity - 背包容量
 * @return {number} 能够装入的最大价值
 */
function knapsack01_2D(weights, values, capacity) {
  const n = weights.length;
  
  // 创建二维dp数组，初始化为0
  const dp = Array(n + 1).fill().map(() => Array(capacity + 1).fill(0));
  
  // 填充dp数组
  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1]; // 当前物品重量
    const v = values[i - 1];  // 当前物品价值
    
    for (let j = 0; j <= capacity; j++) {
      if (j < w) {
        // 当前背包容量装不下第i个物品，只能选择不装入
        dp[i][j] = dp[i - 1][j];
      } else {
        // 可以选择装入或不装入，取价值较大的选择
        dp[i][j] = Math.max(dp[i - 1][j], dp[i - 1][j - w] + v);
      }
    }
  }
  
  return dp[n][capacity];
}

/**
 * 方法二：动态规划（一维数组优化）
 * 
 * 思路：
 * 1. 观察到每个状态只依赖于上一行的状态，可以使用一维数组优化空间
 * 2. 为了防止覆盖还未使用的上一行的状态，需要从右向左更新dp数组
 * 
 * 时间复杂度：O(N*V)
 * 空间复杂度：O(V)
 * 
 * @param {number[]} weights - 物品重量数组
 * @param {number[]} values - 物品价值数组
 * @param {number} capacity - 背包容量
 * @return {number} 能够装入的最大价值
 */
function knapsack01(weights, values, capacity) {
  const n = weights.length;
  
  // 创建一维dp数组，初始化为0
  const dp = Array(capacity + 1).fill(0);
  
  // 填充dp数组
  for (let i = 0; i < n; i++) {
    const w = weights[i]; // 当前物品重量
    const v = values[i];  // 当前物品价值
    
    // 从右向左更新dp数组，避免覆盖还未使用的值
    for (let j = capacity; j >= w; j--) {
      // 可以选择装入或不装入，取价值较大的选择
      dp[j] = Math.max(dp[j], dp[j - w] + v);
    }
  }
  
  return dp[capacity];
}

/**
 * 方法三：回溯法（用于小规模问题和理解问题本质）
 * 
 * 思路：
 * 1. 对每个物品，递归地尝试两种选择：放入或不放入
 * 2. 跟踪当前的总重量和总价值
 * 3. 如果总重量超过背包容量，则这种选择不可行
 * 4. 记录所有可行选择中的最大价值
 * 
 * 时间复杂度：O(2^N)，指数级别，不适合大规模问题
 * 空间复杂度：O(N)，递归深度
 * 
 * @param {number[]} weights - 物品重量数组
 * @param {number[]} values - 物品价值数组
 * @param {number} capacity - 背包容量
 * @return {number} 能够装入的最大价值
 */
function knapsack01Backtrack(weights, values, capacity) {
  const n = weights.length;
  let maxValue = 0;
  
  // 递归函数：从第index个物品开始选择，当前重量为currentWeight，当前价值为currentValue
  function backtrack(index, currentWeight, currentValue) {
    // 基本情况：已经考虑完所有物品
    if (index === n) {
      maxValue = Math.max(maxValue, currentValue);
      return;
    }
    
    // 选择不放入第index个物品
    backtrack(index + 1, currentWeight, currentValue);
    
    // 选择放入第index个物品（如果容量允许）
    if (currentWeight + weights[index] <= capacity) {
      backtrack(index + 1, currentWeight + weights[index], currentValue + values[index]);
    }
  }
  
  // 从第0个物品开始递归
  backtrack(0, 0, 0);
  
  return maxValue;
}

/**
 * 获取01背包问题的最优解（物品选择情况）
 * 
 * 通过回溯dp数组，确定哪些物品被选中
 * 
 * @param {number[]} weights - 物品重量数组
 * @param {number[]} values - 物品价值数组
 * @param {number} capacity - 背包容量
 * @return {object} 包含最大价值和选择的物品
 */
function knapsack01WithItems(weights, values, capacity) {
  const n = weights.length;
  
  // 创建二维dp数组
  const dp = Array(n + 1).fill().map(() => Array(capacity + 1).fill(0));
  
  // 填充dp数组
  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1]; // 当前物品重量
    const v = values[i - 1];  // 当前物品价值
    
    for (let j = 0; j <= capacity; j++) {
      if (j < w) {
        dp[i][j] = dp[i - 1][j];
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i - 1][j - w] + v);
      }
    }
  }
  
  // 回溯确定选择的物品
  const selectedItems = [];
  let remainingCapacity = capacity;
  
  for (let i = n; i > 0; i--) {
    // 如果选择了当前物品
    if (dp[i][remainingCapacity] !== dp[i - 1][remainingCapacity]) {
      selectedItems.push(i - 1); // 记录物品索引
      remainingCapacity -= weights[i - 1]; // 减去当前物品的重量
    }
  }
  
  return {
    maxValue: dp[n][capacity],
    selectedItems: selectedItems.reverse() // 反转以获得从小到大的索引
  };
}

/**
 * 可视化01背包的动态规划表
 * 
 * @param {number[]} weights - 物品重量数组
 * @param {number[]} values - 物品价值数组
 * @param {number} capacity - 背包容量
 */
function visualizeKnapsack01(weights, values, capacity) {
  const n = weights.length;
  
  // 创建二维dp数组
  const dp = Array(n + 1).fill().map(() => Array(capacity + 1).fill(0));
  
  console.log(`\n01背包问题可视化：`);
  console.log(`物品重量: [${weights}]`);
  console.log(`物品价值: [${values}]`);
  console.log(`背包容量: ${capacity}`);
  
  console.log(`\n初始化dp表:`);
  console.log(`   | ${Array.from({length: capacity + 1}, (_, i) => i).join(' ')}`);
  console.log(`---+${'-'.repeat(2 * (capacity + 1))}`);
  console.log(` 0 | ${dp[0].join(' ')}`);
  
  // 填充dp数组并打印每一步
  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1]; // 当前物品重量
    const v = values[i - 1];  // 当前物品价值
    
    for (let j = 0; j <= capacity; j++) {
      if (j < w) {
        dp[i][j] = dp[i - 1][j];
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i - 1][j - w] + v);
      }
    }
    
    console.log(` ${i} | ${dp[i].join(' ')}`);
  }
  
  // 回溯确定选择的物品
  const selectedItems = [];
  let remainingCapacity = capacity;
  
  for (let i = n; i > 0; i--) {
    if (dp[i][remainingCapacity] !== dp[i - 1][remainingCapacity]) {
      selectedItems.push(i - 1);
      remainingCapacity -= weights[i - 1];
    }
  }
  
  console.log(`\n最优解:`);
  console.log(`最大价值: ${dp[n][capacity]}`);
  console.log(`选择的物品索引: [${selectedItems.reverse()}]`);
  
  // 验证结果
  const totalWeight = selectedItems.reduce((sum, idx) => sum + weights[idx], 0);
  const totalValue = selectedItems.reduce((sum, idx) => sum + values[idx], 0);
  console.log(`总重量: ${totalWeight}/${capacity}`);
  console.log(`总价值: ${totalValue}`);
  
  return dp[n][capacity];
}

/**
 * 测试函数
 */
function testKnapsack01() {
  const testCases = [
    {
      weights: [2, 3, 4, 5],
      values: [3, 4, 5, 6],
      capacity: 8
    },
    {
      weights: [1, 2, 3, 4, 5],
      values: [5, 4, 3, 2, 1],
      capacity: 10
    },
    {
      weights: [2, 2, 6, 5, 4],
      values: [6, 3, 5, 4, 6],
      capacity: 10
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const { weights, values, capacity } = testCases[i];
    
    console.log(`\n测试用例 ${i + 1}:`);
    console.log(`物品重量: [${weights}]`);
    console.log(`物品价值: [${values}]`);
    console.log(`背包容量: ${capacity}`);
    
    const maxValue2D = knapsack01_2D(weights, values, capacity);
    console.log(`二维动态规划解: ${maxValue2D}`);
    
    const maxValue1D = knapsack01(weights, values, capacity);
    console.log(`一维动态规划解: ${maxValue1D}`);
    
    const maxValueBacktrack = knapsack01Backtrack(weights, values, capacity);
    console.log(`回溯法解: ${maxValueBacktrack}`);
    
    const solution = knapsack01WithItems(weights, values, capacity);
    console.log(`最优解: 价值=${solution.maxValue}, 选择物品=${solution.selectedItems}`);
    
    console.log(`--------------------------`);
  }
  
  // 为一个小的测试用例可视化动态规划表
  visualizeKnapsack01([2, 3, 4, 5], [3, 4, 5, 6], 8);
}

// 运行测试
testKnapsack01();

/**
 * 01背包问题的应用场景：
 * 
 * 1. 资源分配问题：在有限的资源下，选择最优的项目组合
 * 2. 装载问题：在有限容量的运输工具中，选择最有价值的物品运输
 * 3. 投资问题：选择一组投资项目，使得在有限资金下获得最大回报
 * 4. 切割问题：将材料切割成不同长度的片段，使得废料最少或价值最大
 * 5. 子集和问题：找到一个子集，使得其和等于目标值
 * 
 * 01背包问题的变种：
 * 
 * 1. 完全背包问题：每种物品有无限件可用
 * 2. 多重背包问题：每种物品有有限件可用
 * 3. 分组背包问题：物品分组，每组最多选一个
 * 4. 二维背包问题：考虑两种限制条件（如重量和体积）
 * 5. 依赖背包问题：物品之间有依赖关系
 */ 