/**
 * 闭包 (Closure)
 *
 * 定义：闭包是指有权访问另一个函数作用域中的变量的函数。
 * 通常是在一个函数内部创建另一个函数，内部函数可以访问外部函数的变量。
 */

// 基本的闭包示例
function createCounter() {
  let count = 0; // 私有变量

  return function () {
    count++; // 可以访问外部函数的变量
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3

// 闭包可以创建私有变量
function createBankAccount(initialBalance) {
  let balance = initialBalance; // 私有变量，外部无法直接访问

  return {
    deposit: function (amount) {
      balance += amount;
      return balance;
    },
    withdraw: function (amount) {
      if (amount > balance) {
        console.log("Insufficient funds");
        return balance;
      }
      balance -= amount;
      return balance;
    },
    getBalance: function () {
      return balance;
    },
  };
}

const account = createBankAccount(100);
console.log(account.getBalance()); // 100
account.deposit(50);
console.log(account.getBalance()); // 150
account.withdraw(30);
console.log(account.getBalance()); // 120
// 无法直接访问balance变量
// console.log(account.balance); // undefined

// 闭包在循环中的常见问题
function createFunctionsWithProblem() {
  var arr = [];
  for (var i = 0; i < 3; i++) {
    arr.push(function () {
      console.log(i);
    });
  }
  return arr;
}

const functionsWithProblem = createFunctionsWithProblem();
functionsWithProblem[0](); // 3
functionsWithProblem[1](); // 3
functionsWithProblem[2](); // 3 - 都输出3，因为循环结束后i的值为3

// 解决方案1：使用IIFE(立即执行函数表达式)创建闭包
function createFunctionsWithIIFE() {
  var arr = [];
  for (var i = 0; i < 3; i++) {
    arr.push(
      (function (j) {
        return function () {
          console.log(j);
        };
      })(i)
    );
  }
  return arr;
}

const functionsWithIIFE = createFunctionsWithIIFE();
functionsWithIIFE[0](); // 0
functionsWithIIFE[1](); // 1
functionsWithIIFE[2](); // 2

// 解决方案2：使用let关键字(块级作用域)
function createFunctionsWithLet() {
  var arr = [];
  for (let i = 0; i < 3; i++) {
    arr.push(function () {
      console.log(i);
    });
  }
  return arr;
}

const functionsWithLet = createFunctionsWithLet();
functionsWithLet[0](); // 0
functionsWithLet[1](); // 1
functionsWithLet[2](); // 2

/**
 * 闭包的应用场景
 *
 * 1. 数据私有化/封装
 * 2. 函数工厂
 * 3. 实现模块化
 * 4. 柯里化(Currying)
 * 5. 记忆化(Memoization)
 */

// 柯里化示例
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function (...args2) {
        return curried.apply(this, args.concat(args2));
      };
    }
  };
}

function sum(a, b, c) {
  return a + b + c;
}

const curriedSum = curry(sum);
console.log(curriedSum(1)(2)(3)); // 6
console.log(curriedSum(1, 2)(3)); // 6
console.log(curriedSum(1)(2, 3)); // 6

// 记忆化示例
function memoize(fn) {
  const cache = {};
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache[key]) {
      console.log("Returning from cache");
      return cache[key];
    }
    const result = fn.apply(this, args);
    cache[key] = result;
    return result;
  };
}

function fibonacci(n) {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const memoizedFibonacci = memoize(function (n) {
  if (n < 2) return n;
  return memoizedFibonacci(n - 1) + memoizedFibonacci(n - 2);
});

console.time("Regular fibonacci");
console.log(fibonacci(30)); // 较慢
console.timeEnd("Regular fibonacci");

console.time("Memoized fibonacci");
console.log(memoizedFibonacci(30)); // 明显更快
console.timeEnd("Memoized fibonacci");

/**
 * 闭包注意事项
 *
 * 1. 内存占用：闭包会在内存中保留函数的词法环境，可能导致内存泄漏
 * 2. 性能考虑：过度使用闭包会影响性能
 * 3. this问题：闭包中的this可能不是预期的值
 * 4. 循环中的闭包需要特别注意变量捕获问题
 */

// 面试中经常被问到的问题：
// 1. 什么是闭包？它有什么用途？
// 2. 闭包与作用域的关系是什么？
// 3. 如何避免闭包导致的内存泄漏？
// 4. 解释闭包在循环中的陷阱及解决方案
// 5. 闭包如何实现私有变量？
