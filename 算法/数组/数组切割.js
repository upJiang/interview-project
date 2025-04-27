/**
 * 数组切割操作总结
 * 
 * 重要提示: 所有切割操作的end参数都不包含自身
 */

// Array.prototype.slice(start, end)
// - 返回从start到end(不包含)的新数组
// - 支持负索引，-1表示最后一个元素
// - 不改变原数组
function arraySliceDemo() {
  const arr = [1, 2, 3, 4, 5];
  
  console.log(arr.slice(0, 3));     // [1, 2, 3] - 从索引0到2
  console.log(arr.slice(2));        // [3, 4, 5] - 从索引2到结束
  console.log(arr.slice(-2));       // [4, 5] - 从倒数第2个到结束
  console.log(arr.slice(1, -1));    // [2, 3, 4] - 从索引1到倒数第1个(不含)
  
  // 原数组不变
  console.log(arr);                 // [1, 2, 3, 4, 5]
}

// Array.prototype.splice(start, deleteCount, ...items)
// - 从start开始，删除deleteCount个元素，并插入items
// - 返回被删除的元素数组
// - 会改变原数组
function arraySpliceDemo() {
  const arr = [1, 2, 3, 4, 5];
  
  // 删除操作
  const removed1 = arr.splice(2, 2);  // 从索引2开始删除2个元素
  console.log(removed1);              // [3, 4] - 返回删除的元素
  console.log(arr);                  // [1, 2, 5] - 原数组被修改
  
  // 重置数组
  const arr2 = [1, 2, 3, 4, 5];
  
  // 删除并插入
  const removed2 = arr2.splice(1, 2, 'a', 'b', 'c');
  console.log(removed2);              // [2, 3] - 返回删除的元素
  console.log(arr2);                  // [1, 'a', 'b', 'c', 4, 5] - 原数组被修改
  
  // 纯插入(不删除)
  const arr3 = [1, 2, 3];
  const removed3 = arr3.splice(1, 0, 'a', 'b');
  console.log(removed3);              // [] - 返回空数组，因为没有删除元素
  console.log(arr3);                  // [1, 'a', 'b', 2, 3] - 原数组被修改
}

// 数组分块(chunk)实现
// - 将数组按指定大小分割成多个小数组
function chunk(arr, size) {
  // 处理边界情况
  if (size <= 0 || !arr || !arr.length) {
    return arr;
  }
  
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  
  return result;
}

// 使用示例
console.log(chunk([1, 2, 3, 4, 5, 6], 2)); // [[1, 2], [3, 4], [5, 6]]
console.log(chunk([1, 2, 3, 4, 5], 2));    // [[1, 2], [3, 4], [5]]
console.log(chunk([1, 2, 3], 5));          // [[1, 2, 3]]

// 数组扁平化示例
function flattenArray(arr, depth = Infinity) {
  // 使用Array.prototype.flat()方法(ES2019+)
  return arr.flat(depth);
}

// 兼容旧版本的扁平化实现
function compatFlatten(arr, depth = Infinity) {
  // 使用some+concat递归实现
  let result = [...arr];
  let currentDepth = 0;
  
  while (result.some(Array.isArray) && currentDepth < depth) {
    result = [].concat(...result);
    currentDepth++;
  }
  
  return result;
}

// 使用示例
const nestedArray = [1, [2, 3], [4, [5, [6]]]];
console.log(flattenArray(nestedArray, 1));      // [1, 2, 3, 4, [5, [6]]]
console.log(flattenArray(nestedArray));         // [1, 2, 3, 4, 5, 6]
console.log(compatFlatten(nestedArray, 1));     // [1, 2, 3, 4, [5, [6]]]
console.log(compatFlatten(nestedArray));        // [1, 2, 3, 4, 5, 6]

// 数组去重、扁平化、排序组合示例
function processArray(arr) {
  // 扁平化
  const flattened = compatFlatten(arr);
  
  // 去重
  const unique = [...new Set(flattened)];
  
  // 排序
  const sorted = unique.sort((a, b) => a - b);
  
  return sorted;
}

// 使用示例
const complexArray = [[1, 2, 2], [3, 4, 5, 5], [6, 7, 8, 9, [11, 12, [12, 13, [14]]]], 10];
console.log(processArray(complexArray)); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

/**
 * 数组切割小结：
 * 1. slice返回新数组的子集，不改变原数组，end参数不包含自身
 * 2. splice会修改原数组，返回被删除的元素
 * 3. splice参数含义: (起始位置, 删除数量, 要插入的新元素...)
 * 4. 所有切割操作的end参数都不包含自身
 */ 