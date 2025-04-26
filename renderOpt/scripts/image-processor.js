/**
 * image-processor.js
 * 图片处理和优化工具
 * 提供WebP转换、尺寸优化、预加载等功能
 */

class ImageProcessor {
  /**
   * 创建图片处理工具实例
   * @param {Object} options - 配置选项
   * @param {boolean} options.webpSupport - 是否支持WebP（自动检测）
   * @param {boolean} options.lazyLoadImages - 是否启用懒加载
   * @param {boolean} options.preloadCritical - 是否预加载关键图片
   * @param {boolean} options.responsiveImages - 是否启用响应式图片
   * @param {boolean} options.placeholderEnabled - 是否使用占位图
   * @param {string} options.placeholderColor - 占位图颜色
   * @param {boolean} options.blurUpEnabled - 是否使用模糊预览
   * @param {Function} options.onImageLoad - 图片加载完成回调
   * @param {Function} options.onImageError - 图片加载错误回调
   * @param {string} options.cdnBase - CDN基础URL
   * @param {Object} options.sizes - 响应式尺寸配置
   */
  constructor(options = {}) {
    this.options = {
      webpSupport: this._checkWebpSupport(),
      lazyLoadImages: true,
      preloadCritical: true,
      responsiveImages: true,
      placeholderEnabled: true,
      placeholderColor: '#f0f0f0',
      blurUpEnabled: true,
      onImageLoad: null,
      onImageError: null,
      cdnBase: '',
      sizes: {
        small: 400,
        medium: 800,
        large: 1200,
        xlarge: 1600
      },
      ...options
    };

    // 已处理的图片缓存
    this.processedImages = new Map();

    // 预加载的图片
    this.preloadedImages = new Set();
    
    // 性能测量
    this.metrics = {
      processedCount: 0,
      totalOriginalSize: 0,
      totalOptimizedSize: 0,
      loadTimes: []
    };

    // 初始化
    this._init();
  }

  /**
   * 初始化图片处理器
   * @private
   */
  _init() {
    // 检测WebP支持
    if (this.options.webpSupport === null) {
      this.options.webpSupport = this._checkWebpSupport();
    }

    // 在文档加载完成后执行预加载
    if (document.readyState === 'complete') {
      this._handleDOMReady();
    } else {
      window.addEventListener('DOMContentLoaded', () => this._handleDOMReady());
    }

    // 监听窗口大小变化，更新响应式图片
    if (this.options.responsiveImages) {
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => this._updateResponsiveImages(), 200);
      });
    }

    console.log(`[ImageProcessor] 初始化完成，WebP支持: ${this.options.webpSupport}`);
  }

  /**
   * 文档加载完成后的处理
   * @private
   */
  _handleDOMReady() {
    if (this.options.preloadCritical) {
      this._preloadCriticalImages();
    }
  }

  /**
   * 检测浏览器是否支持WebP
   * @returns {boolean} 是否支持WebP格式
   * @private
   */
  _checkWebpSupport() {
    try {
      // 检测浏览器是否支持webp
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        // WebP编码的dataURL以data:image/webp开头
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * 预加载关键图片
   * @private
   */
  _preloadCriticalImages() {
    const criticalImages = document.querySelectorAll('img[data-critical="true"]');
    
    criticalImages.forEach(img => {
      const src = img.getAttribute('data-src') || img.getAttribute('src');
      if (src && !this.preloadedImages.has(src)) {
        this.preloadImage(src);
      }
    });
  }

  /**
   * 更新响应式图片
   * @private
   */
  _updateResponsiveImages() {
    const responsiveImages = document.querySelectorAll('img[data-responsive="true"]');
    
    responsiveImages.forEach(img => {
      const originalSrc = img.getAttribute('data-original-src') || img.getAttribute('data-src');
      if (originalSrc) {
        const optimizedSrc = this.getResponsiveImageUrl(originalSrc, window.innerWidth);
        
        // 仅在源不同时更新
        if (img.src !== optimizedSrc) {
          img.src = optimizedSrc;
        }
      }
    });
  }

  /**
   * 转换图片URL为WebP格式（如果支持）
   * @param {string} url - 原始图片URL
   * @returns {string} 可能转换为WebP的URL
   * @private
   */
  _convertToWebpIfSupported(url) {
    if (!this.options.webpSupport) return url;
    
    // 已经是WebP格式
    if (url.toLowerCase().endsWith('.webp')) return url;
    
    // 对于支持的图片格式转换为WebP
    const supportedFormats = ['.jpg', '.jpeg', '.png'];
    const lowerUrl = url.toLowerCase();
    
    for (const format of supportedFormats) {
      if (lowerUrl.endsWith(format)) {
        // 找到扩展名的位置，并替换为.webp
        const extIndex = url.lastIndexOf('.');
        if (extIndex !== -1) {
          return url.substring(0, extIndex) + '.webp';
        }
      }
    }
    
    // 无法确定扩展名，添加WebP参数
    // 通常CDN支持类似?format=webp的参数
    if (url.includes('?')) {
      return `${url}&format=webp`;
    } else {
      return `${url}?format=webp`;
    }
  }

  /**
   * 获取合适尺寸的响应式图片URL
   * @param {string} url - 原始图片URL
   * @param {number} [screenWidth=window.innerWidth] - 屏幕宽度
   * @returns {string} 优化后的URL
   * @private
   */
  _getResponsiveSizeUrl(url, screenWidth = window.innerWidth) {
    const { sizes } = this.options;
    
    // 选择合适的尺寸
    let targetSize;
    if (screenWidth <= sizes.small) {
      targetSize = sizes.small;
    } else if (screenWidth <= sizes.medium) {
      targetSize = sizes.medium;
    } else if (screenWidth <= sizes.large) {
      targetSize = sizes.large;
    } else {
      targetSize = sizes.xlarge;
    }
    
    // 应用尺寸参数
    if (url.includes('?')) {
      return `${url}&width=${targetSize}`;
    } else {
      return `${url}?width=${targetSize}`;
    }
  }

  /**
   * 应用CDN基础URL
   * @param {string} url - 原始图片URL
   * @returns {string} 包含CDN基础URL的完整URL
   * @private
   */
  _applyCdnBase(url) {
    if (!this.options.cdnBase || url.startsWith('http') || url.startsWith('//')) {
      return url;
    }
    
    // 确保URL格式正确
    if (url.startsWith('/')) {
      return `${this.options.cdnBase}${url}`;
    } else {
      return `${this.options.cdnBase}/${url}`;
    }
  }

  /**
   * 创建占位图URL
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {string} [color] - 颜色
   * @returns {string} 占位图URL
   * @private
   */
  _createPlaceholder(width, height, color) {
    const placeholderColor = color || this.options.placeholderColor;
    // 使用svgBase64创建占位图
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="${placeholderColor}"/>
    </svg>`;
    
    // 转换为base64
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 创建低质量预览图
   * @param {string} url - 原始图片URL
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @returns {string} 预览图URL
   * @private
   */
  _createLowQualityPreview(url, width, height) {
    // 实际项目中，这里可能使用服务端生成的缩略图
    // 简化实现，返回尺寸非常小的图片URL
    if (url.includes('?')) {
      return `${url}&width=30&blur=10`;
    } else {
      return `${url}?width=30&blur=10`;
    }
  }

  /**
   * 预加载图片
   * @param {string} url - 图片URL
   * @returns {Promise<HTMLImageElement>} 加载完成的图片元素
   */
  preloadImage(url) {
    return new Promise((resolve, reject) => {
      if (this.preloadedImages.has(url)) {
        // 已经预加载过，直接解析
        resolve(url);
        return;
      }
      
      const startTime = performance.now();
      const img = new Image();
      
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        this.metrics.loadTimes.push({ url, time: loadTime });
        this.preloadedImages.add(url);
        
        // 调用回调（如果有）
        if (typeof this.options.onImageLoad === 'function') {
          this.options.onImageLoad(url, img);
        }
        
        resolve(img);
      };
      
      img.onerror = () => {
        if (typeof this.options.onImageError === 'function') {
          this.options.onImageError(url);
        }
        reject(new Error(`图片加载失败: ${url}`));
      };
      
      // 开始加载
      img.src = url;
    });
  }

  /**
   * 优化图片URL
   * @param {string} url - 原始图片URL
   * @param {Object} options - 优化选项
   * @param {boolean} options.webp - 是否转换为WebP
   * @param {boolean} options.responsive - 是否应用响应式尺寸
   * @param {boolean} options.cdn - 是否应用CDN
   * @param {number} options.width - 屏幕宽度
   * @returns {string} 优化后的URL
   */
  optimizeImageUrl(url, options = {}) {
    const defaultOptions = {
      webp: this.options.webpSupport,
      responsive: this.options.responsiveImages,
      cdn: !!this.options.cdnBase,
      width: window.innerWidth
    };
    
    const opts = { ...defaultOptions, ...options };
    let optimizedUrl = url;
    
    // 缓存检查
    const cacheKey = JSON.stringify({ url, opts });
    if (this.processedImages.has(cacheKey)) {
      return this.processedImages.get(cacheKey);
    }
    
    // 应用CDN
    if (opts.cdn) {
      optimizedUrl = this._applyCdnBase(optimizedUrl);
    }
    
    // 应用响应式尺寸
    if (opts.responsive) {
      optimizedUrl = this._getResponsiveSizeUrl(optimizedUrl, opts.width);
    }
    
    // 转换为WebP
    if (opts.webp) {
      optimizedUrl = this._convertToWebpIfSupported(optimizedUrl);
    }
    
    // 更新统计信息
    this.metrics.processedCount++;
    
    // 缓存结果
    this.processedImages.set(cacheKey, optimizedUrl);
    
    return optimizedUrl;
  }

  /**
   * 获取响应式图片URL
   * @param {string} url - 原始图片URL
   * @param {number} [screenWidth=window.innerWidth] - 屏幕宽度
   * @returns {string} 响应式图片URL
   */
  getResponsiveImageUrl(url, screenWidth = window.innerWidth) {
    return this.optimizeImageUrl(url, {
      responsive: true,
      width: screenWidth
    });
  }

  /**
   * 获取WebP图片URL
   * @param {string} url - 原始图片URL
   * @returns {string} WebP图片URL
   */
  getWebpImageUrl(url) {
    return this.optimizeImageUrl(url, {
      webp: true,
      responsive: false
    });
  }

  /**
   * 获取完全优化的图片URL
   * @param {string} url - 原始图片URL
   * @returns {string} 优化后的URL
   */
  getOptimizedImageUrl(url) {
    return this.optimizeImageUrl(url);
  }

  /**
   * 创建响应式图片元素
   * @param {string} src - 原始图片URL
   * @param {Object} options - 图片选项
   * @param {string} options.alt - 图片alt文本
   * @param {number} options.width - 图片宽度
   * @param {number} options.height - 图片高度
   * @param {boolean} options.lazy - 是否懒加载
   * @param {boolean} options.critical - 是否关键图片
   * @param {Object} options.sizes - 响应式尺寸配置
   * @returns {HTMLImageElement} 创建的图片元素
   */
  createOptimizedImage(src, options = {}) {
    const img = document.createElement('img');
    const opts = {
      alt: '',
      width: 0,
      height: 0,
      lazy: this.options.lazyLoadImages,
      critical: false,
      sizes: '',
      ...options
    };
    
    // 设置基本属性
    if (opts.alt) img.alt = opts.alt;
    if (opts.width) img.width = opts.width;
    if (opts.height) img.height = opts.height;
    
    // 标记为响应式图片
    img.setAttribute('data-responsive', 'true');
    img.setAttribute('data-original-src', src);
    
    // 标记关键图片
    if (opts.critical) {
      img.setAttribute('data-critical', 'true');
    }
    
    // 处理懒加载
    if (opts.lazy && !opts.critical) {
      // 如果是懒加载，设置低质量预览或占位图
      if (this.options.blurUpEnabled) {
        img.src = this._createLowQualityPreview(src, opts.width, opts.height);
      } else if (this.options.placeholderEnabled) {
        img.src = this._createPlaceholder(opts.width, opts.height);
      }
      
      // 将实际图片URL存储在data-src中
      img.setAttribute('data-src', this.getOptimizedImageUrl(src));
      img.setAttribute('loading', 'lazy');
    } else {
      // 直接加载
      img.src = this.getOptimizedImageUrl(src);
    }
    
    // 添加srcset
    if (this.options.responsiveImages) {
      const srcsetValues = [];
      const breakpoints = Object.values(this.options.sizes).sort((a, b) => a - b);
      
      breakpoints.forEach(bp => {
        const url = this.optimizeImageUrl(src, {
          responsive: true,
          width: bp
        });
        srcsetValues.push(`${url} ${bp}w`);
      });
      
      if (srcsetValues.length > 0) {
        img.setAttribute('srcset', srcsetValues.join(', '));
      }
      
      // 如果提供了sizes属性
      if (opts.sizes) {
        img.setAttribute('sizes', opts.sizes);
      } else {
        // 默认sizes
        img.setAttribute('sizes', '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw');
      }
    }
    
    // 加载事件
    img.addEventListener('load', () => {
      img.classList.add('loaded');
      if (typeof this.options.onImageLoad === 'function') {
        this.options.onImageLoad(src, img);
      }
    });
    
    img.addEventListener('error', () => {
      img.classList.add('error');
      // 尝试回退到原始URL
      if (img.src !== src) {
        console.warn(`图片加载失败，回退到原始URL: ${src}`);
        img.src = src;
      }
      
      if (typeof this.options.onImageError === 'function') {
        this.options.onImageError(src, img);
      }
    });
    
    return img;
  }

  /**
   * 处理页面上的所有图片
   * @param {string} [selector='img'] - 要处理的图片选择器
   */
  processPageImages(selector = 'img') {
    const images = document.querySelectorAll(selector);
    
    images.forEach(img => {
      // 跳过已处理的图片
      if (img.hasAttribute('data-processed')) {
        return;
      }
      
      const src = img.getAttribute('src');
      if (!src) return;
      
      // 跳过数据URI
      if (src.startsWith('data:')) return;
      
      const width = img.width || 0;
      const height = img.height || 0;
      const isLazy = img.getAttribute('loading') === 'lazy' || this.options.lazyLoadImages;
      const isCritical = img.hasAttribute('data-critical') || false;
      
      // 原始URL保存到data-original-src属性
      img.setAttribute('data-original-src', src);
      
      // 处理响应式
      if (this.options.responsiveImages) {
        img.setAttribute('data-responsive', 'true');
        
        // 生成和设置srcset
        const srcsetValues = [];
        const breakpoints = Object.values(this.options.sizes).sort((a, b) => a - b);
        
        breakpoints.forEach(bp => {
          const url = this.optimizeImageUrl(src, {
            responsive: true,
            width: bp
          });
          srcsetValues.push(`${url} ${bp}w`);
        });
        
        if (srcsetValues.length > 0) {
          img.setAttribute('srcset', srcsetValues.join(', '));
        }
        
        // 如果没有sizes属性，添加默认值
        if (!img.hasAttribute('sizes')) {
          img.setAttribute('sizes', '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw');
        }
      }
      
      // 处理懒加载
      if (isLazy && !isCritical) {
        // 如果是lazy loading，设置data-src，并使用占位图或低质量预览
        img.setAttribute('data-src', this.getOptimizedImageUrl(src));
        img.setAttribute('loading', 'lazy');
        
        if (this.options.blurUpEnabled) {
          img.src = this._createLowQualityPreview(src, width, height);
        } else if (this.options.placeholderEnabled) {
          img.src = this._createPlaceholder(width, height);
        }
      } else {
        // 直接设置优化后的src
        img.src = this.getOptimizedImageUrl(src);
      }
      
      // 标记为已处理
      img.setAttribute('data-processed', 'true');
    });
  }

  /**
   * 获取性能指标
   * @returns {Object} 性能指标
   */
  getMetrics() {
    return this.metrics;
  }
}

// 创建单例
let imageProcessorInstance = null;

/**
 * 获取ImageProcessor实例
 * @param {Object} [options] - 配置选项
 * @returns {ImageProcessor} 单例实例
 */
function getImageProcessor(options) {
  if (!imageProcessorInstance) {
    imageProcessorInstance = new ImageProcessor(options);
  }
  return imageProcessorInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    ImageProcessor,
    getImageProcessor
  };
} else {
  window.ImageProcessor = ImageProcessor;
  window.getImageProcessor = getImageProcessor;
} 