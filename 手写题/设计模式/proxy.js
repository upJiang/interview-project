/**
 * 代理模式 (Proxy Pattern)
 *
 * 代理模式是一种结构型设计模式，它允许通过代理对象控制对原始对象的访问。
 * 代理对象在客户端和目标对象之间起到中介作用，可以在不改变目标对象的前提下，
 * 添加额外的功能或控制逻辑。
 *
 * 代理模式的主要类型：
 * 1. 虚拟代理：延迟创建开销很大的对象
 * 2. 保护代理：控制对原始对象的访问
 * 3. 缓存代理：缓存请求结果，提高性能
 * 4. 远程代理：封装远程调用的复杂性
 * 5. 智能引用代理：在访问对象时执行额外操作
 */

/**
 * 基础代理模式实现
 */

// 目标对象接口
class Subject {
  request() {
    throw new Error("Subject的子类必须实现request方法");
  }
}

// 真实主题
class RealSubject extends Subject {
  request() {
    return "来自RealSubject的响应";
  }
}

// 代理
class Proxy extends Subject {
  constructor(realSubject) {
    super();
    this.realSubject = realSubject;
  }

  request() {
    // 在调用真实对象之前可以执行一些操作
    console.log("代理开始处理请求...");

    // 调用真实对象
    const result = this.realSubject.request();

    // 在调用真实对象之后可以执行一些操作
    console.log("代理结束处理请求...");

    return result;
  }
}

/**
 * ES6 Proxy实现
 */

// 使用ES6 Proxy API实现代理模式
function createProxy(target, handlers) {
  return new Proxy(target, handlers);
}

/**
 * 虚拟代理示例 - 图片懒加载
 */
class ImageLoader {
  constructor() {
    this.imageNode = document.createElement("img");
  }

  loadImage(url) {
    this.imageNode.src = url;
    document.body.appendChild(this.imageNode);
    console.log(`真实图片已加载: ${url}`);
  }
}

class ProxyImageLoader {
  constructor() {
    this.realLoader = null;
    this.imageUrl = "";
  }

  loadImage(url) {
    // 创建占位图
    const placeholder = document.createElement("img");
    placeholder.src = "placeholder.jpg";
    document.body.appendChild(placeholder);
    console.log("加载占位图片...");

    // 延迟加载真实图片
    this.imageUrl = url;

    // 模拟网络延迟
    console.log(`开始加载真实图片: ${url}`);
    setTimeout(() => {
      this.realLoader = this.realLoader || new ImageLoader();

      // 替换占位图
      document.body.removeChild(placeholder);
      this.realLoader.loadImage(this.imageUrl);
    }, 2000);
  }
}

/**
 * 保护代理示例 - 访问控制
 */
class User {
  constructor(name, role) {
    this.name = name;
    this.role = role;
  }
}

class UserDatabase {
  constructor() {
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
    console.log(`用户 ${user.name} 已添加到数据库`);
    return true;
  }

  findUser(name) {
    return this.users.find((user) => user.name === name);
  }

  removeUser(name) {
    const index = this.users.findIndex((user) => user.name === name);
    if (index > -1) {
      this.users.splice(index, 1);
      console.log(`用户 ${name} 已从数据库中删除`);
      return true;
    }
    return false;
  }
}

class UserDatabaseProxy {
  constructor(currentUser) {
    this.database = new UserDatabase();
    this.currentUser = currentUser;
  }

  addUser(user) {
    if (this.currentUser.role !== "admin") {
      console.log("权限不足: 只有管理员可以添加用户");
      return false;
    }

    return this.database.addUser(user);
  }

  findUser(name) {
    console.log(`查找用户: ${name}`);
    return this.database.findUser(name);
  }

  removeUser(name) {
    if (this.currentUser.role !== "admin") {
      console.log("权限不足: 只有管理员可以删除用户");
      return false;
    }

    return this.database.removeUser(name);
  }
}

/**
 * 缓存代理示例 - 计算缓存
 */
class MathCalculator {
  add(a, b) {
    console.log(`计算 ${a} + ${b}`);
    return a + b;
  }

  multiply(a, b) {
    console.log(`计算 ${a} * ${b}`);
    return a * b;
  }

  factorial(n) {
    console.log(`计算 ${n} 的阶乘`);
    if (n === 0 || n === 1) {
      return 1;
    }

    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }
}

class MathCalculatorProxy {
  constructor() {
    this.calculator = new MathCalculator();
    this.cache = {};
  }

  // 生成键
  getKey(method, ...args) {
    return `${method}(${args.join(",")})`;
  }

  add(a, b) {
    const key = this.getKey("add", a, b);

    if (this.cache[key]) {
      console.log(`从缓存获取结果: ${key}`);
      return this.cache[key];
    }

    const result = this.calculator.add(a, b);
    this.cache[key] = result;
    return result;
  }

  multiply(a, b) {
    const key = this.getKey("multiply", a, b);

    if (this.cache[key]) {
      console.log(`从缓存获取结果: ${key}`);
      return this.cache[key];
    }

    const result = this.calculator.multiply(a, b);
    this.cache[key] = result;
    return result;
  }

  factorial(n) {
    const key = this.getKey("factorial", n);

    if (this.cache[key]) {
      console.log(`从缓存获取结果: ${key}`);
      return this.cache[key];
    }

    const result = this.calculator.factorial(n);
    this.cache[key] = result;
    return result;
  }
}

/**
 * ES6 Proxy应用 - 属性校验
 */

// 创建一个表单校验代理
function createFormValidationProxy(data, validations) {
  return new Proxy(data, {
    set(target, property, value) {
      // 检查是否有此属性的验证规则
      if (validations[property]) {
        const validation = validations[property];
        const valid = validation.validate(value);

        if (!valid) {
          console.error(`验证失败: ${property} - ${validation.message}`);
          return false;
        }
      }

      console.log(`属性 ${property} 已设置为 ${value}`);
      target[property] = value;
      return true;
    },
  });
}

// 校验规则
const validations = {
  name: {
    validate: (value) => typeof value === "string" && value.length >= 3,
    message: "名称长度必须至少为3个字符",
  },
  age: {
    validate: (value) =>
      typeof value === "number" && value >= 18 && value <= 120,
    message: "年龄必须在18到120岁之间",
  },
  email: {
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: "邮箱格式不正确",
  },
};

/**
 * 测试基础代理模式
 */
function testBasicProxy() {
  console.log("=== 测试基础代理模式 ===");
  const realSubject = new RealSubject();
  const proxy = new Proxy(realSubject);

  console.log(proxy.request());
}

/**
 * 测试ES6 Proxy
 */
function testES6Proxy() {
  console.log("\n=== 测试ES6 Proxy ===");

  const target = {
    name: "张三",
    age: 25,
  };

  const handler = {
    get(target, property) {
      console.log(`获取属性: ${property}`);
      return target[property];
    },
    set(target, property, value) {
      console.log(`设置属性: ${property} = ${value}`);
      target[property] = value;
      return true;
    },
  };

  const proxy = createProxy(target, handler);

  console.log(proxy.name); // 触发get
  proxy.age = 26; // 触发set
  proxy.city = "北京"; // 触发set
  console.log(proxy);
}

/**
 * 测试保护代理
 */
function testProtectionProxy() {
  console.log("\n=== 测试保护代理 ===");

  const adminUser = new User("管理员", "admin");
  const normalUser = new User("普通用户", "user");

  // 使用管理员权限创建代理
  console.log("使用管理员权限:");
  const adminProxy = new UserDatabaseProxy(adminUser);
  adminProxy.addUser(new User("用户1", "user"));
  adminProxy.removeUser("用户1");

  // 使用普通用户权限创建代理
  console.log("\n使用普通用户权限:");
  const userProxy = new UserDatabaseProxy(normalUser);
  userProxy.addUser(new User("用户2", "user"));
  userProxy.findUser("用户2");
}

/**
 * 测试缓存代理
 */
function testCachingProxy() {
  console.log("\n=== 测试缓存代理 ===");

  const proxy = new MathCalculatorProxy();

  console.log(proxy.add(1, 2)); // 计算并缓存
  console.log(proxy.add(1, 2)); // 从缓存获取

  console.log(proxy.factorial(10)); // 计算并缓存
  console.log(proxy.factorial(10)); // 从缓存获取

  console.log(proxy.multiply(3, 4)); // 计算并缓存
  console.log(proxy.multiply(4, 3)); // 计算并缓存（不同的参数顺序）
}

/**
 * 测试表单验证代理
 */
function testFormValidation() {
  console.log("\n=== 测试表单验证代理 ===");

  const formData = {};
  const form = createFormValidationProxy(formData, validations);

  // 有效值测试
  form.name = "李四"; // 成功
  form.age = 30; // 成功
  form.email = "test@example.com"; // 成功

  // 无效值测试
  form.name = "L"; // 失败
  form.age = 15; // 失败
  form.email = "notanemail"; // 失败

  console.log("最终表单数据:", formData);
}

/**
 * ES6 Proxy其他应用示例
 */
function testOtherProxyApplications() {
  console.log("\n=== 其他ES6 Proxy应用 ===");

  // 1. 负索引数组（类似Python）
  console.log("1. 负索引数组:");
  const createNegativeArray = (array) =>
    new Proxy(array, {
      get(target, index) {
        index = Number(index);
        return target[index < 0 ? target.length + index : index];
      },
    });

  const arr = createNegativeArray([1, 2, 3, 4, 5]);
  console.log(arr[1]); // 2
  console.log(arr[-1]); // 5 (最后一个元素)
  console.log(arr[-2]); // 4 (倒数第二个元素)

  // 2. 隐藏私有属性
  console.log("\n2. 隐藏私有属性:");
  const createPrivateProxy = (target, privateProps) =>
    new Proxy(target, {
      get(target, property) {
        if (property.startsWith("_")) {
          console.log(`尝试访问私有属性: ${property}`);
          return undefined;
        }
        return target[property];
      },
      set(target, property, value) {
        if (property.startsWith("_")) {
          console.log(`尝试设置私有属性: ${property}`);
          return false;
        }
        target[property] = value;
        return true;
      },
      ownKeys(target) {
        return Object.keys(target).filter((key) => !key.startsWith("_"));
      },
    });

  const user = createPrivateProxy({
    name: "王五",
    _password: "123456",
  });

  console.log(user.name); // 王五
  console.log(user._password); // undefined
  console.log(Object.keys(user)); // ['name']

  // 3. 实现观察者模式
  console.log("\n3. 使用Proxy实现观察者模式:");
  const createObservable = (target) => {
    const observers = {};

    return new Proxy(target, {
      set(target, property, value) {
        const oldValue = target[property];
        target[property] = value;

        if (observers[property]) {
          observers[property].forEach((observer) =>
            observer({ property, oldValue, newValue: value })
          );
        }

        return true;
      },

      // 添加订阅方法
      apply(target, thisArg, [prop, callback]) {
        if (target.name === "subscribe") {
          if (!observers[prop]) {
            observers[prop] = [];
          }
          observers[prop].push(callback);
          return () => {
            observers[prop] = observers[prop].filter(
              (observer) => observer !== callback
            );
          };
        }
      },
    });
  };

  const subscribe = function (prop, callback) {};
  const observable = createObservable(subscribe);

  // 订阅属性变化
  const unsubscribe = observable("name", (event) => {
    console.log(
      `属性 ${event.property} 从 ${event.oldValue} 变为 ${event.newValue}`
    );
  });

  // 修改属性触发通知
  observable.name = "赵六";
  observable.name = "孙七";

  // 取消订阅
  unsubscribe();
  observable.name = "周八"; // 不会再触发通知
}

/**
 * 测试所有代理模式实现
 */
function testAllProxies() {
  testBasicProxy();
  testES6Proxy();
  testProtectionProxy();
  testCachingProxy();
  testFormValidation();
  testOtherProxyApplications();
}

// 运行测试
testAllProxies();

/**
 * 代理模式的应用场景:
 *
 * 1. 虚拟代理：延迟加载、图片预加载、懒加载等
 * 2. 保护代理：控制对敏感对象的访问，实现权限控制
 * 3. 缓存代理：缓存计算结果，避免重复计算
 * 4. 远程代理：封装RPC调用的复杂性
 * 5. 智能引用代理：引用计数、资源管理等
 * 6. 日志代理：记录日志而不改变原对象的行为
 */

/**
 * 代理模式的优缺点:
 *
 * 优点:
 * 1. 不改变原目标类的前提下，增强其功能
 * 2. 将额外逻辑与核心业务逻辑分离，符合单一职责原则
 * 3. 保护目标对象不被直接访问，增强安全性
 * 4. 可以延迟实例化开销大的对象，提高性能
 *
 * 缺点:
 * 1. 增加了系统的复杂度
 * 2. 在某些情况下可能会引入额外的性能开销
 * 3. 实现不当可能会影响原有功能
 */

/**
 * 面试要点:
 *
 * 1. 代理模式的核心：控制对目标对象的访问
 *
 * 2. 代理模式与装饰器模式的区别：
 *    - 代理模式：控制对象访问，通常不改变接口
 *    - 装饰器模式：动态添加功能，扩展接口
 *
 * 3. 代理模式与适配器模式的区别：
 *    - 代理模式：相同的接口，控制访问
 *    - 适配器模式：不同的接口，转换接口
 *
 * 4. ES6 Proxy的应用：
 *    - 属性验证
 *    - 私有属性实现
 *    - 数据绑定和观察者
 *    - 函数性能监控
 *    - 实现负索引数组等高级功能
 *
 * 5. ES6 Proxy相比于普通代理的优势：
 *    - 更加灵活，可以拦截更多操作（13种trap）
 *    - 原生支持，性能更好
 *    - 可以作用于任何类型的对象
 */

// 导出模块
module.exports = {
  Subject,
  RealSubject,
  Proxy,
  createProxy,
  ImageLoader,
  ProxyImageLoader,
  User,
  UserDatabase,
  UserDatabaseProxy,
  MathCalculator,
  MathCalculatorProxy,
  createFormValidationProxy,
};

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testAllProxies();
}
