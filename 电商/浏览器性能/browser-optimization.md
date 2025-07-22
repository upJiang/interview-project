# 浏览器性能排查与优化手段

## 概述

浏览器性能优化是提升用户体验的关键环节，特别在电商网站中，页面加载速度直接影响转化率。本文档详细介绍了浏览器性能分析工具的使用方法、常见性能问题的排查技巧以及系统性的优化策略。

## 核心知识点

### 1. 性能分析工具

#### Chrome DevTools Performance面板

```javascript
/**
 * Performance API 性能监控
 */
class PerformanceAnalyzer {
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
    this.observers = new Map();
  }
  
  // 开始性能标记
  mark(name) {
    const markName = `${name}-start`;
    performance.mark(markName);
    this.marks.set(name, { start: performance.now() });
    
    return {
      end: () => this.endMark(name)
    };
  }
  
  // 结束性能标记
  endMark(name) {
    const markData = this.marks.get(name);
    if (!markData) {
      console.warn(`未找到标记: ${name}`);
      return;
    }
    
    const endMarkName = `${name}-end`;
    performance.mark(endMarkName);
    
    const measureName = name;
    performance.measure(measureName, `${name}-start`, endMarkName);
    
    const measure = performance.getEntriesByName(measureName, 'measure')[0];
    const duration = measure ? measure.duration : performance.now() - markData.start;
    
    this.measures.set(name, {
      duration,
      startTime: markData.start,
      endTime: performance.now()
    });
    
    console.log(`性能测量 - ${name}: ${duration.toFixed(2)}ms`);
    
    return duration;
  }
  
  // 获取页面加载性能
  getPageLoadPerformance() {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    if (!navigation) {
      return null;
    }
    
    return {
      // DNS解析时间
      dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
      
      // TCP连接时间
      tcpTime: navigation.connectEnd - navigation.connectStart,
      
      // SSL握手时间
      sslTime: navigation.secureConnectionStart > 0 ? 
        navigation.connectEnd - navigation.secureConnectionStart : 0,
      
      // 请求响应时间
      requestTime: navigation.responseEnd - navigation.requestStart,
      
      // DOM解析时间
      domParseTime: navigation.domContentLoadedEventEnd - navigation.responseEnd,
      
      // 资源加载时间
      resourceLoadTime: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
      
      // 总加载时间
      totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      
      // 首字节时间 (TTFB)
      ttfb: navigation.responseStart - navigation.requestStart,
      
      // DOM Ready时间
      domReady: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      
      // 完全加载时间
      loadComplete: navigation.loadEventEnd - navigation.fetchStart
    };
  }
  
  // 获取资源加载性能
  getResourcePerformance() {
    const resources = performance.getEntriesByType('resource');
    
    const analysis = {
      totalResources: resources.length,
      totalSize: 0,
      totalDuration: 0,
      byType: {},
      slowResources: [],
      cachedResources: [],
      failedResources: []
    };
    
    resources.forEach(resource => {
      const type = this.getResourceType(resource.name);
      
      if (!analysis.byType[type]) {
        analysis.byType[type] = {
          count: 0,
          totalSize: 0,
          totalDuration: 0,
          averageDuration: 0
        };
      }
      
      const size = resource.transferSize || 0;
      const duration = resource.duration;
      
      analysis.byType[type].count++;
      analysis.byType[type].totalSize += size;
      analysis.byType[type].totalDuration += duration;
      
      analysis.totalSize += size;
      analysis.totalDuration += duration;
      
      // 检测慢资源（超过2秒）
      if (duration > 2000) {
        analysis.slowResources.push({
          name: resource.name,
          type,
          duration,
          size
        });
      }
      
      // 检测缓存资源
      if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
        analysis.cachedResources.push({
          name: resource.name,
          type,
          size: resource.decodedBodySize
        });
      }
      
      // 检测失败资源
      if (resource.responseEnd === 0) {
        analysis.failedResources.push({
          name: resource.name,
          type
        });
      }
    });
    
    // 计算平均值
    Object.keys(analysis.byType).forEach(type => {
      const typeData = analysis.byType[type];
      typeData.averageDuration = typeData.totalDuration / typeData.count;
    });
    
    return analysis;
  }
  
  // 获取资源类型
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
      'eot': 'font',
      'mp4': 'video',
      'webm': 'video',
      'mp3': 'audio',
      'wav': 'audio'
    };
    
    return typeMap[extension] || 'other';
  }
  
  // 监控长任务
  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          console.warn('检测到长任务:', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
          });
          
          // 记录长任务信息
          this.recordLongTask(entry);
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    }
  }
  
  // 记录长任务
  recordLongTask(entry) {
    const longTask = {
      duration: entry.duration,
      startTime: entry.startTime,
      name: entry.name,
      timestamp: Date.now()
    };
    
    // 发送到监控系统
    this.sendToMonitoring('longtask', longTask);
  }
  
  // 监控内存使用
  monitorMemoryUsage() {
    if (!performance.memory) {
      console.warn('浏览器不支持内存监控');
      return;
    }
    
    const getMemoryInfo = () => ({
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      timestamp: Date.now()
    });
    
    // 初始内存信息
    const initialMemory = getMemoryInfo();
    console.log('初始内存使用:', initialMemory);
    
    // 定期监控内存使用
    const memoryInterval = setInterval(() => {
      const currentMemory = getMemoryInfo();
      
      // 检测内存泄漏（内存持续增长）
      if (currentMemory.used > initialMemory.used * 2) {
        console.warn('可能存在内存泄漏:', currentMemory);
        this.sendToMonitoring('memory-leak', currentMemory);
      }
      
      // 检测内存压力
      if (currentMemory.used / currentMemory.limit > 0.8) {
        console.warn('内存使用过高:', currentMemory);
        this.sendToMonitoring('high-memory', currentMemory);
      }
    }, 10000); // 每10秒检查一次
    
    // 存储定时器ID用于清理
    this.memoryMonitorInterval = memoryInterval;
  }
  
  // 生成性能报告
  generateReport() {
    const pageLoad = this.getPageLoadPerformance();
    const resources = this.getResourcePerformance();
    const customMeasures = Array.from(this.measures.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
    
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      pageLoad,
      resources,
      customMeasures,
      recommendations: this.generateRecommendations(pageLoad, resources)
    };
    
    return report;
  }
  
  // 生成优化建议
  generateRecommendations(pageLoad, resources) {
    const recommendations = [];
    
    // 页面加载时间建议
    if (pageLoad && pageLoad.totalLoadTime > 3000) {
      recommendations.push({
        type: 'page-load',
        priority: 'high',
        message: `页面加载时间过长 (${(pageLoad.totalLoadTime / 1000).toFixed(2)}s)`,
        suggestions: [
          '优化关键渲染路径',
          '减少HTTP请求数量',
          '启用资源压缩',
          '使用CDN加速'
        ]
      });
    }
    
    // TTFB建议
    if (pageLoad && pageLoad.ttfb > 1000) {
      recommendations.push({
        type: 'ttfb',
        priority: 'high',
        message: `首字节时间过长 (${pageLoad.ttfb.toFixed(2)}ms)`,
        suggestions: [
          '优化服务器响应时间',
          '使用服务器端缓存',
          '优化数据库查询',
          '使用CDN'
        ]
      });
    }
    
    // 资源大小建议
    if (resources.totalSize > 2 * 1024 * 1024) { // 2MB
      recommendations.push({
        type: 'resource-size',
        priority: 'medium',
        message: `资源总大小过大 (${(resources.totalSize / 1024 / 1024).toFixed(2)}MB)`,
        suggestions: [
          '启用Gzip/Brotli压缩',
          '优化图片大小和格式',
          '移除未使用的代码',
          '使用代码分割'
        ]
      });
    }
    
    // 慢资源建议
    if (resources.slowResources.length > 0) {
      recommendations.push({
        type: 'slow-resources',
        priority: 'medium',
        message: `发现${resources.slowResources.length}个慢加载资源`,
        suggestions: [
          '优化资源加载顺序',
          '使用资源预加载',
          '考虑使用WebP等现代图片格式',
          '优化第三方资源'
        ]
      });
    }
    
    // 失败资源建议
    if (resources.failedResources.length > 0) {
      recommendations.push({
        type: 'failed-resources',
        priority: 'high',
        message: `发现${resources.failedResources.length}个加载失败的资源`,
        suggestions: [
          '检查资源URL是否正确',
          '确保资源服务器正常运行',
          '添加资源加载失败的降级处理'
        ]
      });
    }
    
    return recommendations;
  }
  
  // 发送监控数据
  sendToMonitoring(type, data) {
    // 这里可以发送到实际的监控系统
    console.log(`监控数据 - ${type}:`, data);
    
    // 示例：发送到监控API
    if (typeof fetch !== 'undefined') {
      fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: Date.now(),
          url: window.location.href
        })
      }).catch(error => {
        console.error('发送监控数据失败:', error);
      });
    }
  }
  
  // 清理资源
  cleanup() {
    // 停止所有观察器
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // 清理内存监控定时器
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
    
    // 清理性能数据
    this.marks.clear();
    this.measures.clear();
  }
}

// 使用示例
const analyzer = new PerformanceAnalyzer();

// 监控页面加载
document.addEventListener('DOMContentLoaded', () => {
  const loadMark = analyzer.mark('page-load');
  
  window.addEventListener('load', () => {
    loadMark.end();
    
    // 生成性能报告
    const report = analyzer.generateReport();
    console.log('性能报告:', report);
  });
});

// 监控长任务和内存
analyzer.observeLongTasks();
analyzer.monitorMemoryUsage();
```

#### Lighthouse 自动化性能测试

```javascript
/**
 * Lighthouse 自动化性能测试
 */
class LighthouseAutomation {
  constructor() {
    this.config = {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        },
        emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
  }
  
  // 运行Lighthouse测试（需要在Node.js环境中使用lighthouse包）
  async runLighthouseTest(url, options = {}) {
    const lighthouse = require('lighthouse');
    const chromeLauncher = require('chrome-launcher');
    
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
    });
    
    try {
      const result = await lighthouse(url, {
        port: chrome.port,
        ...this.config,
        ...options
      });
      
      await chrome.kill();
      
      return this.parseLighthouseResult(result);
      
    } catch (error) {
      await chrome.kill();
      throw error;
    }
  }
  
  // 解析Lighthouse结果
  parseLighthouseResult(result) {
    const { lhr } = result;
    
    const scores = {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
      pwa: lhr.categories.pwa ? Math.round(lhr.categories.pwa.score * 100) : null
    };
    
    const metrics = {
      firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
      largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
      firstInputDelay: lhr.audits['max-potential-fid'].numericValue,
      cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue,
      speedIndex: lhr.audits['speed-index'].numericValue,
      totalBlockingTime: lhr.audits['total-blocking-time'].numericValue
    };
    
    const opportunities = lhr.audits['opportunities'] ? 
      Object.keys(lhr.audits)
        .filter(key => lhr.audits[key].details && lhr.audits[key].details.type === 'opportunity')
        .map(key => ({
          id: key,
          title: lhr.audits[key].title,
          description: lhr.audits[key].description,
          score: lhr.audits[key].score,
          numericValue: lhr.audits[key].numericValue,
          displayValue: lhr.audits[key].displayValue
        }))
        .sort((a, b) => b.numericValue - a.numericValue) : [];
    
    const diagnostics = Object.keys(lhr.audits)
      .filter(key => 
        lhr.audits[key].score !== null && 
        lhr.audits[key].score < 1 &&
        lhr.audits[key].details
      )
      .map(key => ({
        id: key,
        title: lhr.audits[key].title,
        description: lhr.audits[key].description,
        score: lhr.audits[key].score,
        displayValue: lhr.audits[key].displayValue
      }));
    
    return {
      url: lhr.finalUrl,
      timestamp: lhr.fetchTime,
      scores,
      metrics,
      opportunities,
      diagnostics,
      runtime: {
        runtimeError: lhr.runtimeError,
        runWarnings: lhr.runWarnings
      }
    };
  }
  
  // 批量测试多个页面
  async batchTest(urls, options = {}) {
    const results = [];
    
    for (const url of urls) {
      try {
        console.log(`测试页面: ${url}`);
        const result = await this.runLighthouseTest(url, options);
        results.push({ url, result, success: true });
        
        // 避免过于频繁的请求
        await this.delay(2000);
      } catch (error) {
        console.error(`测试失败 ${url}:`, error.message);
        results.push({ url, error: error.message, success: false });
      }
    }
    
    return results;
  }
  
  // 生成性能报告
  generatePerformanceReport(results) {
    const summary = {
      totalPages: results.length,
      successfulTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      averageScores: {
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0
      },
      commonIssues: new Map(),
      topOpportunities: []
    };
    
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length > 0) {
      // 计算平均分数
      successfulResults.forEach(({ result }) => {
        summary.averageScores.performance += result.scores.performance;
        summary.averageScores.accessibility += result.scores.accessibility;
        summary.averageScores.bestPractices += result.scores.bestPractices;
        summary.averageScores.seo += result.scores.seo;
      });
      
      Object.keys(summary.averageScores).forEach(key => {
        summary.averageScores[key] = Math.round(
          summary.averageScores[key] / successfulResults.length
        );
      });
      
      // 统计常见问题
      successfulResults.forEach(({ result }) => {
        result.diagnostics.forEach(diagnostic => {
          const count = summary.commonIssues.get(diagnostic.id) || 0;
          summary.commonIssues.set(diagnostic.id, count + 1);
        });
      });
      
      // 获取最常见的优化机会
      const opportunityMap = new Map();
      successfulResults.forEach(({ result }) => {
        result.opportunities.forEach(opportunity => {
          const existing = opportunityMap.get(opportunity.id) || {
            ...opportunity,
            count: 0,
            totalSavings: 0
          };
          existing.count++;
          existing.totalSavings += opportunity.numericValue || 0;
          opportunityMap.set(opportunity.id, existing);
        });
      });
      
      summary.topOpportunities = Array.from(opportunityMap.values())
        .sort((a, b) => b.totalSavings - a.totalSavings)
        .slice(0, 10);
    }
    
    return summary;
  }
  
  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 导出报告为HTML
  generateHTMLReport(summary, results) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>性能测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .score { display: inline-block; margin: 10px; padding: 15px; border-radius: 8px; text-align: center; }
        .score.good { background: #4CAF50; color: white; }
        .score.average { background: #FF9800; color: white; }
        .score.poor { background: #F44336; color: white; }
        .opportunities, .issues { margin: 20px 0; }
        .opportunity, .issue { padding: 10px; border-left: 4px solid #2196F3; margin: 5px 0; background: #f9f9f9; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
    <h1>性能测试报告</h1>
    
    <div class="summary">
        <h2>总体概况</h2>
        <p>测试页面数: ${summary.totalPages}</p>
        <p>成功测试: ${summary.successfulTests}</p>
        <p>失败测试: ${summary.failedTests}</p>
        
        <h3>平均分数</h3>
        ${Object.entries(summary.averageScores).map(([key, score]) => `
            <div class="score ${this.getScoreClass(score)}">
                <div>${key}</div>
                <div>${score}</div>
            </div>
        `).join('')}
    </div>
    
    <div class="opportunities">
        <h2>主要优化机会</h2>
        ${summary.topOpportunities.map(opp => `
            <div class="opportunity">
                <strong>${opp.title}</strong><br>
                <small>出现频率: ${opp.count} 次，潜在节省: ${(opp.totalSavings / 1000).toFixed(2)}s</small><br>
                ${opp.description}
            </div>
        `).join('')}
    </div>
    
    <div class="details">
        <h2>详细结果</h2>
        <table>
            <thead>
                <tr>
                    <th>页面</th>
                    <th>性能</th>
                    <th>可访问性</th>
                    <th>最佳实践</th>
                    <th>SEO</th>
                    <th>LCP</th>
                    <th>FID</th>
                    <th>CLS</th>
                </tr>
            </thead>
            <tbody>
                ${results.filter(r => r.success).map(({ url, result }) => `
                    <tr>
                        <td>${url}</td>
                        <td class="${this.getScoreClass(result.scores.performance)}">${result.scores.performance}</td>
                        <td class="${this.getScoreClass(result.scores.accessibility)}">${result.scores.accessibility}</td>
                        <td class="${this.getScoreClass(result.scores.bestPractices)}">${result.scores.bestPractices}</td>
                        <td class="${this.getScoreClass(result.scores.seo)}">${result.scores.seo}</td>
                        <td>${(result.metrics.largestContentfulPaint / 1000).toFixed(2)}s</td>
                        <td>${result.metrics.firstInputDelay.toFixed(2)}ms</td>
                        <td>${result.metrics.cumulativeLayoutShift.toFixed(3)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
    `;
    
    return html;
  }
  
  getScoreClass(score) {
    if (score >= 90) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
  }
}
```

### 2. 网络性能优化

```javascript
/**
 * 网络性能优化工具
 */
class NetworkOptimizer {
  constructor() {
    this.connectionInfo = this.getConnectionInfo();
    this.resourceHints = new Set();
    this.preloadedResources = new Map();
  }
  
  // 获取网络连接信息
  getConnectionInfo() {
    const connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false
    };
  }
  
  // 自适应资源加载
  adaptiveResourceLoading() {
    const { effectiveType, saveData } = this.connectionInfo;
    
    // 根据网络状况调整策略
    const strategies = {
      'slow-2g': {
        imageQuality: 0.3,
        enableLazyLoading: true,
        preloadCount: 2,
        enableWebP: true
      },
      '2g': {
        imageQuality: 0.5,
        enableLazyLoading: true,
        preloadCount: 3,
        enableWebP: true
      },
      '3g': {
        imageQuality: 0.7,
        enableLazyLoading: true,
        preloadCount: 5,
        enableWebP: true
      },
      '4g': {
        imageQuality: 0.9,
        enableLazyLoading: false,
        preloadCount: 8,
        enableWebP: true
      }
    };
    
    const strategy = strategies[effectiveType] || strategies['4g'];
    
    // 如果用户启用了省流量模式
    if (saveData) {
      strategy.imageQuality *= 0.5;
      strategy.preloadCount = Math.min(strategy.preloadCount, 2);
      strategy.enableLazyLoading = true;
    }
    
    return strategy;
  }
  
  // 智能预加载
  intelligentPreloading() {
    const strategy = this.adaptiveResourceLoading();
    
    // 预加载关键资源
    this.preloadCriticalResources(strategy.preloadCount);
    
    // 预测性预加载
    this.predictivePreloading();
    
    // 基于用户行为的预加载
    this.behaviorBasedPreloading();
  }
  
  // 预加载关键资源
  preloadCriticalResources(maxCount) {
    const criticalResources = [
      { href: '/css/critical.css', as: 'style', priority: 'high' },
      { href: '/js/critical.js', as: 'script', priority: 'high' },
      { href: '/fonts/main.woff2', as: 'font', crossorigin: 'anonymous', priority: 'high' },
      { href: '/images/hero.jpg', as: 'image', priority: 'high' },
      { href: '/api/user/profile', as: 'fetch', priority: 'low' }
    ];
    
    // 按优先级排序并限制数量
    const resourcesToPreload = criticalResources
      .sort((a, b) => (a.priority === 'high' ? -1 : 1))
      .slice(0, maxCount);
    
    resourcesToPreload.forEach(resource => {
      this.preloadResource(resource);
    });
  }
  
  // 预加载资源
  preloadResource(resource) {
    if (this.resourceHints.has(resource.href)) {
      return; // 已经预加载过
    }
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    
    if (resource.crossorigin) {
      link.crossOrigin = resource.crossorigin;
    }
    
    if (resource.type) {
      link.type = resource.type;
    }
    
    link.onload = () => {
      this.preloadedResources.set(resource.href, {
        loadTime: performance.now(),
        resource
      });
      console.log(`预加载完成: ${resource.href}`);
    };
    
    link.onerror = () => {
      console.warn(`预加载失败: ${resource.href}`);
    };
    
    document.head.appendChild(link);
    this.resourceHints.add(resource.href);
  }
  
  // 预测性预加载
  predictivePreloading() {
    // 基于用户在当前页面的停留时间预测下一步行为
    let pageStartTime = performance.now();
    let userInteractions = 0;
    
    // 监听用户交互
    ['click', 'scroll', 'mousemove', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        userInteractions++;
      }, { passive: true });
    });
    
    // 定期评估用户行为
    setTimeout(() => {
      const timeOnPage = performance.now() - pageStartTime;
      const engagementScore = userInteractions / (timeOnPage / 1000);
      
      if (engagementScore > 2) { // 用户活跃度高
        this.preloadLikelyNextPages();
      }
    }, 5000);
  }
  
  // 预加载可能访问的页面
  preloadLikelyNextPages() {
    const currentPath = window.location.pathname;
    const likelyPages = this.predictNextPages(currentPath);
    
    likelyPages.forEach(page => {
      this.prefetchPage(page);
    });
  }
  
  // 预测下一个可能访问的页面
  predictNextPages(currentPath) {
    const pagePatterns = {
      '/': ['/products', '/categories', '/search'],
      '/products': ['/product/', '/cart', '/categories'],
      '/product/': ['/cart', '/products', '/checkout'],
      '/cart': ['/checkout', '/products'],
      '/checkout': ['/order-success', '/cart']
    };
    
    // 找到匹配的模式
    for (const pattern in pagePatterns) {
      if (currentPath.includes(pattern)) {
        return pagePatterns[pattern];
      }
    }
    
    return [];
  }
  
  // 预取页面
  prefetchPage(href) {
    if (this.resourceHints.has(href)) {
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    
    document.head.appendChild(link);
    this.resourceHints.add(href);
    
    console.log(`预取页面: ${href}`);
  }
  
  // 基于用户行为的预加载
  behaviorBasedPreloading() {
    // 监听鼠标悬停
    document.addEventListener('mouseover', (event) => {
      const link = event.target.closest('a[href]');
      if (link && !this.resourceHints.has(link.href)) {
        // 延迟一点时间，避免误触发
        setTimeout(() => {
          if (link.matches(':hover')) {
            this.prefetchPage(link.href);
          }
        }, 200);
      }
    });
    
    // 监听滚动到页面底部
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPercent = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
          
          if (scrollPercent > 0.8) { // 滚动到80%时预加载下一页
            this.preloadNextPageContent();
          }
          
          ticking = false;
        });
        ticking = true;
      }
    });
  }
  
  // 预加载下一页内容
  preloadNextPageContent() {
    const nextPageButton = document.querySelector('[data-next-page]');
    if (nextPageButton && nextPageButton.href) {
      this.prefetchPage(nextPageButton.href);
    }
  }
  
  // HTTP/2 Server Push 模拟
  simulateServerPush() {
    const pushResources = [
      '/css/main.css',
      '/js/app.js',
      '/fonts/main.woff2'
    ];
    
    pushResources.forEach(resource => {
      this.preloadResource({
        href: resource,
        as: this.getResourceType(resource)
      });
    });
  }
  
  getResourceType(url) {
    const extension = url.split('.').pop();
    const typeMap = {
      'css': 'style',
      'js': 'script',
      'woff2': 'font',
      'woff': 'font',
      'jpg': 'image',
      'png': 'image',
      'webp': 'image'
    };
    
    return typeMap[extension] || 'fetch';
  }
  
  // 资源优先级管理
  manageResourcePriority() {
    // 设置关键资源的高优先级
    const criticalResources = document.querySelectorAll('link[rel="stylesheet"], script[src]');
    
    criticalResources.forEach((element, index) => {
      if (index < 3) { // 前3个资源设为高优先级
        if (element.tagName === 'LINK') {
          element.setAttribute('importance', 'high');
        } else if (element.tagName === 'SCRIPT') {
          element.setAttribute('importance', 'high');
        }
      }
    });
    
    // 设置非关键资源的低优先级
    const nonCriticalResources = document.querySelectorAll('img[loading="lazy"], iframe');
    
    nonCriticalResources.forEach(element => {
      element.setAttribute('importance', 'low');
    });
  }
  
  // 获取网络性能报告
  getNetworkPerformanceReport() {
    const resources = performance.getEntriesByType('resource');
    const navigation = performance.getEntriesByType('navigation')[0];
    
    const report = {
      connection: this.connectionInfo,
      totalResources: resources.length,
      totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      totalDuration: resources.reduce((sum, r) => sum + r.duration, 0),
      preloadedCount: this.preloadedResources.size,
      cacheHitRate: this.calculateCacheHitRate(resources),
      compressionRatio: this.calculateCompressionRatio(resources),
      recommendations: this.generateNetworkRecommendations(resources, navigation)
    };
    
    return report;
  }
  
  // 计算缓存命中率
  calculateCacheHitRate(resources) {
    const cachedResources = resources.filter(r => 
      r.transferSize === 0 && r.decodedBodySize > 0
    );
    
    return resources.length > 0 ? 
      (cachedResources.length / resources.length * 100).toFixed(2) + '%' : '0%';
  }
  
  // 计算压缩比
  calculateCompressionRatio(resources) {
    let totalTransferSize = 0;
    let totalDecodedSize = 0;
    
    resources.forEach(resource => {
      totalTransferSize += resource.transferSize || 0;
      totalDecodedSize += resource.decodedBodySize || 0;
    });
    
    if (totalDecodedSize === 0) return '0%';
    
    const ratio = (1 - totalTransferSize / totalDecodedSize) * 100;
    return ratio.toFixed(2) + '%';
  }
  
  // 生成网络优化建议
  generateNetworkRecommendations(resources, navigation) {
    const recommendations = [];
    
    // 检查未压缩的资源
    const uncompressedResources = resources.filter(r => 
      r.decodedBodySize > 0 && 
      r.transferSize === r.decodedBodySize &&
      r.transferSize > 10000 // 大于10KB
    );
    
    if (uncompressedResources.length > 0) {
      recommendations.push({
        type: 'compression',
        priority: 'high',
        message: `发现${uncompressedResources.length}个未压缩的资源`,
        savings: uncompressedResources.reduce((sum, r) => sum + r.transferSize * 0.7, 0)
      });
    }
    
    // 检查过大的资源
    const largeResources = resources.filter(r => r.transferSize > 1024 * 1024); // 1MB
    
    if (largeResources.length > 0) {
      recommendations.push({
        type: 'large-resources',
        priority: 'medium',
        message: `发现${largeResources.length}个大文件资源`,
        resources: largeResources.map(r => ({
          name: r.name,
          size: (r.transferSize / 1024 / 1024).toFixed(2) + 'MB'
        }))
      });
    }
    
    // 检查DNS查询时间
    if (navigation && navigation.domainLookupEnd - navigation.domainLookupStart > 200) {
      recommendations.push({
        type: 'dns',
        priority: 'medium',
        message: 'DNS查询时间过长，考虑使用DNS预解析',
        time: navigation.domainLookupEnd - navigation.domainLookupStart
      });
    }
    
    return recommendations;
  }
}
```

### 3. 渲染性能优化

```javascript
/**
 * 渲染性能优化工具
 */
class RenderingOptimizer {
  constructor() {
    this.frameData = [];
    this.isMonitoring = false;
    this.rafId = null;
    this.layoutShifts = [];
  }
  
  // 开始监控渲染性能
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorFrameRate();
    this.monitorLayoutShifts();
    this.monitorLongTasks();
    this.monitorPaintTiming();
  }
  
  // 停止监控
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  // 监控帧率
  monitorFrameRate() {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let totalFrameTime = 0;
    
    const measureFrame = (currentTime) => {
      if (!this.isMonitoring) return;
      
      const frameTime = currentTime - lastFrameTime;
      frameCount++;
      totalFrameTime += frameTime;
      
      this.frameData.push({
        frameTime,
        timestamp: currentTime,
        fps: 1000 / frameTime
      });
      
      // 只保留最近1000帧的数据
      if (this.frameData.length > 1000) {
        this.frameData.shift();
      }
      
      // 检测掉帧
      if (frameTime > 16.67 * 2) { // 超过2帧的时间
        console.warn(`检测到掉帧: ${frameTime.toFixed(2)}ms`);
        this.recordFrameDrop(frameTime, currentTime);
      }
      
      lastFrameTime = currentTime;
      this.rafId = requestAnimationFrame(measureFrame);
    };
    
    this.rafId = requestAnimationFrame(measureFrame);
  }
  
  // 记录掉帧信息
  recordFrameDrop(frameTime, timestamp) {
    const frameDrop = {
      frameTime,
      timestamp,
      droppedFrames: Math.floor(frameTime / 16.67),
      stackTrace: new Error().stack
    };
    
    // 发送到监控系统
    this.sendPerformanceData('frame-drop', frameDrop);
  }
  
  // 监控布局偏移
  monitorLayoutShifts() {
    if (!('PerformanceObserver' in window)) return;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue; // 忽略用户输入引起的偏移
        
        this.layoutShifts.push({
          value: entry.value,
          startTime: entry.startTime,
          sources: entry.sources ? entry.sources.map(source => ({
            node: source.node ? source.node.tagName : 'unknown',
            previousRect: source.previousRect,
            currentRect: source.currentRect
          })) : []
        });
        
        // 记录大的布局偏移
        if (entry.value > 0.1) {
          console.warn('检测到大的布局偏移:', entry.value);
          this.recordLayoutShift(entry);
        }
      }
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
    this.layoutShiftObserver = observer;
  }
  
  // 记录布局偏移
  recordLayoutShift(entry) {
    const shiftData = {
      value: entry.value,
      startTime: entry.startTime,
      sources: entry.sources,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    this.sendPerformanceData('layout-shift', shiftData);
  }
  
  // 监控长任务
  monitorLongTasks() {
    if (!('PerformanceObserver' in window)) return;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn('检测到长任务:', {
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime
        });
        
        this.recordLongTask(entry);
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
    this.longTaskObserver = observer;
  }
  
  // 记录长任务
  recordLongTask(entry) {
    const taskData = {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      attribution: entry.attribution ? entry.attribution.map(attr => ({
        name: attr.name,
        containerType: attr.containerType,
        containerSrc: attr.containerSrc,
        containerId: attr.containerId,
        containerName: attr.containerName
      })) : [],
      timestamp: Date.now()
    };
    
    this.sendPerformanceData('long-task', taskData);
  }
  
  // 监控绘制时间
  monitorPaintTiming() {
    if (!('PerformanceObserver' in window)) return;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`绘制事件 - ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
        
        if (entry.name === 'first-contentful-paint' && entry.startTime > 3000) {
          console.warn('首次内容绘制时间过长:', entry.startTime);
        }
      }
    });
    
    observer.observe({ entryTypes: ['paint'] });
    this.paintObserver = observer;
  }
  
  // 优化DOM操作
  optimizeDOMOperations() {
    // 批量DOM读写操作
    let readCallbacks = [];
    let writeCallbacks = [];
    let scheduled = false;
    
    const flushCallbacks = () => {
      // 先执行所有读操作
      readCallbacks.forEach(callback => callback());
      readCallbacks = [];
      
      // 再执行所有写操作
      writeCallbacks.forEach(callback => callback());
      writeCallbacks = [];
      
      scheduled = false;
    };
    
    const scheduleFlush = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flushCallbacks);
      }
    };
    
    // 提供批量操作API
    window.performanceDOMBatch = {
      read: (callback) => {
        readCallbacks.push(callback);
        scheduleFlush();
      },
      write: (callback) => {
        writeCallbacks.push(callback);
        scheduleFlush();
      }
    };
  }
  
  // 虚拟滚动优化
  createVirtualScroller(container, itemHeight, totalItems, renderItem) {
    const viewportHeight = container.clientHeight;
    const visibleCount = Math.ceil(viewportHeight / itemHeight) + 2; // 缓冲区
    
    let scrollTop = 0;
    let startIndex = 0;
    
    // 创建滚动容器
    const scrollContainer = document.createElement('div');
    scrollContainer.style.height = totalItems * itemHeight + 'px';
    scrollContainer.style.position = 'relative';
    
    const visibleContainer = document.createElement('div');
    visibleContainer.style.position = 'absolute';
    visibleContainer.style.top = '0';
    visibleContainer.style.width = '100%';
    
    scrollContainer.appendChild(visibleContainer);
    container.appendChild(scrollContainer);
    
    // 更新可见项目
    const updateVisibleItems = () => {
      const newStartIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(newStartIndex + visibleCount, totalItems);
      
      if (newStartIndex !== startIndex) {
        startIndex = newStartIndex;
        
        // 使用DocumentFragment优化DOM操作
        const fragment = document.createDocumentFragment();
        
        for (let i = startIndex; i < endIndex; i++) {
          const item = renderItem(i);
          item.style.position = 'absolute';
          item.style.top = i * itemHeight + 'px';
          item.style.height = itemHeight + 'px';
          fragment.appendChild(item);
        }
        
        // 批量更新DOM
        window.performanceDOMBatch.write(() => {
          visibleContainer.innerHTML = '';
          visibleContainer.appendChild(fragment);
        });
      }
    };
    
    // 优化滚动事件处理
    let ticking = false;
    container.addEventListener('scroll', (e) => {
      scrollTop = e.target.scrollTop;
      
      if (!ticking) {
        requestAnimationFrame(() => {
          updateVisibleItems();
          ticking = false;
        });
        ticking = true;
      }
    });
    
    // 初始渲染
    updateVisibleItems();
    
    return {
      update: updateVisibleItems,
      destroy: () => {
        container.removeChild(scrollContainer);
      }
    };
  }
  
  // 图片懒加载优化
  optimizeImageLoading() {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // 预加载图片
          const tempImg = new Image();
          tempImg.onload = () => {
            // 使用淡入效果
            img.style.transition = 'opacity 0.3s';
            img.style.opacity = '0';
            img.src = img.dataset.src;
            
            requestAnimationFrame(() => {
              img.style.opacity = '1';
            });
            
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          };
          
          tempImg.src = img.dataset.src;
        }
      });
    }, {
      rootMargin: '50px 0px', // 提前50px开始加载
      threshold: 0.1
    });
    
    // 观察所有懒加载图片
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
    
    return imageObserver;
  }
  
  // CSS动画优化
  optimizeAnimations() {
    // 检测低性能设备
    const isLowPerformanceDevice = () => {
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const deviceMemory = navigator.deviceMemory || 4;
      
      return hardwareConcurrency < 4 || deviceMemory < 4;
    };
    
    // 根据设备性能调整动画
    if (isLowPerformanceDevice()) {
      document.documentElement.classList.add('reduce-motion');
      
      // 禁用复杂动画
      const style = document.createElement('style');
      style.textContent = `
        .reduce-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // 使用will-change优化动画元素
    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach(element => {
      element.style.willChange = 'transform, opacity';
      
      // 动画结束后清除will-change
      element.addEventListener('animationend', () => {
        element.style.willChange = 'auto';
      });
    });
  }
  
  // 获取渲染性能报告
  getRenderingPerformanceReport() {
    const currentTime = performance.now();
    const recentFrames = this.frameData.filter(frame => 
      currentTime - frame.timestamp < 5000 // 最近5秒
    );
    
    const averageFPS = recentFrames.length > 0 ? 
      recentFrames.reduce((sum, frame) => sum + frame.fps, 0) / recentFrames.length : 0;
    
    const frameDrops = recentFrames.filter(frame => frame.frameTime > 33.33).length;
    
    const totalCLS = this.layoutShifts.reduce((sum, shift) => sum + shift.value, 0);
    
    return {
      averageFPS: averageFPS.toFixed(2),
      frameDrops,
      totalFrames: recentFrames.length,
      cumulativeLayoutShift: totalCLS.toFixed(4),
      layoutShiftCount: this.layoutShifts.length,
      recommendations: this.generateRenderingRecommendations(averageFPS, frameDrops, totalCLS)
    };
  }
  
  // 生成渲染优化建议
  generateRenderingRecommendations(averageFPS, frameDrops, totalCLS) {
    const recommendations = [];
    
    if (averageFPS < 30) {
      recommendations.push({
        type: 'low-fps',
        priority: 'high',
        message: `平均帧率过低 (${averageFPS}fps)`,
        suggestions: [
          '减少DOM操作频率',
          '优化CSS动画',
          '使用transform代替改变位置属性',
          '减少重绘和重排'
        ]
      });
    }
    
    if (frameDrops > recentFrames.length * 0.1) {
      recommendations.push({
        type: 'frame-drops',
        priority: 'medium',
        message: `掉帧率过高 (${((frameDrops / recentFrames.length) * 100).toFixed(2)}%)`,
        suggestions: [
          '检查长任务',
          '优化JavaScript执行',
          '使用Web Workers处理重计算'
        ]
      });
    }
    
    if (totalCLS > 0.1) {
      recommendations.push({
        type: 'layout-shift',
        priority: 'high',
        message: `累积布局偏移过大 (${totalCLS.toFixed(4)})`,
        suggestions: [
          '为图片设置宽高属性',
          '为动态内容预留空间',
          '避免在现有内容上方插入内容',
          '使用transform进行动画'
        ]
      });
    }
    
    return recommendations;
  }
  
  // 发送性能数据
  sendPerformanceData(type, data) {
    // 这里可以发送到实际的监控系统
    console.log(`渲染性能数据 - ${type}:`, data);
  }
  
  // 清理资源
  cleanup() {
    this.stopMonitoring();
    
    if (this.layoutShiftObserver) {
      this.layoutShiftObserver.disconnect();
    }
    
    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect();
    }
    
    if (this.paintObserver) {
      this.paintObserver.disconnect();
    }
  }
}

// 使用示例
const renderingOptimizer = new RenderingOptimizer();

// 页面加载完成后开始监控
document.addEventListener('DOMContentLoaded', () => {
  renderingOptimizer.startMonitoring();
  renderingOptimizer.optimizeDOMOperations();
  renderingOptimizer.optimizeImageLoading();
  renderingOptimizer.optimizeAnimations();
});

// 定期生成报告
setInterval(() => {
  const report = renderingOptimizer.getRenderingPerformanceReport();
  console.log('渲染性能报告:', report);
}, 30000); // 每30秒生成一次报告
```

## 常见面试问题

### Q1: 如何使用Chrome DevTools进行性能分析？

**分析步骤：**
1. **Performance面板**：录制页面加载和交互过程
2. **Network面板**：分析资源加载时间和大小
3. **Lighthouse面板**：自动化性能审计
4. **Memory面板**：检测内存泄漏

**代码示例：**
```javascript
// 使用Performance API进行自动化分析
class DevToolsHelper {
  static analyzePageLoad() {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      domParse: navigation.domContentLoadedEventEnd - navigation.responseEnd,
      total: navigation.loadEventEnd - navigation.fetchStart
    };
  }
  
  static analyzeResources() {
    const resources = performance.getEntriesByType('resource');
    
    return resources.map(resource => ({
      name: resource.name,
      type: resource.initiatorType,
      size: resource.transferSize,
      duration: resource.duration,
      cached: resource.transferSize === 0 && resource.decodedBodySize > 0
    }));
  }
}
```

### Q2: 什么是关键渲染路径？如何优化？

**关键渲染路径包括：**
1. **构建DOM树**：解析HTML
2. **构建CSSOM树**：解析CSS
3. **构建渲染树**：合并DOM和CSSOM
4. **布局计算**：计算元素位置
5. **绘制**：填充像素

**优化策略：**
```javascript
// 关键渲染路径优化
class CriticalRenderingPath {
  static optimizeCSS() {
    // 内联关键CSS
    const criticalCSS = `
      .hero { display: block; }
      .nav { position: fixed; top: 0; }
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
    
    loadCSS('/css/non-critical.css');
  }
  
  static optimizeJS() {
    // 延迟非关键JavaScript
    const scripts = document.querySelectorAll('script[data-defer]');
    
    scripts.forEach(script => {
      script.defer = true;
    });
    
    // 动态加载JavaScript
    const loadJS = (src) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    };
    
    // 页面加载完成后加载非关键脚本
    window.addEventListener('load', () => {
      loadJS('/js/analytics.js');
      loadJS('/js/chat.js');
    });
  }
}
```

### Q3: 如何检测和解决内存泄漏？

**内存泄漏检测：**
```javascript
class MemoryLeakDetector {
  constructor() {
    this.initialMemory = this.getMemoryUsage();
    this.samples = [];
  }
  
  getMemoryUsage() {
    if (!performance.memory) return null;
    
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    };
  }
  
  startMonitoring() {
    setInterval(() => {
      const current = this.getMemoryUsage();
      if (current) {
        this.samples.push({
          ...current,
          timestamp: Date.now()
        });
        
        // 只保留最近100个样本
        if (this.samples.length > 100) {
          this.samples.shift();
        }
        
        this.analyzeMemoryTrend();
      }
    }, 5000);
  }
  
  analyzeMemoryTrend() {
    if (this.samples.length < 10) return;
    
    const recent = this.samples.slice(-10);
    const trend = this.calculateTrend(recent.map(s => s.used));
    
    if (trend > 0.1) { // 内存持续增长
      console.warn('检测到可能的内存泄漏', {
        trend,
        currentUsage: recent[recent.length - 1].used,
        initialUsage: this.initialMemory.used
      });
    }
  }
  
  calculateTrend(values) {
    const n = values.length;
    const sumX = n * (n - 1) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }
}

// 常见内存泄漏场景和解决方案
class MemoryLeakPrevention {
  static preventEventListenerLeaks() {
    // 使用WeakMap存储事件监听器
    const elementListeners = new WeakMap();
    
    const addListener = (element, event, handler) => {
      element.addEventListener(event, handler);
      
      if (!elementListeners.has(element)) {
        elementListeners.set(element, []);
      }
      elementListeners.get(element).push({ event, handler });
    };
    
    const removeAllListeners = (element) => {
      const listeners = elementListeners.get(element);
      if (listeners) {
        listeners.forEach(({ event, handler }) => {
          element.removeEventListener(event, handler);
        });
        elementListeners.delete(element);
      }
    };
    
    return { addListener, removeAllListeners };
  }
  
  static preventTimerLeaks() {
    const activeTimers = new Set();
    
    const safeSetTimeout = (callback, delay) => {
      const id = setTimeout(() => {
        activeTimers.delete(id);
        callback();
      }, delay);
      
      activeTimers.add(id);
      return id;
    };
    
    const safeSetInterval = (callback, delay) => {
      const id = setInterval(callback, delay);
      activeTimers.add(id);
      return id;
    };
    
    const clearAllTimers = () => {
      activeTimers.forEach(id => {
        clearTimeout(id);
        clearInterval(id);
      });
      activeTimers.clear();
    };
    
    return { safeSetTimeout, safeSetInterval, clearAllTimers };
  }
  
  static preventDOMReferenceLeaks() {
    // 使用WeakRef避免强引用
    const createWeakDOMReference = (element) => {
      return new WeakRef(element);
    };
    
    const accessWeakDOMReference = (weakRef) => {
      const element = weakRef.deref();
      if (!element) {
        console.warn('DOM元素已被垃圾回收');
        return null;
      }
      return element;
    };
    
    return { createWeakDOMReference, accessWeakDOMReference };
  }
}
```

### Q4: 如何优化长列表的渲染性能？

**虚拟滚动实现：**
```javascript
class VirtualList {
  constructor(container, options) {
    this.container = container;
    this.itemHeight = options.itemHeight;
    this.totalItems = options.totalItems;
    this.renderItem = options.renderItem;
    this.bufferSize = options.bufferSize || 5;
    
    this.scrollTop = 0;
    this.containerHeight = container.clientHeight;
    this.visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    
    this.init();
  }
  
  init() {
    // 创建滚动容器
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.height = this.totalItems * this.itemHeight + 'px';
    this.scrollContainer.style.position = 'relative';
    
    // 创建可见内容容器
    this.visibleContainer = document.createElement('div');
    this.visibleContainer.style.position = 'absolute';
    this.visibleContainer.style.top = '0';
    this.visibleContainer.style.width = '100%';
    
    this.scrollContainer.appendChild(this.visibleContainer);
    this.container.appendChild(this.scrollContainer);
    
    // 绑定滚动事件
    this.bindScrollEvent();
    
    // 初始渲染
    this.render();
  }
  
  bindScrollEvent() {
    let ticking = false;
    
    this.container.addEventListener('scroll', () => {
      this.scrollTop = this.container.scrollTop;
      
      if (!ticking) {
        requestAnimationFrame(() => {
          this.render();
          ticking = false;
        });
        ticking = true;
      }
    });
  }
  
  render() {
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize);
    const endIndex = Math.min(
      this.totalItems,
      startIndex + this.visibleCount + this.bufferSize * 2
    );
    
    // 使用DocumentFragment优化DOM操作
    const fragment = document.createDocumentFragment();
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.renderItem(i);
      item.style.position = 'absolute';
      item.style.top = i * this.itemHeight + 'px';
      item.style.height = this.itemHeight + 'px';
      item.dataset.index = i;
      fragment.appendChild(item);
    }
    
    // 批量更新DOM
    this.visibleContainer.innerHTML = '';
    this.visibleContainer.appendChild(fragment);
  }
  
  scrollToIndex(index) {
    const targetScrollTop = index * this.itemHeight;
    this.container.scrollTop = targetScrollTop;
  }
  
  updateTotalItems(newTotal) {
    this.totalItems = newTotal;
    this.scrollContainer.style.height = this.totalItems * this.itemHeight + 'px';
    this.render();
  }
}

// 使用示例
const virtualList = new VirtualList(document.getElementById('list-container'), {
  itemHeight: 50,
  totalItems: 10000,
  bufferSize: 5,
  renderItem: (index) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.textContent = `Item ${index}`;
    return item;
  }
});
```

## 总结

浏览器性能排查与优化是一个系统性工程，需要：

### 核心工具
1. **Chrome DevTools**：Performance、Network、Memory面板
2. **Lighthouse**：自动化性能审计
3. **Performance API**：程序化性能监控
4. **Web Vitals**：用户体验指标

### 优化策略
- **加载优化**：资源压缩、缓存、预加载
- **渲染优化**：关键渲染路径、虚拟滚动
- **JavaScript优化**：代码分割、长任务拆分
- **内存优化**：避免内存泄漏、合理使用缓存

### 面试重点
- **工具使用**：熟练使用各种性能分析工具
- **问题定位**：能够快速定位性能瓶颈
- **优化方案**：针对不同问题提供解决方案
- **监控体系**：建立完整的性能监控体系

### 最佳实践
- 建立性能预算和监控体系
- 持续优化和性能测试
- 关注用户体验指标
- 结合业务场景进行优化 