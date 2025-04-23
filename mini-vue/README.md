# Mini-Vue

这是一个简化版的Vue3响应式系统实现，用于学习和理解Vue3的核心原理。

## 功能特性

- 响应式系统（基于Proxy）
- 依赖追踪（track）
- 触发更新（trigger）
- 副作用函数（effect）
- 简单的组件渲染系统

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start
```

打开浏览器访问 http://localhost:8080 查看示例。

## 项目结构

```
mini-vue/
├── src/
│   ├── reactivity.js  # 响应式系统核心
│   ├── renderer.js    # 简单渲染器
│   └── index.js       # 入口文件
├── index.html         # 示例页面
├── package.json
└── README.md
```

## 学习资源

详细的实现原理和解析请查看 [study.md](./study.md) 文件。 