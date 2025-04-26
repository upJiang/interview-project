/**
 * skeleton-generator.js
 * 骨架屏生成器
 * 用于生成和显示页面骨架，优化首屏加载体验
 */

class SkeletonGenerator {
  /**
   * 创建骨架屏生成器
   * @param {Object} options - 配置选项
   * @param {string} options.container - 骨架屏容器选择器
   * @param {string} options.template - 骨架屏HTML模板
   * @param {string} options.className - 骨架屏容器类名
   * @param {string} options.background - 骨架屏背景色
   * @param {string} options.foreground - 骨架屏前景色
   * @param {boolean} options.animation - 是否开启动画
   * @param {number} options.duration - 动画持续时间(ms)
   * @param {Array} options.elements - 要生成骨架的元素配置
   * @param {Function} options.onReady - 骨架屏就绪回调
   * @param {Function} options.onRemove - 骨架屏移除回调
   */
  constructor(options = {}) {
    this.options = {
      container: 'body',
      template: '',
      className: 'skeleton-screen',
      background: '#f5f5f5',
      foreground: '#eeeeee',
      animation: true,
      duration: 1500,
      elements: [
        { type: 'rectangle', count: 3, height: '20px', width: '100%', top: '10px' },
        { type: 'circle', count: 1, diameter: '60px', left: '20px', top: '80px' },
        { type: 'rectangle', count: 4, height: '150px', width: '48%', top: '150px', style: 'float: left; margin: 5px;' }
      ],
      onReady: null,
      onRemove: null,
      ...options
    };
    
    // 骨架屏DOM元素
    this.skeletonElement = null;
    
    // 骨架屏CSS
    this.styles = null;
    
    // 是否已经显示
    this.isShowing = false;
    
    // 是否使用模板
    this.useTemplate = !!this.options.template;
    
    // 初始化
    this._init();
  }
  
  /**
   * 初始化骨架屏
   * @private
   */
  _init() {
    // 创建骨架屏样式
    this._createStyles();
    
    // 构建骨架屏
    this._buildSkeleton();
    
    // 监听页面加载完成事件
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.hide();
      }, 500);
    });
    
    // 强制在一定时间后隐藏骨架屏(兜底策略)
    setTimeout(() => {
      if (this.isShowing) {
        this.hide();
      }
    }, 10000);
    
    console.log('[SkeletonGenerator] 初始化完成');
  }
  
  /**
   * 创建骨架屏样式
   * @private
   */
  _createStyles() {
    const { background, foreground, className, animation, duration } = this.options;
    
    // 定义基础样式
    let css = `
      .${className} {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        overflow: hidden;
        background-color: ${background};
        transition: opacity 0.3s ease;
      }
      
      .${className}-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        position: relative;
      }
      
      .${className}-rect {
        background-color: ${foreground};
        border-radius: 4px;
        display: block;
      }
      
      .${className}-circle {
        background-color: ${foreground};
        border-radius: 50%;
        display: block;
      }
      
      .${className}-img {
        background-color: ${foreground};
        background-size: 200% 100%;
        border-radius: 8px;
        display: block;
      }
      
      .${className}-text {
        background-color: ${foreground};
        border-radius: 4px;
        display: block;
        min-height: 1em;
        margin-bottom: 0.5em;
      }
      
      .${className}-button {
        background-color: ${foreground};
        border-radius: 4px;
        display: inline-block;
        min-height: 2em;
        min-width: 5em;
      }
      
      .${className} .${className}-avatar {
        background-color: ${foreground};
        border-radius: 50%;
        display: block;
      }
      
      .${className} .${className}-header {
        height: 60px;
        background-color: ${foreground};
        margin-bottom: 20px;
        border-radius: 4px;
      }
    `;
    
    // 添加动画效果
    if (animation) {
      css += `
        @keyframes ${className}-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .${className} [class*="${className}-"] {
          animation: ${className}-shimmer ${duration}ms infinite linear;
          background-image: linear-gradient(90deg, ${foreground} 0px, #f0f0f0 40%, ${foreground} 80%);
          background-size: 200% 100%;
        }
      `;
    }
    
    // 添加样式到页面
    this.styles = document.createElement('style');
    this.styles.type = 'text/css';
    this.styles.appendChild(document.createTextNode(css));
    document.head.appendChild(this.styles);
  }
  
  /**
   * 构建骨架屏
   * @private
   */
  _buildSkeleton() {
    // 创建骨架屏容器
    this.skeletonElement = document.createElement('div');
    this.skeletonElement.className = this.options.className;
    
    // 创建骨架屏内容容器
    const contentContainer = document.createElement('div');
    contentContainer.className = `${this.options.className}-content`;
    this.skeletonElement.appendChild(contentContainer);
    
    // 使用模板或自动生成骨架
    if (this.useTemplate) {
      contentContainer.innerHTML = this.options.template;
    } else {
      this._generateElements(contentContainer);
    }
    
    // 添加到DOM
    this.show();
    
    // 触发就绪回调
    if (typeof this.options.onReady === 'function') {
      this.options.onReady(this.skeletonElement);
    }
  }
  
  /**
   * 生成骨架元素
   * @param {HTMLElement} container - 骨架屏容器
   * @private
   */
  _generateElements(container) {
    const { elements, className } = this.options;
    
    if (!elements || !elements.length) {
      return;
    }
    
    // 遍历元素配置生成DOM
    elements.forEach(config => {
      const { type, count = 1, height, width, top, left, diameter, style = '' } = config;
      
      // 生成指定数量的元素
      for (let i = 0; i < count; i++) {
        let element;
        
        switch (type) {
          case 'rectangle':
            element = document.createElement('div');
            element.className = `${className}-rect`;
            element.style.cssText = `
              height: ${height};
              width: ${width};
              margin-top: ${top || '10px'};
              margin-left: ${left || '0'};
              ${style}
            `;
            break;
          
          case 'circle':
            element = document.createElement('div');
            element.className = `${className}-circle`;
            element.style.cssText = `
              height: ${diameter};
              width: ${diameter};
              margin-top: ${top || '10px'};
              margin-left: ${left || '0'};
              ${style}
            `;
            break;
          
          case 'text':
            // 文本段落
            element = document.createElement('div');
            element.className = `${className}-text`;
            element.style.cssText = `
              height: ${height || '1em'};
              width: ${width || '100%'};
              margin-top: ${top || '10px'};
              margin-left: ${left || '0'};
              ${style}
            `;
            break;
          
          case 'image':
            // 图片占位
            element = document.createElement('div');
            element.className = `${className}-img`;
            element.style.cssText = `
              height: ${height || '200px'};
              width: ${width || '100%'};
              margin-top: ${top || '10px'};
              margin-left: ${left || '0'};
              ${style}
            `;
            break;
          
          case 'button':
            // 按钮占位
            element = document.createElement('div');
            element.className = `${className}-button`;
            element.style.cssText = `
              height: ${height || '40px'};
              width: ${width || '120px'};
              margin-top: ${top || '10px'};
              margin-left: ${left || '0'};
              ${style}
            `;
            break;
          
          case 'avatar':
            // 头像占位
            element = document.createElement('div');
            element.className = `${className}-avatar`;
            element.style.cssText = `
              height: ${diameter || '50px'};
              width: ${diameter || '50px'};
              margin-top: ${top || '10px'};
              margin-left: ${left || '0'};
              ${style}
            `;
            break;
          
          case 'header':
            // 页眉占位
            element = document.createElement('div');
            element.className = `${className}-header`;
            element.style.cssText = `
              ${style}
            `;
            break;
            
          default:
            // 默认为矩形
            element = document.createElement('div');
            element.className = `${className}-rect`;
            element.style.cssText = `
              height: ${height || '20px'};
              width: ${width || '100%'};
              margin-top: ${top || '10px'};
              margin-left: ${left || '0'};
              ${style}
            `;
        }
        
        container.appendChild(element);
      }
    });
  }
  
  /**
   * 显示骨架屏
   * @returns {SkeletonGenerator} 当前实例
   */
  show() {
    if (this.isShowing) return this;
    
    // 添加骨架屏到页面
    if (!this.skeletonElement.parentNode) {
      const container = document.querySelector(this.options.container);
      if (container) {
        container.appendChild(this.skeletonElement);
      } else {
        document.body.appendChild(this.skeletonElement);
      }
    }
    
    // 确保骨架屏可见
    this.skeletonElement.style.display = 'block';
    this.skeletonElement.style.opacity = '1';
    
    this.isShowing = true;
    
    return this;
  }
  
  /**
   * 隐藏骨架屏
   * @param {boolean} [remove=true] - 是否移除元素
   * @returns {SkeletonGenerator} 当前实例
   */
  hide(remove = true) {
    if (!this.isShowing) return this;
    
    this.skeletonElement.style.opacity = '0';
    
    // 延迟移除，允许过渡动画完成
    setTimeout(() => {
      this.skeletonElement.style.display = 'none';
      
      if (remove && this.skeletonElement.parentNode) {
        this.skeletonElement.parentNode.removeChild(this.skeletonElement);
        
        // 触发移除回调
        if (typeof this.options.onRemove === 'function') {
          this.options.onRemove();
        }
      }
    }, 300);
    
    this.isShowing = false;
    
    return this;
  }
  
  /**
   * 自动从页面结构生成骨架屏
   * @param {string} [selector='body'] - 要分析的容器选择器
   * @returns {string} 生成的骨架屏HTML
   */
  generateFromDOM(selector = 'body') {
    const container = document.querySelector(selector);
    if (!container) {
      console.error('找不到指定容器:', selector);
      return '';
    }
    
    // 分析DOM结构
    const skeletonHTML = this._analyzeDOM(container);
    
    // 更新模板
    this.options.template = skeletonHTML;
    this.useTemplate = true;
    
    // 重建骨架屏
    if (this.skeletonElement) {
      const content = this.skeletonElement.querySelector(`.${this.options.className}-content`);
      if (content) {
        content.innerHTML = skeletonHTML;
      }
    }
    
    return skeletonHTML;
  }
  
  /**
   * 分析DOM结构生成骨架HTML
   * @param {HTMLElement} element - 要分析的元素
   * @param {number} [depth=0] - 当前深度
   * @returns {string} 骨架HTML
   * @private
   */
  _analyzeDOM(element, depth = 0) {
    if (!element || !element.tagName) {
      return '';
    }
    
    // 限制最大分析深度
    if (depth > 5) {
      return '';
    }
    
    // 检查元素可见性
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return '';
    }
    
    const { className } = this.options;
    let result = '';
    
    // 根据元素类型生成不同骨架
    switch (element.tagName.toLowerCase()) {
      case 'img':
        // 图片转为灰色块
        const imgRect = element.getBoundingClientRect();
        const imgWidth = imgRect.width > 0 ? `${imgRect.width}px` : '100%';
        const imgHeight = imgRect.height > 0 ? `${imgRect.height}px` : '200px';
        
        result = `<div class="${className}-img" style="width: ${imgWidth}; height: ${imgHeight};"></div>`;
        break;
      
      case 'button':
      case 'input':
        if (element.type === 'button' || element.type === 'submit' || element.tagName.toLowerCase() === 'button') {
          const btnRect = element.getBoundingClientRect();
          const btnWidth = btnRect.width > 0 ? `${btnRect.width}px` : '120px';
          const btnHeight = btnRect.height > 0 ? `${btnRect.height}px` : '40px';
          
          result = `<div class="${className}-button" style="width: ${btnWidth}; height: ${btnHeight};"></div>`;
        } else if (element.type === 'text' || element.type === 'password' || element.type === 'email') {
          const inputRect = element.getBoundingClientRect();
          const inputWidth = inputRect.width > 0 ? `${inputRect.width}px` : '100%';
          const inputHeight = inputRect.height > 0 ? `${inputRect.height}px` : '40px';
          
          result = `<div class="${className}-text" style="width: ${inputWidth}; height: ${inputHeight};"></div>`;
        }
        break;
      
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        // 标题
        const headingHeight = {
          h1: '2em',
          h2: '1.8em',
          h3: '1.6em',
          h4: '1.4em',
          h5: '1.2em',
          h6: '1em'
        };
        
        const headingRect = element.getBoundingClientRect();
        const headingWidth = headingRect.width > 0 ? `${headingRect.width}px` : '100%';
        const headingHeightValue = headingRect.height > 0 ? `${headingRect.height}px` : headingHeight[element.tagName.toLowerCase()];
        
        result = `<div class="${className}-text" style="width: ${headingWidth}; height: ${headingHeightValue};"></div>`;
        break;
      
      case 'p':
      case 'span':
      case 'div':
        // 检查是否为文本节点
        if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
          const textRect = element.getBoundingClientRect();
          const text = element.textContent.trim();
          
          if (text.length > 0) {
            const textWidth = textRect.width > 0 ? `${textRect.width}px` : '100%';
            const textHeight = textRect.height > 0 ? `${textRect.height}px` : '1em';
            
            result = `<div class="${className}-text" style="width: ${textWidth}; height: ${textHeight};"></div>`;
          }
        } else {
          // 递归处理子节点
          const childrenResults = Array.from(element.children).map(child => this._analyzeDOM(child, depth + 1));
          result = childrenResults.join('');
        }
        break;
      
      case 'header':
      case 'nav':
        // 页眉和导航
        const headerRect = element.getBoundingClientRect();
        const headerHeight = headerRect.height > 0 ? `${headerRect.height}px` : '60px';
        
        result = `<div class="${className}-header" style="height: ${headerHeight};"></div>`;
        break;
      
      case 'ul':
      case 'ol':
        // 列表
        const listItems = [];
        const listItemCount = Math.min(5, element.children.length || 3);
        
        for (let i = 0; i < listItemCount; i++) {
          listItems.push(`<div class="${className}-text" style="width: 100%; height: 1.5em; margin-bottom: 0.5em;"></div>`);
        }
        
        result = listItems.join('');
        break;
      
      default:
        // 未知元素，尝试递归处理子节点
        const defaultChildren = Array.from(element.children).map(child => this._analyzeDOM(child, depth + 1));
        result = defaultChildren.join('');
    }
    
    return result;
  }
  
  /**
   * 从页面内容创建截图式骨架屏
   * @param {string} [selector='body'] - 容器选择器
   * @returns {Promise<string>} 骨架屏数据URL
   */
  async captureAndCreateScreenshot(selector = 'body') {
    // 检查是否支持html2canvas
    if (typeof html2canvas !== 'function') {
      console.error('html2canvas未加载，无法创建截图骨架屏');
      return null;
    }
    
    const container = document.querySelector(selector);
    if (!container) {
      console.error('找不到指定容器:', selector);
      return null;
    }
    
    try {
      // 使用html2canvas截图
      const canvas = await html2canvas(container, {
        backgroundColor: this.options.background,
        logging: false,
        scale: 0.5, // 降低分辨率以提高性能
        onclone: (documentClone) => {
          // 处理克隆的文档，将内容转换为灰色
          const elements = documentClone.querySelectorAll('*');
          elements.forEach(el => {
            if (el.style) {
              // 文本转灰色
              el.style.color = this.options.foreground;
              
              // 图片替换为灰色块
              if (el.tagName.toLowerCase() === 'img') {
                el.style.visibility = 'hidden';
                el.style.backgroundColor = this.options.foreground;
              }
              
              // 移除背景图
              el.style.backgroundImage = 'none';
            }
          });
        }
      });
      
      // 转为灰度并应用模糊滤镜
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // 转为灰度
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // 灰度转换
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = data[i + 1] = data[i + 2] = gray;
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // 应用模糊
      ctx.filter = 'blur(4px)';
      ctx.drawImage(canvas, 0, 0);
      
      // 转为图片数据
      const dataURL = canvas.toDataURL('image/png', 0.5);
      
      // 创建基于截图的骨架屏
      this.options.template = `<img src="${dataURL}" style="width:100%;">`;
      this.useTemplate = true;
      
      // 更新骨架屏
      if (this.skeletonElement) {
        const content = this.skeletonElement.querySelector(`.${this.options.className}-content`);
        if (content) {
          content.innerHTML = this.options.template;
        }
      }
      
      return dataURL;
    } catch (error) {
      console.error('创建截图骨架屏失败:', error);
      return null;
    }
  }
  
  /**
   * 生成可复用的骨架屏HTML
   * @returns {string} 骨架屏HTML代码
   */
  generateHTML() {
    if (!this.skeletonElement) {
      return '';
    }
    
    // 骨架屏样式
    const styleContent = this.styles.textContent;
    const styleTag = `<style>${styleContent}</style>`;
    
    // 骨架屏内容
    const contentEl = this.skeletonElement.querySelector(`.${this.options.className}-content`);
    const contentHTML = contentEl ? contentEl.innerHTML : '';
    
    // 完整HTML
    const html = `
      ${styleTag}
      <div class="${this.options.className}">
        <div class="${this.options.className}-content">
          ${contentHTML}
        </div>
      </div>
      <script>
        // 骨架屏自动移除
        window.addEventListener('load', function() {
          setTimeout(function() {
            var skeleton = document.querySelector('.${this.options.className}');
            if (skeleton) {
              skeleton.style.opacity = '0';
              setTimeout(function() {
                if (skeleton.parentNode) {
                  skeleton.parentNode.removeChild(skeleton);
                }
              }, 300);
            }
          }, 500);
        });
      </script>
    `;
    
    return html;
  }
  
  /**
   * 将骨架屏导出为单独的HTML文件
   * @returns {string} HTML内容
   */
  exportHTML() {
    if (!this.skeletonElement) {
      return '';
    }
    
    // 骨架屏样式
    const styleContent = this.styles.textContent;
    
    // 骨架屏内容
    const contentEl = this.skeletonElement.querySelector(`.${this.options.className}-content`);
    const contentHTML = contentEl ? contentEl.innerHTML : '';
    
    // 完整HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>骨架屏</title>
        <style>
          ${styleContent}
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <div class="${this.options.className}">
          <div class="${this.options.className}-content">
            ${contentHTML}
          </div>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }
}

// 创建和导出单例
let skeletonGeneratorInstance = null;

/**
 * 获取骨架屏生成器实例
 * @param {Object} [options] - 配置选项
 * @returns {SkeletonGenerator} 骨架屏生成器实例
 */
function getSkeleton(options) {
  if (!skeletonGeneratorInstance) {
    skeletonGeneratorInstance = new SkeletonGenerator(options);
  }
  return skeletonGeneratorInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SkeletonGenerator,
    getSkeleton
  };
} else {
  window.SkeletonGenerator = SkeletonGenerator;
  window.getSkeleton = getSkeleton;
} 