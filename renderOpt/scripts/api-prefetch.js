/**
 * api-prefetch.js
 * API预取模块，用于提前请求首屏关键数据
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
    // 默认配置
    this.options = {
      endpoints: [],
      useCache: true,
      cacheNamespace: 'api-prefetch',
      debug: false,
      onComplete: null,
      onError: null,
      concurrency: 3,
      ...options
    };

    // 状态控制
    this.status = {
      isPrefetching: false,
      prefetchedCount: 0,
      failedCount: 0,
      totalCount: this.options.endpoints.length
    };

    // 性能指标
    this.metrics = {
      startTime: 0,
      endTime: 0,
      responseTimesByEndpoint: {},
      totalTime: 0,
      cacheHits: 0
    };

    // 预取队列
    this.queue = [...this.options.endpoints].sort((a, b) => 
      (a.priority || 5) - (b.priority || 5)
    );

    // 活跃请求计数
    this.activeRequests = 0;

    // 缓存存储
    this.cacheStorage = this._initCache();

    // 初始化
    this._log('ApiPrefetcher 已初始化');
  }

  /**
   * 初始化缓存系统
   * @returns {Object} 缓存控制器对象
   * @private
   */
  _initCache() {
    // 检查是否支持SessionStorage
    const isStorageAvailable = (function() {
      try {
        const storage = window.sessionStorage;
        const testKey = '__storage_test__';
        storage.setItem(testKey, testKey);
        storage.removeItem(testKey);
        return true;
      } catch (e) {
        return false;
      }
    })();

    // 内存缓存备选方案
    const memoryCache = {
      store: new Map(),
      get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        
        // 检查有效期
        if (item.expiry && item.expiry < Date.now()) {
          this.store.delete(key);
          return null;
        }
        
        return item.data;
      },
      set(key, value, maxAge) {
        const item = {
          data: value,
          expiry: maxAge ? Date.now() + maxAge : null
        };
        this.store.set(key, item);
      },
      delete(key) {
        this.store.delete(key);
      },
      clear() {
        this.store.clear();
      }
    };

    // 根据浏览器支持返回适当的缓存管理器
    if (isStorageAvailable && this.options.useCache) {
      return {
        get: (key) => {
          const cacheKey = `${this.options.cacheNamespace}:${key}`;
          const cachedItem = sessionStorage.getItem(cacheKey);
          
          if (!cachedItem) return null;
          
          try {
            const { data, expiry } = JSON.parse(cachedItem);
            
            // 检查有效期
            if (expiry && expiry < Date.now()) {
              sessionStorage.removeItem(cacheKey);
              return null;
            }
            
            return data;
          } catch (e) {
            this._log(`缓存解析错误: ${e.message}`, 'error');
            sessionStorage.removeItem(cacheKey);
            return null;
          }
        },
        set: (key, value, maxAge) => {
          const cacheKey = `${this.options.cacheNamespace}:${key}`;
          const item = {
            data: value,
            expiry: maxAge ? Date.now() + maxAge : null
          };
          
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(item));
          } catch (e) {
            this._log(`缓存存储错误: ${e.message}`, 'error');
          }
        },
        delete: (key) => {
          const cacheKey = `${this.options.cacheNamespace}:${key}`;
          sessionStorage.removeItem(cacheKey);
        },
        clear: () => {
          // 只清除当前命名空间的缓存
          const keysToRemove = [];
          
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith(`${this.options.cacheNamespace}:`)) {
              keysToRemove.push(key);
            }
          }
          
          keysToRemove.forEach(key => sessionStorage.removeItem(key));
        }
      };
    } else {
      return memoryCache;
    }
  }

  /**
   * 开始预取数据
   * @returns {Promise<Object>} 包含所有预取结果的对象
   */
  async prefetch() {
    if (this.status.isPrefetching) {
      this._log('预取操作已经在进行中', 'warn');
      return;
    }

    // 如果没有端点配置，直接返回
    if (this.queue.length === 0) {
      this._log('没有配置预取端点', 'warn');
      return {};
    }

    this.status.isPrefetching = true;
    this.metrics.startTime = Date.now();

    // 重置计数器
    this.status.prefetchedCount = 0;
    this.status.failedCount = 0;
    this.activeRequests = 0;

    this._log(`开始预取 ${this.queue.length} 个API数据源`);

    // 存储所有预取结果
    const results = {};

    try {
      await this._processQueue(results);
      
      // 计算总时间
      this.metrics.endTime = Date.now();
      this.metrics.totalTime = this.metrics.endTime - this.metrics.startTime;
      
      // 记录性能指标
      this._logPerformance();
      
      // 调用完成回调
      if (typeof this.options.onComplete === 'function') {
        this.options.onComplete(results);
      }
      
      this._log(`预取完成，成功: ${this.status.prefetchedCount}，失败: ${this.status.failedCount}`);
      
      return results;
    } catch (error) {
      this._log(`预取过程中发生错误: ${error.message}`, 'error');
      
      // 调用错误回调
      if (typeof this.options.onError === 'function') {
        this.options.onError(error);
      }
      
      throw error;
    } finally {
      this.status.isPrefetching = false;
    }
  }

  /**
   * 处理预取队列
   * @param {Object} results - 用于存储结果的对象
   * @returns {Promise<void>}
   * @private
   */
  async _processQueue(results) {
    return new Promise((resolve) => {
      const processNext = () => {
        // 如果队列为空且没有活跃请求，表示所有请求已完成
        if (this.queue.length === 0 && this.activeRequests === 0) {
          resolve();
          return;
        }

        // 检查是否可以发起更多请求
        while (this.queue.length > 0 && this.activeRequests < this.options.concurrency) {
          const endpoint = this.queue.shift();
          this.activeRequests++;

          this._fetchEndpoint(endpoint)
            .then(data => {
              // 存储结果
              if (endpoint.key) {
                results[endpoint.key] = data;
              }
              this.status.prefetchedCount++;
            })
            .catch(error => {
              this._log(`预取 ${endpoint.url} 失败: ${error.message}`, 'error');
              this.status.failedCount++;
              
              // 如果提供了端点特定的错误处理函数，则调用
              if (typeof endpoint.onError === 'function') {
                endpoint.onError(error);
              }
            })
            .finally(() => {
              this.activeRequests--;
              // 继续处理队列
              processNext();
            });
        }
      };

      // 开始处理队列
      processNext();
    });
  }

  /**
   * 获取单个端点数据
   * @param {Object} endpoint - 端点配置
   * @returns {Promise<any>} 获取的数据
   * @private
   */
  async _fetchEndpoint(endpoint) {
    const { 
      url, 
      method = 'GET', 
      params = {}, 
      headers = {}, 
      key, 
      maxAge,
      responseType = 'json',
      timeout = 10000
    } = endpoint;

    // 如果启用缓存，先尝试从缓存获取
    if (this.options.useCache && key && maxAge) {
      const cachedData = this.cacheStorage.get(key);
      if (cachedData) {
        this._log(`命中缓存: ${key}`);
        this.metrics.cacheHits++;
        return cachedData;
      }
    }

    this._log(`预取: ${method} ${url}`);
    const startTime = Date.now();

    try {
      // 构建请求参数
      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        signal: AbortSignal.timeout(timeout) // 设置超时
      };

      // 如果是GET请求，将参数添加到URL
      let fetchUrl = url;
      if (method === 'GET' && Object.keys(params).length > 0) {
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          queryParams.append(key, value);
        }
        fetchUrl = `${url}${url.includes('?') ? '&' : '?'}${queryParams.toString()}`;
      } else if (method !== 'GET' && Object.keys(params).length > 0) {
        // 非GET请求，将参数放入请求体
        fetchOptions.body = JSON.stringify(params);
      }

      // 发送请求
      const response = await fetch(fetchUrl, fetchOptions);

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      // 根据responseType解析响应
      let data;
      switch (responseType) {
        case 'json':
          data = await response.json();
          break;
        case 'text':
          data = await response.text();
          break;
        case 'blob':
          data = await response.blob();
          break;
        case 'arrayBuffer':
          data = await response.arrayBuffer();
          break;
        default:
          data = await response.json();
      }

      // 计算响应时间
      const responseTime = Date.now() - startTime;
      this.metrics.responseTimesByEndpoint[key || url] = responseTime;

      this._log(`预取成功: ${method} ${url} (${responseTime}ms)`);

      // 如果启用缓存并指定了缓存键，则缓存数据
      if (this.options.useCache && key && maxAge) {
        this.cacheStorage.set(key, data, maxAge);
        this._log(`缓存数据: ${key}, 过期时间: ${maxAge}ms`);
      }

      return data;
    } catch (error) {
      // 记录失败的请求
      this._log(`预取失败: ${method} ${url} - ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 获取已缓存的数据
   * @param {string} key - 缓存键名
   * @returns {*} 缓存的数据，如果不存在则返回null
   */
  getCachedData(key) {
    return this.cacheStorage.get(key);
  }

  /**
   * 手动设置缓存数据
   * @param {string} key - 缓存键名
   * @param {*} data - 要缓存的数据
   * @param {number} maxAge - 数据最大缓存时间(毫秒)
   */
  setCachedData(key, data, maxAge) {
    this.cacheStorage.set(key, data, maxAge);
    this._log(`手动设置缓存: ${key}, 过期时间: ${maxAge}ms`);
  }

  /**
   * 清除指定键的缓存
   * @param {string} key - 缓存键名
   */
  clearCache(key) {
    if (key) {
      this.cacheStorage.delete(key);
      this._log(`清除缓存: ${key}`);
    } else {
      this.cacheStorage.clear();
      this._log('清除所有缓存');
    }
  }

  /**
   * 添加新的预取端点
   * @param {Object|Object[]} endpoints - 一个或多个端点配置
   */
  addEndpoints(endpoints) {
    const newEndpoints = Array.isArray(endpoints) ? endpoints : [endpoints];
    
    // 按优先级排序后添加到队列
    this.queue = [
      ...this.queue,
      ...newEndpoints
    ].sort((a, b) => (a.priority || 5) - (b.priority || 5));
    
    // 更新总数
    this.status.totalCount = this.queue.length;
    
    this._log(`添加了 ${newEndpoints.length} 个新的预取端点，当前队列长度: ${this.queue.length}`);
  }

  /**
   * 记录日志
   * @param {string} message - 日志消息
   * @param {string} level - 日志级别(log, warn, error)
   * @private
   */
  _log(message, level = 'log') {
    if (!this.options.debug) return;
    
    const prefix = '[API预取]';
    
    switch (level) {
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  /**
   * 记录性能指标
   * @private
   */
  _logPerformance() {
    if (!this.options.debug) return;
    
    const avgResponseTime = Object.values(this.metrics.responseTimesByEndpoint).length > 0 
      ? Object.values(this.metrics.responseTimesByEndpoint).reduce((sum, time) => sum + time, 0) / 
        Object.values(this.metrics.responseTimesByEndpoint).length 
      : 0;
    
    console.log('[API预取性能指标]', {
      总时间: `${this.metrics.totalTime}ms`,
      平均响应时间: `${Math.round(avgResponseTime)}ms`,
      成功率: `${Math.round((this.status.prefetchedCount / this.status.totalCount) * 100)}%`,
      缓存命中数: this.metrics.cacheHits,
      各接口响应时间: this.metrics.responseTimesByEndpoint
    });
  }

  /**
   * 获取当前状态
   * @returns {Object} 当前状态对象
   */
  getStatus() {
    return {
      ...this.status,
      metrics: this.metrics
    };
  }

  /**
   * 重置预取器
   */
  reset() {
    // 重置状态
    this.status = {
      isPrefetching: false,
      prefetchedCount: 0,
      failedCount: 0,
      totalCount: this.options.endpoints.length
    };

    // 重置性能指标
    this.metrics = {
      startTime: 0,
      endTime: 0,
      responseTimesByEndpoint: {},
      totalTime: 0,
      cacheHits: 0
    };

    // 重置队列
    this.queue = [...this.options.endpoints].sort((a, b) => 
      (a.priority || 5) - (b.priority || 5)
    );

    // 重置活跃请求
    this.activeRequests = 0;

    this._log('预取器已重置');
  }
}

// 导出ApiPrefetcher类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiPrefetcher;
} else {
  window.ApiPrefetcher = ApiPrefetcher;
} 