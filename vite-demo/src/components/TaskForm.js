export function TaskForm(onAddTask) {
  const formEl = document.createElement('form')
  
  // 创建任务名称输入
  const taskNameGroup = document.createElement('div')
  taskNameGroup.className = 'form-control'
  
  const taskNameLabel = document.createElement('label')
  taskNameLabel.htmlFor = 'task'
  taskNameLabel.textContent = '任务名称'
  
  const taskNameInput = document.createElement('input')
  taskNameInput.type = 'text'
  taskNameInput.id = 'task'
  taskNameInput.placeholder = '添加任务'
  
  taskNameGroup.append(taskNameLabel, taskNameInput)
  
  // 创建日期时间输入
  const taskDateGroup = document.createElement('div')
  taskDateGroup.className = 'form-control'
  
  const taskDateLabel = document.createElement('label')
  taskDateLabel.htmlFor = 'date'
  taskDateLabel.textContent = '日期和时间'
  
  const taskDateInput = document.createElement('input')
  taskDateInput.type = 'text'
  taskDateInput.id = 'date'
  taskDateInput.placeholder = '添加日期和时间'
  
  taskDateGroup.append(taskDateLabel, taskDateInput)
  
  // 创建提醒选项
  const reminderGroup = document.createElement('div')
  reminderGroup.className = 'form-control form-control-check'
  
  const reminderLabel = document.createElement('label')
  reminderLabel.htmlFor = 'reminder'
  reminderLabel.textContent = '设置提醒'
  
  const reminderInput = document.createElement('input')
  reminderInput.type = 'checkbox'
  reminderInput.id = 'reminder'
  
  reminderGroup.append(reminderInput, reminderLabel)
  
  // 创建提交按钮
  const submitBtn = document.createElement('button')
  submitBtn.type = 'submit'
  submitBtn.className = 'btn'
  submitBtn.textContent = '保存任务'
  
  // 组装表单
  formEl.append(taskNameGroup, taskDateGroup, reminderGroup, submitBtn)
  
  // 添加提交事件
  formEl.addEventListener('submit', (e) => {
    e.preventDefault()
    
    if (!taskNameInput.value.trim()) {
      alert('请添加任务名称')
      return
    }
    
    onAddTask({
      text: taskNameInput.value,
      day: taskDateInput.value,
      reminder: reminderInput.checked
    })
    
    // 重置表单
    taskNameInput.value = ''
    taskDateInput.value = ''
    reminderInput.checked = false
  })
  
  return formEl
} 