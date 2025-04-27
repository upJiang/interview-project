/**
 * 错误处理模块
 * 负责捕获和处理不同类型的前端错误
 */

import { normalizeError, getEnvironmentInfo, generateUUID } from '../utils/helpers';
import logger from '../utils/logger';

class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      // 错误过滤规则
      ignoreErrors: [],
      // 忽略的URL列表
      ignoreUrls: [],
      // 每分钟最大上报错误数量
      maxErrorsPerMinute: 10,
      // 上报钩子函数
      beforeSend: null,
      ...options
    };
    
    // 错误计数器
    this.errorCount = 0;
    // 上次重置时间
    this.lastResetTime = Date.now();
    
    // 调用者可以提供外部方法
    this.onErrorCaptured = null;
    
    // 已处理的错误标识(避免重复处理)
    this.handledErrors = new Set();
  }
  
  /**
   * 初始化全局错误处理器
   */
  setupGlobalHandlers() {
    // 1. 全局 JavaScript 错误
    this.setupWindowErrorHandler();
    
    // 2. Promise未处理的rejection
    this.setupUnhandledRejectionHandler();
    
    // 3. 监控console.error
    this.setupConsoleErrorHandler();
    
    // 4. 监控网络请求错误(XHR)
    this.setupXhrErrorHandler();
    
    // 5. 监控Fetch API错误
    this.setupFetchErrorHandler();
    
    logger.info('已设置全局错误捕获');
  }
  
  /**
   * 设置全局JS错误处理
   */
  setupWindowErrorHandler() {
    window.addEventListener('error', (event) => {
      // 区分JS错误和资源加载错误
      if (event.target && (event.target.nodeName === 'IMG' || 
                          event.target.nodeName === 'SCRIPT' || 
                          event.target.nodeName === 'LINK' || 
                          event.target.nodeName === 'AUDIO' || 
                          event.target.nodeName === 'VIDEO')) {
        this.handleResourceError(event);
      } else {
        this.handleJsError(event);
      }
    }, true);
  }
  
  /**
   * 设置未处理的Promise rejection处理器
   */
  setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
      this.handlePromiseError(event);
    });
  }
  
  /**
   * 监听控制台错误
   */
  setupConsoleErrorHandler() {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.handleConsoleError(args);
      originalConsoleError.apply(console, args);
    };
  }
  
  /**
   * 监控XHR请求错误
   */
  setupXhrErrorHandler() {
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;
    const self = this;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._errorHandlerData = {
        method,
        url,
        startTime: Date.now()
      };
      originalXhrOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
      if (this._errorHandlerData) {
        const xhr = this;
        
        xhr.addEventListener('error', function() {
          self.handleNetworkError({
            ...xhr._errorHandlerData,
            type: 'xhr',
            status: 0,
            duration: Date.now() - xhr._errorHandlerData.startTime,
            error: 'Network Error'
          });
        });
        
        xhr.addEventListener('timeout', function() {
          self.handleNetworkError({
            ...xhr._errorHandlerData,
            type: 'xhr',
            status: 0,
            duration: Date.now() - xhr._errorHandlerData.startTime,
            error: 'Timeout'
          });
        });
        
        xhr.addEventListener('load', function() {
          if (xhr.status >= 400) {
            self.handleNetworkError({
              ...xhr._errorHandlerData,
              type: 'xhr',
              status: xhr.status,
              duration: Date.now() - xhr._errorHandlerData.startTime,
              error: `HTTP ${xhr.status}`
            });
          }
        });
      }
      
      originalXhrSend.apply(this, arguments);
    };
  }
  
  /**
   * 监控Fetch API错误
   */
  setupFetchErrorHandler() {
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = function(input, init = {}) {
      const url = typeof input === 'string' ? input : input.url;
      const method = init.method || 'GET';
      const startTime = Date.now();
      
      return originalFetch.apply(this, arguments)
        .then(response => {
          if (!response.ok) {
            self.handleNetworkError({
              url,
              method,
              type: 'fetch',
              status: response.status,
              duration: Date.now() - startTime,
              error: `HTTP ${response.status}`
            });
          }
          return response;
        })
        .catch(error => {
          self.handleNetworkError({
            url,
            method,
            type: 'fetch',
            status: 0,
            duration: Date.now() - startTime,
            error: error.message || 'Fetch Error'
          });
          throw error;
        });
    };
  }
  
  /**
   * 处理JS错误
   * @param {ErrorEvent} event 错误事件
   */
  handleJsError(event) {
    const error = {
      message: event.message,
      stack: event.error?.stack,
      name: event.error?.name || 'Error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    };
    
    this.captureError({
      type: 'javascript',
      error,
      origin: 'window.onerror'
    });
  }
  
  /**
   * 处理资源加载错误
   * @param {ErrorEvent} event 错误事件
   */
  handleResourceError(event) {
    const target = event.target;
    const error = {
      message: `Failed to load ${target.nodeName.toLowerCase()}: ${target.src || target.href}`,
      source: target.src || target.href,
      tagName: target.nodeName.toLowerCase(),
      outerHTML: target.outerHTML?.substring(0, 200)
    };
    
    this.captureError({
      type: 'resource',
      error,
      origin: 'resource.onerror'
    });
  }
  
  /**
   * 处理Promise未处理的rejection
   * @param {PromiseRejectionEvent} event Promise拒绝事件
   */
  handlePromiseError(event) {
    let error = {
      message: 'Unhandled Promise Rejection'
    };
    
    if (event.reason instanceof Error) {
      error = {
        message: event.reason.message,
        stack: event.reason.stack,
        name: event.reason.name
      };
    } else {
      error.reason = String(event.reason);
    }
    
    this.captureError({
      type: 'promise',
      error,
      origin: 'unhandledrejection'
    });
  }
  
  /**
   * 处理控制台错误
   * @param {Array} args 控制台参数
   */
  handleConsoleError(args) {
    const error = {
      message: args.map(arg => {
        if (arg instanceof Error) {
          return arg.message;
        } else if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        } else {
          return String(arg);
        }
      }).join(' '),
      name: 'ConsoleError'
    };
    
    this.captureError({
      type: 'console',
      error,
      origin: 'console.error'
    });
  }
  
  /**
   * 处理网络错误
   * @param {Object} data 网络错误数据
   */
  handleNetworkError(data) {
    const error = {
      message: `${data.method} ${data.url} failed with status ${data.status}: ${data.error}`,
      ...data
    };
    
    this.captureError({
      type: 'network',
      error,
      origin: `${data.type}.error`
    });
  }
  
  /**
   * 捕获并处理错误
   * @param {Object} errorData 错误数据
   */
  captureError(errorData) {
    // 限制频率
    if (!this.shouldProcessError()) {
      logger.warn('错误上报频率限制，已忽略该错误');
      return null;
    }
    
    // 标准化错误
    const error = normalizeError(errorData.error);
    
    // 生成错误指纹
    const errorId = this.generateErrorId(error);
    
    // 检查是否已处理过该错误
    if (this.handledErrors.has(errorId)) {
      return null;
    }
    
    // 检查是否应该忽略该错误
    if (this.shouldIgnoreError(error)) {
      logger.debug('已忽略错误:', error.message);
      return null;
    }
    
    // 记录已处理的错误
    this.handledErrors.add(errorId);
    
    // 准备完整的错误事件
    const errorEvent = {
      id: errorId,
      timestamp: Date.now(),
      type: errorData.type,
      error,
      environment: getEnvironmentInfo(),
      url: window.location.href,
      origin: errorData.origin || 'manual'
    };
    
    // 执行beforeSend钩子
    if (typeof this.options.beforeSend === 'function') {
      try {
        const modifiedEvent = this.options.beforeSend(errorEvent, { originalError: errorData.error });
        if (modifiedEvent === null) {
          logger.debug('beforeSend钩子返回null，已取消上报');
          return null;
        }
        Object.assign(errorEvent, modifiedEvent);
      } catch (e) {
        logger.error('执行beforeSend钩子时发生错误', e);
      }
    }
    
    logger.info(`捕获到${errorEvent.type}错误:`, errorEvent.error.message);
    
    // 通知上层处理器
    if (typeof this.onErrorCaptured === 'function') {
      this.onErrorCaptured(errorEvent);
    }
    
    return errorEvent;
  }
  
  /**
   * 检查是否应该忽略错误
   * @param {Object} error 标准化的错误对象
   * @returns {boolean} 是否应该忽略
   */
  shouldIgnoreError(error) {
    const message = error.message || '';
    
    // 检查忽略列表
    for (const pattern of this.options.ignoreErrors) {
      if (typeof pattern === 'string') {
        if (message.includes(pattern)) {
          return true;
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(message)) {
          return true;
        }
      }
    }
    
    // 跨域脚本错误通常没有详细信息
    if (message === 'Script error.' || message === 'Script error') {
      return true;
    }
    
    return false;
  }
  
  /**
   * 是否应该处理当前错误(频率限制)
   * @returns {boolean}
   */
  shouldProcessError() {
    const now = Date.now();
    
    // 重置计数器(每分钟)
    if (now - this.lastResetTime > 60000) {
      this.errorCount = 0;
      this.lastResetTime = now;
    }
    
    if (this.errorCount >= this.options.maxErrorsPerMinute) {
      return false;
    }
    
    this.errorCount++;
    return true;
  }
  
  /**
   * 生成错误ID
   * @param {Object} error 错误对象
   * @returns {string} 错误ID
   */
  generateErrorId(error) {
    // 创建错误指纹
    const message = error.message || '';
    const stack = error.stack || '';
    const type = error.type || 'Error';
    
    // 使用错误信息前150个字符和堆栈前100个字符作为指纹
    const fingerprintSource = `${type}:${message.substring(0, 150)}:${stack.substring(0, 100)}`;
    
    // 简单哈希
    let hash = 0;
    for (let i = 0; i < fingerprintSource.length; i++) {
      hash = ((hash << 5) - hash) + fingerprintSource.charCodeAt(i);
      hash = hash & hash; // 转为32位整数
    }
    
    return `err_${Math.abs(hash).toString(16).padStart(8, '0')}_${generateUUID().substring(0, 8)}`;
  }
  
  /**
   * 手动上报错误
   * @param {Error|string|Object} error 错误对象
   * @param {Object} extraInfo 额外信息
   * @returns {string|null} 错误ID
   */
  reportError(error, extraInfo = {}) {
    if (!error) return null;
    
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const errorEvent = this.captureError({
      type: 'manual',
      error: errorObj,
      origin: 'user.report',
      ...extraInfo
    });
    
    return errorEvent ? errorEvent.id : null;
  }
}

export default ErrorHandler; 