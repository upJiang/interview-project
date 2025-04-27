/**
 * Mini-Sentry 日志工具
 * 提供内部日志记录，支持不同日志级别
 */

// 日志级别枚举
const LogLevels = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  NONE: 'none'
};

// 日志级别优先级
const LogPriority = {
  [LogLevels.DEBUG]: 0,
  [LogLevels.INFO]: 1,
  [LogLevels.WARN]: 2,
  [LogLevels.ERROR]: 3,
  [LogLevels.NONE]: 999
};

// 默认日志前缀
const PREFIX = '[Mini-Sentry]';

/**
 * 日志管理类
 */
class Logger {
  constructor() {
    this.level = LogLevels.WARN;
  }

  /**
   * 设置日志级别
   * @param {string} level 日志级别
   */
  setLevel(level) {
    if (LogPriority[level] !== undefined) {
      this.level = level;
    }
  }

  /**
   * 检查给定级别是否应该被记录
   * @param {string} level 日志级别
   * @returns {boolean} 是否应该记录
   */
  shouldLog(level) {
    return LogPriority[level] >= LogPriority[this.level];
  }

  /**
   * 记录调试信息
   * @param {...*} args 日志内容
   */
  debug(...args) {
    if (this.shouldLog(LogLevels.DEBUG)) {
      console.debug(`${PREFIX} ${args.join(' ')}`);
    }
  }

  /**
   * 记录普通信息
   * @param {...*} args 日志内容
   */
  info(...args) {
    if (this.shouldLog(LogLevels.INFO)) {
      console.info(`${PREFIX} ${args.join(' ')}`);
    }
  }

  /**
   * 记录警告信息
   * @param {...*} args 日志内容
   */
  warn(...args) {
    if (this.shouldLog(LogLevels.WARN)) {
      console.warn(`${PREFIX} ${args.join(' ')}`);
    }
  }

  /**
   * 记录错误信息
   * @param {...*} args 日志内容
   */
  error(...args) {
    if (this.shouldLog(LogLevels.ERROR)) {
      console.error(`${PREFIX} ${args.join(' ')}`);
    }
  }

  /**
   * 记录指定级别的日志
   * @param {string} level 日志级别
   * @param {...*} args 日志内容
   */
  log(level, ...args) {
    switch (level) {
      case LogLevels.DEBUG:
        this.debug(...args);
        break;
      case LogLevels.INFO:
        this.info(...args);
        break;
      case LogLevels.WARN:
        this.warn(...args);
        break;
      case LogLevels.ERROR:
        this.error(...args);
        break;
      default:
        this.info(...args);
    }
  }
}

// 导出单例
const logger = new Logger();
export default logger; 