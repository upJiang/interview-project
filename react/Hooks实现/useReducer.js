import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * useReducer Hook 实现
 *
 * 核心功能：
 * 1. 状态管理和更新
 * 2. Action 分发机制
 * 3. 不可变状态更新
 * 4. 复杂状态逻辑管理
 *
 * 面试考察点：
 * 1. Reducer 函数的设计
 * 2. 状态不可变性
 * 3. Action 类型设计
 * 4. 与 useState 的区别
 * 5. 性能优化
 * 6. 中间件机制
 */

// 基础 useReducer 实现
function useReducer(reducer, initialState, init) {
  // 初始化状态
  const [state, setState] = useState(init ? init(initialState) : initialState);

  // 存储当前状态的引用，用于 dispatch 中获取最新状态
  const stateRef = useRef(state);
  stateRef.current = state;

  // 存储 reducer 函数的引用
  const reducerRef = useRef(reducer);
  reducerRef.current = reducer;

  // dispatch 函数
  const dispatch = useCallback((action) => {
    const currentState = stateRef.current;
    const currentReducer = reducerRef.current;

    // 调用 reducer 获取新状态
    const newState = currentReducer(currentState, action);

    // 只有状态真正改变时才更新
    if (newState !== currentState) {
      setState(newState);
    }
  }, []);

  return [state, dispatch];
}

// 增强版 useReducer 实现
function useReducerAdvanced(reducer, initialState, init, options = {}) {
  const {
    enableMiddleware = false,
    middleware = [],
    enableDevTools = false,
    enableTimeTravel = false,
    maxHistorySize = 50,
  } = options;

  // 状态历史记录（用于时间旅行）
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // 初始化状态
  const [state, setState] = useState(() => {
    const initialStateValue = init ? init(initialState) : initialState;
    if (enableTimeTravel) {
      setHistory([initialStateValue]);
      setCurrentIndex(0);
    }
    return initialStateValue;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const reducerRef = useRef(reducer);
  reducerRef.current = reducer;

  // 中间件增强的 dispatch
  const dispatch = useCallback(
    (action) => {
      let currentAction = action;
      let currentState = stateRef.current;
      let currentReducer = reducerRef.current;

      // 应用中间件
      if (enableMiddleware && middleware.length > 0) {
        const store = {
          getState: () => currentState,
          dispatch: (a) => dispatch(a),
        };

        // 创建中间件链
        const middlewareAPI = {
          getState: store.getState,
          dispatch: (a) => store.dispatch(a),
        };

        const chain = middleware.map((mw) => mw(middlewareAPI));
        const composedDispatch = chain.reduce(
          (acc, mw) => mw(acc),
          (a) => {
            // 实际的 dispatch 逻辑
            const newState = currentReducer(currentState, a);

            if (newState !== currentState) {
              setState(newState);

              // 更新历史记录
              if (enableTimeTravel) {
                setHistory((prev) => {
                  const newHistory = prev.slice(0, currentIndex + 1);
                  newHistory.push(newState);

                  // 限制历史记录大小
                  if (newHistory.length > maxHistorySize) {
                    newHistory.shift();
                    setCurrentIndex((prev) => prev - 1);
                  }

                  return newHistory;
                });
                setCurrentIndex((prev) => prev + 1);
              }
            }

            return newState;
          }
        );

        composedDispatch(currentAction);
      } else {
        // 普通 dispatch
        const newState = currentReducer(currentState, currentAction);

        if (newState !== currentState) {
          setState(newState);

          // 更新历史记录
          if (enableTimeTravel) {
            setHistory((prev) => {
              const newHistory = prev.slice(0, currentIndex + 1);
              newHistory.push(newState);

              if (newHistory.length > maxHistorySize) {
                newHistory.shift();
                setCurrentIndex((prev) => prev - 1);
              }

              return newHistory;
            });
            setCurrentIndex((prev) => prev + 1);
          }
        }
      }

      // DevTools 支持
      if (enableDevTools && window.__REDUX_DEVTOOLS_EXTENSION__) {
        window.__REDUX_DEVTOOLS_EXTENSION__.send(currentAction, state);
      }
    },
    [
      enableMiddleware,
      middleware,
      enableDevTools,
      enableTimeTravel,
      maxHistorySize,
      currentIndex,
    ]
  );

  // 时间旅行功能
  const timeTravel = useCallback(
    (index) => {
      if (enableTimeTravel && index >= 0 && index < history.length) {
        setCurrentIndex(index);
        setState(history[index]);
      }
    },
    [enableTimeTravel, history]
  );

  // 重置状态
  const reset = useCallback(() => {
    const resetState = init ? init(initialState) : initialState;
    setState(resetState);

    if (enableTimeTravel) {
      setHistory([resetState]);
      setCurrentIndex(0);
    }
  }, [init, initialState, enableTimeTravel]);

  const result = [state, dispatch];

  // 添加额外的方法
  if (enableTimeTravel) {
    result.push({
      history,
      currentIndex,
      timeTravel,
      reset,
      canUndo: currentIndex > 0,
      canRedo: currentIndex < history.length - 1,
      undo: () => timeTravel(currentIndex - 1),
      redo: () => timeTravel(currentIndex + 1),
    });
  }

  return result;
}

// 异步 useReducer 实现
function useAsyncReducer(reducer, initialState, init) {
  const [state, dispatch] = useReducer(reducer, initialState, init);

  // 异步 dispatch
  const asyncDispatch = useCallback(
    (action) => {
      if (typeof action === "function") {
        // Thunk 支持
        return action(dispatch, () => state);
      } else if (action && typeof action.then === "function") {
        // Promise 支持
        return action.then(dispatch);
      } else {
        // 普通 action
        return dispatch(action);
      }
    },
    [dispatch, state]
  );

  return [state, asyncDispatch];
}

// 带有副作用的 useReducer
function useReducerWithEffects(reducer, initialState, init, effects = {}) {
  const [state, dispatch] = useReducer(reducer, initialState, init);
  const prevStateRef = useRef(state);

  // 处理副作用
  useEffect(() => {
    const prevState = prevStateRef.current;
    const currentState = state;

    // 检查是否有匹配的副作用
    Object.keys(effects).forEach((actionType) => {
      const effect = effects[actionType];
      if (typeof effect === "function") {
        // 这里需要一种方式来知道是哪个 action 触发了状态变化
        // 在实际实现中，可能需要更复杂的机制
        effect(currentState, prevState, dispatch);
      }
    });

    prevStateRef.current = currentState;
  }, [state, effects]);

  return [state, dispatch];
}

// 常用的 reducer 工具函数
const createReducer = (initialState, handlers) => {
  return (state = initialState, action) => {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    }
    return state;
  };
};

// 组合多个 reducer
const combineReducers = (reducers) => {
  return (state = {}, action) => {
    const newState = {};
    let hasChanged = false;

    Object.keys(reducers).forEach((key) => {
      const reducer = reducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      newState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    });

    return hasChanged ? newState : state;
  };
};

// 中间件示例
const loggerMiddleware = (store) => (next) => (action) => {
  console.log("dispatching", action);
  const result = next(action);
  console.log("next state", store.getState());
  return result;
};

const thunkMiddleware = (store) => (next) => (action) => {
  if (typeof action === "function") {
    return action(store.dispatch, store.getState);
  }
  return next(action);
};

// 使用示例
const CounterExample = () => {
  // 基础计数器 reducer
  const counterReducer = (state, action) => {
    switch (action.type) {
      case "INCREMENT":
        return { count: state.count + 1 };
      case "DECREMENT":
        return { count: state.count - 1 };
      case "RESET":
        return { count: 0 };
      case "SET":
        return { count: action.payload };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <div>
      <h3>计数器: {state.count}</h3>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+1</button>
      <button onClick={() => dispatch({ type: "DECREMENT" })}>-1</button>
      <button onClick={() => dispatch({ type: "RESET" })}>重置</button>
      <button onClick={() => dispatch({ type: "SET", payload: 10 })}>
        设置为10
      </button>
    </div>
  );
};

// 复杂状态管理示例
const TodoReducerExample = () => {
  const todoReducer = (state, action) => {
    switch (action.type) {
      case "ADD_TODO":
        return {
          ...state,
          todos: [
            ...state.todos,
            {
              id: Date.now(),
              text: action.payload,
              completed: false,
            },
          ],
        };
      case "TOGGLE_TODO":
        return {
          ...state,
          todos: state.todos.map((todo) =>
            todo.id === action.payload
              ? { ...todo, completed: !todo.completed }
              : todo
          ),
        };
      case "DELETE_TODO":
        return {
          ...state,
          todos: state.todos.filter((todo) => todo.id !== action.payload),
        };
      case "SET_FILTER":
        return {
          ...state,
          filter: action.payload,
        };
      default:
        return state;
    }
  };

  const initialState = {
    todos: [],
    filter: "all",
  };

  const [state, dispatch] = useReducer(todoReducer, initialState);

  const addTodo = (text) => {
    dispatch({ type: "ADD_TODO", payload: text });
  };

  const toggleTodo = (id) => {
    dispatch({ type: "TOGGLE_TODO", payload: id });
  };

  const deleteTodo = (id) => {
    dispatch({ type: "DELETE_TODO", payload: id });
  };

  const setFilter = (filter) => {
    dispatch({ type: "SET_FILTER", payload: filter });
  };

  const filteredTodos = state.todos.filter((todo) => {
    switch (state.filter) {
      case "active":
        return !todo.completed;
      case "completed":
        return todo.completed;
      default:
        return true;
    }
  });

  return (
    <div>
      <h3>Todo List with useReducer</h3>
      <input
        type="text"
        placeholder="添加新任务..."
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target.value.trim()) {
            addTodo(e.target.value);
            e.target.value = "";
          }
        }}
      />

      <div>
        <button onClick={() => setFilter("all")}>全部</button>
        <button onClick={() => setFilter("active")}>进行中</button>
        <button onClick={() => setFilter("completed")}>已完成</button>
      </div>

      <ul>
        {filteredTodos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
              }}
            >
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// 异步操作示例
const AsyncExample = () => {
  const asyncReducer = (state, action) => {
    switch (action.type) {
      case "FETCH_START":
        return { ...state, loading: true, error: null };
      case "FETCH_SUCCESS":
        return { ...state, loading: false, data: action.payload };
      case "FETCH_ERROR":
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };

  const [state, dispatch] = useAsyncReducer(asyncReducer, {
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = async () => {
    dispatch({ type: "FETCH_START" });

    try {
      // 模拟异步请求
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const data = { message: "数据获取成功！", timestamp: Date.now() };
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (error) {
      dispatch({ type: "FETCH_ERROR", payload: error.message });
    }
  };

  // 使用 Thunk 方式
  const fetchDataThunk = () => {
    return async (dispatch, getState) => {
      dispatch({ type: "FETCH_START" });

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const data = { message: "Thunk 数据获取成功！", timestamp: Date.now() };
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (error) {
        dispatch({ type: "FETCH_ERROR", payload: error.message });
      }
    };
  };

  return (
    <div>
      <h3>异步数据获取示例</h3>
      <button onClick={fetchData} disabled={state.loading}>
        {state.loading ? "加载中..." : "获取数据"}
      </button>
      <button
        onClick={() => dispatch(fetchDataThunk())}
        disabled={state.loading}
      >
        {state.loading ? "加载中..." : "获取数据 (Thunk)"}
      </button>

      {state.error && <p style={{ color: "red" }}>错误: {state.error}</p>}
      {state.data && (
        <div>
          <p>{state.data.message}</p>
          <p>时间戳: {state.data.timestamp}</p>
        </div>
      )}
    </div>
  );
};

// 时间旅行示例
const TimeTravelExample = () => {
  const counterReducer = (state, action) => {
    switch (action.type) {
      case "INCREMENT":
        return { count: state.count + 1 };
      case "DECREMENT":
        return { count: state.count - 1 };
      default:
        return state;
    }
  };

  const [state, dispatch, timeTravel] = useReducerAdvanced(
    counterReducer,
    { count: 0 },
    null,
    { enableTimeTravel: true, maxHistorySize: 10 }
  );

  return (
    <div>
      <h3>时间旅行示例</h3>
      <p>计数: {state.count}</p>

      <button onClick={() => dispatch({ type: "INCREMENT" })}>+1</button>
      <button onClick={() => dispatch({ type: "DECREMENT" })}>-1</button>

      <div>
        <button onClick={timeTravel.undo} disabled={!timeTravel.canUndo}>
          撤销
        </button>
        <button onClick={timeTravel.redo} disabled={!timeTravel.canRedo}>
          重做
        </button>
        <button onClick={timeTravel.reset}>重置</button>
      </div>

      <div>
        <h4>历史记录:</h4>
        {timeTravel.history.map((historyState, index) => (
          <button
            key={index}
            onClick={() => timeTravel.timeTravel(index)}
            style={{
              backgroundColor:
                index === timeTravel.currentIndex ? "#007bff" : "#f8f9fa",
              color: index === timeTravel.currentIndex ? "white" : "black",
              margin: "2px",
            }}
          >
            {historyState.count}
          </button>
        ))}
      </div>
    </div>
  );
};

// 中间件示例
const MiddlewareExample = () => {
  const counterReducer = (state, action) => {
    switch (action.type) {
      case "INCREMENT":
        return { count: state.count + 1 };
      case "DECREMENT":
        return { count: state.count - 1 };
      case "ASYNC_INCREMENT":
        // 这个会被 thunk 中间件处理
        return state;
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducerAdvanced(
    counterReducer,
    { count: 0 },
    null,
    {
      enableMiddleware: true,
      middleware: [loggerMiddleware, thunkMiddleware],
    }
  );

  const asyncIncrement = () => {
    return (dispatch, getState) => {
      setTimeout(() => {
        dispatch({ type: "INCREMENT" });
      }, 1000);
    };
  };

  return (
    <div>
      <h3>中间件示例</h3>
      <p>计数: {state.count}</p>

      <button onClick={() => dispatch({ type: "INCREMENT" })}>立即+1</button>
      <button onClick={() => dispatch(asyncIncrement())}>延迟+1</button>

      <p>查看控制台日志</p>
    </div>
  );
};

// 组合 reducer 示例
const CombinedReducerExample = () => {
  const counterReducer = (state = { count: 0 }, action) => {
    switch (action.type) {
      case "INCREMENT":
        return { count: state.count + 1 };
      case "DECREMENT":
        return { count: state.count - 1 };
      default:
        return state;
    }
  };

  const userReducer = (state = { name: "", loggedIn: false }, action) => {
    switch (action.type) {
      case "LOGIN":
        return { name: action.payload, loggedIn: true };
      case "LOGOUT":
        return { name: "", loggedIn: false };
      default:
        return state;
    }
  };

  const rootReducer = combineReducers({
    counter: counterReducer,
    user: userReducer,
  });

  const [state, dispatch] = useReducer(rootReducer, {});

  return (
    <div>
      <h3>组合 Reducer 示例</h3>

      <div>
        <h4>计数器</h4>
        <p>计数: {state.counter?.count || 0}</p>
        <button onClick={() => dispatch({ type: "INCREMENT" })}>+1</button>
        <button onClick={() => dispatch({ type: "DECREMENT" })}>-1</button>
      </div>

      <div>
        <h4>用户状态</h4>
        <p>用户: {state.user?.loggedIn ? state.user.name : "未登录"}</p>
        <button onClick={() => dispatch({ type: "LOGIN", payload: "张三" })}>
          登录
        </button>
        <button onClick={() => dispatch({ type: "LOGOUT" })}>登出</button>
      </div>
    </div>
  );
};

// 主要演示组件
const UseReducerDemo = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>useReducer Hook 实现和使用示例</h1>

      <div style={{ marginBottom: "40px" }}>
        <CounterExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <TodoReducerExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <AsyncExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <TimeTravelExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <MiddlewareExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <CombinedReducerExample />
      </div>
    </div>
  );
};

export default UseReducerDemo;

export {
  AsyncExample,
  CombinedReducerExample,
  combineReducers,
  CounterExample,
  createReducer,
  loggerMiddleware,
  MiddlewareExample,
  thunkMiddleware,
  TimeTravelExample,
  TodoReducerExample,
  useAsyncReducer,
  useReducer,
  useReducerAdvanced,
  useReducerWithEffects,
};

/**
 * 面试要点总结：
 *
 * 1. useReducer vs useState：
 *    - useReducer 适合复杂状态逻辑
 *    - useState 适合简单状态
 *    - useReducer 提供更好的状态管理可预测性
 *
 * 2. Reducer 函数设计：
 *    - 纯函数，无副作用
 *    - 不可变更新
 *    - 处理所有可能的 action 类型
 *
 * 3. Action 设计：
 *    - 包含 type 字段
 *    - 可选的 payload 字段
 *    - 遵循 FSA (Flux Standard Action) 规范
 *
 * 4. 性能考虑：
 *    - 避免不必要的状态更新
 *    - 使用 useCallback 缓存 dispatch
 *    - 合理拆分 reducer
 *
 * 5. 高级特性：
 *    - 中间件支持
 *    - 时间旅行调试
 *    - 异步 action 处理
 *    - 副作用管理
 */
