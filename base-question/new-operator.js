/**
 * new 操作符
 *
 * 定义：new 操作符用于创建一个用户自定义的对象类型的实例或具有构造函数的内置对象的实例。
 *
 * 当使用 new 操作符调用构造函数时，会执行以下步骤：
 * 1. 创建一个新的空对象
 * 2. 将新对象的原型（__proto__）链接到构造函数的prototype属性
 * 3. 将构造函数内部的this绑定到新创建的对象
 * 4. 执行构造函数代码（为新对象添加属性）
 * 5. 如果构造函数返回非原始值（对象、数组、函数等），则返回该值；
 *    否则，返回新创建的对象
 */

// 基本用法示例
function Person(name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.sayHello = function () {
  return `Hello, my name is ${this.name} and I'm ${this.age} years old.`;
};

const john = new Person("John", 30);
console.log(john.name); // "John"
console.log(john.age); // 30
console.log(john.sayHello()); // "Hello, my name is John and I'm 30 years old."

// 不使用new调用构造函数的问题
function Car(make, model) {
  this.make = make;
  this.model = model;
}

// 如果忘记使用new，this指向全局对象(在浏览器中是window，在Node.js中是global)
// 在strict mode下，this会是undefined，导致报错
// const myCar = Car('Toyota', 'Corolla'); // 不要这样做!

// 解决方案：在构造函数内部强制使用new
function SafeCar(make, model) {
  // 检查this是否是SafeCar的实例
  if (!(this instanceof SafeCar)) {
    return new SafeCar(make, model);
  }

  this.make = make;
  this.model = model;
  this.getDescription = function () {
    return `${this.make} ${this.model}`;
  };
}

const car1 = new SafeCar("Honda", "Civic");
const car2 = SafeCar("Toyota", "Corolla"); // 即使忘记了new，也能正常工作
console.log(car1.getDescription()); // "Honda Civic"
console.log(car2.getDescription()); // "Toyota Corolla"

// 手动实现new操作符
function myNew(Constructor, ...args) {
  // 1. 创建一个新的空对象
  const obj = {};

  // 2. 将新对象的原型链接到构造函数的prototype
  Object.setPrototypeOf(obj, Constructor.prototype);
  // 等价于: obj.__proto__ = Constructor.prototype;

  // 3 & 4. 执行构造函数，并将this绑定到新对象
  const result = Constructor.apply(obj, args);

  // 5. 如果构造函数返回非原始值，则返回该值；否则返回新创建的对象
  return result && typeof result === "object" ? result : obj;
}

// 测试我们的myNew函数
function Animal(species, sound) {
  this.species = species;
  this.sound = sound;
}

Animal.prototype.makeSound = function () {
  return `The ${this.species} says ${this.sound}`;
};

const dog = myNew(Animal, "dog", "woof");
console.log(dog.species); // "dog"
console.log(dog.makeSound()); // "The dog says woof"

// 构造函数返回值的影响
function ReturnObject(name) {
  this.name = name;

  // 返回一个非原始值
  return { custom: "Custom Object" };
}

function ReturnPrimitive(name) {
  this.name = name;

  // 返回一个原始值
  return 123; // 这会被忽略
}

const obj1 = new ReturnObject("John");
console.log(obj1.name); // undefined，因为返回了自定义对象
console.log(obj1.custom); // "Custom Object"

const obj2 = new ReturnPrimitive("John");
console.log(obj2.name); // "John"，返回原始值被忽略

// ES6类的new操作
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  getArea() {
    return this.width * this.height;
  }
}

const rect = new Rectangle(5, 10);
console.log(rect.getArea()); // 50

// 尝试不使用new调用类构造函数会抛出错误
// Rectangle(5, 10); // TypeError: Class constructor Rectangle cannot be invoked without 'new'

// 内置对象与new
const arr = new Array(1, 2, 3);
console.log(arr); // [1, 2, 3]

const date = new Date();
console.log(date instanceof Date); // true

const regex = new RegExp("\\d+");
console.log(regex.test("123")); // true

// 与Object.create的区别
const personProto = {
  greet() {
    return `Hello, my name is ${this.name}`;
  },
};

// 使用Object.create
const person1 = Object.create(personProto);
person1.name = "Alice";
console.log(person1.greet()); // "Hello, my name is Alice"

// 使用new和构造函数
function PersonConstructor(name) {
  this.name = name;
}
PersonConstructor.prototype.greet = function () {
  return `Hello, my name is ${this.name}`;
};

const person2 = new PersonConstructor("Bob");
console.log(person2.greet()); // "Hello, my name is Bob"

/**
 * new.target
 *
 * ES6引入了new.target元属性，它允许你检测函数或构造函数是否是通过new调用的。
 * 在通过new调用时，new.target指向构造函数；否则为undefined。
 */

function Example() {
  if (new.target === undefined) {
    return "Function was called without new";
  }
  return "Function was called with new";
}

console.log(Example()); // "Function was called without new"
console.log(new Example()); // "Function was called with new"

/**
 * 常见面试问题：
 *
 * 1. new操作符做了什么？请详细解释其工作原理。
 * 2. 如何手动实现new操作符的功能？
 * 3. 构造函数返回值对new操作有什么影响？
 * 4. 不使用new调用构造函数会发生什么？如何防止这种情况？
 * 5. new.target的作用是什么？
 * 6. new Object()和Object.create()有什么区别？
 * 7. class关键字中的new操作与传统构造函数有什么不同？
 */
