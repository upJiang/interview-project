/**
 * 首屏渲染优化 - Service Worker
 * 用于缓存静态资源和API响应，实现离线访问和加速页面加载
 */

// 缓存版本标识 - 更改此版本号将使已缓存的资源失效
const CACHE_VERSION = 'v1';

// 缓存名称
const STATIC_CACHE = `static-${CACHE_VERSION}`;  // 静态资源缓存
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`; // 动态资源缓存
const API_CACHE = `api-${CACHE_VERSION}`;         // API响应缓存

// 预缓存的资源列表 - 这些资源将在安装阶段被缓存
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/placeholder.jpg',
  '/images/banner-placeholder.jpg',
  '/favicon.ico'
];

// 需要优先从网络获取的资源
const NETWORK_FIRST_URLS = [
  '/data/initial-data.json'
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 安装');
  
  // 跳过等待，立即激活
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] 预缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// 激活事件 - 清理旧版本缓存
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 激活');
  
  // 接管控制权
  clients.claim();
  
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          // 删除旧版本缓存
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE) {
            console.log('[Service Worker] 删除旧缓存', key);
            return caches.delete(key);
          }
        }));
      })
  );
});

// 网络请求拦截 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 处理导航请求
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 离线时提供缓存的HTML
          return caches.match('/index.html');
        })
    );
    return;
  }
  
  // API请求 - 网络优先，失败时回退到缓存
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // 图片请求 - 缓存优先
  if (event.request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }
  
  // 其他静态资源 - 缓存优先
  if (STATIC_ASSETS.includes(url.pathname) || 
      event.request.destination === 'style' || 
      event.request.destination === 'script') {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }
  
  // 默认策略 - 网络优先
  event.respondWith(networkFirstStrategy(event.request));
});

// 缓存优先策略
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // 返回缓存的响应
    return cachedResponse;
  }
  
  // 如果缓存中没有，则从网络获取并缓存
  try {
    const networkResponse = await fetch(request);
    // 创建响应的克隆，因为响应流只能使用一次
    const responseToCache = networkResponse.clone();
    
    // 只缓存成功的响应
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] 获取资源失败:', error);
    // 如果是图片请求，返回占位图
    if (request.destination === 'image') {
      return caches.match('/images/placeholder.jpg');
    }
    // 其他请求返回错误
    throw error;
  }
}

// 网络优先策略
async function networkFirstStrategy(request) {
  try {
    // 尝试从网络获取
    const networkResponse = await fetch(request);
    
    // 克隆响应以便缓存
    const responseToCache = networkResponse.clone();
    
    // 只缓存成功的响应
    if (networkResponse.ok) {
      const cache = await caches.open(
        request.url.includes('/data/') ? API_CACHE : DYNAMIC_CACHE
      );
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] 网络请求失败，尝试从缓存获取', request.url);
    // 尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果是API请求，返回空数据
    if (request.url.includes('/data/')) {
      return new Response(JSON.stringify({ error: '网络请求失败', offline: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 其他请求抛出错误
    throw error;
  }
}

// 后台同步 - 用于离线操作
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

// 同步购物车
async function syncCart() {
  // 从IndexedDB获取待同步的购物车数据
  // 发送到服务器
  console.log('[Service Worker] 同步购物车数据');
}

// 推送通知
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/images/logo.png',
    badge: '/images/badge.png',
    data: {
      url: 'https://example.com/offers'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('极速商城', options)
  );
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
}); 