/**
 * 手写实现 instanceof 操作符
 *
 * instanceof 运算符用于检测构造函数的 prototype 属性是否出现在某个实例对象的原型链上。
 * 实现原理：沿着实例对象的原型链向上查找，判断是否存在一个原型等于构造函数的 prototype 属性。
 */

/**
 * 模拟实现 instanceof 操作符
 * @param {Object} obj - 要检测的对象
 * @param {Function} constructor - 构造函数
 * @return {Boolean} - 如果obj是constructor的实例则返回true，否则返回false
 */
function myInstanceof(obj, constructor) {
  // 处理边界情况：
  // 如果obj为null或undefined，直接返回false
  if (obj === null || obj === undefined) {
    return false;
  }

  // 如果constructor不是函数，抛出TypeError异常
  if (typeof constructor !== "function") {
    throw new TypeError("Right-hand side of instanceof is not callable");
  }

  // 获取构造函数的原型对象
  const prototype = constructor.prototype;

  // 如果原型对象为null，抛出TypeError异常（正常情况下不应该出现）
  if (prototype === null) {
    throw new TypeError("constructor.prototype is null");
  }

  // 获取对象的原型（可能为null）
  let proto = Object.getPrototypeOf(obj);

  // 沿着原型链向上查找
  while (proto !== null) {
    // 如果在原型链上找到了构造函数的原型对象，返回true
    if (proto === prototype) {
      return true;
    }
    // 继续向上查找
    proto = Object.getPrototypeOf(proto);
  }

  // 如果遍历完整个原型链都没找到，返回false
  return false;
}

/**
 * 使用旧式方法实现 instanceof
 * 通过访问 __proto__ 属性（不推荐在生产环境使用）
 * @param {Object} obj - 要检测的对象
 * @param {Function} constructor - 构造函数
 * @return {Boolean} - 如果obj是constructor的实例则返回true，否则返回false
 */
function myInstanceofLegacy(obj, constructor) {
  // 处理边界情况
  if (obj === null || obj === undefined) {
    return false;
  }

  if (typeof constructor !== "function") {
    throw new TypeError("Right-hand side of instanceof is not callable");
  }

  const prototype = constructor.prototype;

  // 使用 __proto__ 访问原型（不推荐，但有助于理解）
  let proto = obj.__proto__;

  // 沿着原型链向上查找
  while (proto !== null) {
    if (proto === prototype) {
      return true;
    }
    proto = proto.__proto__;
  }

  return false;
}

// 测试用例
function testMyInstanceof() {
  // 定义一些构造函数和类
  function Person(name) {
    this.name = name;
  }

  class Animal {
    constructor(type) {
      this.type = type;
    }
  }

  class Dog extends Animal {
    constructor(name) {
      super("dog");
      this.name = name;
    }
  }

  // 创建实例
  const person = new Person("张三");
  const dog = new Dog("旺财");

  // 使用我们的实现测试
  console.log("Person实例测试:");
  console.log("person myInstanceof Person:", myInstanceof(person, Person)); // true
  console.log("person instanceof Person:", person instanceof Person); // true
  console.log("person myInstanceof Object:", myInstanceof(person, Object)); // true
  console.log("person instanceof Object:", person instanceof Object); // true
  console.log("person myInstanceof Animal:", myInstanceof(person, Animal)); // false
  console.log("person instanceof Animal:", person instanceof Animal); // false

  console.log("\nDog实例测试:");
  console.log("dog myInstanceof Dog:", myInstanceof(dog, Dog)); // true
  console.log("dog instanceof Dog:", dog instanceof Dog); // true
  console.log("dog myInstanceof Animal:", myInstanceof(dog, Animal)); // true
  console.log("dog instanceof Animal:", dog instanceof Animal); // true
  console.log("dog myInstanceof Object:", myInstanceof(dog, Object)); // true
  console.log("dog instanceof Object:", dog instanceof Object); // true
  console.log("dog myInstanceof Person:", myInstanceof(dog, Person)); // false
  console.log("dog instanceof Person:", dog instanceof Person); // false

  // 测试原始值
  console.log("\n原始值测试:");
  console.log("5 myInstanceof Number:", myInstanceof(5, Number)); // false
  console.log("5 instanceof Number:", 5 instanceof Number); // false

  const num = new Number(5);
  console.log("new Number(5) myInstanceof Number:", myInstanceof(num, Number)); // true
  console.log("new Number(5) instanceof Number:", num instanceof Number); // true

  // 测试边界情况
  console.log("\n边界情况测试:");
  console.log("null myInstanceof Object:", myInstanceof(null, Object)); // false
  console.log("null instanceof Object:", null instanceof Object); // false

  console.log(
    "undefined myInstanceof Object:",
    myInstanceof(undefined, Object)
  ); // false
  console.log("undefined instanceof Object:", undefined instanceof Object); // false

  // 测试使用旧式方法实现的 instanceof
  console.log("\n旧式方法测试:");
  console.log(
    "person myInstanceofLegacy Person:",
    myInstanceofLegacy(person, Person)
  ); // true
  console.log(
    "dog myInstanceofLegacy Animal:",
    myInstanceofLegacy(dog, Animal)
  ); // true

  // 测试错误情况
  console.log("\n错误情况测试:");
  try {
    myInstanceof(person, {});
  } catch (e) {
    console.log("Error when using non-function constructor:", e.message);
  }

  try {
    person instanceof {};
  } catch (e) {
    console.log(
      "Error with native instanceof using non-function constructor:",
      e.message
    );
  }
}

// 运行测试
testMyInstanceof();

/**
 * instanceof 实现总结：
 *
 * 1. 核心原理：
 *    instanceof 运算符检查一个对象是否为某个构造函数的实例，其本质是判断
 *    构造函数的 prototype 是否存在于对象的原型链上。
 *
 * 2. 实现方法：
 *    - 获取构造函数的 prototype 对象
 *    - 沿着对象的原型链向上查找（可通过 Object.getPrototypeOf 或 __proto__）
 *    - 判断是否存在一个原型等于构造函数的 prototype
 *
 * 3. 需要处理的特殊情况：
 *    - 检查 null 或 undefined：这些值没有原型，instanceof 应返回 false
 *    - 构造函数不是函数：抛出 TypeError
 *    - 原始值：原始值没有原型链，但通过包装对象可以进行检查
 *
 * 4. 注意事项：
 *    - 现代JavaScript应使用 Object.getPrototypeOf 代替 __proto__
 *    - instanceof 不能准确检查跨不同执行上下文（如iframe）的对象
 *
 * 5. 面试要点：
 *    - 理解原型链的工作原理
 *    - 掌握 instanceof 的检查逻辑
 *    - 了解 Object.getPrototypeOf 与 __proto__ 的区别
 *    - 理解边界情况的处理
 */

module.exports = {
  myInstanceof,
  myInstanceofLegacy,
};
