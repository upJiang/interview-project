import React, {
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Modal 组件设计
 *
 * 核心功能：
 * 1. 基础模态框显示/隐藏
 * 2. 可访问性支持
 * 3. 键盘交互
 * 4. 焦点管理
 * 5. 动画效果
 * 6. 自定义样式
 * 7. 嵌套模态框
 * 8. 异步内容加载
 *
 * 面试考察点：
 * 1. 组件设计模式
 * 2. 可访问性 (a11y)
 * 3. 事件处理
 * 4. 性能优化
 * 5. 状态管理
 * 6. 组件通信
 * 7. 生命周期管理
 * 8. 错误边界
 */

// Modal 上下文
const ModalContext = createContext();

// 使用 Portal 渲染到 body
const Portal = ({ children, container }) => {
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef(null);

  useEffect(() => {
    const portalElement = container || document.body;
    const portalDiv = document.createElement("div");
    portalDiv.className = "modal-portal";
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

// 基础 Modal 组件
const Modal = forwardRef(
  (
    {
      isOpen = false,
      onClose,
      title,
      children,
      size = "medium",
      centered = true,
      closable = true,
      maskClosable = true,
      keyboard = true,
      destroyOnClose = false,
      className = "",
      style = {},
      maskStyle = {},
      bodyStyle = {},
      animation = "fade",
      zIndex = 1000,
      container,
      onAfterOpen,
      onAfterClose,
      confirmLoading = false,
      okText = "确定",
      cancelText = "取消",
      onOk,
      onCancel,
      footer,
      headerStyle = {},
      footerStyle = {},
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = useState(isOpen);
    const [animating, setAnimating] = useState(false);
    const modalRef = useRef(null);
    const previousFocusRef = useRef(null);
    const firstFocusableRef = useRef(null);
    const lastFocusableRef = useRef(null);

    // 获取可聚焦元素
    const getFocusableElements = useCallback(() => {
      if (!modalRef.current) return [];

      const focusableSelectors = [
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "a[href]",
        '[tabindex]:not([tabindex="-1"])',
      ];

      return Array.from(
        modalRef.current.querySelectorAll(focusableSelectors.join(", "))
      );
    }, []);

    // 焦点管理
    const manageFocus = useCallback(() => {
      if (!visible) return;

      const focusableElements = getFocusableElements();
      firstFocusableRef.current = focusableElements[0];
      lastFocusableRef.current =
        focusableElements[focusableElements.length - 1];

      // 聚焦到第一个可聚焦元素
      if (firstFocusableRef.current) {
        firstFocusableRef.current.focus();
      }
    }, [visible, getFocusableElements]);

    // 键盘事件处理
    const handleKeyDown = useCallback(
      (e) => {
        if (!visible) return;

        switch (e.key) {
          case "Escape":
            if (keyboard && closable) {
              onClose?.();
            }
            break;
          case "Tab":
            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) return;

            if (e.shiftKey) {
              // Shift + Tab
              if (document.activeElement === firstFocusableRef.current) {
                e.preventDefault();
                lastFocusableRef.current?.focus();
              }
            } else {
              // Tab
              if (document.activeElement === lastFocusableRef.current) {
                e.preventDefault();
                firstFocusableRef.current?.focus();
              }
            }
            break;
        }
      },
      [visible, keyboard, closable, onClose, getFocusableElements]
    );

    // 点击遮罩关闭
    const handleMaskClick = useCallback(
      (e) => {
        if (maskClosable && e.target === e.currentTarget) {
          onClose?.();
        }
      },
      [maskClosable, onClose]
    );

    // 处理确定按钮
    const handleOk = useCallback(async () => {
      if (onOk) {
        try {
          await onOk();
        } catch (error) {
          console.error("Modal onOk error:", error);
        }
      } else {
        onClose?.();
      }
    }, [onOk, onClose]);

    // 处理取消按钮
    const handleCancel = useCallback(() => {
      if (onCancel) {
        onCancel();
      } else {
        onClose?.();
      }
    }, [onCancel, onClose]);

    // 暴露给父组件的方法
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          manageFocus();
        },
        blur: () => {
          if (previousFocusRef.current) {
            previousFocusRef.current.focus();
          }
        },
      }),
      [manageFocus]
    );

    // 监听 isOpen 变化
    useEffect(() => {
      if (isOpen && !visible) {
        // 打开模态框
        previousFocusRef.current = document.activeElement;
        setAnimating(true);
        setVisible(true);

        // 防止页面滚动
        document.body.style.overflow = "hidden";

        setTimeout(() => {
          setAnimating(false);
          manageFocus();
          onAfterOpen?.();
        }, 300);
      } else if (!isOpen && visible) {
        // 关闭模态框
        setAnimating(true);

        setTimeout(() => {
          setVisible(false);
          setAnimating(false);

          // 恢复页面滚动
          document.body.style.overflow = "";

          // 恢复焦点
          if (previousFocusRef.current) {
            previousFocusRef.current.focus();
          }

          onAfterClose?.();
        }, 300);
      }
    }, [isOpen, visible, manageFocus, onAfterOpen, onAfterClose]);

    // 键盘事件监听
    useEffect(() => {
      if (visible) {
        document.addEventListener("keydown", handleKeyDown);
        return () => {
          document.removeEventListener("keydown", handleKeyDown);
        };
      }
    }, [visible, handleKeyDown]);

    // 清理函数
    useEffect(() => {
      return () => {
        document.body.style.overflow = "";
      };
    }, []);

    // 大小样式
    const sizeStyles = useMemo(() => {
      const sizes = {
        small: { width: "400px", maxWidth: "90vw" },
        medium: { width: "600px", maxWidth: "90vw" },
        large: { width: "800px", maxWidth: "90vw" },
        fullscreen: { width: "100vw", height: "100vh", maxWidth: "none" },
      };
      return sizes[size] || sizes.medium;
    }, [size]);

    // 动画样式
    const animationStyles = useMemo(() => {
      const animations = {
        fade: {
          entering: { opacity: 0 },
          entered: { opacity: 1 },
          exiting: { opacity: 0 },
        },
        slide: {
          entering: { transform: "translateY(-50px)", opacity: 0 },
          entered: { transform: "translateY(0)", opacity: 1 },
          exiting: { transform: "translateY(-50px)", opacity: 0 },
        },
        zoom: {
          entering: { transform: "scale(0.9)", opacity: 0 },
          entered: { transform: "scale(1)", opacity: 1 },
          exiting: { transform: "scale(0.9)", opacity: 0 },
        },
      };
      return animations[animation] || animations.fade;
    }, [animation]);

    // 渲染内容
    const renderContent = () => {
      const animationState = animating
        ? isOpen
          ? "entering"
          : "exiting"
        : "entered";

      return (
        <div
          className={`modal-mask ${className}`}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: centered ? "center" : "flex-start",
            justifyContent: "center",
            zIndex,
            transition: "opacity 0.3s ease",
            opacity: animationState === "entered" ? 1 : 0,
            ...maskStyle,
          }}
          onClick={handleMaskClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby="modal-body"
        >
          <div
            ref={modalRef}
            className="modal-content"
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              transition: "all 0.3s ease",
              ...sizeStyles,
              ...animationStyles[animationState],
              ...style,
            }}
            {...props}
          >
            {/* 头部 */}
            {(title || closable) && (
              <div
                className="modal-header"
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  ...headerStyle,
                }}
              >
                {title && (
                  <h3
                    id="modal-title"
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 500,
                      color: "#000",
                    }}
                  >
                    {title}
                  </h3>
                )}
                {closable && (
                  <button
                    className="modal-close"
                    onClick={onClose}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "18px",
                      cursor: "pointer",
                      padding: "4px",
                      color: "#999",
                    }}
                    aria-label="关闭"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {/* 主体内容 */}
            <div
              id="modal-body"
              className="modal-body"
              style={{
                padding: "24px",
                flex: 1,
                overflow: "auto",
                ...bodyStyle,
              }}
            >
              {children}
            </div>

            {/* 底部 */}
            {footer !== null && (
              <div
                className="modal-footer"
                style={{
                  padding: "12px 24px",
                  borderTop: "1px solid #f0f0f0",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  ...footerStyle,
                }}
              >
                {footer || (
                  <>
                    <button
                      onClick={handleCancel}
                      style={{
                        padding: "6px 16px",
                        border: "1px solid #d9d9d9",
                        borderRadius: "4px",
                        background: "white",
                        cursor: "pointer",
                      }}
                    >
                      {cancelText}
                    </button>
                    <button
                      onClick={handleOk}
                      disabled={confirmLoading}
                      style={{
                        padding: "6px 16px",
                        border: "1px solid #1890ff",
                        borderRadius: "4px",
                        background: "#1890ff",
                        color: "white",
                        cursor: confirmLoading ? "not-allowed" : "pointer",
                        opacity: confirmLoading ? 0.6 : 1,
                      }}
                    >
                      {confirmLoading ? "加载中..." : okText}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      );
    };

    if (!visible && !animating) {
      return destroyOnClose ? null : <div style={{ display: "none" }} />;
    }

    return (
      <Portal container={container}>
        <ModalContext.Provider value={{ onClose, visible }}>
          {renderContent()}
        </ModalContext.Provider>
      </Portal>
    );
  }
);

Modal.displayName = "Modal";

// 高级 Modal 组件
const AdvancedModal = forwardRef(
  (
    {
      loading = false,
      loadingText = "加载中...",
      error = null,
      onRetry,
      maxWidth = "90vw",
      maxHeight = "90vh",
      resizable = false,
      draggable = false,
      fullscreenButton = false,
      ...props
    },
    ref
  ) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const modalRef = useRef(null);

    // 拖拽功能
    const handleMouseDown = useCallback(
      (e) => {
        if (!draggable || isFullscreen) return;

        setIsDragging(true);
        const rect = modalRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const handleMouseMove = (e) => {
          setPosition({
            x: e.clientX - offsetX,
            y: e.clientY - offsetY,
          });
        };

        const handleMouseUp = () => {
          setIsDragging(false);
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      },
      [draggable, isFullscreen]
    );

    // 切换全屏
    const toggleFullscreen = useCallback(() => {
      setIsFullscreen((prev) => !prev);
    }, []);

    // 渲染加载状态
    const renderLoading = () => (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #1890ff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p>{loadingText}</p>
      </div>
    );

    // 渲染错误状态
    const renderError = () => (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div
          style={{ color: "#ff4d4f", fontSize: "48px", marginBottom: "16px" }}
        >
          ⚠️
        </div>
        <p style={{ color: "#ff4d4f", marginBottom: "16px" }}>
          {error?.message || "加载失败"}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: "8px 16px",
              background: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            重试
          </button>
        )}
      </div>
    );

    const modalStyle = {
      ...props.style,
      ...(isFullscreen && {
        width: "100vw",
        height: "100vh",
        maxWidth: "none",
        maxHeight: "none",
      }),
      ...(draggable &&
        !isFullscreen && {
          transform: `translate(${position.x}px, ${position.y}px)`,
        }),
    };

    return (
      <Modal
        {...props}
        ref={ref}
        style={modalStyle}
        headerStyle={{
          ...props.headerStyle,
          ...(draggable && { cursor: isDragging ? "grabbing" : "grab" }),
        }}
        title={
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
            onMouseDown={handleMouseDown}
          >
            {props.title}
            {fullscreenButton && (
              <button
                onClick={toggleFullscreen}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                title={isFullscreen ? "退出全屏" : "全屏"}
              >
                {isFullscreen ? "🗗" : "🗖"}
              </button>
            )}
          </div>
        }
      >
        {loading ? renderLoading() : error ? renderError() : props.children}
      </Modal>
    );
  }
);

AdvancedModal.displayName = "AdvancedModal";

// 确认对话框
const ConfirmModal = ({
  title = "确认",
  content,
  onConfirm,
  onCancel,
  confirmText = "确定",
  cancelText = "取消",
  type = "default",
  ...props
}) => {
  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  const colors = {
    info: "#1890ff",
    success: "#52c41a",
    warning: "#faad14",
    error: "#ff4d4f",
  };

  return (
    <Modal
      {...props}
      title={title}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {type !== "default" && (
          <div
            style={{
              fontSize: "22px",
              color: colors[type],
              marginTop: "2px",
            }}
          >
            {icons[type]}
          </div>
        )}
        <div style={{ flex: 1 }}>
          {typeof content === "string" ? <p>{content}</p> : content}
        </div>
      </div>
    </Modal>
  );
};

// 使用示例
const BasicModalExample = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    setLoading(true);
    // 模拟异步操作
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    setVisible(false);
  };

  return (
    <div>
      <h3>基础模态框示例</h3>
      <button onClick={() => setVisible(true)}>打开模态框</button>

      <Modal
        isOpen={visible}
        onClose={() => setVisible(false)}
        title="基础模态框"
        confirmLoading={loading}
        onOk={handleOk}
      >
        <p>这是一个基础的模态框示例。</p>
        <p>支持键盘导航、焦点管理和可访问性。</p>
      </Modal>
    </div>
  );
};

const AdvancedModalExample = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpen = () => {
    setVisible(true);
    setLoading(true);
    setError(null);

    // 模拟数据加载
    setTimeout(() => {
      if (Math.random() > 0.7) {
        setError(new Error("数据加载失败"));
      }
      setLoading(false);
    }, 2000);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div>
      <h3>高级模态框示例</h3>
      <button onClick={handleOpen}>打开高级模态框</button>

      <AdvancedModal
        isOpen={visible}
        onClose={() => setVisible(false)}
        title="高级模态框"
        loading={loading}
        error={error}
        onRetry={handleRetry}
        draggable
        fullscreenButton
        size="large"
      >
        <div>
          <h4>内容区域</h4>
          <p>这是一个高级模态框，支持：</p>
          <ul>
            <li>拖拽移动</li>
            <li>全屏显示</li>
            <li>加载状态</li>
            <li>错误处理</li>
            <li>重试机制</li>
          </ul>
        </div>
      </AdvancedModal>
    </div>
  );
};

const ConfirmModalExample = () => {
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState("warning");

  const showConfirm = (confirmType) => {
    setType(confirmType);
    setVisible(true);
  };

  const handleConfirm = () => {
    console.log("用户确认了操作");
    setVisible(false);
  };

  return (
    <div>
      <h3>确认对话框示例</h3>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => showConfirm("info")}>信息确认</button>
        <button onClick={() => showConfirm("success")}>成功确认</button>
        <button onClick={() => showConfirm("warning")}>警告确认</button>
        <button onClick={() => showConfirm("error")}>错误确认</button>
      </div>

      <ConfirmModal
        isOpen={visible}
        onClose={() => setVisible(false)}
        type={type}
        title={`${type.charAt(0).toUpperCase() + type.slice(1)} 确认`}
        content="您确定要执行此操作吗？此操作不可撤销。"
        onConfirm={handleConfirm}
      />
    </div>
  );
};

const NestedModalExample = () => {
  const [firstVisible, setFirstVisible] = useState(false);
  const [secondVisible, setSecondVisible] = useState(false);

  return (
    <div>
      <h3>嵌套模态框示例</h3>
      <button onClick={() => setFirstVisible(true)}>打开第一个模态框</button>

      <Modal
        isOpen={firstVisible}
        onClose={() => setFirstVisible(false)}
        title="第一个模态框"
        zIndex={1000}
      >
        <p>这是第一个模态框的内容。</p>
        <button onClick={() => setSecondVisible(true)}>打开第二个模态框</button>
      </Modal>

      <Modal
        isOpen={secondVisible}
        onClose={() => setSecondVisible(false)}
        title="第二个模态框"
        zIndex={1001}
      >
        <p>这是第二个模态框的内容。</p>
        <p>它的 z-index 更高，所以显示在第一个模态框之上。</p>
      </Modal>
    </div>
  );
};

// 主要演示组件
const ModalDemo = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Modal 组件设计和使用示例</h1>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .modal-portal {
          position: relative;
        }
        
        .modal-mask {
          animation: fadeIn 0.3s ease;
        }
        
        .modal-content {
          animation: slideIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            transform: translateY(-50px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div style={{ marginBottom: "40px" }}>
        <BasicModalExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <AdvancedModalExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <ConfirmModalExample />
      </div>

      <div style={{ marginBottom: "40px" }}>
        <NestedModalExample />
      </div>
    </div>
  );
};

export default ModalDemo;

export {
  AdvancedModal,
  AdvancedModalExample,
  BasicModalExample,
  ConfirmModal,
  ConfirmModalExample,
  Modal,
  ModalContext,
  NestedModalExample,
  Portal,
};

/**
 * 面试要点总结：
 *
 * 1. 组件设计原则：
 *    - 单一职责原则
 *    - 开闭原则
 *    - 可复用性
 *    - 可扩展性
 *
 * 2. 可访问性 (a11y)：
 *    - ARIA 属性
 *    - 键盘导航
 *    - 焦点管理
 *    - 屏幕阅读器支持
 *
 * 3. 性能优化：
 *    - Portal 渲染
 *    - 懒加载
 *    - 事件委托
 *    - 内存泄漏防护
 *
 * 4. 状态管理：
 *    - 本地状态
 *    - 状态提升
 *    - Context API
 *    - 状态同步
 *
 * 5. 用户体验：
 *    - 动画效果
 *    - 加载状态
 *    - 错误处理
 *    - 响应式设计
 */
