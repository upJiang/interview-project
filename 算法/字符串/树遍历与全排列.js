/**
 * 树遍历与全排列
 * 
 * 本文件包含以下算法实现：
 * 1. 二叉树的遍历（深度优先：前序、中序、后序）
 * 2. 二叉树的广度优先遍历
 * 3. 数组的全排列算法
 */

/**
 * 二叉树节点定义
 */
class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

/**
 * 创建一个示例二叉树：
 *      1
 *     / \
 *    2   3
 *   / \   \
 *  4   5   6
 */
function createSampleTree() {
  const root = new TreeNode(1);
  root.left = new TreeNode(2);
  root.right = new TreeNode(3);
  root.left.left = new TreeNode(4);
  root.left.right = new TreeNode(5);
  root.right.right = new TreeNode(6);
  return root;
}

/**
 * 深度优先遍历（DFS）
 * 
 * 1. 前序遍历（根->左->右）
 * 2. 中序遍历（左->根->右）
 * 3. 后序遍历（左->右->根）
 */

/**
 * 前序遍历（递归实现）
 * 访问顺序：根->左->右
 * 
 * @param {TreeNode} root - 二叉树的根节点
 * @param {Array} result - 存储遍历结果的数组
 * @return {Array} 前序遍历结果数组
 */
function preorderTraversal(root, result = []) {
  if (!root) return result;
  
  // 访问根节点
  result.push(root.val);
  // 递归遍历左子树
  preorderTraversal(root.left, result);
  // 递归遍历右子树
  preorderTraversal(root.right, result);
  
  return result;
}

/**
 * 中序遍历（递归实现）
 * 访问顺序：左->根->右
 * 
 * @param {TreeNode} root - 二叉树的根节点
 * @param {Array} result - 存储遍历结果的数组
 * @return {Array} 中序遍历结果数组
 */
function inorderTraversal(root, result = []) {
  if (!root) return result;
  
  // 递归遍历左子树
  inorderTraversal(root.left, result);
  // 访问根节点
  result.push(root.val);
  // 递归遍历右子树
  inorderTraversal(root.right, result);
  
  return result;
}

/**
 * 后序遍历（递归实现）
 * 访问顺序：左->右->根
 * 
 * @param {TreeNode} root - 二叉树的根节点
 * @param {Array} result - 存储遍历结果的数组
 * @return {Array} 后序遍历结果数组
 */
function postorderTraversal(root, result = []) {
  if (!root) return result;
  
  // 递归遍历左子树
  postorderTraversal(root.left, result);
  // 递归遍历右子树
  postorderTraversal(root.right, result);
  // 访问根节点
  result.push(root.val);
  
  return result;
}

/**
 * 前序遍历（非递归实现）
 * 使用栈来模拟递归过程
 * 
 * @param {TreeNode} root - 二叉树的根节点
 * @return {Array} 前序遍历结果数组
 */
function preorderTraversalIterative(root) {
  const result = [];
  if (!root) return result;
  
  const stack = [root];
  
  while (stack.length > 0) {
    // 弹出栈顶节点
    const node = stack.pop();
    // 访问该节点
    result.push(node.val);
    
    // 先将右子节点入栈，再将左子节点入栈
    // 这样出栈顺序就是先左后右
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  
  return result;
}

/**
 * 中序遍历（非递归实现）
 * 使用栈来模拟递归过程
 * 
 * @param {TreeNode} root - 二叉树的根节点
 * @return {Array} 中序遍历结果数组
 */
function inorderTraversalIterative(root) {
  const result = [];
  if (!root) return result;
  
  const stack = [];
  let current = root;
  
  while (current || stack.length > 0) {
    // 将所有左子节点入栈
    while (current) {
      stack.push(current);
      current = current.left;
    }
    
    // 弹出栈顶节点（此时该节点没有左子节点或左子树已访问完）
    current = stack.pop();
    // 访问该节点
    result.push(current.val);
    // 处理右子树
    current = current.right;
  }
  
  return result;
}

/**
 * 后序遍历（非递归实现）
 * 使用两个栈来模拟递归过程
 * 
 * @param {TreeNode} root - 二叉树的根节点
 * @return {Array} 后序遍历结果数组
 */
function postorderTraversalIterative(root) {
  const result = [];
  if (!root) return result;
  
  const stack1 = [root];
  const stack2 = [];
  
  // 先将节点按照根->右->左的顺序放入stack2
  while (stack1.length > 0) {
    const node = stack1.pop();
    stack2.push(node);
    
    if (node.left) stack1.push(node.left);
    if (node.right) stack1.push(node.right);
  }
  
  // 从stack2弹出的顺序就是左->右->根
  while (stack2.length > 0) {
    result.push(stack2.pop().val);
  }
  
  return result;
}

/**
 * 广度优先遍历（BFS）
 * 使用队列实现，按层访问节点
 * 
 * @param {TreeNode} root - 二叉树的根节点
 * @return {Array} 广度优先遍历结果数组
 */
function breadthFirstTraversal(root) {
  const result = [];
  if (!root) return result;
  
  const queue = [root];
  
  while (queue.length > 0) {
    // 出队队首节点
    const node = queue.shift();
    // 访问该节点
    result.push(node.val);
    
    // 将子节点按从左到右的顺序入队
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  
  return result;
}

/**
 * 按层级输出的广度优先遍历
 * 每层节点值放在一个单独的数组中
 * 
 * @param {TreeNode} root - 二叉树的根节点
 * @return {Array} 按层级的遍历结果数组
 */
function levelOrderTraversal(root) {
  const result = [];
  if (!root) return result;
  
  const queue = [root];
  
  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel = [];
    
    // 处理当前层的所有节点
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);
      
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    
    result.push(currentLevel);
  }
  
  return result;
}

/**
 * 通用DOM树遍历（深度优先）
 * 
 * @param {Element} node - DOM节点
 * @param {Function} callback - 回调函数，接收节点作为参数
 */
function dfsDOM(node, callback) {
  if (!node) return;
  
  // 处理当前节点
  callback(node);
  
  // 遍历子节点
  const children = node.children || [];
  for (let i = 0; i < children.length; i++) {
    dfsDOM(children[i], callback);
  }
}

/**
 * 通用DOM树遍历（广度优先）
 * 
 * @param {Element} root - DOM根节点
 * @param {Function} callback - 回调函数，接收节点作为参数
 */
function bfsDOM(root, callback) {
  if (!root) return;
  
  const queue = [root];
  
  while (queue.length > 0) {
    const node = queue.shift();
    callback(node);
    
    const children = node.children || [];
    for (let i = 0; i < children.length; i++) {
      queue.push(children[i]);
    }
  }
}

/**
 * 全排列算法
 * 给定一个无重复数字的数组，返回其所有可能的全排列
 * 
 * @param {Array} nums - 无重复数字的数组
 * @return {Array} 全排列结果数组
 */
function permute(nums) {
  const result = [];
  
  // 回溯函数，path表示当前排列路径
  function backtrack(path) {
    // 如果路径长度等于原数组长度，表示找到了一个全排列
    if (path.length === nums.length) {
      // 将当前排列添加到结果中（注意要深拷贝）
      result.push([...path]);
      return;
    }
    
    // 尝试将每个还未使用的数字加入路径
    for (let i = 0; i < nums.length; i++) {
      // 如果当前数字已经在路径中，跳过
      if (path.includes(nums[i])) continue;
      
      // 将当前数字加入路径
      path.push(nums[i]);
      // 继续回溯
      backtrack(path);
      // 回溯：移除最后加入的数字
      path.pop();
    }
  }
  
  // 从空路径开始回溯
  backtrack([]);
  return result;
}

/**
 * 全排列算法（使用标记数组优化）
 * 避免使用includes方法，提高效率
 * 
 * @param {Array} nums - 无重复数字的数组
 * @return {Array} 全排列结果数组
 */
function permuteOptimized(nums) {
  const result = [];
  const used = new Array(nums.length).fill(false);
  
  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    
    for (let i = 0; i < nums.length; i++) {
      // 如果当前数字已使用，跳过
      if (used[i]) continue;
      
      // 标记为已使用
      used[i] = true;
      path.push(nums[i]);
      
      backtrack(path);
      
      // 回溯：取消标记并移除路径中的数字
      used[i] = false;
      path.pop();
    }
  }
  
  backtrack([]);
  return result;
}

/**
 * 全排列算法（处理有重复数字的情况）
 * 
 * @param {Array} nums - 可能包含重复数字的数组
 * @return {Array} 全排列结果数组（不包含重复排列）
 */
function permuteUnique(nums) {
  // 对数组排序，便于处理重复元素
  nums.sort((a, b) => a - b);
  
  const result = [];
  const used = new Array(nums.length).fill(false);
  
  function backtrack(path) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    
    for (let i = 0; i < nums.length; i++) {
      // 跳过已使用的元素
      if (used[i]) continue;
      
      // 如果当前元素与前一个元素相同，且前一个元素未使用，则跳过
      // 这确保了相同数字只会按照固定顺序被选择，避免重复排列
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;
      
      used[i] = true;
      path.push(nums[i]);
      
      backtrack(path);
      
      used[i] = false;
      path.pop();
    }
  }
  
  backtrack([]);
  return result;
}

// 测试树遍历
function testTreeTraversal() {
  console.log('\n----------- 树遍历测试 -----------');
  
  const tree = createSampleTree();
  
  console.log('树的结构:');
  console.log('      1      ');
  console.log('     / \\     ');
  console.log('    2   3    ');
  console.log('   / \\   \\   ');
  console.log('  4   5   6  ');
  
  console.log('\n深度优先遍历 (DFS):');
  console.log('前序遍历 (递归):', preorderTraversal(tree));
  console.log('前序遍历 (迭代):', preorderTraversalIterative(tree));
  console.log('中序遍历 (递归):', inorderTraversal(tree));
  console.log('中序遍历 (迭代):', inorderTraversalIterative(tree));
  console.log('后序遍历 (递归):', postorderTraversal(tree));
  console.log('后序遍历 (迭代):', postorderTraversalIterative(tree));
  
  console.log('\n广度优先遍历 (BFS):');
  console.log('层序遍历:', breadthFirstTraversal(tree));
  console.log('按层级输出:', levelOrderTraversal(tree));
}

// 测试全排列
function testPermutation() {
  console.log('\n----------- 全排列测试 -----------');
  
  const nums1 = [1, 2, 3];
  console.log(`数组 [${nums1}] 的全排列:`);
  console.log(permute(nums1));
  
  console.log('\n优化版全排列:');
  console.log(permuteOptimized(nums1));
  
  const nums2 = [1, 1, 2];
  console.log(`\n包含重复数字的数组 [${nums2}] 的全排列:`);
  console.log(permuteUnique(nums2));
}

// 运行测试
function runTests() {
  testTreeTraversal();
  testPermutation();
  
  console.log('\n----------- 总结 -----------');
  console.log('1. 二叉树的三种深度优先遍历方式: 前序、中序、后序');
  console.log('2. 广度优先遍历按层级访问节点，适合处理层级关系');
  console.log('3. 全排列问题可通过回溯法求解，关键是记录已使用的元素');
  console.log('4. 对于有重复元素的全排列，需要排序后处理相邻重复元素');
}

// 执行测试
runTests(); 