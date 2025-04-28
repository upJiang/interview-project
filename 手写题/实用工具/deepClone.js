/**
 * 深拷贝 (Deep Clone)
 *
 * 作用：创建一个对象的完全独立的复制品，包括嵌套的对象和数组。
 * 应用场景：需要复制复杂数据结构且不希望修改原对象时。
 */

/**
 * 基础版深拷贝（只处理基本类型、对象和数组）
 *
 * @param {*} obj - 要拷贝的对象
 * @return {*} - 拷贝后的对象
 */
function simpleDeepClone(obj) {
  // 如果不是对象或是null，直接返回
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // 判断是数组还是对象，创建对应的空容器
  const clone = Array.isArray(obj) ? [] : {};

  // 遍历原对象的所有可枚举属性
  for (let key in obj) {
    // 只处理对象自身的属性，不处理继承属性
    if (obj.hasOwnProperty(key)) {
      // 递归拷贝属性值
      clone[key] = simpleDeepClone(obj[key]);
    }
  }

  return clone;
}

/**
 * 进阶版深拷贝（处理各种特殊对象类型和循环引用）
 *
 * @param {*} obj - 要拷贝的对象
 * @param {Map} [visited=new Map()] - 用于存储已访问过的对象，解决循环引用问题
 * @return {*} - 拷贝后的对象
 */
function deepClone(obj, visited = new Map()) {
  // 处理基本类型和null
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // 处理特殊对象类型

  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj);
  }

  // 处理正则表达式
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }

  // 处理Map
  if (obj instanceof Map) {
    const map = new Map();
    visited.set(obj, map);

    obj.forEach((value, key) => {
      // 递归拷贝Map的键和值
      map.set(deepClone(key, visited), deepClone(value, visited));
    });

    return map;
  }

  // 处理Set
  if (obj instanceof Set) {
    const set = new Set();
    visited.set(obj, set);

    obj.forEach((value) => {
      // 递归拷贝Set的值
      set.add(deepClone(value, visited));
    });

    return set;
  }

  // 处理函数（函数通常直接返回引用，如果需要可以复制函数属性）
  if (typeof obj === "function") {
    // 创建一个新函数，复制原函数的行为
    const cloneFunc = function (...args) {
      return obj.apply(this, args);
    };

    // 复制函数的属性
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloneFunc[key] = deepClone(obj[key], visited);
      }
    }

    return cloneFunc;
  }

  // 处理循环引用
  if (visited.has(obj)) {
    return visited.get(obj);
  }

  // 创建基本容器（数组或对象）
  const clone = Array.isArray(obj) ? [] : {};

  // 将当前对象添加到已访问Map中
  visited.set(obj, clone);

  // 处理普通对象或数组
  // 使用Reflect.ownKeys获取所有自身属性，包括Symbol类型的键
  Reflect.ownKeys(obj).forEach((key) => {
    clone[key] = deepClone(obj[key], visited);
  });

  return clone;
}

/**
 * 使用JSON序列化的深拷贝（简单但有局限性）
 *
 * 局限性：
 * 1. 无法处理函数、undefined、Symbol
 * 2. 无法处理循环引用
 * 3. 无法正确处理特殊对象如Date（会变成字符串）、RegExp等
 *
 * @param {*} obj - 要拷贝的对象
 * @return {*} - 拷贝后的对象
 */
function jsonDeepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.error("无法序列化对象", e);
    return obj;
  }
}

// 测试深拷贝功能
function testDeepClone() {
  // 创建一个复杂的测试对象
  const original = {
    name: "测试对象",
    info: {
      created: new Date(),
      id: Symbol("unique"),
      regex: /test/g,
    },
    data: [1, 2, { nested: true }],
    fn: function () {
      return "hello";
    },
    nullValue: null,
    undefinedValue: undefined,
    set: new Set([1, 2, 3]),
    map: new Map([
      ["key", "value"],
      [{}, "objectKey"],
    ]),
  };

  // 创建循环引用
  original.self = original;
  original.data.push(original.info);

  console.log("原始对象:", Object.keys(original));

  // 使用深拷贝函数
  console.log("\n测试完整深拷贝:");
  const fullClone = deepClone(original);

  // 验证是否成功复制
  console.log("复制后的对象是否与原对象相同:", original === fullClone); // 应为false
  console.log("嵌套对象是否深度复制:", original.info === fullClone.info); // 应为false
  console.log("日期对象是否正确复制:", fullClone.info.created instanceof Date); // 应为true
  console.log("函数是否正确复制:", typeof fullClone.fn === "function"); // 应为true

  // 验证修改不会互相影响
  fullClone.info.created.setFullYear(2000);
  console.log(
    "修改复制对象后原日期是否不变:",
    original.info.created.getFullYear() !== 2000
  ); // 应为true

  console.log("\n测试JSON深拷贝限制:");
  try {
    const jsonClone = jsonDeepClone(original);
    console.log("JSON方法无法处理循环引用，会抛出错误");
  } catch (e) {
    console.log("捕获到错误:", e.message);
  }

  // 测试无循环引用的对象
  const noCircular = {
    name: "无循环引用",
    data: [1, 2, 3],
    info: {
      id: 123,
    },
  };

  const jsonClone = jsonDeepClone(noCircular);
  console.log("JSON深拷贝无循环引用对象:", jsonClone.name === noCircular.name); // 应为true
}

// 运行测试
testDeepClone();

/**
 * 深拷贝实现总结：
 *
 * 1. 核心原理：递归复制对象的所有属性，对于复杂属性（对象或数组）继续递归处理
 *
 * 2. 实现难点：
 *    - 处理循环引用：需要使用Map或WeakMap记录已访问过的对象
 *    - 处理特殊对象：Date、RegExp、Map、Set等需要特殊处理
 *    - 处理函数：通常直接返回或只复制属性
 *    - 处理原型链：决定是否保留原型链信息
 *
 * 3. 不同实现方式的对比：
 *    - JSON方法：简单但有严重局限性
 *    - 递归法：最灵活，可以处理所有情况，但实现复杂
 *    - 结构化克隆算法：浏览器API，功能强但使用受限
 *
 * 4. 面试要点：
 *    - 理解基础递归复制的逻辑
 *    - 能够处理循环引用问题
 *    - 了解需要特殊处理的对象类型
 *    - 知道JSON方法的局限性
 *    - 理解深拷贝和浅拷贝的区别
 */

module.exports = {
  simpleDeepClone,
  deepClone,
  jsonDeepClone,
};
