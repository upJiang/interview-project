import { effect } from './reactivity.js';

/**
 * 创建简单的渲染函数
 * @param {Function} renderFn - 渲染函数，返回DOM树
 * @param {HTMLElement} container - 挂载容器
 */
function createApp(rootComponent) {
  return {
    mount(container) {
      if (typeof container === 'string') {
        container = document.querySelector(container);
      }
      
      // 清空容器
      container.innerHTML = '';
      
      // 使用effect包装渲染函数，确保响应式数据变化时会重新渲染
      effect(() => {
        // 简单的渲染实现
        const dom = rootComponent.render();
        container.appendChild(dom);
      });
    }
  };
}

export {
  createApp
}; 