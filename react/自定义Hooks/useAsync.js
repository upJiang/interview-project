import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * useAsync Hook 实现
 *
 * 核心功能：
 * 1. 异步操作状态管理
 * 2. 加载状态跟踪
 * 3. 错误处理
 * 4. 取消机制
 * 5. 重试功能
 *
 * 面试考察点：
 * 1. 异步操作的状态管理
 * 2. 内存泄漏防护
 * 3. 取消异步操作
 * 4. 错误边界处理
 * 5. 性能优化
 * 6. 竞态条件处理
 */

// 基础 useAsync Hook 实现
function useAsync(asyncFunction, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  // 用于取消异步操作
  const cancelRef = useRef();

  const execute = useCallback(
    async (...args) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 创建取消令牌
        const cancelToken = { cancelled: false };
        cancelRef.current = cancelToken;

        const result = await asyncFunction(...args);

        // 检查是否已取消
        if (!cancelToken.cancelled) {
          setState({ data: result, loading: false, error: null });
        }

        return result;
      } catch (error) {
        // 检查是否已取消
        if (!cancelRef.current?.cancelled) {
          setState({ data: null, loading: false, error });
        }
        throw error;
      }
    },
    [asyncFunction]
  );

  // 取消异步操作
  const cancel = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current.cancelled = true;
    }
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  // 自动执行异步操作
  useEffect(() => {
    if (dependencies.length > 0) {
      execute();
    }

    // 清理函数
    return () => {
      cancel();
    };
  }, dependencies);

  // 组件卸载时取消
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    ...state,
    execute,
    cancel,
    reset,
  };
}

// 增强版 useAsync Hook
function useAsyncAdvanced(asyncFunction, options = {}) {
  const {
    immediate = false,
    dependencies = [],
    initialData = null,
    retryCount = 0,
    retryDelay = 1000,
    timeout = 0,
    onSuccess,
    onError,
    onFinally,
  } = options;

  const [state, setState] = useState({
    data: initialData,
    loading: false,
    error: null,
    retryAttempt: 0,
  });

  const cancelRef = useRef();
  const timeoutRef = useRef();
  const mountedRef = useRef(true);

  // 清理函数
  const cleanup = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current.cancelled = true;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const execute = useCallback(
    async (...args) => {
      if (!mountedRef.current) return;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      let attempt = 0;
      const maxAttempts = retryCount + 1;

      while (attempt < maxAttempts) {
        try {
          // 创建取消令牌
          const cancelToken = { cancelled: false };
          cancelRef.current = cancelToken;

          // 设置超时
          let timeoutPromise;
          if (timeout > 0) {
            timeoutPromise = new Promise((_, reject) => {
              timeoutRef.current = setTimeout(() => {
                reject(new Error(`操作超时 (${timeout}ms)`));
              }, timeout);
            });
          }

          // 执行异步操作
          const asyncPromise = asyncFunction(...args);
          const result =
            timeout > 0
              ? await Promise.race([asyncPromise, timeoutPromise])
              : await asyncPromise;

          // 清理超时
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // 检查是否已取消
          if (cancelToken.cancelled || !mountedRef.current) {
            return;
          }

          setState({
            data: result,
            loading: false,
            error: null,
            retryAttempt: 0,
          });

          // 成功回调
          if (onSuccess) {
            onSuccess(result);
          }

          // 完成回调
          if (onFinally) {
            onFinally();
          }

          return result;
        } catch (error) {
          attempt++;

          // 检查是否已取消
          if (cancelRef.current?.cancelled || !mountedRef.current) {
            return;
          }

          // 如果还有重试机会
          if (attempt < maxAttempts) {
            setState((prev) => ({
              ...prev,
              retryAttempt: attempt,
              error: null,
            }));

            // 等待重试延迟
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            continue;
          }

          // 重试次数用完，设置错误状态
          setState({
            data: initialData,
            loading: false,
            error,
            retryAttempt: attempt - 1,
          });

          // 错误回调
          if (onError) {
            onError(error);
          }

          // 完成回调
          if (onFinally) {
            onFinally();
          }

          throw error;
        }
      }
    },
    [
      asyncFunction,
      retryCount,
      retryDelay,
      timeout,
      onSuccess,
      onError,
      onFinally,
      initialData,
    ]
  );

  // 取消操作
  const cancel = useCallback(() => {
    cleanup();
    setState((prev) => ({ ...prev, loading: false }));
  }, [cleanup]);

  // 重置状态
  const reset = useCallback(() => {
    cleanup();
    setState({
      data: initialData,
      loading: false,
      error: null,
      retryAttempt: 0,
    });
  }, [cleanup, initialData]);

  // 重试操作
  const retry = useCallback(() => {
    execute();
  }, [execute]);

  // 自动执行
  useEffect(() => {
    if (immediate) {
      execute();
    }

    return cleanup;
  }, [immediate, execute, cleanup]);

  // 依赖项变化时重新执行
  useEffect(() => {
    if (dependencies.length > 0 && !immediate) {
      execute();
    }
  }, dependencies);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    execute,
    cancel,
    reset,
    retry,
    isLoading: state.loading,
    isError: !!state.error,
    isSuccess: !state.loading && !state.error && state.data !== null,
  };
}

// 专用于数据获取的 Hook
function useFetch(url, options = {}) {
  const { method = "GET", headers = {}, body, ...asyncOptions } = options;

  const fetchFunction = useCallback(async () => {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  }, [url, method, headers, body]);

  return useAsyncAdvanced(fetchFunction, {
    ...asyncOptions,
    dependencies: [url, method, JSON.stringify(headers), body],
  });
}

// 支持分页的数据获取 Hook
function usePaginatedFetch(url, options = {}) {
  const { pageSize = 10, ...fetchOptions } = options;

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 0,
  });

  const fetchFunction = useCallback(
    async (page = 1) => {
      const paginatedUrl = `${url}?page=${page}&pageSize=${pageSize}`;
      const response = await fetch(paginatedUrl);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      // 更新分页信息
      setPagination((prev) => ({
        ...prev,
        page,
        total: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / pageSize),
      }));

      return data;
    },
    [url, pageSize]
  );

  const asyncState = useAsyncAdvanced(fetchFunction, {
    ...fetchOptions,
    dependencies: [url, pageSize],
  });

  const goToPage = useCallback(
    (page) => {
      if (page >= 1 && page <= pagination.totalPages) {
        asyncState.execute(page);
      }
    },
    [asyncState, pagination.totalPages]
  );

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      goToPage(pagination.page + 1);
    }
  }, [goToPage, pagination.page, pagination.totalPages]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      goToPage(pagination.page - 1);
    }
  }, [goToPage, pagination.page]);

  return {
    ...asyncState,
    pagination,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: pagination.page < pagination.totalPages,
    hasPrevPage: pagination.page > 1,
  };
}

// 支持缓存的异步 Hook
function useAsyncWithCache(asyncFunction, cacheKey, options = {}) {
  const {
    cacheTime = 5 * 60 * 1000, // 5分钟
    staleTime = 0,
    ...asyncOptions
  } = options;

  // 简单的内存缓存
  const cache = useRef(new Map());

  const cachedAsyncFunction = useCallback(
    async (...args) => {
      const key = typeof cacheKey === "function" ? cacheKey(...args) : cacheKey;
      const now = Date.now();

      // 检查缓存
      if (cache.current.has(key)) {
        const cached = cache.current.get(key);

        // 如果数据仍然新鲜
        if (now - cached.timestamp < staleTime) {
          return cached.data;
        }

        // 如果数据过期但仍在缓存时间内，先返回缓存数据，后台更新
        if (now - cached.timestamp < cacheTime) {
          // 后台更新
          asyncFunction(...args)
            .then((newData) => {
              cache.current.set(key, {
                data: newData,
                timestamp: now,
              });
            })
            .catch(() => {
              // 静默失败，继续使用缓存数据
            });

          return cached.data;
        }
      }

      // 执行异步操作
      const result = await asyncFunction(...args);

      // 缓存结果
      cache.current.set(key, {
        data: result,
        timestamp: now,
      });

      return result;
    },
    [asyncFunction, cacheKey, cacheTime, staleTime]
  );

  const asyncState = useAsyncAdvanced(cachedAsyncFunction, asyncOptions);

  // 清除缓存
  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  // 清除特定缓存
  const clearCacheKey = useCallback((key) => {
    cache.current.delete(key);
  }, []);

  return {
    ...asyncState,
    clearCache,
    clearCacheKey,
  };
}

// 使用示例
const BasicAsyncExample = () => {
  const fetchUser = async (userId) => {
    // 模拟 API 调用
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (userId === "999") {
      throw new Error("用户不存在");
    }

    return {
      id: userId,
      name: `用户${userId}`,
      email: `user${userId}@example.com`,
    };
  };

  const { data, loading, error, execute, cancel, reset } = useAsync(fetchUser);

  return (
    <div>
      <h3>基础异步示例</h3>

      <button onClick={() => execute("123")}>获取用户 123</button>
      <button onClick={() => execute("999")}>获取用户 999 (错误)</button>
      <button onClick={cancel} disabled={!loading}>
        取消
      </button>
      <button onClick={reset}>重置</button>

      {loading && <p>加载中...</p>}
      {error && <p style={{ color: "red" }}>错误: {error.message}</p>}
      {data && (
        <div>
          <h4>用户信息:</h4>
          <p>ID: {data.id}</p>
          <p>姓名: {data.name}</p>
          <p>邮箱: {data.email}</p>
        </div>
      )}
    </div>
  );
};

const AdvancedAsyncExample = () => {
  const fetchData = async () => {
    // 模拟不稳定的 API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (Math.random() > 0.7) {
      throw new Error("网络错误");
    }

    return {
      message: "数据获取成功",
      timestamp: Date.now(),
    };
  };

  const {
    data,
    loading,
    error,
    retryAttempt,
    execute,
    retry,
    reset,
    isSuccess,
  } = useAsyncAdvanced(fetchData, {
    retryCount: 3,
    retryDelay: 2000,
    timeout: 5000,
    onSuccess: (data) => console.log("成功:", data),
    onError: (error) => console.log("错误:", error),
    onFinally: () => console.log("完成"),
  });

  return (
    <div>
      <h3>增强异步示例</h3>

      <button onClick={execute} disabled={loading}>
        {loading ? "加载中..." : "获取数据"}
      </button>
      <button onClick={retry} disabled={loading || !error}>
        重试
      </button>
      <button onClick={reset}>重置</button>

      {loading && (
        <p>
          加载中...
          {retryAttempt > 0 && `(重试 ${retryAttempt}/3)`}
        </p>
      )}

      {error && (
        <div style={{ color: "red" }}>
          <p>错误: {error.message}</p>
          {retryAttempt > 0 && <p>已重试 {retryAttempt} 次</p>}
        </div>
      )}

      {isSuccess && (
        <div style={{ color: "green" }}>
          <p>成功: {data.message}</p>
          <p>时间: {new Date(data.timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

const FetchExample = () => {
  const { data, loading, error, execute, isSuccess } = useFetch(
    "https://jsonplaceholder.typicode.com/posts/1",
    {
      immediate: false,
    }
  );

  return (
    <div>
      <h3>数据获取示例</h3>

      <button onClick={execute} disabled={loading}>
        {loading ? "加载中..." : "获取文章"}
      </button>

      {error && <p style={{ color: "red" }}>错误: {error.message}</p>}

      {isSuccess && data && (
        <div>
          <h4>{data.title}</h4>
          <p>{data.body}</p>
        </div>
      )}
    </div>
  );
};

const PaginatedExample = () => {
  const {
    data,
    loading,
    error,
    pagination,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedFetch("https://jsonplaceholder.typicode.com/posts", {
    pageSize: 5,
    immediate: true,
  });

  return (
    <div>
      <h3>分页数据示例</h3>

      {loading && <p>加载中...</p>}
      {error && <p style={{ color: "red" }}>错误: {error.message}</p>}

      {data && data.items && (
        <div>
          <div>
            {data.items.map((item) => (
              <div
                key={item.id}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  border: "1px solid #ddd",
                }}
              >
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "20px" }}>
            <button onClick={prevPage} disabled={!hasPrevPage}>
              上一页
            </button>
            <span style={{ margin: "0 10px" }}>
              第 {pagination.page} 页，共 {pagination.totalPages} 页
            </span>
            <button onClick={nextPage} disabled={!hasNextPage}>
              下一页
            </button>
          </div>

          <div style={{ marginTop: "10px" }}>
            跳转到第
            <input
              type="number"
              min="1"
              max={pagination.totalPages}
              value={pagination.page}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              style={{ width: "60px", margin: "0 5px" }}
            />
            页
          </div>
        </div>
      )}
    </div>
  );
};

const CacheExample = () => {
  const fetchUser = async (userId) => {
    console.log(`正在获取用户 ${userId} 的数据...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      id: userId,
      name: `用户${userId}`,
      lastUpdated: Date.now(),
    };
  };

  const { data, loading, error, execute, clearCache } = useAsyncWithCache(
    fetchUser,
    (userId) => `user-${userId}`,
    {
      cacheTime: 30000, // 30秒缓存
      staleTime: 5000, // 5秒内认为数据新鲜
      immediate: false,
    }
  );

  return (
    <div>
      <h3>缓存示例</h3>

      <button onClick={() => execute("123")} disabled={loading}>
        获取用户 123
      </button>
      <button onClick={() => execute("456")} disabled={loading}>
        获取用户 456
      </button>
      <button onClick={clearCache}>清除缓存</button>

      <p>打开控制台查看缓存效果</p>

      {loading && <p>加载中...</p>}
      {error && <p style={{ color: "red" }}>错误: {error.message}</p>}
      {data && (
        <div>
          <h4>用户信息:</h4>
          <p>ID: {data.id}</p>
          <p>姓名: {data.name}</p>
          <p>最后更新: {new Date(data.lastUpdated).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

// 主要演示组件
const UseAsyncDemo = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>useAsync Hook 实现和使用示例</h1>

      <div style={{ marginBottom: "40px" }}>
        <BasicAsyncExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <AdvancedAsyncExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <FetchExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <PaginatedExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <CacheExample />
      </div>
    </div>
  );
};

export default UseAsyncDemo;

export {
  AdvancedAsyncExample,
  BasicAsyncExample,
  CacheExample,
  FetchExample,
  PaginatedExample,
  useAsync,
  useAsyncAdvanced,
  useAsyncWithCache,
  useFetch,
  usePaginatedFetch,
};

/**
 * 面试要点总结：
 *
 * 1. 异步状态管理：
 *    - loading、data、error 三个状态
 *    - 状态转换的原子性
 *    - 避免竞态条件
 *
 * 2. 内存泄漏防护：
 *    - 组件卸载时取消异步操作
 *    - 使用 useRef 存储取消令牌
 *    - 检查组件是否已卸载
 *
 * 3. 错误处理：
 *    - 网络错误处理
 *    - 超时处理
 *    - 重试机制
 *
 * 4. 性能优化：
 *    - 缓存机制
 *    - 避免重复请求
 *    - 分页加载
 *
 * 5. 用户体验：
 *    - 加载状态显示
 *    - 错误提示
 *    - 重试功能
 */
