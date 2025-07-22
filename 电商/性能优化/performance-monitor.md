# 前端性能监控与指标分析

## 概述

前端性能监控是电商网站优化的关键环节，通过实时监控和分析各项性能指标，帮助开发者发现性能瓶颈并进行针对性优化。本文档详细介绍了性能监控的核心概念、实现方案和在电商场景中的应用。

## 核心知识点

### 1. 性能指标体系

#### Web Vitals 核心指标

**LCP (Largest Contentful Paint) - 最大内容绘制**
- **定义**：页面主要内容完成渲染的时间
- **标准**：优秀 < 2.5s，需要改进 2.5s-4s，较差 > 4s
- **影响因素**：服务器响应时间、资源加载、客户端渲染

```javascript
// LCP 监控实现
const observeLCP = () => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
  });
  observer.observe({ entryTypes: ['largest-contentful-paint'] });
};
```

**FID (First Input Delay) - 首次输入延迟**
- **定义**：用户首次与页面交互到浏览器响应的时间
- **标准**：优秀 < 100ms，需要改进 100ms-300ms，较差 > 300ms
- **影响因素**：主线程阻塞、JavaScript执行时间

**CLS (Cumulative Layout Shift) - 累积布局偏移**
- **定义**：页面生命周期内所有意外布局偏移的累积分数
- **标准**：优秀 < 0.1，需要改进 0.1-0.25，较差 > 0.25
- **影响因素**：无尺寸的图像、动态内容插入

#### 传统性能指标

```javascript
// 导航时间分析
const analyzeNavigationTiming = () => {
  const timing = performance.timing;
  return {
    // DNS解析时间
    dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
    // TCP连接时间  
    tcpTime: timing.connectEnd - timing.connectStart,
    // 首字节时间
    ttfb: timing.responseStart - timing.navigationStart,
    // DOM解析时间
    domParseTime: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
    // 页面完全加载时间
    loadTime: timing.loadEventEnd - timing.navigationStart
  };
};
```

### 2. 资源性能监控

#### 资源加载分析

```javascript
// 资源性能分析
const analyzeResourcePerformance = () => {
  const resources = performance.getEntriesByType('resource');
  const analysis = {
    totalResources: resources.length,
    totalSize: 0,
    totalDuration: 0,
    byType: {}
  };
  
  resources.forEach(resource => {
    const type = getResourceType(resource.name);
    if (!analysis.byType[type]) {
      analysis.byType[type] = { count: 0, size: 0, duration: 0 };
    }
    
    analysis.byType[type].count++;
    analysis.byType[type].size += resource.transferSize || 0;
    analysis.byType[type].duration += resource.duration;
    
    analysis.totalSize += resource.transferSize || 0;
    analysis.totalDuration += resource.duration;
  });
  
  return analysis;
};
```

#### 缓存命中率监控

```javascript
// 缓存分析
const analyzeCacheHitRate = () => {
  const resources = performance.getEntriesByType('resource');
  let cached = 0;
  let total = resources.length;
  
  resources.forEach(resource => {
    // transferSize为0且decodedBodySize大于0表示从缓存加载
    if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
      cached++;
    }
  });
  
  return {
    hitRate: total > 0 ? (cached / total * 100).toFixed(2) + '%' : '0%',
    cachedResources: cached,
    totalResources: total
  };
};
```

### 3. 内存监控

```javascript
// 内存使用监控
const monitorMemoryUsage = () => {
  if (!performance.memory) return null;
  
  const memory = performance.memory;
  return {
    // 已使用的JS堆内存
    usedJSHeapSize: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
    // 总的JS堆内存
    totalJSHeapSize: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
    // JS堆内存限制
    jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB',
    // 内存使用率
    usageRate: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
  };
};
```

### 4. 用户体验监控

#### 长任务监控

```javascript
// 长任务监控（阻塞主线程超过50ms的任务）
const observeLongTasks = () => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
      console.warn('Long task detected:', {
        duration: entry.duration,
        startTime: entry.startTime,
        name: entry.name
      });
      
      // 上报长任务信息
      reportLongTask({
        duration: entry.duration,
        startTime: entry.startTime,
        url: window.location.href
      });
    });
  });
  
  observer.observe({ entryTypes: ['longtask'] });
};
```

#### 交互响应时间

```javascript
// 交互响应时间监控
const monitorInteractionResponse = () => {
  const interactionEvents = ['click', 'keydown', 'scroll'];
  
  interactionEvents.forEach(eventType => {
    document.addEventListener(eventType, (event) => {
      const startTime = performance.now();
      
      // 使用 requestIdleCallback 或 setTimeout 测量响应时间
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime;
        
        if (responseTime > 100) { // 响应时间超过100ms
          console.warn(`Slow ${eventType} response:`, responseTime + 'ms');
        }
      });
    }, { passive: true });
  });
};
```

## 常见面试问题

### Q1: 如何设计一个完整的前端性能监控系统？

**关键点：**
- 监控指标选择：Web Vitals + 自定义指标
- 数据收集：Performance API + Observer模式
- 数据上报：采样率控制 + 批量上报
- 数据分析：趋势分析 + 异常检测

**架构设计：**
```javascript
class PerformanceMonitorSystem {
  constructor(config) {
    this.config = config;
    this.collectors = new Map(); // 数据收集器
    this.reporters = new Map();  // 数据上报器
    this.analyzers = new Map();  // 数据分析器
  }
  
  // 注册收集器
  registerCollector(name, collector) {
    this.collectors.set(name, collector);
  }
  
  // 启动监控
  start() {
    this.collectors.forEach(collector => collector.start());
    this.scheduleReport();
  }
  
  // 定时上报
  scheduleReport() {
    setInterval(() => {
      this.report();
    }, this.config.reportInterval || 30000);
  }
}
```

### Q2: Web Vitals 指标如何优化？

**LCP 优化策略：**
```javascript
// 1. 优化服务器响应时间
// 使用 CDN、服务器端缓存、数据库优化

// 2. 优化资源加载
// 预加载关键资源
const preloadCriticalResources = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = '/critical-image.jpg';
  link.as = 'image';
  document.head.appendChild(link);
};

// 3. 优化渲染路径
// 内联关键CSS，延迟非关键CSS
const optimizeCriticalRenderPath = () => {
  // 内联关键CSS
  const criticalCSS = `
    .hero { display: block; }
    .product-list { display: grid; }
  `;
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
  
  // 异步加载非关键CSS
  const loadCSS = (href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';
    link.onload = () => { link.media = 'all'; };
    document.head.appendChild(link);
  };
  
  loadCSS('/non-critical.css');
};
```

**FID 优化策略：**
```javascript
// 1. 减少主线程阻塞
const optimizeMainThread = () => {
  // 使用 requestIdleCallback 进行非关键任务
  const performNonCriticalTask = (task) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback((deadline) => {
        if (deadline.timeRemaining() > 0) {
          task();
        }
      });
    } else {
      setTimeout(task, 0);
    }
  };
  
  // 任务分片
  const performLargeTask = (items, processor) => {
    const chunk = items.splice(0, 10);
    chunk.forEach(processor);
    
    if (items.length > 0) {
      setTimeout(() => performLargeTask(items, processor), 0);
    }
  };
};

// 2. 代码分割和懒加载
const lazyLoadComponents = async () => {
  const { default: HeavyComponent } = await import('./HeavyComponent');
  return HeavyComponent;
};
```

**CLS 优化策略：**
```javascript
// 1. 为图像和视频元素设置尺寸属性
const preventLayoutShift = () => {
  // 为图像设置宽高
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.width || !img.height) {
      // 使用 aspect-ratio 或固定尺寸
      img.style.aspectRatio = '16/9';
    }
  });
  
  // 为动态内容预留空间
  const reserveSpace = (selector, height) => {
    const element = document.querySelector(selector);
    if (element) {
      element.style.minHeight = height + 'px';
    }
  };
  
  reserveSpace('.dynamic-content', 200);
};

// 2. 优化字体加载
const optimizeFontLoading = () => {
  // 使用 font-display: swap
  const fontFace = new FontFace(
    'CustomFont',
    'url(/fonts/custom-font.woff2)',
    { display: 'swap' }
  );
  
  fontFace.load().then(() => {
    document.fonts.add(fontFace);
  });
};
```

### Q3: 如何进行性能数据的收集和上报？

**数据收集策略：**
```javascript
class PerformanceDataCollector {
  constructor() {
    this.buffer = [];
    this.maxBufferSize = 100;
  }
  
  // 收集性能数据
  collect(metric) {
    this.buffer.push({
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
    
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }
  
  // 批量上报
  async flush() {
    if (this.buffer.length === 0) return;
    
    const data = this.buffer.splice(0);
    
    try {
      // 使用 sendBeacon 确保数据发送
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/performance', JSON.stringify(data));
      } else {
        await fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
    } catch (error) {
      console.error('Performance data report failed:', error);
      // 重新放回缓冲区
      this.buffer.unshift(...data);
    }
  }
}
```

**采样率控制：**
```javascript
class SampledReporter {
  constructor(sampleRate = 0.1) {
    this.sampleRate = sampleRate;
    this.sessionSampled = Math.random() < sampleRate;
  }
  
  shouldReport() {
    return this.sessionSampled;
  }
  
  report(data) {
    if (this.shouldReport()) {
      // 执行上报
      this.doReport(data);
    }
  }
}
```

### Q4: 如何分析和解读性能数据？

**性能数据分析：**
```javascript
class PerformanceAnalyzer {
  // 计算百分位数
  calculatePercentile(values, percentile) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
  
  // 性能评分
  calculatePerformanceScore(metrics) {
    const weights = {
      lcp: 0.25,
      fid: 0.25,
      cls: 0.25,
      fcp: 0.15,
      ttfb: 0.1
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([metric, weight]) => {
      if (metrics[metric] !== undefined) {
        const score = this.getMetricScore(metric, metrics[metric]);
        totalScore += score * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }
  
  getMetricScore(metric, value) {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 }
    };
    
    const threshold = thresholds[metric];
    if (!threshold) return 50;
    
    if (value <= threshold.good) return 90;
    if (value <= threshold.poor) return 50;
    return 10;
  }
  
  // 趋势分析
  analyzeTrend(historicalData) {
    if (historicalData.length < 2) return 'insufficient_data';
    
    const recent = historicalData.slice(-7); // 最近7天
    const previous = historicalData.slice(-14, -7); // 前7天
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const previousAvg = previous.reduce((sum, val) => sum + val, 0) / previous.length;
    
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    if (change > 10) return 'degrading';
    if (change < -10) return 'improving';
    return 'stable';
  }
}
```

## 电商场景应用

### 1. 商品列表页性能监控

```javascript
class ProductListMonitor {
  constructor() {
    this.renderStartTime = null;
    this.productCount = 0;
  }
  
  // 开始监控商品列表渲染
  startListRender() {
    this.renderStartTime = performance.now();
    this.productCount = 0;
  }
  
  // 监控单个商品渲染
  onProductRender() {
    this.productCount++;
  }
  
  // 完成列表渲染
  endListRender() {
    if (this.renderStartTime) {
      const renderTime = performance.now() - this.renderStartTime;
      const efficiency = this.productCount / renderTime; // 每毫秒渲染的商品数
      
      // 上报性能数据
      performanceMonitor.report({
        type: 'product_list_render',
        renderTime,
        productCount: this.productCount,
        efficiency,
        timestamp: Date.now()
      });
    }
  }
}

// 使用示例
const listMonitor = new ProductListMonitor();

// 在商品列表开始渲染时调用
listMonitor.startListRender();

// 在每个商品渲染完成时调用
document.addEventListener('product-rendered', () => {
  listMonitor.onProductRender();
});

// 在列表渲染完成时调用
document.addEventListener('list-render-complete', () => {
  listMonitor.endListRender();
});
```

### 2. 购物车操作性能监控

```javascript
class CartOperationMonitor {
  // 监控添加到购物车操作
  monitorAddToCart(productId) {
    const startTime = performance.now();
    
    return {
      end: (success = true) => {
        const duration = performance.now() - startTime;
        
        performanceMonitor.report({
          type: 'cart_add_operation',
          productId,
          duration,
          success,
          timestamp: Date.now()
        });
        
        // 如果操作时间过长，记录为性能问题
        if (duration > 1000) {
          console.warn(`Slow cart operation: ${duration}ms`);
        }
      }
    };
  }
  
  // 监控购物车页面加载
  monitorCartPageLoad() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.name.includes('/cart')) {
          performanceMonitor.report({
            type: 'cart_page_load',
            duration: entry.duration,
            transferSize: entry.transferSize,
            timestamp: Date.now()
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation'] });
  }
}
```

### 3. 搜索功能性能监控

```javascript
class SearchPerformanceMonitor {
  constructor() {
    this.searchStartTime = null;
    this.searchQuery = '';
  }
  
  // 开始搜索
  startSearch(query) {
    this.searchQuery = query;
    this.searchStartTime = performance.now();
  }
  
  // 搜索完成
  endSearch(resultCount) {
    if (this.searchStartTime) {
      const searchDuration = performance.now() - this.searchStartTime;
      
      performanceMonitor.report({
        type: 'search_operation',
        query: this.searchQuery,
        duration: searchDuration,
        resultCount,
        efficiency: resultCount / searchDuration, // 每毫秒搜索到的结果数
        timestamp: Date.now()
      });
      
      this.searchStartTime = null;
    }
  }
  
  // 监控搜索建议响应时间
  monitorSearchSuggestions() {
    let suggestionTimer = null;
    
    document.getElementById('search-input').addEventListener('input', (e) => {
      clearTimeout(suggestionTimer);
      const startTime = performance.now();
      
      suggestionTimer = setTimeout(() => {
        // 模拟搜索建议请求
        fetch(`/api/search/suggestions?q=${e.target.value}`)
          .then(() => {
            const responseTime = performance.now() - startTime;
            
            performanceMonitor.report({
              type: 'search_suggestions',
              query: e.target.value,
              responseTime,
              timestamp: Date.now()
            });
          });
      }, 300);
    });
  }
}
```

## 性能优化建议

### 1. 基于监控数据的优化策略

```javascript
class PerformanceOptimizer {
  constructor(monitor) {
    this.monitor = monitor;
  }
  
  // 根据LCP数据优化
  optimizeLCP(lcpData) {
    if (lcpData.value > 2500) {
      console.log('LCP optimization suggestions:');
      
      // 检查关键资源
      const criticalResources = this.identifyCriticalResources();
      criticalResources.forEach(resource => {
        if (resource.duration > 1000) {
          console.log(`- Optimize ${resource.name}: ${resource.duration}ms`);
        }
      });
      
      // 建议预加载
      this.suggestPreloading(lcpData.element);
    }
  }
  
  identifyCriticalResources() {
    return performance.getEntriesByType('resource')
      .filter(entry => entry.startTime < 2500)
      .sort((a, b) => b.duration - a.duration);
  }
  
  suggestPreloading(element) {
    if (element && element.tagName === 'IMG') {
      console.log(`Consider preloading: ${element.src}`);
    }
  }
  
  // 根据FID数据优化
  optimizeFID(fidData) {
    if (fidData.value > 100) {
      console.log('FID optimization suggestions:');
      console.log('- Consider code splitting');
      console.log('- Use requestIdleCallback for non-critical tasks');
      console.log('- Optimize JavaScript execution');
    }
  }
  
  // 根据CLS数据优化
  optimizeCLS(clsData) {
    if (clsData.value > 0.1) {
      console.log('CLS optimization suggestions:');
      clsData.entries.forEach(entry => {
        console.log(`- Layout shift detected at ${entry.startTime}ms`);
        entry.sources.forEach(source => {
          console.log(`  - Element: ${source.node?.tagName || 'Unknown'}`);
        });
      });
    }
  }
}

// 使用优化器
const optimizer = new PerformanceOptimizer(performanceMonitor);

// 监听性能数据并提供优化建议
performanceMonitor.on('lcp', (data) => optimizer.optimizeLCP(data));
performanceMonitor.on('fid', (data) => optimizer.optimizeFID(data));
performanceMonitor.on('cls', (data) => optimizer.optimizeCLS(data));
```

### 2. 性能预算管理

```javascript
class PerformanceBudget {
  constructor() {
    this.budgets = {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fcp: 1800,
      ttfb: 800,
      totalJSSize: 500 * 1024, // 500KB
      totalCSSSize: 100 * 1024, // 100KB
      totalImageSize: 1000 * 1024 // 1MB
    };
  }
  
  // 检查是否超出预算
  checkBudget(metrics) {
    const violations = [];
    
    Object.entries(this.budgets).forEach(([metric, budget]) => {
      if (metrics[metric] && metrics[metric] > budget) {
        violations.push({
          metric,
          value: metrics[metric],
          budget,
          excess: metrics[metric] - budget
        });
      }
    });
    
    return violations;
  }
  
  // 生成预算报告
  generateReport(violations) {
    if (violations.length === 0) {
      console.log('✅ All performance budgets are met!');
      return;
    }
    
    console.log('❌ Performance budget violations:');
    violations.forEach(violation => {
      console.log(`- ${violation.metric}: ${violation.value} (budget: ${violation.budget}, excess: ${violation.excess})`);
    });
  }
}

// 使用预算管理
const budget = new PerformanceBudget();
const currentMetrics = performanceMonitor.getAllMetrics();
const violations = budget.checkBudget(currentMetrics);
budget.generateReport(violations);
```

### 3. 自动化性能测试

```javascript
class AutomatedPerformanceTest {
  constructor() {
    this.testSuites = [];
  }
  
  // 添加测试套件
  addTestSuite(name, tests) {
    this.testSuites.push({ name, tests });
  }
  
  // 运行所有测试
  async runAllTests() {
    const results = [];
    
    for (const suite of this.testSuites) {
      const suiteResults = await this.runTestSuite(suite);
      results.push(suiteResults);
    }
    
    return results;
  }
  
  async runTestSuite(suite) {
    const results = {
      name: suite.name,
      tests: [],
      passed: 0,
      failed: 0
    };
    
    for (const test of suite.tests) {
      try {
        const result = await test.run();
        results.tests.push({
          name: test.name,
          status: 'passed',
          result
        });
        results.passed++;
      } catch (error) {
        results.tests.push({
          name: test.name,
          status: 'failed',
          error: error.message
        });
        results.failed++;
      }
    }
    
    return results;
  }
}

// 性能测试示例
const perfTest = new AutomatedPerformanceTest();

perfTest.addTestSuite('Page Load Performance', [
  {
    name: 'LCP should be under 2.5s',
    run: async () => {
      const lcp = await measureLCP();
      if (lcp > 2500) {
        throw new Error(`LCP is ${lcp}ms, exceeds 2500ms threshold`);
      }
      return lcp;
    }
  },
  {
    name: 'FID should be under 100ms',
    run: async () => {
      const fid = await measureFID();
      if (fid > 100) {
        throw new Error(`FID is ${fid}ms, exceeds 100ms threshold`);
      }
      return fid;
    }
  }
]);

// 运行测试
perfTest.runAllTests().then(results => {
  console.log('Performance test results:', results);
});
```

## 监控工具集成

### 1. 与第三方监控服务集成

```javascript
class ThirdPartyIntegration {
  constructor() {
    this.integrations = new Map();
  }
  
  // 集成Google Analytics
  integrateGA(trackingId) {
    gtag('config', trackingId, {
      custom_map: {
        'custom_lcp': 'lcp_value',
        'custom_fid': 'fid_value',
        'custom_cls': 'cls_value'
      }
    });
    
    this.integrations.set('ga', {
      report: (metric, value) => {
        gtag('event', 'performance_metric', {
          event_category: 'Performance',
          event_label: metric,
          value: Math.round(value),
          custom_lcp: metric === 'lcp' ? value : undefined,
          custom_fid: metric === 'fid' ? value : undefined,
          custom_cls: metric === 'cls' ? value : undefined
        });
      }
    });
  }
  
  // 集成Sentry
  integrateSentry() {
    this.integrations.set('sentry', {
      report: (metric, value) => {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `${metric}: ${value}`,
          level: value > this.getThreshold(metric) ? 'warning' : 'info'
        });
      }
    });
  }
  
  getThreshold(metric) {
    const thresholds = {
      lcp: 2500,
      fid: 100,
      cls: 0.1
    };
    return thresholds[metric] || Infinity;
  }
  
  // 向所有集成服务报告
  reportToAll(metric, value) {
    this.integrations.forEach((integration, name) => {
      try {
        integration.report(metric, value);
      } catch (error) {
        console.error(`Failed to report to ${name}:`, error);
      }
    });
  }
}
```

### 2. 实时监控仪表板

```javascript
class PerformanceDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.metrics = new Map();
    this.charts = new Map();
    this.init();
  }
  
  init() {
    this.createLayout();
    this.startRealTimeUpdate();
  }
  
  createLayout() {
    this.container.innerHTML = `
      <div class="dashboard-header">
        <h2>Performance Dashboard</h2>
        <div class="status-indicators">
          <div id="lcp-status" class="status-indicator">
            <span class="label">LCP</span>
            <span class="value">-</span>
          </div>
          <div id="fid-status" class="status-indicator">
            <span class="label">FID</span>
            <span class="value">-</span>
          </div>
          <div id="cls-status" class="status-indicator">
            <span class="label">CLS</span>
            <span class="value">-</span>
          </div>
        </div>
      </div>
      <div class="dashboard-content">
        <div id="performance-charts"></div>
        <div id="resource-analysis"></div>
        <div id="error-log"></div>
      </div>
    `;
  }
  
  updateMetric(name, value) {
    this.metrics.set(name, value);
    this.updateUI(name, value);
  }
  
  updateUI(name, value) {
    const statusElement = document.getElementById(`${name}-status`);
    if (statusElement) {
      const valueElement = statusElement.querySelector('.value');
      valueElement.textContent = this.formatValue(name, value);
      
      // 根据阈值设置状态颜色
      const threshold = this.getThreshold(name);
      statusElement.className = `status-indicator ${value > threshold ? 'warning' : 'good'}`;
    }
  }
  
  formatValue(metric, value) {
    switch (metric) {
      case 'lcp':
      case 'fid':
        return Math.round(value) + 'ms';
      case 'cls':
        return value.toFixed(3);
      default:
        return value;
    }
  }
  
  startRealTimeUpdate() {
    setInterval(() => {
      // 获取最新性能数据
      const currentMetrics = performanceMonitor.getAllMetrics();
      
      Object.entries(currentMetrics).forEach(([name, value]) => {
        if (typeof value === 'object' && value.value !== undefined) {
          this.updateMetric(name, value.value);
        } else if (typeof value === 'number') {
          this.updateMetric(name, value);
        }
      });
    }, 1000);
  }
}

// 初始化仪表板
const dashboard = new PerformanceDashboard('performance-dashboard');
```

## 总结

前端性能监控是一个复杂但至关重要的系统工程，需要从以下几个方面进行全面考虑：

### 关键要点

1. **指标体系完整性**：覆盖Web Vitals、资源加载、内存使用、用户体验等多个维度
2. **数据收集策略**：合理的采样率、批量上报、容错处理
3. **实时监控能力**：长任务检测、异常告警、趋势分析
4. **业务场景结合**：电商特定的性能监控点和优化策略
5. **自动化集成**：CI/CD集成、第三方服务对接、仪表板展示

### 面试重点

- **技术实现**：Performance API、Observer模式、数据上报机制
- **指标理解**：各项性能指标的含义、阈值和优化方向
- **问题分析**：如何根据监控数据定位和解决性能问题
- **系统设计**：如何设计一个完整的性能监控系统
- **业务结合**：如何结合具体业务场景进行性能优化

掌握这些知识点，能够帮助你在面试中展现对前端性能监控的深入理解和实践能力。 