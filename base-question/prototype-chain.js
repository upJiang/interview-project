/**
 * 原型链 (Prototype Chain)
 *
 * 定义：JavaScript中对象的原型链是实现继承的主要方式。每个对象都有一个内部链接
 * 指向另一个对象，称为它的原型（prototype）。这个原型对象也有自己的原型，
 * 以此类推，形成一个"原型链"，直到达到一个原型为null的对象。
 */

// 创建对象的原型链
// 方法1: 使用构造函数
function Person(name) {
  this.name = name;
}

Person.prototype.sayHello = function () {
  return `Hello, I am ${this.name}`;
};

const john = new Person("John");
console.log(john.sayHello()); // "Hello, I am John"

// 方法2: 使用Object.create()
const personPrototype = {
  sayHello: function () {
    return `Hello, I am ${this.name}`;
  },
};

const jane = Object.create(personPrototype);
jane.name = "Jane";
console.log(jane.sayHello()); // "Hello, I am Jane"

// 方法3: 使用ES6类语法
class PersonClass {
  constructor(name) {
    this.name = name;
  }

  sayHello() {
    return `Hello, I am ${this.name}`;
  }
}

const bob = new PersonClass("Bob");
console.log(bob.sayHello()); // "Hello, I am Bob"

// 查看原型链
console.log(john.__proto__ === Person.prototype); // true
console.log(john.__proto__.__proto__ === Object.prototype); // true
console.log(john.__proto__.__proto__.__proto__ === null); // true

// 原型链属性查找过程演示
function Animal(name) {
  this.name = name;
}

Animal.prototype.makeSound = function () {
  return "Some generic sound";
};

function Dog(name, breed) {
  Animal.call(this, name); // 调用父构造函数
  this.breed = breed;
}

// 设置Dog的原型为Animal的实例，建立原型链
Dog.prototype = Object.create(Animal.prototype);
// 修复constructor属性
Dog.prototype.constructor = Dog;

// 重写父方法
Dog.prototype.makeSound = function () {
  return "Woof!";
};

// 添加新方法
Dog.prototype.fetch = function () {
  return `${this.name} is fetching`;
};

const max = new Dog("Max", "Labrador");
console.log(max.name); // "Max" - 自身属性
console.log(max.breed); // "Labrador" - 自身属性
console.log(max.makeSound()); // "Woof!" - 来自Dog.prototype
console.log(max.fetch()); // "Max is fetching" - 来自Dog.prototype

// 实例方法和原型方法的区别
function Counter() {
  // 实例方法 - 每个实例都有自己的副本
  this.incrementInstance = function () {
    this.count = (this.count || 0) + 1;
    return this.count;
  };
}

// 原型方法 - 所有实例共享一个副本
Counter.prototype.incrementPrototype = function () {
  this.count = (this.count || 0) + 1;
  return this.count;
};

const counter1 = new Counter();
const counter2 = new Counter();

console.log(counter1.incrementInstance()); // 1
console.log(counter1.incrementInstance()); // 2
console.log(counter2.incrementInstance()); // 1 - 不共享计数

console.log(counter1.incrementPrototype()); // 3
console.log(counter1.incrementPrototype()); // 4
console.log(counter2.incrementPrototype()); // 2 - 不共享计数，但共享方法

// 检查属性是否存在于对象自身或原型链上
const dog = new Dog("Buddy", "Golden Retriever");

console.log(dog.hasOwnProperty("name")); // true - 存在于实例上
console.log(dog.hasOwnProperty("fetch")); // false - 存在于原型上
console.log("fetch" in dog); // true - 在原型链上能找到
console.log("toString" in dog); // true - 在Object.prototype上

// Object.getPrototypeOf 和 Object.setPrototypeOf
console.log(Object.getPrototypeOf(dog) === Dog.prototype); // true

const bird = {
  fly: function () {
    return "Flying";
  },
};
const penguin = {
  swim: function () {
    return "Swimming";
  },
};

// 不推荐使用setPrototypeOf，因为会影响性能
Object.setPrototypeOf(penguin, bird);
console.log(penguin.fly()); // "Flying"
console.log(penguin.swim()); // "Swimming"

/**
 * 原型链的问题和陷阱
 *
 * 1. 引用类型属性共享：原型上的引用类型属性会被所有实例共享
 * 2. 无法向父构造函数传递参数：在创建子类型实例时
 * 3. 性能问题：查找属性时需要遍历整个原型链
 */

// 引用类型共享问题示例
function Team() {}
Team.prototype.members = []; // 引用类型属性

const team1 = new Team();
const team2 = new Team();

team1.members.push("John");
console.log(team1.members); // ["John"]
console.log(team2.members); // ["John"] - 共享同一个数组!

// 正确做法：在构造函数中初始化引用类型
function BetterTeam() {
  this.members = []; // 每个实例有自己的数组
}

const betterTeam1 = new BetterTeam();
const betterTeam2 = new BetterTeam();

betterTeam1.members.push("John");
console.log(betterTeam1.members); // ["John"]
console.log(betterTeam2.members); // [] - 不共享

/**
 * 现代JavaScript中处理原型链的最佳实践
 *
 * 1. 使用类语法 (ES6+) 简化继承
 * 2. 使用Object.create() 创建继承关系
 * 3. 谨慎使用修改原生对象原型的做法
 * 4. 优先使用组合而非继承
 */

// 面试中经常被问到的问题：
// 1. 什么是原型链？它是如何工作的？
// 2. 原型链和继承的关系是什么？
// 3. __proto__ 和 prototype 有什么区别？
// 4. 如何创建对象并设置其原型？
// 5. 原型链中的属性查找机制是什么？
// 6. 如何检查一个属性是存在于实例还是原型上？
// 7. 原型链继承有哪些缺点？如何解决？
