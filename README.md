# 大文件上传演示项目

本项目是一个基于Vue3和Express实现的大文件上传演示，支持文件分片上传、断点续传、秒传等功能。

## 功能特性

- 文件分片上传：将大文件分割成小块依次上传
- 断点续传：上传中断后可以从已上传部分继续
- 秒传：相同文件（基于MD5计算）可以秒传
- 实时显示上传进度和速度
- 响应式界面设计

## 技术栈

- **前端**：Vue 3、Vite、ant-design-vue、axios、spark-md5
- **后端**：Node.js、Express、multer、fs-extra

## 如何使用

### 快速启动（推荐）

项目提供了一键启动脚本，可以自动安装依赖并启动前后端服务：

#### Windows

```
start.bat
```

或者直接使用Node运行：

```
node start.js
```

#### Linux/Mac

```
chmod +x start.sh
./start.sh
```

或者直接使用Node运行：

```
node start.js
```

### 手动启动

如果需要分别启动前后端服务，可按以下步骤操作：

1. 先启动后端服务：

```
cd fileUpload-demo/server
npm install
npm start
```

2. 再启动前端服务：

```
cd fileUpload-demo/client
npm install
npm run dev
```

## 项目结构

```
fileUpload-demo/
├── client/                # 前端代码
│   ├── src/
│   │   ├── components/
│   │   │   └── FileUpload.vue  # 文件上传组件
│   │   ├── App.vue        
│   │   └── main.js        
│   ├── vite.config.js     # Vite配置
│   └── package.json       # 前端依赖
│
├── server/                # 后端代码
│   ├── index.js           # 服务器入口
│   ├── uploads/           # 上传完成的文件存储目录
│   ├── temp/              # 临时文件存储目录
│   └── package.json       # 后端依赖
│
├── start.js               # 一键启动脚本
├── start.bat              # Windows启动脚本
└── start.sh               # Linux/Mac启动脚本
```

## 常见问题

- **问题**：端口冲突
  **解决方案**：启动脚本会自动检测并尝试释放被占用的端口，或者使用备用端口

- **问题**：上传速度慢
  **解决方案**：可以调整FileUpload.vue中的CHUNK_SIZE参数增加分片大小

- **问题**：上传失败
  **解决方案**：组件内置了错误处理和重试机制，也可手动点击重试按钮
