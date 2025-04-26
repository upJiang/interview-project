/**
 * 电商首页非关键JavaScript
 * 这个文件包含一些不阻塞首屏渲染的功能
 */

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 分类选择器行为
  setupCategorySelector();
  
  // 节流的窗口调整处理
  const throttledResize = throttle(() => {
    adjustLayout();
  }, 200);
  
  window.addEventListener('resize', throttledResize);
  
  // 动态加载字体图标
  loadFontIcons();
  
  // 设置产品交互
  setupProductInteractions();
});

// 分类选择器功能
function setupCategorySelector() {
  const categories = document.querySelectorAll('.category-item');
  
  categories.forEach(item => {
    item.addEventListener('click', () => {
      // 移除之前的active类
      document.querySelector('.category-item.active')?.classList.remove('active');
      
      // 添加active类到当前点击的项目
      item.classList.add('active');
      
      // 这里可以添加过滤产品的逻辑
      console.log('选择类别:', item.textContent);
      
      // 模拟数据加载
      document.getElementById('products-container').innerHTML = '';
      document.getElementById('skeleton-screen').style.display = 'block';
      document.getElementById('content').style.display = 'none';
      
      // 500ms后显示过滤后的产品
      setTimeout(() => {
        // 此处可以发送API请求获取分类数据
        document.getElementById('skeleton-screen').style.display = 'none';
        document.getElementById('content').style.display = 'block';
      }, 500);
    });
  });
}

// 调整布局 - 响应页面大小变化
function adjustLayout() {
  // 根据窗口大小调整元素布局
  const isMobile = window.innerWidth < 768;
  
  // 可以根据需要调整DOM元素
  if (isMobile) {
    // 移动端布局调整
    console.log('调整为移动端布局');
  } else {
    // 桌面端布局调整
    console.log('调整为桌面端布局');
  }
}

// 加载字体图标 - 延迟加载非关键资源
function loadFontIcons() {
  // 创建link元素
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://cdn.example.com/fontawesome.css';
  
  // 添加到head
  document.head.appendChild(fontLink);
}

// 产品交互行为
function setupProductInteractions() {
  // 使用事件委托处理产品点击
  document.addEventListener('click', (event) => {
    const productCard = event.target.closest('.product-card');
    
    if (productCard) {
      console.log('产品点击:', productCard.querySelector('.product-title').textContent);
      // 这里可以添加产品点击跟踪、快速预览等功能
    }
  });
}

// 简单的节流函数
function throttle(fn, delay) {
  let timeout = null;
  let lastRun = 0;
  
  return function(...args) {
    const now = Date.now();
    
    if (now - lastRun >= delay) {
      lastRun = now;
      fn.apply(this, args);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastRun = now;
        fn.apply(this, args);
      }, delay);
    }
  };
}

// 使用IndexedDB缓存产品数据
const setupProductCache = () => {
  // 检查浏览器支持
  if (!('indexedDB' in window)) {
    console.log('此浏览器不支持IndexedDB');
    return;
  }
  
  const dbName = 'productCacheDB';
  const storeName = 'products';
  let db;
  
  const request = indexedDB.open(dbName, 1);
  
  request.onerror = (event) => {
    console.error('IndexedDB错误:', event.target.errorCode);
  };
  
  request.onupgradeneeded = (event) => {
    db = event.target.result;
    
    // 创建对象存储
    if (!db.objectStoreNames.contains(storeName)) {
      const store = db.createObjectStore(storeName, { keyPath: 'id' });
      store.createIndex('name', 'name', { unique: false });
      store.createIndex('category', 'category', { unique: false });
    }
  };
  
  request.onsuccess = (event) => {
    db = event.target.result;
    console.log('IndexedDB初始化成功');
    
    // 这里可以添加从数据库读取缓存的逻辑
  };
};

// 初始化IndexedDB缓存
setupProductCache();

// 页面动画和过渡效果
const enhanceUIAnimations = () => {
  // 监听滚动以添加动画
  const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        animateOnScroll.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  // 应用到所有带.scroll-animate类的元素
  document.querySelectorAll('.scroll-animate').forEach(el => {
    animateOnScroll.observe(el);
  });
};

// 在页面完全加载后增强UI动画
window.addEventListener('load', enhanceUIAnimations);

// 导出API以供其他脚本使用
window.shopApp = {
  refreshProducts: (category) => {
    console.log(`刷新${category || '所有'}产品`);
    // 产品刷新逻辑
  },
  addToWishlist: (productId) => {
    console.log(`添加产品${productId}到收藏`);
    // 收藏逻辑
  },
  share: (productId) => {
    console.log(`分享产品${productId}`);
    // 分享逻辑
  }
}; 