# 大文件上传Demo

该项目是一个基于Vue3和Express的大文件上传演示程序，实现了文件切片上传、断点续传、秒传等功能。

## 功能特点

- 基于Vue3和ant-design-vue开发的前端界面
- 文件切片上传（默认2MB每片）
- MD5计算文件唯一标识
- 断点续传功能
- 文件秒传功能
- 实时显示上传进度和速度
- 控制并发上传数量
- 文件合并功能

## 项目结构

```
fileUpload-demo/
├── client/                # 前端代码
│   ├── public/            # 静态资源
│   ├── src/               # 源代码
│   │   ├── components/    # 组件目录
│   │   │   └── FileUpload.vue  # 文件上传组件
│   │   ├── App.vue        # 主应用组件
│   │   └── main.js        # 入口文件
│   ├── index.html         # HTML入口
│   ├── package.json       # 前端依赖
│   └── vite.config.js     # Vite配置
│
├── server/                # 后端代码
│   ├── index.js           # 服务器入口
│   ├── package.json       # 后端依赖
│   ├── uploads/           # 上传完成的文件存储目录
│   └── temp/              # 临时文件存储目录
│
├── start.js               # 一键启动脚本
├── start.bat              # Windows一键启动批处理文件
├── start.sh               # Linux/Mac一键启动脚本
├── README.md              # 项目说明
└── study.md               # 学习总结
```

## 运行项目

### 一键启动（推荐）

#### Windows用户

直接双击`start.bat`文件即可启动，或者在命令行中运行：

```bash
start.bat
```

#### Linux/Mac用户

先赋予脚本执行权限，然后执行脚本：

```bash
chmod +x start.sh
./start.sh
```

#### 所有平台用户

只需要运行项目根目录下的启动脚本，即可自动安装依赖并同时启动前端和后端服务：

```bash
node start.js
```

该脚本会自动：
1. 检查并安装前端和后端依赖
2. 先启动后端服务
3. 再启动前端开发服务器
4. 显示访问地址

### 分别启动

如果需要分别启动前后端，可以按照以下步骤操作：

#### 后端启动

```bash
cd server
npm install
npm start
```

#### 前端启动

```bash
cd client
npm install
npm run dev
```

访问 http://localhost:3000 查看演示。

## 技术栈

- 前端: Vue3, Vite, ant-design-vue, axios, spark-md5, pinia
- 后端: Express, multer, fs-extra, cors 