import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useThrottle Hook - 节流自定义Hook
 *
 * 节流是另一种限制函数执行频率的技术，与防抖不同：
 * - 防抖：延迟执行，只执行最后一次
 * - 节流：限制频率，定期执行
 *
 * 适用场景：
 * - 滚动事件处理
 * - 鼠标移动事件
 * - 窗口resize事件
 * - 按钮连续点击
 *
 * 面试考察点：
 * 1. 节流与防抖的区别
 * 2. useRef的使用
 * 3. 时间戳vs定时器实现
 * 4. 性能优化思路
 */

/**
 * 基础节流Hook - 使用时间戳实现
 * @param {*} value 需要节流的值
 * @param {number} delay 节流间隔（毫秒）
 * @returns {*} 节流后的值
 */
function useThrottle(value, delay) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecutedRef = useRef(0);

  useEffect(() => {
    const now = Date.now();

    // 如果距离上次执行的时间超过了延迟时间，立即执行
    if (now - lastExecutedRef.current >= delay) {
      setThrottledValue(value);
      lastExecutedRef.current = now;
    } else {
      // 否则设置定时器，在剩余时间后执行
      const remainingTime = delay - (now - lastExecutedRef.current);
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastExecutedRef.current = Date.now();
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}

/**
 * 定时器实现的节流Hook
 * @param {*} value 需要节流的值
 * @param {number} delay 节流间隔
 * @returns {*} 节流后的值
 */
function useThrottleTimer(value, delay) {
  const [throttledValue, setThrottledValue] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    // 如果没有定时器在运行，立即执行并设置定时器
    if (!timerRef.current) {
      setThrottledValue(value);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
      }, delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * 增强版节流Hook - 支持首次立即执行和尾部执行
 * @param {*} value 需要节流的值
 * @param {number} delay 节流间隔
 * @param {Object} options 配置选项
 * @returns {*} 节流后的值
 */
function useThrottleAdvanced(value, delay, options = {}) {
  const { leading = true, trailing = true } = options;
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecutedRef = useRef(0);
  const timerRef = useRef(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    lastValueRef.current = value;
    const now = Date.now();

    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // 如果是第一次执行或者距离上次执行超过了延迟时间
    if (
      leading &&
      (lastExecutedRef.current === 0 || now - lastExecutedRef.current >= delay)
    ) {
      setThrottledValue(value);
      lastExecutedRef.current = now;
    } else if (trailing) {
      // 设置尾部执行的定时器
      const remainingTime = delay - (now - lastExecutedRef.current);
      timerRef.current = setTimeout(() => {
        setThrottledValue(lastValueRef.current);
        lastExecutedRef.current = Date.now();
        timerRef.current = null;
      }, remainingTime);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay, leading, trailing]);

  return throttledValue;
}

/**
 * 节流函数Hook - 用于节流函数调用
 * @param {Function} func 需要节流的函数
 * @param {number} delay 节流间隔
 * @param {Object} options 配置选项
 * @returns {Object} 包含节流函数和控制方法的对象
 */
function useThrottleFn(func, delay, options = {}) {
  const { leading = true, trailing = true } = options;
  const lastExecutedRef = useRef(0);
  const timerRef = useRef(null);
  const lastArgsRef = useRef([]);

  // 清理定时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 节流函数
  const throttledFn = useCallback(
    (...args) => {
      lastArgsRef.current = args;
      const now = Date.now();

      // 清除之前的定时器
      clearTimer();

      // 如果是第一次执行或者距离上次执行超过了延迟时间
      if (
        leading &&
        (lastExecutedRef.current === 0 ||
          now - lastExecutedRef.current >= delay)
      ) {
        func.apply(this, args);
        lastExecutedRef.current = now;
      } else if (trailing) {
        // 设置尾部执行的定时器
        const remainingTime = delay - (now - lastExecutedRef.current);
        timerRef.current = setTimeout(() => {
          func.apply(this, lastArgsRef.current);
          lastExecutedRef.current = Date.now();
          timerRef.current = null;
        }, remainingTime);
      }
    },
    [func, delay, leading, trailing, clearTimer]
  );

  // 取消节流
  const cancel = useCallback(() => {
    clearTimer();
    lastExecutedRef.current = 0;
  }, [clearTimer]);

  // 立即执行
  const flush = useCallback(
    (...args) => {
      clearTimer();
      func.apply(this, args);
      lastExecutedRef.current = Date.now();
    },
    [func, clearTimer]
  );

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    run: throttledFn,
    cancel,
    flush,
  };
}

/**
 * 滚动节流Hook - 专门用于滚动事件
 * @param {Function} callback 滚动回调函数
 * @param {number} delay 节流间隔
 * @returns {Function} 节流后的滚动处理函数
 */
function useScrollThrottle(callback, delay = 100) {
  const { run: throttledCallback } = useThrottleFn(callback, delay);

  useEffect(() => {
    const handleScroll = (event) => {
      throttledCallback(event);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [throttledCallback]);

  return throttledCallback;
}

/**
 * 窗口resize节流Hook
 * @param {Function} callback resize回调函数
 * @param {number} delay 节流间隔
 * @returns {Function} 节流后的resize处理函数
 */
function useResizeThrottle(callback, delay = 100) {
  const { run: throttledCallback } = useThrottleFn(callback, delay);

  useEffect(() => {
    const handleResize = (event) => {
      throttledCallback(event);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [throttledCallback]);

  return throttledCallback;
}

/**
 * 使用示例组件
 */
function ScrollExample() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);

  // 使用节流处理滚动事件
  const throttledScrollPosition = useThrottle(scrollPosition, 100);

  useScrollThrottle((event) => {
    setScrollPosition(window.scrollY);
    setScrollCount((prev) => prev + 1);
  }, 100);

  return (
    <div style={{ height: "200vh", padding: "20px" }}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          background: "white",
          padding: "10px",
        }}
      >
        <p>实时滚动位置: {scrollPosition}px</p>
        <p>节流后滚动位置: {throttledScrollPosition}px</p>
        <p>滚动事件触发次数: {scrollCount}</p>
      </div>
      <div style={{ marginTop: "100px" }}>
        <h2>滚动页面测试节流效果</h2>
        <p>滚动时观察上方的数值变化</p>
      </div>
    </div>
  );
}

/**
 * 按钮节流示例
 */
function ButtonThrottleExample() {
  const [clickCount, setClickCount] = useState(0);
  const [throttledClickCount, setThrottledClickCount] = useState(0);

  // 使用节流函数Hook
  const {
    run: throttledClick,
    cancel,
    flush,
  } = useThrottleFn(
    () => {
      setThrottledClickCount((prev) => prev + 1);
      console.log("节流执行：按钮点击");
    },
    1000,
    { leading: true, trailing: false }
  );

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
    throttledClick();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3>按钮节流示例</h3>
      <p>实际点击次数: {clickCount}</p>
      <p>节流后执行次数: {throttledClickCount}</p>
      <button onClick={handleClick}>快速点击测试 (节流1秒)</button>
      <button onClick={cancel} style={{ marginLeft: "10px" }}>
        取消节流
      </button>
      <button onClick={flush} style={{ marginLeft: "10px" }}>
        立即执行
      </button>
    </div>
  );
}

/**
 * 搜索节流示例
 */
function SearchThrottleExample() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchCount, setSearchCount] = useState(0);

  // 使用节流处理搜索
  const throttledSearchTerm = useThrottle(searchTerm, 300);

  useEffect(() => {
    if (throttledSearchTerm) {
      setSearchCount((prev) => prev + 1);
      // 模拟搜索API调用
      setSearchResults([
        `结果1: ${throttledSearchTerm}`,
        `结果2: ${throttledSearchTerm}`,
        `结果3: ${throttledSearchTerm}`,
      ]);
    }
  }, [throttledSearchTerm]);

  return (
    <div style={{ padding: "20px" }}>
      <h3>搜索节流示例</h3>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="输入搜索关键词..."
        style={{ width: "300px", padding: "8px" }}
      />
      <p>搜索执行次数: {searchCount}</p>
      <div>
        <h4>搜索结果:</h4>
        <ul>
          {searchResults.map((result, index) => (
            <li key={index}>{result}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// 导出
export {
  ButtonThrottleExample,
  ScrollExample,
  SearchThrottleExample,
  useResizeThrottle,
  useScrollThrottle,
  useThrottle,
  useThrottleAdvanced,
  useThrottleFn,
  useThrottleTimer,
};

/**
 * 面试重点总结：
 *
 * 1. 节流的核心原理：
 *    - 时间间隔控制：在指定时间间隔内最多执行一次
 *    - 定期执行：按照固定频率执行函数
 *    - 立即响应：通常第一次触发会立即执行
 *
 * 2. 节流的实现方式：
 *    - 时间戳方式：记录上次执行时间，比较时间差
 *    - 定时器方式：使用setTimeout控制执行频率
 *    - 混合方式：结合时间戳和定时器的优点
 *
 * 3. 节流vs防抖的区别：
 *    - 节流：定期执行，控制频率
 *    - 防抖：延迟执行，只执行最后一次
 *    - 应用场景不同：节流适合持续触发的事件
 *
 * 4. useRef的重要作用：
 *    - 存储上次执行时间
 *    - 保存定时器引用
 *    - 避免闭包问题
 *    - 跨渲染保持数据
 *
 * 5. 性能优化考虑：
 *    - 减少高频事件的处理次数
 *    - 提升页面响应性能
 *    - 降低CPU使用率
 *    - 改善用户体验
 *
 * 6. 常见应用场景：
 *    - 滚动事件：scroll、touchmove
 *    - 输入事件：input、keyup
 *    - 窗口事件：resize、orientationchange
 *    - 鼠标事件：mousemove、mousewheel
 *
 * 7. 配置选项的意义：
 *    - leading：是否在开始时执行
 *    - trailing：是否在结束时执行
 *    - 不同组合适用不同场景
 */
