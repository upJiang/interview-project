/**
 * React集成插件
 * 提供React错误边界组件和错误处理工具
 */

import { captureException } from '../index';

/**
 * 错误边界组件HOC
 * @param {React.Component} Component 要包装的组件
 * @param {Object} options 选项
 * @returns {React.Component} 包装后的错误边界组件
 */
export function withErrorBoundary(Component, options = {}) {
  if (typeof React === 'undefined' || !React.Component) {
    console.warn('[MiniSentry] React未找到，无法创建错误边界');
    return Component;
  }
  
  const React = window.React;
  
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
      this.componentDidCatch = this.componentDidCatch.bind(this);
      this.resetError = this.resetError.bind(this);
      
      this.options = {
        fallback: null,
        onError: null,
        ...options
      };
    }
    
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
      try {
        // 上报错误
        captureException(error, {
          tags: { framework: 'react' },
          extra: {
            componentStack: errorInfo?.componentStack,
            componentName: Component.displayName || Component.name || 'UnknownComponent'
          }
        });
        
        // 调用自定义错误处理
        if (typeof this.options.onError === 'function') {
          this.options.onError(error, errorInfo, this);
        }
      } catch (e) {
        console.error('[MiniSentry] 错误边界处理异常:', e);
      }
    }
    
    resetError() {
      this.setState({ hasError: false, error: null });
    }
    
    render() {
      if (this.state.hasError) {
        // 渲染备用UI
        if (this.options.fallback) {
          if (typeof this.options.fallback === 'function') {
            return this.options.fallback({
              error: this.state.error,
              componentStack: this.state.componentStack,
              resetError: this.resetError
            });
          }
          return this.options.fallback;
        }
        
        // 默认错误UI
        return (
          <div style={{ 
            padding: '20px', 
            border: '1px solid #ffcccc',
            borderRadius: '4px',
            backgroundColor: '#fff5f5' 
          }}>
            <h2 style={{ color: '#cc0000' }}>组件出错了</h2>
            <p>此组件发生错误，已向开发团队上报</p>
            <button 
              onClick={this.resetError}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff4d4f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              重试
            </button>
          </div>
        );
      }
      
      return <Component {...this.props} />;
    }
  }
  
  // 设置displayName
  const componentName = Component.displayName || Component.name || 'Component';
  ErrorBoundary.displayName = `ErrorBoundary(${componentName})`;
  
  return ErrorBoundary;
}

/**
 * 创建错误边界组件
 * @param {Object} options 错误边界选项
 * @returns {React.Component} 错误边界组件
 */
export function ErrorBoundary(options = {}) {
  if (typeof React === 'undefined' || !React.Component) {
    console.warn('[MiniSentry] React未找到，无法创建错误边界');
    return () => null;
  }
  
  const React = window.React;
  
  class MiniSentryErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
      this.resetError = this.resetError.bind(this);
      
      this.options = {
        ...options,
        ...props
      };
    }
    
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
      try {
        // 上报错误
        captureException(error, {
          tags: { framework: 'react' },
          extra: {
            componentStack: errorInfo?.componentStack,
            props: this.props
          }
        });
        
        // 调用自定义错误处理
        if (typeof this.options.onError === 'function') {
          this.options.onError(error, errorInfo, this);
        }
      } catch (e) {
        console.error('[MiniSentry] 错误边界处理异常:', e);
      }
    }
    
    resetError() {
      this.setState({ hasError: false, error: null });
    }
    
    render() {
      if (this.state.hasError) {
        // 渲染备用UI
        if (this.props.fallback) {
          if (typeof this.props.fallback === 'function') {
            return this.props.fallback({
              error: this.state.error,
              resetError: this.resetError
            });
          }
          return this.props.fallback;
        }
        
        // 默认错误UI
        return (
          <div style={{ 
            padding: '20px', 
            border: '1px solid #ffcccc',
            borderRadius: '4px',
            backgroundColor: '#fff5f5' 
          }}>
            <h2 style={{ color: '#cc0000' }}>组件出错了</h2>
            <p>此组件发生错误，已向开发团队上报</p>
            <button 
              onClick={this.resetError}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff4d4f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              重试
            </button>
          </div>
        );
      }
      
      return this.props.children;
    }
  }
  
  MiniSentryErrorBoundary.displayName = 'MiniSentryErrorBoundary';
  
  return MiniSentryErrorBoundary;
}

/**
 * 手动上报React错误
 * @param {Error} error 错误对象
 * @param {Object} errorInfo 错误信息
 */
export function reportReactError(error, errorInfo = {}) {
  captureException(error, {
    tags: { framework: 'react' },
    extra: errorInfo
  });
}

// 创建错误处理函数
export const reactErrorHandler = reportReactError; 