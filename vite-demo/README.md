# Vite 示例项目

这是一个使用Vite构建的简单任务管理应用，用于演示Vite的基本配置和功能。

## 特性

- Vite 5 配置
- 模块热替换 (HMR)
- ES 模块原生支持
- 快速开发服务器
- 基于 Rollup 的生产环境构建
- 资源处理

## 安装与运行

确保你已安装 [Node.js](https://nodejs.org/)。

1. 安装依赖：

```bash
npm install
```

2. 运行开发服务器：

```bash
npm run dev
```

3. 构建生产版本：

```bash
npm run build
```

4. 预览生产构建：

```bash
npm run preview
```

## 项目结构

```
vite-demo/
│
├── public/          # 静态资源文件夹
│   └── vite.svg     # Vite logo
│
├── src/             # 源代码
│   ├── components/  # 组件
│   ├── app.js       # 应用逻辑
│   ├── main.js      # 入口文件
│   └── style.css    # 样式文件
│
├── index.html       # HTML 入口文件
├── package.json     # 项目依赖和脚本
├── vite.config.js   # Vite 配置
└── README.md        # 项目说明
```

## Vite 配置概述

- 开发服务器配置：端口3000和自动打开浏览器
- 构建配置：基于Rollup的生产构建
- 优化：自动依赖优化
- 资源处理：自动处理静态资源 