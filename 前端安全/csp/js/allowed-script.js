/**
 * 这是一个被CSP允许加载的同域脚本
 */

console.log("允许的脚本已加载和执行");

// 此函数将在DOM加载完成后执行
(function () {
  // 尝试修改页面内容以显示脚本已成功执行
  const resultElement = document.getElementById("allowedExternalScriptResult");
  if (resultElement) {
    resultElement.textContent = "同域脚本成功加载并执行！";
    resultElement.style.backgroundColor = "#d5f5e3";
    resultElement.style.color = "#2c7a30";
  }
})();
