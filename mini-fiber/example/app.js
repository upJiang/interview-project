/**
 * Mini Fiber 示例应用
 * 
 * 一个简单的计数器应用，展示Mini Fiber的工作原理
 */

// 使用全局MiniFiber对象
const { createElement, createTextElement, render } = window.MiniFiber;

// 当前计数值
let count = 0;

// 更新间隔(毫秒)
const UPDATE_INTERVAL = 1000;

/**
 * 增加计数
 */
function increment() {
  count += 1;
  renderApp();
  console.log('Increment clicked, count:', count);
}

/**
 * 减少计数
 */
function decrement() {
  count -= 1;
  renderApp();
  console.log('Decrement clicked, count:', count);
}

/**
 * 渲染应用
 */
function renderApp() {
  // 创建React元素树
  const app = createElement(
    'div',
    { className: 'counter' },
    createElement('h2', null, createTextElement('计数器')),
    createElement('div', { className: 'value' }, createTextElement(count.toString())),
    createElement(
      'div',
      null,
      createElement('button', { onClick: decrement }, createTextElement('-')),
      createElement('button', { onClick: increment }, createTextElement('+'))
    )
  );
  
  // 渲染到DOM
  render(app, '#root');
}

// 初始渲染
renderApp();

// 设置自动更新
setInterval(() => {
  // 自动递增
  count += 1;
  renderApp();
  
  console.log('Auto update, count:', count);
}, UPDATE_INTERVAL);