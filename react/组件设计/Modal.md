# Modal 组件设计与实现

## 概述

Modal（模态框）是一种常见的用户界面组件，用于在当前页面之上显示内容，通常用于表单、确认对话框、详细信息展示等场景。Modal 组件的设计涉及多个重要的前端技术概念，是 React 面试中的高频考察点。

## 核心知识点

### 1. Portal 技术

**概念**：Portal 提供了一种将子组件渲染到父组件 DOM 层次结构之外的方式。

**作用**：
- 解决 z-index 层级问题
- 避免父组件样式影响
- 实现真正的模态覆盖效果

```jsx
// Portal 实现
const Portal = ({ children, container }) => {
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef(null);
  
  useEffect(() => {
    const portalElement = container || document.body;
    const portalDiv = document.createElement('div');
    portalDiv.className = 'modal-portal';
    portalElement.appendChild(portalDiv);
    portalRef.current = portalDiv;
    setMounted(true);
    
    return () => {
      if (portalRef.current && portalRef.current.parentNode) {
        portalRef.current.parentNode.removeChild(portalRef.current);
      }
    };
  }, [container]);
  
  if (!mounted || !portalRef.current) {
    return null;
  }
  
  return ReactDOM.createPortal(children, portalRef.current);
};
```

### 2. 可访问性 (Accessibility)

**ARIA 属性**：
- `role="dialog"` - 标识为对话框
- `aria-modal="true"` - 标识为模态对话框
- `aria-labelledby` - 关联标题
- `aria-describedby` - 关联描述

**键盘导航**：
- `Tab` 键在可聚焦元素间循环
- `Shift+Tab` 反向导航
- `Escape` 键关闭模态框

**焦点管理**：
- 打开时聚焦到第一个可聚焦元素
- 关闭时恢复到触发元素
- 焦点陷阱（Focus Trap）

### 3. 事件处理

**键盘事件**：
```jsx
const handleKeyDown = useCallback((e) => {
  if (!visible) return;
  
  switch (e.key) {
    case 'Escape':
      if (keyboard && closable) {
        onClose?.();
      }
      break;
    case 'Tab':
      // 实现焦点陷阱
      const focusableElements = getFocusableElements();
      if (e.shiftKey) {
        // Shift + Tab 处理
      } else {
        // Tab 处理
      }
      break;
  }
}, [visible, keyboard, closable, onClose]);
```

**鼠标事件**：
```jsx
const handleMaskClick = useCallback((e) => {
  if (maskClosable && e.target === e.currentTarget) {
    onClose?.();
  }
}, [maskClosable, onClose]);
```

### 4. 动画与过渡

**CSS 过渡**：
```jsx
const animationStyles = useMemo(() => {
  const animations = {
    fade: {
      entering: { opacity: 0 },
      entered: { opacity: 1 },
      exiting: { opacity: 0 }
    },
    slide: {
      entering: { transform: 'translateY(-50px)', opacity: 0 },
      entered: { transform: 'translateY(0)', opacity: 1 },
      exiting: { transform: 'translateY(-50px)', opacity: 0 }
    }
  };
  return animations[animation] || animations.fade;
}, [animation]);
```

## 常见面试问题

### 1. 如何实现 Modal 组件？

**关键点**：
- 使用 Portal 渲染到 body
- 实现焦点管理和键盘导航
- 处理遮罩点击和 ESC 键关闭
- 支持动画效果

**代码示例**：
```jsx
const Modal = ({ isOpen, onClose, children, title }) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      // 聚焦到模态框
      modalRef.current?.focus();
    } else {
      // 恢复焦点
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <div className="modal-mask" onClick={handleMaskClick}>
      <div 
        ref={modalRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
};
```

### 2. 如何处理 Modal 的可访问性？

**关键点**：
- 正确使用 ARIA 属性
- 实现键盘导航
- 管理焦点状态
- 支持屏幕阅读器

**实现方式**：
```jsx
// 获取可聚焦元素
const getFocusableElements = useCallback(() => {
  if (!modalRef.current) return [];
  
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ];
  
  return Array.from(modalRef.current.querySelectorAll(focusableSelectors.join(', ')));
}, []);

// 焦点管理
const manageFocus = useCallback(() => {
  if (!visible) return;
  
  const focusableElements = getFocusableElements();
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}, [visible, getFocusableElements]);
```

### 3. 如何优化 Modal 的性能？

**关键点**：
- 懒加载和按需渲染
- 使用 React.memo 优化子组件
- 避免不必要的重新渲染
- 正确处理事件监听器

**优化策略**：
```jsx
// 使用 memo 优化
const Modal = React.memo(forwardRef(({ isOpen, children, ...props }, ref) => {
  // 只有在打开时才渲染内容
  if (!isOpen && !animating) {
    return destroyOnClose ? null : <div style={{ display: 'none' }} />;
  }
  
  return (
    <Portal>
      {/* Modal 内容 */}
    </Portal>
  );
}));

// 使用 useCallback 优化事件处理
const handleKeyDown = useCallback((e) => {
  // 键盘事件处理
}, [visible, keyboard, closable, onClose]);
```

### 4. 如何处理嵌套 Modal？

**关键点**：
- 管理多个 Modal 的 z-index
- 处理焦点管理
- 避免事件冲突

**实现方式**：
```jsx
// 使用 Context 管理 Modal 栈
const ModalContext = createContext();

const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([]);
  
  const addModal = (modal) => {
    setModals(prev => [...prev, modal]);
  };
  
  const removeModal = (id) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  };
  
  return (
    <ModalContext.Provider value={{ modals, addModal, removeModal }}>
      {children}
    </ModalContext.Provider>
  );
};
```

### 5. 如何实现 Modal 的动画效果？

**关键点**：
- 使用 CSS 过渡
- 管理动画状态
- 处理动画完成事件

**实现方式**：
```jsx
const [animating, setAnimating] = useState(false);

useEffect(() => {
  if (isOpen && !visible) {
    setAnimating(true);
    setVisible(true);
    
    setTimeout(() => {
      setAnimating(false);
      onAfterOpen?.();
    }, 300);
  } else if (!isOpen && visible) {
    setAnimating(true);
    
    setTimeout(() => {
      setVisible(false);
      setAnimating(false);
      onAfterClose?.();
    }, 300);
  }
}, [isOpen, visible, onAfterOpen, onAfterClose]);
```

## 实现原理

### 1. 基础版本

```jsx
const BasicModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
```

### 2. 增强功能

```jsx
const AdvancedModal = forwardRef(({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  centered = true,
  closable = true,
  maskClosable = true,
  keyboard = true,
  animation = 'fade',
  onAfterOpen,
  onAfterClose,
  ...props
}, ref) => {
  const [visible, setVisible] = useState(isOpen);
  const [animating, setAnimating] = useState(false);
  const modalRef = useRef(null);
  
  // 焦点管理
  const manageFocus = useCallback(() => {
    // 实现焦点管理逻辑
  }, []);
  
  // 键盘事件处理
  const handleKeyDown = useCallback((e) => {
    // 实现键盘事件处理
  }, []);
  
  // 动画控制
  useEffect(() => {
    // 实现动画控制逻辑
  }, [isOpen, visible]);
  
  // 渲染逻辑
  return (
    <Portal>
      <div className="modal-mask" onClick={handleMaskClick}>
        <div ref={modalRef} className="modal-content">
          {/* Modal 内容 */}
        </div>
      </div>
    </Portal>
  );
});
```

## 实际应用场景

### 1. 基础对话框

```jsx
const BasicDialog = () => {
  const [visible, setVisible] = useState(false);
  
  return (
    <>
      <button onClick={() => setVisible(true)}>
        打开对话框
      </button>
      
      <Modal
        isOpen={visible}
        onClose={() => setVisible(false)}
        title="基础对话框"
      >
        <p>这是一个基础的对话框内容。</p>
      </Modal>
    </>
  );
};
```

### 2. 表单对话框

```jsx
const FormDialog = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitForm(formData);
      setVisible(false);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <button onClick={() => setVisible(true)}>
        打开表单
      </button>
      
      <Modal
        isOpen={visible}
        onClose={() => setVisible(false)}
        title="表单对话框"
        confirmLoading={loading}
        onOk={handleSubmit}
      >
        <form>
          <input
            type="text"
            placeholder="请输入内容"
            value={formData.text || ''}
            onChange={(e) => setFormData({...formData, text: e.target.value})}
          />
        </form>
      </Modal>
    </>
  );
};
```

### 3. 确认对话框

```jsx
const ConfirmDialog = () => {
  const showConfirm = () => {
    const modal = Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这个项目吗？此操作不可撤销。',
      onOk: () => {
        console.log('用户确认删除');
      },
      onCancel: () => {
        console.log('用户取消删除');
      }
    });
  };
  
  return (
    <button onClick={showConfirm}>
      删除项目
    </button>
  );
};
```

## 高级用法

### 1. 拖拽模态框

```jsx
const DraggableModal = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const handleMouseMove = (e) => {
      setPosition({
        x: e.clientX - offsetX,
        y: e.clientY - offsetY
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <Modal
      draggable
      onMouseDown={handleMouseDown}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Modal 内容 */}
    </Modal>
  );
};
```

### 2. 响应式模态框

```jsx
const ResponsiveModal = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  return (
    <Modal
      size={isMobile ? 'fullscreen' : 'medium'}
      centered={!isMobile}
      style={{
        ...(isMobile && {
          margin: 0,
          maxWidth: '100vw',
          maxHeight: '100vh'
        })
      }}
    >
      {/* Modal 内容 */}
    </Modal>
  );
};
```

## 性能优化

### 1. 组件优化

```jsx
// 使用 React.memo 优化
const Modal = React.memo(({ isOpen, children, ...props }) => {
  // Modal 实现
});

// 使用 useCallback 优化事件处理
const handleClose = useCallback(() => {
  onClose?.();
}, [onClose]);

// 使用 useMemo 优化计算
const modalStyle = useMemo(() => {
  return {
    width: size === 'large' ? '800px' : '600px',
    maxWidth: '90vw'
  };
}, [size]);
```

### 2. 渲染优化

```jsx
// 延迟渲染
const LazyModal = ({ isOpen, children, ...props }) => {
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);
  
  if (!shouldRender) return null;
  
  return (
    <Modal isOpen={isOpen} {...props}>
      {children}
    </Modal>
  );
};
```

### 3. 内存管理

```jsx
const Modal = ({ isOpen, onClose }) => {
  useEffect(() => {
    // 清理函数
    return () => {
      // 清理事件监听器
      document.removeEventListener('keydown', handleKeyDown);
      // 恢复页面滚动
      document.body.style.overflow = '';
    };
  }, []);
  
  // 防止内存泄漏
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);
};
```

## 测试策略

### 1. 单元测试

```jsx
describe('Modal Component', () => {
  test('should render when isOpen is true', () => {
    render(<Modal isOpen={true}>Content</Modal>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
  
  test('should call onClose when ESC key is pressed', () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose}>Content</Modal>);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
  
  test('should manage focus correctly', () => {
    const { rerender } = render(<Modal isOpen={false}>Content</Modal>);
    
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    
    rerender(<Modal isOpen={true}>Content</Modal>);
    
    // 检查焦点是否转移到模态框
    expect(document.activeElement).not.toBe(button);
  });
});
```

### 2. 集成测试

```jsx
describe('Modal Integration', () => {
  test('should work with form submission', async () => {
    const onSubmit = jest.fn();
    
    render(
      <Modal isOpen={true} onOk={onSubmit}>
        <form>
          <input data-testid="input" />
          <button type="submit">Submit</button>
        </form>
      </Modal>
    );
    
    fireEvent.change(screen.getByTestId('input'), {
      target: { value: 'test' }
    });
    
    fireEvent.click(screen.getByText('确定'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
```

### 3. 可访问性测试

```jsx
describe('Modal Accessibility', () => {
  test('should have correct ARIA attributes', () => {
    render(<Modal isOpen={true} title="Test Modal">Content</Modal>);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby');
  });
  
  test('should trap focus within modal', () => {
    render(
      <Modal isOpen={true}>
        <button>First</button>
        <button>Last</button>
      </Modal>
    );
    
    const firstButton = screen.getByText('First');
    const lastButton = screen.getByText('Last');
    
    firstButton.focus();
    
    // 模拟 Tab 键
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(lastButton);
    
    // 模拟 Shift+Tab 键
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(firstButton);
  });
});
```

## 总结

Modal 组件的设计涉及多个重要的前端技术概念：

1. **Portal 技术** - 解决渲染层级问题
2. **可访问性** - 确保所有用户都能正常使用
3. **事件处理** - 处理键盘和鼠标交互
4. **动画效果** - 提升用户体验
5. **性能优化** - 确保组件高效运行
6. **状态管理** - 管理组件的各种状态

掌握这些概念不仅能帮助你实现一个完整的 Modal 组件，还能在面试中展示你对 React 和前端开发的深入理解。 