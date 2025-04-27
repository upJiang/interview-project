/**
 * 埋点追踪模块
 * 用于收集用户行为和业务事件数据
 */

import { generateUUID, getTimestamp, throttle } from '../utils/helpers';
import logger from '../utils/logger';

class Tracker {
  constructor(options = {}) {
    this.options = {
      // 应用ID
      appId: 'defaultApp',
      // 自动上报PV/UV
      autoTrackPV: true,
      // 是否自动追踪点击
      autoTrackClick: true,
      // 自动点击埋点选择器(支持属性选择器如[data-track])
      clickSelectors: ['[data-track]', 'a', 'button'],
      // 是否追踪页面停留时间
      trackDuration: true,
      // 点击事件节流阈值
      clickThrottle: 300, // ms
      // 是否合并批量上报
      batchReport: true,
      // 批量上报最大等待时间
      batchWaitTime: 1000, // ms
      // 批量上报最大事件数量
      batchMaxSize: 10,
      // 自定义数据处理器
      beforeReport: null, // (event) => event
      ...options
    };
    
    // 批量上报队列
    this.reportQueue = [];
    // 定时上报Timer
    this.batchTimer = null;
    // 页面停留时间统计
    this.pageEnterTime = Date.now();
    this.pageUrl = window.location.href;
    this.pageTitle = document.title;
    // 会话ID
    this.sessionId = this.getSessionId();
    // 节流后的点击处理函数
    this.throttledHandleClick = throttle(this.handleClick.bind(this), this.options.clickThrottle);
    
    // 缓存用户ID和设备ID
    this.deviceId = this.getDeviceId();
    this.userId = null;
    
    // 回调函数
    this.onReport = null;
  }
  
  /**
   * 初始化埋点系统
   */
  init() {
    if (this.options.autoTrackPV) {
      this.trackPageView();
    }
    
    if (this.options.autoTrackClick) {
      this.setupClickTracking();
    }
    
    if (this.options.trackDuration) {
      this.setupDurationTracking();
    }
    
    logger.info('埋点追踪系统已初始化');
    return this;
  }
  
  /**
   * 获取或创建会话ID
   * @returns {string} 会话ID
   */
  getSessionId() {
    let sessionId = localStorage.getItem('mini_sentry_session_id');
    const timestamp = localStorage.getItem('mini_sentry_session_time');
    const now = Date.now();
    
    // 会话超过30分钟或不存在则创建新会话
    if (!sessionId || !timestamp || now - parseInt(timestamp, 10) > 30 * 60 * 1000) {
      sessionId = generateUUID();
      localStorage.setItem('mini_sentry_session_id', sessionId);
    }
    
    // 更新会话时间
    localStorage.setItem('mini_sentry_session_time', String(now));
    return sessionId;
  }
  
  /**
   * 获取或创建设备ID
   * @returns {string} 设备ID
   */
  getDeviceId() {
    let deviceId = localStorage.getItem('mini_sentry_device_id');
    if (!deviceId) {
      deviceId = generateUUID();
      localStorage.setItem('mini_sentry_device_id', deviceId);
    }
    return deviceId;
  }
  
  /**
   * 设置用户ID
   * @param {string} userId 用户ID
   * @param {Object} properties 用户属性
   */
  setUser(userId, properties = {}) {
    this.userId = userId;
    
    // 存储用户ID
    if (userId) {
      localStorage.setItem('mini_sentry_user_id', userId);
      
      // 上报用户设置事件
      this.trackEvent('user_set', {
        userId,
        ...properties
      });
    } else {
      localStorage.removeItem('mini_sentry_user_id');
    }
    
    return this;
  }
  
  /**
   * 设置点击追踪
   */
  setupClickTracking() {
    document.addEventListener('click', (event) => {
      this.throttledHandleClick(event);
    }, true);
  }
  
  /**
   * 设置页面停留时间追踪
   */
  setupDurationTracking() {
    // 页面离开时上报停留时间
    window.addEventListener('beforeunload', () => {
      const duration = Date.now() - this.pageEnterTime;
      this.trackEvent('page_leave', {
        url: this.pageUrl,
        title: this.pageTitle,
        duration,
        durationSeconds: Math.floor(duration / 1000)
      });
      
      // 立即上报
      this.flushQueue(true);
    });
    
    // 页面可见性变化时记录
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        const duration = Date.now() - this.pageEnterTime;
        this.trackEvent('page_hide', {
          url: this.pageUrl,
          title: this.pageTitle,
          duration,
          durationSeconds: Math.floor(duration / 1000)
        });
        
        // 立即上报
        this.flushQueue(true);
      } else if (document.visibilityState === 'visible') {
        // 重置计时
        this.pageEnterTime = Date.now();
        this.trackEvent('page_visible', {
          url: this.pageUrl,
          title: this.pageTitle
        });
      }
    });
    
    // 处理单页应用路由变化
    let lastUrl = window.location.href;
    const handleRouteChange = () => {
      if (lastUrl !== window.location.href) {
        // 记录上一个页面停留时间
        const duration = Date.now() - this.pageEnterTime;
        this.trackEvent('page_change', {
          from: lastUrl,
          to: window.location.href,
          duration,
          durationSeconds: Math.floor(duration / 1000)
        });
        
        // 更新当前页面信息并记录PV
        lastUrl = window.location.href;
        this.pageUrl = lastUrl;
        this.pageTitle = document.title;
        this.pageEnterTime = Date.now();
        
        if (this.options.autoTrackPV) {
          this.trackPageView();
        }
      }
    };
    
    // 监听popstate和hashchange事件
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    
    // hack pushState和replaceState
    const originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      handleRouteChange();
    };
    
    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      handleRouteChange();
    };
  }
  
  /**
   * 处理元素点击事件
   * @param {Event} event 点击事件
   */
  handleClick(event) {
    if (!event || !event.target) return;
    
    // 尝试找到符合埋点选择器的元素
    let trackElement = null;
    let trackData = null;
    
    // 向上遍历DOM树找到最近的匹配元素
    let element = event.target;
    const selectors = this.options.clickSelectors;
    
    while (element && element !== document) {
      for (const selector of selectors) {
        if (element.matches(selector)) {
          trackElement = element;
          
          // 尝试获取埋点数据
          if (element.dataset && element.dataset.track) {
            try {
              trackData = JSON.parse(element.dataset.track);
            } catch (e) {
              // 如果不是JSON，就当作事件名称
              trackData = { event: element.dataset.track };
            }
          }
          break;
        }
      }
      
      if (trackElement) break;
      element = element.parentElement;
    }
    
    if (!trackElement) return;
    
    // 准备点击事件数据
    const elementInfo = {
      tagName: trackElement.tagName.toLowerCase(),
      id: trackElement.id || null,
      className: trackElement.className || null,
      type: trackElement.type || null,
      name: trackElement.name || null,
      value: trackElement.type === 'password' ? undefined : trackElement.value,
      href: trackElement.href || null,
      text: trackElement.innerText ? trackElement.innerText.substring(0, 50) : null
    };
    
    // 上报点击事件
    this.trackEvent(trackData?.event || 'element_click', {
      ...elementInfo,
      ...trackData,
      x: event.clientX,
      y: event.clientY,
      path: this.getElementPath(trackElement)
    });
  }
  
  /**
   * 获取元素的DOM路径
   * @param {Element} element DOM元素
   * @returns {string} 元素路径
   */
  getElementPath(element) {
    if (!element) return '';
    
    const path = [];
    let current = element;
    
    while (current && current !== document.body && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        selector += `.${Array.from(current.classList).join('.')}`;
      }
      
      path.unshift(selector);
      current = current.parentElement;
      
      // 限制路径长度
      if (path.length >= 5) break;
    }
    
    return path.join(' > ');
  }
  
  /**
   * 追踪页面浏览事件
   * @param {Object} properties 自定义属性
   */
  trackPageView(properties = {}) {
    const pv = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: getTimestamp(),
      ...properties
    };
    
    this.trackEvent('page_view', pv);
    return this;
  }
  
  /**
   * 追踪自定义事件
   * @param {string} eventName 事件名称
   * @param {Object} properties 事件属性
   */
  trackEvent(eventName, properties = {}) {
    if (!eventName) {
      logger.warn('事件名称不能为空');
      return this;
    }
    
    // 标准化事件
    const event = {
      id: generateUUID(),
      name: eventName,
      timestamp: getTimestamp(),
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      userId: this.userId || localStorage.getItem('mini_sentry_user_id') || null,
      appId: this.options.appId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      properties
    };
    
    // 执行自定义处理
    let finalEvent = event;
    if (typeof this.options.beforeReport === 'function') {
      try {
        const modifiedEvent = this.options.beforeReport(event);
        if (modifiedEvent === null) {
          logger.debug('埋点事件被过滤:', eventName);
          return this;
        }
        finalEvent = modifiedEvent;
      } catch (e) {
        logger.error('执行beforeReport钩子时发生错误', e);
      }
    }
    
    logger.debug(`埋点事件: ${eventName}`, finalEvent.properties);
    
    // 批量上报或立即上报
    if (this.options.batchReport) {
      this.addToReportQueue(finalEvent);
    } else {
      this.reportEvent(finalEvent);
    }
    
    return this;
  }
  
  /**
   * 添加事件到上报队列
   * @param {Object} event 事件对象
   */
  addToReportQueue(event) {
    this.reportQueue.push(event);
    
    // 达到最大事件数立即上报
    if (this.reportQueue.length >= this.options.batchMaxSize) {
      this.flushQueue();
      return;
    }
    
    // 设置定时上报
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushQueue();
      }, this.options.batchWaitTime);
    }
  }
  
  /**
   * 清空上报队列
   * @param {boolean} useBeacon 是否使用Beacon API上报
   */
  flushQueue(useBeacon = false) {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.reportQueue.length === 0) {
      return;
    }
    
    const events = [...this.reportQueue];
    this.reportQueue = [];
    
    // 批量上报
    this.reportEvents(events, useBeacon);
  }
  
  /**
   * 上报单个事件
   * @param {Object} event 事件对象
   */
  reportEvent(event) {
    this.reportEvents([event]);
  }
  
  /**
   * 批量上报事件
   * @param {Array} events 事件数组
   * @param {boolean} useBeacon 是否使用Beacon API
   */
  reportEvents(events, useBeacon = false) {
    // 通过回调函数上报
    if (typeof this.onReport === 'function') {
      this.onReport(events, useBeacon);
    } else {
      logger.debug('未设置上报回调，埋点数据未上报', events);
    }
  }
  
  /**
   * 追踪性能指标
   * @param {string} metricName 指标名称
   * @param {number} value 指标值
   * @param {Object} tags 附加标签
   */
  trackPerformance(metricName, value, tags = {}) {
    return this.trackEvent('performance', {
      metric: metricName,
      value,
      ...tags
    });
  }
  
  /**
   * 追踪用户动作
   * @param {string} actionName 动作名称
   * @param {Object} properties 动作属性
   */
  trackAction(actionName, properties = {}) {
    return this.trackEvent(`action_${actionName}`, properties);
  }
  
  /**
   * 追踪表单提交
   * @param {string} formName 表单名称
   * @param {Object} properties 表单属性
   */
  trackFormSubmit(formName, properties = {}) {
    return this.trackEvent('form_submit', {
      form: formName,
      ...properties
    });
  }
  
  /**
   * 追踪资源加载错误
   * @param {string} resourceType 资源类型
   * @param {string} url 资源URL
   * @param {Object} properties 附加属性
   */
  trackResourceError(resourceType, url, properties = {}) {
    return this.trackEvent('resource_error', {
      resourceType,
      url,
      ...properties
    });
  }
}

export default Tracker; 