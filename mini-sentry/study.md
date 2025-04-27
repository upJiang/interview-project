# Mini-Sentry: 前端异常监控系统实现
 
## 1. 项目概述

Mini-Sentry 是一个轻量级的前端异常监控和埋点跟踪系统，主要功能包括:

* 🔍 错误捕获与收集：自动捕获前端各类异常（JS异常、Promise异常、资源加载错误、网络请求错误等）
* 📊 用户行为追踪：通过埋点收集用户操作行为和业务事件
* 🌐 数据上报：将收集的数据安全高效地上报到服务端
* 🔄 会话追踪：通过面包屑机制记录用户行为轨迹和环境信息
* 🔌 框架集成：提供Vue、React等主流框架的集成方案

本项目模拟了Sentry的核心功能，适用于学习和面试展示。

## 2. 系统架构设计

### 2.1 核心架构

Mini-Sentry采用模块化设计，主要分为以下几个核心模块：

* **Client**：主客户端，整合各模块，提供统一API
* **ErrorHandler**：错误捕获与处理模块
* **Tracker**：埋点追踪与用户行为收集模块
* **Breadcrumb**：面包屑记录模块，用于追踪用户行为轨迹
* **Transport**：数据传输模块，负责数据上报
* **Plugins**：针对各框架的集成插件

### 2.2 数据流设计

系统的数据流向如下：

1. **捕获阶段**：通过全局异常监听、代码埋点等方式收集原始数据
2. **处理阶段**：对数据进行标准化、去重、采样和丰富化处理
3. **缓存阶段**：维护本地存储和内存队列，实现批量上报和重试机制
4. **上报阶段**：通过多种传输方式将数据安全上报到服务端

### 2.3 技术架构图

```
┌─────────────────────────────────┐
│           应用代码              │
└───────────────┬─────────────────┘
                ↓
┌─────────────────────────────────┐
│       MiniSentry SDK            │
├─────────────────────────────────┤
│                                 │
│  ┌─────────┐      ┌─────────┐   │
│  │ 错误捕获 │←────→│ 埋点追踪 │   │
│  └────┬────┘      └────┬────┘   │
│       │                │        │
│       ↓                ↓        │
│  ┌─────────┐      ┌─────────┐   │
│  │ 面包屑  │←────→│ 上下文  │   │
│  └────┬────┘      └────┬────┘   │
│       │                │        │
│       └────────┬───────┘        │
│                ↓                │
│         ┌──────────────┐        │
│         │  数据上报    │        │
│         └──────┬───────┘        │
└────────────────┼────────────────┘
                 ↓
┌────────────────┼────────────────┐
│        ┌───────┴──────┐         │
│        │   服务端     │         │
│        └──────────────┘         │
└─────────────────────────────────┘
```

## 3. 核心功能实现

### 3.1 错误捕获实现

错误监控系统能够捕获以下类型的错误：

1. **JavaScript运行时错误**：通过全局的`window.onerror`事件捕获
   ```javascript
   window.addEventListener('error', (event) => {
     // 处理JS错误
   }, true);
   ```

2. **未处理的Promise拒绝**：通过`unhandledrejection`事件捕获
   ```javascript
   window.addEventListener('unhandledrejection', (event) => {
     // 处理Promise错误
   });
   ```

3. **资源加载错误**：区分资源类型进行处理
   ```javascript
   // 资源加载错误与JS错误通过target属性区分
   if (event.target && event.target.nodeName) {
     // 资源加载错误
   }
   ```

4. **网络请求错误**：通过劫持XHR和Fetch API实现
   ```javascript
   // 劫持XMLHttpRequest
   const originalSend = XMLHttpRequest.prototype.send;
   XMLHttpRequest.prototype.send = function() {
     // 监听错误
     this.addEventListener('error', handleXhrError);
     originalSend.apply(this, arguments);
   };
   ```

5. **框架特定错误**：通过插件机制集成Vue、React等框架的错误处理
   ```javascript
   // Vue 错误处理
   Vue.config.errorHandler = function(err, vm, info) {
     // 处理Vue组件错误
   };
   ```

### 3.2 埋点系统实现

埋点系统支持以下几种埋点方式：

1. **自动埋点**：自动收集PV/UV、页面停留时间等基础数据
   ```javascript
   // 页面访问自动埋点
   trackPageView({
     url: location.href,
     referrer: document.referrer,
     title: document.title
   });
   ```

2. **代码埋点**：通过API手动埋点记录业务事件
   ```javascript
   // 业务事件埋点
   trackEvent('button_click', {
     buttonId: 'submit',
     page: 'checkout'
   });
   ```

3. **可视化埋点**：通过DOM属性标记需要跟踪的元素
   ```html
   <!-- 通过data-track属性进行埋点 -->
   <button data-track='{"event":"login_click","category":"user"}'>
     登录
   </button>
   ```

4. **路由埋点**：自动监控SPA应用的路由变化
   ```javascript
   // 监听history API
   const originalPushState = history.pushState;
   history.pushState = function() {
     originalPushState.apply(this, arguments);
     trackPageView(); // 记录PV
   };
   ```

### 3.3 数据上报策略

数据上报采用以下策略确保数据可靠传输：

1. **批量上报**：将多个事件合并一次上报，减少请求次数
   ```javascript
   // 添加到上报队列
   addToReportQueue(event);
   // 达到阈值或定时触发上报
   if (queue.length >= maxBatchSize) {
     flushQueue();
   }
   ```

2. **优雅上报**：选择合适的时机上报数据
   ```javascript
   // 页面卸载前上报
   window.addEventListener('beforeunload', () => {
     transport.flush(true); // 使用beacon API
   });
   ```

3. **传输方式降级**：根据浏览器支持情况选择上报方式
   ```javascript
   if (navigator.sendBeacon) {
     // 使用Beacon API (不阻塞页面卸载)
     navigator.sendBeacon(url, data);
   } else if (typeof fetch === 'function') {
     // 使用fetch API
     fetch(url, {keepalive: true, ...});
   } else {
     // 降级使用XHR
     const xhr = new XMLHttpRequest();
     // ...
   }
   ```

4. **失败重试机制**：对上报失败的数据进行重试
   ```javascript
   // 上报失败后重试
   if (error && retryCount < maxRetries) {
     setTimeout(() => {
       sendData(data, retryCount + 1);
     }, retryInterval);
   }
   ```

5. **采样控制**：根据配置的采样率决定是否上报
   ```javascript
   // 采样决策
   if (Math.random() >= sampleRate) {
     return; // 不采集该用户数据
   }
   ```

### 3.4 面包屑机制

面包屑系统用于记录用户行为轨迹，主要包括：

1. **用户交互记录**：点击、输入等操作
   ```javascript
   // 记录点击事件
   document.addEventListener('click', (event) => {
     breadcrumb.captureDOMEvent(event);
   }, true);
   ```

2. **网络请求记录**：AJAX、Fetch请求
   ```javascript
   // 记录XHR请求
   xhr.addEventListener('load', function() {
     breadcrumb.captureHttpRequest({
       method, url, status, duration
     });
   });
   ```

3. **路由变化记录**：页面导航
   ```javascript
   // 记录导航事件
   breadcrumb.captureNavigation(from, to);
   ```

4. **控制台输出记录**：console日志
   ```javascript
   // 记录console输出
   const originalConsole = console.log;
   console.log = function() {
     breadcrumb.captureConsole('log', arguments);
     originalConsole.apply(console, arguments);
   };
   ```

5. **自定义事件记录**：业务事件
   ```javascript
   // 记录自定义事件
   breadcrumb.captureEvent('important_action');
   ```

## 4. 核心代码结构

```
mini-sentry/
├── src/
│   ├── core/               # 核心功能模块
│   │   ├── client.js       # 客户端主类
│   │   ├── breadcrumb.js   # 面包屑系统
│   │   ├── error-handler.js # 错误处理器
│   │   └── tracker.js      # 埋点追踪器
│   ├── utils/              # 工具类
│   │   ├── helpers.js      # 辅助函数
│   │   ├── logger.js       # 日志工具
│   │   └── transport.js    # 数据传输
│   ├── plugins/            # 框架插件
│   │   ├── vue.js          # Vue集成
│   │   └── react.js        # React集成
│   ├── config.js           # 配置文件
│   ├── version.js          # 版本信息
│   └── index.js            # 入口文件
├── example.html            # 使用示例
└── study.md                # 项目总结
```

## 5. 工程化与性能优化

### 5.1 性能优化考量

1. **最小化运行时开销**
   - 使用节流和防抖技术限制高频事件处理
   - 延迟非关键功能初始化
   - 避免阻塞主线程的操作

2. **数据传输优化**
   - 使用批量上报减少请求数
   - 压缩上报数据
   - 选择合适的上报时机

3. **存储优化**
   - 限制面包屑数量
   - 控制内存使用
   - 避免循环引用导致的内存泄漏

### 5.2 安全性考虑

1. **数据脱敏**
   - 不收集密码等敏感信息
   - 限制收集的用户个人信息
   - 提供数据处理钩子允许用户过滤敏感数据

2. **跨域问题处理**
   - 使用跨域友好的上报方式
   - 处理CORS限制

3. **错误过滤**
   - 忽略第三方脚本错误
   - 忽略无法获取详细信息的跨域错误
   - 提供配置选项过滤特定错误

## 6. 系统扩展性设计

### 6.1 插件机制

Mini-Sentry提供插件机制支持扩展功能：

```javascript
// 插件注册
client.use(vuePlugin, { router });

// 插件定义
function vuePlugin(Vue, options) {
  // 集成Vue错误处理
  Vue.config.errorHandler = function(err, vm, info) {
    // 处理并上报Vue错误
  };
}
```

### 6.2 钩子函数

提供多个生命周期钩子允许自定义处理：

1. **beforeSend**：上报前处理错误数据
   ```javascript
   beforeSend: (event, hint) => {
     // 可以修改或丢弃事件
     if (shouldIgnore(event)) {
       return null; // 丢弃事件
     }
     return event; // 返回修改后的事件
   }
   ```

2. **beforeBreadcrumb**：处理面包屑数据
   ```javascript
   beforeBreadcrumb: (breadcrumb, hint) => {
     // 可以修改或过滤面包屑
     if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
       return null; // 忽略debug日志
     }
     return breadcrumb;
   }
   ```

## 7. 面试要点总结

### 7.1 技术亮点

1. **全面的错误捕获机制**
   - 全面覆盖各类前端错误类型
   - 错误去重和采样机制
   - 优雅降级的错误处理

2. **高效的数据上报策略**
   - 批量上报和优雅上报
   - 多重传输方式和降级策略
   - 失败重试机制

3. **丰富的上下文信息收集**
   - 面包屑追踪用户行为轨迹
   - 环境信息收集
   - 错误现场重现能力

4. **框架集成能力**
   - Vue/React等框架的错误处理集成
   - 适应不同框架版本
   - 提供框架专用API

5. **可扩展的架构设计**
   - 模块化结构
   - 插件机制
   - 钩子函数

### 7.2 解决的技术难点

1. **处理异步错误**：通过多种手段捕获Promise、setTimeout等异步上下文的错误

2. **减少性能影响**：通过采样、节流等机制确保监控系统不影响应用性能

3. **确保上报可靠性**：通过多重上报机制和重试策略确保数据不丢失

4. **处理跨域限制**：解决跨域脚本错误信息有限的问题

5. **适应不同浏览器环境**：针对不同浏览器特性提供兼容方案

### 7.3 系统设计思路

1. **模块化与关注点分离**：将系统划分为明确的功能模块，每个模块专注于单一职责

2. **可配置性**：提供丰富的配置选项满足不同场景需求

3. **优雅降级**：针对不同浏览器环境提供功能降级策略

4. **用户友好API设计**：提供简洁直观的API，降低使用门槛

5. **前端架构最佳实践**：采用单例模式、发布订阅模式等设计模式

### 7.4 工程化与性能

1. **性能优化策略**：
   - 避免阻塞主线程
   - 控制数据量和上报频率
   - 懒加载非关键功能

2. **开发体验优化**：
   - 友好的API设计
   - 详细的文档和示例
   - 插件化扩展机制

3. **监控自监控**：
   - SDK自身性能监控
   - 错误处理的错误处理

## 8. 项目实际应用价值

Mini-Sentry虽然是一个简化版的监控系统，但其核心思想和实现方式可以应用于实际项目中：

1. **问题诊断**：快速发现和定位线上问题
2. **用户体验优化**：通过行为数据分析改进产品
3. **性能监控**：收集性能指标，优化网站性能
4. **业务分析**：结合埋点数据进行业务分析
5. **安全监控**：发现潜在的安全问题

## 9. 未来扩展方向

1. **SourceMap解析**：支持通过SourceMap还原压缩代码的原始位置
2. **离线存储和恢复**：支持离线状态下的数据存储和网络恢复后上报
3. **智能告警**：基于错误严重性和频率的智能告警机制
4. **用户行为回放**：记录用户操作并支持回放重现错误场景
5. **性能监控增强**：Web Vitals等核心性能指标的监控

以上就是Mini-Sentry项目的设计思路和实现要点总结。通过这个项目，我们不仅实现了一个实用的前端监控系统，更深入理解了前端异常处理、用户行为跟踪和数据上报的技术原理和最佳实践。 