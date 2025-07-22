# 前端性能优化策略与实践

## 概述

前端性能优化是提升用户体验、降低跳出率、提高转化率的关键手段。本文档详细介绍了各种性能优化策略，特别针对电商网站的实际应用场景，提供完整的代码实现和最佳实践。

## 核心知识点

### 1. 资源优化策略

#### 资源预加载

```javascript
/**
 * 资源预加载管理器
 * 用于预加载关键资源，提升页面加载速度
 */
class ResourcePreloader {
  constructor() {
    this.loadedResources = new Set();
    this.criticalResources = new Set();
  }

  // 预加载关键资源
  preloadCriticalResources() {
    const criticalResources = [
      { href: '/css/critical.css', as: 'style' },
      { href: '/js/critical.js', as: 'script' },
      { href: '/images/hero.jpg', as: 'image' },
      { href: '/fonts/main.woff2', as: 'font', crossorigin: 'anonymous' }
    ];

    criticalResources.forEach(resource => {
      this.preloadResource(resource);
    });
  }

  preloadResource({ href, as, crossorigin, type }) {
    if (this.loadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (crossorigin) link.crossOrigin = crossorigin;
    if (type) link.type = type;
    
    link.onload = () => {
      this.loadedResources.add(href);
      console.log(`Resource preloaded: ${href}`);
    };
    
    link.onerror = () => {
      console.warn(`Failed to preload resource: ${href}`);
    };

    document.head.appendChild(link);
  }

  // DNS预解析
  prefetchDNS() {
    const domains = [
      'cdn.example.com',
      'api.example.com',
      'analytics.google.com',
      'fonts.googleapis.com'
    ];

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
  }

  // 预连接重要域名
  preconnectDomains() {
    const domains = [
      'https://cdn.example.com',
      'https://api.example.com'
    ];

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });
  }
}
```

#### 图片优化

```javascript
/**
 * 图片优化管理器
 * 包含懒加载、响应式图片、WebP支持等功能
 */
class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.supportsWebP = null;
  }

  // 初始化图片优化
  async init() {
    this.supportsWebP = await this.checkWebPSupport();
    this.setupLazyLoading();
    this.optimizeResponsiveImages();
    
    if (this.supportsWebP) {
      document.documentElement.classList.add('webp');
    } else {
      document.documentElement.classList.add('no-webp');
    }
  }

  // 懒加载实现
  setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    // 观察所有懒加载图片
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });

    this.observer = imageObserver;
  }

  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    const newImg = new Image();
    
    newImg.onload = () => {
      img.src = src;
      if (srcset) img.srcset = srcset;
      
      img.classList.remove('lazy');
      img.classList.add('loaded');
      
      delete img.dataset.src;
      delete img.dataset.srcset;
    };
    
    newImg.onerror = () => {
      img.classList.add('error');
      img.alt = '图片加载失败';
    };
    
    newImg.src = src;
    if (srcset) newImg.srcset = srcset;
  }

  // 响应式图片优化
  optimizeResponsiveImages() {
    const images = document.querySelectorAll('img[data-responsive]');
    
    images.forEach(img => {
      const baseSrc = img.src.replace(/\.(jpg|jpeg|png|webp)$/, '');
      const extension = this.supportsWebP ? 'webp' : 'jpg';
      
      const srcset = [
        `${baseSrc}-480w.${extension} 480w`,
        `${baseSrc}-800w.${extension} 800w`,
        `${baseSrc}-1200w.${extension} 1200w`,
        `${baseSrc}-1600w.${extension} 1600w`
      ].join(', ');
      
      img.srcset = srcset;
      img.sizes = '(max-width: 480px) 480px, (max-width: 800px) 800px, (max-width: 1200px) 1200px, 1600px';
    });
  }

  // WebP支持检测
  checkWebPSupport() {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }
}
```

### 2. 代码分割与懒加载

```javascript
/**
 * 代码分割管理器
 * 实现动态导入和懒加载功能
 */
class CodeSplittingManager {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  // 动态导入模块
  async loadModule(modulePath) {
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath);
    }

    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }

    const loadPromise = this.dynamicImport(modulePath);
    this.loadingPromises.set(modulePath, loadPromise);

    try {
      const module = await loadPromise;
      this.loadedModules.set(modulePath, module);
      this.loadingPromises.delete(modulePath);
      return module;
    } catch (error) {
      this.loadingPromises.delete(modulePath);
      throw error;
    }
  }

  async dynamicImport(modulePath) {
    const startTime = performance.now();
    
    try {
      const module = await import(modulePath);
      const loadTime = performance.now() - startTime;
      
      console.log(`Module ${modulePath} loaded in ${loadTime.toFixed(2)}ms`);
      return module;
    } catch (error) {
      console.error(`Failed to load module ${modulePath}:`, error);
      throw error;
    }
  }

  // 路由级别的代码分割
  setupRouteBasedSplitting() {
    const routes = {
      '/': () => import('./pages/Home.js'),
      '/products': () => import('./pages/ProductList.js'),
      '/product/:id': () => import('./pages/ProductDetail.js'),
      '/cart': () => import('./pages/Cart.js'),
      '/checkout': () => import('./pages/Checkout.js')
    };

    return routes;
  }

  // 基于用户交互的预加载
  setupInteractionBasedPreloading() {
    // 鼠标悬停预加载
    document.addEventListener('mouseover', (event) => {
      const link = event.target.closest('a[data-preload]');
      if (link) {
        const modulePath = link.dataset.preload;
        this.loadModule(modulePath).catch(console.error);
      }
    });

    // 页面滚动预加载
    let scrollTimer = null;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        this.preloadVisibleComponents();
      }, 100);
    });
  }

  preloadVisibleComponents() {
    const lazyComponents = document.querySelectorAll('[data-lazy-component]');
    
    lazyComponents.forEach(element => {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight + 200;
      
      if (isVisible && !element.dataset.loading) {
        element.dataset.loading = 'true';
        const modulePath = element.dataset.lazyComponent;
        
        this.loadModule(modulePath)
          .then(module => {
            const Component = module.default || module;
            new Component(element);
          })
          .catch(console.error);
      }
    });
  }
}
```

### 3. 缓存策略

```javascript
/**
 * 缓存管理器
 * 实现多层缓存策略
 */
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.storageCache = new Map();
    this.cacheConfig = {
      maxMemorySize: 50 * 1024 * 1024, // 50MB
      maxStorageSize: 100 * 1024 * 1024, // 100MB
      defaultTTL: 5 * 60 * 1000 // 5分钟
    };
  }

  // 内存缓存
  setMemoryCache(key, data, ttl = this.cacheConfig.defaultTTL) {
    const item = {
      data,
      timestamp: Date.now(),
      ttl,
      size: this.calculateSize(data)
    };

    this.ensureMemoryCacheSize(item.size);
    this.memoryCache.set(key, item);
  }

  getMemoryCache(key) {
    const item = this.memoryCache.get(key);
    
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return item.data;
  }

  // LocalStorage缓存
  setStorageCache(key, data, ttl = this.cacheConfig.defaultTTL) {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set storage cache:', error);
      this.cleanExpiredStorageCache();
      
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(item));
      } catch (retryError) {
        console.error('Storage cache retry failed:', retryError);
      }
    }
  }

  getStorageCache(key) {
    try {
      const itemStr = localStorage.getItem(`cache_${key}`);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('Failed to get storage cache:', error);
      return null;
    }
  }

  // API响应缓存
  async cacheAPIResponse(url, options = {}) {
    const cacheKey = this.generateCacheKey(url, options);
    
    // 检查缓存
    let cachedResponse = this.getMemoryCache(cacheKey);
    if (cachedResponse) return cachedResponse;
    
    cachedResponse = this.getStorageCache(cacheKey);
    if (cachedResponse) {
      this.setMemoryCache(cacheKey, cachedResponse);
      return cachedResponse;
    }
    
    // 发起网络请求
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      const cacheControl = response.headers.get('cache-control');
      const ttl = this.parseCacheControl(cacheControl);
      
      this.setMemoryCache(cacheKey, data, ttl);
      this.setStorageCache(cacheKey, data, ttl);
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  generateCacheKey(url, options) {
    const method = options.method || 'GET';
    const body = options.body || '';
    return `${method}_${url}_${btoa(body)}`;
  }

  parseCacheControl(cacheControl) {
    if (!cacheControl) return this.cacheConfig.defaultTTL;
    
    const maxAge = cacheControl.match(/max-age=(\d+)/);
    if (maxAge) {
      return parseInt(maxAge[1]) * 1000;
    }
    
    return this.cacheConfig.defaultTTL;
  }

  calculateSize(data) {
    return JSON.stringify(data).length * 2;
  }

  ensureMemoryCacheSize(newItemSize) {
    let currentSize = this.getCurrentMemoryCacheSize();
    
    while (currentSize + newItemSize > this.cacheConfig.maxMemorySize && this.memoryCache.size > 0) {
      const oldestKey = this.getOldestCacheKey();
      const oldestItem = this.memoryCache.get(oldestKey);
      currentSize -= oldestItem.size;
      this.memoryCache.delete(oldestKey);
    }
  }

  getCurrentMemoryCacheSize() {
    let totalSize = 0;
    for (const item of this.memoryCache.values()) {
      totalSize += item.size;
    }
    return totalSize;
  }

  getOldestCacheKey() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.memoryCache) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  cleanExpiredStorageCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (Date.now() - item.timestamp > item.ttl) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });
  }
}
```

### 4. 渲染优化

```javascript
/**
 * 渲染优化器
 * 包含虚拟滚动、批量DOM更新等功能
 */
class RenderOptimizer {
  constructor() {
    this.updateQueue = [];
    this.rafId = null;
  }

  // 批量DOM更新
  batchDOMUpdates(updateFunctions) {
    this.updateQueue.push(...updateFunctions);
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flushUpdates();
      });
    }
  }

  flushUpdates() {
    // 批量执行DOM读取操作
    const reads = this.updateQueue.filter(fn => fn.type === 'read');
    reads.forEach(fn => fn.execute());
    
    // 批量执行DOM写入操作
    const writes = this.updateQueue.filter(fn => fn.type === 'write');
    writes.forEach(fn => fn.execute());
    
    this.updateQueue = [];
    this.rafId = null;
  }

  // 虚拟滚动实现
  createVirtualScrollList(container, itemHeight, totalItems, renderItem) {
    const viewportHeight = container.clientHeight;
    const visibleItems = Math.ceil(viewportHeight / itemHeight) + 2;
    
    let scrollTop = 0;
    let startIndex = 0;
    
    const scrollContainer = document.createElement('div');
    scrollContainer.style.height = totalItems * itemHeight + 'px';
    scrollContainer.style.position = 'relative';
    
    const visibleContainer = document.createElement('div');
    visibleContainer.style.position = 'absolute';
    visibleContainer.style.top = '0';
    visibleContainer.style.width = '100%';
    
    scrollContainer.appendChild(visibleContainer);
    container.appendChild(scrollContainer);
    
    const updateVisibleItems = () => {
      const newStartIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(newStartIndex + visibleItems, totalItems);
      
      if (newStartIndex !== startIndex) {
        startIndex = newStartIndex;
        
        visibleContainer.innerHTML = '';
        
        for (let i = startIndex; i < endIndex; i++) {
          const item = renderItem(i);
          item.style.position = 'absolute';
          item.style.top = i * itemHeight + 'px';
          item.style.height = itemHeight + 'px';
          visibleContainer.appendChild(item);
        }
      }
    };
    
    container.addEventListener('scroll', (e) => {
      scrollTop = e.target.scrollTop;
      updateVisibleItems();
    });
    
    updateVisibleItems();
    
    return {
      update: updateVisibleItems,
      destroy: () => {
        container.removeChild(scrollContainer);
      }
    };
  }

  // 防抖动画
  debounceAnimation(callback, delay = 16) {
    let timeoutId;
    let rafId;
    
    return (...args) => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          callback.apply(this, args);
        });
      }, delay);
    };
  }

  // Web Workers处理重计算
  setupWebWorkerForHeavyTasks() {
    const workerCode = `
      self.onmessage = function(e) {
        const { type, data } = e.data;
        
        switch(type) {
          case 'sort':
            const sorted = data.sort((a, b) => a.price - b.price);
            self.postMessage({ type: 'sort', result: sorted });
            break;
            
          case 'filter':
            const filtered = data.items.filter(item => 
              item.name.toLowerCase().includes(data.query.toLowerCase())
            );
            self.postMessage({ type: 'filter', result: filtered });
            break;
            
          case 'calculate':
            const result = data.items.reduce((sum, item) => sum + item.price, 0);
            self.postMessage({ type: 'calculate', result });
            break;
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    return {
      worker,
      execute: (type, data) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Worker timeout'));
          }, 5000);
          
          worker.onmessage = (e) => {
            clearTimeout(timeout);
            if (e.data.type === type) {
              resolve(e.data.result);
            }
          };
          
          worker.onerror = (error) => {
            clearTimeout(timeout);
            reject(error);
          };
          
          worker.postMessage({ type, data });
        });
      }
    };
  }
}
```

## 电商场景优化实践

### 1. 商品列表页优化

```javascript
/**
 * 商品列表页优化器
 * 针对电商商品展示的特定优化
 */
class ProductListOptimizer {
  constructor() {
    this.renderOptimizer = new RenderOptimizer();
    this.imageOptimizer = new ImageOptimizer();
    this.cacheManager = new CacheManager();
  }

  // 商品列表虚拟滚动
  optimizeProductList() {
    const productListContainer = document.getElementById('product-list');
    if (!productListContainer) return;

    const virtualScroll = this.renderOptimizer.createVirtualScrollList(
      productListContainer,
      200, // 每个商品高度
      1000, // 总商品数
      (index) => this.renderProductItem(index)
    );
    
    return virtualScroll;
  }

  renderProductItem(index) {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.innerHTML = `
      <div class="product-image">
        <img 
          data-src="/api/products/${index}/image" 
          alt="Product ${index}" 
          class="lazy"
          loading="lazy"
        >
      </div>
      <div class="product-info">
        <h3>Product ${index}</h3>
        <p class="price">$${(Math.random() * 100).toFixed(2)}</p>
        <button onclick="addToCart(${index})">加入购物车</button>
      </div>
    `;
    
    return item;
  }

  // 商品图片预加载策略
  preloadProductImages() {
    const visibleProducts = document.querySelectorAll('.product-item:nth-child(-n+6)');
    
    visibleProducts.forEach(product => {
      const img = product.querySelector('img[data-src]');
      if (img) {
        this.imageOptimizer.loadImage(img);
      }
    });
  }

  // 商品数据缓存
  async loadProductData(page = 1, category = 'all') {
    const cacheKey = `products_${page}_${category}`;
    
    try {
      const products = await this.cacheManager.cacheAPIResponse(
        `/api/products?page=${page}&category=${category}`,
        { method: 'GET' }
      );
      
      return products;
    } catch (error) {
      console.error('Failed to load product data:', error);
      return [];
    }
  }
}
```

### 2. 购物车优化

```javascript
/**
 * 购物车优化器
 * 优化购物车操作性能
 */
class ShoppingCartOptimizer {
  constructor() {
    this.cacheManager = new CacheManager();
    this.cart = { items: [] };
  }

  // 购物车状态管理
  initializeCart() {
    // 从缓存加载购物车数据
    const cachedCart = this.cacheManager.getStorageCache('shopping_cart');
    if (cachedCart) {
      this.cart = cachedCart;
      this.updateCartUI();
    }
  }

  // 添加商品到购物车
  addToCart(productId, quantity = 1) {
    const startTime = performance.now();
    
    const existingItem = this.cart.items.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cart.items.push({ id: productId, quantity });
    }
    
    // 缓存购物车数据
    this.cacheManager.setStorageCache('shopping_cart', this.cart, 24 * 60 * 60 * 1000); // 24小时
    
    // 批量更新UI
    this.batchUpdateCartUI();
    
    const endTime = performance.now();
    console.log(`Add to cart took ${endTime - startTime}ms`);
    
    // 触发自定义事件
    document.dispatchEvent(new CustomEvent('cart:item-added', {
      detail: { productId, quantity, totalItems: this.getTotalItems() }
    }));
  }

  // 批量更新购物车UI
  batchUpdateCartUI() {
    requestAnimationFrame(() => {
      this.updateCartCount();
      this.updateCartTotal();
      this.updateCartIcon();
    });
  }

  updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
      const totalItems = this.getTotalItems();
      cartCount.textContent = totalItems;
      cartCount.classList.toggle('has-items', totalItems > 0);
    }
  }

  updateCartTotal() {
    const cartTotal = document.getElementById('cart-total');
    if (cartTotal) {
      // 这里需要根据实际商品价格计算
      const total = this.calculateTotal();
      cartTotal.textContent = `$${total.toFixed(2)}`;
    }
  }

  updateCartIcon() {
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon && this.getTotalItems() > 0) {
      cartIcon.classList.add('bounce');
      setTimeout(() => cartIcon.classList.remove('bounce'), 600);
    }
  }

  getTotalItems() {
    return this.cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  calculateTotal() {
    // 模拟价格计算
    return this.cart.items.reduce((total, item) => {
      const price = Math.random() * 100; // 实际应该从商品数据获取
      return total + (price * item.quantity);
    }, 0);
  }

  updateCartUI() {
    this.batchUpdateCartUI();
  }
}
```

### 3. 搜索功能优化

```javascript
/**
 * 搜索功能优化器
 * 实现防抖搜索和结果缓存
 */
class SearchOptimizer {
  constructor() {
    this.cacheManager = new CacheManager();
    this.searchCache = new Map();
    this.searchTimeout = null;
    this.currentRequest = null;
  }

  // 初始化搜索优化
  initializeSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    // 防抖搜索
    searchInput.addEventListener('input', (e) => {
      this.debouncedSearch(e.target.value.trim());
    });

    // 搜索建议
    this.setupSearchSuggestions(searchInput);
  }

  // 防抖搜索
  debouncedSearch(query) {
    clearTimeout(this.searchTimeout);
    
    if (query.length < 2) {
      this.clearSearchResults();
      return;
    }

    this.searchTimeout = setTimeout(async () => {
      try {
        await this.performSearch(query);
      } catch (error) {
        console.error('Search failed:', error);
        this.showSearchError();
      }
    }, 300);
  }

  // 执行搜索
  async performSearch(query) {
    // 检查缓存
    if (this.searchCache.has(query)) {
      this.displaySearchResults(this.searchCache.get(query));
      return;
    }

    // 取消之前的请求
    if (this.currentRequest) {
      this.currentRequest.abort();
    }

    // 创建新的请求
    const controller = new AbortController();
    this.currentRequest = controller;

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      
      const results = await response.json();
      
      // 缓存结果
      this.searchCache.set(query, results);
      
      // 显示结果
      this.displaySearchResults(results);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    } finally {
      this.currentRequest = null;
    }
  }

  // 显示搜索结果
  displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    // 使用DocumentFragment优化DOM操作
    const fragment = document.createDocumentFragment();
    
    results.forEach(result => {
      const item = this.createSearchResultItem(result);
      fragment.appendChild(item);
    });
    
    // 批量更新DOM
    requestAnimationFrame(() => {
      resultsContainer.innerHTML = '';
      resultsContainer.appendChild(fragment);
      
      // 启动图片懒加载
      this.setupResultImageLazyLoading();
    });
  }

  createSearchResultItem(result) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.innerHTML = `
      <img 
        data-src="${result.image}" 
        alt="${result.name}" 
        class="lazy result-image"
        loading="lazy"
      >
      <div class="result-info">
        <h4>${this.highlightSearchTerm(result.name)}</h4>
        <p class="price">$${result.price}</p>
        <p class="description">${result.description}</p>
      </div>
    `;
    
    return item;
  }

  highlightSearchTerm(text) {
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.trim() : '';
    
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  setupResultImageLazyLoading() {
    const lazyImages = document.querySelectorAll('.search-results img.lazy');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // 搜索建议
  setupSearchSuggestions(searchInput) {
    let suggestionTimeout = null;
    
    searchInput.addEventListener('input', (e) => {
      clearTimeout(suggestionTimeout);
      
      const query = e.target.value.trim();
      if (query.length < 2) return;
      
      suggestionTimeout = setTimeout(async () => {
        try {
          const suggestions = await this.getSuggestions(query);
          this.displaySuggestions(suggestions);
        } catch (error) {
          console.error('Failed to get suggestions:', error);
        }
      }, 150);
    });
  }

  async getSuggestions(query) {
    const cacheKey = `suggestions_${query}`;
    
    // 检查缓存
    const cached = this.cacheManager.getMemoryCache(cacheKey);
    if (cached) return cached;
    
    const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
    const suggestions = await response.json();
    
    // 缓存建议
    this.cacheManager.setMemoryCache(cacheKey, suggestions, 10 * 60 * 1000); // 10分钟
    
    return suggestions;
  }

  displaySuggestions(suggestions) {
    let suggestionsContainer = document.getElementById('search-suggestions');
    
    if (!suggestionsContainer) {
      suggestionsContainer = document.createElement('div');
      suggestionsContainer.id = 'search-suggestions';
      suggestionsContainer.className = 'search-suggestions';
      
      const searchInput = document.getElementById('search-input');
      searchInput.parentNode.appendChild(suggestionsContainer);
    }
    
    suggestionsContainer.innerHTML = suggestions
      .map(suggestion => `
        <div class="suggestion-item" onclick="selectSuggestion('${suggestion}')">
          ${suggestion}
        </div>
      `).join('');
  }

  clearSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }
  }

  showSearchError() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="search-error">搜索失败，请稍后重试</div>';
    }
  }
}
```

## 常见面试问题

### Q1: 如何优化首屏加载时间？

**优化策略：**
1. **关键资源优化**：预加载CSS、字体等关键资源
2. **代码分割**：只加载首屏必需的代码
3. **图片优化**：使用WebP格式、响应式图片
4. **缓存策略**：合理设置HTTP缓存头
5. **CDN加速**：使用CDN分发静态资源

```javascript
// 首屏优化示例
class FirstScreenOptimizer {
  async optimize() {
    // 1. 预加载关键资源
    this.preloadCriticalResources();
    
    // 2. 内联关键CSS
    this.inlineCriticalCSS();
    
    // 3. 延迟加载非关键资源
    this.deferNonCriticalResources();
    
    // 4. 优化字体加载
    this.optimizeFontLoading();
  }
  
  preloadCriticalResources() {
    const resources = [
      { href: '/css/critical.css', as: 'style' },
      { href: '/js/critical.js', as: 'script' },
      { href: '/images/hero.jpg', as: 'image' }
    ];
    
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      document.head.appendChild(link);
    });
  }
  
  inlineCriticalCSS() {
    const criticalCSS = `
      .hero { display: block; background: url('/images/hero.jpg'); }
      .nav { position: fixed; top: 0; }
      .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
    `;
    
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);
  }
  
  deferNonCriticalResources() {
    // 延迟加载非关键CSS
    const loadCSS = (href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print';
      link.onload = () => { link.media = 'all'; };
      document.head.appendChild(link);
    };
    
    // 页面加载完成后加载
    window.addEventListener('load', () => {
      loadCSS('/css/non-critical.css');
      loadCSS('/css/animations.css');
    });
  }
  
  optimizeFontLoading() {
    // 使用font-display: swap
    const fontFace = new FontFace(
      'CustomFont',
      'url(/fonts/custom-font.woff2)',
      { display: 'swap' }
    );
    
    fontFace.load().then(() => {
      document.fonts.add(fontFace);
    });
  }
}
```

### Q2: 如何处理大量数据的渲染性能问题？

**解决方案：**
1. **虚拟滚动**：只渲染可见区域的数据
2. **分页加载**：分批加载数据
3. **Web Workers**：在后台线程处理数据
4. **防抖节流**：限制更新频率

```javascript
// 大数据渲染优化示例
class LargeDataRenderer {
  constructor(container, data) {
    this.container = container;
    this.data = data;
    this.pageSize = 50;
    this.currentPage = 1;
    this.filteredData = data;
  }
  
  // 虚拟滚动实现
  setupVirtualScroll() {
    const itemHeight = 60;
    const containerHeight = this.container.clientHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 5;
    
    let startIndex = 0;
    
    const updateVisibleItems = () => {
      const scrollTop = this.container.scrollTop;
      const newStartIndex = Math.floor(scrollTop / itemHeight);
      
      if (newStartIndex !== startIndex) {
        startIndex = newStartIndex;
        this.renderVisibleItems(startIndex, visibleCount, itemHeight);
      }
    };
    
    this.container.addEventListener('scroll', 
      this.debounce(updateVisibleItems, 16)
    );
    
    // 初始渲染
    updateVisibleItems();
  }
  
  renderVisibleItems(startIndex, count, itemHeight) {
    const endIndex = Math.min(startIndex + count, this.filteredData.length);
    const fragment = document.createDocumentFragment();
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.createListItem(this.filteredData[i], i, itemHeight);
      fragment.appendChild(item);
    }
    
    requestAnimationFrame(() => {
      this.container.innerHTML = '';
      this.container.appendChild(fragment);
    });
  }
  
  createListItem(data, index, height) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.style.height = height + 'px';
    item.style.position = 'absolute';
    item.style.top = index * height + 'px';
    item.innerHTML = `
      <div class="item-content">
        <h4>${data.name}</h4>
        <p>${data.description}</p>
        <span class="price">$${data.price}</span>
      </div>
    `;
    return item;
  }
  
  // Web Worker处理数据
  setupWebWorkerDataProcessing() {
    const workerCode = `
      self.onmessage = function(e) {
        const { type, data, query } = e.data;
        
        switch(type) {
          case 'filter':
            const filtered = data.filter(item => 
              item.name.toLowerCase().includes(query.toLowerCase()) ||
              item.description.toLowerCase().includes(query.toLowerCase())
            );
            self.postMessage({ type: 'filter', result: filtered });
            break;
            
          case 'sort':
            const sorted = [...data].sort((a, b) => {
              return data.sortBy === 'price' ? a.price - b.price : 
                     a.name.localeCompare(b.name);
            });
            self.postMessage({ type: 'sort', result: sorted });
            break;
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    return worker;
  }
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}
```

### Q3: 如何优化移动端性能？

**移动端优化策略：**
1. **触摸事件优化**：使用passive事件监听
2. **图片适配**：根据设备像素比提供合适图片
3. **网络适配**：根据网络状况调整资源加载策略
4. **电池优化**：减少CPU密集型操作

```javascript
// 移动端性能优化
class MobileOptimizer {
  constructor() {
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.connection = navigator.connection || {};
    this.isLowEndDevice = this.detectLowEndDevice();
  }
  
  // 检测低端设备
  detectLowEndDevice() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    return memory <= 2 || cores <= 2;
  }
  
  // 触摸事件优化
  optimizeTouchEvents() {
    // 使用passive事件监听器
    const passiveSupported = this.checkPassiveSupport();
    const options = passiveSupported ? { passive: true } : false;
    
    document.addEventListener('touchstart', this.handleTouchStart, options);
    document.addEventListener('touchmove', this.handleTouchMove, options);
    document.addEventListener('scroll', this.handleScroll, options);
    
    // 防止300ms延迟
    document.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.target.click();
    });
  }
  
  checkPassiveSupport() {
    let passiveSupported = false;
    try {
      const options = {
        get passive() {
          passiveSupported = true;
          return false;
        }
      };
      window.addEventListener('test', null, options);
    } catch (err) {}
    return passiveSupported;
  }
  
  handleTouchStart(e) {
    // 触摸开始处理
  }
  
  handleTouchMove(e) {
    // 触摸移动处理
  }
  
  handleScroll(e) {
    // 滚动处理
  }
  
  // 图片适配优化
  optimizeImagesForMobile() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // 根据设备像素比选择合适的图片
      const baseSrc = img.src.replace(/\.(jpg|jpeg|png)$/, '');
      const extension = img.src.match(/\.(jpg|jpeg|png)$/)[1];
      
      if (this.devicePixelRatio >= 2) {
        img.src = `${baseSrc}@2x.${extension}`;
      }
      
      // 为低端设备提供压缩图片
      if (this.isLowEndDevice) {
        img.src = `${baseSrc}_compressed.${extension}`;
      }
    });
  }
  
  // 网络适配
  adaptToNetworkCondition() {
    const effectiveType = this.connection.effectiveType;
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        this.enableDataSaverMode();
        break;
      case '3g':
        this.enableReducedQualityMode();
        break;
      case '4g':
      default:
        this.enableHighQualityMode();
        break;
    }
  }
  
  enableDataSaverMode() {
    // 禁用自动播放视频
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.autoplay = false;
      video.preload = 'none';
    });
    
    // 降低图片质量
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.src = img.src.replace(/\.(jpg|jpeg)$/, '_low.$1');
    });
  }
  
  enableReducedQualityMode() {
    // 中等质量设置
  }
  
  enableHighQualityMode() {
    // 高质量设置
  }
  
  // 电池优化
  optimizeForBattery() {
    // 监听电池状态
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2) {
          this.enablePowerSavingMode();
        }
        
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2) {
            this.enablePowerSavingMode();
          }
        });
      });
    }
  }
  
  enablePowerSavingMode() {
    // 减少动画
    document.documentElement.classList.add('reduce-motion');
    
    // 降低刷新率
    this.reduceAnimationFrameRate();
    
    // 暂停非关键定时器
    this.pauseNonCriticalTimers();
  }
  
  reduceAnimationFrameRate() {
    let lastTime = 0;
    const targetFPS = 30;
    const interval = 1000 / targetFPS;
    
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      const currentTime = Date.now();
      const timeToCall = Math.max(0, interval - (currentTime - lastTime));
      
      const id = originalRAF(() => {
        lastTime = currentTime + timeToCall;
        callback(currentTime + timeToCall);
      });
      
      return id;
    };
  }
  
  pauseNonCriticalTimers() {
    // 暂停非关键的定时器和动画
    const nonCriticalTimers = window.nonCriticalTimers || [];
    nonCriticalTimers.forEach(timer => clearInterval(timer));
  }
}
```

## 性能预算管理

```javascript
/**
 * 性能预算管理器
 * 设置和监控性能预算
 */
class PerformanceBudgetManager {
  constructor() {
    this.budgets = {
      // 时间预算 (ms)
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fcp: 1800,
      ttfb: 800,
      
      // 资源大小预算 (bytes)
      totalJSSize: 500 * 1024, // 500KB
      totalCSSSize: 100 * 1024, // 100KB
      totalImageSize: 1000 * 1024, // 1MB
      totalFontSize: 200 * 1024, // 200KB
      
      // 请求数量预算
      totalRequests: 50,
      jsRequests: 10,
      cssRequests: 5,
      imageRequests: 30
    };
    
    this.violations = [];
  }
  
  // 检查性能预算
  checkBudget(metrics) {
    this.violations = [];
    
    Object.entries(this.budgets).forEach(([metric, budget]) => {
      if (metrics[metric] && metrics[metric] > budget) {
        this.violations.push({
          metric,
          value: metrics[metric],
          budget,
          excess: metrics[metric] - budget,
          severity: this.calculateSeverity(metrics[metric], budget)
        });
      }
    });
    
    return this.violations;
  }
  
  calculateSeverity(value, budget) {
    const ratio = value / budget;
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'high';
    if (ratio > 1.2) return 'medium';
    return 'low';
  }
  
  // 生成预算报告
  generateReport(violations = this.violations) {
    if (violations.length === 0) {
      console.log('✅ All performance budgets are met!');
      return {
        status: 'passed',
        violations: []
      };
    }
    
    console.log('❌ Performance budget violations:');
    violations.forEach(violation => {
      const icon = this.getSeverityIcon(violation.severity);
      console.log(`${icon} ${violation.metric}: ${violation.value} (budget: ${violation.budget}, excess: ${violation.excess})`);
    });
    
    return {
      status: 'failed',
      violations,
      summary: this.generateSummary(violations)
    };
  }
  
  getSeverityIcon(severity) {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    return icons[severity] || '⚪';
  }
  
  generateSummary(violations) {
    const summary = {
      total: violations.length,
      critical: violations.filter(v => v.severity === 'critical').length,
      high: violations.filter(v => v.severity === 'high').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      low: violations.filter(v => v.severity === 'low').length
    };
    
    return summary;
  }
  
  // 设置预算告警
  setupBudgetAlerts() {
    // 在CI/CD中使用
    if (typeof process !== 'undefined' && process.env.CI) {
      const report = this.generateReport();
      
      if (report.status === 'failed') {
        const criticalViolations = report.violations.filter(v => v.severity === 'critical');
        
        if (criticalViolations.length > 0) {
          console.error('❌ Critical performance budget violations detected!');
          process.exit(1);
        }
      }
    }
  }
}
```

## 总结

性能优化是一个系统性工程，需要从多个维度进行考虑：

### 关键优化策略
1. **资源优化**：预加载、懒加载、压缩、缓存
2. **代码优化**：分割、树摇、压缩、合并
3. **渲染优化**：虚拟滚动、批量更新、Web Workers
4. **网络优化**：HTTP/2、CDN、请求合并
5. **移动端优化**：触摸优化、网络适配、电池优化

### 面试重点
- **性能指标理解**：LCP、FID、CLS等Web Vitals指标
- **优化技术掌握**：各种优化技术的原理和实现
- **工具使用**：性能分析工具的使用方法
- **实际应用**：结合业务场景的优化实践
- **监控体系**：性能监控和预算管理

### 最佳实践
- 建立性能预算和监控体系
- 持续优化和迭代改进
- 结合业务特点制定优化策略
- 注重用户体验和业务指标的平衡 