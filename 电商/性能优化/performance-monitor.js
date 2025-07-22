/**
 * 电商前端性能监控系统
 * 用于监控和分析Web应用的性能指标
 */

// ==================== 核心性能监控类 ====================

class PerformanceMonitor {
  constructor(options = {}) {
    this.config = {
      // 是否自动上报
      autoReport: options.autoReport !== false,
      // 上报接口
      reportUrl: options.reportUrl || '/api/performance/report',
      // 采样率 (0-1)
      sampleRate: options.sampleRate || 1,
      // 是否启用用户体验监控
      enableUX: options.enableUX !== false,
      // 是否启用资源监控
      enableResource: options.enableResource !== false,
      // 是否启用错误监控
      enableError: options.enableError !== false,
      // 自定义标识
      appId: options.appId || 'ecommerce-app',
      // 用户标识
      userId: options.userId,
      // 页面标识
      pageId: options.pageId,
      ...options
    };

    this.metrics = new Map();
    this.observers = new Map();
    this.isSupported = this.checkSupport();
    
    if (this.isSupported) {
      this.init();
    }
  }

  // 检查浏览器支持
  checkSupport() {
    return !!(
      window.performance && 
      window.performance.timing && 
      window.performance.getEntriesByType
    );
  }

  // 初始化监控
  init() {
    this.observeNavigation();
    this.observeResources();
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();
    this.observeMemory();
    this.observeErrors();
    this.observeUserInteraction();
    
    // 页面卸载时上报数据
    this.onPageUnload();
  }

  // ==================== 导航性能监控 ====================

  observeNavigation() {
    if (!window.performance.timing) return;

    const timing = window.performance.timing;
    const navigationStart = timing.navigationStart;

    // 计算各个阶段的耗时
    const metrics = {
      // DNS解析时间
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      // TCP连接时间
      tcpTime: timing.connectEnd - timing.connectStart,
      // SSL握手时间
      sslTime: timing.secureConnectionStart > 0 ? 
        timing.connectEnd - timing.secureConnectionStart : 0,
      // 请求时间
      requestTime: timing.responseStart - timing.requestStart,
      // 响应时间
      responseTime: timing.responseEnd - timing.responseStart,
      // DOM解析时间
      domParseTime: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
      // 资源加载时间
      resourceTime: timing.loadEventEnd - timing.domContentLoadedEventEnd,
      // 首字节时间
      ttfb: timing.responseStart - navigationStart,
      // DOM Ready时间
      domReady: timing.domContentLoadedEventEnd - navigationStart,
      // 页面完全加载时间
      loadComplete: timing.loadEventEnd - navigationStart,
      // 白屏时间（估算）
      whiteScreen: timing.domLoading - navigationStart,
      // 首屏时间（需要自定义测量点）
      firstScreen: this.getFirstScreenTime()
    };

    this.setMetric('navigation', metrics);
  }

  // 获取首屏时间
  getFirstScreenTime() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve(performance.now());
      } else {
        window.addEventListener('load', () => {
          // 延迟测量，确保首屏内容渲染完成
          setTimeout(() => {
            resolve(performance.now());
          }, 0);
        });
      }
    });
  }

  // ==================== 资源性能监控 ====================

  observeResources() {
    if (!this.config.enableResource) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.analyzeResourceEntry(entry);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  analyzeResourceEntry(entry) {
    const resourceMetric = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      size: entry.transferSize || 0,
      duration: entry.duration,
      startTime: entry.startTime,
      // DNS查询时间
      dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
      // TCP连接时间
      tcpTime: entry.connectEnd - entry.connectStart,
      // 请求时间
      requestTime: entry.responseStart - entry.requestStart,
      // 响应时间
      responseTime: entry.responseEnd - entry.responseStart,
      // 是否使用缓存
      fromCache: entry.transferSize === 0 && entry.decodedBodySize > 0,
      // 协议版本
      nextHopProtocol: entry.nextHopProtocol || 'unknown'
    };

    this.addResourceMetric(resourceMetric);
  }

  getResourceType(url) {
    const extension = url.split('.').pop().split('?')[0].toLowerCase();
    const typeMap = {
      'js': 'script',
      'css': 'stylesheet', 
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'svg': 'image',
      'webp': 'image',
      'woff': 'font',
      'woff2': 'font',
      'ttf': 'font',
      'eot': 'font'
    };
    return typeMap[extension] || 'other';
  }

  addResourceMetric(metric) {
    if (!this.metrics.has('resources')) {
      this.metrics.set('resources', []);
    }
    this.metrics.get('resources').push(metric);
  }

  // ==================== Web Vitals 监控 ====================

  // Largest Contentful Paint (最大内容绘制)
  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.setMetric('lcp', {
        value: lastEntry.startTime,
        element: lastEntry.element,
        url: lastEntry.url,
        timestamp: Date.now()
      });
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', observer);
  }

  // First Input Delay (首次输入延迟)
  observeFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.setMetric('fid', {
          value: entry.processingStart - entry.startTime,
          eventType: entry.name,
          startTime: entry.startTime,
          timestamp: Date.now()
        });
      }
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', observer);
  }

  // Cumulative Layout Shift (累积布局偏移)
  observeCLS() {
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          if (sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            this.setMetric('cls', {
              value: clsValue,
              entries: sessionEntries.map(e => ({
                startTime: e.startTime,
                value: e.value,
                sources: e.sources
              })),
              timestamp: Date.now()
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', observer);
  }

  // First Contentful Paint (首次内容绘制)
  observeFCP() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.setMetric('fcp', {
            value: entry.startTime,
            timestamp: Date.now()
          });
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });
    this.observers.set('fcp', observer);
  }

  // Time to First Byte (首字节时间)
  observeTTFB() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          this.setMetric('ttfb', {
            value: entry.responseStart - entry.requestStart,
            timestamp: Date.now()
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.set('ttfb', observer);
  }

  // ==================== 内存监控 ====================

  observeMemory() {
    if (!performance.memory) return;

    const getMemoryInfo = () => ({
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      timestamp: Date.now()
    });

    // 初始内存信息
    this.setMetric('memory', getMemoryInfo());

    // 定期收集内存信息
    setInterval(() => {
      const memoryInfo = getMemoryInfo();
      this.updateMemoryMetric(memoryInfo);
    }, 10000); // 每10秒收集一次
  }

  updateMemoryMetric(newMemoryInfo) {
    if (!this.metrics.has('memoryHistory')) {
      this.metrics.set('memoryHistory', []);
    }
    
    const history = this.metrics.get('memoryHistory');
    history.push(newMemoryInfo);
    
    // 只保留最近100条记录
    if (history.length > 100) {
      history.shift();
    }
    
    this.setMetric('memory', newMemoryInfo);
  }

  // ==================== 错误监控 ====================

  observeErrors() {
    if (!this.config.enableError) return;

    // JavaScript错误
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });

    // Promise未捕获错误
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });

    // 资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.recordError({
          type: 'resource',
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          message: `Failed to load ${event.target.tagName}`,
          timestamp: Date.now()
        });
      }
    }, true);
  }

  recordError(errorInfo) {
    if (!this.metrics.has('errors')) {
      this.metrics.set('errors', []);
    }
    
    const errors = this.metrics.get('errors');
    errors.push(errorInfo);
    
    // 立即上报严重错误
    if (this.config.autoReport && errors.length === 1) {
      this.reportError(errorInfo);
    }
  }

  // ==================== 用户交互监控 ====================

  observeUserInteraction() {
    if (!this.config.enableUX) return;

    let interactionCount = 0;
    let totalInteractionTime = 0;
    let longTaskCount = 0;

    // 监控长任务
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTaskCount++;
          this.recordLongTask({
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
            timestamp: Date.now()
          });
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    }

    // 监控用户交互
    const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart'];
    
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const startTime = performance.now();
        
        requestAnimationFrame(() => {
          const endTime = performance.now();
          const interactionTime = endTime - startTime;
          
          interactionCount++;
          totalInteractionTime += interactionTime;
          
          this.recordInteraction({
            type: eventType,
            target: event.target.tagName,
            duration: interactionTime,
            timestamp: Date.now()
          });
        });
      }, { passive: true });
    });

    // 定期更新交互指标
    setInterval(() => {
      this.setMetric('userInteraction', {
        interactionCount,
        averageInteractionTime: interactionCount > 0 ? totalInteractionTime / interactionCount : 0,
        longTaskCount,
        timestamp: Date.now()
      });
    }, 5000);
  }

  recordLongTask(taskInfo) {
    if (!this.metrics.has('longTasks')) {
      this.metrics.set('longTasks', []);
    }
    this.metrics.get('longTasks').push(taskInfo);
  }

  recordInteraction(interactionInfo) {
    if (!this.metrics.has('interactions')) {
      this.metrics.set('interactions', []);
    }
    
    const interactions = this.metrics.get('interactions');
    interactions.push(interactionInfo);
    
    // 只保留最近50次交互
    if (interactions.length > 50) {
      interactions.shift();
    }
  }

  // ==================== 自定义性能标记 ====================

  // 开始性能标记
  mark(name) {
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }
    return {
      end: () => this.endMark(name)
    };
  }

  // 结束性能标记
  endMark(name) {
    if (performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        this.setCustomMetric(name, {
          duration: measure.duration,
          startTime: measure.startTime,
          timestamp: Date.now()
        });
      }
    }
  }

  setCustomMetric(name, value) {
    if (!this.metrics.has('custom')) {
      this.metrics.set('custom', {});
    }
    this.metrics.get('custom')[name] = value;
  }

  // ==================== 数据管理 ====================

  setMetric(key, value) {
    this.metrics.set(key, value);
  }

  getMetric(key) {
    return this.metrics.get(key);
  }

  getAllMetrics() {
    const result = {};
    for (const [key, value] of this.metrics) {
      result[key] = value;
    }
    return result;
  }

  // ==================== 数据上报 ====================

  async report(customData = {}) {
    if (Math.random() > this.config.sampleRate) {
      return; // 采样控制
    }

    const reportData = {
      appId: this.config.appId,
      userId: this.config.userId,
      pageId: this.config.pageId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      metrics: this.getAllMetrics(),
      ...customData
    };

    try {
      if (navigator.sendBeacon) {
        // 使用 sendBeacon 确保数据能够发送
        navigator.sendBeacon(
          this.config.reportUrl,
          JSON.stringify(reportData)
        );
      } else {
        // 降级使用 fetch
        await fetch(this.config.reportUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reportData)
        });
      }
    } catch (error) {
      console.warn('Performance report failed:', error);
    }
  }

  async reportError(errorInfo) {
    try {
      await fetch(`${this.config.reportUrl}/error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appId: this.config.appId,
          userId: this.config.userId,
          error: errorInfo,
          url: window.location.href,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.warn('Error report failed:', error);
    }
  }

  // 页面卸载时上报数据
  onPageUnload() {
    const reportOnUnload = () => {
      if (this.config.autoReport) {
        this.report({ event: 'page_unload' });
      }
    };

    // 兼容不同的页面卸载事件
    window.addEventListener('beforeunload', reportOnUnload);
    window.addEventListener('pagehide', reportOnUnload);
    
    // 对于SPA应用，监听路由变化
    if (window.history && window.history.pushState) {
      const originalPushState = window.history.pushState;
      window.history.pushState = function(...args) {
        reportOnUnload();
        return originalPushState.apply(this, args);
      };
    }
  }

  // 清理资源
  destroy() {
    // 停止所有观察器
    for (const [key, observer] of this.observers) {
      observer.disconnect();
    }
    this.observers.clear();
    this.metrics.clear();
  }
}

// ==================== 电商专用性能监控 ====================

class EcommercePerformanceMonitor extends PerformanceMonitor {
  constructor(options = {}) {
    super(options);
    this.initEcommerceMetrics();
  }

  initEcommerceMetrics() {
    // 监控商品列表渲染性能
    this.observeProductListRender();
    
    // 监控购物车操作性能
    this.observeCartOperations();
    
    // 监控搜索性能
    this.observeSearchPerformance();
    
    // 监控支付流程性能
    this.observeCheckoutPerformance();
  }

  // 商品列表渲染性能
  observeProductListRender() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const productElements = Array.from(mutation.addedNodes).filter(
            node => node.nodeType === 1 && 
            (node.classList?.contains('product-item') || 
             node.querySelector?.('.product-item'))
          );
          
          if (productElements.length > 0) {
            this.recordProductListRender(productElements.length);
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  recordProductListRender(productCount) {
    const renderTime = performance.now();
    this.setCustomMetric('productListRender', {
      productCount,
      renderTime,
      timestamp: Date.now()
    });
  }

  // 购物车操作性能
  observeCartOperations() {
    const cartOperations = ['add-to-cart', 'remove-from-cart', 'update-quantity'];
    
    cartOperations.forEach(operation => {
      document.addEventListener(`cart:${operation}`, (event) => {
        const startTime = performance.now();
        
        // 监听DOM更新完成
        requestAnimationFrame(() => {
          const endTime = performance.now();
          this.recordCartOperation(operation, endTime - startTime, event.detail);
        });
      });
    });
  }

  recordCartOperation(operation, duration, detail) {
    if (!this.metrics.has('cartOperations')) {
      this.metrics.set('cartOperations', []);
    }
    
    this.metrics.get('cartOperations').push({
      operation,
      duration,
      detail,
      timestamp: Date.now()
    });
  }

  // 搜索性能监控
  observeSearchPerformance() {
    let searchStartTime;
    
    // 监听搜索开始
    document.addEventListener('search:start', () => {
      searchStartTime = performance.now();
    });
    
    // 监听搜索结果渲染完成
    document.addEventListener('search:complete', (event) => {
      if (searchStartTime) {
        const searchDuration = performance.now() - searchStartTime;
        this.recordSearchPerformance(searchDuration, event.detail);
        searchStartTime = null;
      }
    });
  }

  recordSearchPerformance(duration, detail) {
    if (!this.metrics.has('searchOperations')) {
      this.metrics.set('searchOperations', []);
    }
    
    this.metrics.get('searchOperations').push({
      duration,
      resultCount: detail?.resultCount || 0,
      query: detail?.query || '',
      timestamp: Date.now()
    });
  }

  // 支付流程性能监控
  observeCheckoutPerformance() {
    const checkoutSteps = [
      'address-selection',
      'payment-method',
      'order-confirmation',
      'payment-processing'
    ];
    
    checkoutSteps.forEach(step => {
      document.addEventListener(`checkout:${step}:start`, () => {
        this.mark(`checkout-${step}`);
      });
      
      document.addEventListener(`checkout:${step}:complete`, () => {
        this.endMark(`checkout-${step}`);
      });
    });
  }

  // 获取电商特定的性能报告
  getEcommerceReport() {
    const baseReport = this.getAllMetrics();
    
    return {
      ...baseReport,
      ecommerce: {
        productListPerformance: this.analyzeProductListPerformance(),
        cartPerformance: this.analyzeCartPerformance(),
        searchPerformance: this.analyzeSearchPerformance(),
        checkoutPerformance: this.analyzeCheckoutPerformance()
      }
    };
  }

  analyzeProductListPerformance() {
    const renders = this.getMetric('custom')?.productListRender;
    if (!renders) return null;
    
    return {
      averageRenderTime: renders.renderTime,
      productCount: renders.productCount,
      efficiency: renders.productCount / renders.renderTime // 产品数/渲染时间
    };
  }

  analyzeCartPerformance() {
    const operations = this.getMetric('cartOperations') || [];
    if (operations.length === 0) return null;
    
    const avgDuration = operations.reduce((sum, op) => sum + op.duration, 0) / operations.length;
    const operationCounts = operations.reduce((counts, op) => {
      counts[op.operation] = (counts[op.operation] || 0) + 1;
      return counts;
    }, {});
    
    return {
      averageDuration: avgDuration,
      totalOperations: operations.length,
      operationBreakdown: operationCounts
    };
  }

  analyzeSearchPerformance() {
    const searches = this.getMetric('searchOperations') || [];
    if (searches.length === 0) return null;
    
    const avgDuration = searches.reduce((sum, search) => sum + search.duration, 0) / searches.length;
    const avgResultCount = searches.reduce((sum, search) => sum + search.resultCount, 0) / searches.length;
    
    return {
      averageDuration: avgDuration,
      averageResultCount: avgResultCount,
      searchCount: searches.length,
      efficiency: avgResultCount / avgDuration // 结果数/搜索时间
    };
  }

  analyzeCheckoutPerformance() {
    const custom = this.getMetric('custom') || {};
    const checkoutMetrics = {};
    
    Object.keys(custom).forEach(key => {
      if (key.startsWith('checkout-')) {
        checkoutMetrics[key] = custom[key];
      }
    });
    
    return checkoutMetrics;
  }
}

// ==================== 使用示例 ====================

// 基础使用
const monitor = new PerformanceMonitor({
  reportUrl: '/api/performance/report',
  appId: 'my-ecommerce-app',
  userId: 'user123',
  sampleRate: 0.1 // 10% 采样率
});

// 电商专用监控
const ecommerceMonitor = new EcommercePerformanceMonitor({
  reportUrl: '/api/performance/report',
  appId: 'ecommerce-app',
  userId: getCurrentUserId(),
  autoReport: true
});

// 自定义性能标记示例
const apiCallTimer = monitor.mark('api-product-list');
fetch('/api/products')
  .then(response => response.json())
  .then(data => {
    apiCallTimer.end();
    // 触发商品列表渲染完成事件
    document.dispatchEvent(new CustomEvent('search:complete', {
      detail: { resultCount: data.length, query: 'all' }
    }));
  });

// 购物车操作示例
function addToCart(productId) {
  // 触发购物车操作开始事件
  document.dispatchEvent(new CustomEvent('cart:add-to-cart', {
    detail: { productId }
  }));
  
  // 执行添加到购物车的逻辑
  // ...
}

// 导出监控类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceMonitor, EcommercePerformanceMonitor };
}

// 面试要点总结
/*
1. 性能监控的核心指标：
   - Web Vitals: LCP, FID, CLS, FCP, TTFB
   - 导航时间: DNS, TCP, Request, Response, DOM解析
   - 资源加载: 各类资源的加载时间和大小
   - 内存使用: JS堆内存使用情况
   - 用户交互: 交互响应时间和长任务

2. 监控技术实现：
   - Performance API: 获取性能数据
   - PerformanceObserver: 观察性能条目
   - MutationObserver: 监控DOM变化
   - 事件监听: 监控用户交互和错误

3. 数据上报策略：
   - 采样率控制: 避免过多请求
   - 批量上报: 减少网络请求
   - sendBeacon: 确保数据发送
   - 错误容错: 上报失败的处理

4. 电商特定监控：
   - 商品列表渲染性能
   - 购物车操作响应时间
   - 搜索功能性能
   - 支付流程各步骤耗时

5. 性能优化建议：
   - 基于监控数据进行针对性优化
   - 设置性能预算和告警阈值
   - A/B测试验证优化效果
   - 持续监控和改进
*/ 