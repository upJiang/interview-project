// mini-vite/client/client.js
// 简单的HMR客户端实现

console.log('[mini-vite] 客户端已连接');

// 创建WebSocket连接
const socket = new WebSocket(`ws://${location.host}`);

// 收到更新消息时重新加载页面
socket.addEventListener('message', ({ data }) => {
  const { type, path } = JSON.parse(data);
  
  if (type === 'update') {
    console.log(`[mini-vite] 文件 ${path} 已更新，刷新页面`);
    location.reload();
  }
});

// 连接断开时重连
socket.addEventListener('close', () => {
  console.log('[mini-vite] 服务器连接已断开，尝试重连...');
  setTimeout(() => {
    location.reload();
  }, 1000);
});

// 导出一个简单的HMR API
export const createHotContext = (ownerPath) => {
  return {
    accept(callback) {
      console.log(`[mini-vite] ${ownerPath} 已接收热更新`);
    }
  };
}; 