/**
 * Mini-Sentry 默认配置
 */

/**
 * @typedef {Object} MiniSentryOptions
 * @property {string} appId - 应用ID，用于区分不同应用
 * @property {string} dsn - 数据上报地址
 * @property {string} release - 发布版本号
 * @property {string} environment - 环境（production, development, staging等）
 * @property {boolean} debug - 是否开启调试模式
 * @property {number} sampleRate - 采样率（0-1之间）
 * @property {string} logLevel - 日志级别（debug, info, warn, error, none）
 * @property {number} maxBreadcrumbs - 最大面包屑数量
 * @property {Function} beforeSend - 发送前数据处理钩子
 * @property {Function} beforeBreadcrumb - 面包屑记录前处理钩子
 * @property {string[]} ignoreErrors - 忽略的错误模式列表
 * @property {string[]} ignoreUrls - 忽略的URL模式列表
 * @property {number} maxErrorsPerMinute - 每分钟最大上报错误数
 * @property {string} reportMethod - 上报方法（post, beacon）
 * @property {boolean} reportAsBeacon - 是否使用Beacon API上报
 * @property {number} reportTimeout - 上报超时时间（毫秒）
 */

/**
 * 默认配置
 * @type {MiniSentryOptions}
 */
const DEFAULT_CONFIG = {
  // 基础配置
  appId: '',
  dsn: '',
  release: 'not-set',
  environment: 'production',
  debug: false,
  
  // 采样与过滤
  sampleRate: 1.0,
  ignoreErrors: [
    /^Script error\.?$/,
    /^Javascript error: Script error\.?$/,
    /^ResizeObserver loop limit exceeded$/
  ],
  ignoreUrls: [],
  maxErrorsPerMinute: 100,
  
  // 日志与面包屑
  logLevel: 'warn',
  maxBreadcrumbs: 100,
  
  // 上报配置
  reportMethod: 'post',
  reportAsBeacon: true,
  reportTimeout: 5000,
  batchReport: true,
  batchSize: 10,
  batchInterval: 5000,
  
  // 钩子函数
  beforeSend: null,
  beforeBreadcrumb: null
};

export default DEFAULT_CONFIG; 