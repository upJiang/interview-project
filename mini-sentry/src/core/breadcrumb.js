/**
 * 面包屑追踪模块
 * 用于跟踪和记录用户操作，提供错误发生时的上下文信息
 */

import { getTimestamp, truncate } from '../utils/helpers';
import logger from '../utils/logger';

class Breadcrumb {
  constructor(options = {}) {
    this.options = {
      maxBreadcrumbs: 50,
      beforeBreadcrumb: null,
      ...options
    };
    
    // 面包屑队列
    this.breadcrumbs = [];
  }
  
  /**
   * 添加一条面包屑记录
   * @param {Object} breadcrumb 面包屑数据
   * @param {Object} hint 额外提示信息
   * @returns {Object} 面包屑对象
   */
  add(breadcrumb, hint = {}) {
    // 标准面包屑对象
    const normalizedBreadcrumb = {
      // 时间戳
      timestamp: getTimestamp(),
      // 类别: 'user', 'http', 'navigation', 'ui.click', 'console', 'error'
      category: breadcrumb.category || 'default',
      // 级别: 'info', 'warning', 'error'
      level: breadcrumb.level || 'info',
      // 消息内容
      message: truncate(breadcrumb.message || '', 300),
      // 事件类型
      type: breadcrumb.type,
      // 数据
      data: breadcrumb.data || {}
    };
    
    // 应用自定义过滤器
    if (typeof this.options.beforeBreadcrumb === 'function') {
      try {
        const modifiedBreadcrumb = this.options.beforeBreadcrumb(normalizedBreadcrumb, hint);
        // 如果返回null，表示不记录该面包屑
        if (modifiedBreadcrumb === null) {
          return null;
        }
        // 使用修改后的面包屑
        Object.assign(normalizedBreadcrumb, modifiedBreadcrumb);
      } catch (error) {
        logger.error('执行beforeBreadcrumb钩子时发生错误', error);
      }
    }
    
    // 添加到列表
    this.breadcrumbs.unshift(normalizedBreadcrumb);
    
    // 限制面包屑数量
    if (this.breadcrumbs.length > this.options.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(0, this.options.maxBreadcrumbs);
    }
    
    logger.debug(`添加面包屑: ${normalizedBreadcrumb.category} - ${normalizedBreadcrumb.message}`);
    return normalizedBreadcrumb;
  }
  
  /**
   * 获取所有面包屑记录
   * @returns {Array} 面包屑数组
   */
  getAll() {
    return [...this.breadcrumbs];
  }
  
  /**
   * 清空面包屑
   */
  clear() {
    this.breadcrumbs = [];
    logger.debug('已清空所有面包屑');
  }
  
  /**
   * 记录DOM点击事件
   * @param {Event} event DOM事件对象
   */
  captureDOMEvent(event) {
    if (!event || !event.target) return;
    
    const target = event.target;
    const tagName = target.tagName.toLowerCase();
    
    // 提取元素信息，但避免过多信息
    const elementInfo = {
      tagName,
      id: target.id || null,
      className: target.className || null,
      type: target.type || null
    };
    
    // 根据元素类型添加特定信息
    if (tagName === 'a') {
      elementInfo.href = target.href;
      elementInfo.text = truncate(target.innerText, 50);
    } else if (tagName === 'button') {
      elementInfo.text = truncate(target.innerText, 50);
    } else if (['input', 'select', 'textarea'].includes(tagName)) {
      // 对于表单元素，记录类型但不记录具体内容（保护隐私）
      elementInfo.name = target.name || null;
      
      // 对于checkbox和radio记录选中状态
      if (target.type === 'checkbox' || target.type === 'radio') {
        elementInfo.checked = target.checked;
      }
    }
    
    this.add({
      category: 'ui.click',
      type: 'user',
      message: `Clicked ${tagName}${target.id ? `#${target.id}` : ''}`,
      data: elementInfo
    });
  }
  
  /**
   * 记录页面导航事件
   * @param {string} from 来源URL
   * @param {string} to 目标URL
   */
  captureNavigation(from, to) {
    this.add({
      category: 'navigation',
      type: 'navigation',
      message: `Page navigation: ${from} → ${to}`,
      data: { from, to }
    });
  }
  
  /**
   * 记录HTTP请求
   * @param {Object} requestInfo HTTP请求信息
   */
  captureHttpRequest(requestInfo) {
    const { method, url, status, duration } = requestInfo;
    
    this.add({
      category: 'http',
      type: 'http',
      message: `${method} ${url} [${status}] - ${duration}ms`,
      data: requestInfo
    });
  }
  
  /**
   * 记录控制台日志
   * @param {string} level 日志级别
   * @param {Array} args 日志参数
   */
  captureConsole(level, args) {
    // 转换控制台参数为字符串
    const message = args.map(arg => {
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
    }).join(' ');
    
    this.add({
      category: 'console',
      level: level === 'error' ? 'error' : (level === 'warn' ? 'warning' : 'info'),
      type: 'console',
      message: truncate(message, 300),
      data: { level }
    });
  }
  
  /**
   * 记录自定义事件
   * @param {string} name 事件名称
   * @param {Object} data 事件数据
   */
  captureEvent(name, data = {}) {
    this.add({
      category: 'custom',
      type: 'info',
      message: name,
      data
    });
  }
}

export default Breadcrumb; 