/**
 * 贪心算法概述
 * 
 * 贪心算法是一种在每一步选择中都采取当前状态下最好或最优的选择，从而希望导致结果是最好或最优的算法。
 * 贪心算法在有最优子结构的问题中尤为有效。最优子结构的意思是局部最优解能决定全局最优解。
 * 
 * 贪心算法的基本步骤：
 * 1. 创建数学模型来描述问题
 * 2. 把求解的问题分成若干个子问题
 * 3. 对每一子问题求解，得到子问题的局部最优解
 * 4. 把子问题的局部最优解合成原来问题的一个解
 * 
 * 贪心算法的优点：
 * - 简单易实现
 * - 执行效率高
 * 
 * 贪心算法的缺点：
 * - 不一定能得到全局最优解
 * - 需要证明其正确性
 * 
 * 本文件实现以下贪心算法示例：
 * 1. 找零钱问题
 * 2. 区间调度问题
 * 3. 活动选择问题
 * 4. Huffman编码
 * 5. 最小生成树算法（Kruskal算法）
 */

/**
 * 1. 找零钱问题
 * 给定不同面额的硬币 coins 和一个总金额 amount，
 * 用最少的硬币凑出这个金额。
 * 
 * 注：贪心算法只适用于能用贪心策略解决的找零系统，如美元系统（1, 5, 10, 25）
 * 但不适用于所有货币系统，某些情况下需要动态规划。
 * 
 * @param {number[]} coins - 硬币面额数组
 * @param {number} amount - 需要凑出的金额
 * @return {number} - 需要的最少硬币数，如果无法凑出则返回-1
 */
function coinChange(coins, amount) {
  // 为了应用贪心算法，需要将硬币面额按从大到小排序
  coins.sort((a, b) => b - a);
  
  let count = 0; // 需要的硬币数量
  let remaining = amount; // 剩余需要凑出的金额
  
  // 贪心策略：优先使用面额最大的硬币
  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    // 计算当前面额硬币最多能用多少个
    const num = Math.floor(remaining / coin);
    count += num;
    remaining -= num * coin;
    
    // 如果已经凑出了所有金额，返回硬币数量
    if (remaining === 0) {
      return count;
    }
  }
  
  // 如果无法凑出所有金额，返回-1
  return remaining > 0 ? -1 : count;
}

/**
 * 找零钱问题的贪心算法（用于标准美元系统）
 * 
 * @param {number[]} coins - 硬币面额数组，如 [25, 10, 5, 1] 对应美元系统
 * @param {number} amount - 需要凑出的金额
 * @return {Object} - 包含每种硬币使用数量的对象和总硬币数
 */
function coinChangeDetail(coins, amount) {
  coins.sort((a, b) => b - a);
  
  let remaining = amount;
  const result = {};
  let totalCoins = 0;
  
  for (const coin of coins) {
    const num = Math.floor(remaining / coin);
    if (num > 0) {
      result[coin] = num;
      totalCoins += num;
      remaining -= num * coin;
    }
  }
  
  return {
    coinUsage: result,
    totalCoins: totalCoins,
    success: remaining === 0
  };
}

/**
 * 2. 区间调度问题
 * 给定一组会议的开始和结束时间，求最大可参加的会议数量。
 * 
 * 贪心策略：优先选择结束时间最早的会议。
 * 
 * @param {number[][]} intervals - 会议时间区间，每个区间为 [start, end]
 * @return {number} - 最大可参加的会议数量
 */
function maxMeetings(intervals) {
  if (intervals.length === 0) return 0;
  
  // 按照会议结束时间排序
  intervals.sort((a, b) => a[1] - b[1]);
  
  let count = 1; // 至少可以参加一个会议
  let endTime = intervals[0][1]; // 当前已排定的最后一个会议的结束时间
  
  // 贪心选择：如果下一个会议的开始时间大于等于当前结束时间，则可以参加
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] >= endTime) {
      count++;
      endTime = intervals[i][1];
    }
  }
  
  return count;
}

/**
 * 区间调度问题（详细版）
 * 返回可以参加的会议列表
 * 
 * @param {Object[]} meetings - 会议数组，每个会议包含id、start和end属性
 * @return {Object[]} - 可参加的会议列表
 */
function maxMeetingsDetail(meetings) {
  if (meetings.length === 0) return [];
  
  // 按照会议结束时间排序
  meetings.sort((a, b) => a.end - b.end);
  
  const result = [meetings[0]];
  let endTime = meetings[0].end;
  
  for (let i = 1; i < meetings.length; i++) {
    if (meetings[i].start >= endTime) {
      result.push(meetings[i]);
      endTime = meetings[i].end;
    }
  }
  
  return result;
}

/**
 * 3. 活动选择问题
 * 一个人一次只能参加一个活动，活动之间不能交叠。
 * 给定活动的开始和结束时间，求解最多能参加多少个活动。
 * 
 * 这个问题与区间调度问题相同，使用相同的贪心策略。
 * 
 * @param {number[]} start - 活动开始时间数组
 * @param {number[]} end - 活动结束时间数组
 * @return {number} - 最多可参加的活动数量
 */
function activitySelection(start, end) {
  // 创建活动数组，每个活动包含开始时间和结束时间
  const activities = [];
  for (let i = 0; i < start.length; i++) {
    activities.push({ start: start[i], end: end[i], index: i });
  }
  
  // 按照活动结束时间排序
  activities.sort((a, b) => a.end - b.end);
  
  // 选择第一个活动
  const selected = [activities[0]];
  let lastEnd = activities[0].end;
  
  // 贪心选择：如果下一个活动的开始时间大于等于当前结束时间，则可以参加
  for (let i = 1; i < activities.length; i++) {
    if (activities[i].start >= lastEnd) {
      selected.push(activities[i]);
      lastEnd = activities[i].end;
    }
  }
  
  // 返回选择的活动索引
  return selected.map(activity => activity.index);
}

/**
 * 4. Huffman编码
 * 用于数据压缩的一种编码方式，根据字符出现频率构建最优前缀编码。
 * 
 * @param {Object} freq - 字符频率对象，键为字符，值为频率
 * @return {Object} - Huffman编码对象，键为字符，值为编码
 */
function huffmanEncoding(freq) {
  // 优先队列（最小堆）的简单实现
  class PriorityQueue {
    constructor() {
      this.values = [];
    }
    
    enqueue(val, priority) {
      this.values.push({ val, priority });
      this.sort();
    }
    
    dequeue() {
      return this.values.shift();
    }
    
    sort() {
      this.values.sort((a, b) => a.priority - b.priority);
    }
    
    isEmpty() {
      return !this.values.length;
    }
    
    size() {
      return this.values.length;
    }
  }
  
  // Huffman树节点
  class Node {
    constructor(char, freq) {
      this.char = char;
      this.freq = freq;
      this.left = null;
      this.right = null;
    }
  }
  
  // 1. 创建叶子节点并加入优先队列
  const pq = new PriorityQueue();
  for (const char in freq) {
    pq.enqueue(new Node(char, freq[char]), freq[char]);
  }
  
  // 2. 构建Huffman树
  while (pq.size() > 1) {
    // 取出两个频率最小的节点
    const left = pq.dequeue().val;
    const right = pq.dequeue().val;
    
    // 创建新的内部节点，频率为两个子节点频率之和
    const newNode = new Node(null, left.freq + right.freq);
    newNode.left = left;
    newNode.right = right;
    
    // 将新节点加入优先队列
    pq.enqueue(newNode, newNode.freq);
  }
  
  // 3. 获取Huffman树的根节点
  const root = pq.dequeue().val;
  
  // 4. 生成编码
  const codes = {};
  
  function generateCodes(node, code = '') {
    if (!node) return;
    
    // 如果是叶子节点（有字符值），则记录编码
    if (node.char) {
      codes[node.char] = code;
      return;
    }
    
    // 递归生成左右子树的编码
    generateCodes(node.left, code + '0');
    generateCodes(node.right, code + '1');
  }
  
  generateCodes(root);
  return codes;
}

/**
 * 5. 最小生成树 - Kruskal算法
 * 在一个连通加权无向图中找出一棵最小生成树，使得树中边的权值总和最小。
 * 
 * @param {number} vertices - 图中顶点数量
 * @param {Array} edges - 边的数组，每条边表示为 [u, v, weight]
 * @return {Array} - 最小生成树的边集合
 */
function kruskalMST(vertices, edges) {
  // 并查集实现
  class DisjointSet {
    constructor(n) {
      this.parent = Array(n).fill().map((_, i) => i);
      this.rank = Array(n).fill(0);
    }
    
    find(x) {
      if (this.parent[x] !== x) {
        this.parent[x] = this.find(this.parent[x]);
      }
      return this.parent[x];
    }
    
    union(x, y) {
      const rootX = this.find(x);
      const rootY = this.find(y);
      
      if (rootX === rootY) return false;
      
      if (this.rank[rootX] < this.rank[rootY]) {
        this.parent[rootX] = rootY;
      } else if (this.rank[rootX] > this.rank[rootY]) {
        this.parent[rootY] = rootX;
      } else {
        this.parent[rootY] = rootX;
        this.rank[rootX]++;
      }
      
      return true;
    }
  }
  
  // 按照边的权重排序
  edges.sort((a, b) => a[2] - b[2]);
  
  const result = [];
  const ds = new DisjointSet(vertices);
  
  // 贪心策略：优先选择权重最小的边，且不形成环
  for (const [u, v, weight] of edges) {
    if (ds.union(u, v)) {
      result.push([u, v, weight]);
      
      // 如果已经选择了足够的边（n-1条边），则结束
      if (result.length === vertices - 1) {
        break;
      }
    }
  }
  
  return result;
}

// 测试找零钱问题
function testCoinChange() {
  console.log('\n----------- 找零钱问题测试 -----------');
  
  // 标准美元系统
  const usCoins = [25, 10, 5, 1]; // 美分
  
  console.log('美元系统找零（贪心是最优的）:');
  console.log('金额: 63 美分');
  console.log(coinChangeDetail(usCoins, 63));
  
  console.log('\n金额: 42 美分');
  console.log(coinChangeDetail(usCoins, 42));
  
  // 非标准系统（贪心可能不是最优解）
  const nonStandardCoins = [1, 3, 4];
  console.log('\n非标准硬币系统（贪心可能不是最优的）:');
  console.log('面额: [1, 3, 4], 金额: 6');
  console.log('贪心结果:');
  console.log(coinChangeDetail(nonStandardCoins, 6));
  console.log('实际最优结果应该是 2 个硬币（使用面额 3 两次）');
}

// 测试区间调度问题
function testMaxMeetings() {
  console.log('\n----------- 区间调度问题测试 -----------');
  
  // 会议示例，每个会议为 [开始时间, 结束时间]
  const meetings = [
    [1, 3],
    [2, 4],
    [3, 5],
    [4, 7],
    [5, 9],
    [6, 10],
    [8, 11],
    [9, 12]
  ];
  
  console.log('会议时间:');
  meetings.forEach((m, i) => {
    console.log(`会议 ${i+1}: 开始于 ${m[0]}, 结束于 ${m[1]}`);
  });
  
  const maxCount = maxMeetings(meetings);
  console.log(`\n最多可以参加 ${maxCount} 个会议`);
  
  // 带有会议ID的详细版本
  const detailedMeetings = [
    { id: 1, start: 1, end: 3 },
    { id: 2, start: 2, end: 4 },
    { id: 3, start: 3, end: 5 },
    { id: 4, start: 4, end: 7 },
    { id: 5, start: 5, end: 9 },
    { id: 6, start: 6, end: 10 },
    { id: 7, start: 8, end: 11 },
    { id: 8, start: 9, end: 12 }
  ];
  
  const selectedMeetings = maxMeetingsDetail(detailedMeetings);
  console.log('\n可以参加的会议:');
  selectedMeetings.forEach(m => {
    console.log(`会议 ${m.id}: 开始于 ${m.start}, 结束于 ${m.end}`);
  });
}

// 测试活动选择问题
function testActivitySelection() {
  console.log('\n----------- 活动选择问题测试 -----------');
  
  // 活动的开始和结束时间
  const start = [1, 3, 0, 5, 8, 5];
  const end = [2, 4, 6, 7, 9, 9];
  
  console.log('活动时间:');
  for (let i = 0; i < start.length; i++) {
    console.log(`活动 ${i}: 开始于 ${start[i]}, 结束于 ${end[i]}`);
  }
  
  const selected = activitySelection(start, end);
  console.log('\n选择的活动索引:', selected);
  console.log('选择的活动详情:');
  selected.forEach(i => {
    console.log(`活动 ${i}: 开始于 ${start[i]}, 结束于 ${end[i]}`);
  });
}

// 测试Huffman编码
function testHuffmanEncoding() {
  console.log('\n----------- Huffman编码测试 -----------');
  
  // 字符频率
  const freq = {
    'a': 5,
    'b': 9,
    'c': 12,
    'd': 13,
    'e': 16,
    'f': 45
  };
  
  console.log('字符频率:');
  for (const char in freq) {
    console.log(`${char}: ${freq[char]}`);
  }
  
  const codes = huffmanEncoding(freq);
  console.log('\nHuffman编码:');
  for (const char in codes) {
    console.log(`${char}: ${codes[char]}`);
  }
  
  // 计算编码效率
  let originalBits = 0;
  let encodedBits = 0;
  
  for (const char in freq) {
    originalBits += freq[char] * 8; // 假设每个字符原始编码为8位
    encodedBits += freq[char] * codes[char].length;
  }
  
  console.log('\n压缩效率:');
  console.log(`原始位数: ${originalBits}`);
  console.log(`编码后位数: ${encodedBits}`);
  console.log(`压缩率: ${(1 - encodedBits / originalBits) * 100}%`);
}

// 测试Kruskal算法
function testKruskalMST() {
  console.log('\n----------- Kruskal最小生成树算法测试 -----------');
  
  // 图的边 [起点, 终点, 权重]
  const edges = [
    [0, 1, 4],
    [0, 2, 3],
    [1, 2, 1],
    [1, 3, 2],
    [2, 3, 4],
    [3, 4, 2],
    [4, 5, 6]
  ];
  
  const vertices = 6; // 顶点数量
  
  console.log('图的边:');
  edges.forEach(e => {
    console.log(`${e[0]} -- ${e[1]}: 权重 ${e[2]}`);
  });
  
  const mst = kruskalMST(vertices, edges);
  
  console.log('\n最小生成树的边:');
  let totalWeight = 0;
  mst.forEach(e => {
    console.log(`${e[0]} -- ${e[1]}: 权重 ${e[2]}`);
    totalWeight += e[2];
  });
  
  console.log(`\n最小生成树的总权重: ${totalWeight}`);
}

// 运行所有测试
function runAllTests() {
  testCoinChange();
  testMaxMeetings();
  testActivitySelection();
  testHuffmanEncoding();
  testKruskalMST();
  
  console.log('\n----------- 总结 -----------');
  console.log('1. 贪心算法在每一步都做出当前看来最好的选择');
  console.log('2. 贪心算法不一定总是能得到最优解，但在许多问题中能提供高效的解决方案');
  console.log('3. 关键是选择合适的贪心策略，如区间调度问题中选择结束时间最早的会议');
  console.log('4. 贪心算法通常比动态规划更简单、更高效，但应用范围更小');
  console.log('5. 在某些问题（如标准硬币系统的找零）中，贪心算法能得到最优解');
}

// 执行所有测试
runAllTests(); 