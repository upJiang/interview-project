/**
 * 合并两个有序链表
 * 
 * 题目描述：
 * 将两个升序链表合并为一个新的升序链表并返回。新链表是通过拼接给定的两个链表的所有节点组成的。
 * 
 * 示例：
 * 输入：1->2->4, 1->3->4
 * 输出：1->1->2->3->4->4
 */

/**
 * 链表节点的定义
 */
function ListNode(val, next) {
  this.val = (val === undefined ? 0 : val);
  this.next = (next === undefined ? null : next);
}

/**
 * 方法一：迭代法
 * 
 * 思路：
 * 1. 创建一个哨兵节点作为结果链表的头节点
 * 2. 维护一个指针指向结果链表的当前节点
 * 3. 比较两个链表的当前节点，将较小的节点接入结果链表
 * 4. 较小节点所在的链表指针后移一位
 * 5. 重复步骤3-4直到其中一个链表为空
 * 6. 将剩余链表接入结果链表
 * 
 * 时间复杂度：O(n + m)，其中n和m分别是两个链表的长度
 * 空间复杂度：O(1)，只需要常数的空间存储结果链表的头节点
 * 
 * @param {ListNode} l1 - 第一个有序链表
 * @param {ListNode} l2 - 第二个有序链表
 * @return {ListNode} 合并后的有序链表
 */
function mergeTwoListsIterative(l1, l2) {
  // 创建哨兵节点
  const dummy = new ListNode(-1);
  let current = dummy;
  
  // 当两个链表都不为空时，比较节点值
  while (l1 !== null && l2 !== null) {
    if (l1.val < l2.val) {
      current.next = l1;
      l1 = l1.next;
    } else {
      current.next = l2;
      l2 = l2.next;
    }
    current = current.next;
  }
  
  // 将剩余的链表接到结果链表
  current.next = l1 === null ? l2 : l1;
  
  // 返回哨兵节点的下一个节点，即合并后的链表
  return dummy.next;
}

/**
 * 方法二：递归法
 * 
 * 思路：
 * 1. 比较两个链表的头节点，取较小的节点作为合并后链表的头节点
 * 2. 递归地合并较小节点的下一个节点与另一个链表
 * 3. 返回合并后的链表头节点
 * 
 * 时间复杂度：O(n + m)，其中n和m分别是两个链表的长度
 * 空间复杂度：O(n + m)，递归调用会使用栈空间，取决于递归深度
 * 
 * @param {ListNode} l1 - 第一个有序链表
 * @param {ListNode} l2 - 第二个有序链表
 * @return {ListNode} 合并后的有序链表
 */
function mergeTwoLists(l1, l2) {
  // 基本情况：如果一个链表为空，返回另一个链表
  if (l1 === null) {
    return l2;
  }
  if (l2 === null) {
    return l1;
  }
  
  // 比较两个链表的头节点，选择较小的节点
  if (l1.val < l2.val) {
    // 递归合并l1.next和l2
    l1.next = mergeTwoLists(l1.next, l2);
    return l1;
  } else {
    // 递归合并l1和l2.next
    l2.next = mergeTwoLists(l1, l2.next);
    return l2;
  }
}

/**
 * 创建链表的辅助函数
 * @param {number[]} arr - 链表节点值数组
 * @return {ListNode} 创建的链表头节点
 */
function createLinkedList(arr) {
  if (!arr || arr.length === 0) {
    return null;
  }
  
  const dummy = new ListNode(0);
  let current = dummy;
  
  for (const val of arr) {
    current.next = new ListNode(val);
    current = current.next;
  }
  
  return dummy.next;
}

/**
 * 打印链表的辅助函数
 * @param {ListNode} head - 链表头节点
 * @return {string} 链表的字符串表示
 */
function printLinkedList(head) {
  const values = [];
  let current = head;
  
  while (current !== null) {
    values.push(current.val);
    current = current.next;
  }
  
  return values.join(" -> ");
}

// 测试用例
const l1 = createLinkedList([1, 2, 4]);
const l2 = createLinkedList([1, 3, 4]);

console.log("链表1:", printLinkedList(l1));  // 1 -> 2 -> 4
console.log("链表2:", printLinkedList(l2));  // 1 -> 3 -> 4

const mergedList1 = mergeTwoListsIterative(createLinkedList([1, 2, 4]), createLinkedList([1, 3, 4]));
console.log("迭代法合并结果:", printLinkedList(mergedList1));  // 1 -> 1 -> 2 -> 3 -> 4 -> 4

const mergedList2 = mergeTwoLists(createLinkedList([1, 2, 4]), createLinkedList([1, 3, 4]));
console.log("递归法合并结果:", printLinkedList(mergedList2));  // 1 -> 1 -> 2 -> 3 -> 4 -> 4

// 边界情况测试
console.log("\n边界情况测试:");

const emptyList = null;
const singleNodeList = createLinkedList([5]);

console.log("空链表 + 单节点链表 (迭代法):", 
  printLinkedList(mergeTwoListsIterative(emptyList, singleNodeList)));  // 5

console.log("空链表 + 单节点链表 (递归法):", 
  printLinkedList(mergeTwoLists(emptyList, singleNodeList)));  // 5

console.log("两个空链表 (迭代法):", 
  printLinkedList(mergeTwoListsIterative(null, null)));  // ""

console.log("两个空链表 (递归法):", 
  printLinkedList(mergeTwoLists(null, null)));  // ""

/**
 * 总结：
 * 
 * 1. 链表问题中，使用哨兵节点（dummy node）可以简化头节点的处理
 * 2. 迭代法的空间复杂度更低，但代码稍长
 * 3. 递归法的代码更简洁，但在链表很长时可能导致栈溢出
 * 4. 合并链表的核心思想是不断比较两个链表的当前节点，选择较小的节点进行连接
 * 5. 注意处理链表为空的边界情况
 */ 