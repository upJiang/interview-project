/**
 * 链表节点删除问题
 * 
 * 包含两个问题：
 * 1. 删除排序链表中的重复元素
 * 2. 删除排序链表中的所有重复元素
 */

/**
 * 链表节点的定义
 */
function ListNode(val, next) {
  this.val = (val === undefined ? 0 : val);
  this.next = (next === undefined ? null : next);
}

/**
 * 问题一：删除排序链表中的重复元素
 * 
 * 题目描述：
 * 给定一个排序链表，删除所有重复的元素，使得每个元素只出现一次。
 * 
 * 示例 1：
 * 输入: 1->1->2
 * 输出: 1->2
 * 
 * 示例 2：
 * 输入: 1->1->2->3->3
 * 输出: 1->2->3
 */

/**
 * 删除排序链表中的重复元素，保留一个
 * 
 * 思路：
 * 1. 遍历链表，比较当前节点与下一个节点的值
 * 2. 如果相同，则跳过下一个节点
 * 3. 如果不同，则移动当前节点指针到下一个节点
 * 
 * 时间复杂度：O(n)，其中n是链表的长度
 * 空间复杂度：O(1)
 * 
 * @param {ListNode} head - 排序链表的头节点
 * @return {ListNode} 删除重复元素后的链表
 */
function deleteDuplicates(head) {
  // 如果链表为空或只有一个节点，直接返回
  if (!head || !head.next) {
    return head;
  }
  
  let current = head;
  
  while (current !== null && current.next !== null) {
    if (current.val === current.next.val) {
      // 如果当前节点与下一个节点的值相同
      // 删除下一个节点（跳过）
      current.next = current.next.next;
    } else {
      // 如果不同，移动到下一个节点
      current = current.next;
    }
  }
  
  return head;
}

/**
 * 问题二：删除排序链表中的所有重复元素 II
 * 
 * 题目描述：
 * 给定一个排序链表，删除所有含有重复数字的节点，只保留原始链表中没有重复出现的数字。
 * 
 * 示例 1：
 * 输入: 1->2->3->3->4->4->5
 * 输出: 1->2->5
 * 
 * 示例 2：
 * 输入: 1->1->1->2->3
 * 输出: 2->3
 */

/**
 * 删除排序链表中的所有重复元素，不保留重复元素
 * 
 * 思路：
 * 1. 创建一个哨兵节点，指向链表头
 * 2. 遍历链表，检查当前节点后面的节点是否有重复值
 * 3. 如果找到重复值，跳过所有值相同的节点
 * 4. 否则移动当前节点到下一个节点
 * 
 * 时间复杂度：O(n)，其中n是链表的长度
 * 空间复杂度：O(1)
 * 
 * @param {ListNode} head - 排序链表的头节点
 * @return {ListNode} 删除所有重复元素后的链表
 */
function deleteAllDuplicates(head) {
  // 如果链表为空或只有一个节点，直接返回
  if (!head || !head.next) {
    return head;
  }
  
  // 创建哨兵节点
  const dummy = new ListNode(0);
  dummy.next = head;
  
  let current = dummy;
  
  while (current.next !== null && current.next.next !== null) {
    if (current.next.val === current.next.next.val) {
      // 如果找到重复值
      const duplicateValue = current.next.val;
      
      // 跳过所有值等于duplicateValue的节点
      while (current.next !== null && current.next.val === duplicateValue) {
        current.next = current.next.next;
      }
    } else {
      // 如果不是重复值，移动到下一个节点
      current = current.next;
    }
  }
  
  return dummy.next;
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

// 测试用例 - 删除重复元素，保留一个
console.log("测试：删除排序链表中的重复元素，保留一个");

const list1 = createLinkedList([1, 1, 2]);
console.log("原链表:", printLinkedList(list1));  // 1 -> 1 -> 2
console.log("处理后:", printLinkedList(deleteDuplicates(list1)));  // 1 -> 2

const list2 = createLinkedList([1, 1, 2, 3, 3]);
console.log("原链表:", printLinkedList(createLinkedList([1, 1, 2, 3, 3])));  // 1 -> 1 -> 2 -> 3 -> 3
console.log("处理后:", printLinkedList(deleteDuplicates(list2)));  // 1 -> 2 -> 3

// 测试用例 - 删除所有重复元素，不保留
console.log("\n测试：删除排序链表中的所有重复元素，不保留重复元素");

const list3 = createLinkedList([1, 2, 3, 3, 4, 4, 5]);
console.log("原链表:", printLinkedList(createLinkedList([1, 2, 3, 3, 4, 4, 5])));  // 1 -> 2 -> 3 -> 3 -> 4 -> 4 -> 5
console.log("处理后:", printLinkedList(deleteAllDuplicates(list3)));  // 1 -> 2 -> 5

const list4 = createLinkedList([1, 1, 1, 2, 3]);
console.log("原链表:", printLinkedList(createLinkedList([1, 1, 1, 2, 3])));  // 1 -> 1 -> 1 -> 2 -> 3
console.log("处理后:", printLinkedList(deleteAllDuplicates(list4)));  // 2 -> 3

// 边界情况测试
console.log("\n边界情况测试：");

const emptyList = null;
console.log("空链表 (保留一个):", printLinkedList(deleteDuplicates(emptyList)));  // ""
console.log("空链表 (不保留):", printLinkedList(deleteAllDuplicates(emptyList)));  // ""

const singleNodeList = createLinkedList([1]);
console.log("单节点链表 (保留一个):", printLinkedList(deleteDuplicates(singleNodeList)));  // 1
console.log("单节点链表 (不保留):", printLinkedList(deleteAllDuplicates(singleNodeList)));  // 1

/**
 * 总结：
 * 
 * 1. 链表节点删除问题中，哨兵节点（dummy node）是很有用的技巧，特别是当头节点可能被删除时
 * 2. 删除链表节点的关键是修改前驱节点的next指针，而不是直接删除当前节点
 * 3. 在处理链表问题时，始终注意检查空指针（null）以避免错误
 * 4. 对于两个问题的区别：
 *    - 保留一个重复元素：只需比较当前节点和其next节点
 *    - 不保留重复元素：需要记录前驱节点，并检查后续连续的重复值
 * 5. 链表问题中，指针的移动需要仔细考虑，特别是在删除节点后
 */ 