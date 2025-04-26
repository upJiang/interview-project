/**
 * Fiber节点结构
 * 
 * Fiber是React 16引入的新协调引擎中的核心数据结构，
 * 它是一个链表节点，保存了组件相关的信息，以及与其他Fiber节点的关系。
 */

// 创建全局命名空间
window.MiniFiber = window.MiniFiber || {};

// Fiber节点的类型标记
MiniFiber.ELEMENT_TEXT = 'ELEMENT_TEXT'; // 文本元素
MiniFiber.PLACEMENT = 'PLACEMENT';       // 插入操作
MiniFiber.UPDATE = 'UPDATE';             // 更新操作
MiniFiber.DELETION = 'DELETION';         // 删除操作

/**
 * 创建Fiber节点
 * @param {number} tag - Fiber的标签，用于标识Fiber类型
 * @param {object} pendingProps - 等待处理的props
 * @param {string} key - 节点的key
 * @returns {object} - 返回Fiber节点
 */
MiniFiber.createFiber = function(tag, pendingProps, key) {
  return {
    // 实例相关
    tag,                // 标记Fiber类型
    key,                // 唯一标识
    type: null,         // 元素类型，如div, span等或者函数组件、类组件
    stateNode: null,    // 真实DOM节点或组件实例

    // Fiber链接结构 (链表结构)
    return: null,       // 父Fiber
    child: null,        // 第一个子Fiber
    sibling: null,      // 下一个兄弟Fiber
    index: 0,           // 在兄弟节点中的索引

    // 工作单元相关
    pendingProps,       // 新的props
    memoizedProps: null,// 旧的props
    memoizedState: null,// 旧的state
    updateQueue: null,  // 更新队列
    
    // 副作用相关
    effectTag: null,    // 副作用标记 (如PLACEMENT, UPDATE, DELETION)
    nextEffect: null,   // 指向下一个有副作用的Fiber
    firstEffect: null,  // 第一个有副作用的子Fiber
    lastEffect: null,   // 最后一个有副作用的子Fiber
    
    // 替代品 - 双缓冲技术
    alternate: null,    // 指向workInProgress树中对应的Fiber
  };
};

/**
 * 创建文本类型的Fiber节点
 * @param {string} text - 文本内容
 * @returns {object} - 返回文本类型的Fiber节点
 */
MiniFiber.createTextFiber = function(text) {
  return {
    tag: MiniFiber.ELEMENT_TEXT,
    type: MiniFiber.ELEMENT_TEXT,
    pendingProps: { nodeValue: text },
    stateNode: document.createTextNode(text)
  };
};