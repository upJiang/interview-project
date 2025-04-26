/**
 * image-optimize.js
 * 更高级的图像优化和处理脚本
 */

(function() {
  class ImageOptimizer {
    constructor(options = {}) {
      this.options = Object.assign({
        lazyLoadThreshold: 200,           // 懒加载提前加载的距离
        lowQualityPreview: true,          // 是否使用低质量预览
        blurryPlaceholder: true,          // 是否使用模糊占位图
        highResThreshold: 1200,           // 高分辨率图像阈值
        webpSupport: null,                // WebP支持检测结果
        avifSupport: null,                // AVIF支持检测结果
        logPerformance: true,             // 是否记录性能数据
        priorityAttrName: 'fetchpriority', // 优先级属性名称
        decodeAttrName: 'decoding'         // 解码属性名称
      }, options);
      
      this.init();
    }
    
    async init() {
      // 检测浏览器支持的图像格式
      await this.detectBrowserSupport();
      
      // 初始化懒加载
      this.setupLazyLoading();
      
      // 初始化响应式图像处理
      this.setupResponsiveImages();
      
      // 处理优先级
      this.setupImagePriority();
      
      // 注册图像加载性能监控
      this.setupPerformanceMonitoring();
    }
    
    async detectBrowserSupport() {
      // 检测WebP支持
      this.options.webpSupport = await this.checkWebpSupport();
      
      // 检测AVIF支持
      this.options.avifSupport = await this.checkAvifSupport();
      
      // 在HTML标签上设置支持的图像格式的类
      document.documentElement.classList.add(this.options.webpSupport ? 'webp' : 'no-webp');
      document.documentElement.classList.add(this.options.avifSupport ? 'avif' : 'no-avif');
    }
    
    async checkWebpSupport() {
      // 检测浏览器是否支持WebP格式
      if (!self.createImageBitmap) return false;
      
      const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
      try {
        const blob = await fetch(webpData).then(r => r.blob());
        return createImageBitmap(blob).then(() => true, () => false);
      } catch (e) {
        return false;
      }
    }
    
    async checkAvifSupport() {
      // 检测浏览器是否支持AVIF格式
      if (!self.createImageBitmap) return false;
      
      const avifData = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
      try {
        const blob = await fetch(avifData).then(r => r.blob());
        return createImageBitmap(blob).then(() => true, () => false);
      } catch (e) {
        return false;
      }
    }
    
    setupLazyLoading() {
      // 使用Intersection Observer进行高级懒加载
      if ('IntersectionObserver' in window) {
        const options = {
          rootMargin: `${this.options.lazyLoadThreshold}px`,
          threshold: [0, 0.1, 0.25]
        };
        
        const observer = new IntersectionObserver((entries, self) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target);
              self.unobserve(entry.target);
            }
          });
        }, options);
        
        // 观察所有带有data-src或data-srcset属性的图像
        const lazyImages = document.querySelectorAll('[data-src], [data-srcset]');
        lazyImages.forEach(img => {
          // 如果设置了模糊占位图
          if (this.options.blurryPlaceholder && !img.src) {
            this.generateBlurryPlaceholder(img);
          }
          
          observer.observe(img);
        });
      } else {
        // 降级处理：使用滚动事件
        this.setupLegacyLazyLoading();
      }
    }
    
    loadImage(img) {
      // 记录开始加载时间
      const startTime = performance.now();
      
      // 处理data-srcset属性
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        img.removeAttribute('data-srcset');
      }
      
      // 处理source元素的srcset属性
      if (img.tagName.toLowerCase() === 'source') {
        if (img.parentNode && img.parentNode.tagName.toLowerCase() === 'picture') {
          // 触发picture元素开始加载
          const parentPicture = img.parentNode;
          const img = parentPicture.querySelector('img');
          if (img && img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
        }
        return;
      }
      
      // 处理普通图像的data-src属性
      if (img.dataset.src) {
        // 如果支持解码API，使用解码API避免渲染阻塞
        if ('decode' in img) {
          const currentSrc = img.src; // 保存当前src，通常是低质量预览
          
          img.src = img.dataset.src;
          img.decode().catch(() => {
            // 解码失败时回退
            console.warn('Image decode failed:', img.dataset.src);
          }).finally(() => {
            img.removeAttribute('data-src');
            
            // 记录加载完成时间
            if (this.options.logPerformance) {
              const loadTime = performance.now() - startTime;
              img.dataset.loadTime = loadTime;
              
              // 记录图像加载性能
              if (window.perfMonitor) {
                window.perfMonitor.addCustomMetric(`img_load_${img.alt || img.src.split('/').pop()}`, loadTime);
              }
            }
            
            // 图像加载完成后触发自定义事件
            this.dispatchImageLoadedEvent(img);
          });
        } else {
          // 不支持解码API时的常规处理
          img.src = img.dataset.src;
          img.onload = () => {
            img.removeAttribute('data-src');
            
            // 记录加载完成时间
            if (this.options.logPerformance) {
              const loadTime = performance.now() - startTime;
              img.dataset.loadTime = loadTime;
              
              if (window.perfMonitor) {
                window.perfMonitor.addCustomMetric(`img_load_${img.alt || img.src.split('/').pop()}`, loadTime);
              }
            }
            
            this.dispatchImageLoadedEvent(img);
          };
        }
      }
    }
    
    async generateBlurryPlaceholder(img) {
      // 创建一个低质量的模糊占位图
      if (!img.src && img.dataset.src) {
        const placeholderSize = 20; // 非常小的尺寸
        
        // 创建一个简单的占位图
        try {
          // 这里使用了一个简单的彩色方块作为占位符
          // 在实际应用中，最好预先生成占位图或使用更高级的技术
          img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${placeholderSize} ${placeholderSize}'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23eee'/%3E%3Crect width='100%25' height='100%25' filter='url(%23b)' fill='%23f5f5f5'/%3E%3C/svg%3E`;
          img.style.filter = 'blur(8px)';
          
          // 当实际图像加载完成后，移除模糊效果
          img.addEventListener('load', function() {
            if (this.src !== this.dataset.src && this.src.indexOf('data:') !== 0) {
              this.style.filter = 'none';
              this.style.transition = 'filter 0.3s ease-out';
            }
          });
        } catch (e) {
          console.warn('Failed to generate placeholder:', e);
        }
      }
    }
    
    setupLegacyLazyLoading() {
      // 使用滚动事件的传统懒加载（回退方案）
      const lazyLoad = () => {
        const lazyImages = document.querySelectorAll('[data-src], [data-srcset]');
        
        lazyImages.forEach(img => {
          const rect = img.getBoundingClientRect();
          if (rect.top <= window.innerHeight + this.options.lazyLoadThreshold) {
            this.loadImage(img);
          }
        });
        
        if (lazyImages.length === 0) {
          document.removeEventListener('scroll', lazyLoad);
          window.removeEventListener('resize', lazyLoad);
          window.removeEventListener('orientationchange', lazyLoad);
        }
      };
      
      document.addEventListener('scroll', lazyLoad, { passive: true });
      window.addEventListener('resize', lazyLoad, { passive: true });
      window.addEventListener('orientationchange', lazyLoad);
      
      // 初始检查
      setTimeout(lazyLoad, 20);
    }
    
    setupResponsiveImages() {
      // 设置响应式图像处理
      const pictures = document.querySelectorAll('picture');
      
      // 根据浏览器支持选择最佳图像格式
      pictures.forEach(picture => {
        // 找到picture元素中的所有source元素
        const sources = picture.querySelectorAll('source');
        
        sources.forEach(source => {
          // 设置正确的type属性
          if (source.type === 'image/webp' && !this.options.webpSupport) {
            // 如果浏览器不支持WebP，禁用这个source
            source.type = 'image/invalid';
          } else if (source.type === 'image/avif' && !this.options.avifSupport) {
            // 如果浏览器不支持AVIF，禁用这个source
            source.type = 'image/invalid';
          }
        });
      });
      
      // 根据设备屏幕调整分辨率
      this.adjustImageResolution();
    }
    
    adjustImageResolution() {
      // 根据屏幕DPR和尺寸调整图像分辨率
      const dpr = window.devicePixelRatio || 1;
      const viewportWidth = window.innerWidth;
      
      // 针对不同DPR设备优化图像加载
      if (dpr > 1) {
        // 高DPR设备可能需要更高分辨率的图像
        document.querySelectorAll('img[data-high-res]').forEach(img => {
          if (viewportWidth > this.options.highResThreshold) {
            img.dataset.src = img.dataset.highRes;
          }
        });
      }
    }
    
    setupImagePriority() {
      // 设置图像加载优先级
      
      // 设置重要图像的fetchpriority属性
      document.querySelectorAll('img.critical, .banner img').forEach(img => {
        img.setAttribute(this.options.priorityAttrName, 'high');
        
        // 添加decoding属性
        if (this.options.decodeAttrName && !img.hasAttribute(this.options.decodeAttrName)) {
          // 同步解码重要图像，异步解码非重要图像
          img.setAttribute(this.options.decodeAttrName, 'sync');
        }
      });
      
      // 非关键图像设置为低优先级
      document.querySelectorAll('img:not(.critical):not(.banner img)').forEach(img => {
        if (!img.hasAttribute(this.options.priorityAttrName)) {
          img.setAttribute(this.options.priorityAttrName, 'low');
        }
        
        // 添加decoding属性
        if (this.options.decodeAttrName && !img.hasAttribute(this.options.decodeAttrName)) {
          img.setAttribute(this.options.decodeAttrName, 'async');
        }
      });
    }
    
    setupPerformanceMonitoring() {
      // 监控图像加载性能
      if (!this.options.logPerformance) return;
      
      const imgObserver = new PerformanceObserver(entries => {
        entries.getEntries().forEach(entry => {
          if (entry.initiatorType === 'img') {
            console.log(`Image loaded: ${entry.name}, duration: ${entry.duration}ms`);
            
            // 如果存在性能监控工具，记录图像加载时间
            if (window.perfMonitor) {
              window.perfMonitor.addCustomMetric(`img_network_${entry.name.split('/').pop()}`, entry.duration);
            }
          }
        });
      });
      
      imgObserver.observe({ type: 'resource', buffered: true });
    }
    
    dispatchImageLoadedEvent(img) {
      // 触发自定义图像加载事件
      const event = new CustomEvent('imageLoaded', {
        detail: {
          image: img,
          src: img.src,
          loadTime: img.dataset.loadTime || 0
        },
        bubbles: true
      });
      
      img.dispatchEvent(event);
    }
    
    // 公共API方法
    
    // 手动触发懒加载检查
    checkLazyImages() {
      const lazyImages = document.querySelectorAll('[data-src], [data-srcset]');
      lazyImages.forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.top <= window.innerHeight + this.options.lazyLoadThreshold) {
          this.loadImage(img);
        }
      });
    }
    
    // 预加载指定的图像
    preloadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
    }
    
    // 预加载视口中可见的所有图像
    preloadVisibleImages() {
      const viewportImages = Array.from(document.querySelectorAll('img[data-src]')).filter(img => {
        const rect = img.getBoundingClientRect();
        return rect.top <= window.innerHeight && rect.bottom >= 0;
      });
      
      viewportImages.forEach(img => this.loadImage(img));
    }
  }
  
  // 创建全局实例
  window.imageOptimizer = new ImageOptimizer();
  
  // 导出类以便高级用法
  window.ImageOptimizer = ImageOptimizer;
})(); 