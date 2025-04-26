/**
 * api-optimize.js
 * API请求优化脚本，用于实现请求合并、缓存和预加载
 */

(function() {
  class APIOptimizer {
    constructor(options = {}) {
      this.options = Object.assign({
        cacheEnabled: true,            // 是否启用缓存
        cacheTTL: 60 * 1000,           // 缓存过期时间（毫秒）
        batchingEnabled: true,         // 是否启用请求合并
        batchingDelay: 50,             // 批处理延迟（毫秒）
        compressionEnabled: true,      // 是否启用数据压缩
        loggingEnabled: false,         // 是否启用日志记录
        retryEnabled: true,            // 是否启用请求重试
        retryCount: 3,                 // 最大重试次数
        retryDelay: 300,               // 重试延迟（毫秒）
        priorityEnabled: true,         // 是否启用请求优先级
        preloadAPIs: []                // 预加载API列表
      }, options);

      // 初始化存储
      this.cache = new Map();           // 缓存存储
      this.batchQueues = new Map();     // 批处理队列
      this.batchTimers = new Map();     // 批处理定时器
      this.pendingRequests = new Map(); // 正在进行的请求
      
      // 状态跟踪
      this.stats = {
        cacheHits: 0,
        cacheMisses: 0,
        batchedRequests: 0,
        totalRequests: 0,
        failedRequests: 0,
        retries: 0
      };
      
      // 初始化
      this.init();
    }
    
    init() {
      // 清理过期缓存的定时器
      setInterval(() => this.cleanupCache(), this.options.cacheTTL);
      
      // 处理预加载
      if (this.options.preloadAPIs.length > 0) {
        this.preloadAPIs();
      }
      
      // 在页面即将卸载时清理资源
      window.addEventListener('beforeunload', () => {
        // 取消所有未完成的批处理
        for (const timer of this.batchTimers.values()) {
          clearTimeout(timer);
        }
      });
      
      // 日志记录
      if (this.options.loggingEnabled) {
        console.log('[APIOptimizer] 初始化完成，选项：', this.options);
      }
    }
    
    /**
     * 生成请求缓存键
     * @param {string} url - 请求URL
     * @param {Object} params - 请求参数
     * @param {string} method - 请求方法
     * @returns {string} 缓存键
     */
    generateCacheKey(url, params, method) {
      // 规范化URL和参数以创建一致的键
      const normalizedParams = params ? JSON.stringify(this.sortObjectKeys(params)) : '';
      return `${method.toUpperCase()}:${url}:${normalizedParams}`;
    }
    
    /**
     * 对象键排序（用于确保一致的缓存键生成）
     * @param {Object} obj - 输入对象
     * @returns {Object} 排序后的对象
     */
    sortObjectKeys(obj) {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => this.sortObjectKeys(item));
      }
      
      return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = this.sortObjectKeys(obj[key]);
        return result;
      }, {});
    }
    
    /**
     * 从缓存获取响应
     * @param {string} cacheKey - 缓存键
     * @returns {Promise|null} 缓存的响应或null
     */
    getFromCache(cacheKey) {
      if (!this.options.cacheEnabled) return null;
      
      const cachedItem = this.cache.get(cacheKey);
      
      if (cachedItem && cachedItem.expiresAt > Date.now()) {
        // 缓存命中
        this.stats.cacheHits++;
        
        if (this.options.loggingEnabled) {
          console.log(`[APIOptimizer] 缓存命中: ${cacheKey}`);
        }
        
        // 返回缓存的数据
        return Promise.resolve(cachedItem.data);
      }
      
      // 缓存未命中或已过期
      if (cachedItem) {
        this.cache.delete(cacheKey);
      }
      
      this.stats.cacheMisses++;
      return null;
    }
    
    /**
     * 将响应存储到缓存
     * @param {string} cacheKey - 缓存键
     * @param {Object} data - 响应数据
     * @param {number} ttl - 缓存过期时间（毫秒）
     */
    storeInCache(cacheKey, data, ttl = null) {
      if (!this.options.cacheEnabled) return;
      
      const expiresAt = Date.now() + (ttl || this.options.cacheTTL);
      
      this.cache.set(cacheKey, {
        data,
        expiresAt,
        createdAt: Date.now()
      });
      
      if (this.options.loggingEnabled) {
        console.log(`[APIOptimizer] 已缓存: ${cacheKey}，过期时间: ${new Date(expiresAt).toISOString()}`);
      }
    }
    
    /**
     * 清理过期缓存
     */
    cleanupCache() {
      if (!this.options.cacheEnabled) return;
      
      const now = Date.now();
      let expiredCount = 0;
      
      for (const [key, value] of this.cache.entries()) {
        if (value.expiresAt <= now) {
          this.cache.delete(key);
          expiredCount++;
        }
      }
      
      if (this.options.loggingEnabled && expiredCount > 0) {
        console.log(`[APIOptimizer] 已清理 ${expiredCount} 条过期缓存`);
      }
    }
    
    /**
     * 批处理请求
     * @param {string} batchKey - 批处理键
     * @param {Function} requestFn - 请求函数
     * @returns {Promise} 批处理结果
     */
    batchRequest(batchKey, requestFn) {
      if (!this.options.batchingEnabled) {
        return requestFn();
      }
      
      // 创建批处理队列（如果不存在）
      if (!this.batchQueues.has(batchKey)) {
        this.batchQueues.set(batchKey, []);
      }
      
      const queue = this.batchQueues.get(batchKey);
      
      // 创建延迟解析的Promise
      let resolvePromise, rejectPromise;
      const promise = new Promise((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
      });
      
      // 添加到队列
      queue.push({
        requestFn,
        resolve: resolvePromise,
        reject: rejectPromise
      });
      
      this.stats.batchedRequests++;
      
      // 设置定时器来处理批处理（如果尚未设置）
      if (!this.batchTimers.has(batchKey)) {
        const timer = setTimeout(() => {
          this.processBatch(batchKey);
        }, this.options.batchingDelay);
        
        this.batchTimers.set(batchKey, timer);
      }
      
      return promise;
    }
    
    /**
     * 处理批处理队列
     * @param {string} batchKey - 批处理键
     */
    processBatch(batchKey) {
      // 清除定时器
      clearTimeout(this.batchTimers.get(batchKey));
      this.batchTimers.delete(batchKey);
      
      // 获取队列
      const queue = this.batchQueues.get(batchKey);
      this.batchQueues.delete(batchKey);
      
      if (!queue || queue.length === 0) return;
      
      if (this.options.loggingEnabled) {
        console.log(`[APIOptimizer] 处理批次 ${batchKey}，请求数: ${queue.length}`);
      }
      
      // 如果只有一个请求，直接处理
      if (queue.length === 1) {
        const { requestFn, resolve, reject } = queue[0];
        requestFn().then(resolve).catch(reject);
        return;
      }
      
      // 在这里实现合并多个请求的逻辑
      // 例如，对于GraphQL，可以合并多个查询为一个请求
      // 对于REST API，可以使用批处理端点
      
      // 简单示例：串行处理所有请求
      Promise.all(queue.map(item => {
        return item.requestFn()
          .then(result => {
            item.resolve(result);
            return result;
          })
          .catch(error => {
            item.reject(error);
            throw error;
          });
      }))
      .catch(error => {
        if (this.options.loggingEnabled) {
          console.error(`[APIOptimizer] 批处理失败: ${error.message}`);
        }
      });
    }
    
    /**
     * 预加载指定的API
     */
    preloadAPIs() {
      if (this.options.preloadAPIs.length === 0) return;
      
      // 使用requestIdleCallback（如果可用）进行预加载
      const preloader = () => {
        for (const apiConfig of this.options.preloadAPIs) {
          this.request(
            apiConfig.url,
            apiConfig.params || {},
            apiConfig.method || 'GET',
            {
              priority: 'low',
              cacheTTL: apiConfig.cacheTTL || this.options.cacheTTL,
              noRetry: true // 预加载不进行重试
            }
          ).catch(() => {
            // 忽略预加载错误
          });
        }
      };
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(preloader, { timeout: 2000 });
      } else {
        setTimeout(preloader, 1000); // 回退到setTimeout
      }
      
      if (this.options.loggingEnabled) {
        console.log(`[APIOptimizer] 已安排预加载 ${this.options.preloadAPIs.length} 个API`);
      }
    }
    
    /**
     * 主请求方法
     * @param {string} url - 请求URL
     * @param {Object} params - 请求参数
     * @param {string} method - 请求方法
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求结果
     */
    request(url, params = {}, method = 'GET', options = {}) {
      // 增加请求计数
      this.stats.totalRequests++;
      
      // 合并选项
      const requestOptions = Object.assign({
        priority: 'normal',  // 'high', 'normal', 'low'
        cacheTTL: null,      // 特定请求的TTL
        noCache: false,      // 是否跳过缓存
        noBatch: false,      // 是否跳过批处理
        noRetry: false,      // 是否跳过重试
        headers: {},         // 自定义头
        signal: null,        // AbortController信号
        timeout: 30000       // 请求超时（毫秒）
      }, options);
      
      // 生成缓存键
      const cacheKey = this.generateCacheKey(url, params, method);
      
      // 如果请求正在进行中，共享相同的Promise
      if (this.pendingRequests.has(cacheKey) && !requestOptions.noCache) {
        if (this.options.loggingEnabled) {
          console.log(`[APIOptimizer] 复用进行中的请求: ${cacheKey}`);
        }
        return this.pendingRequests.get(cacheKey);
      }
      
      // 尝试从缓存获取
      if (!requestOptions.noCache) {
        const cachedResponse = this.getFromCache(cacheKey);
        if (cachedResponse) {
          return cachedResponse;
        }
      }
      
      // 创建请求函数
      const performRequest = () => {
        // 创建AbortController用于超时
        const controller = new AbortController();
        let timeoutId;
        
        if (!requestOptions.signal) {
          requestOptions.signal = controller.signal;
        }
        
        // 设置超时
        if (requestOptions.timeout) {
          timeoutId = setTimeout(() => {
            controller.abort();
          }, requestOptions.timeout);
        }
        
        // 准备请求选项
        const fetchOptions = {
          method: method.toUpperCase(),
          headers: {
            'Content-Type': 'application/json',
            ...requestOptions.headers
          },
          signal: requestOptions.signal
        };
        
        // 添加请求体
        if (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
          fetchOptions.body = JSON.stringify(params);
        }
        
        // 对于GET请求，将参数添加到URL
        let requestUrl = url;
        if ((method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD') && Object.keys(params).length > 0) {
          const queryString = new URLSearchParams();
          
          for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
              if (typeof value === 'object') {
                queryString.append(key, JSON.stringify(value));
              } else {
                queryString.append(key, String(value));
              }
            }
          }
          
          requestUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString.toString()}`;
        }
        
        // 执行请求
        return fetch(requestUrl, fetchOptions)
          .then(response => {
            // 清除超时
            if (timeoutId) clearTimeout(timeoutId);
            
            // 检查响应是否成功
            if (!response.ok) {
              throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
            
            return response.json();
          })
          .then(data => {
            // 从进行中请求列表移除
            this.pendingRequests.delete(cacheKey);
            
            // 缓存响应
            if (!requestOptions.noCache) {
              this.storeInCache(cacheKey, data, requestOptions.cacheTTL);
            }
            
            return data;
          })
          .catch(error => {
            // 清除超时
            if (timeoutId) clearTimeout(timeoutId);
            
            // 从进行中请求列表移除
            this.pendingRequests.delete(cacheKey);
            
            // 记录失败
            this.stats.failedRequests++;
            
            if (this.options.loggingEnabled) {
              console.error(`[APIOptimizer] 请求失败: ${requestUrl}`, error);
            }
            
            throw error;
          });
      };
      
      // 创建支持重试的请求函数
      const requestWithRetry = (retryCount = 0) => {
        return performRequest().catch(error => {
          const canRetry = this.options.retryEnabled && 
                           !requestOptions.noRetry && 
                           retryCount < this.options.retryCount && 
                           !error.name === 'AbortError';
          
          if (canRetry) {
            this.stats.retries++;
            
            // 计算重试延迟（可以实现指数退避）
            const delay = this.options.retryDelay * Math.pow(2, retryCount);
            
            if (this.options.loggingEnabled) {
              console.log(`[APIOptimizer] 重试 (${retryCount + 1}/${this.options.retryCount}): ${cacheKey}，延迟: ${delay}ms`);
            }
            
            return new Promise(resolve => setTimeout(resolve, delay))
              .then(() => requestWithRetry(retryCount + 1));
          }
          
          throw error;
        });
      };
      
      // 执行请求或批处理
      let requestPromise;
      
      if (requestOptions.noBatch || !this.options.batchingEnabled) {
        requestPromise = requestWithRetry();
      } else {
        // 基于优先级和URL创建批处理键
        const batchKey = `${requestOptions.priority}:${url}`;
        requestPromise = this.batchRequest(batchKey, () => requestWithRetry());
      }
      
      // 存储进行中的请求
      this.pendingRequests.set(cacheKey, requestPromise);
      
      return requestPromise;
    }
    
    /**
     * GET请求快捷方法
     * @param {string} url - 请求URL
     * @param {Object} params - 请求参数
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求结果
     */
    get(url, params = {}, options = {}) {
      return this.request(url, params, 'GET', options);
    }
    
    /**
     * POST请求快捷方法
     * @param {string} url - 请求URL
     * @param {Object} data - 请求数据
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求结果
     */
    post(url, data = {}, options = {}) {
      return this.request(url, data, 'POST', options);
    }
    
    /**
     * PUT请求快捷方法
     * @param {string} url - 请求URL
     * @param {Object} data - 请求数据
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求结果
     */
    put(url, data = {}, options = {}) {
      return this.request(url, data, 'PUT', options);
    }
    
    /**
     * DELETE请求快捷方法
     * @param {string} url - 请求URL
     * @param {Object} params - 请求参数
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求结果
     */
    delete(url, params = {}, options = {}) {
      return this.request(url, params, 'DELETE', options);
    }
    
    /**
     * 获取API统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
      const cacheSize = this.cache.size;
      const pendingRequests = this.pendingRequests.size;
      const batchQueueSize = Array.from(this.batchQueues.values())
        .reduce((total, queue) => total + queue.length, 0);
      
      return {
        ...this.stats,
        cacheSize,
        pendingRequests,
        batchQueueSize
      };
    }
    
    /**
     * 清除所有缓存
     */
    clearCache() {
      this.cache.clear();
      
      if (this.options.loggingEnabled) {
        console.log('[APIOptimizer] 缓存已清除');
      }
    }
    
    /**
     * 取消所有待处理的请求
     */
    cancelAllRequests() {
      // 取消所有批处理
      for (const timer of this.batchTimers.values()) {
        clearTimeout(timer);
      }
      
      this.batchTimers.clear();
      this.batchQueues.clear();
      
      // 现在我们无法直接中止所有fetch请求，
      // 但如果你使用AbortController可以在这里中止它们
      
      if (this.options.loggingEnabled) {
        console.log('[APIOptimizer] 所有待处理请求已取消');
      }
    }
  }
  
  // 创建全局实例
  window.apiOptimizer = new APIOptimizer();
  
  // 导出类以便高级用法
  window.APIOptimizer = APIOptimizer;
})(); 