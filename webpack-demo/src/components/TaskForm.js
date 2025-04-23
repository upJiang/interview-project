// 任务表单组件
export function TaskForm(onAddTask) {
  const formElement = document.createElement('form');
  formElement.id = 'task-form';
  
  // 任务名称输入
  const taskNameGroup = document.createElement('div');
  taskNameGroup.className = 'form-control';
  
  const taskNameLabel = document.createElement('label');
  taskNameLabel.htmlFor = 'task';
  taskNameLabel.textContent = '任务名称';
  
  const taskNameInput = document.createElement('input');
  taskNameInput.type = 'text';
  taskNameInput.id = 'task';
  taskNameInput.name = 'taskText';
  taskNameInput.placeholder = '添加任务';
  
  taskNameGroup.appendChild(taskNameLabel);
  taskNameGroup.appendChild(taskNameInput);
  
  // 任务日期输入
  const taskDateGroup = document.createElement('div');
  taskDateGroup.className = 'form-control';
  
  const taskDateLabel = document.createElement('label');
  taskDateLabel.htmlFor = 'day';
  taskDateLabel.textContent = '日期和时间';
  
  const taskDateInput = document.createElement('input');
  taskDateInput.type = 'text';
  taskDateInput.id = 'day';
  taskDateInput.name = 'taskDay';
  taskDateInput.placeholder = '添加日期和时间';
  
  taskDateGroup.appendChild(taskDateLabel);
  taskDateGroup.appendChild(taskDateInput);
  
  // 提醒选项
  const reminderGroup = document.createElement('div');
  reminderGroup.className = 'form-control form-control-check';
  
  const reminderLabel = document.createElement('label');
  reminderLabel.htmlFor = 'reminder';
  reminderLabel.textContent = '设置提醒';
  
  const reminderInput = document.createElement('input');
  reminderInput.type = 'checkbox';
  reminderInput.id = 'reminder';
  reminderInput.name = 'taskReminder';
  
  reminderGroup.appendChild(reminderLabel);
  reminderGroup.appendChild(reminderInput);
  
  // 提交按钮
  const submitBtn = document.createElement('input');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-block';
  submitBtn.value = '保存任务';
  
  // 组装表单
  formElement.appendChild(taskNameGroup);
  formElement.appendChild(taskDateGroup);
  formElement.appendChild(reminderGroup);
  formElement.appendChild(submitBtn);
  
  // 表单提交事件
  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 表单验证
    if (!taskNameInput.value) {
      alert('请添加任务名称');
      return;
    }
    
    onAddTask(
      taskNameInput.value,
      taskDateInput.value,
      reminderInput.checked
    );
    
    // 重置表单
    taskNameInput.value = '';
    taskDateInput.value = '';
    reminderInput.checked = false;
  });
  
  return formElement;
} 