/**
 * api-merge.js
 * API请求合并工具，减少首屏渲染时的网络请求数量
 */

class ApiMerger {
  /**
   * 创建API合并实例
   * @param {Object} options - 配置选项
   * @param {string} options.mergeEndpoint - 合并请求的端点URL
   * @param {number} options.batchDelay - 批次延迟时间（毫秒），默认为100ms
   * @param {number} options.maxBatchSize - 单次批处理的最大请求数，默认为10
   * @param {Function} options.errorHandler - 错误处理函数
   * @param {Function} options.requestIdGenerator - 请求ID生成函数
   * @param {Function} options.beforeRequestHook - 请求前钩子函数
   * @param {Function} options.afterResponseHook - 响应后钩子函数
   * @param {Object} options.headers - 请求头
   * @param {boolean} options.credentials - 是否发送凭据
   * @param {string} options.mode - 请求模式
   */
  constructor(options = {}) {
    // 默认配置
    this.options = {
      mergeEndpoint: '/api/batch',
      batchDelay: 100,
      maxBatchSize: 10,
      errorHandler: null,
      requestIdGenerator: () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      beforeRequestHook: null,
      afterResponseHook: null,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      mode: 'cors',
      ...options
    };

    // 请求队列
    this.requestQueue = [];
    
    // 请求映射（ID到Promise的映射）
    this.requestMap = new Map();
    
    // 批处理计时器
    this.batchTimer = null;
    
    // 请求计数器
    this.requestCounter = 0;
    
    // 性能统计
    this.stats = {
      totalRequests: 0,
      totalBatches: 0,
      savedRequests: 0,
      totalTime: 0,
      batchSizes: [],
      errors: 0
    };
  }

  /**
   * 发送合并请求
   * @param {string} url - API端点
   * @param {Object} options - 请求选项
   * @returns {Promise} 包含响应的Promise
   */
  request(url, options = {}) {
    // 增加请求计数器
    this.stats.totalRequests++;
    
    // 生成请求ID
    const requestId = this.options.requestIdGenerator();
    
    // 创建请求对象
    const request = {
      id: requestId,
      path: url,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null,
      params: options.params || {}
    };
    
    // 创建Promise并存储resolve和reject函数
    const requestPromise = new Promise((resolve, reject) => {
      request.resolve = resolve;
      request.reject = reject;
    });
    
    // 存储到请求映射中
    this.requestMap.set(requestId, request);
    
    // 添加到请求队列
    this.requestQueue.push(request);
    
    // 如果没有批处理计时器，启动一个
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this._processBatch(), this.options.batchDelay);
    }
    
    return requestPromise;
  }

  /**
   * 处理批量请求
   * @private
   */
  _processBatch() {
    // 清除计时器
    this.batchTimer = null;
    
    // 如果队列为空，直接返回
    if (this.requestQueue.length === 0) {
      return;
    }
    
    // 从队列中取出请求（不超过最大批次大小）
    const batch = this.requestQueue.splice(0, this.options.maxBatchSize);
    
    // 如果队列中还有请求，启动下一个批处理计时器
    if (this.requestQueue.length > 0) {
      this.batchTimer = setTimeout(() => this._processBatch(), this.options.batchDelay);
    }
    
    // 更新统计信息
    this.stats.totalBatches++;
    this.stats.batchSizes.push(batch.length);
    this.stats.savedRequests += batch.length - 1; // 减少的请求数（总请求数-1）
    
    // 批处理开始时间
    const batchStartTime = performance.now();
    
    // 调用钩子函数
    if (typeof this.options.beforeRequestHook === 'function') {
      batch.forEach(request => {
        this.options.beforeRequestHook(request);
      });
    }
    
    // 准备批处理请求体
    const batchBody = batch.map(request => ({
      id: request.id,
      path: request.path,
      method: request.method,
      headers: request.headers,
      body: request.body,
      params: request.params
    }));
    
    // 发送批处理请求
    this._sendBatchRequest(batchBody, batch)
      .catch(error => {
        // 更新统计信息
        this.stats.errors++;
        
        // 拒绝所有请求
        batch.forEach(request => {
          request.reject(error);
        });
        
        // 错误处理
        if (typeof this.options.errorHandler === 'function') {
          this.options.errorHandler(error, batch);
        }
      })
      .finally(() => {
        // 更新总时间
        this.stats.totalTime += performance.now() - batchStartTime;
        
        // 从请求映射中删除已处理的请求
        batch.forEach(request => {
          this.requestMap.delete(request.id);
        });
      });
  }

  /**
   * 发送批处理请求
   * @param {Array} batchBody - 批处理请求体
   * @param {Array} batch - 原始请求对象数组
   * @returns {Promise} 包含响应的Promise
   * @private
   */
  async _sendBatchRequest(batchBody, batch) {
    try {
      // 发送请求
      const response = await fetch(this.options.mergeEndpoint, {
        method: 'POST',
        headers: this.options.headers,
        body: JSON.stringify(batchBody),
        credentials: this.options.credentials,
        mode: this.options.mode
      });
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`批处理请求失败: ${response.status} ${response.statusText}`);
      }
      
      // 解析响应
      const batchResponse = await response.json();
      
      // 确保响应是一个数组
      if (!Array.isArray(batchResponse)) {
        throw new Error('批处理响应格式不正确，预期为数组');
      }
      
      // 处理每个响应
      batchResponse.forEach(singleResponse => {
        // 查找对应的请求
        const request = batch.find(req => req.id === singleResponse.id);
        
        if (!request) {
          console.warn(`找不到ID为${singleResponse.id}的请求`);
          return;
        }
        
        // 调用钩子函数
        if (typeof this.options.afterResponseHook === 'function') {
          this.options.afterResponseHook(singleResponse, request);
        }
        
        // 根据响应状态解析或拒绝Promise
        if (singleResponse.error) {
          request.reject(singleResponse.error);
        } else {
          request.resolve(singleResponse.data);
        }
      });
      
      // 检查是否有未处理的请求
      const handledIds = batchResponse.map(res => res.id);
      const unhandledRequests = batch.filter(req => !handledIds.includes(req.id));
      
      // 拒绝未处理的请求
      unhandledRequests.forEach(request => {
        request.reject(new Error('服务器未返回该请求的响应'));
      });
      
    } catch (error) {
      // 将错误向上传播
      throw error;
    }
  }

  /**
   * 发起GET请求
   * @param {string} url - API端点
   * @param {Object} params - 查询参数
   * @param {Object} options - 其他请求选项
   * @returns {Promise} 包含响应的Promise
   */
  get(url, params = {}, options = {}) {
    return this.request(url, {
      method: 'GET',
      params,
      ...options
    });
  }

  /**
   * 发起POST请求
   * @param {string} url - API端点
   * @param {Object} body - 请求体
   * @param {Object} options - 其他请求选项
   * @returns {Promise} 包含响应的Promise
   */
  post(url, body = {}, options = {}) {
    return this.request(url, {
      method: 'POST',
      body,
      ...options
    });
  }

  /**
   * 发起PUT请求
   * @param {string} url - API端点
   * @param {Object} body - 请求体
   * @param {Object} options - 其他请求选项
   * @returns {Promise} 包含响应的Promise
   */
  put(url, body = {}, options = {}) {
    return this.request(url, {
      method: 'PUT',
      body,
      ...options
    });
  }

  /**
   * 发起DELETE请求
   * @param {string} url - API端点
   * @param {Object} options - 其他请求选项
   * @returns {Promise} 包含响应的Promise
   */
  delete(url, options = {}) {
    return this.request(url, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * 立即执行所有排队的请求
   * @returns {Promise} 所有请求完成的Promise
   */
  flush() {
    // 取消之前的计时器
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // 处理所有排队的请求
    while (this.requestQueue.length > 0) {
      this._processBatch();
    }
    
    // 返回所有挂起请求的Promise
    const pendingRequests = Array.from(this.requestMap.values()).map(request => 
      new Promise((resolve) => {
        const originalResolve = request.resolve;
        request.resolve = (value) => {
          originalResolve(value);
          resolve();
        };
      })
    );
    
    return Promise.all(pendingRequests);
  }

  /**
   * 取消所有排队的请求
   * @param {string} reason - 取消原因
   */
  cancelAll(reason = 'User cancelled') {
    // 取消计时器
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // 拒绝所有排队的请求
    this.requestQueue.forEach(request => {
      request.reject(new Error(reason));
    });
    
    // 清空队列
    this.requestQueue = [];
  }

  /**
   * 获取性能统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const { totalRequests, totalBatches, savedRequests, totalTime, batchSizes, errors } = this.stats;
    
    // 计算平均批次大小
    const avgBatchSize = batchSizes.length > 0
      ? batchSizes.reduce((sum, size) => sum + size, 0) / batchSizes.length
      : 0;
    
    // 计算节省的请求比例
    const savedRequestsPercent = totalRequests > 0
      ? (savedRequests / totalRequests) * 100
      : 0;
    
    return {
      totalRequests,
      totalBatches,
      savedRequests,
      savedRequestsPercent: `${Math.round(savedRequestsPercent)}%`,
      avgBatchSize: Math.round(avgBatchSize * 100) / 100,
      totalTime: `${Math.round(totalTime)}ms`,
      avgTimePerRequest: totalRequests > 0
        ? `${Math.round(totalTime / totalRequests)}ms`
        : '0ms',
      errors,
      currentQueueSize: this.requestQueue.length
    };
  }

  /**
   * 重置性能统计
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      totalBatches: 0,
      savedRequests: 0,
      totalTime: 0,
      batchSizes: [],
      errors: 0
    };
  }
}

// 单例模式：创建一个默认实例
let defaultInstance = null;

/**
 * 获取ApiMerger的默认实例
 * @param {Object} options - 配置选项
 * @returns {ApiMerger} ApiMerger实例
 */
function getApiMerger(options = {}) {
  if (!defaultInstance) {
    defaultInstance = new ApiMerger(options);
  }
  return defaultInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ApiMerger,
    getApiMerger
  };
} else {
  window.ApiMerger = ApiMerger;
  window.getApiMerger = getApiMerger;
} 