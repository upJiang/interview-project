import { TaskForm } from './components/TaskForm'
import { Task } from './components/Task'
import { VirtualModuleDemo } from './components/VirtualModuleDemo'
import viteLogo from '/vite.svg'

// 模拟任务数据
const initialTasks = [
  { id: 1, text: '完成Vite项目', day: '2025年4月21日', reminder: true },
  { id: 2, text: '学习Vite配置', day: '2025年4月22日', reminder: false },
  { id: 3, text: '比较Webpack和Vite', day: '2025年4月23日', reminder: true },
]

// 设置应用
export function setupApp(appElement) {
  let tasks = [...initialTasks]
  
  // 创建应用容器
  const container = document.createElement('div')
  container.className = 'container'
  
  // 添加Logo
  const logo = document.createElement('img')
  logo.src = viteLogo
  logo.className = 'logo vite'
  logo.alt = 'Vite logo'
  
  // 创建标题
  const title = document.createElement('h1')
  title.textContent = 'Vite任务管理器'
  
  // 添加虚拟模块演示组件
  const virtualModuleDemo = VirtualModuleDemo()
  
  // 创建任务卡片
  const taskCard = document.createElement('div')
  taskCard.className = 'card'
  
  // 添加任务表单
  const taskForm = TaskForm(addTask)
  taskCard.appendChild(taskForm)
  
  // 创建任务列表
  const taskList = document.createElement('div')
  taskList.className = 'task-list'
  
  // 渲染初始任务
  renderTasks()
  
  // 组装DOM
  container.append(logo, title, virtualModuleDemo, taskCard, taskList)
  appElement.appendChild(container)
  
  // 添加任务
  function addTask(task) {
    const newTask = {
      id: Date.now(),
      ...task
    }
    tasks = [...tasks, newTask]
    renderTasks()
  }
  
  // 删除任务
  function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id)
    renderTasks()
  }
  
  // 切换提醒状态
  function toggleReminder(id) {
    tasks = tasks.map(task => 
      task.id === id ? { ...task, reminder: !task.reminder } : task
    )
    renderTasks()
  }
  
  // 渲染任务列表
  function renderTasks() {
    taskList.innerHTML = ''
    
    if (tasks.length === 0) {
      const emptyMessage = document.createElement('p')
      emptyMessage.textContent = '没有任务可显示'
      taskList.appendChild(emptyMessage)
      return
    }
    
    tasks.forEach(task => {
      const taskElement = Task(task, deleteTask, toggleReminder)
      taskList.appendChild(taskElement)
    })
  }
} 