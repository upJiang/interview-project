/**
 * 字符串和数组操作
 * 
 * 本文件包含常见的字符串和数组操作方法，特别是切割、拼接相关的操作。
 * 重点说明了各种方法中end参数不包含自身的特性。
 */

/**
 * 字符串切割操作
 * 
 * 字符串的substring、slice、substr方法的区别与使用
 * 注意：所有切割方法中的end参数都不包含结束位置自身
 */

// 字符串切割示例
function stringSliceDemo() {
  console.log('\n----------- 字符串切割示例 -----------');
  const str = 'Hello, World!';
  console.log(`原始字符串: "${str}", 长度: ${str.length}`);
  
  // 1. substring(start, end)：提取从start到end(不包含)的字符
  // - 如果start > end，会交换这两个参数
  // - 如果任一参数为负数或NaN，视为0
  console.log(`\nsubstring 方法:`);
  console.log(`str.substring(0, 5): "${str.substring(0, 5)}"`); // "Hello"
  console.log(`str.substring(7, 12): "${str.substring(7, 12)}"`); // "World"
  console.log(`str.substring(7): "${str.substring(7)}"`); // "World!"
  console.log(`str.substring(5, 0): "${str.substring(5, 0)}"`); // "Hello" (参数交换)
  console.log(`str.substring(-3, 5): "${str.substring(-3, 5)}"`); // "Hello" (负值视为0)
  
  // 2. slice(start, end)：提取从start到end(不包含)的字符
  // - 支持负值索引（从尾部计算）
  // - 不会交换参数
  console.log(`\nslice 方法:`);
  console.log(`str.slice(0, 5): "${str.slice(0, 5)}"`); // "Hello"
  console.log(`str.slice(7, 12): "${str.slice(7, 12)}"`); // "World"
  console.log(`str.slice(7): "${str.slice(7)}"`); // "World!"
  console.log(`str.slice(-6): "${str.slice(-6)}"`); // "World!" (从末尾开始)
  console.log(`str.slice(-6, -1): "${str.slice(-6, -1)}"`); // "World" (从末尾开始，到末尾倒数第二个字符)
  console.log(`str.slice(5, 0): "${str.slice(5, 0)}"`); // "" (空字符串，因为不交换参数)
  
  // 3. substr(start, length)：从start开始提取length个字符
  // - 第二个参数是长度而非结束位置
  // - start可以是负值（从末尾开始）
  console.log(`\nsubstr 方法: (已废弃，不推荐使用)`);
  console.log(`str.substr(0, 5): "${str.substr(0, 5)}"`); // "Hello"
  console.log(`str.substr(7, 5): "${str.substr(7, 5)}"`); // "World"
  console.log(`str.substr(-6, 5): "${str.substr(-6, 5)}"`); // "World" (从末尾第6个字符开始)
  
  // 总结
  console.log('\n字符串切割方法总结:');
  console.log('1. substring(start, end)：不支持负索引，会自动交换参数');
  console.log('2. slice(start, end)：支持负索引，不会交换参数');
  console.log('3. substr(start, length)：已废弃，第二个参数是长度');
  console.log('注意：所有方法中，end参数都不包含该位置本身');
}

/**
 * 数组切割操作
 * 
 * 数组的slice和splice方法的区别与使用
 * 注意：slice的end参数不包含结束位置自身
 */

// 数组切割示例
function arraySliceDemo() {
  console.log('\n----------- 数组切割示例 -----------');
  const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  console.log(`原始数组: [${arr}], 长度: ${arr.length}`);
  
  // 1. slice(start, end)：提取从start到end(不包含)的元素形成新数组
  // - 不修改原数组
  // - 支持负值索引（从尾部计算）
  console.log(`\nslice 方法:`);
  console.log(`arr.slice(0, 3): [${arr.slice(0, 3)}]`); // [0, 1, 2]
  console.log(`arr.slice(3, 7): [${arr.slice(3, 7)}]`); // [3, 4, 5, 6]
  console.log(`arr.slice(7): [${arr.slice(7)}]`); // [7, 8, 9]
  console.log(`arr.slice(-3): [${arr.slice(-3)}]`); // [7, 8, 9] (从末尾开始)
  console.log(`arr.slice(-6, -2): [${arr.slice(-6, -2)}]`); // [4, 5, 6, 7] (负索引从末尾计算)
  console.log(`原数组不变: [${arr}]`);
  
  // 2. splice(start, deleteCount, ...items)：从start开始删除deleteCount个元素，并插入新元素
  // - 会修改原数组
  // - 返回被删除的元素组成的数组
  console.log(`\nsplice 方法:`);
  
  // 复制一份用于演示
  let arrCopy = [...arr];
  
  // 删除元素
  console.log(`arrCopy.splice(2, 3): [${arrCopy.splice(2, 3)}]`); // [2, 3, 4]
  console.log(`删除后的数组: [${arrCopy}]`); // [0, 1, 5, 6, 7, 8, 9]
  
  // 替换元素
  arrCopy = [...arr]; // 重新复制
  console.log(`arrCopy.splice(2, 3, 'a', 'b', 'c'): [${arrCopy.splice(2, 3, 'a', 'b', 'c')}]`); // [2, 3, 4]
  console.log(`替换后的数组: [${arrCopy}]`); // [0, 1, 'a', 'b', 'c', 5, 6, 7, 8, 9]
  
  // 插入元素（不删除）
  arrCopy = [...arr]; // 重新复制
  console.log(`arrCopy.splice(2, 0, 'a', 'b'): [${arrCopy.splice(2, 0, 'a', 'b')}]`); // [] (没有删除元素)
  console.log(`插入后的数组: [${arrCopy}]`); // [0, 1, 'a', 'b', 2, 3, 4, 5, 6, 7, 8, 9]
  
  // 删除后面所有元素
  arrCopy = [...arr]; // 重新复制
  console.log(`arrCopy.splice(5): [${arrCopy.splice(5)}]`); // [5, 6, 7, 8, 9]
  console.log(`删除后的数组: [${arrCopy}]`); // [0, 1, 2, 3, 4]
  
  // 负索引
  arrCopy = [...arr]; // 重新复制
  console.log(`arrCopy.splice(-3, 2): [${arrCopy.splice(-3, 2)}]`); // [7, 8]
  console.log(`使用负索引后的数组: [${arrCopy}]`); // [0, 1, 2, 3, 4, 5, 6, 9]
  
  // 总结
  console.log('\n数组切割方法总结:');
  console.log('1. slice(start, end)：不修改原数组，返回新数组，end不包含该位置');
  console.log('2. splice(start, deleteCount, ...items)：修改原数组，返回删除的元素');
  console.log('注意：slice的end参数不包含结束位置，而splice的第二个参数是删除的元素个数');
}

/**
 * 数组实用操作
 */

// 数组扁平化、去重、排序示例
function arrayUtilsDemo() {
  console.log('\n----------- 数组实用操作示例 -----------');
  
  // 嵌套数组
  const nestedArray = [[1, 2, 2], [3, 4, 5, 5], [6, 7, 8, 9, [11, 12, [12, 13, [14]]]], 10];
  console.log(`原始嵌套数组: ${JSON.stringify(nestedArray)}`);
  
  // 方法一：使用flat
  console.log('\n方法一：使用flat (需要Node.js 12+):');
  const flatArray1 = nestedArray.flat(4); // 展开4层嵌套
  console.log(`扁平化: ${JSON.stringify(flatArray1)}`);
  const uniqueArray1 = Array.from(new Set(flatArray1));
  console.log(`去重: ${JSON.stringify(uniqueArray1)}`);
  const sortedArray1 = uniqueArray1.sort((a, b) => a - b);
  console.log(`排序: ${JSON.stringify(sortedArray1)}`);
  
  // 方法二：使用some + concat (兼容旧版本)
  console.log('\n方法二：使用some + concat (兼容性更好):');
  
  function flattenArray(arr) {
    // 使用some和concat进行扁平化
    let result = [...arr];
    while (result.some(Array.isArray)) {
      result = [].concat(...result);
    }
    
    // 去重并排序
    return [...new Set(result)].sort((a, b) => a - b);
  }
  
  const processedArray = flattenArray(nestedArray);
  console.log(`扁平化+去重+排序结果: ${JSON.stringify(processedArray)}`);
}

/**
 * 数组分块操作（chunk）
 * 
 * 将数组分成指定大小的多个小数组
 * @param {Array} arr - 要分块的数组
 * @param {number} size - 每个块的大小
 * @return {Array} 分块后的二维数组
 */
function chunk(arr, size) {
  // 处理边界情况
  if (size <= 0) {
    return [arr];
  }
  
  const result = [];
  
  // 使用slice方法进行分块
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  
  return result;
}

// 数组分块示例
function chunkDemo() {
  console.log('\n----------- 数组分块示例 -----------');
  
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  console.log(`原始数组: [${numbers}]`);
  console.log(`分成大小为2的块: ${JSON.stringify(chunk(numbers, 2))}`);
  console.log(`分成大小为3的块: ${JSON.stringify(chunk(numbers, 3))}`);
  console.log(`分成大小为5的块: ${JSON.stringify(chunk(numbers, 5))}`);
  console.log(`分成大小为10的块: ${JSON.stringify(chunk(numbers, 10))}`);
  console.log(`分成大小为15的块: ${JSON.stringify(chunk(numbers, 15))}`);
}

// 字符串分割小数
function formatNumberWithCommas(s) {
  console.log('\n----------- 字符串分割小数示例 -----------');
  
  // 去除前导零
  s = s.replace(/^0+/, '');
  
  // 分割整数和小数部分
  let [leftStr, rightStr] = s.split('.');
  
  // 处理整数部分
  let resultArr = [];
  for (let i = leftStr.length - 1, m = 0; i >= 0; i--, m++) {
    if (m > 0 && m % 3 === 0) {
      resultArr.push(',');
    }
    resultArr.push(leftStr[i]);
  }
  
  // 反转整数部分并添加小数部分
  let result = resultArr.reverse().join('') + (rightStr ? `.${rightStr}` : '');
  return result;
}

// 字符串分割小数示例
function formatNumberDemo() {
  console.log(`格式化数字 "1294512.12412": "${formatNumberWithCommas("1294512.12412")}"`);
  console.log(`格式化数字 "0000123456789.99": "${formatNumberWithCommas("0000123456789.99")}"`);
  console.log(`格式化数字 "1000000": "${formatNumberWithCommas("1000000")}"`);
  console.log(`格式化数字 "0.123": "${formatNumberWithCommas("0.123")}"`);
}

// 运行所有示例
function runAllExamples() {
  stringSliceDemo();
  arraySliceDemo();
  arrayUtilsDemo();
  chunkDemo();
  formatNumberDemo();
  
  console.log('\n----------- 总结 -----------');
  console.log('1. 所有切割方法中的end参数都不包含该位置本身');
  console.log('2. slice方法对字符串和数组的工作方式类似，不修改原数据');
  console.log('3. splice方法是数组特有的，会修改原数组');
  console.log('4. 数组和字符串操作中，负索引表示从末尾开始计算的位置');
}

// 执行示例
runAllExamples(); 