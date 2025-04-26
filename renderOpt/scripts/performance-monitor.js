/**
 * performance-monitor.js
 * 用于监控和收集页面性能数据的工具
 */

(function() {
  class PerformanceMonitor {
    constructor() {
      this.metrics = {};
      this.initMetrics();
      this.setupListeners();
    }

    initMetrics() {
      // 初始化基本指标
      this.metrics = {
        navigation: null,       // 导航计时信息
        paint: {                // 绘制指标
          FP: 0,                // First Paint
          FCP: 0,               // First Contentful Paint
          LCP: 0                // Largest Contentful Paint
        },
        interaction: {          // 交互指标
          FID: 0,               // First Input Delay
          TTI: 0,               // Time to Interactive
          TBT: 0                // Total Blocking Time
        },
        resources: {            // 资源加载
          js: [],               // JavaScript文件
          css: [],              // CSS文件
          img: [],              // 图片
          api: []               // API请求
        },
        memory: {               // 内存使用
          jsHeapSizeLimit: 0,
          totalJSHeapSize: 0,
          usedJSHeapSize: 0
        },
        custom: {}              // 自定义指标
      };
    }

    setupListeners() {
      // 监听导航计时
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navEntry = performance.getEntriesByType('navigation')[0];
          this.metrics.navigation = {
            domComplete: navEntry.domComplete,
            domContentLoaded: navEntry.domContentLoadedEventEnd,
            domInteractive: navEntry.domInteractive,
            loadEventEnd: navEntry.loadEventEnd,
            responseEnd: navEntry.responseEnd,
            ttfb: navEntry.responseStart - navEntry.requestStart
          };
          
          // 收集资源数据
          this.collectResourceTiming();
          
          // 分析首屏性能
          this.analyzeFirstScreen();
          
          // 上报数据
          this.sendMetrics();
        }, 0);
      });

      // 绘制指标
      this.observePaintMetrics();
      
      // 交互指标
      this.observeInteractionMetrics();
      
      // 内存数据
      this.observeMemoryUsage();
    }

    observePaintMetrics() {
      // 观察绘制指标
      const paintObserver = new PerformanceObserver(entries => {
        for (const entry of entries.getEntries()) {
          if (entry.name === 'first-paint') {
            this.metrics.paint.FP = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            this.metrics.paint.FCP = entry.startTime;
          }
        }
      });
      
      paintObserver.observe({ type: 'paint', buffered: true });
      
      // LCP观察
      const lcpObserver = new PerformanceObserver(entries => {
        const lastEntry = entries.getEntries().pop();
        if (lastEntry) {
          this.metrics.paint.LCP = lastEntry.startTime;
        }
      });
      
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    }

    observeInteractionMetrics() {
      // FID观察
      const fidObserver = new PerformanceObserver(entries => {
        const firstInput = entries.getEntries()[0];
        if (firstInput) {
          this.metrics.interaction.FID = firstInput.processingStart - firstInput.startTime;
        }
      });
      
      fidObserver.observe({ type: 'first-input', buffered: true });
      
      // 计算TTI和TBT (简化实现)
      setTimeout(() => {
        // 在真实环境中，这里应该使用更复杂的算法
        const navTiming = performance.getEntriesByType('navigation')[0];
        if (navTiming) {
          // 简化的TTI计算 - 仅用于演示
          this.metrics.interaction.TTI = navTiming.domInteractive;
          
          // 简化的TBT计算 - 仅用于演示
          this.metrics.interaction.TBT = navTiming.domComplete - navTiming.domInteractive;
        }
      }, 5000);
    }
    
    observeMemoryUsage() {
      // 内存使用监控 - 注意：performance.memory 在某些浏览器中可能不可用
      if (performance.memory) {
        this.metrics.memory = {
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          usedJSHeapSize: performance.memory.usedJSHeapSize
        };
      }
      
      // 定期采样内存使用
      const memoryInterval = setInterval(() => {
        if (performance.memory) {
          this.metrics.memory.usedJSHeapSize = performance.memory.usedJSHeapSize;
        }
      }, 10000);
      
      // 页面卸载时清除定时器
      window.addEventListener('beforeunload', () => {
        clearInterval(memoryInterval);
      });
    }
    
    collectResourceTiming() {
      // 收集资源加载信息
      const resourceEntries = performance.getEntriesByType('resource');
      
      resourceEntries.forEach(entry => {
        const resource = {
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize,
          startTime: entry.startTime,
          initiatorType: entry.initiatorType
        };
        
        // 根据资源类型进行分类
        if (entry.name.endsWith('.js')) {
          this.metrics.resources.js.push(resource);
        } else if (entry.name.endsWith('.css')) {
          this.metrics.resources.css.push(resource);
        } else if (entry.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
          this.metrics.resources.img.push(resource);
        } else if (entry.name.includes('/api/')) {
          this.metrics.resources.api.push(resource);
        }
      });
    }
    
    analyzeFirstScreen() {
      // 首屏分析
      const screenHeight = window.innerHeight;
      const visibleImages = Array.from(document.querySelectorAll('img'))
        .filter(img => {
          const rect = img.getBoundingClientRect();
          return rect.top < screenHeight;
        });
      
      // 计算首屏资源加载时间
      const imageLoadTimes = visibleImages.map(img => {
        if (img.complete && img.dataset.loadTime) {
          return parseFloat(img.dataset.loadTime);
        }
        return 0;
      });
      
      const maxImageLoadTime = Math.max(0, ...imageLoadTimes);
      this.metrics.custom.firstScreenTime = Math.max(
        this.metrics.paint.FCP,
        maxImageLoadTime
      );
    }
    
    // 用户自定义指标
    mark(name) {
      performance.mark(name);
    }
    
    measure(name, startMark, endMark) {
      performance.measure(name, startMark, endMark);
      const measureEntry = performance.getEntriesByName(name, 'measure')[0];
      if (measureEntry) {
        this.metrics.custom[name] = measureEntry.duration;
      }
    }
    
    // 添加自定义指标
    addCustomMetric(name, value) {
      this.metrics.custom[name] = value;
    }
    
    // 上报数据
    sendMetrics() {
      console.log('Performance metrics collected:', this.metrics);
      
      // 这里可以添加数据上报逻辑
      // 例如：使用beacon API进行上报
      if (navigator.sendBeacon) {
        // 在实际应用中，这里应该是实际的数据收集端点
        navigator.sendBeacon('/api/performance-metrics', JSON.stringify(this.metrics));
      } else {
        // 降级处理：使用异步XHR
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/performance-metrics', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(this.metrics));
      }
    }
    
    // 生成性能报告
    generateReport() {
      const report = {
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        metrics: this.metrics,
        summary: {
          loadTime: this.metrics.navigation ? this.metrics.navigation.loadEventEnd : 0,
          firstPaint: this.metrics.paint.FP,
          firstContentfulPaint: this.metrics.paint.FCP,
          largestContentfulPaint: this.metrics.paint.LCP,
          firstInputDelay: this.metrics.interaction.FID,
          timeToInteractive: this.metrics.interaction.TTI,
          resourceCount: {
            js: this.metrics.resources.js.length,
            css: this.metrics.resources.css.length,
            img: this.metrics.resources.img.length,
            api: this.metrics.resources.api.length
          }
        }
      };
      
      return report;
    }
  }

  // 创建并导出单例
  window.perfMonitor = new PerformanceMonitor();
})(); 