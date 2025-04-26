/**
 * lazy-load.js
 * 懒加载实现，用于延迟加载图片和其他资源，优化首屏渲染性能
 */

class LazyLoad {
  /**
   * 创建懒加载实例
   * @param {Object} options - 配置选项
   * @param {string} options.selector - 需要懒加载的元素选择器
   * @param {string} options.attributeName - 存储真实资源路径的属性名
   * @param {number} options.threshold - 可见性阈值，范围0-1
   * @param {string} options.loadingClass - 加载中的类名
   * @param {string} options.loadedClass - 加载完成的类名
   * @param {string} options.errorClass - 加载失败的类名
   * @param {Function} options.onLoad - 加载成功的回调
   * @param {Function} options.onError - 加载失败的回调
   * @param {boolean} options.useNative - 是否使用原生懒加载
   * @param {number} options.debounceDelay - 滚动事件防抖延迟
   * @param {Object} options.defaultImage - 默认图片配置
   * @param {string} options.rootMargin - 根元素边距
   */
  constructor(options = {}) {
    this.options = {
      selector: '[data-src]',
      attributeName: 'data-src',
      threshold: 0.1,
      loadingClass: 'lazy-loading',
      loadedClass: 'lazy-loaded',
      errorClass: 'lazy-error',
      onLoad: null,
      onError: null,
      useNative: 'loading' in HTMLImageElement.prototype,
      debounceDelay: 200,
      defaultImage: {
        placeholder: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjwvc3ZnPg==',
        error: null
      },
      rootMargin: '50px 0px',
      ...options
    };

    // 正在加载的元素集合
    this.loadingElements = new Set();
    
    // IntersectionObserver实例
    this.observer = null;
    
    // 统计数据
    this.stats = {
      total: 0,
      loaded: 0,
      errors: 0,
      cached: 0
    };
    
    // 滚动事件处理函数
    this.scrollHandler = null;
    
    // 初始化
    this._init();
  }

  /**
   * 初始化懒加载
   * @private
   */
  _init() {
    // 检查浏览器支持
    const canUseIntersectionObserver = 'IntersectionObserver' in window;

    if (this.options.useNative && 'loading' in HTMLImageElement.prototype) {
      // 使用原生懒加载
      this._initNativeLazyLoad();
    } else if (canUseIntersectionObserver) {
      // 使用IntersectionObserver
      this._initIntersectionObserver();
    } else {
      // 降级方案：使用滚动事件
      this._initScrollListener();
    }

    // 初始化统计
    this._initStats();
  }

  /**
   * 初始化原生懒加载
   * @private
   */
  _initNativeLazyLoad() {
    const elements = document.querySelectorAll(this.options.selector);
    this.stats.total = elements.length;

    elements.forEach(element => {
      // 设置为加载中状态
      element.classList.add(this.options.loadingClass);

      if (element.tagName.toLowerCase() === 'img') {
        // 原生懒加载仅支持img元素
        element.loading = 'lazy';
        const src = element.getAttribute(this.options.attributeName);
        
        // 设置默认图片（如果有）
        if (this.options.defaultImage.placeholder) {
          element.src = element.src || this.options.defaultImage.placeholder;
        }
        
        if (src) {
          element.src = src;
          element.removeAttribute(this.options.attributeName);
          
          // 添加加载事件
          element.addEventListener('load', () => this._onElementLoaded(element));
          element.addEventListener('error', () => this._onElementError(element));
        }
      } else {
        // 对于非图片元素，仍使用IntersectionObserver
        this._initIntersectionObserver([element]);
      }
    });
  }

  /**
   * 初始化IntersectionObserver
   * @param {Array} [specificElements] - 指定要监听的元素，不传则监听所有匹配元素
   * @private
   */
  _initIntersectionObserver(specificElements) {
    // 创建IntersectionObserver实例
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // 当元素可见时加载
        if (entry.isIntersecting) {
          this._loadElement(entry.target);
          // 停止监听已加载的元素
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: this.options.threshold,
      rootMargin: this.options.rootMargin
    });

    // 获取需要懒加载的元素
    const elements = specificElements || document.querySelectorAll(this.options.selector);
    this.stats.total = specificElements ? this.stats.total + specificElements.length : elements.length;

    // 开始监听元素
    elements.forEach(element => {
      // 设置为加载中状态
      element.classList.add(this.options.loadingClass);
      
      // 设置默认图片（如果是图片元素且有默认图片配置）
      if (element.tagName.toLowerCase() === 'img' && this.options.defaultImage.placeholder) {
        element.src = element.src || this.options.defaultImage.placeholder;
      }
      
      // 开始监听
      this.observer.observe(element);
    });
  }

  /**
   * 初始化滚动监听（降级方案）
   * @private
   */
  _initScrollListener() {
    // 创建防抖函数
    this.scrollHandler = this._debounce(() => {
      this._checkElementsVisibility();
    }, this.options.debounceDelay);

    // 监听滚动事件
    window.addEventListener('scroll', this.scrollHandler);
    window.addEventListener('resize', this.scrollHandler);
    window.addEventListener('orientationchange', this.scrollHandler);

    // 初始检查
    this._checkElementsVisibility();
  }

  /**
   * 检查元素可见性
   * @private
   */
  _checkElementsVisibility() {
    const elements = document.querySelectorAll(this.options.selector);
    this.stats.total = elements.length;

    elements.forEach(element => {
      // 已经在加载中或已加载完成的元素跳过
      if (this.loadingElements.has(element) || 
          element.classList.contains(this.options.loadedClass) ||
          element.classList.contains(this.options.errorClass)) {
        return;
      }

      // 检查元素是否在视口内
      if (this._isElementInViewport(element)) {
        this._loadElement(element);
      }
    });
  }

  /**
   * 判断元素是否在视口内
   * @param {HTMLElement} element - 要检查的元素
   * @returns {boolean} 是否在视口内
   * @private
   */
  _isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    const rootMarginValue = parseInt(this.options.rootMargin) || 0;

    return (
      rect.bottom >= 0 - rootMarginValue &&
      rect.right >= 0 - rootMarginValue &&
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) + rootMarginValue &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth) + rootMarginValue
    );
  }

  /**
   * 加载元素
   * @param {HTMLElement} element - 要加载的元素
   * @private
   */
  _loadElement(element) {
    // 防止重复加载
    if (this.loadingElements.has(element) || 
        element.classList.contains(this.options.loadedClass) ||
        element.classList.contains(this.options.errorClass)) {
      return;
    }

    // 添加到加载集合
    this.loadingElements.add(element);

    // 设置加载中状态
    element.classList.add(this.options.loadingClass);

    // 获取真实资源路径
    const src = element.getAttribute(this.options.attributeName);
    if (!src) {
      // 如果没有资源路径，直接标记为错误
      this._onElementError(element);
      return;
    }

    // 根据元素类型处理
    if (element.tagName.toLowerCase() === 'img') {
      // 图片元素
      element.src = src;
      element.removeAttribute(this.options.attributeName);
      
      // 添加事件监听
      element.addEventListener('load', () => this._onElementLoaded(element));
      element.addEventListener('error', () => this._onElementError(element));
    } else if (element.tagName.toLowerCase() === 'picture') {
      // picture元素
      const imgElement = element.querySelector('img');
      const sourceElements = element.querySelectorAll('source');

      // 更新source元素
      sourceElements.forEach(source => {
        const dataSrcset = source.getAttribute('data-srcset');
        if (dataSrcset) {
          source.srcset = dataSrcset;
          source.removeAttribute('data-srcset');
        }
      });

      // 更新img元素
      if (imgElement) {
        imgElement.src = src;
        imgElement.removeAttribute(this.options.attributeName);
        imgElement.addEventListener('load', () => this._onElementLoaded(element));
        imgElement.addEventListener('error', () => this._onElementError(element));
      } else {
        this._onElementLoaded(element);
      }
    } else if (element.tagName.toLowerCase() === 'video') {
      // 视频元素
      const sourceElements = element.querySelectorAll('source');
      
      // 更新source元素
      sourceElements.forEach(source => {
        const dataSrc = source.getAttribute('data-src');
        if (dataSrc) {
          source.src = dataSrc;
          source.removeAttribute('data-src');
        }
      });

      // 如果没有source子元素，设置video的src
      if (sourceElements.length === 0) {
        element.src = src;
        element.removeAttribute(this.options.attributeName);
      }

      // 加载视频
      element.load();
      element.addEventListener('loadeddata', () => this._onElementLoaded(element));
      element.addEventListener('error', () => this._onElementError(element));
    } else if (element.tagName.toLowerCase() === 'iframe') {
      // iframe元素
      element.src = src;
      element.removeAttribute(this.options.attributeName);
      element.addEventListener('load', () => this._onElementLoaded(element));
      element.addEventListener('error', () => this._onElementError(element));
    } else {
      // 其他元素，如div、section等（背景图片）
      const image = new Image();
      image.src = src;
      image.addEventListener('load', () => {
        // 设置背景图片
        element.style.backgroundImage = `url(${src})`;
        element.removeAttribute(this.options.attributeName);
        this._onElementLoaded(element);
      });
      image.addEventListener('error', () => this._onElementError(element));
    }
  }

  /**
   * 元素加载成功处理
   * @param {HTMLElement} element - 加载完成的元素
   * @private
   */
  _onElementLoaded(element) {
    // 从加载集合中移除
    this.loadingElements.delete(element);

    // 更新状态
    element.classList.remove(this.options.loadingClass);
    element.classList.add(this.options.loadedClass);

    // 更新统计
    this.stats.loaded++;

    // 调用回调
    if (typeof this.options.onLoad === 'function') {
      this.options.onLoad(element);
    }

    // 触发自定义事件
    this._triggerEvent(element, 'lazy:loaded');
  }

  /**
   * 元素加载失败处理
   * @param {HTMLElement} element - 加载失败的元素
   * @private
   */
  _onElementError(element) {
    // 从加载集合中移除
    this.loadingElements.delete(element);

    // 更新状态
    element.classList.remove(this.options.loadingClass);
    element.classList.add(this.options.errorClass);

    // 设置错误图片（如果有）
    if (element.tagName.toLowerCase() === 'img' && this.options.defaultImage.error) {
      element.src = this.options.defaultImage.error;
    }

    // 更新统计
    this.stats.errors++;

    // 调用回调
    if (typeof this.options.onError === 'function') {
      this.options.onError(element);
    }

    // 触发自定义事件
    this._triggerEvent(element, 'lazy:error');
  }

  /**
   * 初始化统计数据
   * @private
   */
  _initStats() {
    // 重置统计数据
    this.stats = {
      total: document.querySelectorAll(this.options.selector).length,
      loaded: 0,
      errors: 0,
      cached: 0
    };
  }

  /**
   * 触发自定义事件
   * @param {HTMLElement} element - 要触发事件的元素
   * @param {string} eventName - 事件名称
   * @private
   */
  _triggerEvent(element, eventName) {
    const event = new CustomEvent(eventName, {
      detail: { element }
    });
    element.dispatchEvent(event);
  }

  /**
   * 创建防抖函数
   * @param {Function} func - 要执行的函数
   * @param {number} delay - 延迟时间(ms)
   * @returns {Function} 防抖后的函数
   * @private
   */
  _debounce(func, delay) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  /**
   * 添加新的元素到懒加载队列
   * @param {HTMLElement|NodeList|Array} elements - 要添加的元素
   * @returns {LazyLoad} this
   */
  add(elements) {
    // 将单个元素或元素集合转换为数组
    const elementsArray = elements instanceof Element ? [elements] :
                          elements instanceof NodeList ? Array.from(elements) :
                          Array.isArray(elements) ? elements : [];

    if (this.observer) {
      // 使用IntersectionObserver
      elementsArray.forEach(element => {
        // 设置加载中状态
        element.classList.add(this.options.loadingClass);
        
        // 设置默认图片（如果是图片元素且有默认图片配置）
        if (element.tagName.toLowerCase() === 'img' && this.options.defaultImage.placeholder) {
          element.src = element.src || this.options.defaultImage.placeholder;
        }
        
        // 开始监听
        this.observer.observe(element);
      });
    } else {
      // 使用滚动监听，立即检查可见性
      this._checkElementsVisibility();
    }

    // 更新统计
    this.stats.total += elementsArray.length;

    return this;
  }

  /**
   * 立即加载所有元素，不等待懒加载条件
   * @returns {LazyLoad} this
   */
  loadAll() {
    const elements = document.querySelectorAll(this.options.selector);
    
    elements.forEach(element => {
      // 如果使用IntersectionObserver，停止监听
      if (this.observer) {
        this.observer.unobserve(element);
      }
      
      // 直接加载元素
      this._loadElement(element);
    });
    
    return this;
  }

  /**
   * 获取懒加载统计数据
   * @returns {Object} 统计数据
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 重置懒加载
   * @returns {LazyLoad} this
   */
  reset() {
    // 停止所有监听
    this.destroy();
    
    // 重新初始化
    this._init();
    
    return this;
  }

  /**
   * 销毁懒加载实例
   */
  destroy() {
    // 停止IntersectionObserver
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // 移除滚动事件监听
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
      window.removeEventListener('orientationchange', this.scrollHandler);
      this.scrollHandler = null;
    }
    
    // 清空加载集合
    this.loadingElements.clear();
  }
}

// 单例模式
let lazyLoadInstance = null;

/**
 * 获取懒加载实例
 * @param {Object} [options] - 配置选项
 * @returns {LazyLoad} 懒加载实例
 */
function getLazyLoad(options) {
  if (!lazyLoadInstance) {
    lazyLoadInstance = new LazyLoad(options);
  }
  return lazyLoadInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LazyLoad,
    getLazyLoad
  };
} else {
  window.LazyLoad = LazyLoad;
  window.getLazyLoad = getLazyLoad;
} 