/**
 * JavaScript 继承方式的实现
 *
 * 本文件实现了 JavaScript 中常见的几种继承方式，包括：
 * 1. 原型链继承
 * 2. 构造函数继承
 * 3. 组合继承
 * 4. 原型式继承
 * 5. 寄生式继承
 * 6. 寄生组合式继承
 * 7. ES6 类继承
 */

// 创建一个父类，用于演示不同的继承方式
function Animal(name) {
  this.name = name;
  this.colors = ["black", "white"];
}

Animal.prototype.sayName = function () {
  return `我的名字是 ${this.name}`;
};

/**
 * 1. 原型链继承
 * 通过将子类的原型指向父类的实例实现继承
 *
 * 优点：简单易实现，父类方法可以复用
 * 缺点：
 *  - 引用类型的属性会被所有实例共享
 *  - 创建子类实例时，无法向父类构造函数传参
 */
function PrototypalInheritance() {
  // 子类
  function Dog(toy) {
    this.toy = toy;
  }

  // 将子类的原型指向父类的实例
  Dog.prototype = new Animal("原型链继承");
  // 修正constructor指向
  Dog.prototype.constructor = Dog;

  // 添加子类的方法
  Dog.prototype.play = function () {
    return `${this.name} 正在玩 ${this.toy}`;
  };

  // 测试
  console.log("1. 原型链继承:");
  const dog1 = new Dog("球");
  const dog2 = new Dog("骨头");

  // 演示引用类型属性被共享的问题
  console.log("dog1.colors:", dog1.colors); // ['black', 'white']
  dog1.colors.push("brown");
  console.log("修改dog1.colors后，dog2.colors:", dog2.colors); // ['black', 'white', 'brown']

  console.log("dog1.sayName():", dog1.sayName()); // 我的名字是 原型链继承
  console.log("dog1.play():", dog1.play()); // 原型链继承 正在玩 球
  console.log("dog1 instanceof Animal:", dog1 instanceof Animal); // true
  console.log("dog1 instanceof Dog:", dog1 instanceof Dog); // true
}

/**
 * 2. 构造函数继承
 * 在子类构造函数中调用父类构造函数
 *
 * 优点：
 *  - 避免了引用类型的属性被所有实例共享
 *  - 可以在子类构造函数中向父类传参
 * 缺点：
 *  - 方法都在构造函数中定义，无法实现函数复用
 *  - 父类原型上的方法对子类不可见
 */
function ConstructorInheritance() {
  // 子类
  function Dog(name, toy) {
    // 调用父类构造函数，并绑定this
    Animal.call(this, name);
    this.toy = toy;
  }

  // 添加子类方法
  Dog.prototype.play = function () {
    return `${this.name} 正在玩 ${this.toy}`;
  };

  // 测试
  console.log("\n2. 构造函数继承:");
  const dog1 = new Dog("旺财", "球");
  const dog2 = new Dog("小黑", "骨头");

  // 验证引用类型属性不会共享
  console.log("dog1.colors:", dog1.colors); // ['black', 'white']
  dog1.colors.push("brown");
  console.log("修改dog1.colors后，dog2.colors:", dog2.colors); // ['black', 'white']

  // 验证无法访问父类原型上的方法
  console.log("dog1.name:", dog1.name); // 旺财
  console.log("dog1.play():", dog1.play()); // 旺财 正在玩 球
  console.log("dog1.sayName存在吗?", typeof dog1.sayName === "function"); // false
  console.log("dog1 instanceof Animal:", dog1 instanceof Animal); // false
  console.log("dog1 instanceof Dog:", dog1 instanceof Dog); // true
}

/**
 * 3. 组合继承
 * 结合原型链继承和构造函数继承的优点
 *
 * 优点：
 *  - 可以继承父类原型上的属性和方法，也可以继承实例属性
 *  - 不存在引用属性共享问题
 *  - 可以向父类构造函数传参
 * 缺点：
 *  - 父类构造函数被调用两次，存在一定的效率问题
 */
function CombinationInheritance() {
  // 子类
  function Dog(name, toy) {
    // 第一次调用父类构造函数
    Animal.call(this, name);
    this.toy = toy;
  }

  // 第二次调用父类构造函数
  Dog.prototype = new Animal();
  // 修正constructor指向
  Dog.prototype.constructor = Dog;

  // 添加子类方法
  Dog.prototype.play = function () {
    return `${this.name} 正在玩 ${this.toy}`;
  };

  // 测试
  console.log("\n3. 组合继承:");
  const dog1 = new Dog("小花", "飞盘");
  const dog2 = new Dog("大黄", "拖鞋");

  // 验证继承的所有功能
  console.log("dog1.colors:", dog1.colors); // ['black', 'white']
  dog1.colors.push("yellow");
  console.log("修改dog1.colors后，dog2.colors:", dog2.colors); // ['black', 'white']

  console.log("dog1.sayName():", dog1.sayName()); // 我的名字是 小花
  console.log("dog1.play():", dog1.play()); // 小花 正在玩 飞盘
  console.log("dog1 instanceof Animal:", dog1 instanceof Animal); // true
  console.log("dog1 instanceof Dog:", dog1 instanceof Dog); // true
}

/**
 * 4. 原型式继承
 * 借助原型可以基于已有的对象创建新对象，同时还不必因此创建自定义类型
 *
 * 优点：
 *  - 不需要创建构造函数，简化对象创建
 * 缺点：
 *  - 引用类型的属性会被所有实例共享
 */
function PrototypalCreateInheritance() {
  // ES5之前的原型式继承实现
  function object(o) {
    function F() {}
    F.prototype = o;
    return new F();
  }

  // ES5提供了Object.create()方法规范化了原型式继承

  // 创建一个父对象
  const animal = {
    name: "动物",
    colors: ["black", "white"],
    sayName: function () {
      return `我的名字是 ${this.name}`;
    },
  };

  // 测试
  console.log("\n4. 原型式继承:");

  // 使用自己实现的object函数
  const dog1 = object(animal);
  dog1.name = "小狗";
  dog1.toy = "球";

  // 使用ES5的Object.create
  const dog2 = Object.create(animal);
  dog2.name = "大狗";
  dog2.toy = "骨头";

  // 验证引用类型属性共享问题
  console.log("dog1.colors:", dog1.colors); // ['black', 'white']
  dog1.colors.push("brown");
  console.log("修改dog1.colors后，dog2.colors:", dog2.colors); // ['black', 'white', 'brown']

  console.log("dog1.sayName():", dog1.sayName()); // 我的名字是 小狗
  console.log("dog2.sayName():", dog2.sayName()); // 我的名字是 大狗

  // 展示额外属性
  console.log("dog1.toy:", dog1.toy); // 球
  console.log("dog2.toy:", dog2.toy); // 骨头
}

/**
 * 5. 寄生式继承
 * 在原型式继承的基础上，增强对象
 *
 * 优点：
 *  - 可以在不关心类型和构造函数的情况下实现继承
 *  - 可以为对象添加特定的属性和方法
 * 缺点：
 *  - 函数复用效率低，与构造函数模式类似
 */
function ParasiticInheritance() {
  // 寄生式继承函数
  function createAnother(original) {
    // 创建一个新对象，继承原始对象的属性
    const clone = Object.create(original);

    // 增强这个对象
    clone.bark = function () {
      return "汪汪！";
    };

    // 返回这个增强的对象
    return clone;
  }

  // 原始对象
  const animal = {
    name: "动物",
    colors: ["black", "white"],
    sayName: function () {
      return `我的名字是 ${this.name}`;
    },
  };

  // 测试
  console.log("\n5. 寄生式继承:");
  const dog = createAnother(animal);
  dog.name = "小狗";

  console.log("dog.sayName():", dog.sayName()); // 我的名字是 小狗
  console.log("dog.bark():", dog.bark()); // 汪汪！
}

/**
 * 6. 寄生组合式继承
 * 解决组合继承调用两次父类构造函数的问题
 *
 * 优点：
 *  - 只调用一次父类构造函数
 *  - 可以继承父类原型的属性和方法
 *  - 可以向父类构造函数传参
 * 缺点：
 *  - 实现较复杂
 */
function ParasiticCombinationInheritance() {
  // 寄生组合式继承的核心函数
  function inheritPrototype(subType, superType) {
    // 创建父类原型的副本
    const prototype = Object.create(superType.prototype);
    // 为创建的副本添加constructor属性
    prototype.constructor = subType;
    // 将新创建的对象赋值给子类的原型
    subType.prototype = prototype;
  }

  // 子类
  function Dog(name, toy) {
    // 继承属性 - 只调用一次构造函数
    Animal.call(this, name);
    this.toy = toy;
  }

  // 继承原型
  inheritPrototype(Dog, Animal);

  // 添加子类方法
  Dog.prototype.play = function () {
    return `${this.name} 正在玩 ${this.toy}`;
  };

  // 测试
  console.log("\n6. 寄生组合式继承:");
  const dog1 = new Dog("贝贝", "飞盘");
  const dog2 = new Dog("点点", "拖鞋");

  // 验证所有功能
  console.log("dog1.colors:", dog1.colors); // ['black', 'white']
  dog1.colors.push("gold");
  console.log("修改dog1.colors后，dog2.colors:", dog2.colors); // ['black', 'white']

  console.log("dog1.sayName():", dog1.sayName()); // 我的名字是 贝贝
  console.log("dog1.play():", dog1.play()); // 贝贝 正在玩 飞盘
  console.log("dog1 instanceof Animal:", dog1 instanceof Animal); // true
  console.log("dog1 instanceof Dog:", dog1 instanceof Dog); // true
}

/**
 * 7. ES6 类继承
 * 使用ES6的class和extends关键字实现继承
 *
 * 优点：
 *  - 语法更加简洁、直观
 *  - 内部实际采用寄生组合式继承
 */
function ES6ClassInheritance() {
  // 定义父类
  class AnimalClass {
    constructor(name) {
      this.name = name;
      this.colors = ["black", "white"];
    }

    sayName() {
      return `我的名字是 ${this.name}`;
    }
  }

  // 定义子类，使用extends关键字
  class DogClass extends AnimalClass {
    constructor(name, toy) {
      // 调用父类构造函数
      super(name);
      this.toy = toy;
    }

    play() {
      return `${this.name} 正在玩 ${this.toy}`;
    }
  }

  // 测试
  console.log("\n7. ES6 类继承:");
  const dog1 = new DogClass("小七", "足球");
  const dog2 = new DogClass("小八", "篮球");

  // 验证所有功能
  console.log("dog1.colors:", dog1.colors); // ['black', 'white']
  dog1.colors.push("red");
  console.log("修改dog1.colors后，dog2.colors:", dog2.colors); // ['black', 'white']

  console.log("dog1.sayName():", dog1.sayName()); // 我的名字是 小七
  console.log("dog1.play():", dog1.play()); // 小七 正在玩 足球
  console.log("dog1 instanceof AnimalClass:", dog1 instanceof AnimalClass); // true
  console.log("dog1 instanceof DogClass:", dog1 instanceof DogClass); // true
}

// 运行所有继承方式的测试
function runAllTests() {
  PrototypalInheritance();
  ConstructorInheritance();
  CombinationInheritance();
  PrototypalCreateInheritance();
  ParasiticInheritance();
  ParasiticCombinationInheritance();
  ES6ClassInheritance();
}

// 执行所有测试
runAllTests();

/**
 * 继承方式总结：
 *
 * 1. 原型链继承
 *    - 将子类原型指向父类实例
 *    - 缺点：引用类型共享、无法传参
 *
 * 2. 构造函数继承
 *    - 在子类构造函数中调用父类构造函数
 *    - 缺点：无法继承原型方法、函数无法复用
 *
 * 3. 组合继承
 *    - 结合原型链和构造函数继承
 *    - 缺点：调用父类构造函数两次
 *
 * 4. 原型式继承
 *    - 基于现有对象创建新对象（Object.create）
 *    - 缺点：引用类型共享
 *
 * 5. 寄生式继承
 *    - 在原型式继承的基础上增强对象
 *    - 缺点：函数难以复用
 *
 * 6. 寄生组合式继承
 *    - 通过构造函数继承属性，通过原型链继承方法
 *    - 优点：只调用一次父类构造函数，是最理想的继承方式
 *
 * 7. ES6 类继承
 *    - 使用 class/extends 语法
 *    - 优点：语法简洁，内部使用寄生组合式继承
 */

module.exports = {
  runAllTests,
};
