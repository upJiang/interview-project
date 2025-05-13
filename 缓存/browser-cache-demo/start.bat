@echo off
setlocal enabledelayedexpansion

echo ===== 浏览器缓存演示项目一键启动脚本 =====

REM 检查当前目录是否正确
if not exist "server" (
  echo 错误: 请在browser-cache-demo目录下运行此脚本
  exit /b 1
)
if not exist "client" (
  echo 错误: 请在browser-cache-demo目录下运行此脚本
  exit /b 1
)

REM 安装服务器依赖
echo.
echo [1/4] 正在安装服务器依赖...
cd server
call npm install
if %ERRORLEVEL% neq 0 (
  echo 服务器依赖安装失败，请检查错误并重试
  exit /b 1
)

REM 安装客户端依赖
echo.
echo [2/4] 正在安装客户端依赖...
cd ..\client
call npm install
if %ERRORLEVEL% neq 0 (
  echo 客户端依赖安装失败，请检查错误并重试
  exit /b 1
)

REM 启动服务器（后台运行）
echo.
echo [3/4] 正在启动服务器...
cd ..\server
start /B cmd /c "npm run dev"
REM 保存Windows中的任务标识符，用于后续关闭
for /f "tokens=2" %%a in ('tasklist /v ^| findstr "npm"') do (
  set SERVER_PID=%%a
  goto :found_pid
)
:found_pid
echo 服务器进程ID: %SERVER_PID%

REM 等待服务器启动
echo 等待服务器启动...
timeout /t 3 /nobreak > nul

REM 启动客户端（前台运行）
echo.
echo [4/4] 正在启动客户端...
cd ..\client
echo 客户端将在前台运行，关闭此窗口将自动关闭所有相关进程。
echo 客户端地址: http://localhost:5173
echo 服务器地址: http://localhost:3000

REM 注册清理函数
set CLEANUP_NEEDED=1

REM 启动客户端
call npm run dev

REM 如果客户端正常退出，清理服务器进程
if %CLEANUP_NEEDED%==1 (
  echo.
  echo 正在关闭服务器进程...
  taskkill /F /PID %SERVER_PID% 2>nul
  REM 确保所有npm进程都被关闭
  taskkill /F /IM "node.exe" /FI "WINDOWTITLE eq npm" 2>nul
)

exit /b 0 