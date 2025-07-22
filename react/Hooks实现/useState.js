/**
 * useState Hook 的简单实现
 *
 * 这是一个模拟React useState Hook工作原理的简单实现
 * 主要用于理解useState的内部机制
 *
 * 面试考察点：
 * 1. 理解useState的工作原理
 * 2. 闭包的应用
 * 3. 状态管理的基本概念
 * 4. 函数式更新的实现
 */

// 全局变量模拟React的内部状态存储
let currentHookIndex = 0;
let hooks = [];

/**
 * 简单的useState实现
 * @param {*} initialState 初始状态值
 * @returns {Array} [state, setState] 状态值和更新函数
 */
function useState(initialState) {
  // 获取当前hook的索引
  const hookIndex = currentHookIndex;

  // 如果是第一次调用，初始化状态
  if (hooks[hookIndex] === undefined) {
    hooks[hookIndex] = initialState;
  }

  // 获取当前状态
  const state = hooks[hookIndex];

  // 创建setState函数
  const setState = (newState) => {
    // 支持函数式更新
    if (typeof newState === "function") {
      hooks[hookIndex] = newState(hooks[hookIndex]);
    } else {
      hooks[hookIndex] = newState;
    }

    // 触发重新渲染（在真实的React中，这会触发组件重新渲染）
    render();
  };

  // 移动到下一个hook索引
  currentHookIndex++;

  return [state, setState];
}

/**
 * 模拟组件渲染函数
 * 在真实的React中，这个函数会重新执行组件函数
 */
function render() {
  // 重置hook索引，准备下一次渲染
  currentHookIndex = 0;

  // 在真实场景中，这里会重新执行组件函数
  console.log("Component re-rendered");

  // 模拟组件重新渲染
  if (typeof window !== "undefined" && window.componentRender) {
    window.componentRender();
  }
}

/**
 * 更完整的useState实现，包含批处理
 */
class ReactLikeRenderer {
  constructor() {
    this.hooks = [];
    this.currentHookIndex = 0;
    this.isUpdating = false;
    this.pendingUpdates = [];
  }

  useState(initialState) {
    const hookIndex = this.currentHookIndex;

    // 初始化状态
    if (this.hooks[hookIndex] === undefined) {
      this.hooks[hookIndex] = {
        state: initialState,
        queue: [],
      };
    }

    const hook = this.hooks[hookIndex];
    const state = hook.state;

    // 创建setState函数
    const setState = (newState) => {
      // 将更新加入队列
      hook.queue.push(newState);

      // 如果不在更新过程中，开始批处理更新
      if (!this.isUpdating) {
        this.scheduleUpdate();
      }
    };

    this.currentHookIndex++;
    return [state, setState];
  }

  // 调度更新，模拟React的批处理
  scheduleUpdate() {
    if (this.isUpdating) return;

    this.isUpdating = true;

    // 使用微任务模拟React的调度
    Promise.resolve().then(() => {
      this.flushUpdates();
      this.isUpdating = false;
    });
  }

  // 执行所有待处理的更新
  flushUpdates() {
    this.hooks.forEach((hook) => {
      if (hook.queue.length > 0) {
        // 处理队列中的所有更新
        hook.queue.forEach((update) => {
          if (typeof update === "function") {
            hook.state = update(hook.state);
          } else {
            hook.state = update;
          }
        });

        // 清空队列
        hook.queue = [];
      }
    });

    // 重新渲染
    this.render();
  }

  render() {
    this.currentHookIndex = 0;
    console.log("Component re-rendered with batched updates");
  }
}

// 使用示例
function ExampleComponent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("React");

  console.log(`Count: ${count}, Name: ${name}`);

  return {
    count,
    name,
    increment: () => setCount(count + 1),
    incrementByAmount: (amount) => setCount((prev) => prev + amount),
    changeName: (newName) => setName(newName),
  };
}

// 测试代码
function testUseState() {
  console.log("=== 测试简单useState实现 ===");

  // 设置渲染函数
  window.componentRender = () => {
    const component = ExampleComponent();
    console.log("渲染结果:", component);
  };

  // 初始渲染
  const component = ExampleComponent();
  console.log("初始状态:", component);

  // 测试状态更新
  setTimeout(() => {
    component.increment();
  }, 1000);

  setTimeout(() => {
    component.incrementByAmount(5);
  }, 2000);

  setTimeout(() => {
    component.changeName("Vue");
  }, 3000);
}

// 导出
export { ReactLikeRenderer, testUseState, useState };

/**
 * 面试重点总结：
 *
 * 1. useState的核心原理：
 *    - 使用闭包保存状态
 *    - 通过索引区分不同的hook
 *    - 状态更新触发重新渲染
 *
 * 2. 为什么不能在条件语句中使用Hook？
 *    - Hook依赖调用顺序来维护状态
 *    - 条件调用会破坏索引对应关系
 *    - 导致状态混乱
 *
 * 3. 函数式更新的优势：
 *    - 避免闭包陷阱
 *    - 确保基于最新状态更新
 *    - 支持复杂的状态计算
 *
 * 4. 批处理更新：
 *    - 多个setState调用会被合并
 *    - 减少不必要的重新渲染
 *    - 提高性能
 *
 * 5. 状态更新的异步性：
 *    - setState不会立即更新状态
 *    - 需要等待下一次渲染
 *    - 可以通过useEffect监听状态变化
 */
