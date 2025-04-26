/**
 * 协调器
 * 
 * 协调器负责比较新旧虚拟DOM，找出需要更新的部分，
 * 并为需要更新的节点创建对应的Fiber节点。
 */

// 确保全局命名空间存在
window.MiniFiber = window.MiniFiber || {};

/**
 * 开始处理当前Fiber节点
 * @param {object} fiber - 当前Fiber节点
 */
MiniFiber.beginWork = function(fiber) {
  // 根据Fiber类型执行不同的处理
  switch (fiber.tag) {
    case 'HostRoot':
      // 处理根节点
      reconcileChildren(fiber, fiber.props.children);
      break;
    case 'HostComponent':
      // 处理普通DOM节点
      if (!fiber.stateNode) {
        // 如果没有DOM实例，创建一个
        fiber.stateNode = document.createElement(fiber.type);
        // 更新DOM属性
        updateDOMProperties(fiber.stateNode, {}, fiber.pendingProps || {});
      }
      // 处理子元素
      if (fiber.pendingProps && fiber.pendingProps.children) {
        reconcileChildren(fiber, fiber.pendingProps.children);
      }
      break;
    case MiniFiber.ELEMENT_TEXT:
      // 处理文本节点
      if (!fiber.stateNode) {
        fiber.stateNode = document.createTextNode(fiber.pendingProps ? fiber.pendingProps.nodeValue : '');
      }
      break;
    // 可以添加其他类型的处理，如函数组件、类组件等
  }
};

/**
 * 协调子节点，创建子Fiber
 * @param {object} returnFiber - 父Fiber节点
 * @param {Array|object} children - 子元素
 */
function reconcileChildren(returnFiber, children) {
  // 如果没有子节点，直接返回
  if (!children) return;
  
  // 将单个子节点转换为数组
  const childrenArray = Array.isArray(children) ? children : [children];
  
  let oldFiber = returnFiber.alternate && returnFiber.alternate.child;
  let prevSibling = null; // 前一个兄弟节点
  let index = 0;
  
  // 遍历子元素
  while (index < childrenArray.length || oldFiber) {
    const child = childrenArray[index];
    let newFiber = null;
    
    // 判断是否可以复用旧节点
    const sameType = oldFiber && child && oldFiber.type === child.type;
    
    if (sameType) {
      // 类型相同，可以复用旧节点
      newFiber = {
        type: oldFiber.type,
        tag: oldFiber.tag,
        stateNode: oldFiber.stateNode,
        props: child.props || {},
        return: returnFiber,
        alternate: oldFiber,
        effectTag: MiniFiber.UPDATE,
        nextEffect: null
      };
    } else {
      // 类型不同，无法复用
      if (child) {
        // 创建新节点
        let tag;
        if (typeof child.type === 'string') {
          // DOM元素
          tag = 'HostComponent';
        } else if (child.type === MiniFiber.ELEMENT_TEXT) {
          // 文本
          tag = MiniFiber.ELEMENT_TEXT;
        }
        
        newFiber = {
          type: child.type,
          tag,
          props: child.props || {},
          return: returnFiber,
          effectTag: MiniFiber.PLACEMENT,
          nextEffect: null
        };
      }
      
      if (oldFiber) {
        // 标记旧节点为删除
        oldFiber.effectTag = MiniFiber.DELETION;
        // 添加到effect list
        collectEffects(returnFiber, oldFiber);
      }
    }
    
    // 移动oldFiber指针
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    
    // 将newFiber添加到Fiber树中
    if (index === 0) {
      // 第一个子节点
      returnFiber.child = newFiber;
    } else if (prevSibling && child) {
      // 其他子节点
      prevSibling.sibling = newFiber;
    }
    
    // 更新前一个兄弟节点
    prevSibling = newFiber;
    index++;
  }
}

/**
 * 收集副作用
 * @param {object} returnFiber - 父Fiber节点
 * @param {object} fiber - 当前Fiber节点
 */
function collectEffects(returnFiber, fiber) {
  // 将fiber添加到父节点的effect list末尾
  if (!returnFiber.firstEffect) {
    returnFiber.firstEffect = fiber;
  } else {
    returnFiber.lastEffect.nextEffect = fiber;
  }
  returnFiber.lastEffect = fiber;
}

/**
 * 更新DOM属性
 * @param {DOMElement} dom - DOM元素
 * @param {object} oldProps - 旧的props
 * @param {object} newProps - 新的props
 */
function updateDOMProperties(dom, oldProps, newProps) {
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