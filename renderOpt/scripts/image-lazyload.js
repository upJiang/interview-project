/**
 * image-lazyload.js
 * 图片懒加载实现，提升首屏渲染性能
 */

class ImageLazyLoader {
  /**
   * 创建图片懒加载实例
   * @param {Object} options - 配置选项
   * @param {string} options.selector - 需要懒加载的图片选择器，默认为'img[data-src]'
   * @param {string} options.srcAttribute - 存储实际图片URL的属性名，默认为'data-src'
   * @param {string} options.placeholderSrc - 占位图片URL
   * @param {string} options.loadingClass - 加载中的类名
   * @param {string} options.loadedClass - 加载完成的类名
   * @param {string} options.errorClass - 加载失败的类名
   * @param {number} options.threshold - Intersection Observer的阈值，默认为0.1
   * @param {string} options.rootMargin - Intersection Observer的根元素边距，默认为'0px'
   * @param {HTMLElement} options.root - Intersection Observer的根元素，默认为null（视口）
   * @param {Function} options.onLoad - 图片加载成功回调
   * @param {Function} options.onError - 图片加载失败回调
   * @param {Function} options.transformSrc - 图片URL转换函数，用于CDN优化等
   * @param {boolean} options.useNative - 是否使用浏览器原生懒加载，默认为false
   * @param {boolean} options.loadImmediate - 是否立即开始加载图片，默认为true
   */
  constructor(options = {}) {
    // 默认配置
    this.options = {
      selector: 'img[data-src]',
      srcAttribute: 'data-src',
      placeholderSrc: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',
      loadingClass: 'img-loading',
      loadedClass: 'img-loaded',
      errorClass: 'img-error',
      threshold: 0.1,
      rootMargin: '0px',
      root: null,
      onLoad: null,
      onError: null,
      transformSrc: null,
      useNative: false,
      loadImmediate: true,
      ...options
    };

    // 状态
    this.state = {
      observer: null,
      elements: [],
      loadedCount: 0,
      totalCount: 0,
      stats: {
        successCount: 0,
        errorCount: 0,
        avgLoadTime: 0,
        totalLoadTime: 0,
      }
    };

    // 初始化
    if (this.options.loadImmediate) {
      // 确保在DOM加载完成后初始化
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }
  }

  /**
   * 初始化懒加载
   */
  init() {
    // 查找需要懒加载的图片
    this.state.elements = Array.from(document.querySelectorAll(this.options.selector));
    this.state.totalCount = this.state.elements.length;

    // 如果没有找到图片，直接返回
    if (this.state.totalCount === 0) {
      console.warn('[懒加载] 没有找到需要懒加载的图片');
      return;
    }

    console.log(`[懒加载] 找到 ${this.state.totalCount} 张需要懒加载的图片`);

    // 检查是否使用原生懒加载
    if (this.options.useNative && 'loading' in HTMLImageElement.prototype) {
      this._setupNativeLazyLoad();
    } else {
      // 检查是否支持IntersectionObserver
      if ('IntersectionObserver' in window) {
        this._setupIntersectionObserver();
      } else {
        this._setupFallbackLazyLoad();
      }
    }
  }

  /**
   * 使用浏览器原生懒加载
   * @private
   */
  _setupNativeLazyLoad() {
    console.log('[懒加载] 使用浏览器原生懒加载');

    this.state.elements.forEach(img => {
      // 添加loading属性
      img.loading = 'lazy';
      // 添加加载中类名
      img.classList.add(this.options.loadingClass);

      // 记录开始加载时间
      const startTime = performance.now();
      
      // 绑定加载事件
      img.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        this._onImageLoaded(img, loadTime);
      });

      // 绑定错误事件
      img.addEventListener('error', () => {
        this._onImageError(img);
      });

      // 获取实际图片地址
      const src = img.getAttribute(this.options.srcAttribute);
      
      // 转换图片URL
      const finalSrc = typeof this.options.transformSrc === 'function'
        ? this.options.transformSrc(src, img)
        : src;
      
      // 设置src属性
      if (finalSrc) {
        img.src = finalSrc;
      }
    });
  }

  /**
   * 使用IntersectionObserver实现懒加载
   * @private
   */
  _setupIntersectionObserver() {
    const { threshold, rootMargin, root } = this.options;

    // 创建IntersectionObserver实例
    this.state.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // 当图片进入视口
        if (entry.isIntersecting) {
          const img = entry.target;
          this._loadImage(img);
          // 停止观察已加载的图片
          this.state.observer.unobserve(img);
        }
      });
    }, {
      threshold,
      rootMargin,
      root
    });

    // 开始观察所有图片
    this.state.elements.forEach(img => {
      // 添加加载中类名
      img.classList.add(this.options.loadingClass);
      // 设置占位图
      if (this.options.placeholderSrc && !img.src) {
        img.src = this.options.placeholderSrc;
      }
      // 开始观察
      this.state.observer.observe(img);
    });

    console.log('[懒加载] 使用IntersectionObserver懒加载');
  }

  /**
   * 使用滚动事件实现懒加载（兼容方案）
   * @private
   */
  _setupFallbackLazyLoad() {
    console.log('[懒加载] 使用滚动事件实现懒加载（兼容方案）');

    // 为所有图片设置占位图
    this.state.elements.forEach(img => {
      // 添加加载中类名
      img.classList.add(this.options.loadingClass);
      // 设置占位图
      if (this.options.placeholderSrc && !img.src) {
        img.src = this.options.placeholderSrc;
      }
    });

    // 检查图片是否在视口内
    const checkInView = () => {
      this.state.elements.forEach(img => {
        // 如果图片已加载，跳过
        if (img.classList.contains(this.options.loadedClass) || 
            img.classList.contains(this.options.errorClass)) {
          return;
        }

        const rect = img.getBoundingClientRect();
        
        // 图片是否在视口内
        const inView = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (inView) {
          this._loadImage(img);
        }
      });
    };

    // 立即检查一次
    checkInView();

    // 添加滚动监听
    const scrollHandler = this._throttle(checkInView, 200);
    window.addEventListener('scroll', scrollHandler);
    window.addEventListener('resize', scrollHandler);
    window.addEventListener('orientationchange', scrollHandler);
  }

  /**
   * 加载图片
   * @param {HTMLImageElement} img - 要加载的图片元素
   * @private
   */
  _loadImage(img) {
    // 获取实际图片地址
    const src = img.getAttribute(this.options.srcAttribute);
    
    // 如果没有实际地址，标记为错误
    if (!src) {
      this._onImageError(img);
      return;
    }
    
    // 记录开始加载时间
    const startTime = performance.now();
    
    // 转换图片URL
    const finalSrc = typeof this.options.transformSrc === 'function'
      ? this.options.transformSrc(src, img)
      : src;
    
    // 创建新图片进行预加载
    const tempImg = new Image();
    
    // 监听加载事件
    tempImg.onload = () => {
      // 设置实际图片地址
      img.src = finalSrc;
      // 删除懒加载数据属性
      img.removeAttribute(this.options.srcAttribute);
      
      const loadTime = performance.now() - startTime;
      this._onImageLoaded(img, loadTime);
    };
    
    // 监听错误事件
    tempImg.onerror = () => {
      this._onImageError(img);
    };
    
    // 开始加载图片
    tempImg.src = finalSrc;
  }

  /**
   * 图片加载成功处理
   * @param {HTMLImageElement} img - 加载成功的图片元素
   * @param {number} loadTime - 加载时间（毫秒）
   * @private
   */
  _onImageLoaded(img, loadTime) {
    // 更新类名
    img.classList.remove(this.options.loadingClass);
    img.classList.add(this.options.loadedClass);
    
    // 更新计数器
    this.state.loadedCount++;
    this.state.stats.successCount++;
    
    // 更新性能统计
    this.state.stats.totalLoadTime += loadTime;
    this.state.stats.avgLoadTime = this.state.stats.totalLoadTime / this.state.stats.successCount;
    
    // 触发回调
    if (typeof this.options.onLoad === 'function') {
      this.options.onLoad(img, loadTime);
    }
    
    // 所有图片都已加载完成
    if (this.state.loadedCount >= this.state.totalCount) {
      this._onAllLoaded();
    }
  }

  /**
   * 图片加载失败处理
   * @param {HTMLImageElement} img - 加载失败的图片元素
   * @private
   */
  _onImageError(img) {
    // 更新类名
    img.classList.remove(this.options.loadingClass);
    img.classList.add(this.options.errorClass);
    
    // 更新计数器
    this.state.loadedCount++;
    this.state.stats.errorCount++;
    
    // 触发回调
    if (typeof this.options.onError === 'function') {
      this.options.onError(img);
    }
    
    // 所有图片都已处理完成
    if (this.state.loadedCount >= this.state.totalCount) {
      this._onAllLoaded();
    }
  }

  /**
   * 所有图片加载完成处理
   * @private
   */
  _onAllLoaded() {
    // 断开观察器连接
    if (this.state.observer) {
      this.state.observer.disconnect();
    }
    
    console.log('[懒加载] 所有图片加载完成', this.getStats());
  }

  /**
   * 节流函数，限制函数调用频率
   * @param {Function} func - 要节流的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function} 节流后的函数
   * @private
   */
  _throttle(func, wait) {
    let timeout = null;
    let previous = 0;

    return function(...args) {
      const now = Date.now();
      const remaining = wait - (now - previous);

      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func.apply(this, args);
      } else if (!timeout) {
        timeout = setTimeout(() => {
          previous = Date.now();
          timeout = null;
          func.apply(this, args);
        }, remaining);
      }
    };
  }

  /**
   * 手动加载指定的图片
   * @param {HTMLImageElement|string} target - 图片元素或选择器
   */
  load(target) {
    let img;
    
    if (typeof target === 'string') {
      img = document.querySelector(target);
    } else if (target instanceof HTMLImageElement) {
      img = target;
    }
    
    if (img) {
      this._loadImage(img);
      
      // 如果正在使用IntersectionObserver，停止观察该图片
      if (this.state.observer) {
        this.state.observer.unobserve(img);
      }
    }
  }

  /**
   * 手动加载所有图片
   */
  loadAll() {
    this.state.elements.forEach(img => {
      this._loadImage(img);
    });
    
    // 断开观察器连接
    if (this.state.observer) {
      this.state.observer.disconnect();
    }
  }

  /**
   * 获取加载统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const { totalCount } = this.state;
    const { successCount, errorCount, avgLoadTime, totalLoadTime } = this.state.stats;
    
    return {
      totalImages: totalCount,
      loadedImages: successCount,
      failedImages: errorCount,
      remainingImages: totalCount - successCount - errorCount,
      progress: `${Math.round((successCount + errorCount) / totalCount * 100)}%`,
      avgLoadTime: `${Math.round(avgLoadTime)}ms`,
      totalLoadTime: `${Math.round(totalLoadTime)}ms`,
    };
  }

  /**
   * 增加新的图片到懒加载队列
   * @param {string|HTMLImageElement|NodeList|Array} elements - 选择器、图片元素、NodeList或元素数组
   */
  add(elements) {
    let newElements = [];
    
    if (typeof elements === 'string') {
      // 如果是选择器，查找匹配的元素
      newElements = Array.from(document.querySelectorAll(elements));
    } else if (elements instanceof HTMLImageElement) {
      // 如果是单个HTML元素
      newElements = [elements];
    } else if (elements instanceof NodeList || Array.isArray(elements)) {
      // 如果是NodeList或数组
      newElements = Array.from(elements);
    }
    
    // 过滤出图片元素并且没有在当前队列中的元素
    const validElements = newElements.filter(el => {
      return el instanceof HTMLImageElement && !this.state.elements.includes(el);
    });
    
    if (validElements.length === 0) return;
    
    // 添加到队列
    this.state.elements = [...this.state.elements, ...validElements];
    this.state.totalCount = this.state.elements.length;
    
    // 开始观察新元素
    validElements.forEach(img => {
      // 添加加载中类名
      img.classList.add(this.options.loadingClass);
      
      // 设置占位图
      if (this.options.placeholderSrc && !img.src) {
        img.src = this.options.placeholderSrc;
      }
      
      // 如果使用IntersectionObserver
      if (this.state.observer) {
        this.state.observer.observe(img);
      }
    });
    
    console.log(`[懒加载] 添加了 ${validElements.length} 张新图片，队列中共有 ${this.state.totalCount} 张图片`);
  }

  /**
   * 重置懒加载状态
   */
  reset() {
    // 断开观察器连接
    if (this.state.observer) {
      this.state.observer.disconnect();
    }
    
    // 重置元素状态
    this.state.elements.forEach(img => {
      img.classList.remove(this.options.loadingClass, this.options.loadedClass, this.options.errorClass);
      
      // 如果有占位图，恢复占位图
      if (this.options.placeholderSrc) {
        img.src = this.options.placeholderSrc;
      }
    });
    
    // 重置状态
    this.state.loadedCount = 0;
    this.state.stats = {
      successCount: 0,
      errorCount: 0,
      avgLoadTime: 0,
      totalLoadTime: 0,
    };
    
    // 重新初始化
    this.init();
  }

  /**
   * 销毁懒加载实例
   */
  destroy() {
    // 断开观察器连接
    if (this.state.observer) {
      this.state.observer.disconnect();
      this.state.observer = null;
    }
    
    // 移除所有元素的加载中/已加载/错误类名
    this.state.elements.forEach(img => {
      img.classList.remove(this.options.loadingClass, this.options.loadedClass, this.options.errorClass);
    });
    
    // 清空状态
    this.state.elements = [];
    this.state.loadedCount = 0;
    this.state.totalCount = 0;
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageLazyLoader;
} else {
  window.ImageLazyLoader = ImageLazyLoader;
} 