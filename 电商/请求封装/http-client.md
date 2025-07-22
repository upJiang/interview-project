# Request 封装与 HTTP 客户端设计

## 概述

在电商项目中，统一的HTTP请求封装是前端架构的重要组成部分。良好的请求封装可以提供统一的接口、错误处理、拦截器、缓存等功能，大大提升开发效率和代码质量。

## 核心知识点

### 1. 基础HTTP客户端封装

```javascript
/**
 * 基础HTTP客户端
 */
class HttpClient {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      withCredentials: config.withCredentials || false,
      validateStatus: config.validateStatus || ((status) => status >= 200 && status < 300)
    };
    
    this.interceptors = {
      request: [],
      response: []
    };
  }
  
  // 请求方法
  async request(url, options = {}) {
    // 合并配置
    const config = this.mergeConfig(url, options);
    
    try {
      // 执行请求拦截器
      const finalConfig = await this.executeRequestInterceptors(config);
      
      // 发送请求
      const response = await this.sendRequest(finalConfig);
      
      // 执行响应拦截器
      const finalResponse = await this.executeResponseInterceptors(response, finalConfig);
      
      return finalResponse;
      
    } catch (error) {
      // 执行错误处理
      throw await this.handleError(error, config);
    }
  }
  
  // 合并配置
  mergeConfig(url, options) {
    const fullURL = this.buildURL(url);
    
    return {
      url: fullURL,
      method: options.method || 'GET',
      headers: {
        ...this.config.headers,
        ...options.headers
      },
      body: options.body,
      timeout: options.timeout || this.config.timeout,
      signal: options.signal,
      validateStatus: options.validateStatus || this.config.validateStatus,
      ...options
    };
  }
  
  // 构建完整URL
  buildURL(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    const baseURL = this.config.baseURL.replace(/\/+$/, '');
    const path = url.replace(/^\/+/, '');
    
    return baseURL ? `${baseURL}/${path}` : path;
  }
  
  // 发送请求
  async sendRequest(config) {
    const controller = new AbortController();
    
    // 设置超时
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeout);
    
    try {
      const fetchOptions = {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: config.signal || controller.signal,
        credentials: this.config.withCredentials ? 'include' : 'same-origin'
      };
      
      const response = await fetch(config.url, fetchOptions);
      
      clearTimeout(timeoutId);
      
      // 状态码验证
      if (!config.validateStatus(response.status)) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      
      throw error;
    }
  }
  
  // 执行请求拦截器
  async executeRequestInterceptors(config) {
    let currentConfig = config;
    
    for (const interceptor of this.interceptors.request) {
      try {
        currentConfig = await interceptor.onFulfilled(currentConfig);
      } catch (error) {
        if (interceptor.onRejected) {
          currentConfig = await interceptor.onRejected(error);
        } else {
          throw error;
        }
      }
    }
    
    return currentConfig;
  }
  
  // 执行响应拦截器
  async executeResponseInterceptors(response, config) {
    let currentResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      try {
        currentResponse = await interceptor.onFulfilled(currentResponse, config);
      } catch (error) {
        if (interceptor.onRejected) {
          currentResponse = await interceptor.onRejected(error, config);
        } else {
          throw error;
        }
      }
    }
    
    return currentResponse;
  }
  
  // 错误处理
  async handleError(error, config) {
    const enhancedError = {
      message: error.message,
      config,
      timestamp: Date.now(),
      type: this.getErrorType(error)
    };
    
    // 网络错误
    if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
      enhancedError.type = 'NETWORK_ERROR';
      enhancedError.message = '网络连接失败，请检查网络设置';
    }
    
    // 超时错误
    if (error.message.includes('timeout') || error.message.includes('超时')) {
      enhancedError.type = 'TIMEOUT_ERROR';
      enhancedError.message = '请求超时，请稍后重试';
    }
    
    return enhancedError;
  }
  
  getErrorType(error) {
    if (error.message.includes('HTTP Error')) {
      const status = parseInt(error.message.match(/\d{3}/)?.[0]);
      
      if (status >= 400 && status < 500) {
        return 'CLIENT_ERROR';
      } else if (status >= 500) {
        return 'SERVER_ERROR';
      }
    }
    
    return 'UNKNOWN_ERROR';
  }
  
  // 便捷方法
  get(url, config = {}) {
    return this.request(url, { ...config, method: 'GET' });
  }
  
  post(url, data, config = {}) {
    return this.request(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  put(url, data, config = {}) {
    return this.request(url, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  delete(url, config = {}) {
    return this.request(url, { ...config, method: 'DELETE' });
  }
  
  patch(url, data, config = {}) {
    return this.request(url, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
}
```

### 2. 拦截器系统

```javascript
/**
 * 拦截器管理器
 */
class InterceptorManager {
  constructor() {
    this.interceptors = [];
  }
  
  // 添加拦截器
  use(onFulfilled, onRejected) {
    const interceptor = {
      onFulfilled,
      onRejected,
      id: Date.now() + Math.random()
    };
    
    this.interceptors.push(interceptor);
    
    // 返回ID，用于移除拦截器
    return interceptor.id;
  }
  
  // 移除拦截器
  eject(id) {
    const index = this.interceptors.findIndex(interceptor => interceptor.id === id);
    if (index !== -1) {
      this.interceptors.splice(index, 1);
    }
  }
  
  // 清除所有拦截器
  clear() {
    this.interceptors = [];
  }
  
  // 执行拦截器
  async execute(value, config) {
    let currentValue = value;
    
    for (const interceptor of this.interceptors) {
      try {
        if (interceptor.onFulfilled) {
          currentValue = await interceptor.onFulfilled(currentValue, config);
        }
      } catch (error) {
        if (interceptor.onRejected) {
          currentValue = await interceptor.onRejected(error, config);
        } else {
          throw error;
        }
      }
    }
    
    return currentValue;
  }
}

/**
 * 增强的HTTP客户端（带拦截器）
 */
class AdvancedHttpClient extends HttpClient {
  constructor(config = {}) {
    super(config);
    
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
    
    this.setupDefaultInterceptors();
  }
  
  // 设置默认拦截器
  setupDefaultInterceptors() {
    // 请求拦截器 - 添加认证token
    this.interceptors.request.use((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // 添加请求ID用于追踪
      config.headers['X-Request-ID'] = this.generateRequestId();
      
      console.log('发送请求:', config.method, config.url);
      return config;
    });
    
    // 请求拦截器 - 添加CSRF token
    this.interceptors.request.use((config) => {
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method.toUpperCase())) {
        const csrfToken = this.getCSRFToken();
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      }
      
      return config;
    });
    
    // 响应拦截器 - 统一数据处理
    this.interceptors.response.use(async (response, config) => {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        // 统一响应格式处理
        if (data.code !== undefined) {
          if (data.code === 0 || data.code === 200) {
            return data.data || data;
          } else {
            throw new Error(data.message || '请求失败');
          }
        }
        
        return data;
      }
      
      return response;
    });
    
    // 响应拦截器 - 错误处理
    this.interceptors.response.use(null, (error, config) => {
      console.error('请求失败:', config.url, error.message);
      
      // 根据错误类型进行不同处理
      switch (error.type) {
        case 'CLIENT_ERROR':
          if (error.message.includes('401')) {
            this.handleUnauthorized();
          } else if (error.message.includes('403')) {
            this.handleForbidden();
          }
          break;
          
        case 'SERVER_ERROR':
          this.handleServerError(error);
          break;
          
        case 'NETWORK_ERROR':
          this.handleNetworkError(error);
          break;
      }
      
      throw error;
    });
  }
  
  // 执行请求拦截器
  async executeRequestInterceptors(config) {
    return await this.interceptors.request.execute(config);
  }
  
  // 执行响应拦截器
  async executeResponseInterceptors(response, config) {
    return await this.interceptors.response.execute(response, config);
  }
  
  // 获取认证token
  getAuthToken() {
    return localStorage.getItem('auth_token') || 
           sessionStorage.getItem('auth_token');
  }
  
  // 获取CSRF token
  getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  }
  
  // 生成请求ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 处理未授权
  handleUnauthorized() {
    console.warn('用户未授权，跳转到登录页');
    
    // 清除本地token
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // 跳转到登录页
    window.location.href = '/login';
  }
  
  // 处理禁止访问
  handleForbidden() {
    console.warn('访问被禁止');
    // 可以显示错误提示或跳转到错误页面
  }
  
  // 处理服务器错误
  handleServerError(error) {
    console.error('服务器错误:', error);
    // 可以显示错误提示或上报错误
  }
  
  // 处理网络错误
  handleNetworkError(error) {
    console.error('网络错误:', error);
    // 可以显示网络错误提示
  }
}
```

### 3. 请求重试机制

```javascript
/**
 * 带重试机制的HTTP客户端
 */
class RetryableHttpClient extends AdvancedHttpClient {
  constructor(config = {}) {
    super(config);
    
    this.retryConfig = {
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      retryCondition: config.retryCondition || this.defaultRetryCondition,
      exponentialBackoff: config.exponentialBackoff !== false
    };
  }
  
  // 默认重试条件
  defaultRetryCondition(error) {
    // 网络错误或5xx服务器错误才重试
    return error.type === 'NETWORK_ERROR' || 
           error.type === 'TIMEOUT_ERROR' ||
           (error.type === 'SERVER_ERROR' && error.message.includes('5'));
  }
  
  // 带重试的请求
  async requestWithRetry(url, options = {}) {
    const maxRetries = options.retries || this.retryConfig.retries;
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request(url, options);
      } catch (error) {
        lastError = error;
        
        // 如果不满足重试条件，直接抛出错误
        if (!this.retryConfig.retryCondition(error)) {
          throw error;
        }
        
        // 如果是最后一次尝试，抛出错误
        if (attempt === maxRetries) {
          throw error;
        }
        
        // 计算延迟时间
        const delay = this.calculateRetryDelay(attempt);
        
        console.warn(`请求失败，${delay}ms后重试 (${attempt + 1}/${maxRetries}):`, error.message);
        
        // 等待后重试
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }
  
  // 计算重试延迟
  calculateRetryDelay(attempt) {
    let delay = this.retryConfig.retryDelay;
    
    if (this.retryConfig.exponentialBackoff) {
      // 指数退避：1s, 2s, 4s, 8s...
      delay = delay * Math.pow(2, attempt);
    }
    
    // 添加随机抖动，避免雪崩效应
    const jitter = Math.random() * 0.3 * delay;
    
    return Math.floor(delay + jitter);
  }
  
  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 重写便捷方法以支持重试
  get(url, config = {}) {
    return this.requestWithRetry(url, { ...config, method: 'GET' });
  }
  
  post(url, data, config = {}) {
    return this.requestWithRetry(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  put(url, data, config = {}) {
    return this.requestWithRetry(url, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  delete(url, config = {}) {
    return this.requestWithRetry(url, { ...config, method: 'DELETE' });
  }
}
```

### 4. 请求缓存机制

```javascript
/**
 * 带缓存的HTTP客户端
 */
class CachedHttpClient extends RetryableHttpClient {
  constructor(config = {}) {
    super(config);
    
    this.cache = new Map();
    this.cacheConfig = {
      defaultTTL: config.cacheTTL || 5 * 60 * 1000, // 5分钟
      maxCacheSize: config.maxCacheSize || 100,
      enableCache: config.enableCache !== false
    };
    
    // 定期清理过期缓存
    this.startCacheCleanup();
  }
  
  // 带缓存的请求
  async requestWithCache(url, options = {}) {
    // 只对GET请求启用缓存
    if (options.method && options.method.toUpperCase() !== 'GET') {
      return this.requestWithRetry(url, options);
    }
    
    if (!this.cacheConfig.enableCache) {
      return this.requestWithRetry(url, options);
    }
    
    const cacheKey = this.generateCacheKey(url, options);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('使用缓存数据:', url);
      return cached.data;
    }
    
    try {
      const response = await this.requestWithRetry(url, options);
      
      // 缓存成功的响应
      this.setCache(cacheKey, response, options.cacheTTL);
      
      return response;
    } catch (error) {
      // 如果有过期的缓存，在网络错误时可以返回过期数据
      const expiredCache = this.cache.get(cacheKey);
      if (expiredCache && error.type === 'NETWORK_ERROR') {
        console.warn('网络错误，返回过期缓存数据:', url);
        return expiredCache.data;
      }
      
      throw error;
    }
  }
  
  // 生成缓存键
  generateCacheKey(url, options) {
    const key = `${options.method || 'GET'}_${url}`;
    
    // 如果有查询参数，也要包含在缓存键中
    if (options.params) {
      const params = new URLSearchParams(options.params).toString();
      return `${key}_${params}`;
    }
    
    return key;
  }
  
  // 从缓存获取数据
  getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // 检查是否过期
    if (Date.now() > cached.expiry) {
      return null;
    }
    
    // 更新访问时间
    cached.lastAccess = Date.now();
    
    return cached;
  }
  
  // 设置缓存
  setCache(key, data, ttl) {
    // 检查缓存大小限制
    if (this.cache.size >= this.cacheConfig.maxCacheSize) {
      this.evictOldestCache();
    }
    
    const cacheTTL = ttl || this.cacheConfig.defaultTTL;
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + cacheTTL,
      created: Date.now(),
      lastAccess: Date.now()
    });
  }
  
  // 清理最老的缓存
  evictOldestCache() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, value] of this.cache) {
      if (value.lastAccess < oldestTime) {
        oldestTime = value.lastAccess;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  // 清理过期缓存
  cleanupExpiredCache() {
    const now = Date.now();
    
    for (const [key, value] of this.cache) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }
  
  // 启动缓存清理定时器
  startCacheCleanup() {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // 每分钟清理一次
  }
  
  // 清除所有缓存
  clearCache() {
    this.cache.clear();
  }
  
  // 清除特定URL的缓存
  clearUrlCache(url) {
    for (const key of this.cache.keys()) {
      if (key.includes(url)) {
        this.cache.delete(key);
      }
    }
  }
  
  // 获取缓存统计
  getCacheStats() {
    const now = Date.now();
    let totalSize = 0;
    let expiredCount = 0;
    
    for (const [key, value] of this.cache) {
      totalSize += JSON.stringify(value.data).length;
      
      if (now > value.expiry) {
        expiredCount++;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.cacheConfig.maxCacheSize,
      totalDataSize: totalSize,
      expiredCount,
      hitRate: this.calculateHitRate()
    };
  }
  
  calculateHitRate() {
    // 这里需要实现命中率计算逻辑
    // 可以通过记录请求次数和缓存命中次数来计算
    return 0;
  }
  
  // 重写便捷方法以支持缓存
  get(url, config = {}) {
    return this.requestWithCache(url, { ...config, method: 'GET' });
  }
}
```

### 5. 请求队列和并发控制

```javascript
/**
 * 带队列管理的HTTP客户端
 */
class QueuedHttpClient extends CachedHttpClient {
  constructor(config = {}) {
    super(config);
    
    this.queueConfig = {
      maxConcurrent: config.maxConcurrent || 6,
      queueTimeout: config.queueTimeout || 30000
    };
    
    this.activeRequests = 0;
    this.requestQueue = [];
    this.requestStats = {
      total: 0,
      success: 0,
      failed: 0,
      queued: 0
    };
  }
  
  // 队列化请求
  async queuedRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestTask = {
        url,
        options,
        resolve,
        reject,
        priority: options.priority || 'normal',
        timestamp: Date.now(),
        timeout: options.queueTimeout || this.queueConfig.queueTimeout
      };
      
      this.requestQueue.push(requestTask);
      this.requestStats.queued++;
      
      // 按优先级排序队列
      this.sortQueue();
      
      // 处理队列
      this.processQueue();
      
      // 设置队列超时
      setTimeout(() => {
        this.removeFromQueue(requestTask, '队列等待超时');
      }, requestTask.timeout);
    });
  }
  
  // 排序队列（按优先级和时间）
  sortQueue() {
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    
    this.requestQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return a.timestamp - b.timestamp;
    });
  }
  
  // 处理队列
  processQueue() {
    while (
      this.activeRequests < this.queueConfig.maxConcurrent &&
      this.requestQueue.length > 0
    ) {
      const task = this.requestQueue.shift();
      this.executeQueuedTask(task);
    }
  }
  
  // 执行队列任务
  async executeQueuedTask(task) {
    this.activeRequests++;
    this.requestStats.total++;
    this.requestStats.queued--;
    
    try {
      const response = await this.requestWithCache(task.url, task.options);
      
      this.requestStats.success++;
      task.resolve(response);
      
    } catch (error) {
      this.requestStats.failed++;
      task.reject(error);
      
    } finally {
      this.activeRequests--;
      
      // 继续处理队列
      this.processQueue();
    }
  }
  
  // 从队列中移除任务
  removeFromQueue(task, reason) {
    const index = this.requestQueue.indexOf(task);
    if (index !== -1) {
      this.requestQueue.splice(index, 1);
      this.requestStats.queued--;
      task.reject(new Error(reason));
    }
  }
  
  // 批量请求
  async batchRequest(requests) {
    const promises = requests.map(request => 
      this.queuedRequest(request.url, request.options)
        .then(data => ({ status: 'fulfilled', data, url: request.url }))
        .catch(error => ({ status: 'rejected', error: error.message, url: request.url }))
    );
    
    return Promise.all(promises);
  }
  
  // 并行请求（不受队列限制）
  async parallelRequest(requests) {
    const promises = requests.map(request => 
      this.requestWithCache(request.url, request.options)
    );
    
    return Promise.all(promises);
  }
  
  // 获取队列状态
  getQueueStatus() {
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      maxConcurrent: this.queueConfig.maxConcurrent,
      stats: { ...this.requestStats }
    };
  }
  
  // 清空队列
  clearQueue(reason = '队列被清空') {
    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift();
      task.reject(new Error(reason));
    }
    
    this.requestStats.queued = 0;
  }
  
  // 设置并发限制
  setMaxConcurrent(max) {
    this.queueConfig.maxConcurrent = max;
    this.processQueue(); // 重新处理队列
  }
  
  // 重写便捷方法以支持队列
  get(url, config = {}) {
    return this.queuedRequest(url, { ...config, method: 'GET' });
  }
  
  post(url, data, config = {}) {
    return this.queuedRequest(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  put(url, data, config = {}) {
    return this.queuedRequest(url, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  delete(url, config = {}) {
    return this.queuedRequest(url, { ...config, method: 'DELETE' });
  }
}
```

## 电商场景应用

### 1. 电商API客户端

```javascript
/**
 * 电商专用HTTP客户端
 */
class EcommerceApiClient extends QueuedHttpClient {
  constructor(config = {}) {
    super({
      baseURL: config.baseURL || '/api',
      timeout: 15000,
      maxConcurrent: 8,
      cacheTTL: 5 * 60 * 1000, // 5分钟缓存
      retries: 3,
      ...config
    });
    
    this.setupEcommerceInterceptors();
  }
  
  // 设置电商专用拦截器
  setupEcommerceInterceptors() {
    // 请求拦截器 - 添加用户信息
    this.interceptors.request.use((config) => {
      const userId = this.getCurrentUserId();
      if (userId) {
        config.headers['X-User-ID'] = userId;
      }
      
      // 添加设备信息
      config.headers['X-Device-Type'] = this.getDeviceType();
      config.headers['X-App-Version'] = this.getAppVersion();
      
      return config;
    });
    
    // 请求拦截器 - 添加购物车ID
    this.interceptors.request.use((config) => {
      const cartId = this.getCartId();
      if (cartId && config.url.includes('/cart')) {
        config.headers['X-Cart-ID'] = cartId;
      }
      
      return config;
    });
    
    // 响应拦截器 - 处理业务错误码
    this.interceptors.response.use((response, config) => {
      // 处理电商特定的错误码
      if (response.code) {
        switch (response.code) {
          case 40001:
            throw new Error('商品库存不足');
          case 40002:
            throw new Error('商品已下架');
          case 40003:
            throw new Error('购物车已过期');
          case 50001:
            throw new Error('支付服务暂时不可用');
        }
      }
      
      return response;
    });
  }
  
  // 用户相关API
  user = {
    // 获取用户信息
    getProfile: () => this.get('/user/profile', { cacheTTL: 10 * 60 * 1000 }),
    
    // 更新用户信息
    updateProfile: (data) => this.put('/user/profile', data),
    
    // 获取用户订单
    getOrders: (params) => this.get('/user/orders', { params }),
    
    // 获取用户地址
    getAddresses: () => this.get('/user/addresses', { cacheTTL: 5 * 60 * 1000 }),
    
    // 添加地址
    addAddress: (data) => this.post('/user/addresses', data)
  };
  
  // 商品相关API
  product = {
    // 获取商品列表
    getList: (params) => this.get('/products', { 
      params, 
      cacheTTL: 2 * 60 * 1000,
      priority: 'high' 
    }),
    
    // 获取商品详情
    getDetail: (id) => this.get(`/products/${id}`, { 
      cacheTTL: 5 * 60 * 1000,
      priority: 'high' 
    }),
    
    // 搜索商品
    search: (query, params) => this.get('/products/search', { 
      params: { q: query, ...params },
      cacheTTL: 1 * 60 * 1000 
    }),
    
    // 获取商品评价
    getReviews: (id, params) => this.get(`/products/${id}/reviews`, { params }),
    
    // 获取相关商品
    getRelated: (id) => this.get(`/products/${id}/related`, { 
      cacheTTL: 10 * 60 * 1000 
    })
  };
  
  // 购物车相关API
  cart = {
    // 获取购物车
    get: () => this.get('/cart', { priority: 'high' }),
    
    // 添加到购物车
    add: (productId, quantity) => this.post('/cart/items', { 
      productId, 
      quantity 
    }),
    
    // 更新购物车商品数量
    updateQuantity: (itemId, quantity) => this.put(`/cart/items/${itemId}`, { 
      quantity 
    }),
    
    // 删除购物车商品
    remove: (itemId) => this.delete(`/cart/items/${itemId}`),
    
    // 清空购物车
    clear: () => this.delete('/cart')
  };
  
  // 订单相关API
  order = {
    // 创建订单
    create: (data) => this.post('/orders', data, { timeout: 30000 }),
    
    // 获取订单详情
    getDetail: (id) => this.get(`/orders/${id}`),
    
    // 取消订单
    cancel: (id, reason) => this.post(`/orders/${id}/cancel`, { reason }),
    
    // 确认收货
    confirm: (id) => this.post(`/orders/${id}/confirm`),
    
    // 申请退款
    refund: (id, data) => this.post(`/orders/${id}/refund`, data)
  };
  
  // 支付相关API
  payment = {
    // 创建支付
    create: (orderId, method) => this.post('/payment/create', { 
      orderId, 
      method 
    }, { timeout: 30000 }),
    
    // 查询支付状态
    getStatus: (paymentId) => this.get(`/payment/${paymentId}/status`),
    
    // 支付回调验证
    verify: (data) => this.post('/payment/verify', data)
  };
  
  // 获取当前用户ID
  getCurrentUserId() {
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
  }
  
  // 获取购物车ID
  getCartId() {
    return localStorage.getItem('cartId') || sessionStorage.getItem('cartId');
  }
  
  // 获取设备类型
  getDeviceType() {
    const userAgent = navigator.userAgent;
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'mobile';
    } else if (/Tablet/.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }
  
  // 获取应用版本
  getAppVersion() {
    return process.env.REACT_APP_VERSION || '1.0.0';
  }
}

// 创建全局API实例
const api = new EcommerceApiClient({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api'
});

export default api;
```

### 2. 请求监控和分析

```javascript
/**
 * 请求监控和分析
 */
class RequestMonitor {
  constructor(httpClient) {
    this.httpClient = httpClient;
    this.metrics = {
      requests: [],
      errors: [],
      performance: {
        averageResponseTime: 0,
        slowRequests: [],
        fastRequests: []
      }
    };
    
    this.setupMonitoring();
  }
  
  // 设置监控
  setupMonitoring() {
    // 监控请求开始
    this.httpClient.interceptors.request.use((config) => {
      config.startTime = performance.now();
      config.requestId = this.generateRequestId();
      
      this.logRequest(config);
      
      return config;
    });
    
    // 监控请求完成
    this.httpClient.interceptors.response.use(
      (response, config) => {
        const endTime = performance.now();
        const duration = endTime - config.startTime;
        
        this.logResponse(config, response, duration);
        
        return response;
      },
      (error, config) => {
        const endTime = performance.now();
        const duration = endTime - (config.startTime || endTime);
        
        this.logError(config, error, duration);
        
        throw error;
      }
    );
  }
  
  // 记录请求
  logRequest(config) {
    const requestLog = {
      id: config.requestId,
      method: config.method,
      url: config.url,
      timestamp: Date.now(),
      startTime: config.startTime,
      headers: { ...config.headers },
      userAgent: navigator.userAgent
    };
    
    this.metrics.requests.push(requestLog);
    
    // 只保留最近1000条记录
    if (this.metrics.requests.length > 1000) {
      this.metrics.requests.shift();
    }
  }
  
  // 记录响应
  logResponse(config, response, duration) {
    const requestIndex = this.metrics.requests.findIndex(
      req => req.id === config.requestId
    );
    
    if (requestIndex !== -1) {
      this.metrics.requests[requestIndex] = {
        ...this.metrics.requests[requestIndex],
        status: response.status,
        duration,
        success: true,
        endTime: performance.now()
      };
    }
    
    // 性能分析
    this.analyzePerformance(config, duration);
  }
  
  // 记录错误
  logError(config, error, duration) {
    const errorLog = {
      id: config.requestId,
      method: config.method,
      url: config.url,
      error: error.message,
      type: error.type,
      duration,
      timestamp: Date.now()
    };
    
    this.metrics.errors.push(errorLog);
    
    // 只保留最近500条错误记录
    if (this.metrics.errors.length > 500) {
      this.metrics.errors.shift();
    }
    
    // 更新请求记录
    const requestIndex = this.metrics.requests.findIndex(
      req => req.id === config.requestId
    );
    
    if (requestIndex !== -1) {
      this.metrics.requests[requestIndex] = {
        ...this.metrics.requests[requestIndex],
        error: error.message,
        duration,
        success: false,
        endTime: performance.now()
      };
    }
  }
  
  // 性能分析
  analyzePerformance(config, duration) {
    // 慢请求阈值 (2秒)
    const slowThreshold = 2000;
    // 快请求阈值 (100ms)
    const fastThreshold = 100;
    
    if (duration > slowThreshold) {
      this.metrics.performance.slowRequests.push({
        url: config.url,
        method: config.method,
        duration,
        timestamp: Date.now()
      });
      
      // 只保留最近50条慢请求
      if (this.metrics.performance.slowRequests.length > 50) {
        this.metrics.performance.slowRequests.shift();
      }
    } else if (duration < fastThreshold) {
      this.metrics.performance.fastRequests.push({
        url: config.url,
        method: config.method,
        duration,
        timestamp: Date.now()
      });
      
      // 只保留最近50条快请求
      if (this.metrics.performance.fastRequests.length > 50) {
        this.metrics.performance.fastRequests.shift();
      }
    }
    
    // 更新平均响应时间
    this.updateAverageResponseTime();
  }
  
  // 更新平均响应时间
  updateAverageResponseTime() {
    const recentRequests = this.metrics.requests
      .filter(req => req.success && req.duration)
      .slice(-100); // 最近100个成功请求
    
    if (recentRequests.length > 0) {
      const totalDuration = recentRequests.reduce(
        (sum, req) => sum + req.duration, 0
      );
      
      this.metrics.performance.averageResponseTime = 
        totalDuration / recentRequests.length;
    }
  }
  
  // 生成请求ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 获取监控报告
  getReport() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // 最近一小时的请求
    const recentRequests = this.metrics.requests.filter(
      req => now - req.timestamp < oneHour
    );
    
    // 最近一小时的错误
    const recentErrors = this.metrics.errors.filter(
      err => now - err.timestamp < oneHour
    );
    
    // 成功率
    const successRate = recentRequests.length > 0 ? 
      (recentRequests.filter(req => req.success).length / recentRequests.length) * 100 : 0;
    
    // 错误统计
    const errorStats = this.getErrorStats(recentErrors);
    
    // 性能统计
    const performanceStats = this.getPerformanceStats(recentRequests);
    
    return {
      summary: {
        totalRequests: recentRequests.length,
        totalErrors: recentErrors.length,
        successRate: successRate.toFixed(2) + '%',
        averageResponseTime: this.metrics.performance.averageResponseTime.toFixed(2) + 'ms'
      },
      errors: errorStats,
      performance: performanceStats,
      slowRequests: this.metrics.performance.slowRequests.slice(-10),
      topEndpoints: this.getTopEndpoints(recentRequests)
    };
  }
  
  // 获取错误统计
  getErrorStats(errors) {
    const errorTypes = {};
    const errorUrls = {};
    
    errors.forEach(error => {
      // 按错误类型统计
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
      
      // 按URL统计
      errorUrls[error.url] = (errorUrls[error.url] || 0) + 1;
    });
    
    return {
      byType: errorTypes,
      byUrl: errorUrls,
      total: errors.length
    };
  }
  
  // 获取性能统计
  getPerformanceStats(requests) {
    const durations = requests
      .filter(req => req.duration && req.success)
      .map(req => req.duration)
      .sort((a, b) => a - b);
    
    if (durations.length === 0) {
      return { min: 0, max: 0, median: 0, p95: 0, p99: 0 };
    }
    
    const min = durations[0];
    const max = durations[durations.length - 1];
    const median = durations[Math.floor(durations.length / 2)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];
    
    return { min, max, median, p95, p99 };
  }
  
  // 获取热门接口
  getTopEndpoints(requests) {
    const endpointCounts = {};
    
    requests.forEach(req => {
      const endpoint = `${req.method} ${req.url}`;
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
    });
    
    return Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }
  
  // 导出监控数据
  exportData() {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      report: this.getReport()
    };
  }
  
  // 清除监控数据
  clearData() {
    this.metrics = {
      requests: [],
      errors: [],
      performance: {
        averageResponseTime: 0,
        slowRequests: [],
        fastRequests: []
      }
    };
  }
}

// 使用示例
const monitor = new RequestMonitor(api);

// 定期输出监控报告
setInterval(() => {
  const report = monitor.getReport();
  console.log('API监控报告:', report);
}, 60000); // 每分钟输出一次
```

## 常见面试问题

### Q1: 如何设计一个好的HTTP客户端？

**设计原则：**
1. **统一接口**：提供一致的API调用方式
2. **拦截器机制**：支持请求和响应拦截
3. **错误处理**：统一的错误处理和重试机制
4. **缓存策略**：合理的缓存机制
5. **并发控制**：请求队列和并发限制

**代码示例：**
```javascript
class HttpClient {
  constructor(config) {
    this.config = config;
    this.interceptors = { request: [], response: [] };
  }
  
  async request(url, options) {
    // 1. 执行请求拦截器
    const config = await this.executeRequestInterceptors({ url, ...options });
    
    // 2. 发送请求
    const response = await fetch(config.url, config);
    
    // 3. 执行响应拦截器
    return await this.executeResponseInterceptors(response, config);
  }
  
  // 便捷方法
  get(url, config) { return this.request(url, { ...config, method: 'GET' }); }
  post(url, data, config) { 
    return this.request(url, { 
      ...config, 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  }
}
```

### Q2: 如何实现请求拦截器？

**拦截器实现：**
```javascript
class InterceptorManager {
  constructor() {
    this.interceptors = [];
  }
  
  use(onFulfilled, onRejected) {
    this.interceptors.push({ onFulfilled, onRejected });
    return this.interceptors.length - 1; // 返回索引用于移除
  }
  
  eject(id) {
    if (this.interceptors[id]) {
      this.interceptors[id] = null;
    }
  }
  
  async execute(value) {
    let result = value;
    
    for (const interceptor of this.interceptors) {
      if (interceptor) {
        try {
          result = await interceptor.onFulfilled(result);
        } catch (error) {
          if (interceptor.onRejected) {
            result = await interceptor.onRejected(error);
          } else {
            throw error;
          }
        }
      }
    }
    
    return result;
  }
}
```

### Q3: 如何处理请求错误和重试？

**错误处理和重试：**
```javascript
class RetryableHttpClient {
  async requestWithRetry(url, options, retries = 3) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.request(url, options);
      } catch (error) {
        // 判断是否应该重试
        if (attempt === retries || !this.shouldRetry(error)) {
          throw error;
        }
        
        // 计算延迟时间（指数退避）
        const delay = Math.pow(2, attempt) * 1000;
        await this.delay(delay);
      }
    }
  }
  
  shouldRetry(error) {
    // 网络错误或5xx服务器错误才重试
    return error.type === 'NETWORK_ERROR' || 
           (error.status >= 500 && error.status < 600);
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Q4: 如何实现请求缓存？

**缓存实现：**
```javascript
class CachedHttpClient {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5分钟
  }
  
  async get(url, options = {}) {
    const cacheKey = this.generateCacheKey(url, options);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const response = await this.request(url, options);
    
    // 只缓存成功的GET请求
    if (response.ok) {
      this.setCache(cacheKey, response, options.ttl);
    }
    
    return response;
  }
  
  generateCacheKey(url, options) {
    return `${url}_${JSON.stringify(options.params || {})}`;
  }
  
  setCache(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }
  
  getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key); // 删除过期缓存
    }
    
    return null;
  }
}
```

## 总结

Request封装是前端架构的重要组成部分，需要考虑：

### 核心功能
1. **基础请求**：统一的请求接口和配置
2. **拦截器**：请求和响应的预处理
3. **错误处理**：统一的错误处理和重试机制
4. **缓存机制**：合理的缓存策略
5. **并发控制**：请求队列和限制

### 高级特性
- **请求监控**：性能分析和错误统计
- **自动重试**：智能重试策略
- **请求去重**：避免重复请求
- **离线支持**：离线缓存和同步

### 面试重点
- **设计思路**：如何设计可扩展的HTTP客户端
- **拦截器原理**：拦截器的实现机制
- **错误处理**：各种错误情况的处理方案
- **性能优化**：缓存、并发控制等优化手段

### 最佳实践
- 统一错误处理和用户提示
- 合理的缓存策略和过期机制
- 请求监控和性能分析
- 安全考虑（CSRF、XSS防护） 