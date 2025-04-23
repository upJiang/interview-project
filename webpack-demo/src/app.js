import { Task } from './components/Task';
import { TaskForm } from './components/TaskForm';

// 模拟任务数据
const initialTasks = [
  { id: 1, text: '完成Webpack项目', day: '2025年4月21日', reminder: true },
  { id: 2, text: '学习Webpack配置', day: '2025年4月22日', reminder: false },
  { id: 3, text: '比较Webpack和Vite', day: '2025年4月23日', reminder: true },
];

// 创建应用
export function createApp(element) {
  let tasks = [...initialTasks];
  
  // 创建应用容器
  const container = document.createElement('div');
  container.className = 'container';
  
  // 创建标题
  const header = document.createElement('header');
  const title = document.createElement('h1');
  title.textContent = 'Webpack任务管理器';
  header.appendChild(title);
  
  // 创建主内容区域
  const mainContent = document.createElement('div');
  mainContent.className = 'card';
  
  // 添加表单
  const taskForm = TaskForm(addTask);
  mainContent.appendChild(taskForm);
  
  // 创建任务列表
  const taskList = document.createElement('div');
  taskList.id = 'task-list';
  renderTasks();
  
  // 组装DOM
  container.appendChild(header);
  container.appendChild(mainContent);
  container.appendChild(taskList);
  element.appendChild(container);
  
  // 添加任务
  function addTask(text, day, reminder) {
    const newTask = {
      id: Date.now(),
      text,
      day,
      reminder
    };
    
    tasks = [...tasks, newTask];
    renderTasks();
  }
  
  // 删除任务
  function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
  }
  
  // 切换提醒状态
  function toggleReminder(id) {
    tasks = tasks.map(task => 
      task.id === id ? { ...task, reminder: !task.reminder } : task
    );
    renderTasks();
  }
  
  // 渲染任务列表
  function renderTasks() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
      const noTasks = document.createElement('p');
      noTasks.textContent = '没有任务可显示';
      taskList.appendChild(noTasks);
      return;
    }
    
    tasks.forEach(task => {
      const taskElement = Task(task, deleteTask, toggleReminder);
      taskList.appendChild(taskElement);
    });
  }
} 