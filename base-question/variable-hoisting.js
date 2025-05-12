/**
 * 变量提升 (Hoisting) 与 变量声明 (var, let, const)
 *
 * 变量提升是JavaScript的一种行为，它将变量和函数声明移动到其所在作用域的顶部。
 * 这意味着无论在哪里声明变量或函数，它们都被视为在其所在作用域的顶部声明。
 */

// 1. var变量提升
console.log("===== var变量提升 =====");

console.log(name); // 输出: undefined (而不是报错)
var name = "John";

// 上面的代码等同于:
// var name;
// console.log(name); // undefined
// name = 'John';

// 函数作用域中的var
function testVar() {
  console.log(localVar); // undefined
  var localVar = "I am local";
  console.log(localVar); // "I am local"
}
testVar();

// 2. 函数声明提升
console.log("===== 函数声明提升 =====");

// 可以在声明之前调用
sayHello(); // "Hello!"

function sayHello() {
  console.log("Hello!");
}

// 3. 函数表达式不会被完全提升
console.log("===== 函数表达式不完全提升 =====");

// 以下会报错 - 只有变量声明被提升，但赋值不会
// sayHi(); // TypeError: sayHi is not a function

var sayHi = function () {
  console.log("Hi!");
};

// 等同于:
// var sayHi;
// sayHi(); // 此时sayHi是undefined
// sayHi = function() { console.log('Hi!'); };

// 4. let和const关键字
console.log("===== let和const关键字 =====");

// let和const声明的变量不会被提升到作用域顶部
// 实际上它们会被提升，但是在声明前访问会导致"暂时性死区"(TDZ)错误

// 以下会报错
// console.log(age); // ReferenceError: Cannot access 'age' before initialization
let age = 30;

// 同样，const也会产生暂时性死区
// console.log(PI); // ReferenceError: Cannot access 'PI' before initialization
const PI = 3.14159;

// 5. 块级作用域
console.log("===== 块级作用域 =====");

// var没有块级作用域
{
  var blockVar = "I am from block (var)";
}
console.log(blockVar); // "I am from block (var)"

// let和const有块级作用域
{
  let blockLet = "I am from block (let)";
  const blockConst = "I am from block (const)";
  console.log(blockLet); // "I am from block (let)"
  console.log(blockConst); // "I am from block (const)"
}
// 以下会报错
// console.log(blockLet); // ReferenceError: blockLet is not defined
// console.log(blockConst); // ReferenceError: blockConst is not defined

// 6. var vs let vs const
console.log("===== var vs let vs const =====");

// var可以重复声明
var user = "Alice";
var user = "Bob"; // 合法
console.log(user); // "Bob"

// let不能重复声明
let customer = "Charlie";
// let customer = 'Dave'; // SyntaxError: Identifier 'customer' has already been declared

// const必须初始化且不能重新赋值
const TAX_RATE = 0.2;
// const DISCOUNT; // SyntaxError: Missing initializer in const declaration
// TAX_RATE = 0.25; // TypeError: Assignment to constant variable

// 但const对象的属性可以修改
const person = {
  name: "John",
  age: 30,
};
person.age = 31; // 合法
// person = {}; // TypeError: Assignment to constant variable

const numbers = [1, 2, 3];
numbers.push(4); // 合法
// numbers = []; // TypeError: Assignment to constant variable

// 7. 循环中的作用域问题
console.log("===== 循环中的作用域问题 =====");

// 使用var的问题
var funcs = [];
for (var i = 0; i < 3; i++) {
  funcs.push(function () {
    console.log(i);
  });
}
// 循环结束后i为3
funcs[0](); // 3
funcs[1](); // 3
funcs[2](); // 3

// 使用let解决
var betterFuncs = [];
for (let j = 0; j < 3; j++) {
  betterFuncs.push(function () {
    console.log(j);
  });
}
betterFuncs[0](); // 0
betterFuncs[1](); // 1
betterFuncs[2](); // 2

// 8. 暂时性死区(Temporal Dead Zone, TDZ)
console.log("===== 暂时性死区 =====");

// 以下会报错，即使外部作用域有同名变量
let myName = "Global";

function testTDZ() {
  // 从块的开始到变量声明之前，变量都处于"暂时性死区"
  // console.log(myName); // ReferenceError: Cannot access 'myName' before initialization
  let myName = "Local";
  console.log(myName); // "Local"
}
testTDZ();

// 9. 全局对象属性
console.log("===== 全局对象属性 =====");

// var声明的全局变量会成为全局对象(在浏览器中是window，在Node.js中是global)的属性
var globalVar = "I am global var";
console.log(globalVar); // "I am global var"
// 在浏览器中: console.log(window.globalVar); // "I am global var"

// let和const声明的变量不会成为全局对象的属性
let globalLet = "I am global let";
const globalConst = "I am global const";
// 在浏览器中: console.log(window.globalLet); // undefined
// 在浏览器中: console.log(window.globalConst); // undefined

// 10. 最佳实践
console.log("===== 最佳实践 =====");

/**
 * 1. 避免使用var，优先使用const，其次使用let
 * 2. 函数声明放在作用域顶部，避免依赖提升
 * 3. 始终在使用变量之前声明它们
 * 4. 使用严格模式('use strict')来避免隐式全局变量
 */

// 不推荐
function badPractice() {
  x = 10; // 隐式全局变量
  console.log(y); // 依赖变量提升
  var y = 20;
}

// 推荐
function goodPractice() {
  "use strict";
  // 所有变量声明放在顶部
  let x;
  const MAX = 100;

  // 然后是初始化和其他代码
  x = 10;
  console.log(x, MAX);
}

// 11. var、let和const的使用场景
console.log("===== 使用场景 =====");

// const: 对于不会改变的值，比如配置、常量等
const API_URL = "https://api.example.com";
const DAYS_IN_WEEK = 7;

// let: 对于会改变的值，比如循环计数器、状态变量等
let count = 0;
function increment() {
  count++;
}

// var: 几乎没有必要使用，除非在兼容旧代码或特定场景下

/**
 * 面试中常见问题：
 *
 * 1. 什么是变量提升？
 * 2. var、let、const的区别是什么？
 * 3. 暂时性死区(TDZ)是什么？
 * 4. 为什么在现代JavaScript中推荐使用let和const而不是var？
 * 5. const声明的对象的属性可以修改吗？为什么？
 * 6. 在循环中使用var和let有什么不同？
 * 7. 函数声明和函数表达式在提升方面有什么区别？
 * 8. 如何避免变量提升带来的问题？
 */
