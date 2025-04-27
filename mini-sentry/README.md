# Mini-Sentry

轻量级前端异常监控与埋点系统，提供类似Sentry的核心功能。

## 功能特点

- 🔍 错误捕获：自动捕获JS异常、Promise异常、资源加载异常
- 📊 行为追踪：记录用户操作轨迹和业务事件
- 📡 数据上报：支持批量上报和实时上报
- 🔄 会话跟踪：跟踪用户会话和PV/UV统计
- 🧩 框架集成：支持Vue和React框架的错误处理

## 快速开始

### 通过Script标签引入

```html
<script src="path/to/mini-sentry.min.js"></script>
<script>
  MiniSentry.init({
    dsn: 'https://your-endpoint.com/collect',
    app: 'your-app-name',
    debug: true
  });
</script>
```

### 自动初始化

在script标签中添加`data-auto-init`属性：

```html
<script 
  src="path/to/mini-sentry.min.js" 
  data-auto-init 
  data-dsn="https://your-endpoint.com/collect" 
  data-app="your-app-name">
</script>
```

### 错误捕获

```javascript
try {
  // 可能出错的代码
} catch (error) {
  MiniSentry.captureException(error);
}

// 也可以直接捕获消息
MiniSentry.captureMessage('发生了一个问题', 'warning');

// 包装函数自动捕获异常
const riskyFunction = MiniSentry.wrap(function() {
  // 可能出错的代码
});
```

### 用户行为追踪

```javascript
// 设置用户信息
MiniSentry.setUser({
  id: '12345',
  name: '张三',
  email: 'zhangsan@example.com'
});

// 追踪事件
MiniSentry.trackEvent('button_click', {
  buttonId: 'submit-btn',
  pageName: 'checkout'
});

// 设置标签和额外信息
MiniSentry.setTag('version', '1.2.3');
MiniSentry.setExtra('serverResponse', responseData);
```

### 框架集成

#### Vue集成

```javascript
import Vue from 'vue';
import { vuePlugin } from 'mini-sentry/plugins/vue';
import * as MiniSentry from 'mini-sentry';

MiniSentry.init({
  dsn: 'https://your-endpoint.com/collect',
  app: 'your-vue-app'
});

Vue.use(vuePlugin, { Vue });
```

#### React集成

```javascript
import React from 'react';
import * as MiniSentry from 'mini-sentry';
import { withErrorBoundary, ErrorBoundary } from 'mini-sentry/plugins/react';

MiniSentry.init({
  dsn: 'https://your-endpoint.com/collect',
  app: 'your-react-app'
});

// 使用高阶组件
const SafeComponent = withErrorBoundary(YourComponent, {
  fallback: <p>出错了！</p>
});

// 或使用ErrorBoundary组件
function App() {
  return (
    <ErrorBoundary fallback={<p>出错了！</p>}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

## 示例

查看 `example.html` 文件获取完整使用示例。

## 文档

详细的系统设计和实现文档请参考 `study.md`。 