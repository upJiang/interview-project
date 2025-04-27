function dfsRecursive(node, result = []) {
  if (!node) return result;
  result.push(node); // 处理当前节点（如DOM节点或树节点）
  const children = node.children || [];
  for (const child of children) {
    dfsRecursive(child, result); // 递归遍历子节点
  }
  return result;
}

//   二叉树的深度优先遍历
// 所有遍历函数的入参都是树的根结点对象
function preorder(root) {
  // 递归边界，root 为空
  if (!root) {
    return;
  }

  // 输出当前遍历的结点值
  console.log("当前遍历的结点值是：", root.val);
  // 递归遍历左子树
  preorder(root.left);
  // 递归遍历右子树
  preorder(root.right);
}
