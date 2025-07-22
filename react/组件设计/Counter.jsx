import React, { useCallback, useState } from "react";

/**
 * 计数器组件 - React面试中最基础的组件
 *
 * 考察点：
 * 1. useState Hook的使用
 * 2. 事件处理函数的定义
 * 3. useCallback优化性能
 * 4. 组件的基本结构
 * 5. 条件渲染
 */

const Counter = ({ initialValue = 0, step = 1, min, max }) => {
  // 使用useState管理计数器状态
  const [count, setCount] = useState(initialValue);

  // 使用useCallback优化性能，避免子组件不必要的重新渲染
  const increment = useCallback(() => {
    setCount((prevCount) => {
      const newCount = prevCount + step;
      // 如果设置了最大值，不能超过最大值
      return max !== undefined ? Math.min(newCount, max) : newCount;
    });
  }, [step, max]);

  const decrement = useCallback(() => {
    setCount((prevCount) => {
      const newCount = prevCount - step;
      // 如果设置了最小值，不能低于最小值
      return min !== undefined ? Math.max(newCount, min) : newCount;
    });
  }, [step, min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  // 检查是否达到边界值
  const isAtMax = max !== undefined && count >= max;
  const isAtMin = min !== undefined && count <= min;

  return (
    <div className="counter">
      <h2>计数器</h2>
      <div className="counter-display">
        <span className="count-value">{count}</span>
      </div>
      <div className="counter-controls">
        <button onClick={decrement} disabled={isAtMin} className="counter-btn">
          -
        </button>
        <button onClick={reset} className="counter-btn reset-btn">
          重置
        </button>
        <button onClick={increment} disabled={isAtMax} className="counter-btn">
          +
        </button>
      </div>

      {/* 条件渲染：显示边界提示 */}
      {isAtMax && <p className="boundary-message">已达到最大值：{max}</p>}
      {isAtMin && <p className="boundary-message">已达到最小值：{min}</p>}
    </div>
  );
};

// 使用示例
const CounterExample = () => {
  return (
    <div>
      <Counter />
      <Counter initialValue={10} step={2} min={0} max={20} />
    </div>
  );
};

export default Counter;
export { CounterExample };

// CSS样式（通常在单独的CSS文件中）
const styles = `
.counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 10px;
  background-color: #f9f9f9;
}

.counter-display {
  margin: 20px 0;
}

.count-value {
  font-size: 2em;
  font-weight: bold;
  color: #333;
}

.counter-controls {
  display: flex;
  gap: 10px;
}

.counter-btn {
  padding: 10px 20px;
  font-size: 1.2em;
  border: 1px solid #007bff;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.counter-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.counter-btn:disabled {
  background-color: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}

.reset-btn {
  background-color: #6c757d;
  border-color: #6c757d;
}

.reset-btn:hover {
  background-color: #545b62;
}

.boundary-message {
  color: #dc3545;
  font-size: 0.9em;
  margin-top: 10px;
}
`;

/**
 * 面试要点：
 *
 * 1. 为什么使用useState？
 *    - 函数组件中管理状态的标准方式
 *    - 提供状态值和更新函数
 *
 * 2. 为什么使用useCallback？
 *    - 避免每次渲染都创建新的函数引用
 *    - 当函数作为props传递给子组件时，可以避免子组件不必要的重新渲染
 *
 * 3. 为什么使用函数式更新？
 *    - setCount(prevCount => prevCount + 1)
 *    - 确保基于最新的状态值进行更新
 *    - 避免闭包陷阱
 *
 * 4. 组件的可配置性
 *    - 通过props接收初始值、步长、最大最小值
 *    - 提高组件的复用性
 *
 * 5. 边界条件处理
 *    - 最大值和最小值的限制
 *    - 按钮的禁用状态
 *    - 用户友好的提示信息
 */
