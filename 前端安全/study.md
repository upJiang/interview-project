# 前端安全实践与防御策略总结

本文档总结了前端安全领域的各种攻击风险与防御策略，结合实际代码示例介绍如何在前端应用中实现安全防护机制。同时提供了面试问题应对技巧，帮助开发者在技术面试中清晰表达安全相关知识点。

## 目录

1. [XSS攻击防御](#xss攻击防御)
2. [CSRF攻击防御](#csrf攻击防御)
3. [CSP内容安全策略](#csp内容安全策略)
4. [点击劫持防护](#点击劫持防护)
5. [SSRF防护](#ssrf防护)
6. [API请求频率限制](#api请求频率限制)
7. [AES与RSA加密算法](#aes与rsa加密算法) 
8. [认证安全最佳实践](#认证安全最佳实践)
9. [防调试与代码保护](#防调试与代码保护)
10. [支付安全策略](#支付安全策略)
11. [面试应对技巧](#面试应对技巧)

## XSS攻击防御

### 概述

XSS（Cross-Site Scripting）跨站脚本攻击是一种常见的Web应用程序漏洞，攻击者利用这种漏洞在网页上注入恶意客户端代码。当用户浏览包含此类恶意代码的页面时，脚本将在用户的浏览器上执行，使攻击者能够窃取用户数据、会话令牌或在用户不知情的情况下执行恶意操作。

### XSS攻击类型

1. **反射型XSS**：恶意代码从请求URL中反射到网页上
2. **存储型XSS**：恶意代码被存储在服务器上，当用户访问相关页面时执行
3. **DOM型XSS**：漏洞存在于客户端代码中，攻击者修改了页面的DOM环境

### 防御策略与代码实现

1. **输出数据编码**

```javascript
// 不安全的实现（易受XSS攻击）
function displayUnsafeContent(content) {
    document.getElementById('output').innerHTML = content;
}

// 安全的实现（使用textContent防XSS）
function displaySafeContent(content) {
    document.getElementById('output').textContent = content;
}

// HTML转义函数
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
```

2. **安全的富文本处理（白名单过滤）**

```javascript
// 安全的HTML白名单过滤函数
function sanitizeHTML(html) {
    // 创建一个临时元素
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // 移除所有脚本元素
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // 移除所有危险元素
    const dangerousTags = temp.querySelectorAll(
        'iframe, object, embed, form, input, button, textarea, select, option'
    );
    dangerousTags.forEach(tag => tag.remove());
    
    // 移除所有事件处理属性
    const allElements = temp.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        // 移除所有以'on'开头的属性（如onclick, onmouseover等）
        const attributes = element.attributes;
        for (let j = attributes.length - 1; j >= 0; j--) {
            const attrName = attributes[j].name;
            if (attrName.startsWith('on') || 
                (attrName === 'href' && attributes[j].value.startsWith('javascript:'))) {
                element.removeAttribute(attrName);
            }
        }
    }
    
    return temp.innerHTML;
}
```

3. **使用DOMPurify等专业库**

```javascript
// 使用DOMPurify库进行HTML净化
import DOMPurify from 'dompurify';

function sanitizeWithDOMPurify(html) {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
    });
}
```

4. **避免危险的JavaScript API**

```javascript
// 不安全的代码评估
eval(userProvidedCode);  // 危险！
new Function(userProvidedCode);  // 危险！
setTimeout("alert('" + userInput + "')", 100);  // 危险！

// 安全替代方案
setTimeout(function() { 
    alert(userInput); 
}, 100);
```

### 其他XSS防御措施

- **设置HttpOnly Cookie**：防止JavaScript访问敏感Cookie
- **实施CSP策略**：限制资源加载和脚本执行
- **验证用户输入**：在服务器端和客户端都进行输入验证
- **使用框架内置的安全机制**：如React的JSX自动转义

## CSRF攻击防御

### 概述

CSRF（Cross-Site Request Forgery）跨站请求伪造是一种攻击，使已认证用户在不知情的情况下执行非本意的操作。攻击者诱导用户访问已被认证的网站，然后以用户身份发送伪造请求。

### 攻击原理

攻击者构造一个恶意页面，当已登录用户访问该页面时，页面会自动向目标网站发送请求，利用用户的身份执行操作（如转账、更改密码等）。

### 防御策略与代码实现

1. **CSRF令牌验证**

```javascript
// 前端生成CSRF令牌
function setupCSRFProtection() {
    // 获取CSRF令牌（通常从服务器返回的页面中获取）
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    
    // 为所有表单添加CSRF令牌
    document.querySelectorAll('form').forEach(form => {
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = '_csrf';
        tokenInput.value = csrfToken;
        form.appendChild(tokenInput);
    });
    
    // 为AJAX请求添加CSRF令牌
    document.addEventListener('DOMContentLoaded', () => {
        // 拦截所有fetch请求
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            options.headers = options.headers || {};
            options.headers['X-CSRF-Token'] = csrfToken;
            return originalFetch(url, options);
        };
    });
}
```

2. **SameSite Cookie属性**

```javascript
// 服务器端设置Cookie时使用SameSite属性
// 前端可以通过这种方式引导用户意识到安全设置
function checkSameSiteCookies() {
    console.log("您的浏览器使用了SameSite Cookie保护机制，有效防止CSRF攻击");
    // 实际上，SameSite属性是由服务器设置的，前端无法检测
}
```

3. **验证请求来源**

```javascript
// 服务器会验证Origin和Referer头部是否来自合法来源
fetch('/api/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 发送Cookie以便服务器识别用户
    body: JSON.stringify({ amount: 100, to: 'user123' })
});
```

### 其他CSRF防御措施

- **设置合理的会话过期时间**
- **关键操作使用验证码或二次验证**
- **使用框架提供的CSRF保护机制**

## CSP内容安全策略

### 概述

内容安全策略（Content Security Policy，CSP）是一种安全机制，通过HTTP头部或meta标签限制资源的加载和执行，可以有效防止XSS攻击和数据注入攻击。

### 实现方式

1. **通过HTTP头部设置CSP**（服务器端）

```
// 服务器端代码设置CSP头部
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com; img-src *
```

2. **通过meta标签设置CSP**（前端）

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' https://trusted.cdn.com; img-src *">
```

### 常用CSP指令

```javascript
// CSP配置示例及解释
const cspConfig = {
    // 默认策略，适用于未指定的资源类型
    "default-src": "'self'",
    
    // JavaScript脚本来源限制
    "script-src": "'self' https://cdn.example.com",
    
    // 样式表来源限制
    "style-src": "'self' 'unsafe-inline' https://fonts.googleapis.com",
    
    // 图片来源限制
    "img-src": "'self' data: https://img.example.com",
    
    // 框架来源限制
    "frame-src": "'self'",
    
    // 对象（插件）来源限制
    "object-src": "'none'",
    
    // 表单提交目标限制
    "form-action": "'self'",
    
    // 上报违规行为
    "report-uri": "/csp-violation-report"
};
```

### 违规报告与监控

```javascript
// 监听CSP违规事件
document.addEventListener('securitypolicyviolation', (e) => {
    console.warn('CSP违规:', {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy
    });
    
    // 上报到服务器
    fetch('/api/csp-report', {
        method: 'POST',
        body: JSON.stringify({
            blockedURI: e.blockedURI,
            violatedDirective: e.violatedDirective,
            originalPolicy: e.originalPolicy
        }),
        headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.error('上报CSP违规失败:', err));
});
```

## 点击劫持防护

### 概述

点击劫持（Clickjacking）是一种界面欺骗攻击，攻击者将透明的恶意页面覆盖在正常页面上，诱导用户点击看似正常但实际执行恶意操作的元素。

### 防御策略与代码实现

1. **X-Frame-Options 头部**

```javascript
// 在服务器端设置X-Frame-Options头部
// 前端可以检测该保护是否生效

function checkFrameProtection() {
    try {
        // 尝试在iframe中访问父窗口
        if (window !== window.top) {
            console.warn('当前页面可能处于iframe中，存在点击劫持风险');
        } else {
            console.log('页面不在iframe中，点击劫持风险较低');
        }
    } catch (e) {
        // 如果跨域报错，说明X-Frame-Options在起作用
        console.log('X-Frame-Options防护已启用');
    }
}
```

2. **使用frame-ancestors CSP指令**

```html
<!-- 通过CSP禁止页面被嵌入iframe -->
<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none'">
```

3. **JavaScript框架破解保护**

```javascript
// 防止页面被嵌入iframe中的JavaScript防护代码
(function preventFraming() {
    if (window !== window.top) {
        // 如果页面在iframe中，尝试将其提升到顶层窗口
        try {
            window.top.location = window.location;
        } catch (e) {
            // 如果因为跨域无法访问顶层窗口，则中断页面加载
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h1>安全警告</h1>
                    <p>此页面不允许在框架中显示。</p>
                    <p>请<a href="${window.location.href}" target="_blank">直接访问</a>此页面。</p>
                </div>
            `;
            document.body.style.display = 'block';
            setTimeout(() => { document.body.style.opacity = 1; }, 10);
        }
    }
})();
```

4. **样式防护**

```css
/* 使用CSS使页面在iframe中变得不可见或显示警告 */
/* 在你的主样式表中添加： */

@media screen {
    html {
        position: relative;
    }
    
    html::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #fff;
        opacity: 0;
        z-index: -1;
        transition: opacity 0.2s, z-index 0s 0.2s;
    }
    
    /* 当页面被嵌入时应用的样式 */
    html.in-iframe::before {
        opacity: 0.98;
        z-index: 2147483647;
        transition: opacity 0.2s;
        content: "警告：当前页面可能被恶意嵌入！";
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-family: sans-serif;
        color: #f44336;
    }
}
```

```javascript
// 搭配上面的CSS使用，检测并标记iframe状态
(function detectFraming() {
    try {
        if (window.self !== window.top) {
            document.documentElement.classList.add('in-iframe');
        }
    } catch (e) {
        // 如果因为跨域无法访问window.top，页面肯定在iframe中
        document.documentElement.classList.add('in-iframe');
    }
})();
```

## SSRF防护

### 概述

SSRF（Server-Side Request Forgery，服务器端请求伪造）是一种攻击方式，攻击者诱导服务器向预期之外的内部或外部资源发起请求。虽然主要是服务器端的安全问题，但前端开发者也需要了解并协助防御。

### SSRF在前端的体现

前端应用中，SSRF主要通过以下方式体现：

1. 开放重定向功能被利用
2. 代理服务或API网关配置不当
3. URL参数可控的资源加载

### 防御策略与代码实现

1. **URL白名单验证**

```javascript
// 前端URL验证函数，确保URL参数指向安全域名
function validateUrl(url) {
    try {
        const parsedUrl = new URL(url);
        
        // 白名单域名列表
        const allowedDomains = [
            'api.example.com',
            'cdn.example.com',
            'example.com',
            'sub.example.com'
        ];
        
        // 检查域名是否在白名单中
        const isAllowed = allowedDomains.some(domain => 
            parsedUrl.hostname === domain || 
            parsedUrl.hostname.endsWith('.' + domain)
        );
        
        if (!isAllowed) {
            console.error('URL验证失败：域名不在白名单中', parsedUrl.hostname);
            return false;
        }
        
        // 确保使用https协议（可选）
        if (parsedUrl.protocol !== 'https:') {
            console.error('URL验证失败：必须使用HTTPS协议');
            return false;
        }
        
        return true;
    } catch (e) {
        console.error('URL格式无效:', url);
        return false;
    }
}

// 使用示例：加载外部资源前验证URL
function loadExternalResource(url) {
    if (!validateUrl(url)) {
        throw new Error('不安全的URL');
    }
    
    // 加载资源...
    const img = new Image();
    img.src = url;
    return img;
}
```

2. **避免直接拼接URL**

```javascript
// 不安全的URL构建方式
function unsafeLoadProfile(userId) {
    // 危险：直接拼接用户输入构建URL
    fetch(`/api/proxy?url=https://profiles.example.com/user/${userId}`);
}

// 安全的URL构建方式
function safeLoadProfile(userId) {
    // 安全：使用参数传递，而不是URL拼接
    if (!/^\d+$/.test(userId)) {
        throw new Error('无效的用户ID');
    }
    
    fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
    });
}
```

3. **防止开放重定向**

```javascript
// 不安全的重定向函数
function unsafeRedirect(redirectUrl) {
    // 危险：直接使用用户控制的URL进行重定向
    window.location.href = redirectUrl;
}

// 安全的重定向函数
function safeRedirect(redirectUrl) {
    // 验证重定向URL
    try {
        const url = new URL(redirectUrl, window.location.origin);
        
        // 同源检查：只允许重定向到相同域名
        if (url.origin !== window.location.origin) {
            console.error('重定向安全检查失败：非同源URL', url.origin);
            return false;
        }
        
        // 安全重定向
        window.location.href = url.href;
        return true;
    } catch (e) {
        console.error('无效的重定向URL');
        return false;
    }
}
```

4. **前端API代理保护**

```javascript
// 前端API代理保护
class ApiProxy {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.allowedEndpoints = [
            '/api/users',
            '/api/products',
            '/api/orders'
        ];
    }
    
    async request(endpoint, options = {}) {
        // 验证端点是否在允许列表中
        if (!this.allowedEndpoints.includes(endpoint)) {
            throw new Error(`不允许访问的端点: ${endpoint}`);
        }
        
        // 构建URL，避免用户直接控制完整URL
        const url = `${this.baseUrl}${endpoint}`;
        
        // 发送请求
        return fetch(url, {
            ...options,
            credentials: 'include'
        });
    }
}

// 使用示例
const api = new ApiProxy('https://api.example.com');
api.request('/api/users').then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('API请求失败:', error));
```

### 协作防御SSRF

虽然SSRF主要在服务器端防御，但前端开发者可以：

1. 在前端进行初步URL验证，减轻服务器负担
2. 避免使用允许用户控制请求目标的API
3. 与后端开发者协作，确保API设计不容易引发SSRF
4. 使用相对URL而非绝对URL，减少SSRF风险 

## API请求频率限制

### 概述

API请求频率限制（Rate Limiting）是保护Web应用免受滥用、DoS攻击和资源耗尽的重要安全措施。前端实现合理的请求限制可以减轻服务器压力、防止API滥用和提高用户体验。

### 防御策略与代码实现

1. **基础请求节流**

```javascript
// 基本的节流函数，限制函数执行频率
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 使用节流函数限制API调用频率
const throttledFetchData = throttle(fetchData, 1000); // 限制为每秒最多1次

// 使用示例
document.querySelector('#search-input').addEventListener('input', function() {
    throttledFetchData(this.value);
});

function fetchData(query) {
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            // 处理响应数据
            console.log(data);
        });
}
```

2. **防抖动处理**

```javascript
// 防抖函数，等待用户停止操作一段时间后再执行
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

// 使用防抖函数处理输入事件
const debouncedSearch = debounce(searchAPI, 500); // 用户停止输入500ms后才发送请求

// 使用示例
document.querySelector('#search-box').addEventListener('input', function() {
    debouncedSearch(this.value);
});

function searchAPI(query) {
    // 只有用户停止输入后才会执行这个函数
    fetch(`/api/search?q=${encodeURIComponent(query)}`);
}
```

3. **请求队列管理**

```javascript
// 请求队列管理器
class RequestQueue {
    constructor(maxConcurrent = 2, interval = 1000) {
        this.queue = [];
        this.running = 0;
        this.maxConcurrent = maxConcurrent; // 最大并发请求数
        this.interval = interval; // 请求间隔（毫秒）
        this.lastRequestTime = 0;
    }
    
    // 添加请求到队列
    add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                request: requestFn,
                resolve,
                reject
            });
            
            this.processQueue();
        });
    }
    
    // 处理队列
    async processQueue() {
        if (this.running >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }
        
        // 控制请求间隔
        const now = Date.now();
        const timeToWait = Math.max(0, this.interval - (now - this.lastRequestTime));
        
        if (timeToWait > 0) {
            await new Promise(resolve => setTimeout(resolve, timeToWait));
        }
        
        const item = this.queue.shift();
        this.running++;
        this.lastRequestTime = Date.now();
        
        try {
            const result = await item.request();
            item.resolve(result);
        } catch (error) {
            item.reject(error);
        } finally {
            this.running--;
            this.processQueue();
        }
    }
}

// 使用示例
const apiQueue = new RequestQueue(2, 1000); // 最多2个并发请求，间隔1秒

function fetchUserData(userId) {
    return apiQueue.add(() => {
        return fetch(`/api/users/${userId}`)
            .then(response => response.json());
    });
}

// 同时发起多个请求，但会自动排队
for (let i = 1; i <= 10; i++) {
    fetchUserData(i)
        .then(data => console.log(`用户${i}数据:`, data))
        .catch(error => console.error(`获取用户${i}数据失败:`, error));
}
```

4. **请求计数器与拦截**

```javascript
// API请求监控与限制
class ApiRateLimiter {
    constructor(options = {}) {
        this.limits = {
            perSecond: options.perSecond || 5,
            perMinute: options.perMinute || 30,
            perHour: options.perHour || 500
        };
        
        this.counters = {
            second: { count: 0, timestamp: Date.now() },
            minute: { count: 0, timestamp: Date.now() },
            hour: { count: 0, timestamp: Date.now() }
        };
        
        // 注册全局拦截器
        this.setupInterceptors();
    }
    
    // 重置计数器
    resetCounter(type) {
        const now = Date.now();
        
        // 计算时间间隔
        const intervals = {
            second: 1000,
            minute: 60 * 1000,
            hour: 60 * 60 * 1000
        };
        
        // 如果超过了时间间隔，重置计数器
        if (now - this.counters[type].timestamp > intervals[type]) {
            this.counters[type] = { count: 0, timestamp: now };
        }
    }
    
    // 检查是否超过限制
    isRateLimited() {
        const types = ['second', 'minute', 'hour'];
        
        // 检查所有类型的限制
        for (const type of types) {
            this.resetCounter(type);
            
            if (this.counters[type].count >= this.limits[`per${type.charAt(0).toUpperCase() + type.slice(1)}`]) {
                return {
                    limited: true,
                    type,
                    limit: this.limits[`per${type.charAt(0).toUpperCase() + type.slice(1)}`],
                    current: this.counters[type].count
                };
            }
        }
        
        return { limited: false };
    }
    
    // 记录请求
    recordRequest() {
        Object.keys(this.counters).forEach(type => {
            this.resetCounter(type);
            this.counters[type].count++;
        });
    }
    
    // 设置拦截器
    setupInterceptors() {
        // 拦截fetch请求
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const limitStatus = this.isRateLimited();
            
            if (limitStatus.limited) {
                console.warn(`API请求频率限制: 超过${limitStatus.type}限制 (${limitStatus.current}/${limitStatus.limit})`);
                
                // 可以选择排队、延迟或拒绝请求
                return Promise.reject(new Error(`API频率限制: ${limitStatus.type}`));
            }
            
            // 记录请求
            this.recordRequest();
            
            // 执行原始请求
            return originalFetch.apply(window, args);
        };
        
        // 也可以拦截XMLHttpRequest
        // ... 类似实现
    }
}

// 初始化API限制器
const apiLimiter = new ApiRateLimiter({
    perSecond: 3,  // 每秒最多3个请求
    perMinute: 20, // 每分钟最多20个请求
    perHour: 200   // 每小时最多200个请求
});

// 正常使用fetch，限制器会自动工作
fetch('/api/data')
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => {
        if (error.message.includes('API频率限制')) {
            console.log('请求被限制，稍后再试');
        } else {
            console.error('请求失败:', error);
        }
    });
```

5. **重试策略（指数退避）**

```javascript
// 使用指数退避算法的重试函数
async function fetchWithRetry(url, options = {}, retries = 3) {
    const baseDelay = 1000; // 初始延迟1秒
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fetch(url, options);
        } catch (error) {
            // 检查是否还有重试次数
            if (attempt === retries) {
                throw error;
            }
            
            // 计算下一次重试延迟（指数退避）
            const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
            console.log(`请求失败，${delay}ms后重试 (${attempt + 1}/${retries})`, error);
            
            // 等待退避时间
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// 使用示例
fetchWithRetry('/api/data', { method: 'GET' }, 3)
    .then(response => response.json())
    .then(data => console.log('成功获取数据:', data))
    .catch(error => console.error('所有重试失败:', error));
```

### 客户端与服务器协作

虽然服务器端应该实施更强的请求限制，但前端的限制有助于：

1. 提高用户体验，避免不必要的请求被阻止
2. 减少服务器负载，预先过滤掉不合理的请求
3. 减轻网络拥塞，特别是在移动网络下
4. 更优雅地处理限流情况，提供友好的用户反馈 

## AES与RSA加密算法

### 概述

在前端安全中，加密算法是保护数据传输和存储安全的关键机制。常用的加密算法主要分为对称加密（如AES）和非对称加密（如RSA）两大类，它们在前端应用中有着不同的用途和优势。

### 对称加密（AES）

Advanced Encryption Standard（高级加密标准）是目前最流行的对称加密算法，它使用相同的密钥进行加密和解密。

#### 特点与应用场景
- 加密/解密速度快，适合大量数据加密
- 密钥管理是最大挑战，需要安全传输密钥
- 适合用于数据存储加密、会话加密等场景

#### AES加密实现

```javascript
/**
 * AES加密工具类
 */
class AESUtil {
    /**
     * 生成随机AES密钥
     * @param {number} bits 密钥长度，可选值: 128, 192, 256
     * @returns {Promise<CryptoKey>} AES密钥
     */
    static async generateKey(bits = 256) {
        const keyLength = [128, 192, 256].includes(bits) ? bits : 256;
        
        return window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: keyLength
            },
            true, // 是否可导出
            ["encrypt", "decrypt"] // 密钥用途
        );
    }
    
    /**
     * 将AES密钥导出为base64字符串
     * @param {CryptoKey} key AES密钥
     * @returns {Promise<string>} base64编码的密钥字符串
     */
    static async exportKey(key) {
        const rawKey = await window.crypto.subtle.exportKey("raw", key);
        return this._arrayBufferToBase64(rawKey);
    }
    
    /**
     * 从base64字符串导入AES密钥
     * @param {string} keyString base64编码的密钥字符串
     * @returns {Promise<CryptoKey>} AES密钥
     */
    static async importKey(keyString) {
        const rawKey = this._base64ToArrayBuffer(keyString);
        
        return window.crypto.subtle.importKey(
            "raw",
            rawKey,
            {
                name: "AES-GCM"
            },
            false, // 是否可导出
            ["encrypt", "decrypt"] // 密钥用途
        );
    }
    
    /**
     * 使用AES-GCM算法加密数据
     * @param {CryptoKey} key AES密钥
     * @param {string} data 要加密的数据
     * @returns {Promise<string>} base64编码的密文
     */
    static async encrypt(key, data) {
        // 生成随机初始化向量（IV）
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // 将字符串转换为ArrayBuffer
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        // 加密数据
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: 128 // 认证标签长度
            },
            key,
            dataBuffer
        );
        
        // 将IV和密文合并并转换为base64
        const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        result.set(iv);
        result.set(new Uint8Array(encryptedBuffer), iv.length);
        
        return this._arrayBufferToBase64(result);
    }
    
    /**
     * 解密AES加密的数据
     * @param {CryptoKey} key AES密钥
     * @param {string} encryptedData base64编码的密文
     * @returns {Promise<string>} 解密后的明文
     */
    static async decrypt(key, encryptedData) {
        // 将base64转换为ArrayBuffer
        const data = this._base64ToArrayBuffer(encryptedData);
        
        // 从数据中提取IV和密文
        const iv = data.slice(0, 12);
        const ciphertext = data.slice(12);
        
        // 解密数据
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: 128 // 认证标签长度
            },
            key,
            ciphertext
        );
        
        // 将ArrayBuffer转换为字符串
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    }
    
    /**
     * 将ArrayBuffer转换为base64字符串
     * @private
     */
    static _arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        const binaryString = bytes.reduce((str, byte) => str + String.fromCharCode(byte), '');
        return btoa(binaryString);
    }
    
    /**
     * 将base64字符串转换为ArrayBuffer
     * @private
     */
    static _base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
```

#### 使用示例

```javascript
// AES加密使用示例
async function aesExample() {
    try {
        // 生成AES密钥
        const key = await AESUtil.generateKey(256);
        
        // 导出密钥（用于存储或传输）
        const exportedKey = await AESUtil.exportKey(key);
        console.log("AES密钥:", exportedKey);
        
        // 加密数据
        const plaintext = "这是一段敏感信息，需要加密保护";
        const encrypted = await AESUtil.encrypt(key, plaintext);
        console.log("加密后:", encrypted);
        
        // 解密数据
        const decrypted = await AESUtil.decrypt(key, encrypted);
        console.log("解密后:", decrypted);
        
        // 验证解密结果
        console.log("加解密一致:", plaintext === decrypted);
    } catch (error) {
        console.error("AES加解密失败:", error);
    }
}
```

### 非对称加密（RSA）

RSA算法是一种广泛使用的非对称加密算法，使用公钥和私钥对，公钥用于加密，私钥用于解密。

#### 特点与应用场景
- 无需共享密钥，解决了密钥分发问题
- 计算复杂度高，不适合加密大量数据
- 适合密钥交换、数字签名、身份验证等场景

#### RSA加密实现

```javascript
/**
 * RSA加密工具类
 */
class RSAUtil {
    /**
     * 生成RSA密钥对
     * @param {number} modulusLength 密钥长度，推荐2048或4096
     * @returns {Promise<CryptoKeyPair>} 包含公钥和私钥的密钥对
     */
    static async generateKeyPair(modulusLength = 2048) {
        return window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: modulusLength,
                publicExponent: new Uint8Array([1, 0, 1]), // 65537
                hash: "SHA-256"
            },
            true, // 是否可导出
            ["encrypt", "decrypt"] // 密钥用途
        );
    }
    
    /**
     * 导出RSA公钥为PEM格式
     * @param {CryptoKey} publicKey RSA公钥
     * @returns {Promise<string>} PEM格式的公钥
     */
    static async exportPublicKey(publicKey) {
        const exported = await window.crypto.subtle.exportKey("spki", publicKey);
        const exportedAsBase64 = this._arrayBufferToBase64(exported);
        return `-----BEGIN PUBLIC KEY-----\n${this._formatPEM(exportedAsBase64)}\n-----END PUBLIC KEY-----`;
    }
    
    /**
     * 导出RSA私钥为PEM格式
     * @param {CryptoKey} privateKey RSA私钥
     * @returns {Promise<string>} PEM格式的私钥
     */
    static async exportPrivateKey(privateKey) {
        const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
        const exportedAsBase64 = this._arrayBufferToBase64(exported);
        return `-----BEGIN PRIVATE KEY-----\n${this._formatPEM(exportedAsBase64)}\n-----END PRIVATE KEY-----`;
    }
    
    /**
     * 导入PEM格式的RSA公钥
     * @param {string} pem PEM格式的公钥
     * @returns {Promise<CryptoKey>} RSA公钥
     */
    static async importPublicKey(pem) {
        // 移除PEM头尾和换行符
        const pemContents = pem
            .replace("-----BEGIN PUBLIC KEY-----", "")
            .replace("-----END PUBLIC KEY-----", "")
            .replace(/\n/g, "");
        
        const binaryDer = this._base64ToArrayBuffer(pemContents);
        
        return window.crypto.subtle.importKey(
            "spki",
            binaryDer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256"
            },
            true,
            ["encrypt"]
        );
    }
    
    /**
     * 导入PEM格式的RSA私钥
     * @param {string} pem PEM格式的私钥
     * @returns {Promise<CryptoKey>} RSA私钥
     */
    static async importPrivateKey(pem) {
        // 移除PEM头尾和换行符
        const pemContents = pem
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace(/\n/g, "");
        
        const binaryDer = this._base64ToArrayBuffer(pemContents);
        
        return window.crypto.subtle.importKey(
            "pkcs8",
            binaryDer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256"
            },
            true,
            ["decrypt"]
        );
    }
    
    /**
     * 使用RSA-OAEP算法加密数据
     * @param {CryptoKey} publicKey RSA公钥
     * @param {string} data 要加密的数据
     * @returns {Promise<string>} base64编码的密文
     */
    static async encrypt(publicKey, data) {
        // 将字符串转换为ArrayBuffer
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        // RSA加密
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            publicKey,
            dataBuffer
        );
        
        // 转换为base64
        return this._arrayBufferToBase64(encryptedBuffer);
    }
    
    /**
     * 解密RSA加密的数据
     * @param {CryptoKey} privateKey RSA私钥
     * @param {string} encryptedData base64编码的密文
     * @returns {Promise<string>} 解密后的明文
     */
    static async decrypt(privateKey, encryptedData) {
        // 将base64转换为ArrayBuffer
        const encryptedBuffer = this._base64ToArrayBuffer(encryptedData);
        
        // RSA解密
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            privateKey,
            encryptedBuffer
        );
        
        // 将ArrayBuffer转换为字符串
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    }
    
    /**
     * 格式化PEM字符串，每64个字符添加换行符
     * @private
     */
    static _formatPEM(base64) {
        return base64.match(/.{1,64}/g).join("\n");
    }
    
    /**
     * 将ArrayBuffer转换为base64字符串
     * @private
     */
    static _arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        const binaryString = bytes.reduce((str, byte) => str + String.fromCharCode(byte), '');
        return btoa(binaryString);
    }
    
    /**
     * 将base64字符串转换为ArrayBuffer
     * @private
     */
    static _base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
```

#### 使用示例

```javascript
// RSA加密使用示例
async function rsaExample() {
    try {
        // 生成RSA密钥对
        const keyPair = await RSAUtil.generateKeyPair(2048);
        
        // 导出公钥和私钥（用于存储或分发）
        const publicKeyPEM = await RSAUtil.exportPublicKey(keyPair.publicKey);
        const privateKeyPEM = await RSAUtil.exportPrivateKey(keyPair.privateKey);
        
        console.log("公钥:", publicKeyPEM);
        console.log("私钥:", privateKeyPEM);
        
        // 加密数据
        const plaintext = "使用RSA加密的敏感信息";
        const encrypted = await RSAUtil.encrypt(keyPair.publicKey, plaintext);
        console.log("加密后:", encrypted);
        
        // 解密数据
        const decrypted = await RSAUtil.decrypt(keyPair.privateKey, encrypted);
        console.log("解密后:", decrypted);
        
        // 验证解密结果
        console.log("加解密一致:", plaintext === decrypted);
    } catch (error) {
        console.error("RSA加解密失败:", error);
    }
}
```

### 数字签名实现

数字签名是非对称加密的重要应用，用于验证消息的完整性和发送者身份。

```javascript
/**
 * 数字签名工具类
 */
class SignatureUtil {
    /**
     * 生成RSA签名密钥对
     * @param {number} modulusLength 密钥长度，推荐2048或4096
     * @returns {Promise<CryptoKeyPair>} 包含公钥和私钥的密钥对
     */
    static async generateKeyPair(modulusLength = 2048) {
        return window.crypto.subtle.generateKey(
            {
                name: "RSA-PSS",
                modulusLength: modulusLength,
                publicExponent: new Uint8Array([1, 0, 1]), // 65537
                hash: "SHA-256"
            },
            true,
            ["sign", "verify"]
        );
    }
    
    /**
     * 导出签名用的公钥为PEM格式
     * @param {CryptoKey} publicKey 签名公钥
     * @returns {Promise<string>} PEM格式的公钥
     */
    static async exportPublicKey(publicKey) {
        // 导出实现与RSAUtil类似
        const exported = await window.crypto.subtle.exportKey("spki", publicKey);
        const exportedAsBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
        return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64.match(/.{1,64}/g).join("\n")}\n-----END PUBLIC KEY-----`;
    }
    
    /**
     * 计算消息的哈希值（SHA-256）
     * @param {string} message 要计算哈希的消息
     * @returns {Promise<ArrayBuffer>} 哈希值
     */
    static async digest(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        return window.crypto.subtle.digest("SHA-256", data);
    }
    
    /**
     * 对消息进行签名
     * @param {CryptoKey} privateKey 私钥
     * @param {string} message 要签名的消息
     * @returns {Promise<string>} base64编码的签名
     */
    static async sign(privateKey, message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        
        // 使用RSA-PSS签名算法
        const signature = await window.crypto.subtle.sign(
            {
                name: "RSA-PSS",
                saltLength: 32 // 盐长度
            },
            privateKey,
            data
        );
        
        // 转换为base64
        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }
    
    /**
     * 验证消息签名
     * @param {CryptoKey} publicKey 公钥
     * @param {string} signature base64编码的签名
     * @param {string} message 原始消息
     * @returns {Promise<boolean>} 签名是否有效
     */
    static async verify(publicKey, signature, message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        
        // 将base64签名转换为ArrayBuffer
        const binaryString = atob(signature);
        const signatureBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            signatureBytes[i] = binaryString.charCodeAt(i);
        }
        
        // 验证签名
        return window.crypto.subtle.verify(
            {
                name: "RSA-PSS",
                saltLength: 32
            },
            publicKey,
            signatureBytes,
            data
        );
    }
}
```

#### 签名使用示例

```javascript
// 数字签名使用示例
async function signatureExample() {
    try {
        // 生成签名密钥对
        const keyPair = await SignatureUtil.generateKeyPair(2048);
        
        // 原始消息
        const message = "这是需要签名的重要消息";
        
        // 计算消息摘要
        const digest = await SignatureUtil.digest(message);
        console.log("消息摘要:", new Uint8Array(digest));
        
        // 对消息进行签名
        const signature = await SignatureUtil.sign(keyPair.privateKey, message);
        console.log("数字签名:", signature);
        
        // 验证签名
        const isValid = await SignatureUtil.verify(keyPair.publicKey, signature, message);
        console.log("签名验证结果:", isValid ? "有效" : "无效");
        
        // 验证被篡改的消息
        const tamperedMessage = message + "被篡改";
        const isValidTampered = await SignatureUtil.verify(keyPair.publicKey, signature, tamperedMessage);
        console.log("篡改消息验证结果:", isValidTampered ? "有效" : "无效");
    } catch (error) {
        console.error("数字签名操作失败:", error);
    }
}
```

### 混合加密方案

在实际应用中，通常结合使用对称加密和非对称加密，发挥各自优势：

```javascript
/**
 * 混合加密示例 - 结合AES和RSA优势
 */
async function hybridEncryptionExample() {
    try {
        // 1. 生成RSA密钥对（接收方的公钥和私钥）
        const rsaKeyPair = await RSAUtil.generateKeyPair();
        
        // 2. 生成一次性AES会话密钥
        const aesKey = await AESUtil.generateKey();
        const aesKeyString = await AESUtil.exportKey(aesKey);
        
        // 3. 使用RSA公钥加密AES密钥
        const encryptedAesKey = await RSAUtil.encrypt(
            rsaKeyPair.publicKey, 
            aesKeyString
        );
        
        // 4. 使用AES密钥加密实际数据（可以是大量数据）
        const message = "这是一个使用混合加密方案保护的大型消息。在实际应用中，这可能是一个很大的数据块，比如文件内容或大量的用户数据。";
        const encryptedData = await AESUtil.encrypt(aesKey, message);
        
        console.log("RSA加密的AES密钥:", encryptedAesKey);
        console.log("AES加密的数据:", encryptedData);
        
        // === 接收方解密过程 ===
        
        // 5. 使用RSA私钥解密AES密钥
        const decryptedAesKeyString = await RSAUtil.decrypt(
            rsaKeyPair.privateKey, 
            encryptedAesKey
        );
        const recoveredAesKey = await AESUtil.importKey(decryptedAesKeyString);
        
        // 6. 使用恢复的AES密钥解密数据
        const decryptedMessage = await AESUtil.decrypt(recoveredAesKey, encryptedData);
        
        console.log("解密后的消息:", decryptedMessage);
        console.log("解密结果验证:", message === decryptedMessage);
    } catch (error) {
        console.error("混合加密失败:", error);
    }
}
```

### 加密算法最佳实践

1. **密钥管理安全**
   - 不要在源代码中硬编码密钥
   - 避免将私钥存储在前端
   - 考虑使用密钥派生函数（KDF）从用户输入生成密钥

2. **加密实现注意事项**
   - 使用现代加密库和API，避免自己实现加密算法
   - 使用适当的密钥长度（AES: 256位, RSA: 2048位或以上）
   - 加密前使用随机盐值或初始化向量（IV）

3. **安全存储**
   - 在localStorage或sessionStorage中存储加密数据而非明文数据
   - 考虑密码学安全的键值存储库或安全元素
   
4. **合理使用场景**
   - 敏感数据传输：混合加密（RSA+AES）
   - 身份验证：数字签名+消息摘要
   - 本地数据存储：对称加密（AES）
   - 前端加密不能替代TLS/HTTPS，应视为额外保护层

5. **性能注意事项**
   - RSA操作在大型数据集上性能较差，限制RSA加密的数据大小
   - 考虑Web Worker处理密集型加密操作，避免阻塞UI线程