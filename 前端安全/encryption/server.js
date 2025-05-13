const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

// MIME类型映射表
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  console.log(`请求: ${req.method} ${req.url}`);

  // 默认提供index.html
  let filePath = "." + req.url;
  if (filePath === "./") {
    filePath = "./js/index.html";
  } else if (!filePath.startsWith("./js/")) {
    filePath = "./js" + req.url;
  }

  // 获取文件扩展名
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || "application/octet-stream";

  // 读取文件
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        // 文件不存在
        console.error(`文件不存在: ${filePath}`);
        res.writeHead(404);
        res.end("404 - 找不到文件");
      } else {
        // 服务器错误
        console.error(`服务器错误: ${error.code}`);
        res.writeHead(500);
        res.end(`服务器错误: ${error.code}`);
      }
    } else {
      // 成功响应
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}/`);
  console.log(`打开浏览器访问 http://localhost:${PORT}/ 查看加密演示页面`);
});
 