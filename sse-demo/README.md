# SSE (Server-Sent Events) 演示项目

这是一个简单的SSE演示项目，展示了服务器发送事件（Server-Sent Events）的基本使用方法。

## 功能特点

- 服务器到客户端的单向实时通信
- 不同类型的事件推送
- 定期自动推送数据
- 客户端通过HTTP请求发送消息
- 简单的实时图表

## 如何运行

1. 安装依赖
   ```
   npm install
   ```

2. 启动服务器
   ```
   npm start
   ```

3. 在浏览器中访问: http://localhost:3001

## 技术栈

- 服务端: Node.js, Express
- 客户端: HTML, CSS, JavaScript (原生)
- 实时通信: EventSource API 