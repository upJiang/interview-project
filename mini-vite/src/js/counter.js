// 计数器组件模块

/**
 * 创建一个简单的计数器
 * @param {HTMLElement} container - 放置计数器的容器
 * @returns {Object} 计数器控制对象
 */
export function createCounter(container) {
  let count = 0;
  
  // 创建计数器UI
  const counterDiv = document.createElement('div');
  counterDiv.className = 'counter';
  
  const countDisplay = document.createElement('span');
  countDisplay.textContent = count;
  countDisplay.className = 'count';
  
  const incrementBtn = document.createElement('button');
  incrementBtn.textContent = '+';
  incrementBtn.className = 'btn increment';
  
  const decrementBtn = document.createElement('button');
  decrementBtn.textContent = '-';
  decrementBtn.className = 'btn decrement';
  
  // 组装计数器
  counterDiv.appendChild(decrementBtn);
  counterDiv.appendChild(countDisplay);
  counterDiv.appendChild(incrementBtn);
  container.appendChild(counterDiv);
  
  // 添加事件监听
  incrementBtn.addEventListener('click', () => {
    count++;
    updateDisplay();
  });
  
  decrementBtn.addEventListener('click', () => {
    count--;
    updateDisplay();
  });
  
  // 更新显示
  function updateDisplay() {
    countDisplay.textContent = count;
  }
  
  // 返回控制对象
  return {
    increment: () => {
      count++;
      updateDisplay();
    },
    decrement: () => {
      count--;
      updateDisplay();
    },
    getCount: () => count
  };
} 