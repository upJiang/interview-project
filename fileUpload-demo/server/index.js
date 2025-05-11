const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = 3001;

// 中间件配置
app.use(cors());
app.use(express.json());

// 创建上传文件夹
const UPLOAD_DIR = path.resolve(__dirname, "uploads");
const TEMP_DIR = path.resolve(__dirname, "temp");

// 确保上传目录存在
fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(TEMP_DIR);

// 添加详细的调试日志中间件
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  if (Object.keys(req.body).length > 0) {
    console.log(`[${now}] 请求体:`, JSON.stringify(req.body, null, 2));
  }

  // 记录响应
  const originalSend = res.send;
  res.send = function (data) {
    console.log(`[${now}] 响应状态: ${res.statusCode}`);
    return originalSend.apply(this, arguments);
  };

  next();
});

// 添加健康检查端点
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "服务正常运行" });
});

// 配置Multer用于处理文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      // 请求体可能还未解析，从请求头中获取hash
      const hash = req.body.hash || req.headers["x-file-hash"] || "temp";
      const chunkDir = path.resolve(TEMP_DIR, hash);

      fs.ensureDirSync(chunkDir);
      cb(null, chunkDir);
    } catch (error) {
      console.error("创建目标目录失败:", error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      // 从请求头中获取信息，避免表单数据解析问题
      const chunkIndex =
        req.body.chunkIndex || req.headers["x-chunk-index"] || Date.now();
      cb(null, `${chunkIndex}`);
    } catch (error) {
      console.error("设置文件名失败:", error);
      cb(error);
    }
  },
});

const limits = {
  fileSize: 10 * 1024 * 1024, // 限制单个分片最大10MB
};

const upload = multer({
  storage,
  limits,
  fileFilter: function (req, file, cb) {
    // 打印上传的文件信息
    console.log("上传文件:", file);
    cb(null, true);
  },
});

// 检查文件是否已存在，或者获取已上传的块
app.post("/check", async (req, res) => {
  console.log("检查文件:", req.body);
  const { hash, filename } = req.body;

  if (!hash || !filename) {
    return res.status(400).json({
      error: "缺少必要参数: hash 和 filename",
    });
  }

  const filePath = path.resolve(UPLOAD_DIR, `${hash}-${filename}`);

  try {
    // 检查文件是否已经存在
    const isExists = await fs.pathExists(filePath);
    if (isExists) {
      // 文件已存在，可以直接使用
      console.log(`文件已存在: ${hash}-${filename}`);
      return res.json({
        uploaded: true,
        url: `/uploads/${hash}-${filename}`,
      });
    }

    // 检查临时目录中是否有部分上传的块
    const chunkDir = path.resolve(TEMP_DIR, hash);
    const isChunkDirExists = await fs.pathExists(chunkDir);

    if (!isChunkDirExists) {
      // 没有任何上传的块
      console.log(`无已上传块: ${hash}-${filename}`);
      return res.json({
        uploaded: false,
        uploaded_chunks: [],
      });
    }

    // 获取已上传的块的列表
    const uploadedChunks = await fs.readdir(chunkDir);
    const uploadedChunksIndices = uploadedChunks.map(Number);
    console.log(`已上传块: ${hash}-${filename}`, uploadedChunksIndices);

    return res.json({
      uploaded: false,
      uploaded_chunks: uploadedChunksIndices,
    });
  } catch (error) {
    console.error("Check file error:", error);
    return res.status(500).json({
      error: "Failed to check file status: " + error.message,
    });
  }
});

// 文件分片上传端点
app.post("/upload", (req, res) => {
  console.log("接收上传请求", req.headers);

  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("上传处理错误:", err);
      return res.status(500).json({ error: "上传失败: " + err.message });
    }

    if (!req.file) {
      console.error("没有文件被上传");
      return res.status(400).json({ error: "没有文件被上传" });
    }

    console.log("分片上传成功:", req.body.chunkIndex);
    res.json({
      success: true,
      chunkIndex: req.body.chunkIndex,
    });
  });
});

// 合并文件分片
app.post("/merge", async (req, res) => {
  console.log("合并请求:", req.body);
  const { hash, filename, totalChunks } = req.body;

  if (!hash || !filename || !totalChunks) {
    return res.status(400).json({
      error: "缺少必要参数: hash, filename 和 totalChunks",
    });
  }

  const chunkDir = path.resolve(TEMP_DIR, hash);
  const filePath = path.resolve(UPLOAD_DIR, `${hash}-${filename}`);

  try {
    // 确保所有分片都存在
    const chunksExists = await checkChunksExists(chunkDir, totalChunks);

    if (!chunksExists) {
      console.error(`分片不完整: ${hash}-${filename}`);
      return res.status(400).json({
        error: "Some chunks are missing",
      });
    }

    // 合并分片
    await mergeChunks(chunkDir, filePath, totalChunks);
    console.log(`合并完成: ${hash}-${filename}`);

    res.json({
      success: true,
      url: `/uploads/${hash}-${filename}`,
    });
  } catch (error) {
    console.error("Merge chunks error:", error);
    res.status(500).json({
      error: "Failed to merge chunks: " + error.message,
    });
  }
});

// 检查所有分片是否存在
async function checkChunksExists(chunkDir, totalChunks) {
  try {
    const chunks = await fs.readdir(chunkDir);
    return chunks.length === parseInt(totalChunks);
  } catch (error) {
    console.error("Check chunks exists error:", error);
    return false;
  }
}

// 合并分片
async function mergeChunks(chunkDir, filePath, totalChunks) {
  const chunkPaths = [];

  // 按顺序收集所有分片路径
  for (let i = 0; i < totalChunks; i++) {
    chunkPaths.push(path.resolve(chunkDir, i.toString()));
  }

  // 创建写入流
  const writeStream = fs.createWriteStream(filePath);

  // 逐个合并分片
  for (let chunkPath of chunkPaths) {
    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(chunkPath);
      readStream.pipe(writeStream, { end: false });
      readStream.on("end", resolve);
      readStream.on("error", reject);
    });
  }

  // 关闭写入流
  writeStream.end();

  // 等待写入完成
  await new Promise((resolve) => {
    writeStream.on("finish", resolve);
  });

  // 删除临时分片目录
  await fs.remove(chunkDir);
}

// 处理错误
app.use((err, req, res, next) => {
  console.error("服务器错误:", err);
  res.status(500).json({ error: "服务器内部错误: " + err.message });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
