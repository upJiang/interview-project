# useLocalStorage Hook 详解

## 概述

`useLocalStorage` 是一个用于管理浏览器本地存储的自定义Hook，它提供了一个简单的接口来读取和写入localStorage，自动处理JSON序列化/反序列化，并支持SSR环境。

## 核心知识点

### 1. localStorage基础

localStorage是Web Storage API的一部分，用于在浏览器中存储数据：

```javascript
// 原生localStorage操作
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');
localStorage.removeItem('key');
localStorage.clear();
```

**特点：**
- 持久化存储，除非手动清除
- 存储容量通常为5-10MB
- 只能存储字符串数据
- 同步API，可能阻塞主线程
- 受同源策略限制

### 2. JSON序列化处理

由于localStorage只能存储字符串，需要处理复杂数据类型：

```javascript
// 存储对象
const data = { name: 'John', age: 30 };
localStorage.setItem('user', JSON.stringify(data));

// 读取对象
const stored = localStorage.getItem('user');
const parsed = stored ? JSON.parse(stored) : null;
```

**注意事项：**
- 不能序列化函数、undefined、Symbol
- 日期对象会被转换为字符串
- 循环引用会导致错误
- 需要处理序列化/反序列化异常

### 3. SSR兼容性

在服务端渲染环境中，`window`对象不存在：

```javascript
// 环境检查
if (typeof window !== "undefined") {
  // 浏览器环境
  localStorage.setItem('key', 'value');
}
```

### 4. 错误处理

localStorage操作可能失败的情况：
- localStorage被禁用
- 存储空间不足
- 数据损坏或格式错误
- 隐私模式限制

## 常见面试问题

### Q1: localStorage和sessionStorage的区别？

**答案：**
- **生命周期**：localStorage持久化存储，sessionStorage仅在会话期间有效
- **作用域**：localStorage在同源的所有标签页共享，sessionStorage仅在当前标签页有效
- **存储容量**：通常都是5-10MB
- **API**：接口完全相同

### Q2: localStorage有哪些限制？

**答案：**
1. **存储容量限制**：通常5-10MB，超出会报错
2. **数据类型限制**：只能存储字符串
3. **同源策略**：不同域名无法访问
4. **同步操作**：可能阻塞主线程
5. **浏览器支持**：IE8+才支持
6. **隐私模式**：可能被禁用或限制

### Q3: 如何处理localStorage的异常情况？

**答案：**
```javascript
function safeLocalStorage(key, value) {
  try {
    if (value === undefined) {
      // 读取
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } else {
      // 写入
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
  } catch (error) {
    console.error('localStorage操作失败:', error);
    return null;
  }
}
```

### Q4: localStorage在React中的最佳实践？

**答案：**
1. **使用自定义Hook封装**：统一管理localStorage操作
2. **错误处理**：捕获所有可能的异常
3. **SSR兼容**：检查window对象存在性
4. **性能优化**：使用useCallback避免不必要的重新渲染
5. **类型安全**：使用TypeScript或运行时验证
6. **数据验证**：验证存储和读取的数据格式

### Q5: 如何实现跨标签页的数据同步？

**答案：**
使用storage事件监听localStorage的变化：

```javascript
useEffect(() => {
  const handleStorageChange = (event) => {
    if (event.key === key && event.newValue !== null) {
      setStoredValue(JSON.parse(event.newValue));
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, [key]);
```

## 实现原理

### 基础版本

```javascript
function useLocalStorage(key, initialValue) {
  // 获取初始值
  const getInitialValue = useCallback(() => {
    try {
      if (typeof window === "undefined") {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState(getInitialValue);

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
```

### 增强版本特性

1. **自定义序列化器**：支持不同的序列化方式
2. **数据验证**：验证存储和读取的数据
3. **错误处理器**：自定义错误处理逻辑
4. **跨标签页同步**：监听storage事件
5. **删除功能**：提供删除存储数据的方法

## 实际应用场景

### 1. 用户偏好设置

```javascript
function ThemeProvider() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 2. 购物车数据

```javascript
function useShoppingCart() {
  const [cart, setCart] = useLocalStorage('cart', []);
  
  const addToCart = useCallback((product) => {
    setCart(prevCart => [...prevCart, product]);
  }, [setCart]);
  
  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, [setCart]);
  
  return { cart, addToCart, removeFromCart };
}
```

### 3. 表单数据持久化

```javascript
function useFormPersistence(formId, initialData) {
  const [formData, setFormData] = useLocalStorage(
    `form-${formId}`,
    initialData
  );
  
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);
  
  const clearForm = useCallback(() => {
    setFormData(initialData);
  }, [setFormData, initialData]);
  
  return { formData, updateField, clearForm };
}
```

### 4. API数据缓存

```javascript
function useApiCache(key, fetchFn, expiryTime = 300000) { // 5分钟
  const [cachedData, setCachedData] = useLocalStorageWithExpiry(
    key,
    null,
    expiryTime
  );
  
  const fetchData = useCallback(async () => {
    try {
      const data = await fetchFn();
      setCachedData(data);
      return data;
    } catch (error) {
      console.error('API调用失败:', error);
      throw error;
    }
  }, [fetchFn, setCachedData]);
  
  return { cachedData, fetchData };
}
```

## 高级用法

### 1. 类型安全的localStorage

```javascript
function useTypedLocalStorage(key, initialValue) {
  const [value, setValue] = useLocalStorage(key, initialValue);
  
  const setTypedValue = useCallback((newValue) => {
    if (typeof newValue === typeof initialValue) {
      setValue(newValue);
    } else {
      console.warn(`Type mismatch for key "${key}"`);
    }
  }, [key, initialValue, setValue]);
  
  return [value, setTypedValue];
}
```

### 2. 带过期时间的存储

```javascript
function useLocalStorageWithExpiry(key, initialValue, expiryTime) {
  const getInitialValue = useCallback(() => {
    try {
      if (typeof window === "undefined") return initialValue;
      
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      
      const parsedItem = JSON.parse(item);
      if (expiryTime && parsedItem.expiry) {
        const now = new Date().getTime();
        if (now > parsedItem.expiry) {
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
  
  // ... 其他实现
}
```

### 3. 数据验证和错误处理

```javascript
function useValidatedLocalStorage(key, initialValue, validator) {
  const [value, setValue] = useLocalStorage(key, initialValue);
  
  const setValidatedValue = useCallback((newValue) => {
    if (validator(newValue)) {
      setValue(newValue);
    } else {
      console.error(`Invalid value for key "${key}"`);
    }
  }, [key, validator, setValue]);
  
  return [value, setValidatedValue];
}
```

## 性能优化

### 1. 避免频繁读写

```javascript
// 不好的做法
function BadExample() {
  const [data, setData] = useLocalStorage('data', {});
  
  // 每次渲染都会读写localStorage
  useEffect(() => {
    setData({ ...data, timestamp: Date.now() });
  });
}

// 好的做法
function GoodExample() {
  const [data, setData] = useLocalStorage('data', {});
  
  // 只在必要时更新
  const updateTimestamp = useCallback(() => {
    setData(prev => ({ ...prev, timestamp: Date.now() }));
  }, [setData]);
}
```

### 2. 使用useCallback优化

```javascript
function OptimizedLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    // 只在初始化时读取
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  
  const setStoredValue = useCallback((newValue) => {
    setValue(newValue);
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [key]);
  
  return [value, setStoredValue];
}
```

### 3. 批量操作优化

```javascript
function useBatchLocalStorage() {
  const [batch, setBatch] = useState({});
  
  const addToBatch = useCallback((key, value) => {
    setBatch(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const commitBatch = useCallback(() => {
    Object.entries(batch).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Failed to save ${key}:`, error);
      }
    });
    setBatch({});
  }, [batch]);
  
  return { addToBatch, commitBatch };
}
```

## 安全考虑

### 1. 敏感数据处理

```javascript
// 不要存储敏感信息
const [token, setToken] = useLocalStorage('auth-token', ''); // ❌ 不安全

// 使用加密或其他安全存储方式
const [preferences, setPreferences] = useLocalStorage('user-prefs', {}); // ✅ 安全
```

### 2. 数据验证

```javascript
function useSecureLocalStorage(key, initialValue, schema) {
  const [value, setValue] = useLocalStorage(key, initialValue);
  
  const setSecureValue = useCallback((newValue) => {
    // 验证数据格式
    if (validateSchema(newValue, schema)) {
      setValue(newValue);
    } else {
      console.error('Data validation failed');
    }
  }, [setValue, schema]);
  
  return [value, setSecureValue];
}
```

### 3. XSS防护

```javascript
function sanitizeData(data) {
  if (typeof data === 'string') {
    // 清理HTML标签和脚本
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  return data;
}

function useSafeLocalStorage(key, initialValue) {
  const [value, setValue] = useLocalStorage(key, initialValue);
  
  const setSafeValue = useCallback((newValue) => {
    const sanitized = sanitizeData(newValue);
    setValue(sanitized);
  }, [setValue]);
  
  return [value, setSafeValue];
}
```

## 测试策略

### 1. 单元测试

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  test('should initialize with default value', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'default'));
    expect(result.current[0]).toBe('default');
  });
  
  test('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));
    
    act(() => {
      result.current[1]('updated');
    });
    
    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test')).toBe('"updated"');
  });
});
```

### 2. 集成测试

```javascript
test('should sync across multiple hook instances', () => {
  const { result: result1 } = renderHook(() => useLocalStorage('sync-test', 0));
  const { result: result2 } = renderHook(() => useLocalStorage('sync-test', 0));
  
  act(() => {
    result1.current[1](10);
  });
  
  // 模拟storage事件
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'sync-test',
      newValue: '"10"'
    }));
  });
  
  expect(result2.current[0]).toBe(10);
});
```

## 总结

`useLocalStorage` Hook是React应用中管理本地存储的重要工具。在面试中，重点关注：

1. **基础概念**：localStorage的特点和限制
2. **实现细节**：JSON序列化、错误处理、SSR兼容
3. **性能优化**：避免频繁读写、使用useCallback
4. **安全考虑**：数据验证、敏感信息处理
5. **实际应用**：用户偏好、购物车、表单持久化等场景

掌握这些知识点，能够帮助你在面试中展现对React Hooks和浏览器存储API的深入理解。 