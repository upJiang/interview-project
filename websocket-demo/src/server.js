const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// 创建Express应用
const app = express();
const port = 3000;

// 提供静态文件
app.use(express.static(path.join(__dirname, '../public')));

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// WebSocket连接处理
wss.on('connection', (ws) => {
  console.log('客户端已连接');
  
  // 发送欢迎消息
  ws.send(JSON.stringify({ type: 'welcome', message: '欢迎连接到WebSocket服务器!' }));
  
  // 设置定时消息（每3秒发送一次）
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const data = {
        type: 'update',
        time: new Date().toLocaleTimeString(),
        value: Math.round(Math.random() * 100)
      };
      ws.send(JSON.stringify(data));
    }
  }, 3000);
  
  // 接收消息
  ws.on('message', (message) => {
    console.log(`收到消息: ${message}`);
    try {
      const data = JSON.parse(message);
      // 回显消息
      ws.send(JSON.stringify({
        type: 'echo',
        message: data.message,
        received: new Date().toLocaleTimeString()
      }));
    } catch (e) {
      console.error('消息格式错误:', e);
    }
  });
  
  // 连接关闭时清除定时器
  ws.on('close', () => {
    console.log('客户端已断开连接');
    clearInterval(interval);
  });
});

// 启动服务器
server.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 