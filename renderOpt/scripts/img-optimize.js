/**
 * img-optimize.js
 * 图片优化脚本，实现懒加载、WebP支持、自适应图片、预加载等功能
 */

(function() {
  class ImageOptimizer {
    constructor(options = {}) {
      this.options = Object.assign({
        lazyLoadEnabled: true,          // 是否启用懒加载
        lazyLoadThreshold: 200,         // 懒加载阈值（距离可视区域多远开始加载）
        webpEnabled: true,              // 是否启用WebP
        placeholderEnabled: true,       // 是否启用占位图
        placeholderColor: '#f0f0f0',    // 占位图颜色
        blurUpEnabled: true,            // 是否启用模糊图片逐渐清晰
        responsiveEnabled: true,        // 是否启用响应式图片
        preloadEnabled: true,           // 是否启用预加载
        preloadDistance: 800,           // 预加载距离（距离可视区域多远开始预加载）
        errorFallbackEnabled: true,     // 是否启用加载失败后回退
        errorPlaceholder: '',           // 加载失败占位图
        debugEnabled: false,            // 是否启用调试模式
        customSelector: '[data-src]',   // 自定义选择器
        priorityAttributeName: 'data-priority', // 优先级属性名
        sizeAttributeName: 'data-sizes', // 尺寸属性名
        srcsetAttributeName: 'data-srcset', // srcset属性名
        observerOptions: {              // IntersectionObserver选项
          root: null,
          rootMargin: '200px 0px',
          threshold: 0.01
        }
      }, options);
      
      // 存储加载状态
      this.loadedImages = new Set();
      this.failedImages = new Set();
      this.pendingImages = new Set();
      
      // 性能追踪
      this.performanceData = {
        totalImages: 0,
        loadedCount: 0,
        failedCount: 0,
        cachedCount: 0,
        totalLoadTime: 0,
        avgLoadTime: 0,
        webpSavings: 0
      };
      
      // 初始化
      this.init();
    }
    
    init() {
      // 检测WebP支持
      this.detectWebpSupport().then(supported => {
        this.webpSupported = supported && this.options.webpEnabled;
        
        if (this.options.debugEnabled) {
          console.log(`[ImageOptimizer] WebP支持: ${this.webpSupported}`);
        }
        
        // 初始化懒加载
        if (this.options.lazyLoadEnabled) {
          this.initLazyLoad();
        }
        
        // 初始化优先级加载
        this.initPriorityLoad();
        
        // 注册事件监听器
        this.registerEventListeners();
      });
    }
    
    /**
     * 检测浏览器是否支持WebP格式
     * @returns {Promise<boolean>} 是否支持WebP
     */
    detectWebpSupport() {
      return new Promise(resolve => {
        const webpImage = new Image();
        
        webpImage.onload = function() {
          // WebP图片加载成功，表示支持
          resolve(webpImage.width === 1);
        };
        
        webpImage.onerror = function() {
          // WebP图片加载失败，表示不支持
          resolve(false);
        };
        
        // 使用Base64编码的1x1像素WebP图片
        webpImage.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
      });
    }
    
    /**
     * 初始化懒加载
     */
    initLazyLoad() {
      // 检查IntersectionObserver API支持
      if (!('IntersectionObserver' in window)) {
        // 回退到传统的滚动事件监听
        this.initFallbackLazyLoad();
        return;
      }
      
      const observerOptions = this.options.observerOptions;
      
      // 创建IntersectionObserver实例
      this.lazyLoadObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          // 当图片进入视口时
          if (entry.isIntersecting) {
            const img = entry.target;
            
            // 停止监听已处理的图片
            this.lazyLoadObserver.unobserve(img);
            
            // 加载图片
            this.loadImage(img);
          }
        });
      }, observerOptions);
      
      // 查找所有待懒加载的图片
      const lazyImages = document.querySelectorAll(this.options.customSelector);
      
      this.performanceData.totalImages = lazyImages.length;
      
      // 开始监听每一张图片
      lazyImages.forEach(img => {
        // 应用占位符（如果启用）
        if (this.options.placeholderEnabled) {
          this.applyPlaceholder(img);
        }
        
        // 如果图片已经在视口中或者是高优先级，立即加载
        if (this.isInViewport(img) || this.getImagePriority(img) === 'high') {
          this.loadImage(img);
        } else {
          // 否则，添加到懒加载观察器
          this.lazyLoadObserver.observe(img);
        }
      });
      
      if (this.options.debugEnabled) {
        console.log(`[ImageOptimizer] 已初始化懒加载，共 ${lazyImages.length} 张图片`);
      }
    }
    
    /**
     * 初始化优先级加载
     */
    initPriorityLoad() {
      // 查找所有高优先级图片
      const highPriorityImages = document.querySelectorAll(`[${this.options.priorityAttributeName}="high"]${this.options.customSelector}`);
      
      // 立即加载高优先级图片
      highPriorityImages.forEach(img => {
        this.loadImage(img, true);  // true表示高优先级
      });
      
      if (this.options.debugEnabled && highPriorityImages.length > 0) {
        console.log(`[ImageOptimizer] 已加载 ${highPriorityImages.length} 张高优先级图片`);
      }
    }
    
    /**
     * 回退到传统的滚动事件监听（当IntersectionObserver不可用时）
     */
    initFallbackLazyLoad() {
      const lazyImages = document.querySelectorAll(this.options.customSelector);
      
      // 检查图片是否在视口内的函数
      const checkImages = () => {
        lazyImages.forEach(img => {
          if (!this.loadedImages.has(img) && !this.pendingImages.has(img) && this.isInViewport(img, this.options.lazyLoadThreshold)) {
            this.loadImage(img);
          }
        });
      };
      
      // 立即检查一次，处理已经在视口中的图片
      checkImages();
      
      // 添加节流的滚动事件监听器
      let scrollTimeout;
      const scrollHandler = () => {
        if (scrollTimeout) {
          return;
        }
        
        scrollTimeout = setTimeout(() => {
          checkImages();
          scrollTimeout = null;
        }, 100);  // 100ms节流
      };
      
      // 监听滚动和调整大小事件
      window.addEventListener('scroll', scrollHandler, { passive: true });
      window.addEventListener('resize', scrollHandler, { passive: true });
      
      if (this.options.debugEnabled) {
        console.log('[ImageOptimizer] 使用传统滚动事件监听进行懒加载');
      }
    }
    
    /**
     * 注册事件监听器
     */
    registerEventListeners() {
      // 优化页面可见性变化时的加载
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // 页面变为可见时，预加载更多图片
          this.preloadImagesInViewport(this.options.preloadDistance * 2);
        }
      });
      
      // 页面离开前记录性能数据
      window.addEventListener('beforeunload', () => {
        this.logPerformance();
      });
    }
    
    /**
     * 加载图片
     * @param {HTMLImageElement} img - 图片元素
     * @param {boolean} isHighPriority - 是否为高优先级
     * @returns {Promise} 加载完成的Promise
     */
    loadImage(img, isHighPriority = false) {
      // 如果图片已经加载或正在加载，则跳过
      if (this.loadedImages.has(img) || this.pendingImages.has(img)) {
        return Promise.resolve();
      }
      
      // 记录为待处理
      this.pendingImages.add(img);
      
      // 记录开始加载时间
      const startTime = performance.now();
      
      // 获取图片URL和其他属性
      const src = this.getOptimalImageUrl(img);
      const srcset = img.getAttribute(this.options.srcsetAttributeName);
      const sizes = img.getAttribute(this.options.sizeAttributeName);
      
      // 创建一个Promise来处理图片加载
      return new Promise((resolve, reject) => {
        // 如果启用了模糊变清晰效果
        if (this.options.blurUpEnabled) {
          img.style.filter = 'blur(10px)';
          img.style.transition = 'filter 0.5s ease-out';
        }
        
        // 设置加载和错误处理函数
        const onLoad = () => {
          // 计算加载时间
          const loadTime = performance.now() - startTime;
          
          // 更新性能数据
          this.performanceData.loadedCount++;
          this.performanceData.totalLoadTime += loadTime;
          this.performanceData.avgLoadTime = this.performanceData.totalLoadTime / this.performanceData.loadedCount;
          
          // 记录是否来自缓存
          const fromCache = loadTime < 20;  // 假设<20ms为缓存加载
          if (fromCache) {
            this.performanceData.cachedCount++;
          }
          
          // 移除blur效果（如果启用）
          if (this.options.blurUpEnabled) {
            img.style.filter = '';
          }
          
          // 添加到已加载集合，移除待处理状态
          this.loadedImages.add(img);
          this.pendingImages.delete(img);
          
          // 添加已加载标记类
          img.classList.add('loaded');
          
          // 如果启用了预加载且不是高优先级，预加载更多图片
          if (this.options.preloadEnabled && !isHighPriority) {
            this.preloadImagesInViewport(this.options.preloadDistance);
          }
          
          if (this.options.debugEnabled) {
            console.log(`[ImageOptimizer] 图片已加载: ${src}，用时: ${loadTime.toFixed(2)}ms`, 
              fromCache ? '(来自缓存)' : '');
          }
          
          // 解析Promise
          resolve(img);
          
          // 移除事件监听器
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
        };
        
        const onError = () => {
          // 增加失败计数
          this.performanceData.failedCount++;
          
          // 记录到失败集合，移除待处理状态
          this.failedImages.add(img);
          this.pendingImages.delete(img);
          
          // 尝试回退处理
          if (this.options.errorFallbackEnabled) {
            // 尝试使用原始非WebP URL
            if (this.webpSupported && src.includes('.webp')) {
              const originalSrc = img.getAttribute('data-src');
              if (originalSrc && originalSrc !== src) {
                img.src = originalSrc;
                
                if (this.options.debugEnabled) {
                  console.warn(`[ImageOptimizer] WebP加载失败，回退到原始格式: ${originalSrc}`);
                }
                
                // 为回退图片添加新事件监听器
                img.addEventListener('load', () => {
                  this.loadedImages.add(img);
                  this.failedImages.delete(img);
                  resolve(img);
                }, { once: true });
                
                return;
              }
            }
            
            // 应用错误占位图（如果配置）
            if (this.options.errorPlaceholder) {
              img.src = this.options.errorPlaceholder;
              
              if (this.options.debugEnabled) {
                console.warn(`[ImageOptimizer] 图片加载失败: ${src}，已应用错误占位图`);
              }
            }
          }
          
          if (this.options.debugEnabled) {
            console.error(`[ImageOptimizer] 图片加载失败: ${src}`);
          }
          
          // 拒绝Promise
          reject(new Error(`Failed to load image: ${src}`));
          
          // 移除事件监听器
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
        };
        
        // 添加事件监听器
        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);
        
        // 设置srcset和sizes（如果有）
        if (srcset) {
          img.srcset = this.getOptimalSrcset(srcset);
        }
        
        if (sizes) {
          img.sizes = sizes;
        }
        
        // 开始加载图片
        img.src = src;
      });
    }
    
    /**
     * 获取最佳图片URL
     * @param {HTMLImageElement} img - 图片元素
     * @returns {string} 最佳图片URL
     */
    getOptimalImageUrl(img) {
      const src = img.getAttribute('data-src');
      
      if (!src) {
        return this.options.errorPlaceholder || '';
      }
      
      // 如果浏览器支持WebP且启用了WebP，且原始图片不是WebP，尝试使用WebP
      if (this.webpSupported && src.match(/\.(jpe?g|png)$/i)) {
        const webpSrc = img.getAttribute('data-webp') || src.replace(/\.(jpe?g|png)$/i, '.webp');
        
        // 估算WebP节省的数据
        // 假设平均WebP比原格式节省约25-30%的大小
        const estimatedOriginalSize = parseInt(img.getAttribute('data-size') || '0', 10);
        if (estimatedOriginalSize > 0) {
          this.performanceData.webpSavings += estimatedOriginalSize * 0.3;
        }
        
        return webpSrc;
      }
      
      return src;
    }
    
    /**
     * 处理srcset属性，转换为WebP（如果支持）
     * @param {string} srcset - 原始srcset属性
     * @returns {string} 处理后的srcset
     */
    getOptimalSrcset(srcset) {
      if (!this.webpSupported) {
        return srcset;
      }
      
      // 将srcset分割为单独的项目，并转换为WebP
      return srcset.split(',').map(srcsetItem => {
        const [url, descriptor] = srcsetItem.trim().split(' ');
        
        if (url.match(/\.(jpe?g|png)$/i)) {
          const webpUrl = url.replace(/\.(jpe?g|png)$/i, '.webp');
          return `${webpUrl} ${descriptor || ''}`.trim();
        }
        
        return srcsetItem;
      }).join(', ');
    }
    
    /**
     * 应用占位图
     * @param {HTMLImageElement} img - 图片元素
     */
    applyPlaceholder(img) {
      // 获取图片尺寸
      const width = img.getAttribute('width') || 0;
      const height = img.getAttribute('height') || 0;
      
      if (width && height) {
        // 设置图片宽高比占位，防止布局偏移
        img.style.aspectRatio = `${width} / ${height}`;
      }
      
      // 应用占位颜色
      img.style.backgroundColor = this.options.placeholderColor;
      
      // 如果有低质量占位图
      const lowQualitySrc = img.getAttribute('data-placeholder');
      if (lowQualitySrc) {
        const tempImg = new Image();
        tempImg.src = lowQualitySrc;
        
        tempImg.onload = () => {
          // 只有在真实图片尚未加载时才设置占位图
          if (!this.loadedImages.has(img)) {
            img.src = lowQualitySrc;
            
            if (this.options.blurUpEnabled) {
              img.style.filter = 'blur(15px)';
            }
          }
        };
      }
    }
    
    /**
     * 判断元素是否在视口中
     * @param {HTMLElement} el - 要检查的元素
     * @param {number} threshold - 阈值，视口外的额外距离
     * @returns {boolean} 是否在视口中
     */
    isInViewport(el, threshold = 0) {
      if (!el || !el.getBoundingClientRect) {
        return false;
      }
      
      const rect = el.getBoundingClientRect();
      
      return (
        rect.bottom >= -threshold &&
        rect.right >= -threshold &&
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth) + threshold
      );
    }
    
    /**
     * 获取图片的优先级
     * @param {HTMLImageElement} img - 图片元素
     * @returns {string} 优先级: 'high', 'medium', 'low'
     */
    getImagePriority(img) {
      return img.getAttribute(this.options.priorityAttributeName) || 'medium';
    }
    
    /**
     * 预加载视口附近的图片
     * @param {number} distance - 距离视口的距离
     */
    preloadImagesInViewport(distance) {
      if (!this.options.preloadEnabled) {
        return;
      }
      
      // 获取所有未加载的图片
      const unloadedImages = Array.from(
        document.querySelectorAll(this.options.customSelector)
      ).filter(img => !this.loadedImages.has(img) && !this.pendingImages.has(img));
      
      // 对于每个未加载的图片，检查是否在扩展视口内
      unloadedImages.forEach(img => {
        if (this.isInViewport(img, distance)) {
          // 使用低优先级加载
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              this.loadImage(img);
            }, { timeout: 1000 });
          } else {
            setTimeout(() => {
              this.loadImage(img);
            }, 200);
          }
        }
      });
    }
    
    /**
     * 记录性能数据
     */
    logPerformance() {
      if (!this.options.debugEnabled) {
        return;
      }
      
      console.log('[ImageOptimizer] 性能数据:', {
        总图片数: this.performanceData.totalImages,
        已加载图片数: this.performanceData.loadedCount,
        失败图片数: this.performanceData.failedCount,
        缓存命中数: this.performanceData.cachedCount,
        平均加载时间: `${this.performanceData.avgLoadTime.toFixed(2)}ms`,
        WebP估计节省: `${(this.performanceData.webpSavings / 1024).toFixed(2)}KB`
      });
    }
    
    /**
     * 手动加载特定图片
     * @param {HTMLImageElement|string} imgOrSelector - 图片元素或选择器
     * @returns {Promise} 加载完成的Promise
     */
    load(imgOrSelector) {
      let img;
      
      if (typeof imgOrSelector === 'string') {
        img = document.querySelector(imgOrSelector);
      } else {
        img = imgOrSelector;
      }
      
      if (!img) {
        return Promise.reject(new Error('无法找到指定的图片元素'));
      }
      
      return this.loadImage(img, true);
    }
    
    /**
     * 预加载指定的图片
     * @param {Array<string>} urls - 要预加载的图片URL列表
     * @returns {Promise} 所有预加载完成的Promise
     */
    preloadImages(urls) {
      if (!urls || urls.length === 0) {
        return Promise.resolve();
      }
      
      return new Promise(resolve => {
        let loaded = 0;
        const total = urls.length;
        
        // 使用requestIdleCallback在空闲时间预加载
        const preloader = (index) => {
          if (index >= total) {
            resolve();
            return;
          }
          
          const img = new Image();
          
          img.onload = img.onerror = () => {
            loaded++;
            
            if (loaded === total) {
              resolve();
            } else {
              // 继续加载下一张
              if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                  preloader(index + 1);
                }, { timeout: 2000 });
              } else {
                setTimeout(() => {
                  preloader(index + 1);
                }, 100);
              }
            }
          };
          
          // 如果支持WebP且URL是JPEG或PNG，尝试加载WebP版本
          const url = urls[index];
          if (this.webpSupported && url.match(/\.(jpe?g|png)$/i)) {
            img.src = url.replace(/\.(jpe?g|png)$/i, '.webp');
          } else {
            img.src = url;
          }
        };
        
        // 开始预加载第一张图片
        preloader(0);
      });
    }
    
    /**
     * 刷新懒加载（在动态添加图片后调用）
     */
    refresh() {
      if (this.options.lazyLoadEnabled && this.lazyLoadObserver) {
        // 查找新添加的未观察图片
        const newImages = Array.from(
          document.querySelectorAll(this.options.customSelector)
        ).filter(img => !this.loadedImages.has(img) && !this.pendingImages.has(img));
        
        // 更新总图片数
        this.performanceData.totalImages += newImages.length;
        
        // 开始观察新图片
        newImages.forEach(img => {
          // 应用占位符
          if (this.options.placeholderEnabled) {
            this.applyPlaceholder(img);
          }
          
          // 对于视口内或高优先级图片，立即加载
          if (this.isInViewport(img) || this.getImagePriority(img) === 'high') {
            this.loadImage(img);
          } else {
            this.lazyLoadObserver.observe(img);
          }
        });
        
        if (this.options.debugEnabled) {
          console.log(`[ImageOptimizer] 已刷新懒加载，新增 ${newImages.length} 张图片`);
        }
      }
    }
  }
  
  // 创建全局实例
  window.imageOptimizer = new ImageOptimizer();
  
  // 导出类以便高级用法
  window.ImageOptimizer = ImageOptimizer;
  
  // 当DOM内容加载完成后自动初始化
  document.addEventListener('DOMContentLoaded', () => {
    window.imageOptimizer.refresh();
  });
})(); 