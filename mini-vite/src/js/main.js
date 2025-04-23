// 使用ES模块导入
import { createCounter } from './counter';
import { displayTime } from './utils';

// 在页面中创建组件
function createApp() {
  const app = document.getElementById('app');
  
  // 添加时间显示
  const timeDisplay = document.createElement('div');
  timeDisplay.className = 'time-display';
  displayTime(timeDisplay);
  
  // 添加计数器
  const counterContainer = document.createElement('div');
  counterContainer.className = 'counter-container';
  const counter = createCounter(counterContainer);
  
  // 添加到DOM
  app.appendChild(timeDisplay);
  app.appendChild(counterContainer);
  
  console.log('应用已初始化');
}

// 初始化应用
createApp(); 