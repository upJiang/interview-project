import './styles/main.css';
import { createApp } from './app';

// 创建应用
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  createApp(app);
}); 