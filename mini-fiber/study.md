# Mini-Fiber: React Fiber原理详解

## 如何运行mini-fiber项目

本项目是一个教学性质的React Fiber实现，主要用于展示Fiber架构的核心原理。运行项目的步骤如下：

1. **直接在浏览器中打开**：
   - 双击 `mini-fiber/example/index.html` 文件在浏览器中打开
   - 或者在命令行中运行 `start mini-fiber/example/index.html`

2. **如果遇到加载问题**，可以使用本地服务器：
   - 使用VS Code的Live Server扩展
   - 或安装Node.js后运行 `npx http-server` 
   - 或使用Python的 `python -m http.server`

示例应用是一个简单的计数器，展示了Fiber的工作流程和增量渲染原理。在控制台中查看日志可以更好地理解Fiber的工作方式。

## 一、Fiber架构简介

### 1.1 为什么需要Fiber

在React 16之前，React使用的是递归遍历的方式来遍历虚拟DOM树，这种方式一旦开始就无法中断，直到整个树遍历完成。当组件树很大时，递归遍历的时间可能超过16ms，导致页面掉帧，用户感觉到卡顿。

主要问题：
- **递归无法中断**：一旦开始，必须处理完整棵树
- **长时间占用主线程**：阻塞渲染、事件响应等
- **无法划分优先级**：所有更新都被视为同等重要

### 1.2 Fiber之前的协调算法

React 15及之前版本使用的是称为Stack Reconciler的协调算法：
- 采用深度优先遍历和递归方式处理虚拟DOM
- 使用JavaScript的函数调用栈管理遍历过程
- 同步执行，不可中断
- 没有任务优先级区分

### 1.3 Fiber的设计目标

Fiber架构的核心目标是实现"增量渲染"，即将渲染工作分解为多个小任务，分散到多个帧中执行。具体目标包括：

- **可中断的渲染**：能够暂停和恢复渲染工作
- **任务优先级**：高优先级任务可以打断低优先级任务
- **更好的用户体验**：减少卡顿，提高响应速度
- **基于requestIdleCallback**：利用浏览器空闲时间执行任务

## 二、Fiber核心概念

### 2.1 Fiber节点结构

Fiber节点是一个JavaScript对象，包含以下主要信息：

```javascript
{
  // 实例相关
  tag: 'div',        // 标记Fiber类型
  key: null,         // React元素的key
  type: 'div',       // React元素的类型
  stateNode: Node,   // DOM节点或组件实例
  
  // Fiber链接结构（链表结构）
  return: Fiber,     // 父Fiber
  child: Fiber,      // 第一个子Fiber
  sibling: Fiber,    // 下一个兄弟Fiber
  
  // 工作单元相关
  pendingProps: {},  // 新的props
  memoizedProps: {}, // 旧的props
  memoizedState: {},  // 旧的state
  updateQueue: [],   // 更新队列
  
  // 副作用相关
  effectTag: 'PLACEMENT', // 副作用标记
  nextEffect: Fiber,      // 下一个有副作用的Fiber
  firstEffect: Fiber,     // 第一个有副作用的子Fiber
  lastEffect: Fiber,      // 最后一个有副作用的子Fiber
  
  // 双缓冲相关
  alternate: Fiber    // 用于实现双缓冲的另一棵树中对应的Fiber
}
```

### 2.2 工作单元

Fiber架构将渲染工作分解为多个小单元，每个Fiber节点就是一个工作单元。React可以处理一个工作单元，然后将控制权交还给浏览器，让浏览器有机会响应用户事件或执行其他任务。

工作单元的处理逻辑：
1. 处理当前Fiber节点
2. 创建或更新子Fiber节点
3. 返回下一个工作单元（子节点、兄弟节点或父节点的兄弟节点）

### 2.3 双缓冲技术

Fiber架构使用双缓冲技术，维护两棵树：
- **current树**：当前在屏幕上显示的内容对应的Fiber树
- **workInProgress树**：正在构建的新的Fiber树

双缓冲的优势：
- 允许React在内存中构建新树而不影响当前显示的内容
- 只有当整个树构建完成后，才一次性提交更新，减少不一致状态
- 通过alternate属性连接两棵树中对应的节点

### 2.4 优先级和调度

Fiber架构引入了任务优先级的概念，不同类型的更新有不同的优先级：
- **同步优先级**：必须立即执行的任务，如用户输入
- **批量优先级**：可以稍后批量处理的任务
- **低优先级**：可以延迟处理的任务，如网络请求后的更新

React的调度器根据优先级决定何时执行任务，高优先级任务可以打断低优先级任务的执行。

## 三、Fiber工作流程

### 3.1 渲染阶段 (Render Phase)

渲染阶段是可中断的，包含两个主要步骤：

1. **Reconciliation（协调）**：
   - 遍历Fiber树，比较新旧虚拟DOM的差异
   - 为需要更新的节点打上标记（effectTag）
   - 这个过程是异步的，可以被中断

2. **构建workInProgress树**：
   - 基于current树和新的props创建workInProgress树
   - 复用可以复用的节点，创建需要新建的节点
   - 通过链表结构连接所有有副作用的节点

### 3.2 提交阶段 (Commit Phase)

提交阶段是同步且不可中断的，主要工作包括：

1. **执行副作用**：
   - 处理所有带有effectTag的节点
   - 插入、更新或删除DOM节点
   - 调用生命周期方法或hooks的副作用函数

2. **切换Fiber树**：
   - 将workInProgress树变为current树
   - 准备下一次渲染

### 3.3 协调过程

协调过程是渲染阶段的核心，主要流程为：

1. **beginWork**：
   - 处理当前Fiber节点
   - 根据新的props和state创建子Fiber节点
   - 返回子节点作为下一个工作单元

2. **completeWork**：
   - 当节点没有子节点或子节点处理完成时调用
   - 准备DOM操作
   - 收集副作用
   - 返回兄弟节点或父节点作为下一个工作单元

3. **commitWork**：
   - 在提交阶段执行所有收集到的副作用
   - 更新DOM

## 四、关键实现细节

### 4.1 requestIdleCallback的应用

React使用requestIdleCallback（或其polyfill）来调度任务：

```javascript
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
  
  // 如果还有工作要做，安排下一次执行
  if (nextUnitOfWork) {
    requestIdleCallback(workLoop);
  } else if (pendingCommit) {
    // 没有更多工作，但有待提交的更新
    commitRoot(pendingCommit);
  }
}

// 开始调度
requestIdleCallback(workLoop);
```

### 4.2 副作用收集

副作用是指需要在提交阶段执行的操作，如DOM更新、调用生命周期方法等：

```javascript
function completeWork(fiber) {
  const parent = fiber.return;
  
  // 收集当前节点的副作用
  if (fiber.effectTag) {
    if (parent.firstEffect) {
      fiber.nextEffect = parent.firstEffect;
      parent.firstEffect = fiber;
    } else {
      parent.firstEffect = parent.lastEffect = fiber;
    }
  }
  
  // 将子节点的副作用链接到父节点
  if (fiber.firstEffect) {
    if (parent.lastEffect) {
      parent.lastEffect.nextEffect = fiber.firstEffect;
    } else {
      parent.firstEffect = fiber.firstEffect;
    }
    parent.lastEffect = fiber.lastEffect;
  }
}
```

### 4.3 中断与恢复

Fiber架构的一个关键特性是能够中断和恢复工作：

- **中断**：当浏览器需要处理高优先级任务时，React可以保存当前的工作状态，让出控制权
- **恢复**：当浏览器有空闲时间时，React可以从上次中断的地方继续工作

这是通过维护nextUnitOfWork变量和链表结构实现的。

## 五、面试问题与回答

### 5.1 什么是React Fiber？为什么需要它？

**答**：React Fiber是React 16引入的新协调引擎，是对React核心算法的重写。它的主要目标是实现增量渲染：能够将渲染工作分解成多个小任务，分散到多个帧中执行，而不是一次性完成所有工作。

我们需要Fiber的原因是：
1. React 15及之前版本使用的递归遍历算法是同步的，一旦开始就无法中断，当组件树很大时，会长时间占用主线程，导致页面掉帧和卡顿
2. Fiber架构允许React暂停、中止或恢复渲染工作，提高应用响应速度
3. Fiber引入了优先级概念，使React能够区分高优先级和低优先级的更新，优先处理用户交互等紧急任务

### 5.2 Fiber节点包含哪些重要信息？

**答**：Fiber节点是一个JavaScript对象，包含以下关键信息：

1. **实例相关信息**：
   - tag：标记Fiber类型（如FunctionComponent、ClassComponent、HostComponent等）
   - key：React元素的key值
   - type：元素类型（如'div'、函数组件或类组件）
   - stateNode：指向实际DOM节点或组件实例

2. **Fiber树结构**：
   - return：指向父Fiber节点
   - child：指向第一个子Fiber节点
   - sibling：指向下一个兄弟Fiber节点

3. **工作单元信息**：
   - pendingProps：新的props
   - memoizedProps：已处理过的props
   - memoizedState：当前state
   - updateQueue：更新队列

4. **副作用相关**：
   - effectTag：标记需要执行的操作类型（如PLACEMENT, UPDATE, DELETION）
   - firstEffect/lastEffect：指向第一个和最后一个带有副作用的子Fiber
   - nextEffect：指向下一个有副作用的Fiber

5. **双缓冲**：
   - alternate：指向对应的Fiber节点（在另一棵树中）

### 5.3 Fiber架构的工作流程是怎样的？

**答**：Fiber架构的工作流程分为两个主要阶段：

1. **渲染阶段（Render Phase）**：
   - 这个阶段是可中断的，以异步方式执行
   - 通过workLoop循环处理每个工作单元（Fiber节点）
   - 使用深度优先遍历，构建workInProgress树
   - 对每个节点调用beginWork和completeWork
   - 收集所有需要执行的副作用
   
2. **提交阶段（Commit Phase）**：
   - 这个阶段是同步且不可中断的
   - 执行所有收集到的副作用（如DOM更新）
   - 调用生命周期方法或Effect Hooks
   - 将workInProgress树变为current树

工作流程简述：React从根节点开始，为每个需要更新的组件创建Fiber节点，通过链表结构将所有节点连接起来。在渲染阶段，React可以在处理每个节点后检查是否需要让出控制权。当所有工作完成或需要让出控制权时，React会记住当前位置，稍后再继续。当整个树处理完成后，进入提交阶段，执行所有副作用。

### 5.4 双缓冲技术在Fiber中的作用是什么？

**答**：双缓冲技术是Fiber架构的关键特性之一，指的是React同时维护两棵Fiber树：

1. **current树**：当前在屏幕上显示的内容对应的Fiber树
2. **workInProgress树**：正在构建的新的Fiber树

双缓冲的作用：
- 允许React在不影响当前界面的情况下，在内存中构建新的树
- 只有当整个workInProgress树构建完成后，React才会一次性切换到新树，减少中间状态导致的UI不一致
- 通过alternate属性将两棵树中对应的节点连接起来，便于复用节点
- 支持增量渲染，React可以暂停当前workInProgress树的构建，处理更高优先级的更新，然后再回来继续之前的工作

这种机制类似于游戏开发中常用的双缓冲渲染技术，能有效避免屏幕闪烁和不完整的界面。

### 5.5 Fiber与requestIdleCallback有什么关系？

**答**：Fiber架构的一个核心目标是利用浏览器的空闲时间执行渲染工作，而requestIdleCallback API正好提供了这种能力：

1. requestIdleCallback允许开发者在浏览器空闲时期执行后台或低优先级工作
2. React使用requestIdleCallback（或自己实现的polyfill）来调度渲染工作
3. 通过deadline参数，React可以知道还有多少时间可以工作，决定是否需要让出控制权
4. 当浏览器忙于处理用户输入或保持动画流畅时，React会暂停渲染工作
5. 当浏览器有空闲时间时，React会恢复之前的工作

具体实现中，React会在workLoop中检查是否还有足够的时间继续工作：

```javascript
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  
  // 安排下一次工作或提交更新
  // ...
}

requestIdleCallback(workLoop);
```

值得注意的是，React现在使用的是自己实现的调度器（Scheduler），而不是直接使用浏览器的requestIdleCallback，这是因为requestIdleCallback在某些浏览器中的实现有问题，而且React需要更精细的控制。

## 六、总结

React Fiber是React 16引入的新架构，它从根本上改变了React的渲染方式，使React能够实现增量渲染。通过将渲染工作拆分为多个小任务，并利用浏览器的空闲时间执行这些任务，Fiber架构显著提高了React应用的响应性和用户体验。

Fiber架构的关键特性包括：
- 可中断的渲染过程
- 基于优先级的任务调度
- 双缓冲技术
- 副作用的收集与处理

理解Fiber架构不仅有助于更好地使用React，还能帮助我们设计出更高效、更流畅的React应用。在面试中，掌握Fiber的核心概念和工作流程，能够展示你对React内部机制的深入理解，这是高级前端开发者必备的知识点。

## 七、React的Diff算法

React的Diff算法是一种高效的对比算法，专门针对UI更新进行了优化。它的核心思想是基于三个假设来简化复杂度：

1. **跨层级节点移动非常少见**：React只比较同级节点，不进行跨层级比较
2. **相同类型的组件生成相似的树结构**：不同类型的组件生成不同的树结构
3. **同一位置的元素在不同渲染过程中保持稳定**：使用key属性标识同一渲染过程中元素的稳定性

### Diff算法的三个层次

1. **树级比较（Tree Diff）**：
   - 只对比同级节点，忽略跨层级操作
   - 当发现节点不存在时，直接删除该节点及其子树
   - 时间复杂度从O(n³)优化到O(n)

2. **组件级比较（Component Diff）**：
   - 如果组件类型相同，则递归比较其虚拟DOM树
   - 如果组件类型不同，则视为完全不同的树，直接替换整个组件

3. **元素级比较（Element Diff）**：
   - 对同一层级的子节点进行比较，分为无key和有key两种情况
   - 无key：采用简单的顺序对比，可能导致低效更新
   - 有key：通过key快速识别相同元素，即使位置变化也能高效复用

### React Fiber中的Diff优化

在Fiber架构中，Diff算法得到进一步优化：
- 引入了优先级概念，可以中断低优先级的Diff
- 采用单链表结构，使遍历操作更加灵活
- 通过workInProgress树和current树的交替，实现增量更新
- 副作用链表（Effect List）高效收集需要更新的节点

总的来说，React的Diff算法通过巧妙的启发式规则将传统的O(n³)复杂度优化到了O(n)，大大提高了虚拟DOM比对的效率，这是React高性能的关键因素之一。

## 八、React和Vue的Diff算法对比

React和Vue虽然都使用了虚拟DOM和diff算法来提高渲染效率，但它们的实现方式和优化策略存在一些显著差异。本节主要对比React与Vue3的diff算法。

### 8.1 React与Vue3 Diff算法的主要区别

1. **算法核心思想**：
   - React：基于单向遍历的比较策略，结合Fiber架构实现可中断的渲染
   - Vue3：采用编译时优化和运行时结合的策略，通过静态分析减少比对工作量

2. **优化路径**：
   - React：通过时间切片和调度优化渲染过程，专注于运行时性能
   - Vue3：通过编译时分析减少需要比对的节点，专注于减少比对范围

3. **列表对比处理**：
   - React：主要依赖key值进行一轮遍历查找可复用节点
   - Vue3：采用改进的双端+最长递增子序列算法，减少DOM移动操作

### 8.2 React Diff算法的特点

**优点**：
- 实现相对简单，易于理解和维护
- 与Fiber架构紧密结合，支持时间切片和优先级调度
- 可中断和恢复比对过程，适合大型复杂应用
- 内存占用较小，算法稳定性好

**缺点**：
- 单向遍历在大量节点位置变化时性能较差
- 没有key时DOM重用效率低
- 对于逆序、移动等情况处理不够高效
- 没有针对静态内容的专门优化

### 8.3 Vue3的Diff算法创新

Vue3对diff算法进行了重大改进，引入了以下创新：

1. **静态节点提升（Static Hoisting）**：
   - 预编译阶段识别并提升静态节点，减少不必要的比对
   - 将不变的内容直接跳过，只处理动态内容

2. **静态属性标记（Patch Flag）**：
   - 标记动态绑定的属性类型，精确进行更新
   - 例如，只更新文本、只更新class等

3. **块树结构（Block Tree）**：
   - 将模板编译为块，每个块只追踪其内部的动态节点
   - 减少需要遍历的节点数量

4. **更快的列表对比算法**：
   - 结合最长递增子序列算法优化节点移动
   - 减少DOM移动操作数量

5. **PatchKeyedChildren优化**：
   - 前后缀优化：首先比较新旧列表的首尾节点
   - 最长递增子序列：确定哪些节点可以保持不动
   - 优化未知子序列的处理

### 8.4 React与Vue3对比分析

React的Fiber架构与Vue3的编译优化代表了两种不同的优化思路：

1. **运行时 vs 编译时**：
   - React主要通过运行时调度优化渲染过程
   - Vue3通过编译时优化减少需要比对的节点

2. **渲染控制**：
   - React能够控制和中断渲染过程，实现更细粒度的调度
   - Vue3通过降低比对成本来加速整体渲染过程

3. **更新精度**：
   - React是基于组件级别的更新
   - Vue3基于编译信息实现更精确的DOM更新

4. **框架特性**：
   - React的设计更专注于大型应用的一致性和稳定性
   - Vue3更专注于性能优化和开发效率的平衡

5. **适用场景**：
   - React的方式更适合大型应用和频繁整体更新的场景
   - Vue3的方式在模板结构相对稳定、局部更新频繁的场景下表现更佳

两者的diff算法都有各自的优势，React在时间切片和调度方面领先，而Vue3在静态分析和更新精确性方面表现更好。框架选择应该基于项目需求、团队熟悉度和应用场景来决定，而不仅仅是diff算法的优劣。