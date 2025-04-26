/**
 * 100行代码实现React Fiber核心原理 - 精简到极致的Fiber架构
 * 
 * 主要概念:
 * 1. 可中断渲染: 通过工作单元和requestIdleCallback实现
 * 2. 双缓冲: 维护current和workInProgress两棵树
 * 3. 副作用收集: 标记需要执行的DOM操作
 * 4. 深度优先遍历: 处理完子节点再处理兄弟节点
 */

// 定义全局对象SumFiber，类似于React库的全局对象
const SumFiber = {};
// 定义常量，表示不同类型的Fiber节点和操作
const TEXT = 'TEXT',       // 文本节点类型
      PLACEMENT = 'PLACEMENT',  // 插入DOM操作
      UPDATE = 'UPDATE',        // 更新DOM操作
      DELETION = 'DELETION';    // 删除DOM操作

// 定义全局工作状态变量，存储Fiber树和工作进度
let nextUnitOfWork = null,       // 下一个工作单元，指向下一个要处理的Fiber节点
    workInProgressRoot = null,   // 当前正在构建的Fiber树的根节点
    currentRoot = null,          // 当前在屏幕上显示的Fiber树根节点（上一次渲染完成的树）
    pendingCommit = null;        // 待提交的Fiber树根节点，收集了所有副作用

// 创建React元素的函数，类似React.createElement，将JSX转换为虚拟DOM对象
SumFiber.createElement = (type, props = {}, ...children) => {
  // 处理子元素，将文本内容转换为文本节点对象
  const processedChildren = children.map(child => 
    // 如果子元素是文本或数字，创建一个文本节点对象
    typeof child === 'string' || typeof child === 'number'
      ? { type: TEXT, props: { nodeValue: String(child) }} : child
  ).filter(Boolean); // 过滤掉null和undefined
  
  // 将处理后的子元素添加到props.children中
  // 如果只有一个子元素，直接赋值；如果有多个，作为数组赋值
  props.children = processedChildren.length 
    ? (processedChildren.length === 1 ? processedChildren[0] : processedChildren) 
    : null;
  
  // 返回表示React元素的对象
  return { type, props, key: props.key || null };
};

// 渲染函数，类似ReactDOM.render，将React元素渲染到DOM容器中
SumFiber.render = (element, container) => {
  // 如果容器是字符串选择器，获取对应的DOM元素
  if (typeof container === 'string') container = document.querySelector(container);
  // 创建一个根Fiber节点，这是workInProgress树的起点
  workInProgressRoot = {
    tag: 'ROOT',                   // 根节点标记
    stateNode: container,          // 关联的DOM节点
    props: { children: [element] }, // 子元素
    alternate: currentRoot         // 链接到当前树中对应的节点，实现双缓冲
  };
  // 设置nextUnitOfWork为根节点，开始工作循环
  nextUnitOfWork = workInProgressRoot;
};

// requestIdleCallback的简单polyfill，用于浏览器不支持的情况
// 这个API允许在浏览器空闲时执行回调函数
const requestIdleCallback = window.requestIdleCallback || 
  (cb => setTimeout(() => cb({ timeRemaining: () => 10 }), 1));

// 工作循环 - Fiber架构的核心，实现可中断渲染
function workLoop(deadline) {
  // 标记是否应该让出控制权给浏览器
  let shouldYield = false;
  
  // 循环处理工作单元，直到没有工作或需要让出控制权
  while (nextUnitOfWork && !shouldYield) { // 有工作单元且不需要让出控制权
    // 处理当前工作单元，并获取下一个工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 检查是否还有足够时间继续工作
    shouldYield = deadline.timeRemaining() < 1; // 剩余时间不足1ms，让出控制权
  }
  
  // 如果没有更多工作单元但有待提交的更新，执行提交
  if (!nextUnitOfWork && pendingCommit) { // 渲染阶段完成，进入提交阶段
    commitRoot(pendingCommit); // 提交所有变更到DOM
    currentRoot = pendingCommit; // 更新currentRoot为新的树
    pendingCommit = null; // 清除待提交标记
  }
  
  // 安排下一次工作循环，实现连续的渲染过程
  requestIdleCallback(workLoop); // 继续请求浏览器空闲时间
}

// 启动首次工作循环
requestIdleCallback(workLoop);

// 执行工作单元，返回下一个工作单元 - 实现深度优先遍历
function performUnitOfWork(fiber) {
  // 处理当前fiber节点 - 根据节点类型执行不同操作
  if (fiber.tag === 'ROOT') { // 如果是根节点
    // 协调子节点（diff算法）
    reconcileChildren(fiber, fiber.props.children);
  } else if (fiber.tag === 'HOST') { // 如果是普通DOM节点
    // 如果没有对应的DOM节点，创建一个
    if (!fiber.stateNode) {
      // 创建DOM元素
      fiber.stateNode = document.createElement(fiber.type);
      // 设置DOM属性
      Object.keys(fiber.props || {}).forEach(key => {
        if (key !== 'children') { // 忽略children属性
          if (key.startsWith('on')) { // 事件处理
            // 添加事件监听器，转换为小写并去掉'on'前缀
            fiber.stateNode.addEventListener(key.toLowerCase().slice(2), fiber.props[key]);
          } else fiber.stateNode[key] = fiber.props[key]; // 设置普通属性
        }
      });
    }
    // 如果有子节点，进行子节点协调
    if (fiber.props.children) reconcileChildren(fiber, fiber.props.children);
  } else if (fiber.tag === TEXT) { // 如果是文本节点
    // 如果没有对应的DOM节点，创建一个文本节点
    if (!fiber.stateNode) fiber.stateNode = document.createTextNode(fiber.props.nodeValue || '');
  }
  
  // 返回下一个工作单元 - 深度优先遍历的实现
  // 优先处理子节点
  if (fiber.child) return fiber.child;
  // 如果没有子节点，尝试处理兄弟节点
  let nextFiber = fiber;
  while (nextFiber) {
    // 如果当前节点有副作用或子节点有副作用，记录待提交的根节点
    if (nextFiber.effectTag || nextFiber.firstEffect) pendingCommit = workInProgressRoot;
    // 如果有兄弟节点，返回兄弟节点
    if (nextFiber.sibling) return nextFiber.sibling;
    // 如果没有兄弟节点，返回父节点，继续寻找父节点的兄弟节点
    nextFiber = nextFiber.return;
  }
  // 如果所有节点都处理完毕，返回null
}

// 协调子节点 - 实现React的diff算法核心
function reconcileChildren(returnFiber, children) {
  // 如果没有子节点，直接返回
  if (!children) return;
  // 将单个子节点转换为数组，统一处理
  const childArray = Array.isArray(children) ? children : [children];
  // 获取上一次渲染的第一个子节点
  let oldFiber = returnFiber.alternate && returnFiber.alternate.child;
  // 前一个兄弟节点，用于构建兄弟节点链表
  let prevSibling = null;
  
  // 遍历子节点数组
  childArray.forEach((child, index) => {
    // 判断当前节点和旧节点是否可以复用（类型相同）
    const sameType = oldFiber && child && oldFiber.type === child.type;
    // 用于存储新的Fiber节点
    let newFiber;
    
    if (sameType) { // 类型相同，可以复用节点
      // 创建新的Fiber节点，复用旧节点的DOM元素
      newFiber = { type: oldFiber.type, tag: oldFiber.tag, stateNode: oldFiber.stateNode,
                  props: child.props, return: returnFiber, alternate: oldFiber, effectTag: UPDATE };
    } else {
      if (child) { // 有新节点但无法复用
        // 确定新节点的类型
        const tag = typeof child.type === 'string' ? 'HOST' : (child.type === TEXT ? TEXT : null);
        // 创建新的Fiber节点
        newFiber = { type: child.type, tag, props: child.props, return: returnFiber, effectTag: PLACEMENT };
      }
      if (oldFiber) { // 有旧节点但无法复用，需要删除
        // 标记为删除
        oldFiber.effectTag = DELETION;
        // 收集到effect list中，后续在提交阶段处理
        if (!returnFiber.firstEffect) returnFiber.firstEffect = oldFiber;
        else returnFiber.lastEffect.nextEffect = oldFiber;
        returnFiber.lastEffect = oldFiber;
      }
    }
    
    // 移动oldFiber指针到下一个兄弟节点
    if (oldFiber) oldFiber = oldFiber.sibling;
    
    // 将newFiber添加到Fiber树中
    if (index === 0) returnFiber.child = newFiber; // 第一个子节点
    else if (prevSibling) prevSibling.sibling = newFiber; // 其他子节点链接到兄弟节点
    
    // 更新前一个兄弟节点
    if (newFiber) prevSibling = newFiber;
  });
}

// 提交阶段 - 将所有变更应用到DOM
function commitRoot(root) {
  // 获取第一个有副作用的节点
  let fiber = root.firstEffect;
  // 遍历所有有副作用的节点
  while (fiber) {
    // 查找父DOM节点
    let parentFiber = fiber.return;
    while (parentFiber && !parentFiber.stateNode) parentFiber = parentFiber.return;
    // 获取父DOM节点
    const parentDom = parentFiber ? parentFiber.stateNode : null;
    
    // 如果有父DOM节点，执行DOM操作
    if (parentDom) {
      if (fiber.effectTag === PLACEMENT && fiber.stateNode) {
        // 插入新节点
        parentDom.appendChild(fiber.stateNode);
      } else if (fiber.effectTag === DELETION) {
        // 删除节点
        if (fiber.stateNode) parentDom.removeChild(fiber.stateNode);
        else if (fiber.child) commitDeletion(fiber.child, parentDom);
      }
    }
    // 移动到下一个有副作用的节点
    fiber = fiber.nextEffect;
  }
  // 清除effect list，避免重复提交
  root.firstEffect = root.lastEffect = null;
}

// 递归删除DOM节点
function commitDeletion(fiber, parentDom) {
  // 如果有DOM节点，直接从父节点中移除
  if (fiber.stateNode) parentDom.removeChild(fiber.stateNode);
  // 如果没有DOM节点但有子节点，递归删除子节点
  else if (fiber.child) commitDeletion(fiber.child, parentDom);
}

// 导出API，使其在浏览器环境中可用
if (typeof window !== 'undefined') window.SumFiber = SumFiber;