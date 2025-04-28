/**
 * 单例模式 (Singleton Pattern)
 *
 * 单例模式确保一个类只有一个实例，并提供一个全局访问点来访问该实例。
 * 这种模式属于创建型模式，它提供了一种创建对象的最佳方式。
 */

/**
 * 1. 基础单例模式实现
 */
class BasicSingleton {
  constructor() {
    if (BasicSingleton.instance) {
      return BasicSingleton.instance;
    }

    // 初始化操作放在这里
    this.data = [];
    this.name = "BasicSingleton";
    BasicSingleton.instance = this;
  }

  getData() {
    return this.data;
  }

  setData(data) {
    this.data.push(data);
  }
}

/**
 * 2. 使用静态方法实现单例
 */
class StaticSingleton {
  constructor(name) {
    this.name = name;
    this.data = [];
  }

  getData() {
    return this.data;
  }

  setData(data) {
    this.data.push(data);
  }

  static getInstance(name = "StaticSingleton") {
    if (!StaticSingleton.instance) {
      StaticSingleton.instance = new StaticSingleton(name);
    }
    return StaticSingleton.instance;
  }
}

/**
 * 3. 使用闭包实现单例
 */
const ClosureSingleton = (function () {
  let instance;

  // 私有构造函数
  function createInstance() {
    const obj = new Object();
    obj.name = "ClosureSingleton";
    obj.data = [];
    obj.getData = function () {
      return obj.data;
    };
    obj.setData = function (data) {
      obj.data.push(data);
    };
    return obj;
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

/**
 * 4. 惰性单例模式
 * 在需要时才创建实例，而不是页面加载时就创建
 */
const LazySingleton = (function () {
  let instance;

  function createInstance(data) {
    return {
      data: data,
      getData: function () {
        return this.data;
      },
      setData: function (data) {
        this.data = data;
      },
    };
  }

  return {
    getInstance: function (data) {
      return instance || (instance = createInstance(data));
    },
  };
})();

/**
 * 5. 创建通用的单例工厂方法
 * 可将任何函数变成单例模式
 */
function getSingletonCreator(constructor) {
  let instance;

  return function (...args) {
    if (!instance) {
      instance = new constructor(...args);
    }
    return instance;
  };
}

/**
 * 使用单例工厂的示例类
 */
class Database {
  constructor(host, port, username, password) {
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.connected = false;
    console.log(`数据库配置创建: ${host}:${port}`);
  }

  connect() {
    if (this.connected) {
      console.log("已经连接到数据库");
      return;
    }

    console.log(`连接到数据库 ${this.host}:${this.port} 成功`);
    this.connected = true;
  }

  query(sql) {
    if (!this.connected) {
      console.log("未连接数据库，无法执行查询");
      return null;
    }
    console.log(`执行SQL查询: ${sql}`);
    return `SQL查询结果: ${sql}`;
  }

  disconnect() {
    if (!this.connected) {
      console.log("没有活跃的连接");
      return;
    }

    console.log(`断开数据库连接`);
    this.connected = false;
  }
}

// 使用工厂方法创建单例构造函数
const SingletonDatabase = getSingletonCreator(Database);

/**
 * 测试单例模式
 */
function testSingletonPattern() {
  console.log("=== 测试基础单例模式 ===");

  const singleton1 = new BasicSingleton();
  singleton1.setData("单例数据1");
  console.log("singleton1.getData():", singleton1.getData());

  const singleton2 = new BasicSingleton();
  console.log("singleton2.getData():", singleton2.getData());
  console.log("singleton1与singleton2是否相同:", singleton1 === singleton2);

  console.log("\n=== 测试静态方法单例模式 ===");

  const staticSingleton1 = StaticSingleton.getInstance("实例1");
  console.log("staticSingleton1.getData():", staticSingleton1.getData());

  const staticSingleton2 = StaticSingleton.getInstance("实例2");
  console.log("staticSingleton2.getData():", staticSingleton2.getData());
  console.log(
    "staticSingleton1与staticSingleton2是否相同:",
    staticSingleton1 === staticSingleton2
  );

  console.log("\n=== 测试闭包单例模式 ===");

  const closureSingleton1 = ClosureSingleton.getInstance();
  console.log("closureSingleton1.getData():", closureSingleton1.getData());

  const closureSingleton2 = ClosureSingleton.getInstance();
  console.log("closureSingleton2.getData():", closureSingleton2.getData());
  console.log(
    "closureSingleton1与closureSingleton2是否相同:",
    closureSingleton1 === closureSingleton2
  );

  console.log("\n=== 测试惰性单例模式 ===");

  const lazySingleton1 = LazySingleton.getInstance("惰性单例数据");
  console.log("lazySingleton1.getData():", lazySingleton1.getData());

  const lazySingleton2 = LazySingleton.getInstance("新的惰性数据");
  console.log("lazySingleton2.getData():", lazySingleton2.getData());
  console.log(
    "lazySingleton1与lazySingleton2是否相同:",
    lazySingleton1 === lazySingleton2
  );

  console.log("\n=== 测试单例工厂方法 ===");

  const dbConnection1 = new SingletonDatabase(
    "localhost",
    3306,
    "root",
    "password"
  );
  dbConnection1.connect();
  dbConnection1.query("SELECT * FROM users");

  const dbConnection2 = new SingletonDatabase(
    "127.0.0.1",
    5432,
    "admin",
    "secret"
  );
  console.log(
    "dbConnection1与dbConnection2是否相同:",
    dbConnection1 === dbConnection2
  );
  console.log("dbConnection2.host:", dbConnection2.host);

  dbConnection2.query("SELECT * FROM products");
  dbConnection2.disconnect();
}

/**
 * 单例模式的实际应用
 */
function singletonApplications() {
  console.log("\n=== 单例模式应用示例 ===");

  // 示例1: 配置管理器
  console.log("--- 配置管理器示例 ---");

  class ConfigManager {
    constructor() {
      if (ConfigManager.instance) {
        return ConfigManager.instance;
      }

      this.config = {
        apiUrl: "https://api.example.com",
        timeout: 30000,
        maxRetries: 3,
      };
      ConfigManager.instance = this;
    }

    get(key) {
      return this.config[key];
    }

    set(key, value) {
      this.config[key] = value;
      console.log(`配置项 ${key} 设置为 ${value}`);
    }

    getAll() {
      return { ...this.config };
    }
  }

  const config1 = new ConfigManager();
  config1.set("apiUrl", "https://api.newexample.com");
  config1.set("timeout", 5000);

  // 在应用的其他地方
  const config2 = new ConfigManager();
  console.log("从其他模块访问配置:", config2.get("apiUrl"));
  console.log("config1 === config2:", config1 === config2);

  // 示例2: 日志记录器
  console.log("\n--- 日志记录器示例 ---");

  class Logger {
    constructor() {
      if (Logger.instance) {
        return Logger.instance;
      }

      this.logs = [];
      Logger.instance = this;
    }

    log(message) {
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp}: ${message}`;
      this.logs.push(logEntry);
      console.log(logEntry);
    }

    getLogs() {
      return [...this.logs];
    }

    clearLogs() {
      this.logs = [];
      console.log("日志已清空");
    }
  }

  // 使用日志记录器
  const logger = new Logger();
  logger.log("应用启动");

  // 在应用的其他地方获取同一个实例
  const logger2 = new Logger();
  logger2.log("这是第一条日志");

  // 获取所有日志
  const logs = logger.getLogs();
  console.log(`日志数量: ${logs.length}`);

  // 清除所有日志
  logger.clearLogs();
}

/**
 * 单例模式实现总结：
 *
 * 1. 核心原则：
 *    - 确保一个类只有一个实例
 *    - 提供一个全局访问点来获取该实例
 *    - 私有化构造函数，或使用条件判断阻止多实例
 *
 * 2. 实现方式：
 *    - 构造函数内判断（基础单例）
 *    - 静态方法（静态单例）
 *    - 闭包（闭包单例）
 *    - 惰性创建（惰性单例）
 *    - 单例工厂（通用单例创建器）
 *
 * 3. 优点：
 *    - 保证唯一实例，节省内存和资源
 *    - 提供全局访问点，方便协调系统操作
 *    - 避免多个实例导致的数据不一致
 *    - 适合管理共享资源（连接池等）
 *
 * 4. 缺点：
 *    - 单例模式违反单一职责原则（创建实例 + 业务逻辑）
 *    - 隐藏依赖关系，不利于单元测试
 *    - 需要特殊处理多线程/并发场景
 *
 * 5. 应用场景：
 *    - 配置信息（Config）
 *    - 线程池、连接池管理
 *    - 日志记录器
 *    - 缓存管理
 *    - 对话框、浮窗等UI元素管理
 *    - 应用程序级别的状态管理
 *
 * 6. 面试要点：
 *    - 掌握多种单例实现方式及其区别
 *    - 理解懒加载单例和立即执行单例的使用场景
 *    - 能够解释单例模式存在的潜在问题（全局状态）
 *    - 能够讨论单例模式在前端框架中的应用
 */

// 导出模式实现
module.exports = {
  // 基础单例
  BasicSingleton,

  // 静态方法单例
  StaticSingleton,

  // 闭包单例
  ClosureSingleton,

  // 惰性单例
  LazySingleton,

  // 单例工厂方法
  getSingletonCreator,

  // 应用示例类
  Database,
  SingletonDatabase,
};

// 运行测试和应用示例
//testSingletonPattern();
//singletonApplications();
