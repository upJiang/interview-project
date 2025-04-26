/**
 * 提交阶段
 * 
 * 提交阶段负责将渲染阶段收集的所有副作用应用到DOM上。
 * 这个阶段是同步的，不可中断的。
 */

// 确保全局命名空间存在
window.MiniFiber = window.MiniFiber || {};

/**
 * 提交根节点的所有副作用
 * @param {object} root - 根Fiber节点
 */
MiniFiber.commitRoot = function(root) {
  // 提交所有副作用
  let fiber = root.firstEffect;
  
  while (fiber) {
    // 执行副作用
    commitWork(fiber);
    // 移动到下一个副作用
    fiber = fiber.nextEffect;
  }
  
  // 清除effect list，避免重复提交
  root.firstEffect = root.lastEffect = null;
};

/**
 * 提交单个Fiber节点的工作
 * @param {object} fiber - Fiber节点
 */
function commitWork(fiber) {
  if (!fiber) return;
  
  // 找到父DOM节点
  let parentFiber = fiber.return;
  while (parentFiber && !parentFiber.stateNode) {
    parentFiber = parentFiber.return;
  }
  
  const parentDom = parentFiber ? parentFiber.stateNode : null;
  if (!parentDom) return;
  
  // 根据effectTag执行不同的操作
  switch (fiber.effectTag) {
    case MiniFiber.PLACEMENT:
      // 插入操作
      if (fiber.stateNode) {
        // 将节点插入到父节点中
        parentDom.appendChild(fiber.stateNode);
      }
      break;
    case MiniFiber.UPDATE:
      // 更新操作
      if (fiber.stateNode) {
        // 更新DOM属性
        updateDOMProperties(fiber.stateNode, 
          fiber.alternate ? (fiber.alternate.props || {}) : {}, 
          fiber.props || {});
      }
      break;
    case MiniFiber.DELETION:
      // 删除操作
      commitDeletion(fiber, parentDom);
      break;
  }
  
  // 清除effectTag
  fiber.effectTag = null;
}

/**
 * 提交删除操作
 * @param {object} fiber - 要删除的Fiber节点
 * @param {DOMElement} parentDom - 父DOM节点
 */
function commitDeletion(fiber, parentDom) {
  // 如果有DOM节点，直接从父节点中移除
  if (fiber.stateNode) {
    parentDom.removeChild(fiber.stateNode);
  } else if (fiber.child) {
    // 如果没有DOM节点（如组件），需要找到子节点并删除
    commitDeletion(fiber.child, parentDom);
  }
}

/**
 * 更新DOM属性
 * @param {DOMElement} dom - DOM元素
 * @param {object} oldProps - 旧的props
 * @param {object} newProps - 新的props
 */
function updateDOMProperties(dom, oldProps, newProps) {
  if (!dom) return;
  
  // 删除旧属性
  for (const key in oldProps) {
    if (key !== 'children' && !(key in newProps)) {
      if (key.startsWith('on')) {
        const eventType = key.toLowerCase().substring(2);
        dom.removeEventListener(eventType, oldProps[key]);
      } else {
        dom[key] = '';
      }
    }
  }
  
  // 设置新属性
  for (const key in newProps) {
    if (key !== 'children') {
      if (key.startsWith('on') && typeof newProps[key] === 'function') {
        // 处理事件监听器
        const eventType = key.toLowerCase().substring(2);
        dom.addEventListener(eventType, newProps[key]);
      } else {
        // 处理普通属性
        dom[key] = newProps[key];
      }
    }
  }
}