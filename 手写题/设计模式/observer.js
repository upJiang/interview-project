/**
 * 观察者模式 (Observer Pattern)
 *
 * 观察者模式定义了对象间的一种一对多的依赖关系，当一个对象的状态发生改变时，
 * 所有依赖于它的对象都将得到通知并自动更新。
 * 观察者模式属于行为型模式，用于对象间的状态依赖关系。
 */

/**
 * 1. 基础观察者模式实现
 */

// 主题/被观察者(Subject)
class Subject {
  constructor() {
    this.observers = [];
  }

  // 添加观察者
  attach(observer) {
    // 确保同一个观察者不会被添加多次
    if (this.observers.includes(observer)) {
      return console.log("观察者已经存在，无需重复添加");
    }

    this.observers.push(observer);
    console.log("添加了一个新的观察者");
  }

  // 移除观察者
  detach(observer) {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
      console.log("移除了一个观察者");
    } else {
      console.log("未找到要移除的观察者");
    }
  }

  // 通知所有观察者
  notify(data) {
    console.log("通知所有观察者...");
    this.observers.forEach((observer) => {
      observer.update(data);
    });
  }
}

// 观察者(Observer)
class Observer {
  constructor(name) {
    this.name = name;
  }

  update(data) {
    console.log(`${this.name} 收到通知，数据: `, data);
  }
}

/**
 * 2. 事件发布/订阅模式
 * 是观察者模式的一种变体，中间通常有一个事件通道作为调度中心
 */

class EventEmitter {
  constructor() {
    // 事件映射表: { 事件名: [回调函数1, 回调函数2, ...] }
    this.events = {};
  }

  // 订阅事件
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(callback);
    return this; // 链式调用
  }

  // 取消订阅
  off(eventName, callback) {
    if (!this.events[eventName]) return this;

    if (callback) {
      // 移除特定的回调函数
      this.events[eventName] = this.events[eventName].filter(
        (cb) => cb !== callback
      );
    } else {
      // 移除所有该事件的回调
      delete this.events[eventName];
    }

    return this; // 链式调用
  }

  // 单次订阅事件
  once(eventName, callback) {
    // 创建一个包装函数，执行后自动解绑
    const wrapper = (...args) => {
      callback.apply(this, args);
      this.off(eventName, wrapper);
    };

    this.on(eventName, wrapper);
    return this; // 链式调用
  }

  // 触发事件
  emit(eventName, ...args) {
    const callbacks = this.events[eventName];
    if (!callbacks || callbacks.length === 0) {
      return false;
    }

    callbacks.forEach((callback) => {
      callback.apply(this, args);
    });

    return true;
  }
}

/**
 * 3. 响应式数据绑定（简化版Vue响应式系统）
 */

// 依赖收集器
class Dep {
  constructor() {
    this.subscribers = new Set();
  }

  depend() {
    if (Dep.target) {
      this.subscribers.add(Dep.target);
    }
  }

  notify() {
    this.subscribers.forEach((watcher) => {
      watcher.update();
    });
  }
}
Dep.target = null; // 全局唯一的当前正在计算的Watcher

// 监听者
class Watcher {
  constructor(obj, key, callback) {
    this.obj = obj;
    this.key = key;
    this.callback = callback;
    this.value = this.get(); // 初始化
  }

  get() {
    Dep.target = this; // 将自己设置为当前活动的watcher
    const value = this.obj[this.key]; // 触发getter，此时会执行dep.depend()
    Dep.target = null; // 释放全局Watcher
    return value;
  }

  update() {
    const oldValue = this.value;
    this.value = this.get();
    this.callback.call(this.obj, this.value, oldValue);
  }
}

// 将对象转换为响应式
function observe(obj) {
  if (!obj || typeof obj !== "object") return;

  // 递归处理每个属性
  Object.keys(obj).forEach((key) => {
    let value = obj[key];
    const dep = new Dep();

    // 递归观察子对象
    observe(value);

    // 定义响应式属性
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,

      get() {
        if (Dep.target) {
          dep.depend(); // 收集依赖
        }
        return value;
      },

      set(newValue) {
        if (value === newValue) return;
        value = newValue;
        observe(newValue); // 新值可能是对象，继续观察
        dep.notify(); // 通知更新
      },
    });
  });

  return obj;
}

/**
 * 测试观察者模式
 */
function testObserverPattern() {
  console.log("=== 测试基础观察者模式 ===");

  const subject = new Subject();

  const observer1 = new Observer("观察者1");
  const observer2 = new Observer("观察者2");

  subject.attach(observer1);
  subject.attach(observer2);

  subject.notify("数据已更新");

  subject.detach(observer1);
  subject.notify("再次更新数据");

  console.log("\n=== 测试事件发布/订阅模式 ===");

  const eventBus = new EventEmitter();

  const logUser = (user) => {
    console.log("用户登录:", user);
  };

  const notifyAdmin = (user) => {
    console.log("管理员通知: 用户登录", user);
  };

  // 订阅事件
  eventBus.on("login", logUser);
  eventBus.on("login", notifyAdmin);

  // 触发事件
  eventBus.emit("login", { name: "张三", time: new Date().toLocaleString() });

  // 解除订阅
  eventBus.off("login", logUser);
  console.log("移除了logUser事件回调");

  // 再次触发事件
  eventBus.emit("login", { name: "李四", time: new Date().toLocaleString() });

  // 单次订阅测试
  eventBus.once("logout", (user) => {
    console.log("用户登出:", user);
  });

  eventBus.emit("logout", { name: "张三", time: new Date().toLocaleString() });
  console.log("重复触发logout事件（应该没有响应）：");
  eventBus.emit("logout", { name: "张三", time: new Date().toLocaleString() });

  console.log("\n=== 测试响应式数据绑定 ===");

  const data = observe({
    message: "Hello World",
    counter: 0,
  });

  // 监听message属性变化
  new Watcher(data, "message", (newVal, oldVal) => {
    console.log(`message 从 "${oldVal}" 变为 "${newVal}"`);
  });

  // 监听counter属性变化
  new Watcher(data, "counter", (newVal, oldVal) => {
    console.log(`counter 从 ${oldVal} 变为 ${newVal}`);
  });

  // 修改数据，触发更新
  data.message = "Hello Observer Pattern";
  data.counter++;
  data.counter++;
}

/**
 * 观察者模式的实际应用
 */
function observerApplications() {
  console.log("\n=== 观察者模式应用示例 ===");

  // 示例1: DOM事件监听
  console.log("--- DOM事件监听示例 ---");

  class DOMEventExample {
    constructor() {
      this.showImplementation();
    }

    showImplementation() {
      console.log("DOM事件就是观察者模式的实际应用:");
      console.log('element.addEventListener("click", callback)');
      console.log("相当于 subject.attach(observer)");
      console.log("用户点击元素时，浏览器会通知所有注册的回调函数");
    }
  }

  new DOMEventExample();

  // 示例2: 实现简单的状态管理
  console.log("\n--- 简单状态管理示例 ---");

  class Store extends EventEmitter {
    constructor(initialState = {}) {
      super();
      this.state = initialState;
    }

    // 获取状态
    getState() {
      return { ...this.state }; // 返回副本，避免直接修改
    }

    // 更新状态
    setState(newState) {
      const prevState = { ...this.state };
      this.state = { ...this.state, ...newState };

      // 通知状态变化
      this.emit("stateChanged", this.state, prevState);

      // 针对特定字段发出更具体的事件
      Object.keys(newState).forEach((key) => {
        if (prevState[key] !== this.state[key]) {
          this.emit(`${key}Changed`, this.state[key], prevState[key]);
        }
      });
    }
  }

  // 使用Store
  const userStore = new Store({
    user: null,
    isLoggedIn: false,
    lastActivity: null,
  });

  // 监听整体状态变化
  userStore.on("stateChanged", (newState, prevState) => {
    console.log("状态发生变化:", newState);
  });

  // 监听特定属性变化
  userStore.on("userChanged", (newUser, prevUser) => {
    console.log("用户信息更新:", newUser);
  });

  userStore.on("isLoggedInChanged", (newValue, prevValue) => {
    if (newValue) {
      console.log("用户已登录");
    } else {
      console.log("用户已登出");
    }
  });

  // 更新状态
  userStore.setState({
    user: { id: 1, name: "张三" },
    isLoggedIn: true,
    lastActivity: new Date(),
  });

  // 再次更新状态
  setTimeout(() => {
    userStore.setState({
      lastActivity: new Date(),
    });
  }, 100);

  // 示例3: 组件通信
  console.log("\n--- 组件通信示例 ---");

  class Component {
    constructor(name) {
      this.name = name;
    }

    render() {
      console.log(`${this.name} 渲染`);
    }
  }

  class ComponentA extends Component {
    constructor() {
      super("ComponentA");
      // 订阅事件
      globalEventBus.on("dataUpdated", this.handleDataUpdate.bind(this));
    }

    handleDataUpdate(data) {
      console.log(`${this.name} 接收到数据更新:`, data);
      this.render();
    }
  }

  class ComponentB extends Component {
    constructor() {
      super("ComponentB");
      // 订阅事件
      globalEventBus.on("dataUpdated", this.handleDataUpdate.bind(this));
    }

    handleDataUpdate(data) {
      console.log(`${this.name} 接收到数据更新:`, data);
      this.render();
    }
  }

  class DataService {
    constructor() {
      this.data = { items: [] };
    }

    fetchData() {
      // 模拟API请求
      console.log("获取数据中...");
      setTimeout(() => {
        this.data = {
          items: ["项目1", "项目2", "项目3"],
          timestamp: new Date(),
        };

        // 通知数据已更新
        globalEventBus.emit("dataUpdated", this.data);
      }, 200);
    }
  }

  const globalEventBus = new EventEmitter();
  const compA = new ComponentA();
  const compB = new ComponentB();
  const dataService = new DataService();

  dataService.fetchData();
}

/**
 * 观察者模式实现总结：
 *
 * 1. 核心原则：
 *    - 定义一对多的依赖关系，实现松耦合的对象交互
 *    - 被观察者状态改变时，主动通知所有观察者
 *    - 观察者只关心通知，不需要了解被观察者内部细节
 *
 * 2. 实现类型：
 *    - 基础观察者模式：Subject维护观察者列表，主动通知观察者
 *    - 发布/订阅模式：中间有事件通道，解耦发布者和订阅者
 *    - 响应式数据绑定：数据变更自动触发UI或依赖更新
 *
 * 3. 优点：
 *    - 降低对象间的耦合度
 *    - 支持广播通信
 *    - 建立一致的更新机制
 *    - 符合开闭原则，可方便地新增观察者
 *
 * 4. 缺点：
 *    - 可能造成循环引用
 *    - 通知顺序不可预测
 *    - 大量观察者时可能产生性能问题
 *    - 观察者不知道其他观察者的存在
 *
 * 5. 应用场景：
 *    - 事件处理系统
 *    - MVC/MVVM架构中的数据和视图更新
 *    - 消息中间件
 *    - 状态变化需要通知多个对象的场景
 *    - 实现多模块低耦合通信
 *
 * 6. 面试要点：
 *    - 区分观察者模式和发布/订阅模式的区别
 *    - 理解观察者模式在前端框架中的应用(Vue的响应式系统)
 *    - 能够解释观察者模式如何降低系统耦合度
 *    - 掌握依赖收集的原理和实现方式
 */

// 导出模式实现
module.exports = {
  // 基础观察者模式
  Subject,
  Observer,

  // 发布/订阅模式
  EventEmitter,

  // 响应式系统
  Dep,
  Watcher,
  observe,
};

// 运行测试和应用示例
//testObserverPattern();
//observerApplications();
