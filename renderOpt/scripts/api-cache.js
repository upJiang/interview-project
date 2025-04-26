/**
 * api-cache.js
 * API数据缓存实现，优化首屏渲染性能
 * 支持内存缓存、IndexedDB和SessionStorage
 */

class ApiCache {
  /**
   * 创建API缓存实例
   * @param {Object} options - 配置选项
   * @param {string} options.storageType - 存储类型: 'memory', 'indexedDB', 'sessionStorage'
   * @param {string} options.dbName - IndexedDB数据库名称
   * @param {string} options.storeName - IndexedDB存储对象名称
   * @param {number} options.expiration - 缓存过期时间(毫秒)
   * @param {boolean} options.compression - 是否启用压缩
   * @param {Function} options.keyGenerator - 缓存键生成函数
   * @param {boolean} options.debug - 是否启用调试模式
   * @param {Function} options.onError - 错误处理回调
   * @param {Array} options.ignoreParams - 忽略的URL参数
   */
  constructor(options = {}) {
    this.options = {
      storageType: 'memory', // 'memory', 'indexedDB', 'sessionStorage'
      dbName: 'apicache-db',
      storeName: 'api-responses',
      expiration: 5 * 60 * 1000, // 5分钟
      compression: false,
      keyGenerator: null,
      debug: false,
      onError: null,
      ignoreParams: ['_t', 'timestamp'],
      ...options
    };

    // 内存缓存
    this.memoryCache = new Map();
    
    // IndexedDB连接
    this.db = null;
    
    // 初始化
    this._init();
  }

  /**
   * 初始化缓存存储
   * @private
   */
  async _init() {
    try {
      if (this.options.storageType === 'indexedDB') {
        await this._initIndexedDB();
      }
      this._log('API缓存初始化完成');
    } catch (error) {
      this._handleError('初始化失败', error);
      // 降级到内存缓存
      this.options.storageType = 'memory';
    }
  }

  /**
   * 初始化IndexedDB
   * @private
   */
  _initIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('浏览器不支持IndexedDB'));
        return;
      }

      const request = window.indexedDB.open(this.options.dbName, 1);

      request.onerror = event => {
        this._handleError('IndexedDB打开失败', event);
        reject(event.target.error);
      };

      request.onsuccess = event => {
        this.db = event.target.result;
        this._log('IndexedDB连接成功');
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = event.target.result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains(this.options.storeName)) {
          const store = db.createObjectStore(this.options.storeName, { keyPath: 'key' });
          store.createIndex('expiration', 'expiration', { unique: false });
          this._log('创建IndexedDB存储对象');
        }
      };
    });
  }

  /**
   * 生成缓存键
   * @param {string|Object} url - 请求URL或配置对象
   * @param {Object} [params] - 请求参数
   * @returns {string} 缓存键
   * @private
   */
  _generateKey(url, params = {}) {
    // 如果提供了自定义键生成器函数，则使用它
    if (typeof this.options.keyGenerator === 'function') {
      return this.options.keyGenerator(url, params);
    }

    // 处理不同类型的URL参数
    let finalUrl;
    let requestParams = { ...params };

    if (typeof url === 'object') {
      // axios风格配置对象
      finalUrl = url.url || '';
      requestParams = { ...(url.params || {}), ...(url.data || {}), ...requestParams };
    } else {
      finalUrl = url;
    }

    // 移除忽略的参数
    this.options.ignoreParams.forEach(param => {
      delete requestParams[param];
    });

    // 将参数按键排序并拼接到URL
    const sortedParams = Object.keys(requestParams)
      .sort()
      .map(key => `${key}=${JSON.stringify(requestParams[key])}`)
      .join('&');

    return sortedParams ? `${finalUrl}?${sortedParams}` : finalUrl;
  }

  /**
   * 压缩数据
   * @param {Object} data - 要压缩的数据
   * @returns {string} 压缩后的字符串
   * @private
   */
  _compress(data) {
    if (!this.options.compression) {
      return JSON.stringify(data);
    }

    try {
      // 简单的基于JSON的压缩
      return JSON.stringify(data);
      
      // 注意：实际项目中可以使用更高效的压缩库
      // 例如 pako 或 lz-string，但这里为简化实现不引入外部依赖
    } catch (error) {
      this._handleError('数据压缩失败', error);
      return JSON.stringify(data);
    }
  }

  /**
   * 解压数据
   * @param {string} data - 压缩的数据
   * @returns {Object} 解压后的对象
   * @private
   */
  _decompress(data) {
    if (!this.options.compression) {
      return JSON.parse(data);
    }

    try {
      // 简单的基于JSON的解压
      return JSON.parse(data);
      
      // 注意：实际项目中如果使用了压缩库，这里需要对应解压
    } catch (error) {
      this._handleError('数据解压失败', error);
      // 尝试直接解析JSON作为降级
      return JSON.parse(data);
    }
  }

  /**
   * 创建缓存数据对象
   * @param {*} data - 要缓存的数据
   * @returns {Object} 缓存数据对象
   * @private
   */
  _createCacheItem(data) {
    const now = Date.now();
    const compressedData = this._compress(data);
    
    return {
      data: compressedData,
      timestamp: now,
      expiration: now + this.options.expiration
    };
  }

  /**
   * 存储数据到内存缓存
   * @param {string} key - 缓存键
   * @param {*} data - 要缓存的数据
   * @private
   */
  _setMemoryCache(key, data) {
    const cacheItem = this._createCacheItem(data);
    this.memoryCache.set(key, cacheItem);
    this._log(`数据已存储到内存缓存: ${key}`);
  }

  /**
   * 从内存缓存获取数据
   * @param {string} key - 缓存键
   * @returns {Promise<*>} 缓存的数据或null
   * @private
   */
  async _getMemoryCache(key) {
    const cacheItem = this.memoryCache.get(key);
    
    if (!cacheItem) {
      return null;
    }
    
    // 检查是否过期
    if (Date.now() > cacheItem.expiration) {
      this.memoryCache.delete(key);
      this._log(`内存缓存已过期: ${key}`);
      return null;
    }
    
    this._log(`从内存缓存获取数据: ${key}`);
    return this._decompress(cacheItem.data);
  }

  /**
   * 存储数据到IndexedDB
   * @param {string} key - 缓存键
   * @param {*} data - 要缓存的数据
   * @returns {Promise<void>}
   * @private
   */
  _setIndexedDBCache(key, data) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        this._handleError('IndexedDB未初始化');
        reject(new Error('IndexedDB未初始化'));
        return;
      }
      
      try {
        const cacheItem = this._createCacheItem(data);
        const transaction = this.db.transaction([this.options.storeName], 'readwrite');
        const store = transaction.objectStore(this.options.storeName);
        
        const request = store.put({
          key,
          data: cacheItem.data,
          timestamp: cacheItem.timestamp,
          expiration: cacheItem.expiration
        });
        
        request.onsuccess = () => {
          this._log(`数据已存储到IndexedDB: ${key}`);
          resolve();
        };
        
        request.onerror = event => {
          this._handleError('IndexedDB存储失败', event);
          reject(event.target.error);
        };
      } catch (error) {
        this._handleError('IndexedDB存储异常', error);
        reject(error);
      }
    });
  }

  /**
   * 从IndexedDB获取数据
   * @param {string} key - 缓存键
   * @returns {Promise<*>} 缓存的数据或null
   * @private
   */
  _getIndexedDBCache(key) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        this._handleError('IndexedDB未初始化');
        reject(new Error('IndexedDB未初始化'));
        return;
      }
      
      try {
        const transaction = this.db.transaction([this.options.storeName], 'readonly');
        const store = transaction.objectStore(this.options.storeName);
        const request = store.get(key);
        
        request.onsuccess = event => {
          const result = event.target.result;
          
          if (!result) {
            resolve(null);
            return;
          }
          
          // 检查是否过期
          if (Date.now() > result.expiration) {
            // 删除过期数据
            this._removeExpiredItems();
            this._log(`IndexedDB缓存已过期: ${key}`);
            resolve(null);
            return;
          }
          
          this._log(`从IndexedDB获取数据: ${key}`);
          resolve(this._decompress(result.data));
        };
        
        request.onerror = event => {
          this._handleError('IndexedDB读取失败', event);
          reject(event.target.error);
        };
      } catch (error) {
        this._handleError('IndexedDB读取异常', error);
        reject(error);
      }
    });
  }

  /**
   * 存储数据到SessionStorage
   * @param {string} key - 缓存键
   * @param {*} data - 要缓存的数据
   * @private
   */
  _setSessionStorage(key, data) {
    try {
      const cacheItem = this._createCacheItem(data);
      sessionStorage.setItem(
        `apiCache_${key}`,
        JSON.stringify({
          data: cacheItem.data,
          timestamp: cacheItem.timestamp,
          expiration: cacheItem.expiration
        })
      );
      this._log(`数据已存储到SessionStorage: ${key}`);
    } catch (error) {
      this._handleError('SessionStorage存储失败', error);
      // 如果存储失败(例如超出配额)，尝试清理过期数据
      this._cleanStorage();
    }
  }

  /**
   * 从SessionStorage获取数据
   * @param {string} key - 缓存键
   * @returns {Promise<*>} 缓存的数据或null
   * @private
   */
  async _getSessionStorage(key) {
    try {
      const storedItem = sessionStorage.getItem(`apiCache_${key}`);
      
      if (!storedItem) {
        return null;
      }
      
      const cacheItem = JSON.parse(storedItem);
      
      // 检查是否过期
      if (Date.now() > cacheItem.expiration) {
        sessionStorage.removeItem(`apiCache_${key}`);
        this._log(`SessionStorage缓存已过期: ${key}`);
        return null;
      }
      
      this._log(`从SessionStorage获取数据: ${key}`);
      return this._decompress(cacheItem.data);
    } catch (error) {
      this._handleError('SessionStorage读取失败', error);
      return null;
    }
  }

  /**
   * 清理过期的缓存数据
   * @private
   */
  _cleanStorage() {
    // 清理内存缓存
    const now = Date.now();
    this.memoryCache.forEach((value, key) => {
      if (now > value.expiration) {
        this.memoryCache.delete(key);
      }
    });

    // 清理SessionStorage
    if (this.options.storageType === 'sessionStorage') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith('apiCache_')) {
          try {
            const cacheItem = JSON.parse(sessionStorage.getItem(key));
            if (now > cacheItem.expiration) {
              sessionStorage.removeItem(key);
            }
          } catch (error) {
            // 忽略解析错误，删除无效项
            sessionStorage.removeItem(key);
          }
        }
      }
    }

    // 清理IndexedDB过期数据
    if (this.options.storageType === 'indexedDB' && this.db) {
      this._removeExpiredItems();
    }
  }

  /**
   * 从IndexedDB删除过期项
   * @private
   */
  _removeExpiredItems() {
    if (!this.db) return;

    try {
      const now = Date.now();
      const transaction = this.db.transaction([this.options.storeName], 'readwrite');
      const store = transaction.objectStore(this.options.storeName);
      const index = store.index('expiration');
      
      // 获取所有过期的项
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);
      
      request.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          // 删除过期项
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    } catch (error) {
      this._handleError('删除过期项失败', error);
    }
  }

  /**
   * 记录日志
   * @param {string} message - 日志消息
   * @private
   */
  _log(message) {
    if (this.options.debug) {
      console.log(`[ApiCache] ${message}`);
    }
  }

  /**
   * 处理错误
   * @param {string} message - 错误消息
   * @param {Error} [error] - 错误对象
   * @private
   */
  _handleError(message, error) {
    this._log(`错误: ${message}`);
    if (error) {
      this._log(error);
    }
    
    if (typeof this.options.onError === 'function') {
      this.options.onError(message, error);
    }
  }

  /**
   * 缓存API响应数据
   * @param {string|Object} url - 请求URL或配置对象
   * @param {*} data - 要缓存的数据
   * @param {Object} [params] - 请求参数
   * @returns {Promise<void>}
   */
  async set(url, data, params = {}) {
    const key = this._generateKey(url, params);
    
    try {
      // 同时存储到内存缓存，加速后续访问
      this._setMemoryCache(key, data);
      
      // 根据存储类型存储数据
      if (this.options.storageType === 'indexedDB') {
        await this._setIndexedDBCache(key, data);
      } else if (this.options.storageType === 'sessionStorage') {
        this._setSessionStorage(key, data);
      }
      
      return true;
    } catch (error) {
      this._handleError('缓存数据失败', error);
      return false;
    }
  }

  /**
   * 获取缓存的API响应数据
   * @param {string|Object} url - 请求URL或配置对象
   * @param {Object} [params] - 请求参数
   * @returns {Promise<*>} 缓存的数据或null
   */
  async get(url, params = {}) {
    const key = this._generateKey(url, params);
    
    try {
      // 首先尝试从内存缓存获取（最快）
      let data = await this._getMemoryCache(key);
      
      // 如果内存缓存没有，尝试持久存储
      if (data === null) {
        if (this.options.storageType === 'indexedDB') {
          data = await this._getIndexedDBCache(key);
          
          // 如果从IndexedDB获取到数据，也存储到内存缓存中
          if (data !== null) {
            this._setMemoryCache(key, data);
          }
        } else if (this.options.storageType === 'sessionStorage') {
          data = await this._getSessionStorage(key);
          
          // 如果从SessionStorage获取到数据，也存储到内存缓存中
          if (data !== null) {
            this._setMemoryCache(key, data);
          }
        }
      }
      
      return data;
    } catch (error) {
      this._handleError('获取缓存数据失败', error);
      return null;
    }
  }

  /**
   * 检查是否存在缓存
   * @param {string|Object} url - 请求URL或配置对象
   * @param {Object} [params] - 请求参数
   * @returns {Promise<boolean>} 是否存在缓存
   */
  async has(url, params = {}) {
    const data = await this.get(url, params);
    return data !== null;
  }

  /**
   * 清除指定的缓存项
   * @param {string|Object} url - 请求URL或配置对象
   * @param {Object} [params] - 请求参数
   * @returns {Promise<boolean>} 是否成功
   */
  async remove(url, params = {}) {
    const key = this._generateKey(url, params);
    
    try {
      // 从内存缓存中移除
      this.memoryCache.delete(key);
      
      // 从持久存储中移除
      if (this.options.storageType === 'indexedDB' && this.db) {
        const transaction = this.db.transaction([this.options.storeName], 'readwrite');
        const store = transaction.objectStore(this.options.storeName);
        await new Promise((resolve, reject) => {
          const request = store.delete(key);
          request.onsuccess = () => resolve();
          request.onerror = event => reject(event.target.error);
        });
      } else if (this.options.storageType === 'sessionStorage') {
        sessionStorage.removeItem(`apiCache_${key}`);
      }
      
      this._log(`已删除缓存: ${key}`);
      return true;
    } catch (error) {
      this._handleError('删除缓存失败', error);
      return false;
    }
  }

  /**
   * 清除所有缓存
   * @returns {Promise<boolean>} 是否成功
   */
  async clear() {
    try {
      // 清除内存缓存
      this.memoryCache.clear();
      
      // 清除持久存储
      if (this.options.storageType === 'indexedDB' && this.db) {
        const transaction = this.db.transaction([this.options.storeName], 'readwrite');
        const store = transaction.objectStore(this.options.storeName);
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = event => reject(event.target.error);
        });
      } else if (this.options.storageType === 'sessionStorage') {
        // 只清除apiCache_前缀的项
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key.startsWith('apiCache_')) {
            sessionStorage.removeItem(key);
          }
        }
      }
      
      this._log('已清除所有缓存');
      return true;
    } catch (error) {
      this._handleError('清除所有缓存失败', error);
      return false;
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Promise<Object>} 缓存统计信息
   */
  async getStats() {
    const memoryCount = this.memoryCache.size;
    let persistentCount = 0;
    
    try {
      if (this.options.storageType === 'indexedDB' && this.db) {
        const transaction = this.db.transaction([this.options.storeName], 'readonly');
        const store = transaction.objectStore(this.options.storeName);
        persistentCount = await new Promise((resolve) => {
          const countRequest = store.count();
          countRequest.onsuccess = () => resolve(countRequest.result);
          countRequest.onerror = () => resolve(0);
        });
      } else if (this.options.storageType === 'sessionStorage') {
        // 计算apiCache_前缀的项
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key.startsWith('apiCache_')) {
            persistentCount++;
          }
        }
      }
      
      return {
        memoryCount,
        persistentCount,
        storageType: this.options.storageType
      };
    } catch (error) {
      this._handleError('获取缓存统计失败', error);
      return {
        memoryCount,
        persistentCount: 0,
        storageType: this.options.storageType,
        error: error.message
      };
    }
  }

  /**
   * 销毁缓存实例
   */
  destroy() {
    // 清空内存缓存
    this.memoryCache.clear();
    
    // 关闭IndexedDB连接
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    this._log('API缓存实例已销毁');
  }
}

// 创建默认实例
let apiCacheInstance = null;

/**
 * 获取API缓存实例（单例模式）
 * @param {Object} [options] - 配置选项
 * @returns {ApiCache} API缓存实例
 */
function getApiCache(options) {
  if (!apiCacheInstance) {
    apiCacheInstance = new ApiCache(options);
  }
  return apiCacheInstance;
}

/**
 * 为fetch API创建拦截器
 * @param {ApiCache} cacheInstance - API缓存实例
 * @param {Object} [options] - 拦截器选项
 * @returns {Function} 增强的fetch函数
 */
function createFetchInterceptor(cacheInstance, options = {}) {
  const originalFetch = window.fetch;
  
  const defaultOptions = {
    enabled: true,
    methods: ['GET'],
    statusesToCache: [200],
    ttl: cacheInstance.options.expiration,
    ...options
  };
  
  window.fetch = async function(input, init = {}) {
    const request = new Request(input, init);
    const method = request.method.toUpperCase();
    
    // 只缓存指定的方法
    if (!defaultOptions.enabled || !defaultOptions.methods.includes(method)) {
      return originalFetch(input, init);
    }
    
    // 生成缓存键
    const cacheKey = cacheInstance._generateKey(request.url);
    
    // 尝试从缓存获取
    let cachedResponse = await cacheInstance.get(cacheKey);
    if (cachedResponse) {
      cacheInstance._log(`使用缓存的响应: ${request.url}`);
      return new Response(new Blob([JSON.stringify(cachedResponse)]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 执行原始请求
    const response = await originalFetch(input, init);
    
    // 只缓存成功的响应
    if (defaultOptions.statusesToCache.includes(response.status)) {
      // 克隆响应以便多次读取
      const clonedResponse = response.clone();
      
      try {
        const data = await clonedResponse.json();
        cacheInstance.set(cacheKey, data);
      } catch (error) {
        cacheInstance._handleError('缓存响应失败', error);
      }
    }
    
    return response;
  };
  
  return window.fetch;
}

/**
 * 为Axios创建拦截器
 * @param {ApiCache} cacheInstance - API缓存实例
 * @param {Object} axios - Axios实例
 * @param {Object} [options] - 拦截器选项
 * @returns {Object} 原始Axios实例
 */
function createAxiosInterceptor(cacheInstance, axios, options = {}) {
  const defaultOptions = {
    enabled: true,
    methods: ['get'],
    statusesToCache: [200],
    ttl: cacheInstance.options.expiration,
    ...options
  };
  
  // 请求拦截器
  axios.interceptors.request.use(async config => {
    if (!defaultOptions.enabled || !defaultOptions.methods.includes(config.method.toLowerCase())) {
      return config;
    }
    
    // 生成缓存键
    const cacheKey = cacheInstance._generateKey(
      config.url,
      { ...config.params, ...(config.data || {}) }
    );
    
    // 将缓存键保存到配置中，以便在响应拦截器中使用
    config._cacheKey = cacheKey;
    
    // 尝试从缓存获取
    const cachedResponse = await cacheInstance.get(cacheKey);
    if (cachedResponse) {
      cacheInstance._log(`使用缓存的响应: ${config.url}`);
      
      // 标记为已缓存
      config._cachedResponse = cachedResponse;
      
      // 设置用于取消请求的标记
      config.adapter = function(config) {
        return new Promise(resolve => {
          resolve({
            data: cachedResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config,
            request: {}
          });
        });
      };
    }
    
    return config;
  });
  
  // 响应拦截器
  axios.interceptors.response.use(response => {
    if (!defaultOptions.enabled || !defaultOptions.methods.includes(response.config.method.toLowerCase())) {
      return response;
    }
    
    // 只缓存成功的响应
    if (defaultOptions.statusesToCache.includes(response.status) && !response.config._cachedResponse) {
      const cacheKey = response.config._cacheKey;
      if (cacheKey) {
        cacheInstance.set(cacheKey, response.data);
      }
    }
    
    return response;
  });
  
  return axios;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ApiCache,
    getApiCache,
    createFetchInterceptor,
    createAxiosInterceptor
  };
} else {
  window.ApiCache = ApiCache;
  window.getApiCache = getApiCache;
  window.createFetchInterceptor = createFetchInterceptor;
  window.createAxiosInterceptor = createAxiosInterceptor;
} 