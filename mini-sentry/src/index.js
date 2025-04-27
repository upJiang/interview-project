/**
 * Mini-Sentry SDK主入口
 * 简化版Sentry异常监控与埋点系统
 */

import MiniSentryClient from './core/client';
import { VERSION } from './version';

// 单例模式
let globalClient = null;

/**
 * MiniSentry SDK初始化
 * @param {Object} options 配置选项
 * @returns {MiniSentryClient} MiniSentry客户端实例
 */
export function init(options = {}) {
  if (globalClient) {
    console.warn('[MiniSentry] SDK已经初始化，请勿重复初始化');
    return globalClient;
  }

  const client = new MiniSentryClient(options);
  globalClient = client;
  
  // 初始化SDK
  client.init();
  
  return client;
}

/**
 * 获取当前实例，如果未初始化则返回null
 * @returns {MiniSentryClient|null} 客户端实例
 */
export function getCurrentClient() {
  return globalClient;
}

/**
 * 捕获异常
 * @param {Error} error 错误对象
 * @param {Object} context 上下文信息
 * @returns {string|null} 错误ID
 */
export function captureException(error, context = {}) {
  if (!globalClient) {
    console.warn('[MiniSentry] SDK未初始化，请先调用init()');
    return null;
  }
  
  return globalClient.captureException(error, context);
}

/**
 * 捕获消息
 * @param {string} message 消息内容
 * @param {string} level 日志级别 (debug, info, warning, error, critical)
 * @param {Object} context 上下文信息
 * @returns {string|null} 消息ID
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!globalClient) {
    console.warn('[MiniSentry] SDK未初始化，请先调用init()');
    return null;
  }
  
  return globalClient.captureMessage(message, level, context);
}

/**
 * 追踪自定义事件
 * @param {string} eventName 事件名称
 * @param {Object} properties 事件属性
 */
export function trackEvent(eventName, properties = {}) {
  if (!globalClient) {
    console.warn('[MiniSentry] SDK未初始化，请先调用init()');
    return;
  }
  
  globalClient.trackEvent(eventName, properties);
}

/**
 * 设置用户信息
 * @param {Object} user 用户信息
 */
export function setUser(user) {
  if (!globalClient) {
    console.warn('[MiniSentry] SDK未初始化，请先调用init()');
    return;
  }
  
  globalClient.setUser(user);
}

/**
 * 设置标签
 * @param {string} key 标签名
 * @param {string} value 标签值
 */
export function setTag(key, value) {
  if (!globalClient) {
    console.warn('[MiniSentry] SDK未初始化，请先调用init()');
    return;
  }
  
  globalClient.setTag(key, value);
}

/**
 * 设置附加信息
 * @param {string} key 附加信息名
 * @param {any} value 附加信息值
 */
export function setExtra(key, value) {
  if (!globalClient) {
    console.warn('[MiniSentry] SDK未初始化，请先调用init()');
    return;
  }
  
  globalClient.setExtra(key, value);
}

/**
 * 关闭SDK并立即上报所有数据
 */
export function close() {
  if (!globalClient) {
    console.warn('[MiniSentry] SDK未初始化，无需关闭');
    return;
  }
  
  globalClient.close();
  globalClient = null;
}

/**
 * 包装函数，自动捕获异常
 * @param {Function} fn 要包装的函数
 * @returns {Function} 包装后的函数
 */
export function wrap(fn) {
  if (typeof fn !== 'function') {
    return fn;
  }
  
  return function wrappedFunction() {
    try {
      return fn.apply(this, arguments);
    } catch (error) {
      captureException(error, { 
        extra: { 
          arguments: Array.from(arguments).map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ) 
        }
      });
      throw error;
    }
  };
}

/**
 * 错误边界组件(React)帮助方法
 * @param {Error} error 错误对象
 * @param {Object} componentStack 组件堆栈
 */
export function withErrorBoundary(error, componentStack) {
  if (!globalClient) {
    console.warn('[MiniSentry] SDK未初始化，请先调用init()');
    return;
  }
  
  return globalClient.captureException(error, {
    extra: { componentStack }
  });
}

// 导出版本信息
export { VERSION };

// 创建默认导出
const MiniSentry = {
  init,
  captureException,
  captureMessage,
  trackEvent,
  setUser,
  setTag,
  setExtra,
  close,
  wrap,
  withErrorBoundary,
  VERSION
};

// 自动初始化(如果有脚本标签data-auto-init属性)
if (typeof document !== 'undefined') {
  const scripts = document.querySelectorAll('script[data-mini-sentry]');
  for (const script of scripts) {
    if (script.getAttribute('data-auto-init') === 'true') {
      try {
        const options = JSON.parse(script.getAttribute('data-options') || '{}');
        init(options);
      } catch (e) {
        console.error('[MiniSentry] 自动初始化失败:', e);
      }
    }
  }
}

export default MiniSentry; 