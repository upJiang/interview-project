/**
 * 手写实现 new 操作符
 *
 * new 操作符的执行过程：
 * 1. 创建一个新对象
 * 2. 将新对象的原型指向构造函数的 prototype 属性
 * 3. 将构造函数的 this 指向新对象并执行构造函数
 * 4. 判断构造函数的返回值类型，如果是对象则返回该对象，否则返回创建的新对象
 */

/**
 * 模拟实现 new 操作符
 * @param {Function} Constructor - 构造函数
 * @param {...any} args - 传递给构造函数的参数
 * @return {Object} - 返回创建的新对象
 */
function myNew(Constructor, ...args) {
  // 1. 创建一个新对象，并将其原型指向构造函数的 prototype 属性
  const obj = Object.create(Constructor.prototype);

  // 2. 将构造函数的 this 指向新对象并执行构造函数
  const result = Constructor.apply(obj, args);

  // 3. 判断构造函数的返回值类型
  // 如果构造函数返回一个对象，则返回该对象
  // 如果构造函数没有返回对象，则返回创建的新对象
  return (result !== null && typeof result === "object") ||
    typeof result === "function"
    ? result
    : obj;
}

/**
 * 不使用 Object.create 的实现方式
 * @param {Function} Constructor - 构造函数
 * @param {...any} args - 传递给构造函数的参数
 * @return {Object} - 返回创建的新对象
 */
function myNewAlternative(Constructor, ...args) {
  // 1. 创建一个新对象
  const obj = {};

  // 2. 将新对象的原型指向构造函数的 prototype 属性
  Object.setPrototypeOf(obj, Constructor.prototype);
  // 等同于: obj.__proto__ = Constructor.prototype;

  // 3. 将构造函数的 this 指向新对象并执行构造函数
  const result = Constructor.apply(obj, args);

  // 4. 判断构造函数的返回值类型
  return (result !== null && typeof result === "object") ||
    typeof result === "function"
    ? result
    : obj;
}

// 测试用例
function testMyNew() {
  // 测试构造函数
  function Person(name, age) {
    this.name = name;
    this.age = age;
  }

  Person.prototype.sayHello = function () {
    return `你好，我是${this.name}，今年${this.age}岁。`;
  };

  // 使用我们实现的 myNew 创建实例
  const person1 = myNew(Person, "张三", 28);
  console.log("使用 myNew 创建的实例:");
  console.log(person1);
  console.log(person1.sayHello());
  console.log(person1 instanceof Person);

  // 使用原生 new 操作符创建实例进行对比
  const person2 = new Person("李四", 32);
  console.log("\n使用原生 new 创建的实例:");
  console.log(person2);
  console.log(person2.sayHello());
  console.log(person2 instanceof Person);

  // 测试构造函数返回对象的情况
  function SpecialPerson(name, age) {
    this.name = name;
    this.age = age;

    // 返回一个对象
    return {
      specialName: name,
      specialAge: age,
      type: "special",
    };
  }

  const special1 = myNew(SpecialPerson, "王五", 25);
  console.log("\n构造函数返回对象的情况:");
  console.log(special1);
  console.log(special1 instanceof SpecialPerson); // 应该是 false

  const special2 = new SpecialPerson("赵六", 30);
  console.log(special2);
  console.log(special2 instanceof SpecialPerson); // 应该是 false

  // 测试构造函数返回原始值的情况
  function ReturnPrimitive(name) {
    this.name = name;
    // 返回原始值，应该被忽略
    return "primitive value";
  }

  const primitive1 = myNew(ReturnPrimitive, "小明");
  console.log("\n构造函数返回原始值的情况:");
  console.log(primitive1);
  console.log(primitive1 instanceof ReturnPrimitive); // 应该是 true

  const primitive2 = new ReturnPrimitive("小红");
  console.log(primitive2);
  console.log(primitive2 instanceof ReturnPrimitive); // 应该是 true

  // 使用不同实现方式测试
  console.log("\n使用不同实现方式测试:");
  const alternative = myNewAlternative(Person, "小张", 18);
  console.log(alternative);
  console.log(alternative.sayHello());
  console.log(alternative instanceof Person);
}

// 运行测试
testMyNew();

/**
 * new 操作符实现总结：
 *
 * 1. 核心要点：
 *    - new 操作符创建一个新对象，并将其与构造函数关联
 *    - 构造函数中的 this 指向新创建的对象
 *    - 设置原型链，使实例可以访问构造函数原型上的方法
 *    - 处理构造函数的返回值
 *
 * 2. 实现思路：
 *    - 创建一个新对象，可以使用 Object.create(Constructor.prototype) 直接设置原型
 *    - 也可以创建空对象后，使用 Object.setPrototypeOf 设置原型
 *    - 使用 apply 方法执行构造函数，并传入参数
 *    - 判断返回值类型，决定最终返回的对象
 *
 * 3. 需要注意的问题：
 *    - 原型链的正确建立，确保 instanceof 操作符能正常工作
 *    - 构造函数可能返回对象，这种情况下需要返回该对象而不是新创建的对象
 *    - 构造函数返回基本类型值时应该被忽略
 *
 * 4. 面试要点：
 *    - 理解 new 操作符的执行过程
 *    - 掌握如何创建对象并设置原型
 *    - 明确构造函数返回值的处理规则
 *    - 了解原型链和 instanceof 运算符的工作原理
 */

module.exports = {
  myNew,
  myNewAlternative,
};
