// Service Worker 文件

const CACHE_NAME = "pwa-demo-v1";
const CACHE_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./manifest.json",
  "./images/icon-192x192.png",
  "./images/icon-512x512.png",
  "./offline.html",
];

// 安装事件 - 缓存资源
self.addEventListener("install", (event) => {
  console.log("Service Worker 安装中...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker 正在缓存文件");
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener("activate", (event) => {
  console.log("Service Worker 已激活");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker 正在清理旧缓存");
            return caches.delete(cache);
          }
        })
      );
    })
  );

  return self.clients.claim();
});

// 拦截请求事件 - 提供缓存响应
self.addEventListener("fetch", (event) => {
  console.log("Service Worker: 正在拦截请求", event.request.url);

  event.respondWith(
    // 尝试从缓存中匹配请求
    caches
      .match(event.request)
      .then((response) => {
        // 如果找到缓存响应，则返回缓存内容
        if (response) {
          console.log("Service Worker: 从缓存提供", event.request.url);
          return response;
        }

        // 如果未找到缓存，则从网络获取
        console.log("Service Worker: 从网络获取", event.request.url);
        return fetch(event.request).then((networkResponse) => {
          // 检查是否收到有效响应
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // 克隆响应 - 因为响应是流，只能使用一次
          const responseToCache = networkResponse.clone();

          // 打开缓存并存储响应
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
      .catch(() => {
        // 如果网络请求和缓存都失败 - 提供离线页面
        if (event.request.url.indexOf(".html") > -1) {
          return caches.match("./offline.html");
        }
      })
  );
});
