/**
 * MiniSentry客户端核心
 * 集成错误处理、埋点追踪、数据上报等功能
 */

import DEFAULT_CONFIG from '../config';
import ErrorHandler from './error-handler';
import Breadcrumb from './breadcrumb';
import Tracker from './tracker';
import Transport from '../utils/transport';
import logger from '../utils/logger';
import { getEnvironmentInfo, generateUUID } from '../utils/helpers';

class MiniSentryClient {
  constructor(options = {}) {
    // 合并配置
    this.options = {
      ...DEFAULT_CONFIG,
      ...options
    };
    
    // 设置日志级别
    logger.setLevel(this.options.debug ? 'debug' : this.options.logLevel);
    
    // 实例化各个模块
    this.transport = new Transport({
      endpoint: this.options.apiUrl,
      useBeacon: this.options.reportAsBeacon,
      method: this.options.reportMethod,
      timeout: this.options.reportTimeout
    });
    
    this.breadcrumb = new Breadcrumb({
      maxBreadcrumbs: this.options.maxBreadcrumbs,
      beforeBreadcrumb: this.options.beforeBreadcrumb
    });
    
    this.errorHandler = new ErrorHandler({
      ignoreErrors: this.options.ignoreErrors,
      ignoreUrls: this.options.ignoreUrls,
      maxErrorsPerMinute: this.options.maxErrorsPerMinute,
      beforeSend: this.options.beforeSend
    });
    
    this.tracker = new Tracker({
      appId: this.options.appId,
      autoTrackPV: true,
      autoTrackClick: true,
      batchReport: true
    });
    
    // 设置错误捕获后的处理
    this.errorHandler.onErrorCaptured = this.handleErrorCaptured.bind(this);
    
    // 设置埋点上报回调
    this.tracker.onReport = this.handleTrackerReport.bind(this);
    
    // 当前会话信息
    this.sessionId = generateUUID();
    this.lastHeartbeat = Date.now();
    
    // 上下文信息
    this.context = {
      user: null,
      tags: {},
      extra: {}
    };
    
    // 是否已初始化
    this.initialized = false;
  }
  
  /**
   * 初始化MiniSentry
   * @returns {MiniSentryClient} 当前实例
   */
  init() {
    if (this.initialized) {
      logger.warn('MiniSentry已经初始化过，请勿重复初始化');
      return this;
    }
    
    // 采样决策
    if (Math.random() >= this.options.sampleRate) {
      logger.info('根据采样率配置，当前会话不采集数据');
      return this;
    }
    
    // 设置全局错误处理器
    this.errorHandler.setupGlobalHandlers();
    
    // 初始化埋点
    this.tracker.init();
    
    // 设置面包屑自动收集
    this.setupBreadcrumbCollection();
    
    // 发送初始化事件
    this.captureMessage('SDK Initialized', 'info', {
      sdkName: 'mini-sentry',
      version: '1.0.0'
    });
    
    this.initialized = true;
    logger.info('MiniSentry初始化完成');
    
    return this;
  }
  
  /**
   * 设置面包屑收集
   */
  setupBreadcrumbCollection() {
    // 收集点击事件面包屑
    document.addEventListener('click', (event) => {
      this.breadcrumb.captureDOMEvent(event);
    }, true);
    
    // 收集页面导航事件
    window.addEventListener('popstate', () => {
      this.breadcrumb.captureNavigation(document.referrer, window.location.href);
    });
    
    // 监听XHR请求
    this.setupXhrBreadcrumbs();
    
    // 监听控制台输出
    this.setupConsoleBreadcrumbs();
    
    // 发送会话心跳
    setInterval(() => {
      if (Date.now() - this.lastHeartbeat > 30000) { // 30秒
        this.lastHeartbeat = Date.now();
        this.sendSessionHeartbeat();
      }
    }, 30000);
  }
  
  /**
   * 设置XHR请求面包屑
   */
  setupXhrBreadcrumbs() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const self = this;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._breadcrumbData = {
        method,
        url,
        startTime: Date.now()
      };
      originalOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
      if (this._breadcrumbData) {
        const xhr = this;
        
        xhr.addEventListener('load', function() {
          const duration = Date.now() - xhr._breadcrumbData.startTime;
          self.breadcrumb.captureHttpRequest({
            ...xhr._breadcrumbData,
            status: xhr.status,
            duration
          });
        });
      }
      
      originalSend.apply(this, arguments);
    };
  }
  
  /**
   * 设置控制台输出面包屑
   */
  setupConsoleBreadcrumbs() {
    const consoleMethodsToTrack = ['error', 'warn', 'info', 'debug'];
    
    for (const method of consoleMethodsToTrack) {
      const originalMethod = console[method];
      
      console[method] = (...args) => {
        this.breadcrumb.captureConsole(method, args);
        originalMethod.apply(console, args);
      };
    }
  }
  
  /**
   * 发送会话心跳
   */
  sendSessionHeartbeat() {
    if (!this.initialized) return;
    
    this.transport.enqueue({
      type: 'session',
      sessionId: this.sessionId,
      timestamp: Date.now(),
      status: 'ok',
      appId: this.options.appId,
      release: this.options.release,
      environment: this.options.environment,
      user: this.context.user?.id
    });
  }
  
  /**
   * 处理错误捕获
   * @param {Object} errorEvent 错误事件
   */
  handleErrorCaptured(errorEvent) {
    if (!this.initialized) return;
    
    // 添加面包屑
    this.breadcrumb.add({
      category: 'error',
      level: 'error',
      message: errorEvent.error.message,
      data: {
        errorType: errorEvent.type,
        stackTrace: errorEvent.error.stack
      }
    });
    
    // 附加当前面包屑
    errorEvent.breadcrumbs = this.breadcrumb.getAll();
    
    // 附加上下文信息
    errorEvent.context = {
      ...this.context,
      ...errorEvent.context
    };
    
    // 上报错误
    this.transport.enqueue({
      type: 'error',
      ...errorEvent,
      timestamp: Date.now(),
      appId: this.options.appId,
      release: this.options.release,
      environment: this.options.environment
    });
  }
  
  /**
   * 处理埋点上报
   * @param {Array} events 埋点事件数组
   * @param {boolean} useBeacon 是否使用Beacon API
   */
  handleTrackerReport(events, useBeacon = false) {
    if (!this.initialized) return;
    
    // 添加上下文信息
    const eventsWithContext = events.map(event => ({
      ...event,
      context: this.context,
      release: this.options.release,
      environment: this.options.environment
    }));
    
    // 上报数据
    this.transport.enqueue({
      type: 'track',
      events: eventsWithContext,
      batch: true,
      timestamp: Date.now(),
      appId: this.options.appId
    }, { useBeacon });
  }
  
  /**
   * 手动捕获并上报错误
   * @param {Error} error 错误对象
   * @param {Object} context 附加上下文
   * @returns {string|null} 错误ID
   */
  captureException(error, context = {}) {
    if (!error) return null;
    
    const errorId = this.errorHandler.reportError(error, {
      context: {
        ...this.context,
        ...context
      }
    });
    
    return errorId;
  }
  
  /**
   * 捕获并上报消息
   * @param {string} message 消息内容
   * @param {string} level 日志级别 (debug, info, warning, error, critical)
   * @param {Object} context 附加上下文
   * @returns {string} 消息ID
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.initialized) return null;
    
    const messageId = generateUUID();
    
    // 添加面包屑
    this.breadcrumb.add({
      category: 'console',
      level,
      message,
      data: context
    });
    
    // 上报消息
    this.transport.enqueue({
      type: 'message',
      id: messageId,
      message,
      level,
      context: {
        ...this.context,
        ...context
      },
      breadcrumbs: this.breadcrumb.getAll(),
      timestamp: Date.now(),
      environment: this.options.environment,
      release: this.options.release,
      appId: this.options.appId,
      url: window.location.href
    });
    
    return messageId;
  }
  
  /**
   * 设置全局上下文附加信息
   * @param {Object} data 附加数据
   * @returns {MiniSentryClient} 当前实例
   */
  setExtra(key, value) {
    this.context.extra[key] = value;
    return this;
  }
  
  /**
   * 设置全局标签
   * @param {string} key 标签名
   * @param {string} value 标签值
   * @returns {MiniSentryClient} 当前实例
   */
  setTag(key, value) {
    this.context.tags[key] = value;
    return this;
  }
  
  /**
   * 设置用户信息
   * @param {Object} user 用户信息对象
   * @returns {MiniSentryClient} 当前实例
   */
  setUser(user) {
    this.context.user = user;
    
    // 同步到埋点系统
    if (user && user.id) {
      this.tracker.setUser(user.id, user);
    }
    
    return this;
  }
  
  /**
   * 追踪自定义事件
   * @param {string} eventName 事件名称
   * @param {Object} properties 事件属性
   * @returns {MiniSentryClient} 当前实例
   */
  trackEvent(eventName, properties = {}) {
    if (!this.initialized) return this;
    
    this.tracker.trackEvent(eventName, properties);
    return this;
  }
  
  /**
   * 清空面包屑
   * @returns {MiniSentryClient} 当前实例
   */
  clearBreadcrumbs() {
    this.breadcrumb.clear();
    return this;
  }
  
  /**
   * 获取上下文数据
   * @returns {Object} 上下文数据
   */
  getContext() {
    return { ...this.context };
  }
  
  /**
   * 主动关闭会话并发送数据
   */
  close() {
    if (!this.initialized) return;
    
    // 发送最后的队列数据
    this.transport.flush();
    
    logger.info('MiniSentry会话已关闭');
  }
}

export default MiniSentryClient; 