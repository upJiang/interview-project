/**
 * Mini-Sentry 数据传输模块
 * 负责将收集的数据上报到服务端
 */

import logger from './logger';
import { generateUUID, sleep } from './helpers';

/**
 * 数据传输类
 * 提供数据上报功能，支持批量上报和失败重试
 */
class Transport {
  /**
   * 创建数据传输实例
   * @param {Object} options 配置选项
   * @param {string} options.endpoint 上报端点URL
   * @param {boolean} options.useBeacon 是否使用Beacon API
   * @param {string} options.method 上报方法 (post, beacon)
   * @param {number} options.timeout 上报超时时间(毫秒)
   * @param {number} options.maxRetries 最大重试次数
   * @param {number} options.retryDelay 重试延迟(毫秒)
   * @param {boolean} options.batchReport 是否批量上报
   * @param {number} options.batchSize 批量上报大小
   * @param {number} options.maxQueueSize 最大队列大小
   */
  constructor(options = {}) {
    this.options = {
      endpoint: '',
      useBeacon: true,
      method: 'post',
      timeout: 5000,
      maxRetries: 3,
      retryDelay: 1000,
      batchReport: true,
      batchSize: 10,
      maxQueueSize: 100,
      ...options
    };
    
    // 上报队列
    this.queue = [];
    
    // 是否正在上报
    this.isSending = false;
    
    // 上报的定时器ID
    this.flushTimer = null;
    
    // 初始化定时上报
    if (this.options.batchReport) {
      this.startBatchReport();
    }
    
    // 在页面卸载前尝试上报
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });
    }
  }
  
  /**
   * 启动批量上报定时器
   */
  startBatchReport() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.options.batchInterval || 5000);
  }
  
  /**
   * 停止批量上报定时器
   */
  stopBatchReport() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
  
  /**
   * 将事件加入上报队列
   * @param {Object} event 要上报的事件
   */
  enqueue(event) {
    // 如果队列已满，丢弃最早的事件
    if (this.queue.length >= this.options.maxQueueSize) {
      this.queue.shift();
    }
    
    // 添加事件ID和时间戳
    const enrichedEvent = {
      ...event,
      eventId: event.eventId || generateUUID(),
      timestamp: event.timestamp || Date.now()
    };
    
    this.queue.push(enrichedEvent);
    logger.debug(`事件已加入队列: ${enrichedEvent.eventId}`);
    
    // 如果批量上报被禁用或队列达到阈值，立即上报
    if (!this.options.batchReport || this.queue.length >= this.options.batchSize) {
      this.flush();
    }
  }
  
  /**
   * 立即上报所有队列中的事件
   * @param {boolean} useBeacon 是否强制使用Beacon API (页面卸载时)
   * @returns {Promise<boolean>} 上报是否成功
   */
  async flush(useBeacon = false) {
    if (this.queue.length === 0) {
      return true;
    }
    
    // 避免并发上报
    if (this.isSending) {
      return false;
    }
    
    this.isSending = true;
    const events = [...this.queue];
    this.queue = [];
    
    try {
      // 决定使用哪种上报方式
      let success;
      if (useBeacon || (this.options.useBeacon && navigator.sendBeacon)) {
        // 使用Beacon API (不阻塞页面卸载)
        success = this.sendBeacon(events);
      } else {
        // 使用XHR/fetch
        success = await this.sendHttp(events);
      }
      
      if (success) {
        logger.debug(`成功上报 ${events.length} 个事件`);
      } else {
        logger.warn(`上报失败，重新加入队列`);
        // 如果失败，重新加入队列
        this.queue = [...events, ...this.queue].slice(0, this.options.maxQueueSize);
      }
      
      this.isSending = false;
      return success;
    } catch (error) {
      logger.error(`上报出错: ${error.message}`);
      // 如果出错，重新加入队列
      this.queue = [...events, ...this.queue].slice(0, this.options.maxQueueSize);
      this.isSending = false;
      return false;
    }
  }
  
  /**
   * 使用Beacon API上报
   * @param {Array} events 事件数组
   * @returns {boolean} 上报是否成功
   */
  sendBeacon(events) {
    if (!navigator.sendBeacon) {
      return false;
    }
    
    try {
      const data = JSON.stringify({ events });
      const blob = new Blob([data], { type: 'application/json' });
      return navigator.sendBeacon(this.options.endpoint, blob);
    } catch (error) {
      logger.error(`Beacon上报失败: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 使用HTTP请求上报
   * @param {Array} events 事件数组
   * @returns {Promise<boolean>} 上报是否成功
   */
  async sendHttp(events, retryCount = 0) {
    try {
      let response;
      
      if (typeof fetch === 'function') {
        // 使用fetch API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
        
        response = await fetch(this.options.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-MiniSentry-Version': '1.0.0'
          },
          body: JSON.stringify({ events }),
          signal: controller.signal,
          keepalive: true
        });
        
        clearTimeout(timeoutId);
      } else {
        // 降级使用XMLHttpRequest
        response = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', this.options.endpoint);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('X-MiniSentry-Version', '1.0.0');
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ ok: true });
            } else {
              reject(new Error(`HTTP错误: ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => reject(new Error('网络错误'));
          xhr.ontimeout = () => reject(new Error('请求超时'));
          
          xhr.timeout = this.options.timeout;
          xhr.send(JSON.stringify({ events }));
        });
      }
      
      if (response.ok) {
        return true;
      }
      
      throw new Error(`HTTP错误: ${response.status}`);
    } catch (error) {
      logger.warn(`HTTP上报失败: ${error.message}`);
      
      // 重试
      if (retryCount < this.options.maxRetries) {
        logger.debug(`第${retryCount + 1}次重试...`);
        await sleep(this.options.retryDelay);
        return this.sendHttp(events, retryCount + 1);
      }
      
      return false;
    }
  }
  
  /**
   * 销毁传输实例
   */
  destroy() {
    this.stopBatchReport();
    this.flush(true);
    this.queue = [];
  }
}

export default Transport; 