function bfsQueue(root) {
  const queue = [root],
    result = [];
  while (queue.length) {
    const node = queue.shift(); // 先进先出
    if (!node) continue;
    result.push(node);
    const children = node.children || [];
    for (const child of children) {
      queue.push(child); // 子节点顺序入队
    }
  }
  return result;
}

//   二叉树的广度优先遍历
function BFS(root) {
  const queue = [root];
  const result = [];
  while (queue.length) {
    const top = queue[0];
    result.push(top.val);
    if (top.left) {
      queue.push(top.left);
      result.push(top.left.val);
    }
    if (top.right) {
      queue.push(top.right);
      result.push(top.right.val);
    }

    queue.shift();
  }
  return result;
}
