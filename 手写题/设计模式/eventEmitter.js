/**
 * 事件发布订阅模式 (Event Emitter)
 *
 * 事件发布订阅模式是一种行为设计模式，它定义了一种一对多的依赖关系，让多个观察者对象
 * 同时监听某一个主题对象。当这个主题对象发生状态变化时，会通知所有观察者对象，使它们
 * 能够自动更新自己的状态。
 *
 * 与观察者模式的区别：
 * 1. 发布订阅模式中，发布者和订阅者之间存在一个事件通道，发布者不直接通知订阅者
 * 2. 观察者模式中，主题和观察者之间是直接关联的，主题变化直接通知观察者
 * 3. 发布订阅模式比观察者模式更松散，耦合度更低
 */

/**
 * 基础版事件发布订阅模式实现
 */
class EventEmitter {
  constructor() {
    // 存储事件和对应的处理函数
    this.events = {};
  }

  /**
   * 注册事件监听器
   * @param {String} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @return {EventEmitter} - 返回实例，支持链式调用
   */
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return this;
  }

  /**
   * 触发事件
   * @param {String} eventName - 事件名称
   * @param {...any} args - 传递给回调函数的参数
   * @return {Boolean} - 如果有监听函数则返回true，否则返回false
   */
  emit(eventName, ...args) {
    if (!this.events[eventName]) {
      return false;
    }

    this.events[eventName].forEach((callback) => {
      callback.apply(this, args);
    });
    return true;
  }

  /**
   * 移除事件监听器
   * @param {String} eventName - 事件名称
   * @param {Function} callback - 回调函数，若不传则移除该事件的所有监听器
   * @return {EventEmitter} - 返回实例，支持链式调用
   */
  off(eventName, callback) {
    if (!this.events[eventName]) return this;

    if (!callback) {
      // 如果没有提供具体的回调函数，则移除该事件的所有监听器
      delete this.events[eventName];
      return this;
    }

    // 移除特定的回调函数
    this.events[eventName] = this.events[eventName].filter(
      (fn) => fn !== callback && fn.originFn !== callback
    );

    // 如果该事件没有监听器了，则删除该事件
    if (this.events[eventName].length === 0) {
      delete this.events[eventName];
    }

    return this;
  }

  /**
   * 注册只执行一次的事件监听器
   * @param {String} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @return {EventEmitter} - 返回实例，支持链式调用
   */
  once(eventName, callback) {
    // 包装回调函数，确保只执行一次
    const wrapper = (...args) => {
      callback.apply(this, args);
      this.off(eventName, wrapper);
    };
    // 保存原始回调函数的引用，方便后续移除
    wrapper.originFn = callback;

    this.on(eventName, wrapper);
    return this;
  }

  /**
   * 移除所有事件监听器
   * @return {EventEmitter} - 返回实例，支持链式调用
   */
  removeAllListeners() {
    this.events = {};
    return this;
  }

  /**
   * 获取事件的所有监听器
   * @param {String} eventName - 事件名称
   * @return {Array} - 返回事件的所有监听器
   */
  listeners(eventName) {
    return this.events[eventName] || [];
  }

  /**
   * 获取事件的监听器数量
   * @param {String} eventName - 事件名称
   * @return {Number} - 返回事件的监听器数量
   */
  listenerCount(eventName) {
    return this.listeners(eventName).length;
  }
}

/**
 * 高级版事件发布订阅模式，增加更多功能
 */
class AdvancedEventEmitter extends EventEmitter {
  constructor() {
    super();
    // 最大监听器数量
    this.maxListeners = 10;
    // 是否警告超出最大监听器数量
    this.warnOnMaxListeners = true;
  }

  /**
   * 设置最大监听器数量
   * @param {Number} n - 最大监听器数量
   * @return {AdvancedEventEmitter} - 返回实例，支持链式调用
   */
  setMaxListeners(n) {
    this.maxListeners = n;
    return this;
  }

  /**
   * 获取最大监听器数量
   * @return {Number} - 返回最大监听器数量
   */
  getMaxListeners() {
    return this.maxListeners;
  }

  /**
   * 重写on方法，增加监听器数量检查
   */
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    // 检查是否超出最大监听器数量
    if (
      this.warnOnMaxListeners &&
      this.events[eventName].length >= this.maxListeners
    ) {
      console.warn(
        `警告: ${eventName} 事件的监听器数量已达到上限 ${this.maxListeners}。` +
          "这可能是内存泄漏的征兆。"
      );
    }

    this.events[eventName].push(callback);

    // 触发newListener事件
    if (eventName !== "newListener") {
      this.emit("newListener", eventName, callback);
    }

    return this;
  }

  /**
   * 重写off方法，增加移除监听器事件
   */
  off(eventName, callback) {
    const result = super.off(eventName, callback);

    // 触发removeListener事件
    if (eventName !== "removeListener") {
      this.emit("removeListener", eventName, callback);
    }

    return result;
  }

  /**
   * 返回所有已注册的事件名称
   * @return {Array} - 返回事件名称数组
   */
  eventNames() {
    return Object.keys(this.events);
  }

  /**
   * 按优先级添加事件监听器
   * @param {String} eventName - 事件名称
   * @param {Number} priority - 优先级，数字越小优先级越高
   * @param {Function} callback - 回调函数
   * @return {AdvancedEventEmitter} - 返回实例，支持链式调用
   */
  prependListener(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    // 将回调函数添加到数组开头
    this.events[eventName].unshift(callback);

    // 触发newListener事件
    if (eventName !== "newListener") {
      this.emit("newListener", eventName, callback);
    }

    return this;
  }

  /**
   * 按优先级添加只执行一次的事件监听器
   * @param {String} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @return {AdvancedEventEmitter} - 返回实例，支持链式调用
   */
  prependOnceListener(eventName, callback) {
    const wrapper = (...args) => {
      callback.apply(this, args);
      this.off(eventName, wrapper);
    };
    wrapper.originFn = callback;

    this.prependListener(eventName, wrapper);
    return this;
  }
}

/**
 * Node.js风格的事件发布订阅模式
 * 实现类似Node.js中的EventEmitter
 */
class NodeEventEmitter {
  constructor() {
    this._events = {};
    this._eventsCount = 0;
    this._maxListeners = undefined;
  }

  // 省略了与AdvancedEventEmitter类似的方法实现...

  // 特有的Node.js风格方法
  addListener(eventName, listener) {
    return this.on(eventName, listener);
  }

  removeListener(eventName, listener) {
    return this.off(eventName, listener);
  }
}

/**
 * 使用示例
 */
function testEventEmitter() {
  console.log("=== 基础EventEmitter测试 ===");
  const emitter = new EventEmitter();

  // 注册事件
  emitter.on("message", (data) => {
    console.log("收到消息1:", data);
  });

  // 注册只执行一次的事件
  emitter.once("message", (data) => {
    console.log("收到消息2(只执行一次):", data);
  });

  // 触发事件
  emitter.emit("message", "你好，世界!"); // 两个处理函数都会执行
  emitter.emit("message", "第二次触发"); // 只有第一个处理函数会执行

  // 移除事件
  const messageHandler = (data) => console.log("收到消息3:", data);
  emitter.on("message", messageHandler);
  emitter.emit("message", "第三次触发"); // 两个处理函数都会执行

  emitter.off("message", messageHandler);
  emitter.emit("message", "第四次触发"); // 只有第一个处理函数会执行

  console.log("\n=== 高级EventEmitter测试 ===");
  const advEmitter = new AdvancedEventEmitter();

  // 设置最大监听器数量
  advEmitter.setMaxListeners(2);

  // 监听新增监听器事件
  advEmitter.on("newListener", (event, listener) => {
    console.log(`添加了新的 ${event} 事件监听器`);
  });

  // 监听移除监听器事件
  advEmitter.on("removeListener", (event, listener) => {
    console.log(`移除了 ${event} 事件监听器`);
  });

  // 添加监听器测试
  advEmitter.on("test", () => console.log("测试1"));
  advEmitter.on("test", () => console.log("测试2"));
  advEmitter.on("test", () => console.log("测试3")); // 应该显示警告

  // 触发事件
  advEmitter.emit("test");

  console.log("所有已注册的事件:", advEmitter.eventNames());
  console.log("test事件的监听器数量:", advEmitter.listenerCount("test"));

  // 移除所有监听器
  advEmitter.removeAllListeners();
  console.log(
    "移除所有监听器后的事件数量:",
    Object.keys(advEmitter.events).length
  );
}

// 运行测试
testEventEmitter();

/**
 * 事件发布订阅模式的应用场景:
 *
 * 1. 浏览器事件处理: DOM事件处理就是典型的发布订阅模式
 * 2. 跨组件通信: 在大型应用中，组件之间的通信可以通过事件总线实现
 * 3. 异步编程: Node.js中的事件驱动编程
 * 4. 插件系统: 框架的插件系统常常使用事件机制
 * 5. 消息队列: 消息中间件的实现原理
 */

// 模拟浏览器环境中的事件处理
function simulateBrowserEvents() {
  const btn = {
    _events: {},
    addEventListener(event, callback) {
      if (!this._events[event]) this._events[event] = [];
      this._events[event].push(callback);
    },
    removeEventListener(event, callback) {
      if (!this._events[event]) return;
      this._events[event] = this._events[event].filter((fn) => fn !== callback);
    },
    dispatchEvent(event, data) {
      if (!this._events[event]) return;
      this._events[event].forEach((callback) => callback(data));
    },
  };

  // 添加点击事件
  btn.addEventListener("click", (data) => {
    console.log("按钮被点击了:", data);
  });

  // 模拟点击
  btn.dispatchEvent("click", { x: 100, y: 200 });
}

// 模拟事件总线
class EventBus {
  constructor() {
    this.emitter = new AdvancedEventEmitter();
  }

  // 以下方法直接代理到emitter上
  on(event, callback) {
    return this.emitter.on(event, callback);
  }

  emit(event, ...args) {
    return this.emitter.emit(event, ...args);
  }

  off(event, callback) {
    return this.emitter.off(event, callback);
  }

  once(event, callback) {
    return this.emitter.once(event, callback);
  }
}

// 全局事件总线单例
const eventBus = new EventBus();

/**
 * 面试要点:
 *
 * 1. 实现原理：发布订阅模式本质上是维护一个事件与回调函数的映射表
 *
 * 2. 常见的方法实现：
 *    - on/addEventListener: 注册事件监听器
 *    - emit/dispatchEvent: 触发事件
 *    - off/removeEventListener: 移除事件监听器
 *    - once: 注册只执行一次的事件监听器
 *
 * 3. 优点：
 *    - 松耦合：发布者和订阅者之间没有直接依赖关系
 *    - 灵活性：可以动态添加和移除事件处理函数
 *    - 异步通信：支持异步事件处理
 *
 * 4. 缺点：
 *    - 内存泄漏：如果没有正确移除事件监听器，可能导致内存泄漏
 *    - 调试困难：事件流程不直观，难以追踪
 *    - 代码可维护性：过度使用可能导致代码难以理解和维护
 *
 * 5. 与观察者模式的区别：
 *    - 观察者模式中主题和观察者直接耦合
 *    - 发布订阅模式通过事件通道解耦，更加灵活
 *
 * 6. 进阶问题：
 *    - 如何实现事件优先级？
 *    - 如何处理事件冒泡和捕获？
 *    - 如何实现跨框架或跨窗口的事件通信？
 */

// 导出
module.exports = {
  EventEmitter,
  AdvancedEventEmitter,
  NodeEventEmitter,
  EventBus,
  eventBus,
};

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testEventEmitter();
  console.log("\n=== 模拟浏览器事件 ===");
  simulateBrowserEvents();
}
