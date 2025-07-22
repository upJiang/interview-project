# 跨域原理与处理方式

## 概述

跨域问题是Web开发中常见的安全限制，特别在前后端分离的电商项目中更为突出。本文档详细介绍了同源策略的原理、各种跨域场景以及相应的解决方案。

## 核心知识点

### 1. 同源策略（Same-Origin Policy）

#### 同源定义
两个URL同源需要满足以下三个条件：
- **协议相同**：http/https
- **域名相同**：www.example.com
- **端口相同**：80/443/8080等

```javascript
// 同源检测工具
class SameOriginChecker {
  static isSameOrigin(url1, url2) {
    try {
      const u1 = new URL(url1);
      const u2 = new URL(url2);
      
      return u1.protocol === u2.protocol &&
             u1.hostname === u2.hostname &&
             u1.port === u2.port;
    } catch (error) {
      console.error('URL parsing error:', error);
      return false;
    }
  }
  
  static checkCurrentOrigin(targetUrl) {
    return this.isSameOrigin(window.location.href, targetUrl);
  }
  
  static getOriginInfo(url) {
    try {
      const u = new URL(url);
      return {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? '443' : '80'),
        origin: u.origin
      };
    } catch (error) {
      return null;
    }
  }
  
  // 检测不同类型的跨域情况
  static analyzeCrossOrigin(sourceUrl, targetUrl) {
    const source = this.getOriginInfo(sourceUrl);
    const target = this.getOriginInfo(targetUrl);
    
    if (!source || !target) {
      return { type: 'invalid_url', crossOrigin: true };
    }
    
    if (source.origin === target.origin) {
      return { type: 'same_origin', crossOrigin: false };
    }
    
    const differences = [];
    if (source.protocol !== target.protocol) differences.push('protocol');
    if (source.hostname !== target.hostname) differences.push('hostname');
    if (source.port !== target.port) differences.push('port');
    
    return {
      type: 'cross_origin',
      crossOrigin: true,
      differences,
      source: source,
      target: target
    };
  }
}

// 使用示例
const analysis = SameOriginChecker.analyzeCrossOrigin(
  'https://www.shop.com:443/products',
  'https://api.shop.com:8080/data'
);

console.log(analysis);
// 输出: { type: 'cross_origin', crossOrigin: true, differences: ['hostname', 'port'], ... }
```

#### 同源策略限制的内容

```javascript
/**
 * 同源策略限制演示
 */
class SameOriginLimitations {
  // 1. XMLHttpRequest和Fetch API限制
  static demonstrateAjaxLimitation() {
    // 同源请求 - 正常
    fetch('/api/user/profile')
      .then(response => response.json())
      .then(data => console.log('同源请求成功:', data))
      .catch(error => console.error('请求失败:', error));
    
    // 跨域请求 - 会被阻止（除非服务器支持CORS）
    fetch('https://api.external.com/data')
      .then(response => response.json())
      .then(data => console.log('跨域请求成功:', data))
      .catch(error => console.error('跨域请求被阻止:', error));
  }
  
  // 2. DOM访问限制
  static demonstrateDOMAccessLimitation() {
    // 创建跨域iframe
    const iframe = document.createElement('iframe');
    iframe.src = 'https://external.com/page';
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      try {
        // 尝试访问跨域iframe的内容 - 会抛出异常
        const iframeDocument = iframe.contentDocument;
        console.log('iframe内容:', iframeDocument.body.innerHTML);
      } catch (error) {
        console.error('无法访问跨域iframe内容:', error.message);
        // 输出: "Blocked a frame with origin "https://current.com" from accessing a cross-origin frame."
      }
    };
  }
  
  // 3. Cookie访问限制
  static demonstrateCookieLimitation() {
    // 只能访问同源的Cookie
    console.log('当前域的Cookie:', document.cookie);
    
    // 无法通过JavaScript直接访问其他域的Cookie
    // 这是浏览器的安全机制
  }
  
  // 4. LocalStorage和SessionStorage限制
  static demonstrateStorageLimitation() {
    // 每个源都有独立的存储空间
    localStorage.setItem('test', 'current-origin-data');
    
    // 无法访问其他源的存储
    console.log('当前源的localStorage:', localStorage.getItem('test'));
    
    // 不同源的页面无法共享localStorage
  }
  
  // 5. 检测哪些资源不受同源策略限制
  static demonstrateExceptions() {
    console.log('以下资源不受同源策略限制:');
    
    // 图片资源
    const img = new Image();
    img.src = 'https://external.com/image.jpg';
    img.onload = () => console.log('✓ 图片可以跨域加载');
    
    // CSS样式表
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://external.com/styles.css';
    document.head.appendChild(link);
    console.log('✓ CSS可以跨域加载');
    
    // JavaScript脚本（但有限制）
    const script = document.createElement('script');
    script.src = 'https://external.com/script.js';
    document.head.appendChild(script);
    console.log('✓ JavaScript可以跨域加载');
    
    // 字体文件
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto';
    document.head.appendChild(fontLink);
    console.log('✓ 字体可以跨域加载');
    
    // 视频和音频
    const video = document.createElement('video');
    video.src = 'https://external.com/video.mp4';
    console.log('✓ 媒体文件可以跨域加载');
  }
}
```

### 2. CORS（跨源资源共享）

#### CORS基本原理

```javascript
/**
 * CORS跨域解决方案
 */
class CORSManager {
  constructor() {
    this.supportedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    this.allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'];
  }
  
  // 检测CORS支持
  static isCORSSupported() {
    return 'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest();
  }
  
  // 简单请求检测
  static isSimpleRequest(method, headers) {
    const simpleMethods = ['GET', 'HEAD', 'POST'];
    const simpleHeaders = [
      'accept',
      'accept-language',
      'content-language',
      'content-type'
    ];
    
    // 检查方法
    if (!simpleMethods.includes(method.toUpperCase())) {
      return false;
    }
    
    // 检查Content-Type
    const contentType = headers['content-type'] || headers['Content-Type'];
    if (contentType) {
      const simpleContentTypes = [
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain'
      ];
      
      if (!simpleContentTypes.some(type => contentType.includes(type))) {
        return false;
      }
    }
    
    // 检查自定义头
    const headerNames = Object.keys(headers).map(h => h.toLowerCase());
    const hasCustomHeaders = headerNames.some(name => 
      !simpleHeaders.includes(name) && !name.startsWith('content-')
    );
    
    return !hasCustomHeaders;
  }
  
  // CORS请求封装
  async makeCORSRequest(url, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body = null,
      credentials = 'same-origin',
      timeout = 10000
    } = options;
    
    // 检查是否为简单请求
    const isSimple = CORSManager.isSimpleRequest(method, headers);
    console.log(`${isSimple ? '简单' : '预检'}请求:`, { method, url });
    
    // 设置CORS相关头部
    const corsHeaders = {
      ...headers,
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method,
        headers: corsHeaders,
        body,
        credentials,
        signal: controller.signal,
        mode: 'cors' // 显式设置CORS模式
      });
      
      clearTimeout(timeoutId);
      
      // 检查CORS响应头
      this.logCORSHeaders(response);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      } else if (error.message.includes('CORS')) {
        throw new Error('CORS错误: ' + error.message);
      }
      throw error;
    }
  }
  
  // 记录CORS响应头信息
  logCORSHeaders(response) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
      'Access-Control-Max-Age': response.headers.get('Access-Control-Max-Age')
    };
    
    console.log('CORS响应头:', corsHeaders);
  }
  
  // 预检请求模拟
  async sendPreflightRequest(url, method, headers) {
    try {
      const preflightResponse = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': method,
          'Access-Control-Request-Headers': Object.keys(headers).join(', '),
          'Origin': window.location.origin
        },
        mode: 'cors'
      });
      
      console.log('预检请求响应:', {
        status: preflightResponse.status,
        headers: {
          'Access-Control-Allow-Origin': preflightResponse.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': preflightResponse.headers.get('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': preflightResponse.headers.get('Access-Control-Allow-Headers'),
          'Access-Control-Max-Age': preflightResponse.headers.get('Access-Control-Max-Age')
        }
      });
      
      return preflightResponse.ok;
    } catch (error) {
      console.error('预检请求失败:', error);
      return false;
    }
  }
  
  // 带凭证的CORS请求
  async makeCredentialedRequest(url, options = {}) {
    return this.makeCORSRequest(url, {
      ...options,
      credentials: 'include' // 包含Cookie
    });
  }
  
  // CORS错误处理
  handleCORSError(error, url) {
    console.error('CORS请求失败:', error);
    
    const errorInfo = {
      url,
      error: error.message,
      suggestions: []
    };
    
    if (error.message.includes('CORS')) {
      errorInfo.suggestions.push('检查服务器是否设置了正确的CORS头');
      errorInfo.suggestions.push('确认Access-Control-Allow-Origin包含当前域名');
      
      if (error.message.includes('credentials')) {
        errorInfo.suggestions.push('检查Access-Control-Allow-Credentials设置');
      }
    }
    
    return errorInfo;
  }
}

// 使用示例
const corsManager = new CORSManager();

// 简单GET请求
corsManager.makeCORSRequest('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log('数据:', data))
  .catch(error => console.error('错误:', error));

// 复杂POST请求（会触发预检）
corsManager.makeCORSRequest('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
})
.then(response => response.json())
.then(data => console.log('创建成功:', data))
.catch(error => console.error('创建失败:', error));
```

#### 服务器端CORS配置示例

```javascript
/**
 * 服务器端CORS配置参考（Node.js/Express示例）
 */
class ServerCORSConfig {
  // 基本CORS中间件
  static basicCORS() {
    return `
// Express CORS中间件
app.use((req, res, next) => {
  // 允许的源
  const allowedOrigins = [
    'https://www.shop.com',
    'https://admin.shop.com',
    'http://localhost:3000' // 开发环境
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // 允许的方法
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // 允许的头部
  res.setHeader('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
  
  // 允许携带凭证
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // 预检请求缓存时间
  res.setHeader('Access-Control-Max-Age', '86400'); // 24小时
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});
    `;
  }
  
  // 动态CORS配置
  static dynamicCORS() {
    return `
// 动态CORS配置
const corsOptions = {
  origin: (origin, callback) => {
    // 检查域名白名单
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
    
    // 允许无origin的请求（如移动应用）
    if (!origin) return callback(null, true);
    
    // 检查域名是否在白名单中
    const isAllowed = allowedDomains.some(domain => {
      return origin.includes(domain) || origin.endsWith(domain);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  credentials: true,
  
  optionsSuccessStatus: 200,
  
  // 动态设置允许的方法
  methods: (req) => {
    const userRole = req.headers['x-user-role'];
    
    if (userRole === 'admin') {
      return ['GET', 'POST', 'PUT', 'DELETE'];
    } else {
      return ['GET', 'POST'];
    }
  }
};

app.use(cors(corsOptions));
    `;
  }
  
  // 安全CORS配置
  static secureCORS() {
    return `
// 安全的CORS配置
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // 验证Origin和Referer一致性
  if (origin && referer) {
    const originDomain = new URL(origin).hostname;
    const refererDomain = new URL(referer).hostname;
    
    if (originDomain !== refererDomain) {
      return res.status(403).json({ error: 'Origin和Referer不匹配' });
    }
  }
  
  // 检查请求频率（防止CORS攻击）
  const clientIP = req.ip;
  const requestCount = getRequestCount(clientIP);
  
  if (requestCount > 100) { // 每分钟最多100次请求
    return res.status(429).json({ error: '请求过于频繁' });
  }
  
  // 只在HTTPS环境下允许跨域
  if (req.protocol !== 'https' && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: '仅支持HTTPS跨域请求' });
  }
  
  // 设置安全的CORS头
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '300'); // 5分钟
  
  next();
});
    `;
  }
}
```

### 3. JSONP（JSON with Padding）

```javascript
/**
 * JSONP跨域解决方案
 */
class JSONPManager {
  constructor() {
    this.callbackCounter = 0;
    this.pendingRequests = new Map();
  }
  
  // 发送JSONP请求
  jsonpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        timeout = 10000,
        callbackParam = 'callback',
        callbackName = null
      } = options;
      
      // 生成唯一的回调函数名
      const callback = callbackName || `jsonp_callback_${Date.now()}_${++this.callbackCounter}`;
      
      // 创建script标签
      const script = document.createElement('script');
      script.type = 'text/javascript';
      
      // 构建URL
      const separator = url.includes('?') ? '&' : '?';
      script.src = `${url}${separator}${callbackParam}=${callback}`;
      
      // 设置超时
      const timeoutId = setTimeout(() => {
        this.cleanup(callback, script);
        reject(new Error('JSONP请求超时'));
      }, timeout);
      
      // 定义全局回调函数
      window[callback] = (data) => {
        clearTimeout(timeoutId);
        this.cleanup(callback, script);
        resolve(data);
      };
      
      // 处理加载错误
      script.onerror = () => {
        clearTimeout(timeoutId);
        this.cleanup(callback, script);
        reject(new Error('JSONP请求失败'));
      };
      
      // 添加到DOM并发送请求
      document.head.appendChild(script);
      
      // 记录请求信息
      this.pendingRequests.set(callback, {
        script,
        timeoutId,
        startTime: Date.now()
      });
    });
  }
  
  // 清理资源
  cleanup(callback, script) {
    // 删除全局回调函数
    if (window[callback]) {
      delete window[callback];
    }
    
    // 移除script标签
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
    
    // 清理记录
    this.pendingRequests.delete(callback);
  }
  
  // 批量JSONP请求
  async batchJSONPRequest(requests) {
    const promises = requests.map(request => {
      const { url, options } = request;
      return this.jsonpRequest(url, options)
        .then(data => ({ status: 'fulfilled', data, url }))
        .catch(error => ({ status: 'rejected', error: error.message, url }));
    });
    
    return Promise.all(promises);
  }
  
  // 带重试的JSONP请求
  async jsonpRequestWithRetry(url, options = {}) {
    const { retries = 3, retryDelay = 1000, ...requestOptions } = options;
    
    for (let i = 0; i <= retries; i++) {
      try {
        const result = await this.jsonpRequest(url, requestOptions);
        return result;
      } catch (error) {
        if (i === retries) {
          throw error;
        }
        
        console.warn(`JSONP请求失败，${retryDelay}ms后重试 (${i + 1}/${retries}):`, error.message);
        await this.delay(retryDelay);
      }
    }
  }
  
  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 获取待处理请求数量
  getPendingRequestCount() {
    return this.pendingRequests.size;
  }
  
  // 取消所有待处理请求
  cancelAllRequests() {
    for (const [callback, requestInfo] of this.pendingRequests) {
      clearTimeout(requestInfo.timeoutId);
      this.cleanup(callback, requestInfo.script);
    }
    
    console.log(`已取消 ${this.pendingRequests.size} 个待处理的JSONP请求`);
    this.pendingRequests.clear();
  }
  
  // JSONP安全检查
  validateJSONPResponse(data) {
    // 检查响应数据类型
    if (typeof data !== 'object' || data === null) {
      throw new Error('JSONP响应数据格式无效');
    }
    
    // 检查是否包含恶意脚本
    const jsonString = JSON.stringify(data);
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /Function\s*\(/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(jsonString)) {
        throw new Error('JSONP响应包含潜在危险内容');
      }
    }
    
    return data;
  }
}

// 使用示例
const jsonpManager = new JSONPManager();

// 基本JSONP请求
jsonpManager.jsonpRequest('https://api.example.com/data')
  .then(data => {
    console.log('JSONP数据:', data);
  })
  .catch(error => {
    console.error('JSONP错误:', error);
  });

// 带参数的JSONP请求
jsonpManager.jsonpRequest('https://api.example.com/search', {
  timeout: 5000,
  callbackParam: 'cb'
})
.then(data => console.log('搜索结果:', data))
.catch(error => console.error('搜索失败:', error));

// 批量JSONP请求
const batchRequests = [
  { url: 'https://api1.example.com/data' },
  { url: 'https://api2.example.com/data' },
  { url: 'https://api3.example.com/data' }
];

jsonpManager.batchJSONPRequest(batchRequests)
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`请求${index + 1}成功:`, result.data);
      } else {
        console.error(`请求${index + 1}失败:`, result.error);
      }
    });
  });
```

### 4. 代理服务器（Proxy）

```javascript
/**
 * 代理服务器配置和使用
 */
class ProxyManager {
  constructor(proxyConfig = {}) {
    this.config = {
      proxyPath: '/api/proxy',
      timeout: 30000,
      retries: 3,
      ...proxyConfig
    };
  }
  
  // 通过代理发送请求
  async proxyRequest(targetUrl, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body = null,
      timeout = this.config.timeout
    } = options;
    
    // 构建代理请求
    const proxyUrl = `${this.config.proxyPath}?target=${encodeURIComponent(targetUrl)}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(proxyUrl, {
        method,
        headers: {
          ...headers,
          'X-Proxy-Target': targetUrl,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`代理请求失败: ${response.status} ${response.statusText}`);
      }
      
      return response;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('代理请求超时');
      }
      throw error;
    }
  }
  
  // 批量代理请求
  async batchProxyRequest(requests) {
    const promises = requests.map(async (request) => {
      try {
        const response = await this.proxyRequest(request.url, request.options);
        const data = await response.json();
        return { status: 'success', data, url: request.url };
      } catch (error) {
        return { status: 'error', error: error.message, url: request.url };
      }
    });
    
    return Promise.all(promises);
  }
  
  // 代理请求缓存
  setupProxyCache() {
    const cache = new Map();
    const cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    
    const originalProxyRequest = this.proxyRequest.bind(this);
    
    this.proxyRequest = async (targetUrl, options = {}) => {
      // 只缓存GET请求
      if (options.method && options.method.toUpperCase() !== 'GET') {
        return originalProxyRequest(targetUrl, options);
      }
      
      const cacheKey = `${targetUrl}_${JSON.stringify(options)}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        console.log('使用代理缓存:', targetUrl);
        return cached.response;
      }
      
      const response = await originalProxyRequest(targetUrl, options);
      
      // 缓存成功的响应
      if (response.ok) {
        cache.set(cacheKey, {
          response: response.clone(),
          timestamp: Date.now()
        });
      }
      
      return response;
    };
    
    // 定期清理过期缓存
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > cacheTimeout) {
          cache.delete(key);
        }
      }
    }, cacheTimeout);
  }
  
  // 代理健康检查
  async checkProxyHealth() {
    try {
      const testUrl = 'https://httpbin.org/get';
      const startTime = Date.now();
      
      const response = await this.proxyRequest(testUrl, {
        timeout: 5000
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      const healthData = await response.json();
      
      return {
        status: 'healthy',
        latency,
        proxyInfo: {
          origin: healthData.origin,
          headers: healthData.headers
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // 自动重试机制
  async proxyRequestWithRetry(targetUrl, options = {}) {
    const { retries = this.config.retries, retryDelay = 1000, ...requestOptions } = options;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.proxyRequest(targetUrl, requestOptions);
        return response;
      } catch (error) {
        if (attempt === retries) {
          throw new Error(`代理请求失败，已重试${retries}次: ${error.message}`);
        }
        
        console.warn(`代理请求失败，${retryDelay}ms后重试 (${attempt + 1}/${retries}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // 指数退避
        retryDelay *= 2;
      }
    }
  }
}

// 代理服务器端配置示例（Node.js/Express）
class ProxyServerConfig {
  static createProxyMiddleware() {
    return `
const { createProxyMiddleware } = require('http-proxy-middleware');

// 基本代理配置
const proxyOptions = {
  target: 'https://api.external.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy': '', // 重写路径
  },
  
  // 请求拦截
  onProxyReq: (proxyReq, req, res) => {
    console.log('代理请求:', req.method, req.url);
    
    // 添加认证头
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    
    // 修改User-Agent
    proxyReq.setHeader('User-Agent', 'MyApp/1.0');
  },
  
  // 响应拦截
  onProxyRes: (proxyRes, req, res) => {
    console.log('代理响应:', proxyRes.statusCode);
    
    // 添加CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  },
  
  // 错误处理
  onError: (err, req, res) => {
    console.error('代理错误:', err.message);
    res.status(500).json({
      error: '代理服务器错误',
      message: err.message
    });
  }
};

app.use('/api/proxy', createProxyMiddleware(proxyOptions));
    `;
  }
  
  static createDynamicProxy() {
    return `
// 动态代理配置
app.use('/api/proxy', (req, res, next) => {
  const targetUrl = req.query.target;
  
  if (!targetUrl) {
    return res.status(400).json({ error: '缺少target参数' });
  }
  
  // 验证目标URL
  const allowedDomains = [
    'api.example.com',
    'service.example.com',
    'data.example.com'
  ];
  
  try {
    const url = new URL(targetUrl);
    const isAllowed = allowedDomains.some(domain => 
      url.hostname === domain || url.hostname.endsWith('.' + domain)
    );
    
    if (!isAllowed) {
      return res.status(403).json({ error: '不允许的目标域名' });
    }
  } catch (error) {
    return res.status(400).json({ error: '无效的目标URL' });
  }
  
  // 创建动态代理
  const dynamicProxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/proxy': '' },
    
    // 限制请求大小
    onProxyReq: (proxyReq, req, res) => {
      const contentLength = parseInt(req.headers['content-length'] || '0');
      if (contentLength > 1024 * 1024) { // 1MB限制
        res.status(413).json({ error: '请求体过大' });
        return;
      }
    }
  });
  
  dynamicProxy(req, res, next);
});
    `;
  }
}
```

### 5. PostMessage跨域通信

```javascript
/**
 * PostMessage跨域通信管理器
 */
class PostMessageManager {
  constructor(options = {}) {
    this.config = {
      allowedOrigins: options.allowedOrigins || [],
      timeout: options.timeout || 10000,
      enableLogging: options.enableLogging || false
    };
    
    this.messageHandlers = new Map();
    this.pendingMessages = new Map();
    this.messageId = 0;
    
    this.init();
  }
  
  init() {
    window.addEventListener('message', (event) => {
      this.handleMessage(event);
    });
  }
  
  // 发送消息
  async sendMessage(targetWindow, message, targetOrigin = '*') {
    return new Promise((resolve, reject) => {
      const messageId = ++this.messageId;
      const messageData = {
        id: messageId,
        type: 'request',
        data: message,
        origin: window.location.origin,
        timestamp: Date.now()
      };
      
      // 设置超时
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new Error('PostMessage超时'));
      }, this.config.timeout);
      
      // 记录待处理消息
      this.pendingMessages.set(messageId, {
        resolve,
        reject,
        timeoutId,
        targetOrigin
      });
      
      // 发送消息
      try {
        targetWindow.postMessage(messageData, targetOrigin);
        
        if (this.config.enableLogging) {
          console.log('发送PostMessage:', messageData);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingMessages.delete(messageId);
        reject(error);
      }
    });
  }
  
  // 处理接收到的消息
  handleMessage(event) {
    // 验证来源
    if (!this.isOriginAllowed(event.origin)) {
      console.warn('拒绝来自未授权源的消息:', event.origin);
      return;
    }
    
    const { data } = event;
    
    // 验证消息格式
    if (!this.isValidMessage(data)) {
      console.warn('无效的消息格式:', data);
      return;
    }
    
    if (this.config.enableLogging) {
      console.log('接收到PostMessage:', data);
    }
    
    if (data.type === 'request') {
      this.handleRequest(event, data);
    } else if (data.type === 'response') {
      this.handleResponse(data);
    }
  }
  
  // 处理请求消息
  handleRequest(event, data) {
    const handler = this.messageHandlers.get(data.data.type);
    
    if (!handler) {
      console.warn('未找到消息处理器:', data.data.type);
      return;
    }
    
    try {
      const result = handler(data.data.payload, event);
      
      // 发送响应
      const responseData = {
        id: data.id,
        type: 'response',
        success: true,
        data: result,
        timestamp: Date.now()
      };
      
      event.source.postMessage(responseData, event.origin);
      
    } catch (error) {
      // 发送错误响应
      const errorResponse = {
        id: data.id,
        type: 'response',
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
      
      event.source.postMessage(errorResponse, event.origin);
    }
  }
  
  // 处理响应消息
  handleResponse(data) {
    const pendingMessage = this.pendingMessages.get(data.id);
    
    if (!pendingMessage) {
      console.warn('未找到对应的待处理消息:', data.id);
      return;
    }
    
    clearTimeout(pendingMessage.timeoutId);
    this.pendingMessages.delete(data.id);
    
    if (data.success) {
      pendingMessage.resolve(data.data);
    } else {
      pendingMessage.reject(new Error(data.error));
    }
  }
  
  // 注册消息处理器
  registerHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }
  
  // 注销消息处理器
  unregisterHandler(type) {
    this.messageHandlers.delete(type);
  }
  
  // 验证消息来源
  isOriginAllowed(origin) {
    if (this.config.allowedOrigins.length === 0) {
      return true; // 允许所有来源
    }
    
    return this.config.allowedOrigins.includes(origin) ||
           this.config.allowedOrigins.includes('*');
  }
  
  // 验证消息格式
  isValidMessage(data) {
    return data &&
           typeof data === 'object' &&
           typeof data.id === 'number' &&
           ['request', 'response'].includes(data.type) &&
           typeof data.timestamp === 'number';
  }
  
  // 与iframe通信
  async communicateWithIframe(iframe, message) {
    // 等待iframe加载完成
    if (!iframe.contentWindow) {
      throw new Error('iframe未加载完成');
    }
    
    return this.sendMessage(iframe.contentWindow, message, '*');
  }
  
  // 与父窗口通信
  async communicateWithParent(message) {
    if (window.parent === window) {
      throw new Error('当前窗口不在iframe中');
    }
    
    return this.sendMessage(window.parent, message, '*');
  }
  
  // 与弹出窗口通信
  async communicateWithPopup(popup, message) {
    if (!popup || popup.closed) {
      throw new Error('弹出窗口已关闭');
    }
    
    return this.sendMessage(popup, message, '*');
  }
  
  // 批量发送消息
  async broadcastMessage(windows, message) {
    const promises = windows.map(window => 
      this.sendMessage(window.target, message, window.origin)
        .catch(error => ({ error: error.message, window: window.name }))
    );
    
    return Promise.all(promises);
  }
  
  // 清理资源
  cleanup() {
    // 清理待处理消息
    for (const [id, pendingMessage] of this.pendingMessages) {
      clearTimeout(pendingMessage.timeoutId);
      pendingMessage.reject(new Error('PostMessageManager已清理'));
    }
    
    this.pendingMessages.clear();
    this.messageHandlers.clear();
  }
}

// 使用示例
const postMessageManager = new PostMessageManager({
  allowedOrigins: ['https://trusted.com', 'https://api.trusted.com'],
  timeout: 5000,
  enableLogging: true
});

// 注册消息处理器
postMessageManager.registerHandler('getUserInfo', (payload, event) => {
  console.log('获取用户信息请求:', payload);
  return {
    userId: 123,
    username: 'john_doe',
    email: 'john@example.com'
  };
});

postMessageManager.registerHandler('updateCart', (payload, event) => {
  console.log('更新购物车:', payload);
  // 更新购物车逻辑
  return { success: true, cartCount: 5 };
});

// 发送消息到iframe
const iframe = document.getElementById('payment-iframe');
iframe.onload = async () => {
  try {
    const result = await postMessageManager.communicateWithIframe(iframe, {
      type: 'initPayment',
      payload: {
        amount: 99.99,
        currency: 'USD',
        orderId: 'ORDER_123'
      }
    });
    
    console.log('支付初始化结果:', result);
  } catch (error) {
    console.error('支付初始化失败:', error);
  }
};
```

## 电商跨域应用场景

### 1. 支付页面跨域

```javascript
/**
 * 电商支付页面跨域通信
 */
class EcommercePaymentCross {
  constructor() {
    this.postMessageManager = new PostMessageManager({
      allowedOrigins: [
        'https://pay.example.com',
        'https://secure.payment.com'
      ],
      timeout: 30000
    });
    
    this.setupPaymentHandlers();
  }
  
  // 设置支付相关消息处理器
  setupPaymentHandlers() {
    // 处理支付初始化
    this.postMessageManager.registerHandler('initPayment', (payload) => {
      return this.initializePayment(payload);
    });
    
    // 处理支付状态查询
    this.postMessageManager.registerHandler('getPaymentStatus', (payload) => {
      return this.getPaymentStatus(payload.orderId);
    });
    
    // 处理支付完成通知
    this.postMessageManager.registerHandler('paymentComplete', (payload) => {
      return this.handlePaymentComplete(payload);
    });
  }
  
  // 初始化支付
  async initializePayment(paymentData) {
    try {
      // 验证支付数据
      this.validatePaymentData(paymentData);
      
      // 创建支付订单
      const order = await this.createPaymentOrder(paymentData);
      
      // 加载支付iframe
      const paymentFrame = this.createPaymentFrame(order);
      
      return {
        success: true,
        orderId: order.id,
        paymentUrl: order.paymentUrl,
        frameId: paymentFrame.id
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  validatePaymentData(data) {
    const required = ['amount', 'currency', 'productId'];
    
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`缺少必需字段: ${field}`);
      }
    }
    
    if (data.amount <= 0) {
      throw new Error('支付金额必须大于0');
    }
    
    if (!['USD', 'EUR', 'CNY'].includes(data.currency)) {
      throw new Error('不支持的货币类型');
    }
  }
  
  async createPaymentOrder(paymentData) {
    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.getCSRFToken()
      },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      throw new Error('创建支付订单失败');
    }
    
    return await response.json();
  }
  
  createPaymentFrame(order) {
    const iframe = document.createElement('iframe');
    iframe.id = `payment-frame-${order.id}`;
    iframe.src = order.paymentUrl;
    iframe.style.cssText = `
      width: 100%;
      height: 600px;
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    
    // 安全设置
    iframe.sandbox = 'allow-scripts allow-forms allow-same-origin';
    
    const container = document.getElementById('payment-container');
    container.appendChild(iframe);
    
    return iframe;
  }
  
  async getPaymentStatus(orderId) {
    try {
      const response = await fetch(`/api/payment/status/${orderId}`);
      const status = await response.json();
      
      return {
        success: true,
        status: status.status,
        orderId: orderId,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async handlePaymentComplete(payload) {
    try {
      // 验证支付结果
      const isValid = await this.verifyPaymentResult(payload);
      
      if (!isValid) {
        throw new Error('支付结果验证失败');
      }
      
      // 更新订单状态
      await this.updateOrderStatus(payload.orderId, 'paid');
      
      // 发送确认邮件
      await this.sendConfirmationEmail(payload.orderId);
      
      // 跳转到成功页面
      this.redirectToSuccessPage(payload.orderId);
      
      return {
        success: true,
        message: '支付完成'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async verifyPaymentResult(payload) {
    const response = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    return result.valid;
  }
  
  async updateOrderStatus(orderId, status) {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
  }
  
  async sendConfirmationEmail(orderId) {
    await fetch('/api/notifications/payment-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId })
    });
  }
  
  redirectToSuccessPage(orderId) {
    window.location.href = `/payment/success?orderId=${orderId}`;
  }
  
  getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }
}
```

### 2. 第三方服务集成

```javascript
/**
 * 第三方服务跨域集成管理器
 */
class ThirdPartyServiceManager {
  constructor() {
    this.services = new Map();
    this.corsManager = new CORSManager();
    this.jsonpManager = new JSONPManager();
    this.proxyManager = new ProxyManager();
  }
  
  // 注册第三方服务
  registerService(name, config) {
    this.services.set(name, {
      ...config,
      requestCount: 0,
      lastRequest: null,
      errors: []
    });
  }
  
  // 调用第三方服务
  async callService(serviceName, endpoint, options = {}) {
    const service = this.services.get(serviceName);
    
    if (!service) {
      throw new Error(`未注册的服务: ${serviceName}`);
    }
    
    // 更新请求统计
    service.requestCount++;
    service.lastRequest = Date.now();
    
    try {
      let response;
      
      // 根据服务配置选择跨域方案
      switch (service.crossOriginMethod) {
        case 'cors':
          response = await this.callWithCORS(service, endpoint, options);
          break;
          
        case 'jsonp':
          response = await this.callWithJSONP(service, endpoint, options);
          break;
          
        case 'proxy':
          response = await this.callWithProxy(service, endpoint, options);
          break;
          
        default:
          throw new Error(`不支持的跨域方法: ${service.crossOriginMethod}`);
      }
      
      // 清除错误记录
      service.errors = [];
      
      return response;
      
    } catch (error) {
      // 记录错误
      service.errors.push({
        timestamp: Date.now(),
        error: error.message,
        endpoint
      });
      
      // 如果错误过多，可能需要切换方案
      if (service.errors.length > 5) {
        console.warn(`服务 ${serviceName} 错误过多，考虑切换跨域方案`);
      }
      
      throw error;
    }
  }
  
  async callWithCORS(service, endpoint, options) {
    const url = `${service.baseUrl}${endpoint}`;
    
    return await this.corsManager.makeCORSRequest(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': service.apiKey ? `Bearer ${service.apiKey}` : undefined
      }
    });
  }
  
  async callWithJSONP(service, endpoint, options) {
    const url = `${service.baseUrl}${endpoint}`;
    
    // 添加API密钥到查询参数
    const separator = url.includes('?') ? '&' : '?';
    const urlWithKey = service.apiKey ? 
      `${url}${separator}api_key=${service.apiKey}` : url;
    
    return await this.jsonpManager.jsonpRequest(urlWithKey, options);
  }
  
  async callWithProxy(service, endpoint, options) {
    const targetUrl = `${service.baseUrl}${endpoint}`;
    
    return await this.proxyManager.proxyRequest(targetUrl, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': service.apiKey ? `Bearer ${service.apiKey}` : undefined
      }
    });
  }
  
  // 获取服务统计信息
  getServiceStats(serviceName) {
    const service = this.services.get(serviceName);
    
    if (!service) {
      return null;
    }
    
    return {
      name: serviceName,
      requestCount: service.requestCount,
      lastRequest: service.lastRequest,
      errorCount: service.errors.length,
      recentErrors: service.errors.slice(-3),
      status: this.getServiceStatus(service)
    };
  }
  
  getServiceStatus(service) {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    // 最近5分钟内的错误
    const recentErrors = service.errors.filter(
      error => now - error.timestamp < fiveMinutes
    );
    
    if (recentErrors.length === 0) {
      return 'healthy';
    } else if (recentErrors.length < 3) {
      return 'warning';
    } else {
      return 'error';
    }
  }
  
  // 自动切换跨域方案
  async autoSwitchCrossOriginMethod(serviceName) {
    const service = this.services.get(serviceName);
    
    if (!service) {
      throw new Error(`未注册的服务: ${serviceName}`);
    }
    
    const methods = ['cors', 'proxy', 'jsonp'];
    const currentIndex = methods.indexOf(service.crossOriginMethod);
    
    // 尝试下一个方案
    const nextIndex = (currentIndex + 1) % methods.length;
    const nextMethod = methods[nextIndex];
    
    console.log(`切换服务 ${serviceName} 的跨域方案: ${service.crossOriginMethod} -> ${nextMethod}`);
    
    service.crossOriginMethod = nextMethod;
    service.errors = []; // 清除错误记录
  }
}

// 使用示例 - 集成常见第三方服务
const serviceManager = new ThirdPartyServiceManager();

// 注册地图服务
serviceManager.registerService('maps', {
  baseUrl: 'https://api.maps.com',
  crossOriginMethod: 'cors',
  apiKey: 'your-maps-api-key'
});

// 注册支付服务
serviceManager.registerService('payment', {
  baseUrl: 'https://api.payment.com',
  crossOriginMethod: 'proxy',
  apiKey: 'your-payment-api-key'
});

// 注册分析服务
serviceManager.registerService('analytics', {
  baseUrl: 'https://api.analytics.com',
  crossOriginMethod: 'jsonp',
  apiKey: 'your-analytics-api-key'
});

// 调用服务
async function getStoreLocations() {
  try {
    const response = await serviceManager.callService('maps', '/stores/nearby', {
      method: 'GET'
    });
    
    const data = await response.json();
    return data.locations;
    
  } catch (error) {
    console.error('获取店铺位置失败:', error);
    
    // 自动切换跨域方案
    await serviceManager.autoSwitchCrossOriginMethod('maps');
    
    // 重试
    const retryResponse = await serviceManager.callService('maps', '/stores/nearby');
    return await retryResponse.json();
  }
}

// 监控服务状态
setInterval(() => {
  const services = ['maps', 'payment', 'analytics'];
  
  services.forEach(serviceName => {
    const stats = serviceManager.getServiceStats(serviceName);
    console.log(`服务状态 - ${serviceName}:`, stats);
    
    if (stats.status === 'error') {
      serviceManager.autoSwitchCrossOriginMethod(serviceName);
    }
  });
}, 60000); // 每分钟检查一次
```

## 常见面试问题

### Q1: 什么是同源策略？为什么需要同源策略？

**答案要点：**
1. **同源定义**：协议、域名、端口都相同
2. **安全目的**：防止恶意脚本访问其他网站数据
3. **限制内容**：Ajax请求、DOM访问、Cookie访问等
4. **例外情况**：图片、CSS、JS文件等资源可以跨域加载

**代码示例：**
```javascript
// 同源检测
function checkSameOrigin(url1, url2) {
  const u1 = new URL(url1);
  const u2 = new URL(url2);
  
  return u1.protocol === u2.protocol &&
         u1.hostname === u2.hostname &&
         u1.port === u2.port;
}

console.log(checkSameOrigin(
  'https://www.example.com:443/page1',
  'https://www.example.com:443/page2'
)); // true

console.log(checkSameOrigin(
  'https://www.example.com/page',
  'http://www.example.com/page'
)); // false (协议不同)
```

### Q2: CORS的工作原理是什么？简单请求和预检请求的区别？

**答案要点：**
1. **CORS机制**：通过HTTP头部控制跨域访问
2. **简单请求**：满足特定条件，直接发送
3. **预检请求**：复杂请求先发OPTIONS请求
4. **服务器配置**：设置Access-Control-*头部

**代码示例：**
```javascript
// 简单请求示例
fetch('https://api.example.com/data', {
  method: 'GET',
  headers: {
    'Content-Type': 'text/plain'
  }
});

// 预检请求示例（会先发送OPTIONS）
fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  body: JSON.stringify({ data: 'test' })
});
```

### Q3: 有哪些跨域解决方案？各自的优缺点是什么？

**解决方案对比：**

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| CORS | 标准化、安全、支持各种请求 | 需要服务器配置 | 现代浏览器、RESTful API |
| JSONP | 兼容性好、实现简单 | 只支持GET、安全性差 | 老浏览器、简单数据获取 |
| 代理 | 透明、安全、灵活 | 增加服务器负担 | 开发环境、复杂跨域需求 |
| PostMessage | 安全、双向通信 | 只适用于窗口间通信 | iframe、弹窗通信 |

### Q4: 如何在实际项目中处理跨域问题？

**实践建议：**
```javascript
// 跨域解决方案选择器
class CrossOriginSolver {
  static async solveCrossOrigin(url, options = {}) {
    // 1. 首先尝试CORS
    try {
      return await this.tryCORS(url, options);
    } catch (corsError) {
      console.log('CORS失败，尝试其他方案');
    }
    
    // 2. 如果是GET请求，尝试JSONP
    if (!options.method || options.method.toUpperCase() === 'GET') {
      try {
        return await this.tryJSONP(url);
      } catch (jsonpError) {
        console.log('JSONP失败');
      }
    }
    
    // 3. 最后使用代理
    return await this.useProxy(url, options);
  }
  
  static async tryCORS(url, options) {
    const response = await fetch(url, {
      ...options,
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`CORS请求失败: ${response.status}`);
    }
    
    return response;
  }
  
  static async tryJSONP(url) {
    // JSONP实现
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const callbackName = 'jsonp_' + Date.now();
      
      window[callbackName] = (data) => {
        document.head.removeChild(script);
        delete window[callbackName];
        resolve(data);
      };
      
      script.onerror = () => {
        document.head.removeChild(script);
        delete window[callbackName];
        reject(new Error('JSONP请求失败'));
      };
      
      const separator = url.includes('?') ? '&' : '?';
      script.src = `${url}${separator}callback=${callbackName}`;
      
      document.head.appendChild(script);
    });
  }
  
  static async useProxy(url, options) {
    return fetch(`/api/proxy?target=${encodeURIComponent(url)}`, options);
  }
}
```

## 总结

跨域问题是Web开发中的重要概念，需要深入理解：

### 核心概念
1. **同源策略**：浏览器的基本安全机制
2. **跨域限制**：Ajax、DOM、Cookie等访问限制
3. **安全考虑**：防止XSS、CSRF等攻击

### 解决方案
- **CORS**：现代标准解决方案
- **JSONP**：传统兼容性方案
- **代理服务器**：开发和部署常用方案
- **PostMessage**：窗口间通信方案

### 面试重点
- **原理理解**：同源策略的工作机制
- **方案选择**：不同场景下的最佳实践
- **实际应用**：电商项目中的跨域处理
- **安全考虑**：跨域带来的安全问题

### 最佳实践
- 优先使用CORS标准方案
- 根据具体需求选择合适方案
- 注意安全性和性能考虑
- 建立完善的错误处理机制 