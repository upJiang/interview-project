// 任务组件
export function Task(task, onDelete, onToggle) {
  const taskElement = document.createElement('div');
  taskElement.className = `task-item ${task.reminder ? 'reminder' : ''}`;
  taskElement.addEventListener('dblclick', () => onToggle(task.id));
  
  // 任务信息
  const taskInfo = document.createElement('div');
  
  const taskTitle = document.createElement('h3');
  taskTitle.textContent = task.text;
  
  const taskDate = document.createElement('p');
  taskDate.textContent = task.day;
  
  taskInfo.appendChild(taskTitle);
  taskInfo.appendChild(taskDate);
  
  // 删除按钮
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn';
  deleteBtn.textContent = '删除';
  deleteBtn.style.backgroundColor = 'red';
  deleteBtn.addEventListener('click', () => onDelete(task.id));
  
  // 组装任务项
  taskElement.appendChild(taskInfo);
  taskElement.appendChild(deleteBtn);
  
  return taskElement;
} 