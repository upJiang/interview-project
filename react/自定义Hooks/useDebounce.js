import { useEffect, useState } from "react";

/**
 * useDebounce Hook - 防抖自定义Hook
 *
 * 防抖是前端开发中常用的优化技术，特别适用于：
 * - 搜索框输入
 * - 按钮点击防重复
 * - 窗口resize事件
 * - API请求优化
 *
 * 面试考察点：
 * 1. 自定义Hook的设计思路
 * 2. useEffect的清理函数
 * 3. 防抖算法的实现
 * 4. 性能优化的理解
 */

/**
 * 基础防抖Hook
 * @param {*} value 需要防抖的值
 * @param {number} delay 延迟时间（毫秒）
 * @returns {*} 防抖后的值
 */
function useDebounce(value, delay) {
  // 用于存储防抖后的值
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // 设置定时器，延迟更新值
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函数：清除定时器
    // 当value或delay变化时，会先执行清理函数，再执行新的effect
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]); // 依赖数组：当value或delay变化时重新执行

  return debouncedValue;
}

/**
 * 增强版防抖Hook - 支持立即执行
 * @param {*} value 需要防抖的值
 * @param {number} delay 延迟时间
 * @param {boolean} immediate 是否立即执行第一次
 * @returns {*} 防抖后的值
 */
function useDebounceAdvanced(value, delay, immediate = false) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isFirstCall, setIsFirstCall] = useState(true);

  useEffect(() => {
    // 如果是立即执行且是第一次调用
    if (immediate && isFirstCall) {
      setDebouncedValue(value);
      setIsFirstCall(false);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, immediate, isFirstCall]);

  return debouncedValue;
}

/**
 * 防抖回调Hook - 用于防抖函数调用
 * @param {Function} callback 需要防抖的回调函数
 * @param {number} delay 延迟时间
 * @param {Array} deps 依赖数组
 * @returns {Function} 防抖后的回调函数
 */
function useDebounceCallback(callback, delay, deps = []) {
  const [debouncedCallback, setDebouncedCallback] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCallback(() => callback);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [callback, delay, ...deps]);

  return debouncedCallback;
}

/**
 * 更实用的防抖函数Hook
 * @param {Function} func 需要防抖的函数
 * @param {number} delay 延迟时间
 * @param {Object} options 配置选项
 * @returns {Function} 防抖后的函数
 */
function useDebounceFn(func, delay, options = {}) {
  const { immediate = false, maxWait } = options;
  const [timer, setTimer] = useState(null);
  const [maxTimer, setMaxTimer] = useState(null);

  // 清理定时器
  const clearTimers = () => {
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
    if (maxTimer) {
      clearTimeout(maxTimer);
      setMaxTimer(null);
    }
  };

  // 防抖函数
  const debouncedFn = (...args) => {
    // 清除之前的定时器
    clearTimers();

    // 立即执行选项
    if (immediate && !timer) {
      func.apply(this, args);
    }

    // 设置新的定时器
    const newTimer = setTimeout(() => {
      if (!immediate) {
        func.apply(this, args);
      }
      clearTimers();
    }, delay);

    setTimer(newTimer);

    // 最大等待时间
    if (maxWait && !maxTimer) {
      const newMaxTimer = setTimeout(() => {
        func.apply(this, args);
        clearTimers();
      }, maxWait);
      setMaxTimer(newMaxTimer);
    }
  };

  // 取消防抖
  const cancel = () => {
    clearTimers();
  };

  // 立即执行
  const flush = (...args) => {
    clearTimers();
    func.apply(this, args);
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  return {
    run: debouncedFn,
    cancel,
    flush,
  };
}

/**
 * 使用示例组件
 */
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // 使用防抖Hook，避免频繁搜索
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // 当防抖后的搜索词变化时，执行搜索
  useEffect(() => {
    if (debouncedSearchTerm) {
      setLoading(true);
      // 模拟API调用
      setTimeout(() => {
        setResults([
          `结果1: ${debouncedSearchTerm}`,
          `结果2: ${debouncedSearchTerm}`,
          `结果3: ${debouncedSearchTerm}`,
        ]);
        setLoading(false);
      }, 1000);
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm]);

  return (
    <div>
      <input
        type="text"
        placeholder="搜索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {loading && <div>搜索中...</div>}
      <ul>
        {results.map((result, index) => (
          <li key={index}>{result}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 防抖函数使用示例
 */
function ButtonComponent() {
  const [count, setCount] = useState(0);

  // 使用防抖函数Hook
  const {
    run: debouncedIncrement,
    cancel,
    flush,
  } = useDebounceFn(
    () => {
      setCount((prev) => prev + 1);
      console.log("防抖执行：计数器增加");
    },
    1000,
    { maxWait: 3000 }
  );

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={debouncedIncrement}>点击增加 (防抖1秒)</button>
      <button onClick={cancel}>取消防抖</button>
      <button onClick={flush}>立即执行</button>
    </div>
  );
}

// 导出
export {
  ButtonComponent,
  SearchComponent,
  useDebounce,
  useDebounceAdvanced,
  useDebounceCallback,
  useDebounceFn,
};

/**
 * 面试重点总结：
 *
 * 1. 防抖的核心原理：
 *    - 延迟执行：在事件触发后等待一定时间再执行
 *    - 重置定时器：新事件触发时清除之前的定时器
 *    - 只执行最后一次：确保在停止触发后只执行一次
 *
 * 2. useEffect的清理函数：
 *    - 返回的函数会在下次effect执行前或组件卸载时调用
 *    - 用于清理副作用，如定时器、事件监听器等
 *    - 防止内存泄漏
 *
 * 3. 自定义Hook的设计原则：
 *    - 封装复用逻辑
 *    - 遵循Hook规则
 *    - 提供清晰的API
 *    - 处理边界情况
 *
 * 4. 防抖的应用场景：
 *    - 搜索框输入：避免频繁请求API
 *    - 按钮点击：防止重复提交
 *    - 窗口resize：优化性能
 *    - 滚动事件：减少处理频率
 *
 * 5. 防抖vs节流：
 *    - 防抖：延迟执行，只执行最后一次
 *    - 节流：限制频率，定期执行
 *    - 选择依据：根据具体需求决定
 *
 * 6. 性能优化考虑：
 *    - 减少不必要的渲染
 *    - 降低API请求频率
 *    - 提升用户体验
 *    - 节省系统资源
 */
