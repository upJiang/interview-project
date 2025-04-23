// 这个组件展示如何使用我们的虚拟模块
import virtualModuleContent from 'virtual-module';

export function VirtualModuleDemo() {
  const demoContainer = document.createElement('div');
  demoContainer.className = 'virtual-module-demo card';
  
  const title = document.createElement('h3');
  title.textContent = '虚拟模块演示';
  
  const content = document.createElement('p');
  content.textContent = `从虚拟模块加载的内容: ${virtualModuleContent}`;
  
  demoContainer.append(title, content);
  return demoContainer;
} 