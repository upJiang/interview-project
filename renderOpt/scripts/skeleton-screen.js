/**
 * skeleton-screen.js
 * 骨架屏实现，用于首屏渲染时提供加载状态的视觉反馈
 */

class SkeletonScreen {
  /**
   * 创建骨架屏实例
   * @param {Object} options - 配置选项
   * @param {string} options.container - 容器选择器
   * @param {string} options.template - 骨架屏HTML模板
   * @param {string} options.loadingClass - 加载中的类名
   * @param {boolean} options.autoShow - 是否自动显示
   * @param {Function} options.onShow - 显示回调
   * @param {Function} options.onHide - 隐藏回调
   * @param {number} options.minDisplayTime - 最小显示时间(ms)
   * @param {string} options.animation - 动画类型
   * @param {boolean} options.removeOriginalContent - 是否移除原始内容
   */
  constructor(options = {}) {
    this.options = {
      container: 'body',
      template: null,
      loadingClass: 'skeleton-loading',
      autoShow: true,
      onShow: null,
      onHide: null,
      minDisplayTime: 500,
      animation: 'fade',
      removeOriginalContent: true,
      ...options
    };

    // 骨架屏元素
    this.skeletonElement = null;
    
    // 容器元素
    this.containerElement = null;
    
    // 显示状态
    this.isShowing = false;
    
    // 显示开始时间
    this.showStartTime = 0;
    
    // 原始内容备份
    this.originalContent = null;
    
    // 初始化
    this._init();
  }

  /**
   * 初始化骨架屏
   * @private
   */
  _init() {
    // 获取容器元素
    this.containerElement = document.querySelector(this.options.container);
    
    if (!this.containerElement) {
      console.error(`骨架屏容器 "${this.options.container}" 未找到`);
      return;
    }
    
    // 创建骨架屏元素
    this._createSkeletonElement();
    
    // 如果设置了自动显示，则显示骨架屏
    if (this.options.autoShow) {
      this.show();
    }
    
    // 创建MutationObserver以监听资源加载
    this._setupObserver();
  }

  /**
   * 创建骨架屏元素
   * @private
   */
  _createSkeletonElement() {
    // 如果已经有骨架屏元素，则返回
    if (this.skeletonElement) {
      return;
    }
    
    // 创建骨架屏容器
    this.skeletonElement = document.createElement('div');
    this.skeletonElement.className = 'skeleton-screen';
    
    // 添加动画类
    if (this.options.animation) {
      this.skeletonElement.classList.add(`skeleton-animation-${this.options.animation}`);
    }
    
    // 设置骨架屏内容
    if (this.options.template) {
      // 使用提供的模板
      this.skeletonElement.innerHTML = this.options.template;
    } else {
      // 根据容器内容生成默认骨架屏
      this._generateDefaultSkeleton();
    }
    
    // 设置样式
    this._applyStyles();
  }

  /**
   * 根据容器内容生成默认骨架屏
   * @private
   */
  _generateDefaultSkeleton() {
    // 分析容器内的元素
    const containerRect = this.containerElement.getBoundingClientRect();
    const childElements = Array.from(this.containerElement.children);
    
    // 创建骨架屏内容
    let skeletonContent = '';
    
    // 如果没有子元素，创建一个默认的骨架屏
    if (childElements.length === 0) {
      skeletonContent = `
        <div class="skeleton-header"></div>
        <div class="skeleton-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line" style="width: 75%;"></div>
        </div>
      `;
    } else {
      // 遍历子元素并创建相应的骨架屏元素
      childElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const tagName = element.tagName.toLowerCase();
        
        // 相对于容器的位置
        const top = rect.top - containerRect.top;
        const left = rect.left - containerRect.left;
        const width = rect.width;
        const height = rect.height;
        
        // 根据元素类型创建不同的骨架屏元素
        let skeletonItem = '';
        
        if (tagName === 'img') {
          skeletonItem = `<div class="skeleton-image" style="top: ${top}px; left: ${left}px; width: ${width}px; height: ${height}px;"></div>`;
        } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
          skeletonItem = `<div class="skeleton-heading" style="top: ${top}px; left: ${left}px; width: ${width}px; height: ${height}px;"></div>`;
        } else if (tagName === 'p' || tagName === 'div' || tagName === 'span') {
          skeletonItem = `<div class="skeleton-text" style="top: ${top}px; left: ${left}px; width: ${width}px; height: ${height}px;"></div>`;
        } else if (tagName === 'button' || tagName === 'a') {
          skeletonItem = `<div class="skeleton-button" style="top: ${top}px; left: ${left}px; width: ${width}px; height: ${height}px;"></div>`;
        } else {
          skeletonItem = `<div class="skeleton-block" style="top: ${top}px; left: ${left}px; width: ${width}px; height: ${height}px;"></div>`;
        }
        
        skeletonContent += skeletonItem;
      });
    }
    
    this.skeletonElement.innerHTML = skeletonContent;
  }

  /**
   * 应用默认样式
   * @private
   */
  _applyStyles() {
    // 检查是否已存在样式
    if (document.getElementById('skeleton-screen-styles')) {
      return;
    }
    
    // 创建样式元素
    const styleElement = document.createElement('style');
    styleElement.id = 'skeleton-screen-styles';
    
    // 定义骨架屏样式
    const styles = `
      .skeleton-screen {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: #f8f9fa;
      }
      
      .skeleton-screen * {
        background-color: #e2e5e9;
        background-image: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
        background-size: 200px 100%;
        background-repeat: no-repeat;
        border-radius: 4px;
        margin-bottom: 8px;
      }
      
      .skeleton-animation-pulse * {
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }
      
      .skeleton-animation-wave * {
        animation: skeleton-wave 1.5s ease-in-out 0.5s infinite;
      }
      
      .skeleton-animation-fade {
        animation: skeleton-fade 1s ease-in-out infinite alternate;
      }
      
      .skeleton-header {
        height: 40px;
        margin-bottom: 15px;
      }
      
      .skeleton-image {
        position: absolute;
        border-radius: 4px;
      }
      
      .skeleton-heading {
        position: absolute;
        height: 24px;
      }
      
      .skeleton-text {
        position: absolute;
      }
      
      .skeleton-line {
        height: 15px;
        margin-bottom: 10px;
      }
      
      .skeleton-button {
        position: absolute;
        border-radius: 4px;
      }
      
      .skeleton-block {
        position: absolute;
      }
      
      @keyframes skeleton-pulse {
        0%, 100% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
      }
      
      @keyframes skeleton-wave {
        0% {
          background-position: -200px 0;
        }
        100% {
          background-position: calc(200px + 100%) 0;
        }
      }
      
      @keyframes skeleton-fade {
        0% {
          opacity: 0.5;
        }
        100% {
          opacity: 1;
        }
      }
    `;
    
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  /**
   * 设置MutationObserver以监听资源加载
   * @private
   */
  _setupObserver() {
    // 创建一个加载检测器，当关键资源加载完成后隐藏骨架屏
    // 这里仅作为示例，实际项目中可能需要更复杂的逻辑
    window.addEventListener('load', () => {
      // 只在自动显示时才自动隐藏
      if (this.options.autoShow && this.isShowing) {
        this.hide();
      }
    });
  }

  /**
   * 显示骨架屏
   * @returns {SkeletonScreen} this
   */
  show() {
    if (this.isShowing) {
      return this;
    }
    
    // 记录显示开始时间
    this.showStartTime = Date.now();
    
    // 添加加载类
    this.containerElement.classList.add(this.options.loadingClass);
    
    // 备份原始内容
    if (this.options.removeOriginalContent) {
      this.originalContent = Array.from(this.containerElement.children);
      
      // 临时存储原始内容
      const tempContainer = document.createDocumentFragment();
      this.originalContent.forEach(child => {
        tempContainer.appendChild(child);
      });
      
      // 设置原始内容的引用
      this.originalContentFragment = tempContainer;
      
      // 清空容器
      while (this.containerElement.firstChild) {
        this.containerElement.removeChild(this.containerElement.firstChild);
      }
    }
    
    // 添加骨架屏到容器
    this.containerElement.appendChild(this.skeletonElement);
    
    // 设置显示状态
    this.isShowing = true;
    
    // 调用显示回调
    if (typeof this.options.onShow === 'function') {
      this.options.onShow(this);
    }
    
    return this;
  }

  /**
   * 隐藏骨架屏
   * @param {Function} callback - 隐藏后的回调函数
   * @returns {SkeletonScreen} this
   */
  hide(callback) {
    if (!this.isShowing) {
      return this;
    }
    
    // 计算已显示时间
    const displayTime = Date.now() - this.showStartTime;
    
    // 如果显示时间小于最小显示时间，则延迟隐藏
    if (displayTime < this.options.minDisplayTime) {
      setTimeout(() => {
        this._doHide(callback);
      }, this.options.minDisplayTime - displayTime);
    } else {
      this._doHide(callback);
    }
    
    return this;
  }

  /**
   * 执行隐藏骨架屏
   * @param {Function} callback - 隐藏后的回调函数
   * @private
   */
  _doHide(callback) {
    // 移除骨架屏
    if (this.skeletonElement && this.skeletonElement.parentNode) {
      this.skeletonElement.parentNode.removeChild(this.skeletonElement);
    }
    
    // 恢复原始内容
    if (this.options.removeOriginalContent && this.originalContentFragment) {
      this.containerElement.appendChild(this.originalContentFragment);
    }
    
    // 移除加载类
    this.containerElement.classList.remove(this.options.loadingClass);
    
    // 设置显示状态
    this.isShowing = false;
    
    // 调用隐藏回调
    if (typeof this.options.onHide === 'function') {
      this.options.onHide(this);
    }
    
    // 调用传入的回调
    if (typeof callback === 'function') {
      callback(this);
    }
  }

  /**
   * 更新骨架屏
   * @param {string} newTemplate - 新的骨架屏模板
   * @returns {SkeletonScreen} this
   */
  update(newTemplate) {
    if (newTemplate) {
      this.options.template = newTemplate;
    }
    
    // 重新创建骨架屏元素
    if (this.skeletonElement && this.skeletonElement.parentNode) {
      this.skeletonElement.parentNode.removeChild(this.skeletonElement);
    }
    
    this.skeletonElement = null;
    this._createSkeletonElement();
    
    // 如果正在显示，则重新添加到容器
    if (this.isShowing) {
      this.containerElement.appendChild(this.skeletonElement);
    }
    
    return this;
  }

  /**
   * 销毁骨架屏
   */
  destroy() {
    // 隐藏骨架屏
    if (this.isShowing) {
      this.hide();
    }
    
    // 移除样式
    const styleElement = document.getElementById('skeleton-screen-styles');
    if (styleElement) {
      styleElement.parentNode.removeChild(styleElement);
    }
    
    // 清空引用
    this.skeletonElement = null;
    this.containerElement = null;
    this.originalContent = null;
    this.originalContentFragment = null;
  }
}

// 单例模式
let defaultInstance = null;

/**
 * 获取默认的骨架屏实例
 * @param {Object} options - 配置选项
 * @returns {SkeletonScreen} 骨架屏实例
 */
function getSkeletonScreen(options = {}) {
  if (!defaultInstance) {
    defaultInstance = new SkeletonScreen(options);
  }
  return defaultInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SkeletonScreen,
    getSkeletonScreen
  };
} else {
  window.SkeletonScreen = SkeletonScreen;
  window.getSkeletonScreen = getSkeletonScreen;
} 