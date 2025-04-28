// 主应用JavaScript

document.addEventListener("DOMContentLoaded", () => {
  const statusElement = document.getElementById("status");
  const refreshButton = document.getElementById("refresh");

  // 检查在线状态
  function updateOnlineStatus() {
    if (navigator.onLine) {
      statusElement.textContent = "您当前处于在线状态";
      statusElement.style.color = "#4CAF50";
    } else {
      statusElement.textContent = "您当前处于离线状态";
      statusElement.style.color = "#F44336";
    }
  }

  // 初始检查
  updateOnlineStatus();

  // 监听在线状态变化
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  // 刷新按钮事件
  refreshButton.addEventListener("click", () => {
    updateOnlineStatus();
    if (navigator.onLine) {
      fetchLatestData();
    } else {
      alert("您当前处于离线状态，无法获取最新数据");
    }
  });

  // 模拟获取最新数据
  function fetchLatestData() {
    statusElement.textContent = "正在获取数据...";

    // 模拟网络请求
    setTimeout(() => {
      const date = new Date();
      const formattedDate = date.toLocaleString("zh-CN");
      statusElement.textContent = `在线状态 - 最后更新: ${formattedDate}`;
      statusElement.style.color = "#4CAF50";
    }, 1000);
  }
});
