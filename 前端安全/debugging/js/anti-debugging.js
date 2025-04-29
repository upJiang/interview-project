/**
 * 前端防调试技术演示脚本
 * 注意：这些技术仅用于教育目的，不应在实际生产环境中直接使用
 */

document.addEventListener("DOMContentLoaded", () => {
  // 获取DOM元素
  const devtoolsStatus = document.getElementById("devtools-status");
  const protectedContent = document.getElementById("protected-content");
  const debuggerTrapBtn = document.getElementById("debugger-trap-btn");
  const trapResult = document.getElementById("trap-result");

  // 禁用调试器陷阱按钮的右键菜单
  debuggerTrapBtn.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });

  // 按钮点击事件
  debuggerTrapBtn.addEventListener("click", () => {
    trapResult.innerHTML =
      '<div class="pending-message">正在执行安全操作...</div>';

    // 短暂延迟后执行调试器陷阱
    setTimeout(() => {
      triggerDebuggerTrap();
    }, 500);
  });

  // 初始化开发者工具检测
  initDevToolsDetection();

  /**
   * 初始化开发者工具检测
   */
  function initDevToolsDetection() {
    // 首次检查
    checkDevTools();

    // 设置周期性检查
    setInterval(checkDevTools, 1000);

    // 窗口大小变化时检查
    window.addEventListener("resize", checkDevTools);
  }

  /**
   * 检查开发者工具是否打开
   */
  function checkDevTools() {
    if (isDevToolsOpen()) {
      // 开发者工具已打开
      devtoolsStatus.innerHTML =
        '<div class="error-message">DevTools状态：已检测到开发者工具！</div>';
      protectedContent.style.display = "none";

      // 在实际应用中，可以在此处采取保护措施
      // 例如：中断操作、显示警告、禁用功能等
    } else {
      // 未检测到开发者工具
      devtoolsStatus.innerHTML =
        '<div class="success-message">DevTools状态：未检测到开发者工具</div>';
      protectedContent.style.display = "block";
    }
  }

  /**
   * 检测开发者工具是否打开
   * 使用多种方法组合检测以提高准确性
   */
  function isDevToolsOpen() {
    // 方法1: 窗口尺寸差异检测法
    const widthThreshold = 160; // 阈值可以根据需要调整
    const heightThreshold = 160;

    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;

    if (widthDiff > widthThreshold || heightDiff > heightThreshold) {
      return true;
    }

    // 方法2: 控制台对象检测法
    if (isConsoleOpen()) {
      return true;
    }

    // 方法3: 调试器状态检测法
    try {
      const debuggerEnabled = /\bdebugger\b/.test(
        Function.prototype.toString.call(function () {
          debugger;
        })
      );
      if (!debuggerEnabled) return true; // 如果debugger关键字被修改，可能处于调试模式
    } catch (e) {
      // 忽略错误
    }

    return false;
  }

  /**
   * 检测控制台是否打开
   */
  function isConsoleOpen() {
    // 由于不同浏览器行为不同，使用多种方法检测
    let isOpen = false;

    // 方法1: 检测Firebug（旧版Firefox）
    if (
      window.Firebug &&
      window.Firebug.chrome &&
      window.Firebug.chrome.isInitialized
    ) {
      isOpen = true;
    }

    // 方法2: 检测开发者工具相关对象
    if (
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
      window.__VUE_DEVTOOLS_GLOBAL_HOOK__ ||
      window.__REDUX_DEVTOOLS_EXTENSION__
    ) {
      isOpen = true;
    }

    // 方法3: 检测时间差，打开控制台时函数执行会变慢
    // 注意：此方法可能产生误报，应与其他方法结合使用
    const startTime = performance.now();
    console.profile();
    console.profileEnd();
    const endTime = performance.now();

    if (endTime - startTime > 20) {
      // 控制台开启时，这个操作通常会更慢
      isOpen = true;
    }

    return isOpen;
  }

  /**
   * 触发调试器陷阱
   * 注意：此功能在实际页面中使用需谨慎，可能导致用户体验问题
   */
  function triggerDebuggerTrap() {
    // 更新UI
    trapResult.innerHTML = '<div class="success-message">安全操作已完成</div>';

    // 创建一个立即执行的函数，包含调试陷阱
    (function () {
      try {
        // 这里可以放置您希望保护的代码
        const protectedResult = "这是通过调试器陷阱保护的结果";

        // 创建轻量级的调试陷阱
        // 注意：实际生产环境中的调试陷阱会更复杂，这里简化处理
        debugger;

        // 检测是否在调试模式下
        const startTime = performance.now();
        debugger;
        const endTime = performance.now();

        if (endTime - startTime > 100) {
          // 可能处于调试状态，采取保护措施
          console.warn("检测到可能的调试尝试");
          return "操作已取消";
        }

        return protectedResult;
      } catch (error) {
        console.error("操作失败:", error);
        return "操作失败";
      }
    })();
  }

  /**
   * 实现控制台覆盖（仅用于演示）
   * 注意：这会影响开发体验，实际应用中应谨慎使用
   */
  function demonstrateConsoleOverride() {
    // 此功能默认不启用，取消注释即可激活
    /*
    // 保存原始console对象
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
      clear: console.clear
    };
    
    // 存储原始方法
    window._originalConsole = originalConsole;
    
    // 替换为自定义函数
    console.log = function() {
      // 可以在这里记录尝试记录的内容
      // originalConsole.log.apply(console, arguments);
      originalConsole.log.call(console, "控制台输出已被拦截");
    };
    
    // 同样处理其他方法
    console.warn = console.error = console.info = console.debug = console.log;
    
    // 防止清除控制台
    console.clear = function() {
      originalConsole.log.call(console, "控制台清除操作已被拦截");
    };
    */
  }

  /**
   * 防止审查元素
   */
  function preventElementInspection() {
    // 此功能默认不启用，取消注释即可激活
    /*
    // 禁用右键菜单
    document.addEventListener('contextmenu', e => {
      e.preventDefault();
      return false;
    });
    
    // 禁用F12、Ctrl+Shift+I等开发者工具快捷键
    document.addEventListener('keydown', e => {
      // F12 键
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+I 或 Cmd+Opt+I
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 73) || 
          (e.metaKey && e.altKey && e.keyCode === 73)) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+C 或 Cmd+Opt+C
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 67) || 
          (e.metaKey && e.altKey && e.keyCode === 67)) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+J 或 Cmd+Opt+J
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 74) || 
          (e.metaKey && e.altKey && e.keyCode === 74)) {
        e.preventDefault();
        return false;
      }
    });
    */
  }

  /**
   * 实现代码自检查（简化版）
   */
  function demonstrateSelfCheck() {
    // 此功能默认不启用，取消注释即可激活
    /*
    // 示例保护的关键函数
    function criticalFunction(a, b) {
      return a * b + a;
    }
    
    // 计算函数原始哈希（实际使用中这个值应该预先计算并硬编码）
    function calculateHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
      }
      return hash.toString(16);
    }
    
    // 原始哈希值（实际应用中这个值应该是预定义的）
    const originalHash = calculateHash(criticalFunction.toString());
    
    // 定期检查函数是否被修改
    setInterval(() => {
      // 计算当前函数的哈希值
      const currentHash = calculateHash(criticalFunction.toString());
      
      // 检查哈希值是否匹配
      if (currentHash !== originalHash) {
        console.error("关键函数已被修改，执行保护措施...");
        // 在这里实现保护措施，例如:
        // - 重置函数
        // - 中断操作
        // - 报告到服务器
      }
    }, 2000);
    */
  }
});
