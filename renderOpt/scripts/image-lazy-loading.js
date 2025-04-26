/**
 * image-lazy-loading.js
 * 图片懒加载模块，用于延迟加载页面中的图片资源
 */

class LazyImageLoader {
  /**
   * 创建懒加载控制器
   * @param {Object} options - 懒加载配置选项
   * @param {string} options.selector - 需要懒加载的图片选择器，默认为'[data-src]'
   * @param {string} options.srcAttr - 存储真实图片地址的属性名，默认为'data-src'
   * @param {string} options.loadedClass - 加载完成后添加的类名，默认为'lazy-loaded'
   * @param {number} options.threshold - 图片提前加载的阈值，默认为0.1（10%）
   * @param {string} options.placeholder - 默认占位图片，默认为透明1x1像素
   * @param {boolean} options.useNativeWhenAvailable - 是否优先使用原生懒加载，默认为true
   * @param {Function} options.onLoaded - 图片加载完成后的回调函数
   * @param {boolean} options.enableWebP - 是否启用WebP格式（如果浏览器支持），默认为true
   */
  constructor(options = {}) {
    // 默认配置
    this.options = {
      selector: '[data-src]',
      srcAttr: 'data-src',
      loadedClass: 'lazy-loaded',
      threshold: 0.1,
      placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
      useNativeWhenAvailable: true,
      onLoaded: null,
      enableWebP: true,
      rootMargin: '200px 0px',
      ...options
    };

    // 记录所有需要懒加载的图片
    this.lazyImages = [];
    // 记录性能数据
    this.metrics = {
      totalImages: 0,
      loadedImages: 0,
      startTime: Date.now(),
      loadTimes: []
    };
    // Intersection Observer实例
    this.observer = null;
    // 检查浏览器是否支持WebP
    this.supportsWebP = false;
    // 原生懒加载支持状态
    this.supportsNativeLazy = 'loading' in HTMLImageElement.prototype;

    // 初始化
    this.init();
  }

  /**
   * 初始化方法，检测环境支持并设置事件监听
   */
  init() {
    // 测试是否支持WebP
    this.checkWebPSupport().then(supported => {
      this.supportsWebP = supported;
    });

    // 获取所有懒加载图片
    this.lazyImages = Array.from(document.querySelectorAll(this.options.selector));
    this.metrics.totalImages = this.lazyImages.length;

    // 如果没有图片需要懒加载，直接返回
    if (this.lazyImages.length === 0) {
      console.log('[图片懒加载] 没有找到需要懒加载的图片');
      return;
    }

    // 如果浏览器支持原生懒加载且配置允许使用
    if (this.supportsNativeLazy && this.options.useNativeWhenAvailable) {
      this.setupNativeLazyLoading();
    } else {
      // 检查是否支持Intersection Observer
      if ('IntersectionObserver' in window) {
        this.setupIntersectionObserver();
      } else {
        // 回退到滚动事件监听
        this.setupScrollListener();
      }
    }

    // 输出调试信息
    console.log(`[图片懒加载] 初始化完成，找到 ${this.lazyImages.length} 张需要懒加载的图片`);
  }

  /**
   * 检查浏览器是否支持WebP格式
   * @returns {Promise<boolean>} WebP支持状态
   */
  checkWebPSupport() {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = function() {
        // 能够解码WebP图片
        resolve(webP.width === 1);
      };
      webP.onerror = function() {
        // 不能解码WebP图片
        resolve(false);
      };
      webP.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    });
  }

  /**
   * 设置原生懒加载
   */
  setupNativeLazyLoading() {
    console.log('[图片懒加载] 使用原生懒加载');
    
    this.lazyImages.forEach(img => {
      const src = img.getAttribute(this.options.srcAttr);
      
      // 如果没有data-src属性，跳过
      if (!src) return;
      
      // 设置原生懒加载属性
      img.setAttribute('loading', 'lazy');
      
      // 记录加载开始时间
      const startTime = Date.now();
      
      // 监听加载完成事件
      img.onload = () => {
        this.handleImageLoaded(img, Date.now() - startTime);
      };
      
      // 监听加载错误事件
      img.onerror = () => {
        this.handleImageError(img);
      };
      
      // 替换图片源
      if (this.options.enableWebP && this.supportsWebP && src.match(/\.(jpe?g|png)$/i)) {
        // 如果支持WebP且原图是JPEG或PNG，尝试使用WebP版本
        const webPSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');
        img.setAttribute('src', webPSrc);
        // 设置回退图片源
        img.setAttribute('onerror', `this.onerror=null;this.src='${src}';`);
      } else {
        img.setAttribute('src', src);
      }
      
      // 移除data-src属性
      img.removeAttribute(this.options.srcAttr);
    });
  }

  /**
   * 设置Intersection Observer观察者
   */
  setupIntersectionObserver() {
    console.log('[图片懒加载] 使用Intersection Observer');
    
    // 创建观察者实例
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // 如果元素进入视口
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute(this.options.srcAttr);
          
          if (!src) return;
          
          // 记录加载开始时间
          const startTime = Date.now();
          
          // 监听加载完成事件
          img.onload = () => {
            this.handleImageLoaded(img, Date.now() - startTime);
          };
          
          // 监听加载错误事件
          img.onerror = () => {
            this.handleImageError(img);
          };
          
          // 替换图片源
          if (this.options.enableWebP && this.supportsWebP && src.match(/\.(jpe?g|png)$/i)) {
            // 如果支持WebP且原图是JPEG或PNG，尝试使用WebP版本
            const webPSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');
            img.setAttribute('src', webPSrc);
            // 设置回退图片源
            img.setAttribute('onerror', `this.onerror=null;this.src='${src}';`);
          } else {
            img.setAttribute('src', src);
          }
          
          // 移除data-src属性
          img.removeAttribute(this.options.srcAttr);
          
          // 停止观察该元素
          this.observer.unobserve(img);
        }
      });
    }, {
      root: null,
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold
    });
    
    // 开始观察所有懒加载图片
    this.lazyImages.forEach(img => {
      // 设置占位图
      if (!img.src) {
        img.src = this.options.placeholder;
      }
      
      this.observer.observe(img);
    });
  }

  /**
   * 设置滚动事件监听（兼容方案）
   */
  setupScrollListener() {
    console.log('[图片懒加载] 使用滚动事件监听（兼容方案）');
    
    // 设置所有图片的占位图
    this.lazyImages.forEach(img => {
      if (!img.src) {
        img.src = this.options.placeholder;
      }
    });
    
    // 定义滚动检查函数
    const lazyLoad = () => {
      // 获取视口高度
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      this.lazyImages.forEach(img => {
        // 跳过已加载的图片
        if (img.classList.contains(this.options.loadedClass)) return;
        
        const rect = img.getBoundingClientRect();
        
        // 检查图片是否在视口内或接近视口
        const inViewport = (
          rect.bottom >= 0 &&
          rect.right >= 0 &&
          rect.top <= viewportHeight + 200 &&
          rect.left <= viewportWidth
        );
        
        if (inViewport) {
          const src = img.getAttribute(this.options.srcAttr);
          
          if (!src) return;
          
          // 记录加载开始时间
          const startTime = Date.now();
          
          // 监听加载完成事件
          img.onload = () => {
            this.handleImageLoaded(img, Date.now() - startTime);
          };
          
          // 监听加载错误事件
          img.onerror = () => {
            this.handleImageError(img);
          };
          
          // 替换图片源
          if (this.options.enableWebP && this.supportsWebP && src.match(/\.(jpe?g|png)$/i)) {
            // 如果支持WebP且原图是JPEG或PNG，尝试使用WebP版本
            const webPSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');
            img.setAttribute('src', webPSrc);
            // 设置回退图片源
            img.setAttribute('onerror', `this.onerror=null;this.src='${src}';`);
          } else {
            img.setAttribute('src', src);
          }
          
          // 移除data-src属性
          img.removeAttribute(this.options.srcAttr);
        }
      });
      
      // 如果所有图片都已加载完成，移除事件监听
      if (this.metrics.loadedImages >= this.metrics.totalImages) {
        window.removeEventListener('scroll', lazyLoad);
        window.removeEventListener('resize', lazyLoad);
        window.removeEventListener('orientationchange', lazyLoad);
      }
    };
    
    // 添加事件监听
    window.addEventListener('scroll', lazyLoad);
    window.addEventListener('resize', lazyLoad);
    window.addEventListener('orientationchange', lazyLoad);
    
    // 初始触发一次检查
    lazyLoad();
  }

  /**
   * 处理图片加载完成
   * @param {HTMLImageElement} img - 加载完成的图片元素
   * @param {number} loadTime - 加载耗时（毫秒）
   */
  handleImageLoaded(img, loadTime) {
    // 更新计数
    this.metrics.loadedImages++;
    
    // 记录加载时间
    this.metrics.loadTimes.push(loadTime);
    
    // 添加加载完成的类
    img.classList.add(this.options.loadedClass);
    
    // 执行回调
    if (typeof this.options.onLoaded === 'function') {
      this.options.onLoaded(img, loadTime);
    }
    
    // 如果所有图片都已加载完成，记录性能指标
    if (this.metrics.loadedImages >= this.metrics.totalImages) {
      this.logPerformance();
    }
  }

  /**
   * 处理图片加载错误
   * @param {HTMLImageElement} img - 加载失败的图片元素
   */
  handleImageError(img) {
    console.warn('[图片懒加载] 图片加载失败:', img.src);
    
    // 更新计数（错误也计入已加载）
    this.metrics.loadedImages++;
    
    // 如果所有图片都已处理完成，记录性能指标
    if (this.metrics.loadedImages >= this.metrics.totalImages) {
      this.logPerformance();
    }
  }

  /**
   * 记录性能指标
   */
  logPerformance() {
    const totalTime = Date.now() - this.metrics.startTime;
    
    // 计算平均加载时间
    const avgLoadTime = this.metrics.loadTimes.length > 0 ? 
      this.metrics.loadTimes.reduce((sum, time) => sum + time, 0) / this.metrics.loadTimes.length : 0;
    
    console.log('[图片懒加载性能指标]', {
      总图片数: this.metrics.totalImages,
      成功加载数: this.metrics.loadedImages,
      总耗时: `${totalTime}ms`,
      平均加载时间: `${Math.round(avgLoadTime)}ms`,
      使用方式: this.supportsNativeLazy && this.options.useNativeWhenAvailable ? 
        '原生懒加载' : ('IntersectionObserver' in window ? 'Intersection Observer' : '滚动事件'),
      WebP支持: this.supportsWebP ? '是' : '否'
    });
  }

  /**
   * 强制加载所有未加载的图片
   */
  loadAll() {
    console.log('[图片懒加载] 强制加载所有未加载图片');
    
    // 停止使用Intersection Observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // 加载所有未加载的图片
    this.lazyImages.forEach(img => {
      // 跳过已加载的图片
      if (img.classList.contains(this.options.loadedClass)) return;
      
      const src = img.getAttribute(this.options.srcAttr);
      
      if (!src) return;
      
      // 记录加载开始时间
      const startTime = Date.now();
      
      // 监听加载完成事件
      img.onload = () => {
        this.handleImageLoaded(img, Date.now() - startTime);
      };
      
      // 监听加载错误事件
      img.onerror = () => {
        this.handleImageError(img);
      };
      
      // 替换图片源
      if (this.options.enableWebP && this.supportsWebP && src.match(/\.(jpe?g|png)$/i)) {
        // 如果支持WebP且原图是JPEG或PNG，尝试使用WebP版本
        const webPSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');
        img.setAttribute('src', webPSrc);
        // 设置回退图片源
        img.setAttribute('onerror', `this.onerror=null;this.src='${src}';`);
      } else {
        img.setAttribute('src', src);
      }
      
      // 移除data-src属性
      img.removeAttribute(this.options.srcAttr);
    });
  }

  /**
   * 添加新的懒加载图片（用于动态加载的内容）
   * @param {HTMLImageElement|NodeList|Array} images - 需要添加的图片元素
   */
  addImages(images) {
    // 将传入的图片转换为数组
    const newImages = images instanceof HTMLImageElement ? [images] : 
                      (images instanceof NodeList ? Array.from(images) : images);
    
    if (!Array.isArray(newImages)) {
      console.warn('[图片懒加载] 添加图片失败，参数类型不正确');
      return;
    }
    
    // 更新总图片数
    this.metrics.totalImages += newImages.length;
    
    // 添加到懒加载图片列表
    this.lazyImages = [...this.lazyImages, ...newImages];
    
    // 设置占位图
    newImages.forEach(img => {
      if (!img.src) {
        img.src = this.options.placeholder;
      }
    });
    
    // 如果使用Intersection Observer，开始观察新图片
    if (this.observer) {
      newImages.forEach(img => {
        this.observer.observe(img);
      });
    }
    
    console.log(`[图片懒加载] 添加了 ${newImages.length} 张新图片`);
  }

  /**
   * 销毁懒加载实例，清理资源
   */
  destroy() {
    // 停止使用Intersection Observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // 移除滚动事件监听（以防万一）
    window.removeEventListener('scroll', this.lazyLoad);
    window.removeEventListener('resize', this.lazyLoad);
    window.removeEventListener('orientationchange', this.lazyLoad);
    
    console.log('[图片懒加载] 已销毁');
  }
}

// 导出LazyImageLoader类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyImageLoader;
} else {
  window.LazyImageLoader = LazyImageLoader;
} 