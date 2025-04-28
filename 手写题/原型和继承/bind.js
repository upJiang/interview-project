/**
 * 手写实现 Function.prototype.bind 方法
 *
 * bind() 方法创建一个新的函数，在 bind() 被调用时，这个新函数的 this 被指定为 bind() 的第一个参数，
 * 而其余参数将作为新函数的参数，供调用时使用。
 */

/**
 * 模拟实现 Function.prototype.bind 方法
 * @param {Object} context - 绑定的this上下文
 * @param {...any} args - 预设的参数
 * @return {Function} - 返回一个新的函数
 */
Function.prototype.myBind = function (context, ...args) {
  // 保存原始函数的引用
  const originalFunction = this;

  // 如果绑定的 context 是 null 或 undefined，则默认为全局对象
  if (context === null || context === undefined) {
    context = globalThis; // 在浏览器中是 window，在 Node.js 中是 global
  }

  // 返回一个新的函数
  return function newFunction(...newArgs) {
    // 处理构造函数的情况
    // 如果是通过 new 操作符调用绑定函数，this 的指向应该是新创建的对象
    if (this instanceof newFunction) {
      // 使用原始函数作为构造函数，并传入所有参数
      return new originalFunction(...args, ...newArgs);
    }

    // 正常情况下，调用原始函数，并绑定 this 上下文和所有参数
    return originalFunction.apply(context, [...args, ...newArgs]);
  };
};

/**
 * 不使用 ES6 特性的 bind 实现
 * 适用于不支持扩展运算符的环境
 */
Function.prototype.myBindES5 = function (context) {
  // 保存原始函数的引用
  var originalFunction = this;

  // 获取预设的参数（第一个参数后的所有参数）
  var presetArgs = Array.prototype.slice.call(arguments, 1);

  // 如果绑定的 context 是 null 或 undefined，则默认为全局对象
  if (context === null || context === undefined) {
    context = typeof window !== "undefined" ? window : global;
  }

  // 创建一个空函数作为中介
  var emptyFunction = function () {};

  // 返回一个新的函数
  var boundFunction = function () {
    // 获取新调用时传入的参数
    var newArgs = Array.prototype.slice.call(arguments);
    // 合并所有参数
    var allArgs = presetArgs.concat(newArgs);

    // 如果通过 new 操作符调用，则设置 this 为新创建的对象
    // 可以通过 instanceof 判断 this 是否为 boundFunction 的实例
    if (this instanceof boundFunction) {
      // 使用 new 调用原始函数
      return originalFunction.apply(this, allArgs);
    } else {
      // 正常调用原始函数，并绑定 context
      return originalFunction.apply(context, allArgs);
    }
  };

  // 设置原型链，使得通过 new 操作符创建的对象继承原始函数的原型
  emptyFunction.prototype = originalFunction.prototype;
  boundFunction.prototype = new emptyFunction();

  return boundFunction;
};

// 测试用例
function testMyBind() {
  // 定义一个测试对象和方法
  const person = {
    name: "张三",
    greet: function (greeting, punctuation) {
      return `${greeting}, 我是 ${this.name}${punctuation}`;
    },
  };

  const anotherPerson = {
    name: "李四",
  };

  // 1. 测试基本的绑定功能
  console.log("基本绑定功能测试:");

  // 使用原生的 bind
  const nativeBindGreet = person.greet.bind(anotherPerson, "你好");
  console.log("原生 bind:", nativeBindGreet("!")); // 你好, 我是 李四!

  // 使用我们的实现
  const myBindGreet = person.greet.myBind(anotherPerson, "你好");
  console.log("myBind 实现:", myBindGreet("!")); // 你好, 我是 李四!

  // 使用ES5实现
  const es5BindGreet = person.greet.myBindES5(anotherPerson, "你好");
  console.log("myBindES5 实现:", es5BindGreet("!")); // 你好, 我是 李四!

  // 2. 测试与 new 操作符一起使用
  console.log("\n与 new 操作符一起使用:");

  function Animal(name, type) {
    this.name = name;
    this.type = type;
  }

  Animal.prototype.getInfo = function () {
    return `${this.name} 是一只 ${this.type}`;
  };

  // 创建一个预设了 type 参数的构造函数
  const Dog = Animal.myBind(null, "旺财");
  const dog = new Dog("狗");

  console.log("dog instanceof Animal:", dog instanceof Animal); // true
  console.log("dog.name:", dog.name); // 旺财
  console.log("dog.type:", dog.type); // 狗
  console.log("dog.getInfo():", dog.getInfo()); // 旺财 是一只 狗

  // 使用ES5实现测试
  const DogES5 = Animal.myBindES5(null, "小黑");
  const dogES5 = new DogES5("狗");

  console.log("dogES5 instanceof Animal:", dogES5 instanceof Animal); // true
  console.log("dogES5.name:", dogES5.name); // 小黑
  console.log("dogES5.type:", dogES5.type); // 狗
  console.log("dogES5.getInfo():", dogES5.getInfo()); // 小黑 是一只 狗

  // 3. 测试绑定 null 或 undefined
  console.log("\n绑定 null 或 undefined:");

  function showContext() {
    // 在浏览器中会显示 window，在 Node.js 中会显示 global 相关内容
    console.log("this 类型:", typeof this);
    return this === (typeof window !== "undefined" ? window : global);
  }

  const boundToNull = showContext.myBind(null);
  console.log("绑定到 null:", boundToNull()); // true

  const boundToUndefined = showContext.myBind(undefined);
  console.log("绑定到 undefined:", boundToUndefined()); // true

  // 4. 测试复杂场景：多次绑定
  console.log("\n多次绑定测试:");

  const originalFn = function (a, b, c, d) {
    return `${this.name}: ${a}, ${b}, ${c}, ${d}`;
  };

  const boundOnce = originalFn.myBind({ name: "第一次绑定" }, 1, 2);
  const boundTwice = boundOnce.myBind({ name: "第二次绑定" }, 3);

  console.log("第一次绑定:", boundOnce(3, 4)); // 第一次绑定: 1, 2, 3, 4
  console.log("第二次绑定:", boundTwice(4)); // 第一次绑定: 1, 2, 3, 4 (注意: this不变)

  // 5. 测试边界情况
  console.log("\n边界情况测试:");

  // 将方法绑定到原始值
  const boundToNumber = showContext.myBind(42);
  console.log("绑定到数字:", boundToNumber()); // false，绑定到包装对象

  // 不传递任何参数
  try {
    const bindWithoutArgs = originalFn.myBind();
    console.log("不传参数调用:", bindWithoutArgs(1, 2, 3, 4)); // undefined: 1, 2, 3, 4
  } catch (e) {
    console.log("不传参数发生错误:", e.message);
  }
}

// 运行测试
testMyBind();

/**
 * bind 方法实现总结：
 *
 * 1. 核心原理：
 *    bind 方法创建一个新的函数，当这个函数被调用时，它的 this 值会被设置为提供的值，
 *    其参数列表前面会被加上 bind 时指定的参数。
 *
 * 2. 实现关键点：
 *    - 保存原始函数的引用
 *    - 合并预设参数和新传入的参数
 *    - 处理绑定的上下文为 null 或 undefined 的情况
 *    - 处理通过 new 操作符调用绑定函数的情况
 *
 * 3. new 操作符与 bind 的交互：
 *    当 bind 返回的函数作为构造函数（使用 new 调用）时，bind 指定的 this 值会被忽略，
 *    此时的 this 应该指向新创建的对象实例。
 *
 * 4. 原型链处理：
 *    在 ES5 实现中，需要正确设置原型链，以确保通过 new 操作符创建的对象继承自原始函数的原型。
 *
 * 5. 面试要点：
 *    - 理解 bind、call、apply 三者的区别和联系
 *    - 掌握 new 操作符与 bind 结合使用的行为
 *    - 了解如何处理 this 绑定和参数传递
 *    - 理解闭包在实现 bind 中的应用
 */

module.exports = {
  testMyBind,
};
