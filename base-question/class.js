/**
 * ES6 类 (Class)
 *
 * 定义：ES6引入的类(class)是JavaScript现有基于原型继承的语法糖，
 * 它提供了一种更清晰、更面向对象的语法来创建对象和处理继承。
 *
 * 类主要包括以下特性：
 * 1. 构造函数(constructor)
 * 2. 实例方法和属性
 * 3. 静态方法和属性
 * 4. 继承
 * 5. Getters和Setters
 */

// 基本类声明
class Person {
  // 构造函数
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  // 实例方法
  sayHello() {
    return `Hello, my name is ${this.name}`;
  }

  // Getter
  get profile() {
    return `${this.name}, ${this.age} years old`;
  }

  // Setter
  set profile(value) {
    [this.name, this.ageStr] = value.split(",");
    this.age = parseInt(this.ageStr);
  }

  // 静态方法 - 属于类本身，不属于实例
  static createAnonymous() {
    return new Person("Anonymous", 0);
  }
}

// 使用类创建实例
const john = new Person("John", 30);
console.log(john.name); // "John"
console.log(john.sayHello()); // "Hello, my name is John"

// 使用Getter
console.log(john.profile); // "John, 30 years old"

// 使用Setter
john.profile = "Jane, 25";
console.log(john.name); // "Jane"
console.log(john.age); // 25

// 使用静态方法
const anonymous = Person.createAnonymous();
console.log(anonymous.name); // "Anonymous"

// 类表达式 - 类也可以通过表达式定义
const Animal = class {
  constructor(name) {
    this.name = name;
  }

  makeSound() {
    return "Some generic sound";
  }
};

const dog = new Animal("Dog");
console.log(dog.makeSound()); // "Some generic sound"

// 类继承
class Employee extends Person {
  constructor(name, age, jobTitle, salary) {
    // 调用父类构造函数
    super(name, age);

    // 添加自己的属性
    this.jobTitle = jobTitle;
    this.salary = salary;
  }

  // 重写父类方法
  sayHello() {
    // 调用父类方法
    return `${super.sayHello()}. I work as a ${this.jobTitle}.`;
  }

  // 新增方法
  getAnnualSalary() {
    return this.salary * 12;
  }

  // 静态属性 (ES2022+)
  static company = "Tech Corp";

  // 静态方法
  static compareByAge(emp1, emp2) {
    return emp1.age - emp2.age;
  }
}

const jane = new Employee("Jane", 28, "Developer", 5000);
console.log(jane.sayHello()); // "Hello, my name is Jane. I work as a Developer."
console.log(jane.getAnnualSalary()); // 60000

// 访问静态属性和方法
console.log(Employee.company); // "Tech Corp"
const bob = new Employee("Bob", 35, "Designer", 4500);
const employees = [jane, bob];
employees.sort(Employee.compareByAge);
console.log(employees[0].name); // "Jane"

// 类的私有字段(ES2022+)
class BankAccount {
  // 私有字段，使用 # 前缀
  #balance;
  #transactions = [];

  constructor(initialBalance) {
    this.#balance = initialBalance;
    this.accountHolder = "Anonymous"; // 公共字段
  }

  // 私有方法
  #validateAmount(amount) {
    return amount > 0;
  }

  deposit(amount) {
    if (!this.#validateAmount(amount)) {
      throw new Error("Invalid amount");
    }

    this.#balance += amount;
    this.#transactions.push({ type: "deposit", amount });
    return this.#balance;
  }

  withdraw(amount) {
    if (!this.#validateAmount(amount) || amount > this.#balance) {
      throw new Error("Invalid withdrawal");
    }

    this.#balance -= amount;
    this.#transactions.push({ type: "withdrawal", amount });
    return this.#balance;
  }

  get balance() {
    return this.#balance;
  }

  get transactionHistory() {
    // 返回交易历史的副本，而不是原始数组
    return [...this.#transactions];
  }
}

const account = new BankAccount(1000);
account.deposit(500);
account.withdraw(200);
console.log(account.balance); // 1300
console.log(account.transactionHistory); // [{type: "deposit", amount: 500}, {type: "withdrawal", amount: 200}]

// 尝试直接访问私有字段会导致语法错误
// console.log(account.#balance); // SyntaxError
// account.#validateAmount(100); // SyntaxError

// 不能在类外部声明私有字段
// account.#newField = 100; // SyntaxError

// 类字段初始化
class Counter {
  count = 0; // 实例字段初始化

  increment() {
    this.count++;
  }
}

const counter = new Counter();
counter.increment();
console.log(counter.count); // 1

// 使用类字段声明箭头函数以绑定this
class Button {
  text = "Click Me";

  // 箭头函数会捕获类的实例作为其this值
  handleClick = () => {
    console.log(`Button ${this.text} clicked`);
  };
}

const button = new Button();
const handler = button.handleClick;
// 即使脱离了对象，this仍然指向button实例
handler(); // "Button Click Me clicked"

// 类与传统构造函数的区别
/**
 * 1. 类声明不会被提升，而函数声明会被提升
 * 2. 类中的代码自动运行在严格模式下
 * 3. 类的方法不可枚举
 * 4. 类的构造函数必须使用new调用
 * 5. 类提供了更简洁的继承语法
 */

// 检验方法的可枚举性
function TraditionalConstructor() {}
TraditionalConstructor.prototype.method = function () {};

class ModernClass {
  method() {}
}

console.log(
  Object.getOwnPropertyDescriptor(TraditionalConstructor.prototype, "method")
    .enumerable
); // true
console.log(
  Object.getOwnPropertyDescriptor(ModernClass.prototype, "method").enumerable
); // false

/**
 * 装饰器 (Decorators) - 实验性特性
 * 注意：装饰器目前是JavaScript的实验性特性，尚未被标准化
 */

// 类装饰器示例 (需要babel或typescript等工具支持)
/*
function logged(target) {
  return class extends target {
    constructor(...args) {
      console.log(`Creating instance of ${target.name}`);
      super(...args);
    }
  };
}

@logged
class Example {
  constructor(name) {
    this.name = name;
  }
}

const ex = new Example('test'); // 输出: "Creating instance of Example"
*/

/**
 * 面试常见问题：
 *
 * 1. ES6 类与传统构造函数相比有哪些区别和优势？
 * 2. 如何在子类中调用父类的方法？
 * 3. 如何在JavaScript类中实现私有属性和方法？
 * 4. 什么是静态方法和静态属性？它们有什么用途？
 * 5. 类字段初始化和构造函数初始化的区别是什么？
 * 6. 为什么在类中使用箭头函数定义方法？有什么优缺点？
 * 7. 请解释类中的getters和setters的作用。
 * 8. ES6类如何在内部实现继承？
 */
