# PowerShell启动脚本

# 设置彩色输出函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Green($text) {
    Write-ColorOutput Green $text
}

function Write-Blue($text) {
    Write-ColorOutput Blue $text
}

function Write-Yellow($text) {
    Write-ColorOutput Yellow $text
}

# 显示标题
Write-Blue "===== 浏览器缓存演示项目一键启动脚本 ====="

# 检查当前目录是否正确
if (-not (Test-Path "server") -or -not (Test-Path "client")) {
    Write-Yellow "错误: 请在browser-cache-demo目录下运行此脚本"
    exit 1
}

# 安装服务器依赖
Write-Host ""
Write-Green "[1/4] 正在安装服务器依赖..."
Set-Location -Path "server"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Yellow "服务器依赖安装失败，请检查错误并重试"
    exit 1
}

# 安装客户端依赖
Write-Host ""
Write-Green "[2/4] 正在安装客户端依赖..."
Set-Location -Path "..\client"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Yellow "客户端依赖安装失败，请检查错误并重试"
    exit 1
}

# 启动服务器（后台运行）
Write-Host ""
Write-Green "[3/4] 正在启动服务器..."
Set-Location -Path "..\server"
$serverJob = Start-Job -ScriptBlock {
    Set-Location -Path $args[0]
    npm run dev
} -ArgumentList $PWD.Path

Write-Host "服务器已在后台启动，作业ID: $($serverJob.Id)"

# 等待服务器启动
Write-Host "等待服务器启动..."
Start-Sleep -Seconds 3

# 启动客户端（前台运行）
Write-Host ""
Write-Green "[4/4] 正在启动客户端..."
Set-Location -Path "..\client"
Write-Blue "客户端将在前台运行，按Ctrl+C退出。退出后服务器进程也会自动关闭。"
Write-Blue "客户端地址: http://localhost:5173"
Write-Blue "服务器地址: http://localhost:3000"

# 注册退出时的清理操作
$exitScript = {
    param($serverJobId)
    Write-Host ""
    Write-Yellow "正在关闭服务器进程..."
    Stop-Job -Id $serverJobId
    Remove-Job -Id $serverJobId -Force
}

# 创建退出事件处理
try {
    # 启动客户端
    npm run dev
}
finally {
    # 如果客户端正常退出或异常退出，清理服务器进程
    & $exitScript $serverJob.Id
}

Write-Host "所有进程已关闭。" 