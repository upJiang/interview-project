#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== 浏览器缓存演示项目一键启动脚本 =====${NC}"

# 检查当前目录是否正确
if [ ! -d "server" ] || [ ! -d "client" ]; then
  echo -e "${YELLOW}错误: 请在browser-cache-demo目录下运行此脚本${NC}"
  exit 1
fi

# 安装服务器依赖
echo -e "\n${GREEN}[1/4] 正在安装服务器依赖...${NC}"
cd server
npm install
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}服务器依赖安装失败，请检查错误并重试${NC}"
  exit 1
fi

# 安装客户端依赖
echo -e "\n${GREEN}[2/4] 正在安装客户端依赖...${NC}"
cd ../client
npm install
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}客户端依赖安装失败，请检查错误并重试${NC}"
  exit 1
fi

# 启动服务器（后台运行）
echo -e "\n${GREEN}[3/4] 正在启动服务器...${NC}"
cd ../server
npm run dev &
SERVER_PID=$!
echo "服务器进程ID: $SERVER_PID"

# 等待服务器启动
echo "等待服务器启动..."
sleep 3

# 启动客户端（前台运行）
echo -e "\n${GREEN}[4/4] 正在启动客户端...${NC}"
cd ../client
echo -e "${BLUE}客户端将在前台运行，按Ctrl+C退出。退出后服务器进程也会自动关闭。${NC}"
echo -e "${BLUE}客户端地址: http://localhost:5173${NC}"
echo -e "${BLUE}服务器地址: http://localhost:3000${NC}"

# 使用trap捕获中断信号，确保退出时关闭服务器进程
trap "echo -e '\n${YELLOW}正在关闭所有进程...${NC}'; kill $SERVER_PID; exit" INT TERM

npm run dev

# 清理服务器进程（如果客户端正常退出）
echo -e "\n${YELLOW}正在关闭服务器进程...${NC}"
kill $SERVER_PID
