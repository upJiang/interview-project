/**
 * code-compressor.js
 * 代码压缩与优化工具 - 用于前端资源压缩
 */

class CodeCompressor {
  constructor(options = {}) {
    this.options = {
      // 压缩模式：normal, aggressive
      mode: 'normal',
      // 是否移除注释
      removeComments: true,
      // 是否移除空格和换行
      removeWhitespace: true,
      // 是否启用变量名压缩
      mangleVariableNames: true,
      // 保留词列表 - 不会被压缩的变量名
      reserved: [],
      // 是否合并连续变量声明
      mergeVarDeclarations: true,
      // 是否进行死代码消除
      deadCodeElimination: true,
      // 压缩选项 - CSS特定
      cssOptions: {
        removeComments: true,
        collapseWhitespace: true,
        convertColors: true, // #ffffff -> #fff
        discardEmpty: true,  // 移除空规则
      },
      // 压缩后的文件大小上限（字节），超过会警告
      sizeWarningThreshold: 500 * 1024, // 500kb
      // 输出格式 (formatted, minified)
      outputFormat: 'minified',
      // sourcemap 选项
      sourceMap: {
        enabled: false,
        includeSources: false,
        filename: '',
      },
      // 是否使用web worker进行压缩 (大文件适用)
      useWebWorker: false,
      ...options
    };

    // 工具内部状态
    this.stats = {
      lastCompression: null,
      compressionRatio: 0,
      originalSize: 0,
      compressedSize: 0,
      errors: [],
      warnings: []
    };

    // AST缓存（用于重复压缩相同代码时提高性能）
    this.astCache = new Map();

    // 已注册的自定义转换器
    this.customTransformers = [];

    console.log('[CodeCompressor] 已初始化压缩工具');
  }

  /**
   * 压缩JavaScript代码
   * @param {string} code - 要压缩的JavaScript代码
   * @param {Object} options - 压缩选项，会覆盖默认选项
   * @returns {Object} 压缩结果，包含压缩后代码和sourcemap
   */
  compressJS(code, options = {}) {
    this.stats.errors = [];
    this.stats.warnings = [];
    
    // 合并选项
    const compressOptions = { ...this.options, ...options };
    
    if (!code || typeof code !== 'string') {
      const error = new Error('无效的代码输入');
      this.stats.errors.push(error);
      throw error;
    }
    
    // 记录原始代码大小
    this.stats.originalSize = code.length;
    
    try {
      console.log(`[CodeCompressor] 开始压缩JavaScript代码 (${this.formatBytes(code.length)})`);
      const startTime = Date.now();
      
      // 在实际项目中，这里通常会使用像Terser, UglifyJS等库
      // 在这个例子中，我们实现一个简化版压缩器
      
      let result = code;
      
      // 1. 移除注释 (简化实现，实际中需要AST解析)
      if (compressOptions.removeComments) {
        result = this.removeComments(result);
      }
      
      // 2. 应用自定义转换器
      for (const transformer of this.customTransformers) {
        result = transformer(result, compressOptions);
      }
      
      // 3. 变量名压缩/混淆 (简化实现)
      if (compressOptions.mangleVariableNames) {
        result = this.mangleVariableNames(result, compressOptions.reserved);
      }
      
      // 4. 移除空格和换行
      if (compressOptions.removeWhitespace) {
        result = this.removeWhitespace(result);
      }
      
      // 生成源映射（sourcemap）- 真实实现需要更复杂的处理
      let sourceMap = null;
      if (compressOptions.sourceMap && compressOptions.sourceMap.enabled) {
        sourceMap = this.generateSourceMap(code, result, compressOptions.sourceMap);
      }
      
      // 计算压缩比率
      this.stats.compressedSize = result.length;
      this.stats.compressionRatio = (1 - (result.length / code.length)) * 100;
      
      const timeTaken = Date.now() - startTime;
      
      // 记录压缩统计
      this.stats.lastCompression = {
        type: 'javascript',
        originalSize: code.length,
        compressedSize: result.length,
        compressionRatio: this.stats.compressionRatio.toFixed(2) + '%',
        timeTaken: timeTaken + 'ms'
      };
      
      // 检查是否超过大小阈值
      if (result.length > compressOptions.sizeWarningThreshold) {
        const warning = `压缩后文件大小 (${this.formatBytes(result.length)}) 超过警告阈值 (${this.formatBytes(compressOptions.sizeWarningThreshold)})`;
        this.stats.warnings.push(warning);
        console.warn(`[CodeCompressor] ${warning}`);
      }
      
      console.log(`[CodeCompressor] JavaScript压缩完成: ${this.formatBytes(code.length)} -> ${this.formatBytes(result.length)} (节省 ${this.stats.compressionRatio.toFixed(2)}%, 用时 ${timeTaken}ms)`);
      
      return {
        code: result,
        sourceMap,
        stats: { ...this.stats.lastCompression }
      };
    } catch (error) {
      this.stats.errors.push(error);
      console.error('[CodeCompressor] 压缩过程中发生错误:', error);
      throw error;
    }
  }

  /**
   * 压缩CSS代码
   * @param {string} code - 要压缩的CSS代码
   * @param {Object} options - 压缩选项，会覆盖默认选项
   * @returns {Object} 压缩结果，包含压缩后代码和sourcemap
   */
  compressCSS(code, options = {}) {
    this.stats.errors = [];
    this.stats.warnings = [];
    
    // 合并选项，特别关注CSS特定选项
    const compressOptions = { 
      ...this.options, 
      ...options,
      cssOptions: { ...this.options.cssOptions, ...(options.cssOptions || {}) }
    };
    
    if (!code || typeof code !== 'string') {
      const error = new Error('无效的CSS代码输入');
      this.stats.errors.push(error);
      throw error;
    }
    
    // 记录原始代码大小
    this.stats.originalSize = code.length;
    
    try {
      console.log(`[CodeCompressor] 开始压缩CSS代码 (${this.formatBytes(code.length)})`);
      const startTime = Date.now();
      
      let result = code;
      
      // 1. 移除注释
      if (compressOptions.cssOptions.removeComments) {
        result = this.removeComments(result, true); // CSS注释处理
      }
      
      // 2. 转换颜色值 (#ffffff -> #fff)
      if (compressOptions.cssOptions.convertColors) {
        result = this.convertCssColors(result);
      }
      
      // 3. 移除多余空格
      if (compressOptions.cssOptions.collapseWhitespace) {
        result = this.collapseCssWhitespace(result);
      }
      
      // 4. 移除空规则
      if (compressOptions.cssOptions.discardEmpty) {
        result = this.removeEmptyCssRules(result);
      }
      
      // 生成源映射
      let sourceMap = null;
      if (compressOptions.sourceMap && compressOptions.sourceMap.enabled) {
        sourceMap = this.generateSourceMap(code, result, compressOptions.sourceMap);
      }
      
      // 计算压缩比率
      this.stats.compressedSize = result.length;
      this.stats.compressionRatio = (1 - (result.length / code.length)) * 100;
      
      const timeTaken = Date.now() - startTime;
      
      // 记录压缩统计
      this.stats.lastCompression = {
        type: 'css',
        originalSize: code.length,
        compressedSize: result.length,
        compressionRatio: this.stats.compressionRatio.toFixed(2) + '%',
        timeTaken: timeTaken + 'ms'
      };
      
      console.log(`[CodeCompressor] CSS压缩完成: ${this.formatBytes(code.length)} -> ${this.formatBytes(result.length)} (节省 ${this.stats.compressionRatio.toFixed(2)}%, 用时 ${timeTaken}ms)`);
      
      return {
        code: result,
        sourceMap,
        stats: { ...this.stats.lastCompression }
      };
    } catch (error) {
      this.stats.errors.push(error);
      console.error('[CodeCompressor] CSS压缩过程中发生错误:', error);
      throw error;
    }
  }

  /**
   * 移除代码中的注释
   * @param {string} code - 要处理的代码
   * @param {boolean} isCss - 是否为CSS代码
   * @returns {string} 移除注释后的代码
   */
  removeComments(code, isCss = false) {
    if (isCss) {
      // 移除CSS注释 /* ... */
      return code.replace(/\/\*[\s\S]*?\*\//g, '');
    } else {
      // 移除JS单行注释 //
      let result = code.replace(/\/\/.*$/gm, '');
      // 移除JS多行注释 /* ... */
      result = result.replace(/\/\*[\s\S]*?\*\//g, '');
      return result;
    }
  }

  /**
   * 移除空格和换行
   * @param {string} code - 要处理的代码
   * @returns {string} 移除空格和换行后的代码
   */
  removeWhitespace(code) {
    // 先移除换行符
    let result = code.replace(/[\r\n]+/g, '');
    
    // 移除多余空格，但保留字符串内的空格
    result = result.replace(/([{};:,])\s+/g, '$1');
    result = result.replace(/\s+([{};:,])/g, '$1');
    
    // 压缩连续空格为单个空格
    result = result.replace(/\s{2,}/g, ' ');
    
    // 特殊处理：保持关键字和标识符之间的空格
    result = result.replace(/\b(var|let|const|if|else|for|while|function|return|new|delete|typeof|instanceof)\b/g, ' $1 ');
    // 移除多余空格
    result = result.replace(/\s{2,}/g, ' ');
    // 修剪开头和结尾的空格
    result = result.trim();
    
    return result;
  }

  /**
   * 压缩变量名（简化实现）
   * @param {string} code - 要处理的代码
   * @param {Array} reserved - 保留词列表，这些词不会被压缩
   * @returns {string} 变量名压缩后的代码
   */
  mangleVariableNames(code, reserved = []) {
    // 注意：真实实现需要AST分析，这里只是示例
    // 简单地用短名称替换，真实场景下需要处理作用域和冲突
    
    // 模拟变量映射表
    const variableMap = {
      'longVariableName': 'a',
      'anotherLongName': 'b',
      'veryDescriptiveCounter': 'c'
    };
    
    // 从变量映射表中移除保留词
    for (const word of reserved) {
      delete variableMap[word];
    }
    
    // 应用替换
    let result = code;
    for (const [original, short] of Object.entries(variableMap)) {
      // 使用正则确保只替换完整的标识符
      const regex = new RegExp(`\\b${original}\\b`, 'g');
      result = result.replace(regex, short);
    }
    
    return result;
  }

  /**
   * 转换CSS颜色值
   * @param {string} css - CSS代码
   * @returns {string} 转换后的CSS代码
   */
  convertCssColors(css) {
    // 简化实现：将6位十六进制颜色缩短为3位（如果可能）
    // 例如: #ffffff -> #fff, #aabbcc -> #abc
    return css.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3');
  }

  /**
   * 压缩CSS中的空白
   * @param {string} css - CSS代码
   * @returns {string} 压缩后的CSS代码
   */
  collapseCssWhitespace(css) {
    // 1. 移除选择器内的空白
    let result = css.replace(/\s*([\{\}\;\:\,])\s*/g, '$1');
    
    // 2. 移除分号后的空白
    result = result.replace(/;\s*}/g, '}');
    
    // 3. 移除多余空格
    result = result.replace(/\s+/g, ' ');
    
    // 4. 移除规则前后的空白
    result = result.replace(/\s*\{/g, '{');
    result = result.replace(/\}\s*/g, '}');
    
    // 5. 移除选择器中多余的逗号前后空白
    result = result.replace(/,\s*/g, ',');
    
    return result.trim();
  }

  /**
   * 移除空的CSS规则
   * @param {string} css - CSS代码
   * @returns {string} 处理后的CSS代码
   */
  removeEmptyCssRules(css) {
    // 移除空规则 (例如: .class { } 或 .class { /* comment */ })
    return css.replace(/[^{}]+\{\s*\}/g, '');
  }

  /**
   * 生成源映射（简化实现）
   * @param {string} originalCode - 原始代码
   * @param {string} minifiedCode - 压缩后的代码
   * @param {Object} options - 源映射选项
   * @returns {Object} 源映射对象
   */
  generateSourceMap(originalCode, minifiedCode, options) {
    // 注意：真实实现需要更复杂的处理，这里只返回一个基本结构
    return {
      version: 3,
      file: options.filename || 'minified.js',
      sources: ['original.js'],
      sourcesContent: options.includeSources ? [originalCode] : [],
      mappings: 'AAAA' // 简化的映射字符串，实际应包含位置信息
    };
  }

  /**
   * 添加自定义代码转换器
   * @param {Function} transformer - 代码转换函数
   * @returns {CodeCompressor} 链式调用
   */
  addTransformer(transformer) {
    if (typeof transformer !== 'function') {
      throw new Error('转换器必须是一个函数');
    }
    this.customTransformers.push(transformer);
    return this;
  }

  /**
   * 设置压缩选项
   * @param {Object} options - 压缩选项
   * @returns {CodeCompressor} 链式调用
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * 获取最近的压缩统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 格式化字节大小为人类可读形式
   * @param {number} bytes - 字节大小
   * @returns {string} 格式化后的大小
   * @private
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 压缩文件（如果在Node.js环境中）
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {Object} options - 压缩选项
   * @returns {Promise<Object>} 压缩结果
   */
  async compressFile(inputPath, outputPath, options = {}) {
    // 此方法在浏览器环境中不可用，仅作为API设计展示
    if (typeof window !== 'undefined') {
      throw new Error('compressFile方法仅在Node.js环境中可用');
    }
    
    // 在实际Node.js环境中，这里会使用fs模块读取和写入文件
    console.log(`[CodeCompressor] 压缩文件: ${inputPath} -> ${outputPath}`);
    
    // 模拟文件处理
    return {
      inputPath,
      outputPath,
      success: true,
      stats: this.stats.lastCompression || {}
    };
  }
}

// 创建全局实例
window.codeCompressor = new CodeCompressor({
  mode: 'normal',
  removeComments: true,
  removeWhitespace: true,
  mangleVariableNames: false, // 默认不开启变量名压缩
  sourceMap: {
    enabled: true,
    includeSources: true
  }
});

// 导出类，使其可在Node.js环境中使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CodeCompressor;
}

// 使用示例
/* 
// 压缩JavaScript
const jsResult = window.codeCompressor.compressJS(
  `// 这是一个示例函数
  function calculateSum(a, b) {
    const result = a + b; // 计算和
    return result;
  }`
);

// 压缩CSS
const cssResult = window.codeCompressor.compressCSS(
  `.container {
    background-color: #ffffff;
    padding: 20px;
    margin: 10px 0;
  }
  
  // 空规则测试（将CSS注释改为单行注释格式以避免与外层JS注释冲突）
  .empty-rule {
  }`
);
*/ 