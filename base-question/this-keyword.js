/**
 * this 关键字
 *
 * 在JavaScript中，this是一个特殊的关键字，它在不同的上下文中指向不同的对象。
 * this的值是在函数运行时确定的，它取决于函数的调用方式。
 *
 * this绑定规则（优先级由高到低）：
 * 1. 构造函数绑定（new）
 * 2. 显式绑定（call、apply、bind）
 * 3. 隐式绑定（对象方法调用）
 * 4. 默认绑定（独立函数调用）
 */

// 1. 默认绑定：独立函数调用
console.log("===== 默认绑定 =====");

function showThis() {
  console.log(this);
}

showThis(); // 在非严格模式下，指向全局对象(浏览器中是window，Node.js中是global)
// 在严格模式下，是undefined

// 严格模式示例
function strictShowThis() {
  "use strict";
  console.log(this);
}

strictShowThis(); // undefined

// 2. 隐式绑定：对象方法调用
console.log("\n===== 隐式绑定 =====");

const user = {
  name: "John",
  greet() {
    console.log(`Hello, I am ${this.name}`);
  },
  // 对象里面嵌套函数
  nested: {
    name: "Nested Object",
    greet() {
      console.log(`Hello from nested object, I am ${this.name}`);
    },
  },
};

user.greet(); // "Hello, I am John" - this指向user对象
user.nested.greet(); // "Hello from nested object, I am Nested Object" - this指向nested对象

// 隐式绑定的陷阱：函数引用
const greetFunction = user.greet;
// greetFunction(); // 在浏览器中: "Hello, I am undefined" - this丢失，指向全局对象

// 3. 显式绑定：call、apply、bind
console.log("\n===== 显式绑定 =====");

function introduce(greeting, punctuation) {
  console.log(`${greeting}, I am ${this.name}${punctuation}`);
}

const person1 = { name: "Alice" };
const person2 = { name: "Bob" };

// call - 立即调用函数，参数列表
introduce.call(person1, "Hello", "!"); // "Hello, I am Alice!"

// apply - 立即调用函数，参数数组
introduce.apply(person2, ["Hi", "..."]); // "Hi, I am Bob..."

// bind - 返回一个新函数，this值被永久绑定
const introducePerson1 = introduce.bind(person1);
introducePerson1("Hey", "."); // "Hey, I am Alice."

// bind也可以预设参数
const greetPerson2WithHi = introduce.bind(person2, "Hi");
greetPerson2WithHi("!!!"); // "Hi, I am Bob!!!"

// 绑定后无法再次修改this
const tryToRebind = introducePerson1.bind(person2);
tryToRebind("Nice try", "?"); // "Nice try, I am Alice?" - 仍然指向person1

// 4. 构造函数绑定：new
console.log("\n===== 构造函数绑定 =====");

function Person(name) {
  this.name = name;
  this.greet = function () {
    console.log(`Hi, I am ${this.name}`);
  };
  // 构造函数中显式返回非原始值会覆盖this对象
  // return { name: 'Override' }; // 取消注释试试效果
}

const john = new Person("John");
john.greet(); // "Hi, I am John" - this指向新创建的对象

// 5. 箭头函数中的this
console.log("\n===== 箭头函数中的this =====");

/**
 * 箭头函数没有自己的this绑定，它会捕获其所在上下文的this值。
 * 无论通过何种方式调用，都无法改变其this值。
 * call、apply和bind方法能传递参数，但不能改变this。
 */

const arrowObj = {
  name: "Arrow Object",
  regularMethod() {
    console.log(`Regular: ${this.name}`);

    const arrowFunction = () => {
      console.log(`Arrow: ${this.name}`);
    };
    arrowFunction(); // this继承自regularMethod的this
  },
  arrowMethod: () => {
    console.log(`Standalone arrow: ${this.name}`); // this指向定义arrowObj时的环境
  },
};

arrowObj.regularMethod();
// "Regular: Arrow Object"
// "Arrow: Arrow Object" - 箭头函数中的this继承自regularMethod

arrowObj.arrowMethod();
// 在浏览器中: "Standalone arrow: " - this指向全局对象(window)
// 在Node.js中: "Standalone arrow: undefined" - this是模块的exports对象

// 箭头函数与call/apply/bind
const arrowFn = () => {
  console.log(this);
};

const someObj = { name: "Some object" };
arrowFn.call(someObj); // 仍然是全局对象/undefined - call无法改变箭头函数的this

// 6. 回调函数中的this
console.log("\n===== 回调函数中的this =====");

const button = {
  text: "Click me",
  // 传统回调
  addEventListener(callback) {
    // 这里的this是button
    callback(); // 调用时丢失了this上下文
  },
  // 较安全的做法
  addEventListenerSafe(callback) {
    callback.call(this); // 显式绑定this
  },
  click() {
    this.addEventListener(function () {
      console.log(`Traditional callback: ${this.text}`); // 在浏览器中: undefined
    });

    this.addEventListenerSafe(function () {
      console.log(`Safe callback with call: ${this.text}`); // "Click me"
    });

    // 使用箭头函数
    this.addEventListener(() => {
      console.log(`Arrow function callback: ${this.text}`); // "Click me"
    });

    // 使用bind
    this.addEventListener(
      function () {
        console.log(`Bound callback: ${this.text}`); // "Click me"
      }.bind(this)
    );

    // 使用变量保存this
    const self = this;
    this.addEventListener(function () {
      console.log(`Using 'self': ${self.text}`); // "Click me"
    });
  },
};

button.click();

// 7. 类中的this
console.log("\n===== 类中的this =====");

class Counter {
  constructor() {
    this.count = 0;

    // 方法1：构造函数中绑定
    this.increment = this.increment.bind(this);
  }

  // 原型方法 - 需要谨慎使用this
  increment() {
    this.count++;
    return this.count;
  }

  // 方法2：使用箭头函数（类字段语法）
  decrement = () => {
    this.count--;
    return this.count;
  };

  // 获取计数
  getCount() {
    return this.count;
  }
}

const counter = new Counter();
console.log(counter.increment()); // 1

// 问题场景：方法引用丢失this
const inc = counter.increment;
// inc(); // 如果未绑定，会报错: TypeError: Cannot read property 'count' of undefined

// 解决办法1：显式绑定
const boundInc = counter.increment.bind(counter);
console.log(boundInc()); // 2

// 解决办法2：箭头函数（自动绑定）
const dec = counter.decrement;
console.log(dec()); // 1 - 箭头函数保留了this

// 8. 常见陷阱和错误
console.log("\n===== 常见陷阱和错误 =====");

// 嵌套函数中的this丢失
const app = {
  name: "MyApp",
  start() {
    console.log(`Starting ${this.name}`);

    function displayDetails() {
      console.log(`Details of ${this.name}`); // this丢失，undefined或window
    }

    displayDetails();

    // 解决方法1：使用变量保存外部this
    const self = this;
    function displayDetailsSelf() {
      console.log(`Details (self) of ${self.name}`); // 使用self
    }
    displayDetailsSelf();

    // 解决方法2：使用bind
    function displayDetailsBind() {
      console.log(`Details (bind) of ${this.name}`);
    }
    displayDetailsBind.bind(this)();

    // 解决方法3：使用箭头函数
    const displayDetailsArrow = () => {
      console.log(`Details (arrow) of ${this.name}`);
    };
    displayDetailsArrow();
  },
};

app.start();

// 9. 在DOM事件处理程序中的this
console.log("\n===== DOM事件处理程序中的this =====");

// 在浏览器环境中，事件处理程序的this指向触发事件的DOM元素
/*
document.getElementById('myButton').addEventListener('click', function() {
  console.log(this); // this指向按钮元素
  this.innerHTML = 'Clicked';
});

// 但使用箭头函数时，this不会指向DOM元素
document.getElementById('anotherButton').addEventListener('click', () => {
  console.log(this); // 指向定义箭头函数时的上下文（通常是window）
});
*/

// 10. 严格模式对this的影响
console.log("\n===== 严格模式对this的影响 =====");

function nonStrictMode() {
  console.log(`Non-strict: ${typeof this}`); // 浏览器中: "object" (window)
}

function strictModeFunc() {
  "use strict";
  console.log(`Strict: ${typeof this}`); // "undefined"
}

nonStrictMode();
strictModeFunc();

// 作为对象方法调用时，严格模式不影响this
const obj = {
  nonStrict() {
    console.log(this === obj); // true
  },
  strict() {
    "use strict";
    console.log(this === obj); // true
  },
};

obj.nonStrict();
obj.strict();

/**
 * this绑定的总结：
 *
 * 1. 默认绑定：函数独立调用时，this指向全局对象(非严格模式)或undefined(严格模式)
 * 2. 隐式绑定：作为对象方法调用时，this指向调用该方法的对象
 * 3. 显式绑定：使用call、apply、bind时，this指向指定的对象
 * 4. new绑定：使用new调用构造函数时，this指向新创建的对象
 * 5. 箭头函数：this由词法作用域决定，指向定义箭头函数时外层函数的this
 */

/**
 * 面试中常见问题：
 *
 * 1. this关键字在JavaScript中的作用是什么？
 * 2. 箭头函数中的this与普通函数有什么不同？
 * 3. 如何处理回调函数中的this丢失问题？
 * 4. call、apply和bind之间的区别是什么？
 * 5. 在类(Class)中的方法里如何确保this指向类实例？
 * 6. 严格模式下的this和非严格模式有何不同？
 * 7. 如何理解this绑定的优先级顺序？
 * 8. 在前端开发中，你遇到过与this相关的常见问题有哪些？
 */
