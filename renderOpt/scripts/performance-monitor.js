/**
 * performance-monitor.js
 * 性能监控工具 - 包含Web Vitals指标监控、自定义性能指标和上报功能
 */

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      sampleRate: 0.1, // 采样率10%
      reportUrl: '/api/performance', // 上报地址
      appId: 'renderOpt', // 应用ID
      includeNetworkInfo: true, // 是否包含网络信息
      reportConsole: true, // 是否在控制台报告
      ...options
    };
    
    this.metrics = {
      navigation: {},
      paint: {
        FP: 0,
        FCP: 0,
        LCP: 0
      },
      interaction: {
        FID: 0,
        CLS: 0,
        TTI: 0,
        TBT: 0
      },
      resources: {
        js: [],
        css: [],
        img: [],
        api: []
      },
      memory: {},
      custom: {}
    };
    
    this.observers = [];
    this.clsValue = 0;
    this.clsEntries = [];
    this.shouldSample = Math.random() < this.options.sampleRate;
    
    if (this.shouldSample) {
      this.setupObservers();
      this.setupEventListeners();
    }
    
    console.log('[PerformanceMonitor] 已初始化');
  }
  
  /**
   * 设置性能观察者
   */
  setupObservers() {
    if (!window.PerformanceObserver) {
      console.warn('[PerformanceMonitor] PerformanceObserver不可用');
      return;
    }
    
    try {
      // FP和FCP观察
      const paintObserver = new PerformanceObserver(entries => {
        entries.getEntries().forEach(entry => {
          if (entry.name === 'first-paint') {
            this.metrics.paint.FP = entry.startTime;
            this.logMetric('FP', entry.startTime);
          } else if (entry.name === 'first-contentful-paint') {
            this.metrics.paint.FCP = entry.startTime;
            this.logMetric('FCP', entry.startTime);
          }
        });
      });
      paintObserver.observe({ type: 'paint', buffered: true });
      this.observers.push(paintObserver);
      
      // LCP观察
      const lcpObserver = new PerformanceObserver(entries => {
        const lastEntry = entries.getEntries().pop();
        if (lastEntry) {
          this.metrics.paint.LCP = lastEntry.startTime;
          this.logMetric('LCP', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);
      
      // FID观察
      const fidObserver = new PerformanceObserver(entries => {
        const firstInput = entries.getEntries()[0];
        if (firstInput) {
          const delay = firstInput.processingStart - firstInput.startTime;
          this.metrics.interaction.FID = delay;
          this.logMetric('FID', delay);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);
      
      // CLS观察
      const clsObserver = new PerformanceObserver(entries => {
        for (const entry of entries.getEntries()) {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = this.clsEntries.length === 0;
            const currentTime = performance.now();
            const lastEntryTime = this.clsEntries.length > 0 ? 
              this.clsEntries[this.clsEntries.length - 1].time : 0;
            
            // 如果是新会话 (间隔>1秒且没有其他条目或这是第一个条目)
            if (firstSessionEntry || currentTime - lastEntryTime > 1000) {
              // 开始新会话
              this.clsEntries.push({
                value: entry.value,
                time: currentTime
              });
            } else {
              // 现有会话添加
              this.clsEntries[this.clsEntries.length - 1].value += entry.value;
            }
            
            // 排序会话并获取最大的
            const clsSessions = [...this.clsEntries].sort((a, b) => b.value - a.value);
            this.clsValue = clsSessions.length > 0 ? clsSessions[0].value : 0;
            this.metrics.interaction.CLS = this.clsValue;
            this.logMetric('CLS', this.clsValue);
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);
      
      // 长任务观察
      const longTaskObserver = new PerformanceObserver(entries => {
        for (const entry of entries.getEntries()) {
          // 计算TBT (总阻塞时间)
          const blockingTime = entry.duration - 50; // 50ms是长任务阈值
          if (blockingTime > 0) {
            this.metrics.interaction.TBT += blockingTime;
            this.logMetric('长任务', `${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
      this.observers.push(longTaskObserver);
      
      // 资源观察
      const resourceObserver = new PerformanceObserver(entries => {
        for (const entry of entries.getEntries()) {
          const resource = {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            initiatorType: entry.initiatorType,
            startTime: entry.startTime
          };
          
          if (entry.initiatorType === 'script') {
            this.metrics.resources.js.push(resource);
          } else if (entry.initiatorType === 'css') {
            this.metrics.resources.css.push(resource);
          } else if (entry.initiatorType === 'img') {
            this.metrics.resources.img.push(resource);
          } else if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            this.metrics.resources.api.push(resource);
          }
        }
      });
      resourceObserver.observe({ type: 'resource', buffered: true });
      this.observers.push(resourceObserver);
      
    } catch (error) {
      console.error('[PerformanceMonitor] 观察者设置失败:', error);
    }
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 导航计时
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.collectNavigationTiming();
        this.collectMemoryInfo();
      }, 0);
    });
    
    // 页面隐藏时上报
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.collect();
        this.report();
      }
    });
    
    // 页面卸载前上报
    window.addEventListener('beforeunload', () => {
      this.collect();
      this.report();
    });
    
    // 页面完全加载后一段时间再上报
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.collect();
        this.report();
      }, 5000);
    });
  }
  
  /**
   * 收集导航计时
   */
  collectNavigationTiming() {
    if (!performance || !performance.getEntriesByType) return;
    
    const navigationEntries = performance.getEntriesByType('navigation');
    if (!navigationEntries || !navigationEntries.length) return;
    
    const navTiming = navigationEntries[0];
    this.metrics.navigation = {
      // DNS查询时间
      dnsTime: navTiming.domainLookupEnd - navTiming.domainLookupStart,
      // TCP连接时间
      tcpTime: navTiming.connectEnd - navTiming.connectStart,
      // TLS协商时间
      tlsTime: navTiming.secureConnectionStart > 0 ? 
        navTiming.connectEnd - navTiming.secureConnectionStart : 0,
      // 首字节时间(TTFB)
      ttfb: navTiming.responseStart - navTiming.requestStart,
      // 请求响应时间
      responseTime: navTiming.responseEnd - navTiming.responseStart,
      // 解析DOM树耗时
      domParsingTime: navTiming.domInteractive - navTiming.responseEnd,
      // 资源加载耗时
      resourceLoadTime: navTiming.loadEventStart - navTiming.domContentLoadedEventEnd,
      // DOM构建时间
      domContentLoaded: navTiming.domContentLoadedEventEnd,
      // 页面完全加载时间
      pageLoadTime: navTiming.loadEventEnd,
      // 重定向次数
      redirectCount: navTiming.redirectCount
    };
    
    this.logMetric('TTFB', `${this.metrics.navigation.ttfb.toFixed(2)}ms`);
    this.logMetric('页面加载', `${this.metrics.navigation.pageLoadTime.toFixed(2)}ms`);
  }
  
  /**
   * 收集内存信息
   */
  collectMemoryInfo() {
    // 注意：performance.memory是非标准的，且只在Chromium浏览器可用
    if (performance.memory) {
      this.metrics.memory = {
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        usedJSHeapSize: performance.memory.usedJSHeapSize
      };
      
      const heapUsageRatio = this.metrics.memory.usedJSHeapSize / this.metrics.memory.jsHeapSizeLimit;
      this.logMetric('内存使用', `${(heapUsageRatio * 100).toFixed(2)}%`);
    }
  }
  
  /**
   * 输出指标
   */
  logMetric(name, value) {
    if (this.options.reportConsole) {
      console.log(`[性能指标] ${name}: ${value}`);
    }
  }
  
  /**
   * 添加自定义指标
   */
  addCustomMetric(name, value) {
    this.metrics.custom[name] = value;
    this.logMetric(name, value);
    return this;
  }
  
  /**
   * 性能打点
   */
  mark(name) {
    if (performance.mark) {
      performance.mark(name);
    }
    return this;
  }
  
  /**
   * 性能测量
   */
  measure(name, startMark, endMark) {
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measures = performance.getEntriesByName(name, 'measure');
        if (measures && measures.length) {
          this.metrics.custom[name] = measures[0].duration;
          this.logMetric(name, `${measures[0].duration.toFixed(2)}ms`);
        }
      } catch (e) {
        console.error('[PerformanceMonitor] 性能测量错误:', e);
      }
    }
    return this;
  }
  
  /**
   * 收集所有性能数据
   */
  collect() {
    // 确保导航数据已收集
    if (Object.keys(this.metrics.navigation).length === 0) {
      this.collectNavigationTiming();
    }
    
    // 收集内存信息
    this.collectMemoryInfo();
    
    // 添加时间戳
    this.metrics.timestamp = Date.now();
    
    // 添加网络信息
    if (this.options.includeNetworkInfo && navigator.connection) {
      this.metrics.network = {
        downlink: navigator.connection.downlink,
        effectiveType: navigator.connection.effectiveType,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    
    // 计算性能分数
    this.calculatePerformanceScore();
    
    return this.metrics;
  }
  
  /**
   * 计算性能分数
   */
  calculatePerformanceScore() {
    let score = 100;
    const { paint, interaction, navigation } = this.metrics;
    
    // LCP评分
    if (paint.LCP) {
      if (paint.LCP > 2500 && paint.LCP <= 4000) {
        score -= 5;
      } else if (paint.LCP > 4000) {
        score -= 15;
      }
    }
    
    // FID评分
    if (interaction.FID) {
      if (interaction.FID > 100 && interaction.FID <= 300) {
        score -= 5;
      } else if (interaction.FID > 300) {
        score -= 15;
      }
    }
    
    // CLS评分
    if (interaction.CLS) {
      if (interaction.CLS > 0.1 && interaction.CLS <= 0.25) {
        score -= 5;
      } else if (interaction.CLS > 0.25) {
        score -= 15;
      }
    }
    
    // TTFB评分
    if (navigation.ttfb) {
      if (navigation.ttfb > 600 && navigation.ttfb <= 1000) {
        score -= 5;
      } else if (navigation.ttfb > 1000) {
        score -= 10;
      }
    }
    
    this.metrics.performanceScore = Math.max(0, score);
    this.logMetric('性能分数', this.metrics.performanceScore);
    
    return this.metrics.performanceScore;
  }
  
  /**
   * 上报性能数据
   */
  report() {
    if (!this.shouldSample) return;
    
    const data = {
      appId: this.options.appId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      timestamp: Date.now()
    };
    
    // 使用Beacon API上报
    if (navigator.sendBeacon && this.options.reportUrl) {
      navigator.sendBeacon(this.options.reportUrl, JSON.stringify(data));
      console.log('[PerformanceMonitor] 性能数据已上报');
    } else {
      // 降级为XHR
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.options.reportUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
    }
    
    return this;
  }
  
  /**
   * 获取性能报告
   */
  getReport() {
    return {
      url: window.location.href,
      timestamp: Date.now(),
      metrics: this.collect(),
      score: this.metrics.performanceScore || this.calculatePerformanceScore()
    };
  }
  
  /**
   * 断开所有观察者
   */
  disconnect() {
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers = [];
  }
}

// 创建全局实例
window.performanceMonitor = new PerformanceMonitor({
  reportConsole: true,
  sampleRate: 1.0  // 开发环境样本率100%
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
}

// 使用示例
// 页面关键点打点
window.addEventListener('DOMContentLoaded', () => {
  window.performanceMonitor.mark('dom-ready');
});

window.addEventListener('load', () => {
  window.performanceMonitor.mark('load-complete');
  window.performanceMonitor.measure('dom-to-load', 'dom-ready', 'load-complete');
  
  // 模拟首屏组件加载完成
  window.performanceMonitor.addCustomMetric('firstScreenReady', performance.now());
}); 