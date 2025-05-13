const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

// 启用跨域支持
app.use(
  cors({
    origin: "http://localhost:5173", // Vue开发服务器的默认地址
    credentials: true,
  })
);

// 提供静态文件
app.use(
  "/static",
  express.static(path.join(__dirname, "public"), {
    // 默认不设置缓存
    etag: false,
    lastModified: false,
  })
);

// 全局变量存储模拟数据，用于测试
const resources = {
  "data1.json": {
    content: { id: 1, name: "Resource 1", time: Date.now() },
    etag: "",
    lastModified: new Date().toUTCString(),
  },
  "data2.json": {
    content: { id: 2, name: "Resource 2", time: Date.now() },
    etag: "",
    lastModified: new Date().toUTCString(),
  },
};

// 更新资源的ETag
function updateEtag(resource) {
  const content = JSON.stringify(resource.content);
  resource.etag = crypto.createHash("md5").update(content).digest("hex");
  return resource;
}

// 初始化ETag
Object.keys(resources).forEach((key) => {
  updateEtag(resources[key]);
});

// 创建公共目录
const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 创建示例图片
fs.copyFileSync(
  path.join(__dirname, "../sample-image.jpg"),
  path.join(publicDir, "image.jpg")
);

// 1. 无缓存
app.get("/api/no-cache", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ data: "No cache example", timestamp: Date.now() });
});

// 2. 强缓存 - 过期时间 (max-age)
app.get("/api/strong-cache/max-age", (req, res) => {
  // 设置10秒过期
  res.set("Cache-Control", "max-age=10");
  res.json({
    data: "Strong cache with max-age example",
    timestamp: Date.now(),
  });
});

// 3. 强缓存 - 过期时间 (expires)
app.get("/api/strong-cache/expires", (req, res) => {
  // 设置10秒后过期
  const expiresDate = new Date(Date.now() + 10000);
  res.set("Expires", expiresDate.toUTCString());
  res.json({
    data: "Strong cache with expires example",
    timestamp: Date.now(),
  });
});

// 4. 强缓存 - 长时间缓存
app.get("/api/strong-cache/long", (req, res) => {
  // 设置1年的缓存时间
  res.set("Cache-Control", "max-age=31536000, immutable");
  res.json({ data: "Long-term strong cache example", timestamp: Date.now() });
});

// 5. 协商缓存 - Last-Modified
app.get("/api/negotiated-cache/last-modified/:id", (req, res) => {
  const resourceKey = `data${req.params.id}.json`;
  const resource = resources[resourceKey];

  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  const ifModifiedSince = req.get("If-Modified-Since");

  if (
    ifModifiedSince &&
    new Date(ifModifiedSince) >= new Date(resource.lastModified)
  ) {
    // 资源未修改，返回304
    return res.status(304).end();
  }

  // 设置Last-Modified头
  res.set("Cache-Control", "no-cache");
  res.set("Last-Modified", resource.lastModified);
  res.json(resource.content);
});

// 6. 协商缓存 - ETag
app.get("/api/negotiated-cache/etag/:id", (req, res) => {
  const resourceKey = `data${req.params.id}.json`;
  const resource = resources[resourceKey];

  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  const ifNoneMatch = req.get("If-None-Match");

  if (ifNoneMatch && ifNoneMatch === resource.etag) {
    // ETag匹配，返回304
    return res.status(304).end();
  }

  // 设置ETag头
  res.set("Cache-Control", "no-cache");
  res.set("ETag", resource.etag);
  res.json(resource.content);
});

// 7. 更新资源API（用于测试协商缓存）
app.get("/api/update-resource/:id", (req, res) => {
  const resourceKey = `data${req.params.id}.json`;
  const resource = resources[resourceKey];

  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  // 更新内容
  resource.content.time = Date.now();
  resource.lastModified = new Date().toUTCString();
  updateEtag(resource);

  res.json({ message: "Resource updated", resource: resourceKey });
});

// 8. 混合策略 - 短时间强缓存，然后协商缓存
app.get("/api/mixed-cache", (req, res) => {
  // 5秒内使用强缓存，过期后使用协商缓存
  res.set("Cache-Control", "max-age=5, must-revalidate");
  res.set("ETag", `"${Date.now().toString(36)}"`);
  res.json({ data: "Mixed caching strategy example", timestamp: Date.now() });
});

// 9. 不同的Cache-Control指令组合
app.get("/api/cache-control/:type", (req, res) => {
  const type = req.params.type;
  let cacheControl = "";

  switch (type) {
    case "public":
      cacheControl = "public, max-age=60";
      break;
    case "private":
      cacheControl = "private, max-age=60";
      break;
    case "no-cache":
      cacheControl = "no-cache";
      break;
    case "no-store":
      cacheControl = "no-store";
      break;
    case "must-revalidate":
      cacheControl = "max-age=10, must-revalidate";
      break;
    case "immutable":
      cacheControl = "max-age=31536000, immutable";
      break;
    case "stale-while-revalidate":
      cacheControl = "max-age=10, stale-while-revalidate=60";
      break;
    default:
      cacheControl = "no-store";
  }

  res.set("Cache-Control", cacheControl);
  res.json({
    data: `Cache-Control example: ${type}`,
    cacheControl,
    timestamp: Date.now(),
  });
});

// 10. 为图像资源设置不同的缓存策略
app.get("/api/image/:cache", (req, res) => {
  const type = req.params.cache;
  const imagePath = path.join(__dirname, "public", "image.jpg");

  switch (type) {
    case "strong":
      res.set("Cache-Control", "max-age=60");
      break;
    case "etag":
      res.set("Cache-Control", "no-cache");
      // Express会自动添加ETag
      break;
    case "last-modified":
      res.set("Cache-Control", "no-cache");
      const stats = fs.statSync(imagePath);
      res.set("Last-Modified", stats.mtime.toUTCString());
      break;
    case "none":
    default:
      res.set("Cache-Control", "no-store");
  }

  res.sendFile(imagePath);
});

// 11. 查看资源当前状态的API
app.get("/api/resource-status/:id", (req, res) => {
  const resourceKey = `data${req.params.id}.json`;
  const resource = resources[resourceKey];

  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  res.json({
    resourceId: req.params.id,
    lastModified: resource.lastModified,
    etag: resource.etag,
    current: resource.content,
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
