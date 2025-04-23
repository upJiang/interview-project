# Vite 插件使用说明

这个项目实现了一个自定义的 Vite 插件 `vite-plugin-example`，展示了 Vite 插件的各种钩子和功能。

## 插件功能概述

1. **HTML 转换**: 修改网页标题，添加自定义前缀
2. **虚拟模块**: 提供无需实际文件的虚拟模块
3. **代码转换**: 为 JavaScript 文件添加注释
4. **开发服务器扩展**: 添加请求日志中间件
5. **构建过程钩子**: 输出构建开始和结束的日志

## 如何测试插件功能

插件功能可以通过以下方式观察到：

### 1. HTML 转换

打开浏览器，查看页面标题，应显示 "Vite Demo - Vite 示例项目"，而不是原始的 "Vite 示例项目"。

### 2. 虚拟模块

应用中包含了 `VirtualModuleDemo` 组件，它从一个不存在的模块 `virtual-module` 导入内容。这个虚拟模块是由插件提供的，内容为 "This is a virtual module"。

### 3. 代码转换

如果你查看浏览器中加载的 JavaScript 文件，应该可以看到每个文件开头都添加了注释：`/* Vite Demo */`。

### 4. 开发服务器扩展

运行开发服务器时，每个请求都会在控制台输出类似 `Vite Demo: /src/main.js` 的日志。

### 5. 构建过程钩子

运行构建命令时，控制台会输出以下日志：
```
Vite Demo: Build starting...
... (其他构建日志)
Vite Demo: Build ended
```

## 插件代码解析

### 钩子函数

1. **configureServer**: 配置开发服务器，添加中间件
2. **buildStart/buildEnd**: 监听构建开始和结束事件
3. **resolveId/load**: 处理模块解析和加载，用于创建虚拟模块
4. **transform**: 转换源代码，为JS文件添加注释
5. **transformIndexHtml**: 转换HTML内容，修改页面标题

### 使用示例

```javascript
// vite.config.js
import myPlugin from './vite-plugin-example';

export default {
  plugins: [
    myPlugin({ prefix: 'Vite Demo' })
  ]
}
```

## 如何运行

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 更多钩子和用例

Vite 插件可以使用所有 Rollup 插件钩子，以及 Vite 特有的钩子。完整列表请参考：

- [Vite 插件 API](https://cn.vitejs.dev/guide/api-plugin.html)
- [Rollup 插件 API](https://rollupjs.org/guide/en/#plugin-development)