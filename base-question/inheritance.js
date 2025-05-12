/**
 * JavaScript 继承
 *
 * JavaScript 中实现继承的主要方式包括：
 * 1. 原型链继承
 * 2. 构造函数继承
 * 3. 组合继承
 * 4. 原型式继承
 * 5. 寄生式继承
 * 6. 寄生组合式继承
 * 7. ES6 类继承
 */

// 1. 原型链继承
// 基本思想：通过将子类型的原型设置为父类型的实例来实现继承
console.log("===== 原型链继承 =====");

function Animal(name) {
  this.name = name;
  this.colors = ["black", "white"];
}

Animal.prototype.getColors = function () {
  return this.colors;
};

function Dog(breed) {
  this.breed = breed;
}

// 设置原型链，使Dog继承Animal
Dog.prototype = new Animal("Generic Dog");
// 修复constructor属性
Dog.prototype.constructor = Dog;

Dog.prototype.getBreed = function () {
  return this.breed;
};

const dog1 = new Dog("Labrador");
const dog2 = new Dog("Husky");

console.log(dog1.name); // "Generic Dog"
console.log(dog1.getColors()); // ["black", "white"]

// 原型链继承的问题1：所有实例共享引用类型属性
dog1.colors.push("brown");
console.log(dog2.colors); // ["black", "white", "brown"] - 修改影响了所有实例

// 原型链继承的问题2：创建子类型实例时，不能向父类型构造函数传参

// 2. 构造函数继承
// 基本思想：在子类型构造函数内部调用父类型构造函数
console.log("\n===== 构造函数继承 =====");

function Parent(name) {
  this.name = name;
  this.colors = ["red", "blue", "green"];
}

Parent.prototype.sayName = function () {
  return this.name;
};

function Child(name, age) {
  // 调用父类构造函数
  Parent.call(this, name);
  this.age = age;
}

const child1 = new Child("Alice", 5);
const child2 = new Child("Bob", 6);

console.log(child1.name); // "Alice"
console.log(child1.colors); // ["red", "blue", "green"]

// 构造函数继承的优点：解决了引用类型共享的问题
child1.colors.push("yellow");
console.log(child2.colors); // ["red", "blue", "green"] - 不受影响

// 构造函数继承的问题：不能继承父类型原型上的方法
// console.log(child1.sayName()); // TypeError: child1.sayName is not a function

// 3. 组合继承
// 基本思想：结合原型链和构造函数继承的优点
console.log("\n===== 组合继承 =====");

function Animal2(name) {
  this.name = name;
  this.colors = ["black", "white"];
}

Animal2.prototype.sayName = function () {
  return this.name;
};

function Dog2(name, breed) {
  // 继承属性 - 第一次调用父构造函数
  Animal2.call(this, name);
  this.breed = breed;
}

// 继承方法 - 设置原型
Dog2.prototype = new Animal2(); // 第二次调用父构造函数
Dog2.prototype.constructor = Dog2;

Dog2.prototype.getBreed = function () {
  return this.breed;
};

const dog3 = new Dog2("Rex", "German Shepherd");
const dog4 = new Dog2("Max", "Bulldog");

console.log(dog3.name); // "Rex"
console.log(dog3.sayName()); // "Rex"
console.log(dog3.getBreed()); // "German Shepherd"

// 每个实例有自己的引用类型属性
dog3.colors.push("brown");
console.log(dog4.colors); // ["black", "white"] - 不受影响

// 组合继承的问题：父类构造函数被调用两次，造成效率问题

// 4. 原型式继承
// 基本思想：利用一个空对象作为中介，将某个对象直接赋值给空对象构造函数的原型
console.log("\n===== 原型式继承 =====");

// 类似于 ES5 的 Object.create()
function object(o) {
  function F() {}
  F.prototype = o;
  return new F();
}

const person = {
  name: "John",
  friends: ["Alice", "Bob", "Charlie"],
};

const person1 = object(person);
const person2 = object(person);

person1.name = "Greg";
person1.friends.push("David");

console.log(person1.name); // "Greg"
console.log(person2.name); // "John"
console.log(person2.friends); // ["Alice", "Bob", "Charlie", "David"] - 共享的引用类型

// ES5 Object.create() 实现
const person3 = Object.create(person);
person3.name = "Emily";
console.log(person3.name); // "Emily"
console.log(person3.friends); // ["Alice", "Bob", "Charlie", "David"] - 仍然共享

// 5. 寄生式继承
// 基本思想：在原型式继承的基础上，增强对象，返回构造函数
console.log("\n===== 寄生式继承 =====");

function createAnother(original) {
  const clone = Object.create(original);
  clone.sayHi = function () {
    return `Hi, I'm ${this.name}`;
  };
  return clone;
}

const person4 = createAnother(person);
console.log(person4.sayHi()); // "Hi, I'm John"

// 6. 寄生组合式继承
// 基本思想：通过借用构造函数继承属性，通过原型链的混成形式继承方法
console.log("\n===== 寄生组合式继承 =====");

function inheritPrototype(subType, superType) {
  // 创建对象，只包含父类原型的属性和方法
  const prototype = Object.create(superType.prototype);
  // 修复constructor属性
  prototype.constructor = subType;
  // 将新创建的对象赋值给子类的原型
  subType.prototype = prototype;
}

function SuperType(name) {
  this.name = name;
  this.colors = ["red", "blue", "green"];
}

SuperType.prototype.sayName = function () {
  return this.name;
};

function SubType(name, age) {
  // 只调用一次SuperType构造函数
  SuperType.call(this, name);
  this.age = age;
}

// 继承原型方法，不必调用SuperType构造函数
inheritPrototype(SubType, SuperType);

// 添加自己的方法
SubType.prototype.sayAge = function () {
  return this.age;
};

const instance1 = new SubType("Nicholas", 29);
console.log(instance1.sayName()); // "Nicholas"
console.log(instance1.sayAge()); // 29

// 寄生组合式继承避免了组合继承中调用两次超类构造函数的问题，
// 是引用类型继承的最佳模式

// 7. ES6 类继承
console.log("\n===== ES6 类继承 =====");

class Person2 {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return `Hello, my name is ${this.name}`;
  }
}

class Employee extends Person2 {
  constructor(name, job) {
    super(name); // 调用父类构造函数
    this.job = job;
  }

  greet() {
    return `${super.greet()}. I work as a ${this.job}`;
  }

  work() {
    return `${this.name} is working`;
  }
}

const emp = new Employee("Jane", "Developer");
console.log(emp.greet()); // "Hello, my name is Jane. I work as a Developer"
console.log(emp.work()); // "Jane is working"

// 继承多层级
class Manager extends Employee {
  constructor(name, department) {
    super(name, "Manager");
    this.department = department;
  }

  greet() {
    return `${super.greet()} in the ${this.department} department`;
  }

  manage() {
    return `${this.name} is managing the ${this.department} department`;
  }
}

const manager = new Manager("Tom", "IT");
console.log(manager.greet()); // "Hello, my name is Tom. I work as a Manager in the IT department"
console.log(manager.work()); // "Tom is working"
console.log(manager.manage()); // "Tom is managing the IT department"

// 继承内置类型
class MyArray extends Array {
  first() {
    return this[0];
  }

  last() {
    return this[this.length - 1];
  }
}

const arr = new MyArray(1, 2, 3, 4, 5);
console.log(arr.first()); // 1
console.log(arr.last()); // 5
console.log(arr.length); // 5
console.log(arr instanceof Array); // true
console.log(arr instanceof MyArray); // true

/**
 * 总结：各种继承方式的优缺点
 *
 * 1. 原型链继承：
 *    优点：简单，易于实现
 *    缺点：引用类型共享问题，不能向父构造函数传参
 *
 * 2. 构造函数继承：
 *    优点：解决了引用类型共享问题，可以传参
 *    缺点：无法继承原型方法，函数无法复用
 *
 * 3. 组合继承：
 *    优点：结合了两种方法的优点
 *    缺点：父构造函数会被调用两次
 *
 * 4. 原型式继承：
 *    优点：不需要构造函数
 *    缺点：引用类型共享问题
 *
 * 5. 寄生式继承：
 *    优点：可以在继承过程中增强对象
 *    缺点：难以复用函数
 *
 * 6. 寄生组合式继承：
 *    优点：结合寄生式和组合继承的优点，是引用类型最理想的继承范式
 *    缺点：实现复杂
 *
 * 7. ES6 类继承：
 *    优点：语法简洁，避免了前面所有模式的缺点
 *    缺点：部分老旧浏览器不支持
 */

/**
 * 面试常见问题：
 *
 * 1. JavaScript中有哪些实现继承的方式？
 * 2. 原型链继承的主要问题是什么？
 * 3. 构造函数继承和原型链继承分别解决了什么问题？
 * 4. 寄生组合式继承为什么被认为是最理想的继承范式？
 * 5. ES6类继承相比传统继承方式有哪些优势？
 * 6. 实现继承时，如何正确设置子类实例的constructor属性？
 * 7. 如何继承JavaScript的内置对象，如Array或Date？
 * 8. 在实际工作中，你一般使用哪种继承方式？为什么？
 */
