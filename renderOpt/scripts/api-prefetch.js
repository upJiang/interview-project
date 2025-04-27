/**
 * api-prefetch.js
 * API预取实现 - 提前获取可能需要的API数据，提升用户体验
 */

class ApiPrefetcher {
  /**
   * 创建API预取控制器
   * @param {Object} options - 配置选项
   * @param {Object[]} options.endpoints - 需要预取的API端点配置数组
   * @param {string} options.endpoints[].url - API请求地址
   * @param {string} options.endpoints[].method - 请求方法，默认为'GET'
   * @param {Object} options.endpoints[].params - 请求参数
   * @param {string} options.endpoints[].key - 缓存数据的键名
   * @param {number} options.endpoints[].priority - 优先级(1-10)，数字越小优先级越高
   * @param {number} options.endpoints[].maxAge - 数据最大缓存时间(毫秒)
   * @param {boolean} options.useCache - 是否启用缓存，默认为true
   * @param {string} options.cacheNamespace - 缓存命名空间，默认为'api-prefetch'
   * @param {boolean} options.debug - 是否开启调试模式，默认为false
   * @param {Function} options.onComplete - 所有预取完成时的回调函数
   * @param {Function} options.onError - 错误处理回调函数
   * @param {number} options.concurrency - 最大并发数，默认为3
   */
  constructor(options = {}) {
    this.options = {
      // 默认缓存时间（毫秒）
      defaultCacheTime: 5 * 60 * 1000, // 5分钟
      // 预取规则
      rules: [],
      // 缓存存储类型：memory, localStorage, sessionStorage
      storageType: 'memory',
      // 缓存键前缀
      cacheKeyPrefix: 'api_prefetch_',
      // 自动清理过期缓存的间隔（毫秒）
      cleanupInterval: 10 * 60 * 1000, // 10分钟
      // 是否在用户空闲时执行预取
      useIdleCallback: true,
      // 网络条件限制 - 仅在好的网络环境下预取
      networkConditions: {
        onlyWifi: false, // 是否只在WiFi环境下预取
        minDownlink: 0.5, // 最小下行速度要求 (Mbps)
      },
      ...options
    };

    // 缓存存储
    this.cache = {};
    
    // 当前正在预取的请求
    this.pendingFetches = new Map();
    
    // 监听网络状态变化
    this.setupNetworkListener();
    
    // 设置自动清理计时器
    this.setupCacheCleanup();
    
    // 路由变化监听（SPA应用）
    this.setupRouteChangeListener();
    
    console.log('[ApiPrefetcher] 已初始化');
  }

  /**
   * 设置网络状态监听器
   */
  setupNetworkListener() {
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.checkNetworkAndPrefetch();
      });
    }
  }

  /**
   * 设置缓存清理定时器
   */
  setupCacheCleanup() {
    setInterval(() => {
      this.cleanExpiredCache();
    }, this.options.cleanupInterval);
  }

  /**
   * 设置路由变化监听
   * 支持常见的前端路由框架
   */
  setupRouteChangeListener() {
    // 监听 history 变化 (针对基于 history 的路由如 React Router, Vue Router)
    window.addEventListener('popstate', () => {
      this.onRouteChange(window.location.pathname);
    });
    
    // 重写 history.pushState 和 replaceState 方法
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const self = this;
    
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      self.onRouteChange(arguments[2]); // 路径通常是第三个参数
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      self.onRouteChange(arguments[2]);
    };
    
    // 初始路由处理
    setTimeout(() => {
      this.onRouteChange(window.location.pathname);
    }, 0);
  }

  /**
   * 路由变化处理
   * @param {string} path - 当前路径
   */
  onRouteChange(path) {
    console.log(`[ApiPrefetcher] 路由变化: ${path}`);
    // 基于当前路由触发相关预取
    this.prefetchByRoute(path);
  }

  /**
   * 基于路由规则进行预取
   * @param {string} route - 当前路由路径
   */
  prefetchByRoute(route) {
    if (!route) return;
    
    // 找到匹配当前路由的预取规则
    const matchedRules = this.options.rules.filter(rule => {
      if (rule.route instanceof RegExp) {
        return rule.route.test(route);
      } else if (typeof rule.route === 'string') {
        return rule.route === route || 
               route.startsWith(rule.route + '/') || 
               rule.route === '*';
      }
      return false;
    });
    
    if (matchedRules.length > 0) {
      console.log(`[ApiPrefetcher] 找到 ${matchedRules.length} 条匹配路由 ${route} 的预取规则`);
      
      // 执行预取
      for (const rule of matchedRules) {
        this.prefetchByRule(rule);
      }
    }
  }

  /**
   * 根据规则进行预取
   * @param {Object} rule - 预取规则
   */
  prefetchByRule(rule) {
    // 检查条件是否满足
    if (rule.condition && !this.evaluateCondition(rule.condition)) {
      console.log(`[ApiPrefetcher] 规则条件不满足，跳过: ${rule.id || rule.urls[0]}`);
      return;
    }
    
    // 获取要预取的URL列表
    const urls = Array.isArray(rule.urls) ? rule.urls : [rule.urls];
    
    // 优先级
    const priority = rule.priority || 0;
    
    // 缓存时间
    const cacheTime = rule.cacheTime || this.options.defaultCacheTime;
    
    // 确定是否使用空闲回调
    const useIdle = rule.useIdleCallback !== undefined ? 
      rule.useIdleCallback : this.options.useIdleCallback;
      
    // 预取所有URL
    for (const urlConfig of urls) {
      const url = typeof urlConfig === 'string' ? urlConfig : urlConfig.url;
      const options = typeof urlConfig === 'object' ? urlConfig.options : {};
      
      // 检查网络条件
      if (!this.isNetworkConditionGood()) {
        console.log(`[ApiPrefetcher] 网络条件不佳，跳过预取: ${url}`);
        continue;
      }
      
      // 如果使用空闲回调且浏览器支持
      if (useIdle && 'requestIdleCallback' in window) {
        window.requestIdleCallback(
          () => this.fetchAndCache(url, options, cacheTime),
          { timeout: 1000 + (1000 * (5 - Math.min(5, priority))) }
        );
      } else {
        // 否则直接预取，但使用setTimeout根据优先级延迟
        const delay = priority >= 5 ? 0 : (5 - priority) * 200;
        setTimeout(() => {
          this.fetchAndCache(url, options, cacheTime);
        }, delay);
      }
    }
  }

  /**
   * 评估条件是否满足
   * @param {Function|Object} condition - 条件函数或对象
   * @returns {boolean} 是否满足条件
   */
  evaluateCondition(condition) {
    if (typeof condition === 'function') {
      try {
        return condition();
      } catch (e) {
        console.error('[ApiPrefetcher] 条件评估错误:', e);
        return false;
      }
    } else if (typeof condition === 'object') {
      // 可以支持基于对象的简单条件配置
      if (condition.cookieExists) {
        return document.cookie.includes(condition.cookieExists);
      }
      if (condition.localStorageExists) {
        return !!localStorage.getItem(condition.localStorageExists);
      }
      if (condition.queryParam) {
        const params = new URLSearchParams(window.location.search);
        return params.has(condition.queryParam.name) && 
               (condition.queryParam.value === undefined || 
                params.get(condition.queryParam.name) === condition.queryParam.value);
      }
    }
    return true;
  }

  /**
   * 获取并缓存API数据
   * @param {string} url - API URL
   * @param {Object} options - fetch选项
   * @param {number} cacheTime - 缓存时间（毫秒）
   */
  fetchAndCache(url, options = {}, cacheTime = null) {
    // 检查缓存
    const cachedData = this.getCache(url);
    if (cachedData && cachedData.expires > Date.now()) {
      console.log(`[ApiPrefetcher] 使用缓存数据: ${url}`);
      return Promise.resolve(cachedData.data);
    }
    
    // 检查是否已经有相同的请求在进行中
    if (this.pendingFetches.has(url)) {
      console.log(`[ApiPrefetcher] 已有相同请求进行中: ${url}`);
      return this.pendingFetches.get(url);
    }
    
    console.log(`[ApiPrefetcher] 预取API: ${url}`);
    
    // 执行预取请求
    const fetchPromise = fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API预取失败: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // 缓存响应数据
        this.setCache(url, data, cacheTime || this.options.defaultCacheTime);
        // 移除进行中请求记录
        this.pendingFetches.delete(url);
        return data;
      })
      .catch(error => {
        console.error(`[ApiPrefetcher] 预取失败:`, error);
        // 移除进行中请求记录
        this.pendingFetches.delete(url);
        throw error;
      });
    
    // 记录进行中的请求
    this.pendingFetches.set(url, fetchPromise);
    
    return fetchPromise;
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @returns {Object|null} 缓存数据或null
   */
  getCache(key) {
    const cacheKey = this.options.cacheKeyPrefix + key;
    
    try {
      switch (this.options.storageType) {
        case 'localStorage':
          const lsData = localStorage.getItem(cacheKey);
          return lsData ? JSON.parse(lsData) : null;
          
        case 'sessionStorage':
          const ssData = sessionStorage.getItem(cacheKey);
          return ssData ? JSON.parse(ssData) : null;
          
        default: // memory
          return this.cache[cacheKey];
      }
    } catch (e) {
      console.error('[ApiPrefetcher] 读取缓存错误:', e);
      return null;
    }
  }

  /**
   * 设置缓存数据
   * @param {string} key - 缓存键
   * @param {Object} data - 要缓存的数据
   * @param {number} cacheTime - 缓存时间（毫秒）
   */
  setCache(key, data, cacheTime) {
    const cacheKey = this.options.cacheKeyPrefix + key;
    const cacheData = {
      data,
      expires: Date.now() + cacheTime
    };
    
    try {
      switch (this.options.storageType) {
        case 'localStorage':
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
          break;
          
        case 'sessionStorage':
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
          break;
          
        default: // memory
          this.cache[cacheKey] = cacheData;
          break;
      }
    } catch (e) {
      console.error('[ApiPrefetcher] 写入缓存错误:', e);
    }
  }

  /**
   * 清除过期缓存
   */
  cleanExpiredCache() {
    const now = Date.now();
    
    // 内存缓存清理
    if (this.options.storageType === 'memory') {
      for (const key in this.cache) {
        if (this.cache[key] && this.cache[key].expires < now) {
          delete this.cache[key];
        }
      }
      return;
    }
    
    // 本地存储缓存清理
    const storage = this.options.storageType === 'localStorage' ? 
      localStorage : sessionStorage;
    
    const keysToRemove = [];
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(this.options.cacheKeyPrefix)) {
        try {
          const cacheData = JSON.parse(storage.getItem(key));
          if (cacheData && cacheData.expires < now) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // 如果数据无效，也移除
          keysToRemove.push(key);
        }
      }
    }
    
    // 移除过期数据
    keysToRemove.forEach(key => storage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`[ApiPrefetcher] 已清理 ${keysToRemove.length} 条过期缓存`);
    }
  }

  /**
   * 检查网络条件是否适合预取
   * @returns {boolean} 网络条件是否良好
   */
  isNetworkConditionGood() {
    if (!navigator.connection) {
      return true; // 无法检测网络状态，假设良好
    }
    
    const connection = navigator.connection;
    
    // 检查是否只在WiFi下预取
    if (this.options.networkConditions.onlyWifi && 
        connection.type !== 'wifi' && 
        connection.effectiveType !== '4g') {
      return false;
    }
    
    // 检查下行速度
    if (connection.downlink && 
        connection.downlink < this.options.networkConditions.minDownlink) {
      return false;
    }
    
    // 检查数据保护模式
    if (connection.saveData) {
      return false;
    }
    
    return true;
  }

  /**
   * 检查网络状态并基于当前条件执行预取
   */
  checkNetworkAndPrefetch() {
    if (this.isNetworkConditionGood()) {
      console.log('[ApiPrefetcher] 网络条件良好，尝试预取');
      this.prefetchByRoute(window.location.pathname);
    } else {
      console.log('[ApiPrefetcher] 网络条件不佳，暂停预取');
    }
  }

  /**
   * 添加预取规则
   * @param {Object} rule - 预取规则
   */
  addRule(rule) {
    this.options.rules.push(rule);
    console.log(`[ApiPrefetcher] 添加预取规则: ${rule.id || rule.route}`);
    return this;
  }

  /**
   * 移除预取规则
   * @param {string} ruleId - 规则ID
   */
  removeRule(ruleId) {
    const initialLength = this.options.rules.length;
    this.options.rules = this.options.rules.filter(rule => rule.id !== ruleId);
    
    if (initialLength !== this.options.rules.length) {
      console.log(`[ApiPrefetcher] 已移除规则: ${ruleId}`);
    }
    
    return this;
  }

  /**
   * 主动预取特定API
   * @param {string} url - 要预取的URL
   * @param {Object} options - fetch选项
   * @param {number} cacheTime - 缓存时间
   * @returns {Promise} 预取Promise
   */
  prefetch(url, options = {}, cacheTime = null) {
    return this.fetchAndCache(url, options, cacheTime);
  }

  /**
   * 删除指定URL的缓存
   * @param {string} url - 要删除缓存的URL
   */
  invalidateCache(url) {
    const cacheKey = this.options.cacheKeyPrefix + url;
    
    switch (this.options.storageType) {
      case 'localStorage':
        localStorage.removeItem(cacheKey);
        break;
      case 'sessionStorage':
        sessionStorage.removeItem(cacheKey);
        break;
      default: // memory
        delete this.cache[cacheKey];
        break;
    }
    
    console.log(`[ApiPrefetcher] 已清除缓存: ${url}`);
    return this;
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    const prefix = this.options.cacheKeyPrefix;
    
    switch (this.options.storageType) {
      case 'localStorage':
      case 'sessionStorage':
        const storage = this.options.storageType === 'localStorage' ? 
          localStorage : sessionStorage;
        
        const keysToRemove = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => storage.removeItem(key));
        break;
        
      default: // memory
        this.cache = {};
        break;
    }
    
    console.log('[ApiPrefetcher] 已清除所有缓存');
    return this;
  }
}

// 创建全局实例
window.apiPrefetcher = new ApiPrefetcher({
  useIdleCallback: true,
  storageType: 'localStorage',
  defaultCacheTime: 5 * 60 * 1000, // 5分钟
  rules: [
    // 首页预取规则
    {
      id: 'home-data',
      route: '/',
      priority: 5, // 高优先级
      urls: ['/api/products/popular', '/api/categories']
    },
    // 产品页预取规则
    {
      id: 'product-detail',
      route: /^\/product\/(\d+)$/,
      // 相关产品推荐
      priority: 3,
      urls: [
        // 预取评论
        {
          url: match => `/api/products/${match[1]}/reviews`,
          options: { method: 'GET' }
        },
        // 预取相关产品
        {
          url: match => `/api/products/${match[1]}/related`,
          options: { method: 'GET' }
        }
      ],
      // 自定义条件：只有在用户已登录时才预取
      condition: () => !!localStorage.getItem('user_token')
    }
  ]
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiPrefetcher;
}

// 使用示例
// window.apiPrefetcher.prefetch('/api/user/profile');

// 添加多个路由的动态预取 - 可以在应用初始化时配置
/*
window.apiPrefetcher.addRule({
  id: 'category-page',
  route: '/category',
  urls: ['/api/recommendations']
});
*/ 