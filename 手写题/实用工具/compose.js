/**
 * 函数组合 (Function Composition)
 *
 * 作用：将多个函数组合成一个函数，从右到左执行。
 * 应用场景：函数式编程、数据处理管道、中间件系统等。
 */

/**
 * 基础版函数组合
 * 从右到左组合多个函数，返回一个新函数
 *
 * @param {...Function} fns - 要组合的函数
 * @return {Function} - 组合后的函数
 */
function compose(...fns) {
  // 参数校验
  if (fns.length === 0) {
    // 如果没有传入函数，返回一个透传函数
    return (arg) => arg;
  }

  // 检查所有参数是否为函数
  fns.forEach((fn, index) => {
    if (typeof fn !== "function") {
      throw new TypeError(`组合的第 ${index + 1} 个参数不是函数`);
    }
  });

  // 单函数情况直接返回
  if (fns.length === 1) {
    return fns[0];
  }

  // 从右到左依次执行每个函数，将前一个函数的结果传递给下一个函数
  return function (...args) {
    // 先执行最右边的函数，结果作为初始值
    let result = fns[fns.length - 1](...args);

    // 从倒数第二个函数开始，从右向左依次执行
    for (let i = fns.length - 2; i >= 0; i--) {
      result = fns[i](result);
    }

    return result;
  };
}

/**
 * 基于reduce实现的函数组合
 * 更简洁、更函数式的实现
 *
 * @param {...Function} fns - 要组合的函数
 * @return {Function} - 组合后的函数
 */
function composeWithReduce(...fns) {
  // 参数校验
  if (fns.length === 0) {
    return (arg) => arg;
  }

  // 检查所有参数是否为函数
  fns.forEach((fn, index) => {
    if (typeof fn !== "function") {
      throw new TypeError(`组合的第 ${index + 1} 个参数不是函数`);
    }
  });

  // 单函数情况直接返回
  if (fns.length === 1) {
    return fns[0];
  }

  // 使用reduce从右到左组合函数
  return function (...args) {
    // 从最右边的函数开始，依次向左执行
    return fns.reduceRight((result, fn, index) => {
      // 对于最右边的函数，传入原始参数；否则传入上一步的结果
      return index === fns.length - 1 ? fn(...result) : fn(result);
    }, args);
  };
}

/**
 * 从左到右的函数组合（管道）
 * 与compose相反的执行顺序
 *
 * @param {...Function} fns - 要组合的函数
 * @return {Function} - 组合后的函数
 */
function pipe(...fns) {
  // 参数校验与边界情况处理与compose相同
  if (fns.length === 0) {
    return (arg) => arg;
  }

  fns.forEach((fn, index) => {
    if (typeof fn !== "function") {
      throw new TypeError(`管道的第 ${index + 1} 个参数不是函数`);
    }
  });

  if (fns.length === 1) {
    return fns[0];
  }

  // 使用reduce从左到右组合函数
  return function (...args) {
    // 从最左边的函数开始，依次向右执行
    return fns.reduce((result, fn, index) => {
      // 对于第一个函数，传入原始参数；否则传入上一步的结果
      return index === 0 ? fn(...result) : fn(result);
    }, args);
  };
}

/**
 * 支持异步函数的组合
 * 可以组合返回Promise的函数
 *
 * @param {...Function} fns - 要组合的函数（可包含异步函数）
 * @return {Function} - 组合后的异步函数
 */
function composeAsync(...fns) {
  if (fns.length === 0) {
    return (arg) => arg;
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return function (...args) {
    // 创建初始Promise，使用最右边的函数处理参数
    let result = Promise.resolve(fns[fns.length - 1](...args));

    // 从右向左依次执行剩余函数
    for (let i = fns.length - 2; i >= 0; i--) {
      result = result.then(fns[i]);
    }

    return result;
  };
}

// 测试函数组合
function testCompose() {
  // 创建一些基础函数
  const double = (x) => x * 2;
  const square = (x) => x * x;
  const addOne = (x) => x + 1;
  const toString = (x) => `结果是: ${x}`;

  // 基础测试
  console.log("基础组合测试:");
  const calculate = compose(toString, addOne, square, double);
  console.log(calculate(3)); // 应输出: "结果是: 37"
  // 执行过程: double(3) => 6, square(6) => 36, addOne(36) => 37, toString(37) => "结果是: 37"

  // 使用reduce实现的组合
  console.log("\nReduce实现的组合测试:");
  const calculateWithReduce = composeWithReduce(
    toString,
    addOne,
    square,
    double
  );
  console.log(calculateWithReduce(3)); // 应输出: "结果是: 37"

  // 测试pipe（从左到右）
  console.log("\nPipe测试 (从左到右):");
  const calculateWithPipe = pipe(double, square, addOne, toString);
  console.log(calculateWithPipe(3)); // 应输出: "结果是: 37"
  // 执行过程: double(3) => 6, square(6) => 36, addOne(36) => 37, toString(37) => "结果是: 37"

  // 测试异步组合
  console.log("\n异步组合测试:");
  const asyncDouble = (x) => Promise.resolve(x * 2);
  const asyncAddOne = (x) => Promise.resolve(x + 1);

  const calculateAsync = composeAsync(
    toString,
    asyncAddOne,
    square,
    asyncDouble
  );

  calculateAsync(3).then((result) => {
    console.log(result); // 应输出: "结果是: 37"
  });

  // 测试边界情况
  console.log("\n边界情况测试:");
  const identity = compose();
  console.log(identity(5)); // 应输出: 5

  const singleFn = compose(double);
  console.log(singleFn(5)); // 应输出: 10
}

// 函数组合的实际应用示例
function composeApplications() {
  console.log("\n函数组合的实际应用示例:");

  // 1. 数据转换管道
  const users = [
    { id: 1, name: "张三", age: 24 },
    { id: 2, name: "李四", age: 30 },
    { id: 3, name: "王五", age: 18 },
  ];

  // 创建一系列数据转换函数
  const filterAdults = (users) => users.filter((user) => user.age >= 18);
  const sortByAge = (users) => [...users].sort((a, b) => a.age - b.age);
  const mapToNames = (users) => users.map((user) => user.name);
  const joinWithComma = (names) => names.join(", ");

  // 组合这些函数创建数据处理管道
  const getUserNamesOrderedByAge = pipe(
    filterAdults,
    sortByAge,
    mapToNames,
    joinWithComma
  );

  console.log(`成年用户（按年龄排序）: ${getUserNamesOrderedByAge(users)}`);

  // 2. 表单验证示例
  function validateEmail(email) {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return isValid
      ? { email, errors: [] }
      : { email, errors: ["无效的邮箱地址"] };
  }

  function validateLength(data) {
    const { email, errors } = data;
    if (email.length < 6) {
      return { email, errors: [...errors, "邮箱地址太短"] };
    }
    return data;
  }

  function normalizeEmail(data) {
    const { email, errors } = data;
    return { email: email.trim().toLowerCase(), errors };
  }

  // 组合验证函数
  const validateEmailAddress = pipe(
    normalizeEmail,
    validateLength,
    validateEmail
  );

  console.log(
    validateEmailAddress({ email: " Test@EXAMPLE.com ", errors: [] })
  );
  console.log(validateEmailAddress({ email: "inv", errors: [] }));
}

// 运行测试与应用示例
testCompose();
composeApplications();

/**
 * 函数组合实现总结：
 *
 * 1. 核心原理：
 *    函数组合是将多个函数组合成一个函数，使数据在函数间流动，避免创建中间变量，
 *    提高代码可读性和可维护性。compose从右到左执行，pipe从左到右执行。
 *
 * 2. 实现方式：
 *    - 基础实现：通过循环从右到左依次执行函数
 *    - reduce实现：使用数组的reduce方法，更加简洁和函数式
 *    - 异步实现：支持异步函数的组合，使用Promise链接
 *
 * 3. 关键特性：
 *    - 函数的执行顺序：compose从右到左，pipe从左到右
 *    - 参数处理：第一个执行的函数可以接收多个参数，之后的函数只接收一个参数
 *    - 透明性：当没有传入函数时，返回一个透传函数
 *    - 类型检查：确保所有参数都是函数
 *
 * 4. 面试要点：
 *    - 理解函数组合是函数式编程的核心概念
 *    - 掌握compose和pipe的区别和实现
 *    - 能够使用reduce实现函数组合
 *    - 理解异步函数组合的实现原理
 *    - 能够举例说明函数组合的实际应用场景
 */

module.exports = {
  compose,
  composeWithReduce,
  pipe,
  composeAsync,
};
