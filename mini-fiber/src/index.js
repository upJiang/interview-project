/**
 * Mini Fiber 入口文件
 * 
 * 这个文件导出所有公共API，是使用mini-fiber的入口点。
 */

// 确保全局命名空间存在
window.MiniFiber = window.MiniFiber || {};

/**
 * 创建一个Mini Fiber应用
 * @param {object} element - React元素树
 * @param {DOMElement|string} container - DOM容器或容器选择器
 */
MiniFiber.render = function(element, container) {
  if (typeof container === 'string') {
    container = document.querySelector(container);
  }
  
  // 调度根节点渲染
  MiniFiber.scheduleRoot(element, container);
};

/**
 * 创建文本元素
 * @param {string} text - 文本内容
 * @returns {object} - 文本类型的React元素
 */
MiniFiber.createTextElement = function(text) {
  return {
    type: MiniFiber.ELEMENT_TEXT,
    props: { nodeValue: text },
  };
};