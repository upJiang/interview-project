# Webpack 示例项目

这是一个使用Webpack构建的简单任务管理应用，用于演示Webpack的基本配置和功能。

## 特性

- Webpack 5 配置
- Babel 转换 ES6+ 代码
- CSS 加载和处理
- 资源文件处理
- 开发服务器和热模块替换 (HMR)
- 生产环境优化

## 安装与运行

确保你已安装 [Node.js](https://nodejs.org/)。

1. 安装依赖：

```bash
npm install
```

2. 运行开发服务器：

```bash
npm start
```

3. 构建生产版本：

```bash
npm run build
```

## 项目结构

```
webpack-demo/
│
├── public/           # 静态资源文件夹
│   └── index.html    # HTML 模板
│
├── src/              # 源代码
│   ├── components/   # 组件
│   ├── styles/       # 样式文件
│   ├── app.js        # 应用逻辑
│   └── index.js      # 入口文件
│
├── .babelrc          # Babel 配置
├── package.json      # 项目依赖和脚本
├── webpack.config.js # Webpack 配置
└── README.md         # 项目说明
```

## Webpack 配置概述

- 入口：`src/index.js`
- 输出：`dist/bundle.[contenthash].js`
- 加载器：
  - babel-loader：处理 JavaScript
  - css-loader & style-loader：处理 CSS
  - 资源模块：处理图片等资源文件
- 插件：
  - HtmlWebpackPlugin：生成 HTML 文件
- 开发服务器：支持热模块替换 