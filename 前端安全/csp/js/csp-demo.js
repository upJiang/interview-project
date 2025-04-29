/**
 * CSP内容安全策略演示脚本
 */

document.addEventListener("DOMContentLoaded", () => {
  // 获取DOM元素
  const testInlineScriptBtn = document.getElementById("testInlineScript");
  const inlineScriptResult = document.getElementById("inlineScriptResult");

  const testInlineStyleBtn = document.getElementById("testInlineStyle");
  const inlineStyleResult = document.getElementById("inlineStyleResult");

  const testAllowedExternalScriptBtn = document.getElementById(
    "testAllowedExternalScript"
  );
  const allowedExternalScriptResult = document.getElementById(
    "allowedExternalScriptResult"
  );

  const testDisallowedExternalScriptBtn = document.getElementById(
    "testDisallowedExternalScript"
  );
  const disallowedExternalScriptResult = document.getElementById(
    "disallowedExternalScriptResult"
  );

  // 样式化结果区域
  const resultElements = document.querySelectorAll(".result");
  resultElements.forEach((el) => {
    el.style.padding = "10px";
    el.style.marginTop = "10px";
    el.style.border = "1px solid #ddd";
    el.style.borderRadius = "4px";
  });

  // 添加测试事件监听器
  testInlineScriptBtn.addEventListener("click", testInlineScript);
  testInlineStyleBtn.addEventListener("click", testInlineStyle);
  testAllowedExternalScriptBtn.addEventListener(
    "click",
    testAllowedExternalScript
  );
  testDisallowedExternalScriptBtn.addEventListener(
    "click",
    testDisallowedExternalScript
  );

  /**
   * 测试内联脚本执行
   */
  function testInlineScript() {
    try {
      // 尝试创建并执行内联脚本
      const scriptElement = document.createElement("script");
      scriptElement.textContent =
        'document.getElementById("inlineScriptResult").textContent = "内联脚本执行成功！";';
      document.head.appendChild(scriptElement);

      // 检查内联脚本是否执行（通常CSP会阻止）
      setTimeout(() => {
        if (inlineScriptResult.textContent === "") {
          inlineScriptResult.textContent = "内联脚本被CSP阻止，测试成功！";
          inlineScriptResult.style.backgroundColor = "#d5f5e3";
          inlineScriptResult.style.color = "#2c7a30";
        }
      }, 100);
    } catch (error) {
      inlineScriptResult.textContent = `错误: ${error.message}`;
      inlineScriptResult.style.backgroundColor = "#fadbd8";
      inlineScriptResult.style.color = "#c0392b";
    }
  }

  /**
   * 测试内联样式
   */
  function testInlineStyle() {
    try {
      // 创建带内联样式的元素
      const testDiv = document.createElement("div");
      testDiv.setAttribute(
        "style",
        "color: red; font-weight: bold; background-color: yellow;"
      );
      testDiv.textContent = "这个文本应该显示为红色粗体，背景为黄色";

      // 添加到结果区域
      inlineStyleResult.innerHTML = "";
      inlineStyleResult.appendChild(testDiv);

      // 检查样式是否被应用
      setTimeout(() => {
        const computedStyle = window.getComputedStyle(testDiv);
        if (
          computedStyle.color !== "rgb(255, 0, 0)" &&
          computedStyle.backgroundColor !== "rgb(255, 255, 0)"
        ) {
          inlineStyleResult.innerHTML =
            '内联样式被CSP阻止，测试成功！<div id="styleTestResult"></div>';
          inlineStyleResult.style.backgroundColor = "#d5f5e3";
          inlineStyleResult.style.color = "#2c7a30";
        } else {
          inlineStyleResult.innerHTML = "内联样式被应用，CSP未阻止！";
          inlineStyleResult.style.backgroundColor = "#fadbd8";
          inlineStyleResult.style.color = "#c0392b";
        }
      }, 100);
    } catch (error) {
      inlineStyleResult.textContent = `错误: ${error.message}`;
      inlineStyleResult.style.backgroundColor = "#fadbd8";
      inlineStyleResult.style.color = "#c0392b";
    }
  }

  /**
   * 测试允许的外部脚本
   */
  function testAllowedExternalScript() {
    try {
      // 从同域（允许的源）加载脚本
      allowedExternalScriptResult.textContent = "正在加载同域脚本...";
      allowedExternalScriptResult.style.backgroundColor = "#ebf5fb";

      // 创建脚本元素
      const script = document.createElement("script");
      script.src = "js/allowed-script.js"; // 同域脚本
      script.onload = () => {
        allowedExternalScriptResult.textContent = "同域脚本加载成功并执行！";
        allowedExternalScriptResult.style.backgroundColor = "#d5f5e3";
        allowedExternalScriptResult.style.color = "#2c7a30";
      };
      script.onerror = (error) => {
        allowedExternalScriptResult.textContent = `脚本加载失败: ${error}`;
        allowedExternalScriptResult.style.backgroundColor = "#fadbd8";
        allowedExternalScriptResult.style.color = "#c0392b";
      };

      document.head.appendChild(script);
    } catch (error) {
      allowedExternalScriptResult.textContent = `错误: ${error.message}`;
      allowedExternalScriptResult.style.backgroundColor = "#fadbd8";
      allowedExternalScriptResult.style.color = "#c0392b";
    }
  }

  /**
   * 测试不允许的外部脚本
   */
  function testDisallowedExternalScript() {
    try {
      // 从外部域（不允许的源）加载脚本
      disallowedExternalScriptResult.textContent = "正在尝试加载外部脚本...";
      disallowedExternalScriptResult.style.backgroundColor = "#ebf5fb";

      // 创建脚本元素
      const script = document.createElement("script");
      script.src = "https://code.jquery.com/jquery-3.6.0.min.js"; // 外部域脚本

      // 设置超时检查CSP是否阻止了脚本加载
      const timeoutId = setTimeout(() => {
        if (typeof jQuery === "undefined") {
          disallowedExternalScriptResult.textContent =
            "外部脚本被CSP阻止，测试成功！";
          disallowedExternalScriptResult.style.backgroundColor = "#d5f5e3";
          disallowedExternalScriptResult.style.color = "#2c7a30";
        } else {
          disallowedExternalScriptResult.textContent =
            "外部脚本加载成功，CSP未阻止！";
          disallowedExternalScriptResult.style.backgroundColor = "#fadbd8";
          disallowedExternalScriptResult.style.color = "#c0392b";
        }
      }, 2000);

      script.onload = () => {
        clearTimeout(timeoutId);
        disallowedExternalScriptResult.textContent =
          "外部脚本加载成功，CSP未阻止！";
        disallowedExternalScriptResult.style.backgroundColor = "#fadbd8";
        disallowedExternalScriptResult.style.color = "#c0392b";
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        disallowedExternalScriptResult.textContent =
          "外部脚本被CSP阻止，测试成功！";
        disallowedExternalScriptResult.style.backgroundColor = "#d5f5e3";
        disallowedExternalScriptResult.style.color = "#2c7a30";
      };

      document.head.appendChild(script);
    } catch (error) {
      disallowedExternalScriptResult.textContent = `错误: ${error.message}`;
      disallowedExternalScriptResult.style.backgroundColor = "#fadbd8";
      disallowedExternalScriptResult.style.color = "#c0392b";
    }
  }

  /**
   * 检查浏览器是否支持CSP
   */
  function isCSPSupported() {
    return "securitypolicy" in document || "CSP" in window;
  }

  // 检查CSP支持
  if (!isCSPSupported()) {
    document.querySelectorAll(".test-case").forEach((testCase) => {
      testCase.innerHTML =
        '<div style="color: #c0392b; font-weight: bold;">您的浏览器不支持CSP！</div>';
    });
  }
});
