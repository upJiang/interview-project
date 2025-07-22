import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * TodoList 组件 - React面试常见组件设计题
 *
 * 功能特性：
 * 1. 添加待办事项
 * 2. 删除待办事项
 * 3. 编辑待办事项
 * 4. 标记完成状态
 * 5. 筛选显示（全部/已完成/未完成）
 * 6. 批量操作
 * 7. 本地存储持久化
 * 8. 搜索功能
 *
 * 面试考察点：
 * 1. 组件状态管理
 * 2. 事件处理
 * 3. 性能优化（useCallback, useMemo）
 * 4. 副作用处理（useEffect）
 * 5. 组件拆分和复用
 * 6. 受控组件设计
 * 7. 键盘事件处理
 * 8. 条件渲染
 */

// 筛选类型枚举
const FILTER_TYPES = {
  ALL: "all",
  ACTIVE: "active",
  COMPLETED: "completed",
};

// 单个待办事项组件
const TodoItem = React.memo(
  ({
    todo,
    onToggle,
    onDelete,
    onEdit,
    isEditing,
    onStartEdit,
    onCancelEdit,
  }) => {
    const [editText, setEditText] = useState(todo.text);
    const editInputRef = useRef(null);

    // 当开始编辑时，聚焦到输入框
    useEffect(() => {
      if (isEditing && editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, [isEditing]);

    // 处理编辑提交
    const handleEditSubmit = useCallback(() => {
      const trimmedText = editText.trim();
      if (trimmedText) {
        onEdit(todo.id, trimmedText);
      } else {
        onDelete(todo.id);
      }
    }, [todo.id, editText, onEdit, onDelete]);

    // 处理键盘事件
    const handleKeyDown = useCallback(
      (e) => {
        if (e.key === "Enter") {
          handleEditSubmit();
        } else if (e.key === "Escape") {
          setEditText(todo.text);
          onCancelEdit();
        }
      },
      [handleEditSubmit, todo.text, onCancelEdit]
    );

    // 处理编辑取消
    const handleEditCancel = useCallback(() => {
      setEditText(todo.text);
      onCancelEdit();
    }, [todo.text, onCancelEdit]);

    if (isEditing) {
      return (
        <li className="todo-item editing">
          <input
            ref={editInputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleKeyDown}
            className="edit-input"
          />
        </li>
      );
    }

    return (
      <li className={`todo-item ${todo.completed ? "completed" : ""}`}>
        <div className="todo-content">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            className="todo-checkbox"
          />
          <span
            className="todo-text"
            onDoubleClick={() => onStartEdit(todo.id)}
          >
            {todo.text}
          </span>
          <div className="todo-actions">
            <button
              onClick={() => onStartEdit(todo.id)}
              className="edit-btn"
              title="编辑"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="delete-btn"
              title="删除"
            >
              🗑️
            </button>
          </div>
        </div>
      </li>
    );
  }
);

// 筛选按钮组件
const FilterButton = React.memo(
  ({ filter, currentFilter, onFilterChange, children }) => (
    <button
      className={`filter-btn ${currentFilter === filter ? "active" : ""}`}
      onClick={() => onFilterChange(filter)}
    >
      {children}
    </button>
  )
);

// 统计信息组件
const TodoStats = React.memo(({ totalCount, completedCount, activeCount }) => (
  <div className="todo-stats">
    <span>总计: {totalCount}</span>
    <span>已完成: {completedCount}</span>
    <span>待完成: {activeCount}</span>
  </div>
));

// 主要的TodoList组件
const TodoList = () => {
  // 状态管理
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState(FILTER_TYPES.ALL);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectAll, setSelectAll] = useState(false);

  // 引用
  const inputRef = useRef(null);
  const nextId = useRef(1);

  // 从本地存储加载数据
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        setTodos(parsedTodos);
        // 更新nextId
        const maxId = Math.max(...parsedTodos.map((todo) => todo.id), 0);
        nextId.current = maxId + 1;
      } catch (error) {
        console.error("Failed to load todos from localStorage:", error);
      }
    }
  }, []);

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  // 添加待办事项
  const addTodo = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      const newTodo = {
        id: nextId.current++,
        text: trimmedValue,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTodos((prev) => [...prev, newTodo]);
      setInputValue("");
      inputRef.current?.focus();
    }
  }, [inputValue]);

  // 删除待办事项
  const deleteTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    setEditingId(null);
  }, []);

  // 切换完成状态
  const toggleTodo = useCallback((id) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  // 编辑待办事项
  const editTodo = useCallback((id, newText) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, text: newText } : todo))
    );
    setEditingId(null);
  }, []);

  // 开始编辑
  const startEdit = useCallback((id) => {
    setEditingId(id);
  }, []);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  // 处理输入框键盘事件
  const handleInputKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        addTodo();
      }
    },
    [addTodo]
  );

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setTodos((prev) =>
      prev.map((todo) => ({ ...todo, completed: newSelectAll }))
    );
  }, [selectAll]);

  // 清除已完成的待办事项
  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  }, []);

  // 筛选和搜索后的待办事项
  const filteredTodos = useMemo(() => {
    let result = todos;

    // 根据搜索词筛选
    if (searchTerm) {
      result = result.filter((todo) =>
        todo.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 根据完成状态筛选
    switch (filter) {
      case FILTER_TYPES.ACTIVE:
        result = result.filter((todo) => !todo.completed);
        break;
      case FILTER_TYPES.COMPLETED:
        result = result.filter((todo) => todo.completed);
        break;
      default:
        break;
    }

    return result;
  }, [todos, filter, searchTerm]);

  // 统计信息
  const stats = useMemo(() => {
    const totalCount = todos.length;
    const completedCount = todos.filter((todo) => todo.completed).length;
    const activeCount = totalCount - completedCount;

    return { totalCount, completedCount, activeCount };
  }, [todos]);

  // 更新全选状态
  useEffect(() => {
    const { totalCount, completedCount } = stats;
    setSelectAll(totalCount > 0 && completedCount === totalCount);
  }, [stats]);

  return (
    <div className="todo-app">
      <header className="todo-header">
        <h1>待办事项</h1>

        {/* 添加待办事项 */}
        <div className="add-todo">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="添加新的待办事项..."
            className="todo-input"
          />
          <button onClick={addTodo} className="add-btn">
            添加
          </button>
        </div>

        {/* 搜索框 */}
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索待办事项..."
            className="search-input"
          />
        </div>
      </header>

      <main className="todo-main">
        {/* 批量操作 */}
        {todos.length > 0 && (
          <div className="bulk-actions">
            <label className="select-all">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
              />
              全选
            </label>
            <button
              onClick={clearCompleted}
              className="clear-completed"
              disabled={stats.completedCount === 0}
            >
              清除已完成 ({stats.completedCount})
            </button>
          </div>
        )}

        {/* 待办事项列表 */}
        <ul className="todo-list">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={editTodo}
              isEditing={editingId === todo.id}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
            />
          ))}
        </ul>

        {/* 空状态 */}
        {filteredTodos.length === 0 && todos.length > 0 && (
          <div className="empty-state">
            <p>没有找到匹配的待办事项</p>
          </div>
        )}

        {todos.length === 0 && (
          <div className="empty-state">
            <p>还没有待办事项，添加一个开始吧！</p>
          </div>
        )}
      </main>

      <footer className="todo-footer">
        {/* 筛选按钮 */}
        <div className="filters">
          <FilterButton
            filter={FILTER_TYPES.ALL}
            currentFilter={filter}
            onFilterChange={setFilter}
          >
            全部
          </FilterButton>
          <FilterButton
            filter={FILTER_TYPES.ACTIVE}
            currentFilter={filter}
            onFilterChange={setFilter}
          >
            待完成
          </FilterButton>
          <FilterButton
            filter={FILTER_TYPES.COMPLETED}
            currentFilter={filter}
            onFilterChange={setFilter}
          >
            已完成
          </FilterButton>
        </div>

        {/* 统计信息 */}
        <TodoStats {...stats} />
      </footer>
    </div>
  );
};

// 样式组件（在实际项目中应该使用CSS文件）
const TodoListWithStyles = () => {
  useEffect(() => {
    // 动态添加样式
    const style = document.createElement("style");
    style.textContent = `
      .todo-app {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      .todo-header {
        margin-bottom: 30px;
      }

      .todo-header h1 {
        text-align: center;
        color: #333;
        margin-bottom: 30px;
        font-size: 2.5em;
        font-weight: 300;
      }

      .add-todo {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }

      .todo-input, .search-input {
        flex: 1;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
        outline: none;
        transition: border-color 0.3s;
      }

      .todo-input:focus, .search-input:focus {
        border-color: #4CAF50;
      }

      .add-btn {
        padding: 12px 24px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s;
      }

      .add-btn:hover {
        background-color: #45a049;
      }

      .search-box {
        margin-bottom: 20px;
      }

      .bulk-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background-color: #f5f5f5;
        border-radius: 4px;
        margin-bottom: 20px;
      }

      .select-all {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .clear-completed {
        padding: 8px 16px;
        background-color: #ff4444;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .clear-completed:hover:not(:disabled) {
        background-color: #cc0000;
      }

      .clear-completed:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }

      .todo-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .todo-item {
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 10px;
        background-color: white;
        transition: all 0.3s;
      }

      .todo-item:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .todo-item.completed {
        opacity: 0.6;
        background-color: #f9f9f9;
      }

      .todo-content {
        display: flex;
        align-items: center;
        padding: 15px;
        gap: 12px;
      }

      .todo-checkbox {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .todo-text {
        flex: 1;
        font-size: 16px;
        cursor: pointer;
        user-select: none;
      }

      .todo-item.completed .todo-text {
        text-decoration: line-through;
        color: #888;
      }

      .todo-actions {
        display: flex;
        gap: 8px;
      }

      .edit-btn, .delete-btn {
        padding: 6px 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.3s;
      }

      .edit-btn {
        background-color: #2196F3;
        color: white;
      }

      .edit-btn:hover {
        background-color: #1976D2;
      }

      .delete-btn {
        background-color: #f44336;
        color: white;
      }

      .delete-btn:hover {
        background-color: #d32f2f;
      }

      .edit-input {
        width: 100%;
        padding: 10px;
        border: 2px solid #4CAF50;
        border-radius: 4px;
        font-size: 16px;
        outline: none;
      }

      .filters {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-bottom: 20px;
      }

      .filter-btn {
        padding: 8px 16px;
        border: 2px solid #ddd;
        background-color: white;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;
      }

      .filter-btn.active {
        background-color: #4CAF50;
        color: white;
        border-color: #4CAF50;
      }

      .filter-btn:hover {
        border-color: #4CAF50;
      }

      .todo-stats {
        display: flex;
        justify-content: center;
        gap: 20px;
        font-size: 14px;
        color: #666;
      }

      .empty-state {
        text-align: center;
        padding: 40px;
        color: #666;
        font-style: italic;
      }

      .todo-footer {
        border-top: 1px solid #ddd;
        padding-top: 20px;
        margin-top: 30px;
      }

      @media (max-width: 600px) {
        .todo-app {
          padding: 10px;
        }
        
        .add-todo {
          flex-direction: column;
        }
        
        .bulk-actions {
          flex-direction: column;
          gap: 10px;
        }
        
        .filters {
          flex-direction: column;
        }
        
        .todo-stats {
          flex-direction: column;
          gap: 10px;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <TodoList />;
};

// 高级版本：支持拖拽排序
const TodoListWithDragDrop = () => {
  const [todos, setTodos] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = useCallback((e, todo) => {
    setDraggedItem(todo);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e, targetTodo) => {
      e.preventDefault();

      if (!draggedItem || draggedItem.id === targetTodo.id) {
        return;
      }

      setTodos((prev) => {
        const newTodos = [...prev];
        const draggedIndex = newTodos.findIndex(
          (todo) => todo.id === draggedItem.id
        );
        const targetIndex = newTodos.findIndex(
          (todo) => todo.id === targetTodo.id
        );

        // 移除拖拽的项目
        const [removed] = newTodos.splice(draggedIndex, 1);
        // 插入到目标位置
        newTodos.splice(targetIndex, 0, removed);

        return newTodos;
      });

      setDraggedItem(null);
    },
    [draggedItem]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  // 其他功能与基础版本相同...
  return <div>拖拽排序版本的TodoList（实现略）</div>;
};

// 性能优化版本
const OptimizedTodoList = () => {
  // 使用useReducer管理复杂状态
  const todoReducer = useCallback((state, action) => {
    switch (action.type) {
      case "ADD_TODO":
        return [...state, action.payload];
      case "DELETE_TODO":
        return state.filter((todo) => todo.id !== action.payload);
      case "TOGGLE_TODO":
        return state.map((todo) =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        );
      case "EDIT_TODO":
        return state.map((todo) =>
          todo.id === action.payload.id
            ? { ...todo, text: action.payload.text }
            : todo
        );
      case "LOAD_TODOS":
        return action.payload;
      default:
        return state;
    }
  }, []);

  // 使用虚拟化处理大量数据
  // 这里只是示例，实际需要使用react-window或react-virtualized
  return <div>性能优化版本的TodoList（实现略）</div>;
};

export default TodoListWithStyles;

export {
  FILTER_TYPES,
  FilterButton,
  OptimizedTodoList,
  TodoItem,
  TodoList,
  TodoListWithDragDrop,
  TodoStats,
};

/**
 * 面试要点总结：
 *
 * 1. 状态管理：
 *    - 使用useState管理组件状态
 *    - 状态的合理拆分和组织
 *    - 避免不必要的状态更新
 *
 * 2. 性能优化：
 *    - 使用React.memo避免不必要的重渲染
 *    - 使用useCallback缓存函数
 *    - 使用useMemo缓存计算结果
 *    - 合理使用key属性
 *
 * 3. 事件处理：
 *    - 键盘事件处理（Enter、Escape）
 *    - 表单提交处理
 *    - 事件委托和冒泡
 *
 * 4. 副作用管理：
 *    - 使用useEffect处理副作用
 *    - 本地存储的读写
 *    - 组件挂载和卸载
 *
 * 5. 组件设计：
 *    - 组件的合理拆分
 *    - 单一职责原则
 *    - 可复用性设计
 *    - 受控组件模式
 *
 * 6. 用户体验：
 *    - 键盘导航支持
 *    - 焦点管理
 *    - 加载状态和错误处理
 *    - 响应式设计
 *
 * 7. 数据流：
 *    - 单向数据流
 *    - 状态提升
 *    - 事件向上传递
 */
