const express = require('express');
const path = require('path');
const cors = require('cors');

// 创建Express应用
const app = express();
const port = 3001;

// 启用CORS
app.use(cors());

// 提供静态文件
app.use(express.static(path.join(__dirname, '../public')));

// 存储所有连接的客户端
const clients = [];

// SSE路由
app.get('/events', (req, res) => {
  // 设置SSE所需的响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 将客户端添加到连接列表
  clients.push(res);
  console.log('客户端已连接，当前连接数:', clients.length);
  
  // 发送欢迎消息
  res.write(`event: welcome\n`);
  res.write(`data: {"message": "欢迎连接到SSE服务器!"}\n\n`);
  
  // 当客户端断开连接时，从连接列表中移除
  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
      console.log('客户端已断开连接，当前连接数:', clients.length);
    }
  });
});

// 消息发送路由
app.get('/send-message', (req, res) => {
  const message = req.query.message || '没有消息内容';
  
  // 向所有连接的客户端广播消息
  clients.forEach(client => {
    client.write(`event: message\n`);
    client.write(`data: {"message": "${message}", "time": "${new Date().toLocaleTimeString()}"}\n\n`);
  });
  
  res.json({ success: true, clientCount: clients.length });
});

// 启动定时数据更新
setInterval(() => {
  const data = {
    time: new Date().toLocaleTimeString(),
    value: Math.round(Math.random() * 100)
  };
  
  // 向所有客户端发送更新
  clients.forEach(client => {
    client.write(`event: update\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
  
  console.log('发送更新数据，当前连接数:', clients.length);
}, 3000);

// 启动服务器
app.listen(port, () => {
  console.log(`SSE服务器运行在 http://localhost:${port}`);
}); 