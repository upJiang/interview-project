# Service Worker 学习笔记

## 项目创建过程

1. **创建基本页面结构**
   - 构建了简单的HTML文件，包含页面基本布局
   - 设计了简单的CSS样式表，使界面美观易用
   - 添加了状态显示区域和操作按钮

2. **实现主JavaScript逻辑**
   - 检查浏览器对Service Worker的支持
   - 提供注册Service Worker的功能
   - 实现缓存清理功能
   - 建立缓存统计显示

3. **Service Worker核心实现**
   - 编写`sw.js`文件，实现核心功能
   - 定义Install、Activate和Fetch事件处理函数
   - 实现缓存优先的网络请求策略
   - 添加缓存更新和清理功能

4. **测试与验证**
   - 使用浏览器开发者工具中的Application标签页查看Service Worker状态
   - 测试离线访问功能
   - 验证缓存管理是否正常工作

## Service Worker 原理与代码解析

### Service Worker 是什么？

Service Worker是一种特殊的Web Worker，它是一个独立于网页的JavaScript线程，运行在浏览器后台，能够拦截和处理网络请求，实现资源缓存。它是PWA(Progressive Web App)技术的核心组件之一。

### 代码实现解析

#### 1. 注册 Service Worker

在主页面中，我们需要检查浏览器支持并注册Service Worker：

```javascript
// 检查浏览器是否支持Service Worker
if ('serviceWorker' in navigator) {
  // 注册Service Worker
  window.addEventListener('load', async () => {
    try {
      // 注册Service Worker，指定作用域范围
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker 注册成功:', registration);
      
      // 可以监听Service Worker的状态变化
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        installingWorker.onstatechange = () => {
          console.log('Service Worker 状态变化:', installingWorker.state);
        };
      };
    } catch (error) {
      console.error('Service Worker 注册失败:', error);
    }
  });
}
```

这段代码在我们项目的app.js中被简化为：

```javascript
// 注册 Service Worker
async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register("./sw.js");
    console.log("Service Worker 注册成功:", registration);
    statusElement.textContent = "Service Worker 注册成功!";

    // 触发资源缓存
    const worker = registration.installing || registration.waiting || registration.active;
    worker.postMessage({ action: "cacheResources" });

    updateCacheInfo();
  } catch (error) {
    console.error("Service Worker 注册失败:", error);
    statusElement.textContent = "注册失败: " + error.message;
  }
}
```

#### 2. 安装事件处理

在Service Worker中，install事件是初始化缓存的最佳时机：

```javascript
// 缓存名称
const CACHE_NAME = 'service-worker-demo-v1';

// 需要缓存的资源列表
const CACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './sw.js',
  './images/example.jpg'
];

// 安装事件 - 预缓存资源
self.addEventListener('install', event => {
  console.log('[Service Worker] 安装中...');
  
  // 跳过等待，直接激活
  self.skipWaiting();
  
  // waitUntil方法确保Service Worker不会在Promise完成前安装完成
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 预缓存资源');
        // 缓存指定的资源列表
        return cache.addAll(CACHE_URLS);
      })
  );
});
```

这里的`skipWaiting()`方法使得新的Service Worker能够立即激活，不需要等待旧的Service Worker终止。`waitUntil()`方法延长了事件的生命周期，直到Promise完成。

#### 3. 激活事件处理

activate事件主要用于清理旧版本的缓存：

```javascript
// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活中...');
  
  // 立即获取控制权，不需要刷新页面
  event.waitUntil(clients.claim());
  
  // 清理旧缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 删除不匹配当前版本的缓存
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

`clients.claim()`方法使新激活的Service Worker立即获得对之前打开的页面的控制权。缓存清理逻辑确保不会累积过多的旧缓存。

#### 4. 拦截网络请求

fetch事件是实现离线功能的关键，这里使用了"缓存优先"策略：

```javascript
// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', event => {
  console.log('[Service Worker] 拦截请求:', event.request.url);
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中，直接返回缓存的资源
        if (response) {
          console.log('[Service Worker] 使用缓存:', event.request.url);
          return response;
        }
        
        // 缓存未命中，发起网络请求
        console.log('[Service Worker] 缓存未命中，发起网络请求:', event.request.url);
        return fetch(event.request).then(networkResponse => {
          // 只缓存成功的响应
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          // 复制响应（因为响应流只能使用一次）
          const responseToCache = networkResponse.clone();
          
          // 缓存网络响应
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
            console.log('[Service Worker] 缓存新的响应:', event.request.url);
          });
          
          return networkResponse;
        });
      })
      .catch(error => {
        console.error('[Service Worker] 请求失败:', error);
        // 这里可以返回一个离线页面或提示
        // return caches.match('./offline.html');
      })
  );
});
```

这段代码先检查请求是否在缓存中，如果有就直接返回缓存内容，否则发起网络请求，并将响应缓存起来以便下次使用。注意`clone()`方法的使用，因为响应流只能被读取一次。

#### 5. 与主线程通信

Service Worker可以与主线程进行消息通信：

```javascript
// 监听消息 - 处理主线程发来的消息
self.addEventListener('message', event => {
  console.log('[Service Worker] 收到消息:', event.data);
  
  if (event.data && event.data.action === 'cacheResources') {
    console.log('[Service Worker] 手动触发资源缓存');
    
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(CACHE_URLS))
    );
  }
});
```

在主线程中发送消息的示例：

```javascript
// 主线程向Service Worker发送消息
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    action: 'cacheResources'
  });
}
```

### 生命周期

1. **注册(Register)**: 网页通过`navigator.serviceWorker.register()`注册Service Worker
2. **安装(Install)**: 首次注册或有更新时触发，通常用于预缓存资源
3. **激活(Activate)**: 安装成功后激活，通常用于清理旧缓存
4. **空闲(Idle)**: 等待事件触发
5. **终止(Terminated)**: 长时间不用会被终止以节省资源
6. **获取(Fetch)**: 拦截网络请求，可以返回缓存或网络响应

### 缓存策略代码示例

#### 1. Cache First 策略（示例中已实现）

优先使用缓存，缓存不存在时才请求网络：

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 命中缓存则返回
        if (response) {
          return response;
        }
        // 否则请求网络
        return fetch(event.request);
      })
  );
});
```

#### 2. Network First 策略

优先使用网络，网络不可用时才使用缓存：

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 缓存网络响应的副本
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 网络请求失败，使用缓存
        return caches.match(event.request);
      })
  );
});
```

#### 3. Stale While Revalidate 策略

返回缓存同时更新缓存：

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // 启动网络请求（不等待）
        const fetchPromise = fetch(event.request).then(networkResponse => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        // 返回缓存（如果有）或等待网络
        return response || fetchPromise;
      });
    })
  );
});
```

## 面试应对策略与代码示例

### Service Worker 相关问题及回答

#### 问题1：什么是Service Worker，它有什么作用？

**回答**：
Service Worker是一种运行在浏览器后台的脚本，独立于网页，能够拦截和处理网络请求。主要作用包括：

- 实现离线缓存，让网站在无网络环境下依然可用
- 提升页面加载速度，通过缓存策略减少网络请求
- 后台同步，在网络恢复时自动同步数据
- 接收推送通知，实现消息推送功能

**代码示例**：
```javascript
// 基本的Service Worker注册
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker 注册成功，作用域：', registration.scope);
    })
    .catch(error => {
      console.error('Service Worker 注册失败：', error);
    });
}

// Service Worker中的缓存实现
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

在我的项目中，我主要使用Service Worker实现了资源缓存和离线访问功能，让用户在弱网或断网环境下依然能够访问关键页面内容。

#### 问题2：Service Worker与传统缓存机制(如HTTP缓存)有什么区别？

**回答**：
两者主要区别在于：

1. **控制粒度**：Service Worker提供了编程式的细粒度缓存控制，而HTTP缓存依赖于服务器设置的缓存头
2. **缓存策略**：Service Worker可以实现更复杂的缓存策略，如离线优先、网络优先等
3. **动态资源处理**：Service Worker可以处理动态请求，而不仅仅是静态资源
4. **离线能力**：Service Worker能够在完全离线状态下工作
5. **更新机制**：Service Worker有专门的更新机制，可以实现版本控制

**代码对比**：

HTTP缓存（服务器端设置）：
```
// HTTP头部设置
Cache-Control: max-age=86400
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

Service Worker缓存（客户端控制）：
```javascript
self.addEventListener('fetch', event => {
  // 可以根据URL、请求方法、请求头等信息决定缓存策略
  if (event.request.url.includes('/api/')) {
    // API请求使用网络优先策略
    event.respondWith(networkFirst(event.request));
  } else if (event.request.url.includes('.jpg')) {
    // 图片使用缓存优先策略
    event.respondWith(cacheFirst(event.request));
  } else {
    // 其他资源使用stale-while-revalidate策略
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
```

在实际项目中，我会结合使用这两种缓存机制，HTTP缓存用于优化常规网络请求，Service Worker用于实现离线功能和特殊的缓存需求。

#### 问题3：在你的项目中，如何处理Service Worker的更新问题？

**回答**：
处理更新是Service Worker使用中的重要问题，我的策略包括：

1. **版本控制**：为缓存名称添加版本号，如`'app-v1'`，更新时递增版本号
2. **激活时清理**：在activate事件中清理旧版本的缓存
3. **skipWaiting**：在适当情况下使用`self.skipWaiting()`立即激活新版本
4. **提示用户**：重要更新时，通知用户刷新页面以使用新版本
5. **定期检查**：设置定期检查更新的机制

**代码示例**：
```javascript
// Service Worker中的版本控制
const CACHE_VERSION = 'v2';
const CACHE_NAME = `my-app-cache-${CACHE_VERSION}`;

// 安装时缓存资源
self.addEventListener('install', event => {
  console.log(`[SW] 新版本 ${CACHE_VERSION} 安装中`);
  
  // 跳过等待，直接激活
  self.skipWaiting();
  
  // 预缓存关键资源
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
  console.log(`[SW] 新版本 ${CACHE_VERSION} Al激活中`);
  
  // 立即接管页面
  event.waitUntil(clients.claim());
  
  // 清理旧版本缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('my-app-cache-') && name !== CACHE_NAME)
          .map(name => {
            console.log(`[SW] 删除旧缓存: ${name}`);
            return caches.delete(name);
          })
      );
    })
  );
});

// 主页面检测Service Worker更新
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    // 检查更新
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      
      // 监听新Service Worker的状态变化
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // 新Service Worker已安装但未激活
          // 提示用户刷新页面
          if (confirm('新版本可用，是否刷新使用新功能？')) {
            window.location.reload();
          }
        }
      });
    });
  });
}
```

例如，当我们发布新版本时，会修改Service Worker脚本，当用户再次访问网站，新的Service Worker会被下载并安装，但需要等到所有打开的标签页关闭后才会激活。为了提供更好的用户体验，我们会检测到新版本安装后提示用户刷新页面。

#### 问题4：Service Worker有哪些限制和注意事项？

**回答**：
在使用Service Worker时，需要注意以下几点：

1. **必须使用HTTPS**：生产环境必须在HTTPS下运行（localhost除外）
2. **作用域限制**：只能控制注册路径下的页面请求
3. **异步API**：几乎所有API都是基于Promise的异步操作
4. **无DOM访问**：不能直接操作DOM元素
5. **生命周期复杂**：需要正确理解和处理各种生命周期事件
6. **调试复杂**：调试相对困难，需要使用特定的开发者工具

**代码示例与注意事项**：

作用域限制：
```javascript
// 指定Service Worker的作用域
navigator.serviceWorker.register('/js/sw.js', { 
  scope: '/app/' 
});
// 此Service Worker只能控制/app/路径下的页面
// 无法控制上层目录或其他路径
```

异步API处理：
```javascript
// 错误写法 - 同步思维
let cache;
caches.open('my-cache').then(c => cache = c);
cache.add('/index.html'); // 错误! cache可能尚未被赋值

// 正确写法 - Promise链
caches.open('my-cache')
  .then(cache => cache.add('/index.html'))
  .catch(error => console.error('缓存失败:', error));
```

在我的项目实践中，特别关注HTTPS和缓存更新问题。一个常见的陷阱是忘记更新缓存版本号，导致用户无法获取最新内容，所以我们建立了严格的缓存管理和版本控制流程。

#### 问题5：你如何处理Service Worker中的错误和异常？

**回答**：
错误处理是确保Service Worker稳定运行的关键，我的处理策略包括：

1. **完善的Promise链**：确保每个Promise链都有`.catch()`处理错误
2. **降级处理**：当Service Worker失败时，回退到传统的网络请求
3. **错误日志**：记录关键错误信息，便于后期分析
4. **自我修复**：检测到异常状态时尝试重新注册Service Worker
5. **监控系统**：在生产环境中使用性能监控工具跟踪Service Worker的状态

**代码示例**：

Promise错误处理：
```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // 网络请求可能失败，需要处理错误
        return fetch(event.request)
          .then(networkResponse => {
            // 处理网络响应
            if (!networkResponse || networkResponse.status !== 200) {
              throw new Error('网络请求失败');
            }
            return networkResponse;
          })
          .catch(error => {
            console.error('请求失败:', error);
            // 提供降级响应，如离线页面
            return caches.match('/offline.html');
          });
      })
      .catch(error => {
        console.error('缓存查找失败:', error);
        // 最终的降级响应
        return new Response('网站暂时不可用，请稍后再试', {
          status: 503,
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});
```

自我修复机制：
```javascript
// 在主页面检测Service Worker状态
function checkServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration()
      .then(registration => {
        if (!registration || !registration.active) {
          console.warn('Service Worker不活跃，尝试重新注册');
          registerServiceWorker();
        }
      })
      .catch(error => {
        console.error('Service Worker检查失败:', error);
        // 清除旧的注册
        navigator.serviceWorker.getRegistrations()
          .then(registrations => {
            for (let registration of registrations) {
              registration.unregister();
            }
            // 重新注册
            registerServiceWorker();
          });
      });
  }
}

// 定期检查
setInterval(checkServiceWorker, 60 * 60 * 1000); // 每小时检查一次
```

例如，在我负责的一个项目中，我们发现某些旧版浏览器对Service Worker的支持有bug，于是实现了完善的特性检测和降级处理，确保即使Service Worker不可用，网站的核心功能仍能正常工作。 