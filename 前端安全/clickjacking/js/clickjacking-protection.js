/**
 * 点击劫持防御演示脚本
 */

document.addEventListener("DOMContentLoaded", () => {
  // 获取DOM元素
  const testFrameOptionsBtn = document.getElementById("testFrameOptions");
  const frameOptionsResult = document.getElementById("frameOptionsResult");

  const demoFrameBustingBtn = document.getElementById("demoFrameBusting");
  const frameBustingResult = document.getElementById("frameBustingResult");

  const testCSPBtn = document.getElementById("testCSP");
  const cspResult = document.getElementById("cspResult");

  // 为按钮添加事件监听器
  testFrameOptionsBtn.addEventListener("click", testFrameOptions);
  demoFrameBustingBtn.addEventListener("click", demoFrameBusting);
  testCSPBtn.addEventListener("click", testCSP);

  // 执行简单的Frame Busting检测
  detectFraming();

  /**
   * 测试X-Frame-Options
   */
  function testFrameOptions() {
    frameOptionsResult.textContent = "正在创建iframe测试...";

    // 创建一个测试iframe
    const testFrame = document.createElement("iframe");
    testFrame.style.display = "none";
    testFrame.src = window.location.href; // 尝试加载当前页面

    // 设置加载超时
    const timeout = setTimeout(() => {
      frameOptionsResult.textContent = "测试未能完成，请检查浏览器控制台";
      if (testFrame.parentNode) {
        document.body.removeChild(testFrame);
      }
    }, 3000);

    // 监听iframe加载完成事件
    testFrame.onload = () => {
      clearTimeout(timeout);

      try {
        // 尝试访问iframe内容（如果成功，则X-Frame-Options未生效）
        const frameContent = testFrame.contentWindow.document;
        frameOptionsResult.textContent =
          "警告：X-Frame-Options似乎未生效，页面可以被嵌入iframe！";
        frameOptionsResult.style.backgroundColor = "#fadbd8";
        frameOptionsResult.style.color = "#c0392b";
      } catch (e) {
        // 无法访问iframe内容（X-Frame-Options生效）
        frameOptionsResult.textContent =
          "成功：X-Frame-Options正常工作，页面无法被嵌入iframe！";
        frameOptionsResult.style.backgroundColor = "#d5f5e3";
        frameOptionsResult.style.color = "#2c7a30";
      }

      // 移除测试iframe
      document.body.removeChild(testFrame);
    };

    // 监听iframe加载错误事件
    testFrame.onerror = () => {
      clearTimeout(timeout);
      frameOptionsResult.textContent =
        "成功：X-Frame-Options正常工作，iframe加载被阻止！";
      frameOptionsResult.style.backgroundColor = "#d5f5e3";
      frameOptionsResult.style.color = "#2c7a30";

      // 移除测试iframe
      if (testFrame.parentNode) {
        document.body.removeChild(testFrame);
      }
    };

    // 添加iframe到文档
    document.body.appendChild(testFrame);
  }

  /**
   * 演示Frame Busting效果
   */
  function demoFrameBusting() {
    frameBustingResult.innerHTML = "";

    // 创建一个显示frame busting代码的区域
    const codeDisplay = document.createElement("div");
    codeDisplay.innerHTML = `
            <p>以下是实现的Frame Busting代码：</p>
            <pre style="background:#f1f1f1;padding:10px;overflow-x:auto;">
// 基本的Frame Busting
if (window.self !== window.top) {
    window.top.location = window.self.location;
}

// 或使用更安全的方法
(function() {
    try {
        if (window.self !== window.top) {
            window.top.location.href = window.self.location.href;
        }
    } catch (e) {
        document.body.innerHTML = '警告：此页面可能被嵌入在iframe中！';
    }
    
    // 定期检查
    setInterval(function() {
        try {
            if (window.self !== window.top) {
                window.top.location.href = window.self.location.href;
            }
        } catch (e) {
            // 处理错误
        }
    }, 1000);
})();
            </pre>
        `;
    frameBustingResult.appendChild(codeDisplay);

    // 创建一个演示区域
    const demoArea = document.createElement("div");
    demoArea.innerHTML = `
            <p>点击下面的按钮创建一个尝试嵌入当前页面的iframe（演示用）：</p>
            <button id="createDemoFrame">创建测试iframe</button>
            <div id="demoFrameContainer" style="margin-top:10px;"></div>
        `;
    frameBustingResult.appendChild(demoArea);

    // 为演示按钮添加事件
    document.getElementById("createDemoFrame").addEventListener("click", () => {
      const container = document.getElementById("demoFrameContainer");
      container.innerHTML = `
                <p>注意：如果Frame Busting有效，下面的iframe将无法显示当前页面内容</p>
                <iframe src="${window.location.href}" style="width:100%;height:200px;border:1px solid #ddd;"></iframe>
                <p style="margin-top:5px;color:#c0392b;">（由于安全限制，此演示可能无法在某些浏览器中正常工作）</p>
            `;
    });
  }

  /**
   * 测试CSP frame-ancestors
   */
  function testCSP() {
    cspResult.textContent = "正在检查CSP设置...";

    // 检查CSP设置
    const cspMeta = document.querySelector(
      'meta[http-equiv="Content-Security-Policy"]'
    );
    let cspHeaderSupported = false;

    if (cspMeta) {
      const cspContent = cspMeta.getAttribute("content");
      if (cspContent && cspContent.includes("frame-ancestors")) {
        cspResult.innerHTML = `
                    <p style="color:#2c7a30;"><strong>成功：</strong>检测到CSP frame-ancestors指令！</p>
                    <p>当前设置：<code>${cspContent}</code></p>
                    <p>此设置将防止页面被嵌入到iframe中。</p>
                `;
        cspResult.style.backgroundColor = "#d5f5e3";
      } else {
        cspResult.innerHTML = `
                    <p style="color:#f39c12;"><strong>警告：</strong>检测到CSP配置，但未设置frame-ancestors指令！</p>
                    <p>当前设置：<code>${cspContent || "空"}</code></p>
                    <p>建议添加 <code>frame-ancestors 'none';</code> 或 <code>frame-ancestors 'self';</code></p>
                `;
        cspResult.style.backgroundColor = "#fef9e7";
      }
    } else {
      // 检查HTTP响应头中的CSP
      cspResult.innerHTML = `
                <p style="color:#e74c3c;"><strong>注意：</strong>未检测到CSP meta标签。</p>
                <p>建议添加以下meta标签或者通过HTTP响应头设置：</p>
                <pre style="background:#f1f1f1;padding:10px;overflow-x:auto;">&lt;meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none';"&gt;</pre>
                <p>或在服务器设置HTTP响应头：</p>
                <pre style="background:#f1f1f1;padding:10px;overflow-x:auto;">Content-Security-Policy: frame-ancestors 'none';</pre>
            `;
      cspResult.style.backgroundColor = "#fadbd8";
    }
  }

  /**
   * 检测当前页面是否在iframe中
   */
  function detectFraming() {
    try {
      if (window.self !== window.top) {
        console.warn("检测到页面被嵌入iframe！");

        // 在页面顶部显示警告
        const warningDiv = document.createElement("div");
        warningDiv.style.cssText =
          "position:fixed;top:0;left:0;width:100%;background-color:#e74c3c;color:white;padding:10px;text-align:center;z-index:9999;";
        warningDiv.innerHTML = `
                    <strong>安全警告：</strong> 此页面被嵌入在iframe中！
                    <a href="${window.location.href}" target="_top" style="color:white;text-decoration:underline;margin-left:10px;">点击这里在顶层窗口打开</a>
                `;
        document.body.appendChild(warningDiv);

        // 尝试跳出iframe
        try {
          window.top.location.href = window.self.location.href;
        } catch (e) {
          console.error("无法跳出iframe:", e);
        }
      }
    } catch (e) {
      console.error("检测framing时出错:", e);
    }
  }

  /**
   * 综合的Frame Busting代码
   * 注意：此函数展示了完整的代码，但在本页面中未实际调用，以避免干扰演示
   */
  function frameBreaker() {
    // 保存当前URL
    const currentURL = window.location.href;

    // 尝试突破frame
    try {
      if (window.self !== window.top) {
        // 如果在iframe中，尝试跳出
        window.top.location.href = currentURL;
      }
    } catch (e) {
      // 如果无法访问top（可能由于跨域限制），显示警告
      document.body.innerHTML = `
                <div style="background:red;color:white;padding:20px;font-size:20px;">
                    警告：此页面可能被恶意嵌入，请直接访问 
                    <a href="${currentURL}" style="color:white;text-decoration:underline;">${currentURL}</a>
                </div>
            `;
    }

    // 定期检查是否在iframe中（以防被动态嵌入）
    setInterval(function () {
      try {
        if (window.self !== window.top) {
          window.top.location.href = currentURL;
        }
      } catch (e) {
        // 处理错误
      }
    }, 1000);
  }
});
 