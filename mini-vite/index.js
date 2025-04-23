import path from 'path';
import { fileURLToPath } from 'url';
import Koa from 'koa';
import koaStatic from 'koa-static';
import { parse } from 'es-module-lexer';
import MagicString from 'magic-string';
import fs from 'fs/promises';
import { WebSocketServer } from 'ws';
import http from 'http';
import chokidar from 'chokidar';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd(); // 项目根目录

// 启动服务器
const app = new Koa();
const server = http.createServer(app.callback());

// 创建WebSocket服务器
const wss = new WebSocketServer({ server });

// 客户端连接池
const clients = new Set();

// WebSocket连接处理
wss.on('connection', (ws) => {
  clients.add(ws);
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// 向所有客户端广播更新消息
function sendUpdate(path) {
  const message = JSON.stringify({
    type: 'update',
    path
  });
  
  clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// 文件监听器
const watcher = chokidar.watch([
  path.join(root, 'src/**/*')
], {
  ignored: ['**/node_modules/**', '**/.git/**'],
  ignoreInitial: true
});

// 监听文件变化
watcher.on('change', (changedPath) => {
  console.log(`File changed: ${changedPath}`);
  const relativePath = path.relative(root, changedPath);
  sendUpdate(relativePath);
});

// 静态文件目录（用于处理无需转换的文件）
app.use(koaStatic(root));

// 处理ES模块导入
app.use(async (ctx) => {
  const { path: urlPath, query } = ctx.request;
  
  // 检查是否为特殊客户端文件
  if (urlPath === '/@vite/client') {
    const clientPath = path.join(__dirname, 'client/client.js');
    ctx.type = 'application/javascript';
    ctx.body = await fs.readFile(clientPath, 'utf-8');
    return;
  }
  
  // 解析文件路径
  let filePath = path.join(root, urlPath);
  // 处理请求的是目录的情况
  if (!urlPath.includes('.')) {
    filePath = path.join(filePath, 'index.html');
  }
  
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    ctx.type = path.extname(filePath) === '.html' ? 'text/html' : 'application/javascript';
    
    // 处理HTML
    if (path.extname(filePath) === '.html') {
      // 在HTML中注入客户端脚本
      content = content.replace(
        '</head>',
        `<script type="module" src="/@vite/client"></script></head>`
      );
      ctx.body = content;
      return;
    }
    
    // 处理JS
    if (path.extname(filePath) === '.js') {
      // 解析并重写导入
      const [imports] = await parse(content);
      const ms = new MagicString(content);
      
      // 重写导入路径
      for (const { s: start, e: end, n: specifier } of imports) {
        if (specifier && (specifier.startsWith('./') || specifier.startsWith('../'))) {
          // 确保导入路径有.js扩展名
          if (!specifier.endsWith('.js')) {
            const newSpecifier = specifier + '.js';
            ms.overwrite(start, end, newSpecifier);
          }
        } else if (specifier && !specifier.startsWith('/') && !specifier.startsWith('http')) {
          // 处理第三方模块
          const newSpecifier = `/node_modules/${specifier}`;
          ms.overwrite(start, end, newSpecifier);
        }
      }
      
      // 注入HMR接口
      ms.append(`\nimport { createHotContext } from "/@vite/client";\nconst hot = createHotContext("${urlPath}");`);
      
      ctx.body = ms.toString();
      return;
    }
    
    // 其他文件类型直接返回
    ctx.body = content;
  } catch (e) {
    console.error(e);
    ctx.status = 404;
    ctx.body = `File not found: ${urlPath}`;
  }
});

// 监听端口
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Mini-Vite dev server running at: http://localhost:${PORT}`);
}); 