// DOM 元素
const statusElement = document.getElementById("status");
const cacheCountElement = document.getElementById("cache-count");
const installButton = document.getElementById("install-btn");
const clearButton = document.getElementById("clear-btn");

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

// 检查 Service Worker 是否受支持
if ("serviceWorker" in navigator) {
  statusElement.textContent = "Service Worker 可用";

  // 页面加载完成后检查 Service Worker 注册状态
  window.addEventListener("load", checkServiceWorkerRegistration);

  // 绑定按钮事件
  installButton.addEventListener("click", registerServiceWorker);
  clearButton.addEventListener("click", clearCache);
} else {
  statusElement.textContent = "您的浏览器不支持 Service Worker";
  installButton.disabled = true;
  clearButton.disabled = true;
}

// 检查 Service Worker 注册状态
async function checkServiceWorkerRegistration() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      statusElement.textContent = "Service Worker 已注册";
      updateCacheInfo();
    } else {
      statusElement.textContent = "Service Worker 未注册";
    }
  } catch (error) {
    console.error("Service Worker 注册检查失败:", error);
    statusElement.textContent = "检查失败";
  }
}

// 注册 Service Worker
async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register("./sw.js");
    console.log("Service Worker 注册成功:", registration);
    statusElement.textContent = "Service Worker 注册成功!";

    // 触发资源缓存
    const worker =
      registration.installing || registration.waiting || registration.active;
    worker.postMessage({ action: "cacheResources" });

    updateCacheInfo();
  } catch (error) {
    console.error("Service Worker 注册失败:", error);
    statusElement.textContent = "注册失败: " + error.message;
  }
}

// 清除缓存
async function clearCache() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    console.log("缓存已清除");
    statusElement.textContent = "缓存已清除";
    updateCacheInfo();
  } catch (error) {
    console.error("清除缓存失败:", error);
    statusElement.textContent = "清除缓存失败";
  }
}

// 更新缓存信息展示
async function updateCacheInfo() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    cacheCountElement.textContent = keys.length;
  } catch (error) {
    console.error("获取缓存信息失败:", error);
    cacheCountElement.textContent = "获取失败";
  }
}
