# PWA 演示应用

这是一个简单的PWA（Progressive Web App）演示应用，用于学习PWA的基本概念和实现方法。

## 项目结构

```
pwa-demo/
├── css/
│   └── style.css          # 样式文件
├── images/
│   ├── generate-icons.html  # 图标生成工具
│   ├── icon-192x192.png     # 小尺寸图标（需生成）
│   └── icon-512x512.png     # 大尺寸图标（需生成）
├── js/
│   └── app.js            # 主应用脚本
├── index.html            # 主页面
├── manifest.json         # Web App Manifest
├── offline.html          # 离线页面
├── package.json          # npm配置文件
├── sw.js                 # Service Worker
├── study.md              # PWA学习总结（面试资料）
└── README.md             # 本说明文件
```

## 使用方法

1. **生成图标**：
   - 打开 `images/generate-icons.html` 文件
   - 点击下载按钮生成两个图标
   - 将图标放在 `images` 目录中

2. **启动本地服务器**：
   - 由于PWA需要通过HTTPS或本地服务器提供，不能直接通过文件系统打开
   - 使用npm启动（推荐）：
     ```
     npm start
     ```
   - 或者使用其他方法：
     ```
     # 使用npx
     npx http-server
     
     # 使用Python 3
     python -m http.server
     
     # 使用Python 2
     python -m SimpleHTTPServer
     ```

3. **访问应用**：
   - 在浏览器中访问 `http://localhost:8080/`（端口可能有所不同）
   - 查看开发者工具的"Application"或"应用程序"标签查看Service Worker状态
   - 尝试将应用添加到主屏幕（在Chrome中，点击地址栏右侧的"安装"按钮）

4. **测试离线功能**：
   - 安装应用后，在开发者工具中启用"离线"模式
   - 或者断开网络连接
   - 刷新应用，查看应用是否仍然可用

## 学习资源

详细的PWA学习笔记请查看 [study.md](./study.md) 文件，其中包含：

- PWA核心概念解析
- 实现步骤详解
- 最佳实践总结
- 面试常见问题与答案

## 打包和分享

如果您想将此项目分享给其他人，可以采用以下方法：

### 方法1：ZIP压缩包

1. 生成图标（使用generate-icons.html）
2. 压缩整个pwa-demo文件夹
3. 发送给接收者，并告知他们：
   - 解压文件
   - 安装Node.js（如果没有）
   - 在解压后的文件夹中运行`npm start`

### 方法2：部署到GitHub Pages

1. 创建GitHub账号（如果没有）
2. 创建新仓库
3. 上传项目文件
4. 在仓库设置中启用GitHub Pages
5. 分享生成的URL

### 方法3：使用在线代码平台

使用CodeSandbox或Stackblitz等在线代码平台创建并分享项目。

## 注意事项

- 本项目仅供学习使用，展示了PWA的基本功能
- 在实际生产项目中，您可能需要更复杂的缓存策略和错误处理
- 不同浏览器对PWA的支持程度不同，请在多个浏览器中测试 