/**
 * Mini-Sentry 辅助函数
 * 提供各种实用工具函数
 */

/**
 * 生成UUID v4
 * @returns {string} UUID字符串
 */
export function generateUUID() {
  let d = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); // 使用高精度时间提高随机性
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * 获取当前时间戳（毫秒）
 * @returns {number} 时间戳
 */
export function timestamp() {
  return Date.now();
}

/**
 * 异步sleep函数
 * @param {number} ms 等待的毫秒数
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 判断对象是否为空
 * @param {Object} obj 要检查的对象
 * @returns {boolean} 是否为空
 */
export function isEmptyObject(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * 深拷贝对象
 * @param {*} obj 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepCopy(item));
  }
  
  // 处理普通对象
  const copy = {};
  Object.keys(obj).forEach(key => {
    copy[key] = deepCopy(obj[key]);
  });
  
  return copy;
}

/**
 * 节流函数
 * @param {Function} fn 要节流的函数
 * @param {number} wait 等待时间(毫秒)
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, wait = 100) {
  let lastFn = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastFn >= wait) {
      lastFn = now;
      return fn.apply(this, args);
    }
  };
}

/**
 * 防抖函数
 * @param {Function} fn 要防抖的函数
 * @param {number} wait 等待时间(毫秒)
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, wait = 100) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, wait);
  };
}

/**
 * 获取对象的安全值（避免空引用错误）
 * @param {Object} obj 要获取值的对象
 * @param {string} path 属性路径，例如 'user.profile.name'
 * @param {*} defaultValue 默认值
 * @returns {*} 找到的值或默认值
 */
export function get(obj, path, defaultValue = undefined) {
  if (!obj) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * 获取浏览器和操作系统信息
 * @returns {Object} 环境信息
 */
export function getEnvironmentInfo() {
  if (typeof window === 'undefined') {
    return { browser: 'none', browserVersion: 'none', os: 'none', osVersion: 'none' };
  }
  
  const userAgent = window.navigator.userAgent;
  
  // 浏览器检测
  let browser = 'unknown';
  let browserVersion = 'unknown';
  
  if (/Firefox\/([0-9.]+)/.test(userAgent)) {
    browser = 'Firefox';
    browserVersion = RegExp.$1;
  } else if (/MSIE ([0-9.]+)/.test(userAgent)) {
    browser = 'IE';
    browserVersion = RegExp.$1;
  } else if (/Edge\/([0-9.]+)/.test(userAgent)) {
    browser = 'Edge';
    browserVersion = RegExp.$1;
  } else if (/Chrome\/([0-9.]+)/.test(userAgent)) {
    browser = 'Chrome';
    browserVersion = RegExp.$1;
  } else if (/Safari\/([0-9.]+)/.test(userAgent)) {
    browser = 'Safari';
    browserVersion = RegExp.$1;
  }
  
  // 操作系统检测
  let os = 'unknown';
  let osVersion = 'unknown';
  
  if (/Windows NT ([0-9.]+)/.test(userAgent)) {
    os = 'Windows';
    const versionMap = {
      '10.0': '10',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
      '6.0': 'Vista',
      '5.2': 'XP',
      '5.1': 'XP',
      '5.0': '2000'
    };
    osVersion = versionMap[RegExp.$1] || RegExp.$1;
  } else if (/Mac OS X ([0-9._]+)/.test(userAgent)) {
    os = 'MacOS';
    osVersion = RegExp.$1.replace(/_/g, '.');
  } else if (/Android ([0-9.]+)/.test(userAgent)) {
    os = 'Android';
    osVersion = RegExp.$1;
  } else if (/iPhone OS ([0-9_]+)/.test(userAgent)) {
    os = 'iOS';
    osVersion = RegExp.$1.replace(/_/g, '.');
  } else if (/Linux/.test(userAgent)) {
    os = 'Linux';
  }
  
  return {
    browser,
    browserVersion,
    os,
    osVersion,
    language: window.navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    dpr: window.devicePixelRatio || 1
  };
}

/**
 * 获取当前页面URL信息
 * @returns {Object} URL信息
 */
export function getPageInfo() {
  if (typeof window === 'undefined') {
    return { url: 'none', path: 'none', host: 'none', protocol: 'none' };
  }
  
  const { href, pathname, host, protocol, search, hash } = window.location;
  
  return {
    url: href,
    path: pathname,
    host,
    protocol: protocol.replace(':', ''),
    query: search,
    hash,
    referrer: document.referrer || '',
    title: document.title || ''
  };
}

/**
 * 获取错误的堆栈信息
 * @param {Error} error 错误对象
 * @returns {Object} 解析后的错误信息
 */
export function parseError(error) {
  if (!error) {
    return {
      name: 'Unknown Error',
      message: 'Unknown error occurred',
      stack: ''
    };
  }
  
  // 标准Error对象
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack || '',
      lineNumber: error.lineNumber,
      columnNumber: error.columnNumber,
      fileName: error.fileName
    };
  }
  
  // 处理非标准错误
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
      stack: ''
    };
  }
  
  // 对象形式的错误
  return {
    name: error.name || 'Object Error',
    message: error.message || String(error),
    stack: error.stack || '',
    ...error
  };
} 