// 工具函数模块

/**
 * 在指定元素中显示当前时间，并每秒更新
 * @param {HTMLElement} element - 显示时间的元素
 */
export function displayTime(element) {
  // 更新时间的函数
  function updateTime() {
    const now = new Date();
    element.textContent = now.toLocaleTimeString();
  }
  
  // 初始更新
  updateTime();
  
  // 每秒更新一次
  setInterval(updateTime, 1000);
}

/**
 * 格式化日期为YYYY-MM-DD格式
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
} 