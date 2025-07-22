# TodoList 组件

## 概述

TodoList是React面试中最常见的组件设计题目之一，它综合考察了React的核心概念和最佳实践。本实现包含完整的CRUD操作、状态管理、性能优化和用户体验优化。

## 核心知识点

### 1. 组件架构设计

- **单一职责原则**：每个组件只负责一个功能
- **组件拆分**：将复杂组件拆分为更小的可复用组件
- **状态提升**：将共享状态提升到最近的共同父组件
- **数据流**：单向数据流，状态向下传递，事件向上传递

### 2. 状态管理策略

- **状态分类**：
  - 组件内部状态：编辑状态、输入值
  - 应用状态：待办事项列表、筛选条件
  - 衍生状态：统计信息、筛选结果

- **状态更新**：
  - 不可变更新：使用扩展运算符和数组方法
  - 批量更新：React自动批处理状态更新
  - 异步更新：状态更新是异步的

### 3. 性能优化技术

- **React.memo**：避免不必要的重渲染
- **useCallback**：缓存函数引用，避免子组件重渲染
- **useMemo**：缓存计算结果，避免重复计算
- **key属性**：帮助React识别列表项的变化

### 4. 副作用管理

- **数据持久化**：使用localStorage保存数据
- **焦点管理**：编辑时自动聚焦到输入框
- **事件监听**：键盘事件处理
- **清理工作**：组件卸载时清理资源

## 常见面试问题

### 1. 如何设计一个TodoList组件的架构？

**答案要点：**
- 确定组件层级结构
- 识别状态和props
- 设计数据流
- 考虑性能优化

```jsx
// 组件层级结构
TodoApp
├── TodoHeader
│   ├── TodoInput
│   └── SearchBox
├── TodoMain
│   ├── BulkActions
│   ├── TodoList
│   │   └── TodoItem[]
│   └── EmptyState
└── TodoFooter
    ├── FilterButtons
    └── TodoStats
```

### 2. 如何优化TodoList的性能？

**答案要点：**
- 使用React.memo包装组件
- 使用useCallback缓存事件处理函数
- 使用useMemo缓存计算结果
- 合理使用key属性
- 避免在render中创建新对象

```jsx
// 性能优化示例
const TodoItem = React.memo(({ todo, onToggle, onDelete }) => {
  // 使用useCallback缓存事件处理函数
  const handleToggle = useCallback(() => {
    onToggle(todo.id);
  }, [todo.id, onToggle]);

  return (
    <li>
      <input 
        type="checkbox" 
        checked={todo.completed}
        onChange={handleToggle}
      />
      <span>{todo.text}</span>
    </li>
  );
});
```

### 3. 如何处理TodoList的状态更新？

**答案要点：**
- 使用函数式更新避免闭包陷阱
- 保持状态的不可变性
- 合理组织状态结构
- 使用useReducer管理复杂状态

```jsx
// 函数式更新
const addTodo = useCallback((text) => {
  setTodos(prev => [...prev, {
    id: Date.now(),
    text,
    completed: false
  }]);
}, []);

// 不可变更新
const toggleTodo = useCallback((id) => {
  setTodos(prev => prev.map(todo => 
    todo.id === id 
      ? { ...todo, completed: !todo.completed }
      : todo
  ));
}, []);
```

### 4. 如何实现TodoList的筛选功能？

**答案要点：**
- 使用useMemo缓存筛选结果
- 支持多种筛选条件
- 考虑搜索和筛选的组合
- 优化筛选性能

```jsx
const filteredTodos = useMemo(() => {
  let result = todos;
  
  // 文本搜索
  if (searchTerm) {
    result = result.filter(todo => 
      todo.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // 状态筛选
  switch (filter) {
    case 'active':
      result = result.filter(todo => !todo.completed);
      break;
    case 'completed':
      result = result.filter(todo => todo.completed);
      break;
    default:
      break;
  }
  
  return result;
}, [todos, searchTerm, filter]);
```

### 5. 如何处理TodoList的键盘事件？

**答案要点：**
- 支持Enter键提交
- 支持Escape键取消编辑
- 实现键盘导航
- 管理焦点状态

```jsx
const handleKeyDown = useCallback((e) => {
  switch (e.key) {
    case 'Enter':
      handleSubmit();
      break;
    case 'Escape':
      handleCancel();
      break;
    case 'ArrowUp':
    case 'ArrowDown':
      handleNavigation(e.key);
      break;
    default:
      break;
  }
}, [handleSubmit, handleCancel, handleNavigation]);
```

## 实现原理

### 1. 基础版本实现

```jsx
const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  const addTodo = useCallback(() => {
    if (inputValue.trim()) {
      setTodos(prev => [...prev, {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false
      }]);
      setInputValue('');
    }
  }, [inputValue]);
  
  const toggleTodo = useCallback((id) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  }, []);
  
  const deleteTodo = useCallback((id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);
  
  return (
    <div>
      <input 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addTodo()}
      />
      <button onClick={addTodo}>Add</button>
      
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input 
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### 2. 增强功能实现

```jsx
const EnhancedTodoList = () => {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  // 本地存储
  useEffect(() => {
    const saved = localStorage.getItem('todos');
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);
  
  // 筛选逻辑
  const filteredTodos = useMemo(() => {
    let result = todos;
    
    if (searchTerm) {
      result = result.filter(todo => 
        todo.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    switch (filter) {
      case 'active':
        return result.filter(todo => !todo.completed);
      case 'completed':
        return result.filter(todo => todo.completed);
      default:
        return result;
    }
  }, [todos, filter, searchTerm]);
  
  // 批量操作
  const toggleAll = useCallback(() => {
    const allCompleted = todos.every(todo => todo.completed);
    setTodos(prev => prev.map(todo => ({
      ...todo,
      completed: !allCompleted
    })));
  }, [todos]);
  
  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(todo => !todo.completed));
  }, []);
  
  // 编辑功能
  const startEdit = useCallback((id) => {
    setEditingId(id);
  }, []);
  
  const saveEdit = useCallback((id, newText) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { ...todo, text: newText }
        : todo
    ));
    setEditingId(null);
  }, []);
  
  return (
    <div className="todo-app">
      {/* 头部 */}
      <header>
        <h1>Todos</h1>
        <TodoInput onAdd={addTodo} />
        <SearchBox value={searchTerm} onChange={setSearchTerm} />
      </header>
      
      {/* 主体 */}
      <main>
        {todos.length > 0 && (
          <BulkActions 
            onToggleAll={toggleAll}
            onClearCompleted={clearCompleted}
            completedCount={todos.filter(t => t.completed).length}
          />
        )}
        
        <TodoList 
          todos={filteredTodos}
          editingId={editingId}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onStartEdit={startEdit}
          onSaveEdit={saveEdit}
        />
      </main>
      
      {/* 底部 */}
      <footer>
        <FilterButtons filter={filter} onFilterChange={setFilter} />
        <TodoStats todos={todos} />
      </footer>
    </div>
  );
};
```

## 实际应用场景

### 1. 基础待办事项应用

```jsx
const BasicTodoApp = () => {
  return (
    <div>
      <h1>我的待办事项</h1>
      <TodoList />
    </div>
  );
};
```

### 2. 团队协作工具

```jsx
const TeamTodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [users, setUsers] = useState([]);
  
  const assignTodo = useCallback((todoId, userId) => {
    setTodos(prev => prev.map(todo => 
      todo.id === todoId 
        ? { ...todo, assignedTo: userId }
        : todo
    ));
  }, []);
  
  return (
    <div>
      <h1>团队任务管理</h1>
      <TodoList 
        todos={todos}
        users={users}
        onAssign={assignTodo}
        showAssignee={true}
      />
    </div>
  );
};
```

### 3. 项目管理系统

```jsx
const ProjectTodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const addTodoToProject = useCallback((projectId, todoText) => {
    const newTodo = {
      id: Date.now(),
      text: todoText,
      projectId,
      completed: false,
      priority: 'medium',
      dueDate: null
    };
    setTodos(prev => [...prev, newTodo]);
  }, []);
  
  return (
    <div>
      <h1>项目任务管理</h1>
      <ProjectSelector projects={projects} />
      <TodoList 
        todos={todos}
        onAdd={addTodoToProject}
        showPriority={true}
        showDueDate={true}
      />
    </div>
  );
};
```

## 高级用法

### 1. 拖拽排序

```jsx
const DraggableTodoList = () => {
  const [todos, setTodos] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  
  const handleDragStart = useCallback((e, todo) => {
    setDraggedItem(todo);
    e.dataTransfer.effectAllowed = 'move';
  }, []);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  
  const handleDrop = useCallback((e, targetTodo) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetTodo.id) {
      return;
    }
    
    setTodos(prev => {
      const newTodos = [...prev];
      const draggedIndex = newTodos.findIndex(t => t.id === draggedItem.id);
      const targetIndex = newTodos.findIndex(t => t.id === targetTodo.id);
      
      // 移动项目
      const [removed] = newTodos.splice(draggedIndex, 1);
      newTodos.splice(targetIndex, 0, removed);
      
      return newTodos;
    });
    
    setDraggedItem(null);
  }, [draggedItem]);
  
  return (
    <ul>
      {todos.map(todo => (
        <li
          key={todo.id}
          draggable
          onDragStart={(e) => handleDragStart(e, todo)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, todo)}
        >
          {todo.text}
        </li>
      ))}
    </ul>
  );
};
```

### 2. 虚拟化长列表

```jsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedTodoList = ({ todos }) => {
  const TodoItem = ({ index, style }) => (
    <div style={style}>
      <TodoItemComponent todo={todos[index]} />
    </div>
  );
  
  return (
    <List
      height={400}
      itemCount={todos.length}
      itemSize={50}
      itemData={todos}
    >
      {TodoItem}
    </List>
  );
};
```

### 3. 实时协作

```jsx
const CollaborativeTodoList = () => {
  const [todos, setTodos] = useState([]);
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'TODO_ADDED':
          setTodos(prev => [...prev, data.todo]);
          break;
        case 'TODO_UPDATED':
          setTodos(prev => prev.map(todo => 
            todo.id === data.todo.id ? data.todo : todo
          ));
          break;
        case 'TODO_DELETED':
          setTodos(prev => prev.filter(todo => todo.id !== data.todoId));
          break;
        default:
          break;
      }
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, []);
  
  const addTodo = useCallback((text) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      author: 'current-user'
    };
    
    // 本地更新
    setTodos(prev => [...prev, newTodo]);
    
    // 发送到服务器
    socket?.send(JSON.stringify({
      type: 'ADD_TODO',
      todo: newTodo
    }));
  }, [socket]);
  
  return <TodoList todos={todos} onAdd={addTodo} />;
};
```

## 性能优化

### 1. 组件优化

```jsx
// 使用React.memo优化子组件
const TodoItem = React.memo(({ todo, onToggle, onDelete }) => {
  console.log('TodoItem rendered:', todo.id);
  
  return (
    <li>
      <input 
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span>{todo.text}</span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
});

// 使用useCallback优化事件处理
const TodoList = () => {
  const [todos, setTodos] = useState([]);
  
  const toggleTodo = useCallback((id) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  }, []);
  
  const deleteTodo = useCallback((id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);
  
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
        />
      ))}
    </ul>
  );
};
```

### 2. 状态优化

```jsx
// 使用useReducer管理复杂状态
const todoReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return [...state, action.payload];
    case 'TOGGLE_TODO':
      return state.map(todo => 
        todo.id === action.payload 
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    case 'DELETE_TODO':
      return state.filter(todo => todo.id !== action.payload);
    case 'EDIT_TODO':
      return state.map(todo => 
        todo.id === action.payload.id 
          ? { ...todo, text: action.payload.text }
          : todo
      );
    default:
      return state;
  }
};

const TodoList = () => {
  const [todos, dispatch] = useReducer(todoReducer, []);
  
  const addTodo = useCallback((text) => {
    dispatch({
      type: 'ADD_TODO',
      payload: {
        id: Date.now(),
        text,
        completed: false
      }
    });
  }, []);
  
  return (
    <div>
      <TodoInput onAdd={addTodo} />
      <TodoList todos={todos} dispatch={dispatch} />
    </div>
  );
};
```

### 3. 渲染优化

```jsx
// 使用useMemo优化计算
const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 缓存筛选结果
  const filteredTodos = useMemo(() => {
    let result = todos;
    
    if (searchTerm) {
      result = result.filter(todo => 
        todo.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    switch (filter) {
      case 'active':
        return result.filter(todo => !todo.completed);
      case 'completed':
        return result.filter(todo => todo.completed);
      default:
        return result;
    }
  }, [todos, filter, searchTerm]);
  
  // 缓存统计信息
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const active = total - completed;
    
    return { total, completed, active };
  }, [todos]);
  
  return (
    <div>
      <TodoInput />
      <TodoList todos={filteredTodos} />
      <TodoStats stats={stats} />
    </div>
  );
};
```

## 测试策略

### 1. 单元测试

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import TodoList from './TodoList';

describe('TodoList', () => {
  test('添加新的待办事项', () => {
    render(<TodoList />);
    
    const input = screen.getByPlaceholderText('添加新的待办事项...');
    const addButton = screen.getByText('添加');
    
    fireEvent.change(input, { target: { value: '学习React' } });
    fireEvent.click(addButton);
    
    expect(screen.getByText('学习React')).toBeInTheDocument();
  });
  
  test('切换待办事项状态', () => {
    render(<TodoList />);
    
    // 先添加一个待办事项
    const input = screen.getByPlaceholderText('添加新的待办事项...');
    fireEvent.change(input, { target: { value: '学习React' } });
    fireEvent.click(screen.getByText('添加'));
    
    // 切换状态
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(checkbox).toBeChecked();
  });
  
  test('删除待办事项', () => {
    render(<TodoList />);
    
    // 先添加一个待办事项
    const input = screen.getByPlaceholderText('添加新的待办事项...');
    fireEvent.change(input, { target: { value: '学习React' } });
    fireEvent.click(screen.getByText('添加'));
    
    // 删除
    const deleteButton = screen.getByTitle('删除');
    fireEvent.click(deleteButton);
    
    expect(screen.queryByText('学习React')).not.toBeInTheDocument();
  });
});
```

### 2. 集成测试

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TodoApp from './TodoApp';

describe('TodoApp Integration', () => {
  test('完整的待办事项流程', async () => {
    render(<TodoApp />);
    
    // 添加待办事项
    const input = screen.getByPlaceholderText('添加新的待办事项...');
    fireEvent.change(input, { target: { value: '学习React' } });
    fireEvent.click(screen.getByText('添加'));
    
    // 验证添加成功
    expect(screen.getByText('学习React')).toBeInTheDocument();
    
    // 筛选已完成
    fireEvent.click(screen.getByText('已完成'));
    expect(screen.queryByText('学习React')).not.toBeInTheDocument();
    
    // 筛选全部
    fireEvent.click(screen.getByText('全部'));
    expect(screen.getByText('学习React')).toBeInTheDocument();
    
    // 标记完成
    fireEvent.click(screen.getByRole('checkbox'));
    
    // 筛选已完成
    fireEvent.click(screen.getByText('已完成'));
    expect(screen.getByText('学习React')).toBeInTheDocument();
    
    // 清除已完成
    fireEvent.click(screen.getByText(/清除已完成/));
    expect(screen.queryByText('学习React')).not.toBeInTheDocument();
  });
});
```

### 3. 性能测试

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import TodoList from './TodoList';

describe('TodoList Performance', () => {
  test('大量数据渲染性能', () => {
    const startTime = performance.now();
    
    // 创建大量数据
    const todos = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      text: `Todo ${i}`,
      completed: i % 2 === 0
    }));
    
    render(<TodoList initialTodos={todos} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // 渲染时间应该在合理范围内
    expect(renderTime).toBeLessThan(100);
  });
  
  test('频繁更新性能', () => {
    render(<TodoList />);
    
    const input = screen.getByPlaceholderText('添加新的待办事项...');
    const addButton = screen.getByText('添加');
    
    const startTime = performance.now();
    
    // 频繁添加
    act(() => {
      for (let i = 0; i < 100; i++) {
        fireEvent.change(input, { target: { value: `Todo ${i}` } });
        fireEvent.click(addButton);
      }
    });
    
    const endTime = performance.now();
    const updateTime = endTime - startTime;
    
    // 更新时间应该在合理范围内
    expect(updateTime).toBeLessThan(1000);
  });
});
```

## 总结

TodoList组件是React面试中的经典题目，它涵盖了React开发的方方面面：

1. **组件设计**：如何合理拆分组件，设计组件接口
2. **状态管理**：如何管理复杂的应用状态
3. **性能优化**：如何避免不必要的重渲染
4. **用户体验**：如何提供良好的交互体验
5. **代码质量**：如何编写可维护的代码

通过深入理解和实现TodoList组件，可以掌握React开发的核心技能，为面试和实际项目开发打下坚实基础。 