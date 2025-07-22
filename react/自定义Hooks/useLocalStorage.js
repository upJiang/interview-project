import { useCallback, useEffect, useState } from "react";

/**
 * useLocalStorage Hook - 本地存储自定义Hook
 *
 * 提供了一个简单的接口来读取和写入localStorage
 * 自动处理JSON序列化/反序列化
 * 支持SSR环境
 * 包含错误处理
 *
 * 面试考察点：
 * 1. localStorage的使用和限制
 * 2. JSON序列化/反序列化
 * 3. 错误处理和边界情况
 * 4. SSR兼容性
 * 5. 自定义Hook的设计模式
 */

/**
 * 基础版本的useLocalStorage Hook
 * @param {string} key localStorage的键名
 * @param {*} initialValue 初始值
 * @returns {Array} [value, setValue] 当前值和设置值的函数
 */
function useLocalStorage(key, initialValue) {
  // 获取初始值的函数
  const getInitialValue = useCallback(() => {
    try {
      // 检查是否在浏览器环境
      if (typeof window === "undefined") {
        return initialValue;
      }

      // 从localStorage获取值
      const item = window.localStorage.getItem(key);

      // 如果值存在，解析JSON；否则返回初始值
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // 使用useState管理状态
  const [storedValue, setStoredValue] = useState(getInitialValue);

  // 设置值的函数
  const setValue = useCallback(
    (value) => {
      try {
        // 允许传入函数来更新值
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // 更新状态
        setStoredValue(valueToStore);

        // 保存到localStorage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * 增强版useLocalStorage Hook
 * 支持更多配置选项和功能
 */
function useLocalStorageAdvanced(key, initialValue, options = {}) {
  const {
    serializer = JSON,
    syncData = true,
    errorHandler = console.error,
    validator = null,
  } = options;

  // 获取初始值
  const getInitialValue = useCallback(() => {
    try {
      if (typeof window === "undefined") {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      const parsed = serializer.parse(item);

      // 如果提供了验证器，验证数据
      if (validator && !validator(parsed)) {
        console.warn(`Invalid data for key "${key}", using initial value`);
        return initialValue;
      }

      return parsed;
    } catch (error) {
      errorHandler(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, serializer, validator, errorHandler]);

  const [storedValue, setStoredValue] = useState(getInitialValue);

  // 设置值的函数
  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // 验证新值
        if (validator && !validator(valueToStore)) {
          throw new Error(`Invalid value for key "${key}"`);
        }

        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, serializer.stringify(valueToStore));
        }
      } catch (error) {
        errorHandler(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serializer, validator, errorHandler]
  );

  // 删除值的函数
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      errorHandler(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, errorHandler]);

  // 监听storage事件，实现跨标签页同步
  useEffect(() => {
    if (!syncData || typeof window === "undefined") return;

    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const newValue = serializer.parse(event.newValue);
          if (!validator || validator(newValue)) {
            setStoredValue(newValue);
          }
        } catch (error) {
          errorHandler(`Error syncing localStorage key "${key}":`, error);
        }
      } else if (event.key === key && event.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, initialValue, serializer, validator, errorHandler, syncData]);

  return [storedValue, setValue, removeValue];
}

/**
 * 类型安全的useLocalStorage Hook
 * 使用TypeScript时提供更好的类型推断
 */
function useTypedLocalStorage(key, initialValue) {
  const [value, setValue] = useLocalStorage(key, initialValue);

  // 类型安全的setter
  const setTypedValue = useCallback(
    (newValue) => {
      if (typeof newValue === typeof initialValue) {
        setValue(newValue);
      } else {
        console.warn(
          `Type mismatch for key "${key}". Expected ${typeof initialValue}, got ${typeof newValue}`
        );
      }
    },
    [key, initialValue, setValue]
  );

  return [value, setTypedValue];
}

/**
 * 支持过期时间的localStorage Hook
 */
function useLocalStorageWithExpiry(key, initialValue, expiryTime = null) {
  const getInitialValue = useCallback(() => {
    try {
      if (typeof window === "undefined") {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }

      const parsedItem = JSON.parse(item);

      // 检查是否有过期时间设置
      if (expiryTime && parsedItem.expiry) {
        const now = new Date().getTime();
        if (now > parsedItem.expiry) {
          // 数据已过期，删除并返回初始值
          window.localStorage.removeItem(key);
          return initialValue;
        }
      }

      return parsedItem.value || parsedItem;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, expiryTime]);

  const [storedValue, setStoredValue] = useState(getInitialValue);

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          const itemToStore = expiryTime
            ? {
                value: valueToStore,
                expiry: new Date().getTime() + expiryTime,
              }
            : valueToStore;

          window.localStorage.setItem(key, JSON.stringify(itemToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, expiryTime]
  );

  return [storedValue, setValue];
}

/**
 * 使用示例组件
 */
function UserPreferencesExample() {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  const [language, setLanguage] = useLocalStorage("language", "zh");
  const [fontSize, setFontSize] = useLocalStorage("fontSize", 16);

  return (
    <div>
      <h3>用户偏好设置</h3>

      <div>
        <label>主题: </label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
      </div>

      <div>
        <label>语言: </label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label>字体大小: </label>
        <input
          type="range"
          min="12"
          max="24"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
        />
        <span>{fontSize}px</span>
      </div>

      <div style={{ marginTop: "20px" }}>
        <p>当前设置:</p>
        <p>主题: {theme}</p>
        <p>语言: {language}</p>
        <p>字体大小: {fontSize}px</p>
      </div>
    </div>
  );
}

/**
 * 购物车示例
 */
function ShoppingCartExample() {
  const [cart, setCart, removeCart] = useLocalStorageAdvanced(
    "shopping-cart",
    [],
    {
      validator: (value) => Array.isArray(value),
      errorHandler: (message, error) => {
        console.error("购物车错误:", message, error);
      },
    }
  );

  const addToCart = useCallback(
    (product) => {
      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.id === product.id);
        if (existingItem) {
          return prevCart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prevCart, { ...product, quantity: 1 }];
      });
    },
    [setCart]
  );

  const removeFromCart = useCallback(
    (productId) => {
      setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    },
    [setCart]
  );

  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  return (
    <div>
      <h3>购物车示例</h3>

      <div>
        <button onClick={() => addToCart({ id: 1, name: "苹果", price: 5 })}>
          添加苹果 (¥5)
        </button>
        <button onClick={() => addToCart({ id: 2, name: "香蕉", price: 3 })}>
          添加香蕉 (¥3)
        </button>
      </div>

      <div>
        <h4>购物车内容:</h4>
        {cart.length === 0 ? (
          <p>购物车为空</p>
        ) : (
          <ul>
            {cart.map((item) => (
              <li key={item.id}>
                {item.name} - ¥{item.price} x {item.quantity}
                <button onClick={() => removeFromCart(item.id)}>删除</button>
              </li>
            ))}
          </ul>
        )}
        <p>总价: ¥{getTotalPrice()}</p>
        <button onClick={removeCart}>清空购物车</button>
      </div>
    </div>
  );
}

/**
 * 表单数据持久化示例
 */
function FormPersistenceExample() {
  const [formData, setFormData] = useLocalStorage("form-data", {
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [setFormData]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      console.log("提交表单:", formData);
      // 提交后清空表单
      setFormData({
        name: "",
        email: "",
        message: "",
      });
    },
    [formData, setFormData]
  );

  return (
    <div>
      <h3>表单数据持久化</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>姓名: </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
        </div>

        <div>
          <label>邮箱: </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
          />
        </div>

        <div>
          <label>消息: </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleInputChange("message", e.target.value)}
            rows={4}
          />
        </div>

        <button type="submit">提交</button>
      </form>
    </div>
  );
}

/**
 * 带过期时间的缓存示例
 */
function CacheExample() {
  // 缓存1分钟 (60000ms)
  const [cachedData, setCachedData] = useLocalStorageWithExpiry(
    "api-cache",
    null,
    60000
  );

  const fetchData = useCallback(async () => {
    try {
      // 模拟API调用
      const response = await fetch("https://api.example.com/data");
      const data = await response.json();
      setCachedData(data);
    } catch (error) {
      console.error("获取数据失败:", error);
    }
  }, [setCachedData]);

  return (
    <div>
      <h3>缓存示例</h3>
      <button onClick={fetchData}>获取数据</button>
      {cachedData ? (
        <div>
          <p>缓存的数据: {JSON.stringify(cachedData)}</p>
          <p>数据将在1分钟后过期</p>
        </div>
      ) : (
        <p>暂无缓存数据</p>
      )}
    </div>
  );
}

// 导出
export {
  CacheExample,
  FormPersistenceExample,
  ShoppingCartExample,
  useLocalStorage,
  useLocalStorageAdvanced,
  useLocalStorageWithExpiry,
  UserPreferencesExample,
  useTypedLocalStorage,
};

/**
 * 面试重点总结：
 *
 * 1. localStorage的特点和限制：
 *    - 存储容量限制（通常5-10MB）
 *    - 只能存储字符串
 *    - 同步API，可能阻塞主线程
 *    - 受同源策略限制
 *
 * 2. JSON序列化的注意事项：
 *    - 不能序列化函数、undefined、Symbol
 *    - 日期对象会被转换为字符串
 *    - 循环引用会导致错误
 *    - 需要处理序列化/反序列化异常
 *
 * 3. SSR兼容性：
 *    - 服务端没有window对象
 *    - 需要检查环境避免错误
 *    - 初始值在服务端和客户端要一致
 *
 * 4. 错误处理：
 *    - localStorage可能被禁用
 *    - 存储空间不足
 *    - 数据损坏或格式错误
 *    - 网络存储限制
 *
 * 5. 性能考虑：
 *    - 避免频繁读写大量数据
 *    - 使用useCallback优化函数
 *    - 考虑使用IndexedDB存储大量数据
 *
 * 6. 安全考虑：
 *    - 不要存储敏感信息
 *    - 数据可以被用户修改
 *    - 考虑数据验证
 *    - 注意XSS攻击风险
 */
