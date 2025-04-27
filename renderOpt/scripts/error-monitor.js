/**
 * error-monitor.js
 * 错误监控系统 - 用于捕获、收集和上报前端异常
 */

class ErrorMonitor {
  constructor(options = {}) {
    this.options = {
      reportUrl: '/api/errors',
      appId: 'renderOpt',
      release: '1.0.0',
      sampleRate: 1.0, // 采样率100%
      ignoreErrors: [
        // 忽略第三方脚本错误
        /Script error/i,
        // 忽略网络错误
        /Network Error/i,
        // 忽略消失的对象(取消的请求)
        /AbortError/i,
        /cancelRequest/i,
        // 忽略可不报告的错误
        /ResizeObserver loop/i
      ],
      maxErrorsPerMinute: 10, // 每分钟最大上报数量
      maxBreadcrumbs: 20, // 最大操作痕迹数量
      consoleOutput: true, // 是否在控制台输出
      ...options
    };
    
    // 错误计数
    this.errorCount = 0;
    this.startTime = Date.now();
    
    // 用户操作痕迹
    this.breadcrumbs = [];
    
    // 是否应该采样
    this.shouldSample = Math.random() < this.options.sampleRate;
    
    // 如果不应该采样，直接返回
    if (!this.shouldSample) {
      console.log('[ErrorMonitor] 根据采样率跳过该用户的错误监控');
      return;
    }
    
    // 初始化监听器
    this.setupErrorHandlers();
    this.setupBreadcrumbs();
    
    console.log(`[ErrorMonitor] 已初始化，版本:${this.options.release}`);
  }
  
  /**
   * 设置错误处理器
   */
  setupErrorHandlers() {
    // 1. 全局错误事件
    window.addEventListener('error', (event) => {
      // 区分资源加载错误和普通JS错误
      if (event.target && (event.target.nodeName === 'IMG' || 
                            event.target.nodeName === 'SCRIPT' || 
                            event.target.nodeName === 'LINK' || 
                            event.target.nodeName === 'AUDIO' || 
                            event.target.nodeName === 'VIDEO')) {
        this.captureResourceError(event);
      } else {
        this.captureJsError(event);
      }
      return true; // 不阻止默认行为
    }, true);
    
    // 2. Promise未捕获异常
    window.addEventListener('unhandledrejection', (event) => {
      this.capturePromiseError(event);
      return true; // 不阻止默认行为
    });
    
    // 3. 重写console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.captureConsoleError(args);
      originalConsoleError.apply(console, args);
    };
    
    // 4. 捕获网络请求错误 (XHR)
    this.monitorXhrErrors();
    
    // 5. 捕获网络请求错误 (Fetch)
    this.monitorFetchErrors();
    
    // 6. Vue错误处理 (如果Vue存在)
    this.setupVueErrorHandler();
    
    // 7. React错误处理 (提供静态方法)
    this.setupReactErrorHandler();
  }
  
  /**
   * 监控XHR错误
   */
  monitorXhrErrors() {
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;
    const self = this;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._monitorData = {
        method,
        url,
        startTime: Date.now()
      };
      originalXhrOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
      if (this._monitorData) {
        const xhr = this;
        
        xhr.addEventListener('error', function() {
          self.captureNetworkError({
            ...xhr._monitorData,
            type: 'xhr',
            status: 0,
            duration: Date.now() - xhr._monitorData.startTime,
            error: 'Network Error'
          });
        });
        
        xhr.addEventListener('timeout', function() {
          self.captureNetworkError({
            ...xhr._monitorData,
            type: 'xhr',
            status: 0,
            duration: Date.now() - xhr._monitorData.startTime,
            error: 'Timeout'
          });
        });
        
        xhr.addEventListener('load', function() {
          if (xhr.status >= 400) {
            self.captureNetworkError({
              ...xhr._monitorData,
              type: 'xhr',
              status: xhr.status,
              duration: Date.now() - xhr._monitorData.startTime,
              error: `HTTP ${xhr.status}`
            });
          }
          
          // 记录API请求作为面包屑
          self.addBreadcrumb({
            category: 'xhr',
            type: 'http',
            data: {
              method: xhr._monitorData.method,
              url: xhr._monitorData.url,
              status: xhr.status
            }
          });
        });
      }
      
      originalXhrSend.apply(this, arguments);
    };
  }
  
  /**
   * 监控Fetch错误
   */
  monitorFetchErrors() {
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = function() {
      const startTime = Date.now();
      const args = Array.from(arguments);
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = args[1]?.method || 'GET';
      
      // 记录请求开始的面包屑
      self.addBreadcrumb({
        category: 'fetch',
        type: 'http',
        data: {
          method,
          url,
          status: 'pending'
        }
      });
      
      return originalFetch.apply(this, args)
        .then(response => {
          // 记录请求完成的面包屑
          self.addBreadcrumb({
            category: 'fetch',
            type: 'http',
            data: {
              method,
              url,
              status: response.status
            }
          });
          
          if (!response.ok) {
            self.captureNetworkError({
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
          self.captureNetworkError({
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
   * 设置Vue错误处理
   */
  setupVueErrorHandler() {
    // 检测Vue是否存在
    if (window.Vue) {
      const self = this;
      // Vue 2.x
      window.Vue.config.errorHandler = function(err, vm, info) {
        self.captureVueError({
          error: err,
          component: vm?.$options?._componentTag || 'anonymous',
          info: info,
          stacktrace: err.stack
        });
        console.error(err); // 保持原始控制台输出
      };
      
      console.log('[ErrorMonitor] Vue错误处理已设置');
    } else if (window.__VUE__) {
      // Vue 3.x Devtools Exposed
      console.log('[ErrorMonitor] 检测到Vue 3.x，可以手动设置app.config.errorHandler');
    }
  }
  
  /**
   * 设置React错误处理
   * 注意：这只是一个辅助方法，需要在React组件中手动使用
   */
  setupReactErrorHandler() {
    const self = this;
    
    // 提供静态方法供React componentDidCatch使用
    this.captureReactError = function(error, errorInfo) {
      self.captureError({
        type: 'react',
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          componentStack: errorInfo?.componentStack
        }
      });
    };
    
    // 示例: 在React组件中使用
    /*
    class ErrorBoundary extends React.Component {
      componentDidCatch(error, errorInfo) {
        window.errorMonitor.captureReactError(error, errorInfo);
      }
      
      render() {
        return this.props.children;
      }
    }
    */
    
    console.log('[ErrorMonitor] React错误处理已准备，请在ErrorBoundary中使用');
  }
  
  /**
   * 设置用户操作痕迹收集
   */
  setupBreadcrumbs() {
    const self = this;
    
    // 点击事件
    document.addEventListener('click', (event) => {
      const target = event.target;
      const tagName = target.tagName.toLowerCase();
      let breadcrumb = {
        category: 'ui.click',
        type: 'user',
        data: {
          tagName,
          id: target.id || null,
          className: target.className || null,
          text: target.innerText?.slice(0, 50) || null
        }
      };
      
      // 添加特殊元素的额外信息
      if (tagName === 'a') {
        breadcrumb.data.href = target.href;
      } else if (tagName === 'button') {
        breadcrumb.data.type = target.type;
      } else if (tagName === 'input') {
        breadcrumb.data.type = target.type;
        // 不收集输入内容，保护隐私
      }
      
      self.addBreadcrumb(breadcrumb);
    }, true);
    
    // 路由变化
    window.addEventListener('popstate', () => {
      self.addBreadcrumb({
        category: 'navigation',
        type: 'navigation',
        data: {
          from: self.lastUrl || document.referrer,
          to: location.href
        }
      });
      self.lastUrl = location.href;
    });
    
    // 初始页面加载
    self.addBreadcrumb({
      category: 'navigation',
      type: 'navigation',
      data: {
        from: document.referrer,
        to: location.href
      }
    });
    self.lastUrl = location.href;
    
    // 窗口大小变化
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        self.addBreadcrumb({
          category: 'ui',
          type: 'resize',
          data: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        });
      }, 500);
    });
    
    // 网络状态变化
    window.addEventListener('online', () => {
      self.addBreadcrumb({
        category: 'system',
        type: 'connectivity',
        data: { status: 'online' }
      });
    });
    
    window.addEventListener('offline', () => {
      self.addBreadcrumb({
        category: 'system',
        type: 'connectivity',
        data: { status: 'offline' }
      });
    });
  }
  
  /**
   * 添加用户操作痕迹
   */
  addBreadcrumb(breadcrumb) {
    const crumb = {
      timestamp: Date.now(),
      ...breadcrumb
    };
    
    this.breadcrumbs.push(crumb);
    
    // 限制面包屑数量
    if (this.breadcrumbs.length > this.options.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
    
    return this;
  }
  
  /**
   * 获取用户行为痕迹
   */
  getBreadcrumbs() {
    return [...this.breadcrumbs];
  }
  
  /**
   * 获取错误上下文
   */
  getErrorContext() {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      device: {
        orientation: window.screen.orientation?.type || null,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        pixelRatio: window.devicePixelRatio
      },
      network: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        rtt: navigator.connection.rtt,
        downlink: navigator.connection.downlink
      } : null,
      language: navigator.language
    };
  }
  
  /**
   * 生成错误ID
   */
  generateErrorId(error) {
    // 创建一个简单的错误指纹
    const message = error.message || '';
    const stack = error.stack || '';
    const fingerprintSource = `${message}${stack.slice(0, 200)}`;
    
    // 简单hash算法
    let hash = 0;
    for (let i = 0; i < fingerprintSource.length; i++) {
      hash = ((hash << 5) - hash) + fingerprintSource.charCodeAt(i);
      hash = hash & hash; // 转为32位整数
    }
    
    return `${this.options.appId}-${hash}`;
  }
  
  /**
   * 收集错误相关信息
   */
  getErrorInfo(error, type) {
    const now = Date.now();
    
    // 限制每分钟上报数量
    if (now - this.startTime > 60000) {
      this.errorCount = 0;
      this.startTime = now;
    }
    
    if (this.errorCount >= this.options.maxErrorsPerMinute) {
      console.warn(`[ErrorMonitor] 达到每分钟最大错误上报数量(${this.options.maxErrorsPerMinute})`);
      return null;
    }
    
    this.errorCount++;
    
    const errorId = this.generateErrorId(error);
    
    return {
      id: errorId,
      type,
      timestamp: now,
      appId: this.options.appId,
      release: this.options.release,
      context: this.getErrorContext(),
      error,
      breadcrumbs: this.getBreadcrumbs()
    };
  }
  
  /**
   * 捕获JavaScript错误
   */
  captureJsError(event) {
    const error = {
      message: event.message,
      stack: event.error?.stack,
      name: event.error?.name || 'Error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    };
    
    this.captureError(this.getErrorInfo(error, 'javascript'));
  }
  
  /**
   * 捕获资源加载错误
   */
  captureResourceError(event) {
    const target = event.target;
    const error = {
      message: `Failed to load ${target.nodeName.toLowerCase()}: ${target.src || target.href}`,
      source: target.src || target.href,
      tagName: target.nodeName.toLowerCase(),
      outerHTML: target.outerHTML?.substring(0, 200)
    };
    
    this.captureError(this.getErrorInfo(error, 'resource'));
  }
  
  /**
   * 捕获Promise未处理的rejection
   */
  capturePromiseError(event) {
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
    
    this.captureError(this.getErrorInfo(error, 'promise'));
  }
  
  /**
   * 捕获控制台错误
   */
  captureConsoleError(args) {
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
    
    this.captureError(this.getErrorInfo(error, 'console'));
  }
  
  /**
   * 捕获网络错误
   */
  captureNetworkError(data) {
    const error = {
      message: `${data.method} ${data.url} failed with status ${data.status}: ${data.error}`,
      ...data
    };
    
    this.captureError(this.getErrorInfo(error, 'network'));
  }
  
  /**
   * 捕获Vue错误
   */
  captureVueError(data) {
    const error = {
      message: data.error.message || String(data.error),
      stack: data.error.stack,
      component: data.component,
      info: data.info,
      name: data.error.name || 'VueError'
    };
    
    this.captureError(this.getErrorInfo(error, 'vue'));
  }
  
  /**
   * 通用错误捕获方法
   */
  captureError(errorInfo) {
    if (!errorInfo) return;
    
    // 检查是否应该忽略该错误
    if (this.shouldIgnoreError(errorInfo)) {
      if (this.options.consoleOutput) {
        console.debug('[ErrorMonitor] 忽略错误:', errorInfo.error.message);
      }
      return;
    }
    
    // 控制台输出
    if (this.options.consoleOutput) {
      console.warn(`[ErrorMonitor] 捕获到${errorInfo.type}错误:`, errorInfo.error.message);
    }
    
    // 上报错误
    this.reportError(errorInfo);
  }
  
  /**
   * 判断是否应该忽略错误
   */
  shouldIgnoreError(errorInfo) {
    if (!errorInfo || !errorInfo.error) return true;
    
    const message = errorInfo.error.message || '';
    
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
   * 上报错误数据
   */
  reportError(errorInfo) {
    // 如果不应该采样，直接返回
    if (!this.shouldSample) return;
    
    // 使用Beacon API或普通XHR上报错误
    if (navigator.sendBeacon && this.options.reportUrl) {
      navigator.sendBeacon(this.options.reportUrl, JSON.stringify(errorInfo));
    } else {
      // 使用普通XHR上报，避免影响页面卸载
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.options.reportUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(errorInfo));
    }
  }
  
  /**
   * 主动捕获并上报错误
   */
  captureException(error, extraInfo = {}) {
    if (!error) return;
    
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const errorInfo = this.getErrorInfo({
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
      ...extraInfo
    }, 'manual');
    
    this.captureError(errorInfo);
    return errorInfo?.id;
  }
  
  /**
   * 手动上报消息
   */
  captureMessage(message, level = 'info', extraInfo = {}) {
    if (!message) return;
    
    const errorInfo = this.getErrorInfo({
      message: String(message),
      level,
      ...extraInfo,
      name: 'UserMessage'
    }, 'message');
    
    this.captureError(errorInfo);
    return errorInfo?.id;
  }
  
  /**
   * 设置用户信息
   */
  setUser(userInfo) {
    this.userInfo = {
      ...userInfo,
      lastUpdated: Date.now()
    };
    
    // 添加用户信息面包屑
    this.addBreadcrumb({
      category: 'system',
      type: 'user',
      data: { action: 'set_user' }
    });
    
    return this;
  }
  
  /**
   * 设置附加数据
   */
  setExtra(key, value) {
    if (!this.extraData) {
      this.extraData = {};
    }
    
    this.extraData[key] = value;
    return this;
  }
  
  /**
   * 清空面包屑
   */
  clearBreadcrumbs() {
    this.breadcrumbs = [];
    return this;
  }
}

// 创建全局实例
window.errorMonitor = new ErrorMonitor({
  consoleOutput: true,
  sampleRate: 1.0
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorMonitor;
}

// 使用示例
try {
  // 故意制造一个错误
  // const nonExistingVar = undefinedVar.prop;
} catch (e) {
  window.errorMonitor.captureException(e, { context: 'Initialization' });
}

// 手动上报消息
// window.errorMonitor.captureMessage('This is a test message', 'warning'); 