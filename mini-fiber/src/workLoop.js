/**
 * 工作循环
 * 
 * 工作循环是Fiber架构的核心，负责调度和执行工作单元。
 * 它使渲染过程可中断，从而提高应用的响应性。
 */

// 确保全局命名空间存在
window.MiniFiber = window.MiniFiber || {};

// 下一个工作单元
let nextUnitOfWork = null;
// 当前正在构建的Fiber树的根节点
let workInProgressRoot = null;
// 当前渲染在屏幕上的Fiber树的根节点
let currentRoot = null;
// 待提交的根节点
let pendingCommit = null;

/**
 * 调度更新
 * @param {object} element - React元素
 * @param {DOMElement} container - DOM容器
 */
MiniFiber.scheduleRoot = function(element, container) {
  // 创建一个新的Fiber节点作为根节点
  const rootFiber = {
    tag: 'HostRoot',
    stateNode: container,
    props: {
      children: [element]
    },
    alternate: currentRoot // 连接到旧树
  };
  
  // 设置下一个工作单元为根Fiber
  nextUnitOfWork = rootFiber;
  workInProgressRoot = rootFiber;
};

/**
 * 处理当前工作单元，返回下一个工作单元
 * @param {object} fiber - 当前的Fiber节点
 * @returns {object|null} - 下一个工作单元
 */
function performUnitOfWork(fiber) {
  // 1. 处理当前Fiber节点
  MiniFiber.beginWork(fiber);
  
  // 2. 返回下一个工作单元
  // 优先返回子节点
  if (fiber.child) {
    return fiber.child;
  }
  
  // 如果没有子节点，尝试返回兄弟节点或祖先节点的兄弟节点
  let nextFiber = fiber;
  while (nextFiber) {
    // 如果有待提交的更新，记录根节点
    if (nextFiber.effectTag || nextFiber.firstEffect) {
      pendingCommit = workInProgressRoot;
    }
    
    // 如果有兄弟节点，返回兄弟节点
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    
    // 否则，向上移动到父节点
    nextFiber = nextFiber.return;
  }
  
  return null;
}

/**
 * 工作循环
 * @param {IdleDeadline} deadline - 浏览器空闲时间的截止时间
 */
function workLoop(deadline) {
  // 是否应该让出控制权
  let shouldYield = false;
  
  // 有工作单元且不需要让出控制权时，继续处理
  while (nextUnitOfWork && !shouldYield) {
    // 处理当前工作单元，返回下一个工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    
    // 检查是否还有足够时间
    shouldYield = deadline.timeRemaining() < 1;
  }
  
  // 如果没有更多工作，但有待提交的更新
  if (!nextUnitOfWork && pendingCommit) {
    // 提交阶段
    MiniFiber.commitRoot(pendingCommit);
    // 更新currentRoot为刚处理完的树
    currentRoot = pendingCommit;
    // 清除pendingCommit
    pendingCommit = null;
  }
  
  // 安排下一次工作
  requestIdleCallback(workLoop);
}

// 开始调度
requestIdleCallback(workLoop);