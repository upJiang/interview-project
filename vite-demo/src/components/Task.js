export function Task({ id, text, day, reminder }, onDelete, onToggle) {
  const taskEl = document.createElement('div')
  taskEl.classList.add('task-item')
  if (reminder) {
    taskEl.classList.add('reminder')
  }
  
  // 双击切换提醒状态
  taskEl.addEventListener('dblclick', () => onToggle(id))
  
  // 任务信息
  const taskInfo = document.createElement('div')
  taskInfo.className = 'task-info'
  
  const taskTitle = document.createElement('h3')
  taskTitle.textContent = text
  
  const taskDate = document.createElement('p')
  taskDate.textContent = day
  
  taskInfo.append(taskTitle, taskDate)
  
  // 删除按钮
  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'btn btn-delete'
  deleteBtn.textContent = '删除'
  deleteBtn.addEventListener('click', () => onDelete(id))
  
  // 组装任务项
  taskEl.append(taskInfo, deleteBtn)
  
  return taskEl
} 