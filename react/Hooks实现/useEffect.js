/**
 * useEffect Hook 实现
 *
 * useEffect是React中处理副作用的核心Hook
 * 它结合了componentDidMount、componentDidUpdate和componentWillUnmount的功能
 *
 * 面试考察点：
 * 1. 依赖数组的比较机制
 * 2. 清理函数的执行时机
 * 3. 生命周期的模拟
 * 4. 无限循环的避免
 * 5. 性能优化策略
 */

let hookIndex = 0;
let hooks = [];
let isFirstRender = true;

/**
 * 简单的依赖数组比较函数
 * 使用Object.is进行浅比较
 */
function areEqual(prevDeps, nextDeps) {
  // 如果都是null或undefined，认为相等
  if (prevDeps === null && nextDeps === null) return true;
  if (prevDeps === null || nextDeps === null) return false;

  // 长度不同，认为不相等
  if (prevDeps.length !== nextDeps.length) return false;

  // 逐个比较每个依赖项
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) {
      return false;
    }
  }

  return true;
}

/**
 * 基础版本的useEffect实现
 * @param {Function} effect 副作用函数
 * @param {Array} deps 依赖数组
 */
function useEffect(effect, deps) {
  const currentIndex = hookIndex++;

  // 获取当前hook的存储位置
  const hook = hooks[currentIndex];

  // 判断是否需要执行effect
  let shouldRunEffect = false;

  if (!hook) {
    // 首次渲染，创建hook对象
    shouldRunEffect = true;
    hooks[currentIndex] = {
      effect,
      deps,
      cleanup: null,
    };
  } else {
    // 非首次渲染，比较依赖
    if (deps === undefined) {
      // 没有依赖数组，每次都执行
      shouldRunEffect = true;
    } else if (!areEqual(hook.deps, deps)) {
      // 依赖发生变化，需要执行
      shouldRunEffect = true;
    }

    // 更新hook信息
    hooks[currentIndex] = {
      effect,
      deps,
      cleanup: hook.cleanup,
    };
  }

  // 执行清理函数
  if (shouldRunEffect && hook && hook.cleanup) {
    hook.cleanup();
    hooks[currentIndex].cleanup = null;
  }

  // 执行effect
  if (shouldRunEffect) {
    const cleanup = effect();
    if (typeof cleanup === "function") {
      hooks[currentIndex].cleanup = cleanup;
    }
  }
}

/**
 * 增强版useEffect实现
 * 支持更多功能和错误处理
 */
function useEffectAdvanced(effect, deps, options = {}) {
  const {
    onError = console.error,
    skipFirstRender = false,
    debugName = "useEffect",
  } = options;

  const currentIndex = hookIndex++;
  const hook = hooks[currentIndex];

  let shouldRunEffect = false;

  if (!hook) {
    // 首次渲染
    shouldRunEffect = !skipFirstRender;
    hooks[currentIndex] = {
      effect,
      deps,
      cleanup: null,
      runCount: 0,
      debugName,
    };
  } else {
    // 非首次渲染
    if (deps === undefined) {
      shouldRunEffect = true;
    } else if (!areEqual(hook.deps, deps)) {
      shouldRunEffect = true;
    }

    hooks[currentIndex] = {
      ...hook,
      effect,
      deps,
    };
  }

  // 执行清理函数
  if (shouldRunEffect && hook && hook.cleanup) {
    try {
      hook.cleanup();
    } catch (error) {
      onError(`Error in cleanup function for ${debugName}:`, error);
    }
    hooks[currentIndex].cleanup = null;
  }

  // 执行effect
  if (shouldRunEffect) {
    try {
      const cleanup = effect();
      if (typeof cleanup === "function") {
        hooks[currentIndex].cleanup = cleanup;
      }
      hooks[currentIndex].runCount++;
    } catch (error) {
      onError(`Error in effect function for ${debugName}:`, error);
    }
  }
}

/**
 * 模拟组件重新渲染的函数
 */
function rerender() {
  hookIndex = 0;
  isFirstRender = false;
}

/**
 * 清理所有hooks
 */
function cleanup() {
  hooks.forEach((hook) => {
    if (hook && hook.cleanup) {
      try {
        hook.cleanup();
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    }
  });
  hooks = [];
  hookIndex = 0;
  isFirstRender = true;
}

/**
 * 获取hooks调试信息
 */
function getHooksDebugInfo() {
  return hooks.map((hook, index) => ({
    index,
    hasCleanup: !!hook.cleanup,
    depsLength: hook.deps ? hook.deps.length : "no deps",
    runCount: hook.runCount || 0,
    debugName: hook.debugName || "unnamed",
  }));
}

/**
 * 使用示例：基础用法
 */
function BasicEffectExample() {
  console.log("=== 基础useEffect示例 ===");

  let count = 0;

  // 模拟useState
  function useState(initialValue) {
    const currentIndex = hookIndex++;
    if (!hooks[currentIndex]) {
      hooks[currentIndex] = { value: initialValue };
    }

    const setValue = (newValue) => {
      hooks[currentIndex].value = newValue;
    };

    return [hooks[currentIndex].value, setValue];
  }

  const [state, setState] = useState(0);

  // 每次渲染都执行
  useEffect(() => {
    console.log("Effect执行：每次渲染");
    return () => {
      console.log("清理：每次渲染");
    };
  });

  // 只在首次渲染执行
  useEffect(() => {
    console.log("Effect执行：仅首次渲染");
    return () => {
      console.log("清理：仅首次渲染");
    };
  }, []);

  // 依赖state变化时执行
  useEffect(() => {
    console.log("Effect执行：state变化", state);
    return () => {
      console.log("清理：state变化");
    };
  }, [state]);

  return { state, setState };
}

/**
 * 使用示例：生命周期模拟
 */
function LifecycleExample() {
  console.log("=== 生命周期模拟示例 ===");

  // 模拟componentDidMount
  useEffect(() => {
    console.log("组件已挂载 (componentDidMount)");

    // 模拟componentWillUnmount
    return () => {
      console.log("组件将卸载 (componentWillUnmount)");
    };
  }, []);

  // 模拟componentDidUpdate
  useEffect(() => {
    if (!isFirstRender) {
      console.log("组件已更新 (componentDidUpdate)");
    }
  });
}

/**
 * 使用示例：数据获取
 */
function DataFetchingExample() {
  console.log("=== 数据获取示例 ===");

  let data = null;
  let loading = true;
  let error = null;

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        console.log("开始获取数据...");
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!cancelled) {
          const result = { id: 1, name: "测试数据" };
          data = result;
          loading = false;
          console.log("数据获取成功:", result);
        }
      } catch (err) {
        if (!cancelled) {
          error = err;
          loading = false;
          console.error("数据获取失败:", err);
        }
      }
    }

    fetchData();

    // 清理函数，取消请求
    return () => {
      cancelled = true;
      console.log("取消数据获取");
    };
  }, []);

  return { data, loading, error };
}

/**
 * 使用示例：事件监听
 */
function EventListenerExample() {
  console.log("=== 事件监听示例 ===");

  useEffect(() => {
    function handleResize() {
      console.log("窗口大小改变:", window.innerWidth, window.innerHeight);
    }

    function handleScroll() {
      console.log("页面滚动:", window.scrollY);
    }

    // 添加事件监听器
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    console.log("事件监听器已添加");

    // 清理函数，移除事件监听器
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      console.log("事件监听器已移除");
    };
  }, []);
}

/**
 * 使用示例：定时器
 */
function TimerExample() {
  console.log("=== 定时器示例 ===");

  let count = 0;

  useEffect(() => {
    const timer = setInterval(() => {
      count++;
      console.log("定时器执行:", count);
    }, 1000);

    console.log("定时器已启动");

    // 清理函数，清除定时器
    return () => {
      clearInterval(timer);
      console.log("定时器已清除");
    };
  }, []);
}

/**
 * 使用示例：条件执行
 */
function ConditionalEffectExample(shouldRun) {
  console.log("=== 条件执行示例 ===");

  useEffect(() => {
    if (shouldRun) {
      console.log("条件满足，执行effect");
      return () => {
        console.log("条件effect清理");
      };
    }
  }, [shouldRun]);
}

/**
 * 使用示例：依赖数组的重要性
 */
function DependencyArrayExample() {
  console.log("=== 依赖数组示例 ===");

  let count = 0;
  let name = "React";

  // 错误示例：遗漏依赖
  useEffect(() => {
    console.log("错误示例 - 遗漏依赖:", count, name);
    // 这里使用了count和name，但依赖数组中没有包含它们
  }, []); // 依赖数组为空，只在首次渲染执行

  // 正确示例：包含所有依赖
  useEffect(() => {
    console.log("正确示例 - 包含依赖:", count, name);
  }, [count, name]); // 依赖数组包含所有使用的变量

  // 无依赖数组：每次都执行
  useEffect(() => {
    console.log("无依赖数组 - 每次执行");
  });
}

/**
 * 使用示例：性能优化
 */
function PerformanceExample() {
  console.log("=== 性能优化示例 ===");

  let expensiveValue = 0;

  // 使用依赖数组避免不必要的执行
  useEffect(() => {
    function calculateExpensiveValue() {
      console.log("执行昂贵的计算...");
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += i;
      }
      return result;
    }

    expensiveValue = calculateExpensiveValue();
    console.log("计算结果:", expensiveValue);
  }, []); // 空依赖数组，只在首次渲染执行
}

/**
 * 使用示例：错误处理
 */
function ErrorHandlingExample() {
  console.log("=== 错误处理示例 ===");

  useEffectAdvanced(
    () => {
      // 模拟可能出错的操作
      if (Math.random() > 0.5) {
        throw new Error("模拟错误");
      }

      console.log("Effect执行成功");

      return () => {
        // 清理函数中也可能出错
        if (Math.random() > 0.8) {
          throw new Error("清理函数错误");
        }
        console.log("清理函数执行成功");
      };
    },
    [],
    {
      onError: (message, error) => {
        console.error("捕获到错误:", message, error);
      },
      debugName: "ErrorHandlingExample",
    }
  );
}

/**
 * 测试函数
 */
function runTests() {
  console.log("开始测试useEffect实现...\n");

  // 测试基础功能
  console.log("1. 测试基础功能");
  const basic = BasicEffectExample();
  rerender();
  basic.setState(1);
  rerender();
  console.log("\n");

  // 测试生命周期
  console.log("2. 测试生命周期");
  LifecycleExample();
  rerender();
  console.log("\n");

  // 测试数据获取
  console.log("3. 测试数据获取");
  DataFetchingExample();
  console.log("\n");

  // 测试事件监听
  console.log("4. 测试事件监听");
  EventListenerExample();
  console.log("\n");

  // 测试定时器
  console.log("5. 测试定时器");
  TimerExample();
  console.log("\n");

  // 测试条件执行
  console.log("6. 测试条件执行");
  ConditionalEffectExample(true);
  rerender();
  ConditionalEffectExample(false);
  rerender();
  console.log("\n");

  // 测试依赖数组
  console.log("7. 测试依赖数组");
  DependencyArrayExample();
  console.log("\n");

  // 测试性能优化
  console.log("8. 测试性能优化");
  PerformanceExample();
  rerender();
  console.log("\n");

  // 测试错误处理
  console.log("9. 测试错误处理");
  ErrorHandlingExample();
  console.log("\n");

  // 显示调试信息
  console.log("10. 调试信息");
  console.log(getHooksDebugInfo());

  // 清理所有hooks
  cleanup();
  console.log("\n测试完成，hooks已清理");
}

// 导出
export {
  // 示例组件
  BasicEffectExample,
  ConditionalEffectExample,
  DataFetchingExample,
  DependencyArrayExample,
  ErrorHandlingExample,
  EventListenerExample,
  LifecycleExample,
  PerformanceExample,
  TimerExample,
  cleanup,
  getHooksDebugInfo,
  rerender,
  runTests,
  useEffect,
  useEffectAdvanced,
};

/**
 * 面试重点总结：
 *
 * 1. useEffect的执行时机：
 *    - 首次渲染后执行
 *    - 依赖变化时执行
 *    - 清理函数在下次effect执行前或组件卸载时执行
 *
 * 2. 依赖数组的作用：
 *    - 控制effect的执行频率
 *    - 避免无限循环
 *    - 性能优化的关键
 *
 * 3. 常见问题：
 *    - 遗漏依赖导致的bug
 *    - 无限循环的产生和避免
 *    - 异步操作的正确处理
 *    - 事件监听器的正确清理
 *
 * 4. 最佳实践：
 *    - 总是包含所有依赖
 *    - 使用ESLint插件检查依赖
 *    - 合理拆分effect
 *    - 正确处理异步操作
 *    - 及时清理副作用
 *
 * 5. 性能考虑：
 *    - 避免在effect中创建不必要的对象
 *    - 使用useCallback和useMemo优化依赖
 *    - 合理使用空依赖数组
 *    - 避免频繁的DOM操作
 */

// 如果在Node.js环境中运行，执行测试
if (typeof window === "undefined" && typeof global !== "undefined") {
  runTests();
}
