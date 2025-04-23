import './style.css'
import { setupApp } from './app'

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 获取根元素
  const appElement = document.getElementById('app')
  
  // 初始化应用
  setupApp(appElement)
}) 