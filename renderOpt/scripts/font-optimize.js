/**
 * font-optimize.js
 * 字体加载和优化脚本
 */

(function() {
  class FontOptimizer {
    constructor(options = {}) {
      this.options = Object.assign({
        enableFontFaceObserver: true,        // 启用FontFaceObserver
        fallbackFontFamily: 'Arial, sans-serif', // 后备字体
        timeout: 5000,                       // 字体加载超时时间
        useSessionStorage: true,             // 使用SessionStorage缓存字体状态
        addFontClasses: true,                // 在HTML上添加字体加载状态类
        preconnectOrigins: [],               // 预连接字体源
        fontDisplaySetting: 'swap',          // 字体显示策略
        criticalFonts: [],                   // 关键字体
        lazyFonts: []                        // 延迟加载字体
      }, options);
      
      // 初始化
      this.init();
    }
    
    init() {
      // 添加预连接标签
      this.setupPreconnect();
      
      // 检查字体API支持
      if (!this.checkFontLoadingAPISupport()) {
        this.loadFontFaceObserverPolyfill();
      }
      
      // 从会话存储中加载字体状态
      if (this.options.useSessionStorage) {
        this.loadFontStateFromSessionStorage();
      }
      
      // 加载临界字体
      this.loadCriticalFonts();
      
      // 设置懒加载字体
      this.setupLazyFonts();
      
      // 监听字体加载性能
      this.monitorFontPerformance();
    }
    
    checkFontLoadingAPISupport() {
      return 'fonts' in document;
    }
    
    setupPreconnect() {
      // 添加预连接标签以减少字体加载延迟
      const preconnectOrigins = this.options.preconnectOrigins;
      
      if (preconnectOrigins && preconnectOrigins.length > 0) {
        preconnectOrigins.forEach(origin => {
          // 避免重复添加
          if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = origin;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
          }
        });
      }
    }
    
    loadFontFaceObserverPolyfill() {
      // 仅在需要时加载FontFaceObserver库
      if (!window.FontFaceObserver && this.options.enableFontFaceObserver) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/fontfaceobserver@2.3.0/fontfaceobserver.standalone.min.js';
        script.async = true;
        document.head.appendChild(script);
      }
    }
    
    loadFontStateFromSessionStorage() {
      // 从会话存储中恢复字体加载状态
      if (window.sessionStorage) {
        const fontLoadState = sessionStorage.getItem('fontLoadState');
        
        if (fontLoadState) {
          try {
            const state = JSON.parse(fontLoadState);
            
            // 应用缓存的字体状态
            Object.keys(state).forEach(fontFamily => {
              if (state[fontFamily] === 'loaded') {
                // 应用已加载状态
                this.applyFontLoadedState(fontFamily);
              }
            });
          } catch (e) {
            console.warn('Error parsing font load state from sessionStorage', e);
          }
        }
      }
    }
    
    saveFontStateToSessionStorage(fontFamily, state) {
      // 保存字体加载状态到会话存储
      if (window.sessionStorage && this.options.useSessionStorage) {
        try {
          // 获取现有状态或创建新对象
          const currentState = sessionStorage.getItem('fontLoadState');
          const stateObj = currentState ? JSON.parse(currentState) : {};
          
          // 更新状态
          stateObj[fontFamily] = state;
          
          // 存储回会话存储
          sessionStorage.setItem('fontLoadState', JSON.stringify(stateObj));
        } catch (e) {
          console.warn('Error saving font state to sessionStorage', e);
        }
      }
    }
    
    loadCriticalFonts() {
      // 加载关键字体（对首屏渲染重要的字体）
      const criticalFonts = this.options.criticalFonts;
      
      if (criticalFonts && criticalFonts.length > 0) {
        // 对于每个关键字体
        criticalFonts.forEach(fontConfig => {
          this.loadFont(fontConfig.family, fontConfig.options, true);
        });
      }
    }
    
    setupLazyFonts() {
      // 设置非关键字体的延迟加载
      const lazyFonts = this.options.lazyFonts;
      
      if (lazyFonts && lazyFonts.length > 0) {
        // 在空闲时间加载非关键字体
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            lazyFonts.forEach(fontConfig => {
              this.loadFont(fontConfig.family, fontConfig.options, false);
            });
          }, { timeout: 1000 });
        } else {
          // 回退方案：使用setTimeout
          setTimeout(() => {
            lazyFonts.forEach(fontConfig => {
              this.loadFont(fontConfig.family, fontConfig.options, false);
            });
          }, 200);
        }
      }
    }
    
    loadFont(fontFamily, options = {}, isCritical = false) {
      // 获取性能标记的起始时间
      const startTime = performance.now();
      const fontLoadingClassName = `font-loading-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
      const fontLoadedClassName = `font-loaded-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
      
      // 添加加载状态类
      if (this.options.addFontClasses) {
        document.documentElement.classList.add(fontLoadingClassName);
      }
      
      // 根据浏览器支持选择加载方法
      if (this.checkFontLoadingAPISupport()) {
        // 使用官方API
        this.loadFontWithAPI(fontFamily, options, isCritical, startTime);
      } else if (window.FontFaceObserver) {
        // 使用FontFaceObserver
        this.loadFontWithObserver(fontFamily, options, isCritical, startTime);
      } else {
        // 无法观察字体加载，使用超时
        console.warn(`Cannot monitor loading of ${fontFamily}, applying after timeout`);
        setTimeout(() => {
          this.applyFontLoadedState(fontFamily);
          
          // 移除加载类，添加已加载类
          if (this.options.addFontClasses) {
            document.documentElement.classList.remove(fontLoadingClassName);
            document.documentElement.classList.add(fontLoadedClassName);
          }
          
          // 记录性能数据
          this.recordFontPerformance(fontFamily, this.options.timeout, false);
        }, this.options.timeout);
      }
    }
    
    loadFontWithAPI(fontFamily, options, isCritical, startTime) {
      // 使用字体加载API加载字体
      const fontToLoad = new FontFace(fontFamily, `url(${options.url})`, {
        style: options.style || 'normal',
        weight: options.weight || 'normal',
        display: this.options.fontDisplaySetting
      });
      
      // 加载字体
      fontToLoad.load().then(() => {
        // 添加到字体集合
        document.fonts.add(fontToLoad);
        
        // 应用加载状态
        this.applyFontLoadedState(fontFamily);
        
        // 移除加载类，添加已加载类
        if (this.options.addFontClasses) {
          const fontLoadingClassName = `font-loading-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
          const fontLoadedClassName = `font-loaded-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
          document.documentElement.classList.remove(fontLoadingClassName);
          document.documentElement.classList.add(fontLoadedClassName);
        }
        
        // 保存状态
        this.saveFontStateToSessionStorage(fontFamily, 'loaded');
        
        // 记录性能数据
        const loadTime = performance.now() - startTime;
        this.recordFontPerformance(fontFamily, loadTime, true);
      }).catch(err => {
        console.error(`Failed to load font: ${fontFamily}`, err);
        
        // 保存状态
        this.saveFontStateToSessionStorage(fontFamily, 'failed');
        
        // 移除加载类，添加失败类
        if (this.options.addFontClasses) {
          const fontLoadingClassName = `font-loading-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
          const fontFailedClassName = `font-failed-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
          document.documentElement.classList.remove(fontLoadingClassName);
          document.documentElement.classList.add(fontFailedClassName);
        }
        
        // 记录失败
        this.recordFontPerformance(fontFamily, performance.now() - startTime, false);
      });
    }
    
    loadFontWithObserver(fontFamily, options, isCritical, startTime) {
      // 使用FontFaceObserver加载字体
      const fontObserver = new FontFaceObserver(fontFamily, {
        weight: options.weight || 'normal',
        style: options.style || 'normal'
      });
      
      // 如果需要，先定义字体
      if (options.url) {
        const fontFaceRule = `
          @font-face {
            font-family: '${fontFamily}';
            font-style: ${options.style || 'normal'};
            font-weight: ${options.weight || 'normal'};
            src: url('${options.url}') format('${options.format || 'woff2'}');
            font-display: ${this.options.fontDisplaySetting};
          }
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = fontFaceRule;
        document.head.appendChild(style);
      }
      
      // 观察字体加载
      fontObserver.load(null, this.options.timeout).then(() => {
        // 应用加载状态
        this.applyFontLoadedState(fontFamily);
        
        // 移除加载类，添加已加载类
        if (this.options.addFontClasses) {
          const fontLoadingClassName = `font-loading-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
          const fontLoadedClassName = `font-loaded-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
          document.documentElement.classList.remove(fontLoadingClassName);
          document.documentElement.classList.add(fontLoadedClassName);
        }
        
        // 保存状态
        this.saveFontStateToSessionStorage(fontFamily, 'loaded');
        
        // 记录性能数据
        const loadTime = performance.now() - startTime;
        this.recordFontPerformance(fontFamily, loadTime, true);
      }).catch(err => {
        console.error(`Failed to load font with FontFaceObserver: ${fontFamily}`, err);
        
        // 保存状态
        this.saveFontStateToSessionStorage(fontFamily, 'failed');
        
        // 移除加载类，添加失败类
        if (this.options.addFontClasses) {
          const fontLoadingClassName = `font-loading-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
          const fontFailedClassName = `font-failed-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
          document.documentElement.classList.remove(fontLoadingClassName);
          document.documentElement.classList.add(fontFailedClassName);
        }
        
        // 记录失败
        this.recordFontPerformance(fontFamily, performance.now() - startTime, false);
      });
    }
    
    applyFontLoadedState(fontFamily) {
      // 应用字体加载后的状态
      // 可以添加特定的CSS类或触发事件
      // 这里选择向文档添加类，指示字体已加载
      document.documentElement.classList.add(`fonts-loaded-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`);
      
      // 触发字体加载事件
      const event = new CustomEvent('fontLoaded', {
        detail: { fontFamily }
      });
      document.dispatchEvent(event);
    }
    
    monitorFontPerformance() {
      // 使用Performance Observer监控字体加载
      if ('PerformanceObserver' in window) {
        const fontObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            // 过滤字体资源
            if (entry.initiatorType === 'css' && 
                (entry.name.includes('.woff') || 
                 entry.name.includes('.woff2') || 
                 entry.name.includes('.ttf') || 
                 entry.name.includes('.otf'))) {
              console.log(`Font loaded: ${entry.name}, duration: ${entry.duration.toFixed(2)}ms`);
              
              // 添加到性能监控
              if (window.perfMonitor) {
                window.perfMonitor.addCustomMetric(
                  `font_load_${entry.name.split('/').pop()}`,
                  entry.duration
                );
              }
            }
          });
        });
        
        // 开始观察资源指标
        fontObserver.observe({ type: 'resource', buffered: true });
      }
    }
    
    recordFontPerformance(fontFamily, loadTime, success) {
      // 记录字体加载性能
      console.log(
        `Font ${fontFamily} ${success ? 'loaded' : 'failed'} in ${loadTime.toFixed(2)}ms`
      );
      
      // 添加到性能监控
      if (window.perfMonitor) {
        window.perfMonitor.addCustomMetric(
          `font_load_${fontFamily.replace(/\s+/g, '_')}`,
          loadTime,
          { success }
        );
      }
    }
    
    // 公共API
    
    // 预加载字体，但不立即应用
    preloadFont(url, type = 'woff2') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'font';
      link.type = `font/${type}`;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      return link;
    }
    
    // 动态添加新字体
    addFont(fontFamily, options) {
      // 检查字体是否已经加载
      const isLoaded = document.documentElement.classList.contains(
        `fonts-loaded-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`
      );
      
      if (!isLoaded) {
        // 加载新字体
        this.loadFont(fontFamily, options, false);
        return true;
      }
      
      return false; // 字体已加载
    }
    
    // 添加内联字体（使用base64编码）
    addInlineFont(fontFamily, base64Data, options = {}) {
      const format = options.format || 'woff2';
      const fontFaceRule = `
        @font-face {
          font-family: '${fontFamily}';
          font-style: ${options.style || 'normal'};
          font-weight: ${options.weight || 'normal'};
          src: url(data:font/${format};base64,${base64Data}) format('${format}');
          font-display: ${this.options.fontDisplaySetting};
        }
      `;
      
      // 添加样式
      const style = document.createElement('style');
      style.textContent = fontFaceRule;
      document.head.appendChild(style);
      
      // 标记为已加载
      this.applyFontLoadedState(fontFamily);
      this.saveFontStateToSessionStorage(fontFamily, 'loaded');
    }
    
    // 子集化字体（仅加载需要的字符）
    // 注意：这通常需要服务器支持或预先准备的子集字体
    loadFontSubset(fontFamily, subset, options = {}) {
      // 示例：subset可以是'latin'、'cyrillic'等
      const url = options.url.replace('.woff2', `-${subset}.woff2`);
      
      // 加载特定子集
      return this.addFont(fontFamily, {
        ...options,
        url
      });
    }
  }
  
  // 创建全局实例
  window.fontOptimizer = new FontOptimizer();
  
  // 导出类以便高级用法
  window.FontOptimizer = FontOptimizer;
})(); 