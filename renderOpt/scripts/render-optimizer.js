/**
 * render-optimizer.js
 * 首屏渲染优化工具
 * 提供CSS关键路径提取、JS分割加载、组件懒加载等功能
 */

class RenderOptimizer {
  /**
   * 创建渲染优化器实例
   * @param {Object} options - 配置选项
   * @param {boolean} options.extractCriticalCss - 是否提取关键CSS
   * @param {boolean} options.inlineCriticalCss - 是否内联关键CSS
   * @param {boolean} options.deferNonCriticalCss - 是否延迟非关键CSS
   * @param {boolean} options.lazyLoadComponents - 是否懒加载组件
   * @param {boolean} options.deferJavaScript - 是否延迟JavaScript
   * @param {boolean} options.preconnectOrigins - 是否预连接资源域名
   * @param {Array} options.criticalSelectors - 关键CSS选择器
   * @param {Array} options.lazyComponents - 懒加载组件配置
   * @param {Array} options.preconnectList - 预连接域名列表
   * @param {Function} options.onCriticalCssExtracted - 关键CSS提取回调
   * @param {boolean} options.usePrefetch - 是否使用预取
   * @param {boolean} options.usePreload - 是否使用预加载
   * @param {number} options.renderTimeout - 首屏渲染超时时间(ms)
   */
  constructor(options = {}) {
    this.options = {
      extractCriticalCss: true,
      inlineCriticalCss: true,
      deferNonCriticalCss: true,
      lazyLoadComponents: true,
      deferJavaScript: true,
      preconnectOrigins: true,
      criticalSelectors: [
        'header', 
        'nav', 
        '.hero', 
        '.banner', 
        '.first-screen', 
        '.above-fold'
      ],
      lazyComponents: [],
      preconnectList: [],
      onCriticalCssExtracted: null,
      usePrefetch: true,
      usePreload: true,
      renderTimeout: 3000,
      ...options
    };

    // 存储关键CSS
    this.criticalCss = '';
    
    // 存储延迟加载的资源
    this.deferredResources = {
      css: [],
      js: [],
      components: []
    };
    
    // 性能指标
    this.metrics = {
      firstPaintTime: 0,
      firstContentfulPaintTime: 0,
      domContentLoadedTime: 0,
      windowLoadTime: 0,
      timeToInteractive: 0,
      criticalCssSize: 0,
      totalResourcesSize: 0,
      deferredResourcesSize: 0
    };

    // 初始化
    this._init();
  }

  /**
   * 初始化渲染优化器
   * @private
   */
  _init() {
    // 记录性能指标
    this._recordPerformanceMetrics();
    
    // 监听DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._onDOMContentLoaded());
    } else {
      this._onDOMContentLoaded();
    }
    
    // 监听window加载完成
    window.addEventListener('load', () => this._onWindowLoaded());
    
    // 设置首屏渲染超时检测
    this._setupRenderTimeout();
    
    console.log('[RenderOptimizer] 初始化完成');
  }

  /**
   * 记录性能指标
   * @private
   */
  _recordPerformanceMetrics() {
    // 使用Performance API记录关键时间点
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      
      // DOMContentLoaded时间
      document.addEventListener('DOMContentLoaded', () => {
        this.metrics.domContentLoadedTime = Date.now() - timing.navigationStart;
      });
      
      // Window Load时间
      window.addEventListener('load', () => {
        this.metrics.windowLoadTime = Date.now() - timing.navigationStart;
      });
    }
    
    // 使用PerformanceObserver获取FP、FCP和TTI
    if (window.PerformanceObserver) {
      try {
        // 观察绘制时间
        const paintObserver = new PerformanceObserver((entries) => {
          entries.getEntries().forEach(entry => {
            if (entry.name === 'first-paint') {
              this.metrics.firstPaintTime = entry.startTime;
            } else if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaintTime = entry.startTime;
            }
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        
        // 观察长任务，用于近似计算TTI
        let lastLongTaskEnd = 0;
        const longTaskObserver = new PerformanceObserver((entries) => {
          entries.getEntries().forEach(entry => {
            lastLongTaskEnd = Math.max(lastLongTaskEnd, entry.startTime + entry.duration);
          });
          
          // 简化的TTI计算：最后一个长任务结束后加上一个静默窗口
          this.metrics.timeToInteractive = lastLongTaskEnd + 5000;
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Performance Observer API不可用:', e);
      }
    }
  }

  /**
   * 设置首屏渲染超时检测
   * @private
   */
  _setupRenderTimeout() {
    setTimeout(() => {
      // 超时仍未完成首屏渲染，强制完成优化过程
      if (!this.metrics.firstContentfulPaintTime) {
        console.warn(`[RenderOptimizer] 首屏渲染超时(${this.options.renderTimeout}ms)，强制完成优化`);
        this._forceCompleteRendering();
      }
    }, this.options.renderTimeout);
  }

  /**
   * 强制完成渲染过程
   * @private
   */
  _forceCompleteRendering() {
    // 加载所有延迟的资源
    this._loadDeferredResources();
    
    // 解除组件懒加载
    this._loadLazyComponents();
  }

  /**
   * DOM内容加载完成处理
   * @private
   */
  _onDOMContentLoaded() {
    // 1. 添加预连接
    if (this.options.preconnectOrigins) {
      this._addResourceHints();
    }
    
    // 2. 提取关键CSS
    if (this.options.extractCriticalCss) {
      this._extractCriticalCss();
    }
    
    // 3. 延迟非关键CSS
    if (this.options.deferNonCriticalCss) {
      this._deferNonCriticalCss();
    }
    
    // 4. 延迟JavaScript
    if (this.options.deferJavaScript) {
      this._deferJavaScript();
    }
    
    // 5. 处理组件懒加载
    if (this.options.lazyLoadComponents) {
      this._setupLazyComponents();
    }
  }

  /**
   * 窗口加载完成处理
   * @private
   */
  _onWindowLoaded() {
    // 在window.onload之后加载延迟的资源
    setTimeout(() => {
      this._loadDeferredResources();
    }, 100);
    
    // 收集最终性能指标
    this._collectFinalMetrics();
  }

  /**
   * 添加资源提示（预连接、预加载等）
   * @private
   */
  _addResourceHints() {
    const head = document.head;
    
    // 添加预连接
    if (this.options.preconnectList.length) {
      this.options.preconnectList.forEach(url => {
        if (!url) return;
        
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        link.crossOrigin = 'anonymous';
        head.appendChild(link);
        
        // 添加DNS预取
        const dnsLink = document.createElement('link');
        dnsLink.rel = 'dns-prefetch';
        dnsLink.href = url;
        head.appendChild(dnsLink);
      });
    } else {
      // 如果没有指定预连接列表，自动提取当前页面上的唯一域名
      this._autoDetectDomains();
    }
    
    // 添加预取（后续导航）
    if (this.options.usePrefetch) {
      this._addNavigationPrefetch();
    }
  }

  /**
   * 自动检测页面上的域名
   * @private
   */
  _autoDetectDomains() {
    const uniqueDomains = new Set();
    const currentDomain = window.location.hostname;
    
    // 收集脚本和样式表域名
    document.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach(el => {
      try {
        const url = new URL(el.src || el.href, window.location.href);
        if (url.hostname !== currentDomain) {
          uniqueDomains.add(url.origin);
        }
      } catch (e) {
        // 忽略无效URL
      }
    });
    
    // 收集图片域名
    document.querySelectorAll('img[src]').forEach(img => {
      try {
        const url = new URL(img.src, window.location.href);
        if (url.hostname !== currentDomain) {
          uniqueDomains.add(url.origin);
        }
      } catch (e) {
        // 忽略无效URL
      }
    });
    
    // 添加预连接
    uniqueDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      // 添加DNS预取
      const dnsLink = document.createElement('link');
      dnsLink.rel = 'dns-prefetch';
      dnsLink.href = domain;
      document.head.appendChild(dnsLink);
    });
  }

  /**
   * 添加导航预取
   * @private
   */
  _addNavigationPrefetch() {
    // 查找页面上所有导航链接
    const links = Array.from(document.querySelectorAll('a[href]'))
      .filter(link => {
        // 只预取站内链接
        try {
          const url = new URL(link.href, window.location.href);
          return url.origin === window.location.origin && 
                 url.pathname !== window.location.pathname &&
                 !url.hash; // 不预取锚点链接
        } catch (e) {
          return false;
        }
      })
      .map(link => link.href);
    
    // 去重并限制数量（避免过多请求）
    const uniqueLinks = Array.from(new Set(links)).slice(0, 5);
    
    // 添加预取提示
    uniqueLinks.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  /**
   * 提取关键CSS
   * @private
   */
  _extractCriticalCss() {
    const criticalStyles = new Set();
    
    // 获取当前页面上所有样式表
    const styleSheets = Array.from(document.styleSheets);
    
    try {
      // 遍历样式表
      styleSheets.forEach(sheet => {
        try {
          // 忽略跨域样式表（无法读取规则）
          if (sheet.href && new URL(sheet.href).origin !== window.location.origin) {
            this.deferredResources.css.push(sheet.href);
            return;
          }
          
          // 获取所有CSS规则
          const rules = Array.from(sheet.cssRules || []);
          
          // 遍历规则
          rules.forEach(rule => {
            // 处理样式规则
            if (rule.type === CSSRule.STYLE_RULE) {
              const selector = rule.selectorText;
              
              // 检查选择器是否为关键选择器
              if (this._isCriticalSelector(selector)) {
                criticalStyles.add(rule.cssText);
              }
            }
            // 处理媒体查询
            else if (rule.type === CSSRule.MEDIA_RULE) {
              // 仅包含针对当前屏幕的媒体查询
              if (window.matchMedia(rule.conditionText).matches) {
                Array.from(rule.cssRules || []).forEach(nestedRule => {
                  if (nestedRule.type === CSSRule.STYLE_RULE) {
                    const selector = nestedRule.selectorText;
                    if (this._isCriticalSelector(selector)) {
                      criticalStyles.add(rule.conditionText + '{' + nestedRule.cssText + '}');
                    }
                  }
                });
              }
            }
            // 处理字体规则
            else if (rule.type === CSSRule.FONT_FACE_RULE) {
              // 包含所有字体规则（通常字体是关键资源）
              criticalStyles.add(rule.cssText);
            }
            // 处理关键帧规则
            else if (rule.type === CSSRule.KEYFRAMES_RULE) {
              // 暂时包含所有动画规则
              criticalStyles.add(rule.cssText);
            }
          });
          
          // 如果是外部样式表，标记为延迟加载
          if (sheet.href) {
            this.deferredResources.css.push(sheet.href);
          }
        } catch (e) {
          // 无法访问的样式表（可能是跨域）
          if (sheet.href) {
            this.deferredResources.css.push(sheet.href);
          }
        }
      });
      
      // 合并关键CSS
      this.criticalCss = Array.from(criticalStyles).join('\n');
      
      // 记录指标
      this.metrics.criticalCssSize = new Blob([this.criticalCss]).size;
      
      // 如果需要内联关键CSS
      if (this.options.inlineCriticalCss && this.criticalCss) {
        const styleEl = document.createElement('style');
        styleEl.id = 'critical-css';
        styleEl.textContent = this.criticalCss;
        document.head.appendChild(styleEl);
      }
      
      // 触发回调
      if (typeof this.options.onCriticalCssExtracted === 'function') {
        this.options.onCriticalCssExtracted(this.criticalCss);
      }
    } catch (e) {
      console.error('提取关键CSS失败:', e);
    }
  }

  /**
   * 判断是否为关键选择器
   * @param {string} selector - CSS选择器
   * @returns {boolean} 是否为关键选择器
   * @private
   */
  _isCriticalSelector(selector) {
    if (!selector) return false;
    
    // 检查是否匹配关键元素
    const selectors = selector.split(',').map(s => s.trim());
    
    for (const s of selectors) {
      // 检查是否匹配关键选择器列表
      for (const critical of this.options.criticalSelectors) {
        if (s.includes(critical)) {
          return true;
        }
      }
      
      // 检查是否为可见的首屏元素
      try {
        const elements = document.querySelectorAll(s);
        for (const el of elements) {
          if (this._isElementInViewport(el)) {
            return true;
          }
        }
      } catch (e) {
        // 忽略无效选择器
      }
    }
    
    return false;
  }

  /**
   * 判断元素是否在视口内
   * @param {Element} element - DOM元素
   * @returns {boolean} 是否在视口内
   * @private
   */
  _isElementInViewport(element) {
    if (!element || !element.getBoundingClientRect) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // 元素完全在视口内或部分在视口内
    return (
      rect.top < windowHeight &&
      rect.left >= 0 &&
      rect.bottom >= 0 &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * 延迟加载非关键CSS
   * @private
   */
  _deferNonCriticalCss() {
    // 查找所有样式表链接
    const styleLinks = document.querySelectorAll('link[rel="stylesheet"]');
    
    styleLinks.forEach(link => {
      // 跳过已处理的样式表
      if (link.hasAttribute('data-processed')) return;
      
      // 移除原始样式表链接
      const href = link.href;
      const media = link.media || 'all';
      const parent = link.parentNode;
      
      // 不要处理预加载的CSS
      if (link.hasAttribute('data-preload')) return;
      
      // 如果样式表不在延迟列表中，添加到列表
      if (href && !this.deferredResources.css.includes(href)) {
        this.deferredResources.css.push(href);
      }
      
      // 标记为已处理
      link.setAttribute('data-processed', 'true');
      
      // 通过将media设置为'print'来延迟样式表加载
      // 注意：不要移除样式表，这样可以保留加载顺序
      link.media = 'print';
      link.setAttribute('data-original-media', media);
      link.setAttribute('data-deferred', 'true');
    });
  }

  /**
   * 延迟JavaScript加载
   * @private
   */
  _deferJavaScript() {
    // 查找所有非关键脚本
    const scripts = document.querySelectorAll('script[src]:not([async]):not([defer]):not([data-critical])');
    
    scripts.forEach(script => {
      // 跳过已处理的脚本
      if (script.hasAttribute('data-processed')) return;
      
      const src = script.src;
      const parent = script.parentNode;
      
      // 保存到延迟资源列表
      if (src && !this.deferredResources.js.includes(src)) {
        this.deferredResources.js.push(src);
      }
      
      // 标记为已处理
      script.setAttribute('data-processed', 'true');
      
      // 转换为延迟加载
      script.setAttribute('defer', '');
      script.setAttribute('data-deferred', 'true');
    });
  }

  /**
   * 设置组件懒加载
   * @private
   */
  _setupLazyComponents() {
    // 查找配置的懒加载组件
    this.options.lazyComponents.forEach(component => {
      const { selector, threshold = 0.1, root = null, load } = component;
      
      if (!selector || typeof load !== 'function') return;
      
      // 查找组件容器
      const elements = document.querySelectorAll(selector);
      if (!elements.length) return;
      
      // 保存组件信息
      this.deferredResources.components.push(component);
      
      // 创建交叉观察器
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                // 组件进入视口，加载内容
                const element = entry.target;
                
                // 调用加载函数
                load(element)
                  .then(() => {
                    element.setAttribute('data-loaded', 'true');
                    // 停止观察
                    obs.unobserve(element);
                  })
                  .catch(err => {
                    console.error('组件加载失败:', err);
                  });
              }
            });
          },
          {
            root: root ? document.querySelector(root) : null,
            rootMargin: '100px',
            threshold: threshold
          }
        );
        
        // 开始观察
        elements.forEach(element => {
          if (!element.hasAttribute('data-loaded')) {
            observer.observe(element);
          }
        });
      } else {
        // 降级处理：不支持IntersectionObserver的浏览器立即加载
        elements.forEach(element => {
          if (!element.hasAttribute('data-loaded')) {
            load(element).then(() => {
              element.setAttribute('data-loaded', 'true');
            });
          }
        });
      }
    });
  }

  /**
   * 加载延迟的资源
   * @private
   */
  _loadDeferredResources() {
    // 加载延迟的CSS
    this._loadDeferredCss();
    
    // 加载延迟的JS
    this._loadDeferredJs();
  }

  /**
   * 加载延迟的CSS
   * @private
   */
  _loadDeferredCss() {
    // 恢复所有延迟的样式表
    document.querySelectorAll('link[data-deferred="true"]').forEach(link => {
      // 恢复原始媒体类型
      const originalMedia = link.getAttribute('data-original-media') || 'all';
      link.media = originalMedia;
    });
  }

  /**
   * 加载延迟的JavaScript
   * @private
   */
  _loadDeferredJs() {
    // JavaScript已经被标记为defer，会在DOM解析完成后自动执行
    // 此方法保留用于未来可能的扩展
  }

  /**
   * 加载懒加载组件
   * @private
   */
  _loadLazyComponents() {
    // 查找所有未加载的懒加载组件
    this.options.lazyComponents.forEach(component => {
      const { selector, load } = component;
      
      if (!selector || typeof load !== 'function') return;
      
      // 查找未加载的组件
      const elements = document.querySelectorAll(`${selector}:not([data-loaded])`);
      
      // 强制加载所有组件
      elements.forEach(element => {
        load(element).then(() => {
          element.setAttribute('data-loaded', 'true');
        });
      });
    });
  }

  /**
   * 收集最终性能指标
   * @private
   */
  _collectFinalMetrics() {
    // 收集资源大小信息
    let totalSize = 0;
    let deferredSize = 0;
    
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      
      resources.forEach(resource => {
        // 包含传输大小信息
        if (resource.transferSize) {
          totalSize += resource.transferSize;
          
          // 检查是否为延迟资源
          const url = resource.name;
          if (this.deferredResources.css.includes(url) || 
              this.deferredResources.js.includes(url)) {
            deferredSize += resource.transferSize;
          }
        }
      });
      
      this.metrics.totalResourcesSize = totalSize;
      this.metrics.deferredResourcesSize = deferredSize;
    }
    
    console.log('[RenderOptimizer] 性能指标:', this.metrics);
  }

  /**
   * 获取性能指标
   * @returns {Object} 性能指标
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * 获取关键CSS
   * @returns {string} 关键CSS
   */
  getCriticalCss() {
    return this.criticalCss;
  }

  /**
   * 添加关键CSS选择器
   * @param {string|Array} selectors - 要添加的选择器
   */
  addCriticalSelectors(selectors) {
    if (typeof selectors === 'string') {
      selectors = [selectors];
    }
    
    if (Array.isArray(selectors)) {
      this.options.criticalSelectors = [
        ...this.options.criticalSelectors,
        ...selectors
      ];
    }
  }

  /**
   * 添加懒加载组件
   * @param {Object} component - 组件配置
   * @param {string} component.selector - 组件选择器
   * @param {Function} component.load - 加载函数，返回Promise
   * @param {number} [component.threshold=0.1] - 交叉观察器阈值
   * @param {string} [component.root=null] - 交叉观察器根元素
   */
  addLazyComponent(component) {
    if (!component || !component.selector || typeof component.load !== 'function') {
      console.error('无效的懒加载组件配置');
      return;
    }
    
    this.options.lazyComponents.push(component);
    
    // 如果已经初始化，立即设置
    if (document.readyState !== 'loading') {
      this._setupLazyComponents();
    }
  }

  /**
   * 添加预连接URL
   * @param {string|Array} urls - 要预连接的URL
   */
  addPreconnect(urls) {
    if (typeof urls === 'string') {
      urls = [urls];
    }
    
    if (Array.isArray(urls)) {
      this.options.preconnectList = [
        ...this.options.preconnectList,
        ...urls
      ];
      
      // 如果已经初始化，立即添加预连接
      if (document.readyState !== 'loading') {
        urls.forEach(url => {
          if (!url) return;
          
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = url;
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
          
          const dnsLink = document.createElement('link');
          dnsLink.rel = 'dns-prefetch';
          dnsLink.href = url;
          document.head.appendChild(dnsLink);
        });
      }
    }
  }

  /**
   * 预加载资源
   * @param {string} url - 资源URL
   * @param {string} [as='fetch'] - 资源类型
   * @param {boolean} [highPriority=false] - 是否高优先级
   */
  preloadResource(url, as = 'fetch', highPriority = false) {
    if (!url || !this.options.usePreload) return;
    
    const link = document.createElement('link');
    link.rel = highPriority ? 'preload' : 'prefetch';
    link.href = url;
    link.as = as;
    
    if (as === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  }
}

// 创建单例
let renderOptimizerInstance = null;

/**
 * 获取RenderOptimizer实例
 * @param {Object} [options] - 配置选项
 * @returns {RenderOptimizer} 单例实例
 */
function getRenderOptimizer(options) {
  if (!renderOptimizerInstance) {
    renderOptimizerInstance = new RenderOptimizer(options);
  }
  return renderOptimizerInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    RenderOptimizer,
    getRenderOptimizer
  };
} else {
  window.RenderOptimizer = RenderOptimizer;
  window.getRenderOptimizer = getRenderOptimizer;
} 