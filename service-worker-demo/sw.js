// 缓存名称
const CACHE_NAME = "service-worker-demo-v1";

// 需要缓存的资源列表
const CACHE_URLS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./sw.js",
  "./images/example.jpg",
];

// 安装事件 - 预缓存资源
self.addEventListener("install", (event) => {
  console.log("[Service Worker] 安装中...");

  // 跳过等待，直接激活
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] 预缓存资源");
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log("[Service Worker] 资源缓存完成");
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] 激活中...");

  // 立即获取控制权
  event.waitUntil(clients.claim());

  // 清理旧缓存
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] 删除旧缓存:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截请求 - 缓存优先策略
self.addEventListener("fetch", (event) => {
  // 检查请求URL是否有效且可缓存（排除chrome-extension等非HTTP(S)协议）
  const requestUrl = new URL(event.request.url);
  if (requestUrl.protocol !== "http:" && requestUrl.protocol !== "https:") {
    console.log("[Service Worker] 跳过非HTTP(S)请求:", event.request.url);
    return;
  }

  console.log("[Service Worker] 拦截请求:", event.request.url);

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // 缓存命中，直接返回缓存的资源
        if (response) {
          console.log("[Service Worker] 使用缓存:", event.request.url);
          return response;
        }

        // 缓存未命中，发起网络请求
        console.log(
          "[Service Worker] 缓存未命中，发起网络请求:",
          event.request.url
        );
        return fetch(event.request).then((networkResponse) => {
          // 只缓存成功的响应
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // 复制响应（因为响应流只能使用一次）
          const responseToCache = networkResponse.clone();

          // 缓存网络响应
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
            console.log("[Service Worker] 缓存新的响应:", event.request.url);
          });

          return networkResponse;
        });
      })
      .catch((error) => {
        console.error("[Service Worker] 请求失败:", error);
        // 这里可以返回一个离线页面或提示
      })
  );
});

// 监听消息 - 处理主线程发来的消息
self.addEventListener("message", (event) => {
  console.log("[Service Worker] 收到消息:", event.data);

  if (event.data && event.data.action === "cacheResources") {
    console.log("[Service Worker] 手动触发资源缓存");

    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_URLS))
    );
  }
});
