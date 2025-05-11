const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

// 定义颜色
const colors = {
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

console.log(
  `${colors.blue}=== 大文件上传Demo一键启动脚本 ===${colors.reset}\n`
);

// 检查项目目录
const clientDir = path.join(__dirname, "client");
const serverDir = path.join(__dirname, "server");

if (!fs.existsSync(clientDir) || !fs.existsSync(serverDir)) {
  console.error(`${colors.red}错误: 找不到客户端或服务端目录!${colors.reset}`);
  process.exit(1);
}

// 检查是否已安装依赖
const checkNodeModules = (dir) => {
  return fs.existsSync(path.join(dir, "node_modules"));
};

// 安装依赖
const installDeps = (dir, name) => {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}正在为${name}安装依赖...${colors.reset}`);

    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const install = spawn(npm, ["install"], { cwd: dir });

    install.stdout.on("data", (data) => {
      console.log(
        `${colors.yellow}${name}: ${data.toString().trim()}${colors.reset}`
      );
    });

    install.stderr.on("data", (data) => {
      console.error(
        `${colors.yellow}${name}: ${data.toString().trim()}${colors.reset}`
      );
    });

    install.on("close", (code) => {
      if (code === 0) {
        console.log(`${colors.green}${name}依赖安装完成${colors.reset}`);
        resolve();
      } else {
        console.error(`${colors.red}${name}依赖安装失败${colors.reset}`);
        reject();
      }
    });
  });
};

// 杀掉占用指定端口的进程
const killProcessOnPort = (port) => {
  return new Promise((resolve) => {
    console.log(
      `${colors.yellow}检查端口 ${port} 是否被占用...${colors.reset}`
    );

    if (process.platform === "win32") {
      // Windows 系统
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          console.log(`${colors.green}端口 ${port} 未被占用${colors.reset}`);
          resolve();
          return;
        }

        // 解析进程ID
        const lines = stdout.trim().split("\n");
        let hasKilledProcess = false;

        for (const line of lines) {
          // 查找包含LISTENING状态的行
          if (line.includes("LISTENING")) {
            const match = line.match(/\s+(\d+)$/);
            if (match && match[1]) {
              const pid = match[1];
              console.log(
                `${colors.yellow}发现端口 ${port} 被进程 ${pid} 占用，尝试关闭...${colors.reset}`
              );

              hasKilledProcess = true;

              exec(`taskkill /F /PID ${pid}`, (killError) => {
                if (killError) {
                  console.error(
                    `${colors.red}无法关闭进程 ${pid}: ${killError.message}${colors.reset}`
                  );
                } else {
                  console.log(
                    `${colors.green}成功关闭占用端口 ${port} 的进程 ${pid}${colors.reset}`
                  );
                }

                // 给进程一些时间真正释放端口
                setTimeout(resolve, 1000);
              });
              return;
            }
          }
        }

        if (!hasKilledProcess) {
          // 如果没有找到LISTENING状态的进程，直接继续
          console.log(
            `${colors.green}未找到正在监听端口 ${port} 的进程${colors.reset}`
          );
          resolve();
        }
      });
    } else {
      // Unix/Linux/MacOS
      exec(`lsof -i :${port} -t`, (error, stdout) => {
        if (error || !stdout) {
          console.log(`${colors.green}端口 ${port} 未被占用${colors.reset}`);
          resolve();
          return;
        }

        const pids = stdout.trim().split("\n");
        if (pids.length > 0) {
          console.log(
            `${colors.yellow}发现端口 ${port} 被占用，尝试关闭...${colors.reset}`
          );

          exec(`kill -9 ${pids.join(" ")}`, (killError) => {
            if (killError) {
              console.error(
                `${colors.red}无法关闭占用端口 ${port} 的进程: ${killError.message}${colors.reset}`
              );
            } else {
              console.log(
                `${colors.green}成功关闭占用端口 ${port} 的进程${colors.reset}`
              );
            }

            // 给进程一些时间真正释放端口
            setTimeout(resolve, 1000);
          });
        } else {
          console.log(
            `${colors.green}未找到占用端口 ${port} 的进程${colors.reset}`
          );
          resolve();
        }
      });
    }
  });
};

// 验证端口是否可用
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = require("net").createServer();

    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`${colors.red}端口 ${port} 仍然被占用${colors.reset}`);
        resolve(false);
      } else {
        console.error(
          `${colors.red}检查端口时发生错误: ${err.message}${colors.reset}`
        );
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      console.log(`${colors.green}端口 ${port} 可用${colors.reset}`);
      resolve(true);
    });

    server.listen(port);
  });
};

// 检查服务是否就绪
const checkServiceReady = (port, maxAttempts = 30, interval = 500) => {
  return new Promise((resolve) => {
    let attempts = 0;

    const check = () => {
      attempts++;
      const request = http.get(`http://localhost:${port}`, () => {
        console.log(`${colors.green}服务在端口 ${port} 已就绪${colors.reset}`);
        resolve(true);
      });

      request.on("error", () => {
        if (attempts >= maxAttempts) {
          console.log(
            `${colors.yellow}服务在端口 ${port} 可能未就绪，但将继续${colors.reset}`
          );
          resolve(false);
          return;
        }

        setTimeout(check, interval);
      });

      request.end();
    };

    check();
  });
};

// 启动服务
const startService = (dir, name, command) => {
  console.log(`${colors.green}启动${name}...${colors.reset}`);

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const proc = spawn(npm, ["run", command], { cwd: dir });

  proc.stdout.on("data", (data) => {
    console.log(
      `${colors.blue}${name}: ${data.toString().trim()}${colors.reset}`
    );
  });

  proc.stderr.on("data", (data) => {
    console.error(
      `${colors.red}${name}: ${data.toString().trim()}${colors.reset}`
    );
  });

  proc.on("close", (code) => {
    if (code !== 0) {
      console.error(
        `${colors.red}${name}进程退出，代码: ${code}${colors.reset}`
      );
    }
  });

  return proc;
};

// 启动所有服务
const startAll = async () => {
  try {
    // 检查并安装依赖
    if (!checkNodeModules(clientDir)) {
      await installDeps(clientDir, "前端");
    }

    if (!checkNodeModules(serverDir)) {
      await installDeps(serverDir, "后端");
    }

    // 创建后端uploads和temp目录
    const uploadsDir = path.join(serverDir, "uploads");
    const tempDir = path.join(serverDir, "temp");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`${colors.green}创建uploads目录${colors.reset}`);
    }

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log(`${colors.green}创建temp目录${colors.reset}`);
    }

    // 杀掉占用端口的进程
    await killProcessOnPort(3001); // 后端端口
    await killProcessOnPort(3000); // 前端端口

    // 再次确认端口可用性
    const isPort3001Available = await isPortAvailable(3001);
    const isPort3000Available = await isPortAvailable(3000);

    if (!isPort3001Available) {
      console.error(
        `${colors.red}端口3001无法释放，无法启动后端服务${colors.reset}`
      );
      process.exit(1);
    }

    if (!isPort3000Available) {
      console.error(
        `${colors.red}端口3000无法释放，无法启动前端服务${colors.reset}`
      );
      process.exit(1);
    }

    // 启动后端
    startService(serverDir, "后端服务", "start");

    // 等待后端服务就绪
    console.log(`${colors.yellow}等待后端服务就绪...${colors.reset}`);
    await checkServiceReady(3001);

    // 启动前端
    console.log(`${colors.green}后端服务已就绪，启动前端...${colors.reset}`);
    startService(clientDir, "前端服务", "dev");

    // 显示访问信息
    setTimeout(() => {
      console.log(
        `\n${colors.green}====================================${colors.reset}`
      );
      console.log(`${colors.green}所有服务已启动:${colors.reset}`);
      console.log(
        `${colors.green}- 前端: http://localhost:3000${colors.reset}`
      );
      console.log(
        `${colors.green}- 后端: http://localhost:3001${colors.reset}`
      );
      console.log(
        `${colors.green}====================================${colors.reset}`
      );
      console.log(`\n${colors.yellow}按 Ctrl+C 停止所有服务${colors.reset}`);
    }, 2000);
  } catch (error) {
    console.error(`${colors.red}启动失败: ${error}${colors.reset}`);
    process.exit(1);
  }
};

// 处理进程退出
process.on("SIGINT", () => {
  console.log(`\n${colors.yellow}正在停止所有服务...${colors.reset}`);
  process.exit();
});

// 开始启动
startAll();
