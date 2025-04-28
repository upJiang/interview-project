/**
 * 数组扁平化 (Array Flatten)
 *
 * 作用：将多层嵌套的数组转换为一维数组。
 * 应用场景：处理复杂的数据结构、DOM树转换等。
 */

/**
 * 使用递归实现数组扁平化
 *
 * @param {Array} arr - 要扁平化的数组
 * @param {Number} depth - 扁平化的深度，默认为Infinity（完全扁平化）
 * @return {Array} - 扁平化后的数组
 */
function flattenByRecursion(arr, depth = Infinity) {
  // 参数校验
  if (!Array.isArray(arr)) {
    return arr;
  }

  // 如果深度为0，直接返回数组
  if (depth <= 0) {
    return arr;
  }

  // 使用reduce迭代数组中的每个元素
  return arr.reduce((result, item) => {
    // 如果当前元素是数组且深度大于0，递归扁平化该元素
    if (Array.isArray(item) && depth > 0) {
      // 合并当前扁平化结果和递归扁平化子数组的结果
      return result.concat(flattenByRecursion(item, depth - 1));
    } else {
      // 如果不是数组，直接添加到结果中
      return result.concat(item);
    }
  }, []);
}

/**
 * 使用迭代方式实现数组扁平化（非递归）
 *
 * @param {Array} arr - 要扁平化的数组
 * @param {Number} depth - 扁平化的深度，默认为Infinity（完全扁平化）
 * @return {Array} - 扁平化后的数组
 */
function flattenByIteration(arr, depth = Infinity) {
  // 参数校验
  if (!Array.isArray(arr)) {
    return arr;
  }

  // 如果深度为0，直接返回数组
  if (depth <= 0) {
    return arr;
  }

  // 创建结果数组
  const result = [];
  // 创建堆栈，存储待处理的元素
  const stack = [...arr.map((item) => ({ value: item, depth }))];

  // 当堆栈不为空时，继续处理
  while (stack.length > 0) {
    // 从堆栈中取出一个元素
    const { value, depth } = stack.pop();

    // 如果当前元素是数组且深度大于0，将子元素加入堆栈
    if (Array.isArray(value) && depth > 0) {
      // 将数组中的每个元素加入堆栈，深度减1
      stack.push(...value.map((item) => ({ value: item, depth: depth - 1 })));
    } else {
      // 如果不是数组或深度为0，将元素添加到结果数组的前面
      // 由于使用pop，结果会反序，所以要插入到数组前面
      result.unshift(value);
    }
  }

  return result;
}

/**
 * 使用自带的flat方法（仅在现代浏览器支持）
 *
 * @param {Array} arr - 要扁平化的数组
 * @param {Number} depth - 扁平化的深度，默认为Infinity（完全扁平化）
 * @return {Array} - 扁平化后的数组
 */
function flattenByNative(arr, depth = Infinity) {
  // 参数校验
  if (!Array.isArray(arr)) {
    return arr;
  }

  // 使用原生的flat方法
  if (Array.prototype.flat) {
    return arr.flat(depth);
  }

  // 如果环境不支持flat方法，回退到递归实现
  return flattenByRecursion(arr, depth);
}

/**
 * 使用字符串和JSON方法实现完全扁平化（仅适用于基本类型）
 * 注意：这种方法有局限性，不能处理对象和函数
 *
 * @param {Array} arr - 要扁平化的数组
 * @return {Array} - 扁平化后的数组
 */
function flattenByString(arr) {
  // 参数校验
  if (!Array.isArray(arr)) {
    return arr;
  }

  try {
    // 转换为字符串，替换所有中括号，然后解析回数组
    return JSON.parse("[" + arr.toString() + "]");
  } catch (e) {
    // 如果解析失败，回退到递归实现
    console.warn("flattenByString方法失败，回退到递归实现", e);
    return flattenByRecursion(arr);
  }
}

/**
 * 使用Generator实现数组扁平化
 *
 * @param {Array} arr - 要扁平化的数组
 * @param {Number} depth - 扁平化的深度，默认为Infinity（完全扁平化）
 * @return {Array} - 扁平化后的数组
 */
function* flattenGenerator(arr, depth = Infinity) {
  // 参数校验
  if (!Array.isArray(arr)) {
    yield arr;
    return;
  }

  // 如果深度为0，直接返回数组
  if (depth <= 0) {
    yield arr;
    return;
  }

  // 遍历数组中的每个元素
  for (const item of arr) {
    // 如果是数组且深度大于0，递归处理
    if (Array.isArray(item) && depth > 0) {
      yield* flattenGenerator(item, depth - 1);
    } else {
      // 如果不是数组，直接返回元素
      yield item;
    }
  }
}

// 包装Generator函数，使其返回数组
function flattenByGenerator(arr, depth = Infinity) {
  return [...flattenGenerator(arr, depth)];
}

// 测试数组扁平化函数
function testFlatten() {
  // 创建测试数组
  const nestedArray = [1, [2, [3, 4], 5], 6, [7, 8, [9, [10]]]];

  console.log("原始嵌套数组:", nestedArray);

  // 测试递归实现
  console.log("\n递归实现:");
  console.log("完全扁平化:", flattenByRecursion(nestedArray));
  console.log("深度为1的扁平化:", flattenByRecursion(nestedArray, 1));

  // 测试迭代实现
  console.log("\n迭代实现:");
  console.log("完全扁平化:", flattenByIteration(nestedArray));
  console.log("深度为1的扁平化:", flattenByIteration(nestedArray, 1));

  // 测试生成器实现
  console.log("\n生成器实现:");
  console.log("完全扁平化:", flattenByGenerator(nestedArray));
  console.log("深度为1的扁平化:", flattenByGenerator(nestedArray, 1));

  // 测试特殊情况
  console.log("\n特殊情况测试:");
  console.log("空数组:", flattenByRecursion([]));
  console.log("非数组:", flattenByRecursion("not an array"));
  console.log("包含null的数组:", flattenByRecursion([1, null, [2, undefined]]));

  // 性能测试
  console.log("\n性能测试:");
  const largeArray = createLargeNestedArray(5, 5); // 创建大型嵌套数组

  console.time("递归实现");
  flattenByRecursion(largeArray);
  console.timeEnd("递归实现");

  console.time("迭代实现");
  flattenByIteration(largeArray);
  console.timeEnd("迭代实现");

  console.time("生成器实现");
  flattenByGenerator(largeArray);
  console.timeEnd("生成器实现");

  if (Array.prototype.flat) {
    console.time("原生flat实现");
    largeArray.flat(Infinity);
    console.timeEnd("原生flat实现");
  }
}

// 创建大型嵌套数组用于性能测试
function createLargeNestedArray(depth, breadth) {
  if (depth <= 0) {
    return Math.floor(Math.random() * 100);
  }

  const arr = [];
  for (let i = 0; i < breadth; i++) {
    arr.push(createLargeNestedArray(depth - 1, breadth));
  }

  return arr;
}

// 运行测试
testFlatten();

/**
 * 数组扁平化实现总结：
 *
 * 1. 核心原理：
 *    遍历数组中的每个元素，如果是数组则递归处理，否则添加到结果数组中
 *
 * 2. 实现方式：
 *    - 递归方法：简洁直观，但对于非常深的嵌套可能导致栈溢出
 *    - 迭代方法：通过维护一个堆栈手动实现，避免栈溢出问题
 *    - 生成器方法：利用ES6生成器函数特性，按需生成扁平化结果
 *    - 原生方法：现代浏览器已支持Array.prototype.flat方法
 *
 * 3. 关键点与优化：
 *    - 深度控制：支持指定扁平化的嵌套深度
 *    - 类型检查：处理非数组输入和特殊值
 *    - 性能考虑：迭代通常比递归性能更好，尤其是大型数组
 *
 * 4. 面试要点：
 *    - 理解递归和迭代两种实现方式的区别
 *    - 能够处理深度参数
 *    - 了解原生flat方法的使用
 *    - 考虑特殊情况的处理（如非数组输入、空数组等）
 *    - 理解生成器函数在此问题中的应用
 */

module.exports = {
  flattenByRecursion,
  flattenByIteration,
  flattenByNative,
  flattenByString,
  flattenByGenerator,
};
