/**
 * 经典排序算法实现
 * 
 * 本文件包含以下排序算法：
 * 1. 冒泡排序
 * 2. 选择排序
 * 3. 插入排序
 * 4. 快速排序
 * 5. 归并排序
 * 6. 堆排序
 * 
 * 每种算法均包含详细注释、时间复杂度和空间复杂度分析，以及性能对比。
 */

/**
 * 1. 冒泡排序
 * 
 * 思路：
 * 1. 比较相邻的元素，如果前一个比后一个大，则交换它们
 * 2. 对每一对相邻元素执行相同操作，从开始第一对到结尾的最后一对
 * 3. 每轮结束后，最大的元素会"冒泡"到数组末尾
 * 4. 重复以上步骤，直到没有任何一对元素需要比较
 * 
 * 优化点：
 * 1. 如果某一轮没有发生交换，说明数组已经有序，可提前退出
 * 2. 记录最后一次交换的位置，下一轮只需比较到该位置
 * 
 * 时间复杂度：
 * - 最好情况：O(n)，数组已经有序
 * - 最坏情况：O(n²)，数组完全逆序
 * - 平均情况：O(n²)
 * 
 * 空间复杂度：O(1)
 * 
 * 稳定性：稳定（相等元素的相对位置不会改变）
 * 
 * @param {number[]} arr - 待排序数组
 * @return {number[]} 排序后的数组
 */
function bubbleSort(arr) {
  const len = arr.length;
  
  // 外层循环：需要进行len-1轮冒泡
  for (let i = 0; i < len - 1; i++) {
    // 优化标志：标记本轮是否发生交换
    let swapped = false;
    
    // 内层循环：将当前最大元素冒泡到末尾
    // 注意j的范围：每轮冒泡后，尾部的i个元素已经排好序
    for (let j = 0; j < len - i - 1; j++) {
      // 如果前一个元素大于后一个元素，交换它们
      if (arr[j] > arr[j + 1]) {
        // ES6解构赋值进行交换
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    
    // 如果本轮没有发生交换，说明数组已经有序，提前退出
    if (!swapped) break;
  }
  
  return arr;
}

/**
 * 2. 选择排序
 * 
 * 思路：
 * 1. 将数组分为已排序区和未排序区
 * 2. 每次从未排序区找出最小的元素，放到已排序区的末尾
 * 3. 重复步骤2，直到所有元素排序完成
 * 
 * 时间复杂度：
 * - 最好情况：O(n²)
 * - 最坏情况：O(n²)
 * - 平均情况：O(n²)
 * 
 * 空间复杂度：O(1)
 * 
 * 稳定性：不稳定（相等元素的相对位置可能改变）
 * 
 * @param {number[]} arr - 待排序数组
 * @return {number[]} 排序后的数组
 */
function selectionSort(arr) {
  const len = arr.length;
  
  // 外层循环：已排序区的边界
  for (let i = 0; i < len - 1; i++) {
    // 假设当前位置i是未排序区最小值的位置
    let minIndex = i;
    
    // 内层循环：找出未排序区中的最小值
    for (let j = i + 1; j < len; j++) {
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }
    
    // 如果最小值不是当前位置，交换元素
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
    }
  }
  
  return arr;
}

/**
 * 3. 插入排序
 * 
 * 思路：
 * 1. 将数组分为已排序区和未排序区
 * 2. 初始时，已排序区只有一个元素，即数组的第一个元素
 * 3. 每次取未排序区的第一个元素，插入到已排序区的正确位置
 * 4. 重复步骤3，直到所有元素排序完成
 * 
 * 时间复杂度：
 * - 最好情况：O(n)，数组已经有序
 * - 最坏情况：O(n²)，数组完全逆序
 * - 平均情况：O(n²)
 * 
 * 空间复杂度：O(1)
 * 
 * 稳定性：稳定（相等元素的相对位置不会改变）
 * 
 * @param {number[]} arr - 待排序数组
 * @return {number[]} 排序后的数组
 */
function insertionSort(arr) {
  const len = arr.length;
  
  // 外层循环：未排序区的第一个元素
  for (let i = 1; i < len; i++) {
    // 保存当前待插入的元素
    const current = arr[i];
    
    // 内层循环：在已排序区找到正确的插入位置
    let j = i - 1;
    while (j >= 0 && arr[j] > current) {
      // 将大于current的元素向右移动一位
      arr[j + 1] = arr[j];
      j--;
    }
    
    // 插入到正确位置
    arr[j + 1] = current;
  }
  
  return arr;
}

/**
 * 4. 快速排序
 * 
 * 思路：
 * 1. 选择一个基准元素（pivot）
 * 2. 将数组分区：小于基准的元素放左边，大于基准的元素放右边
 * 3. 递归对左右两个子数组进行快速排序
 * 
 * 时间复杂度：
 * - 最好情况：O(n log n)，每次划分均匀
 * - 最坏情况：O(n²)，每次划分极不均匀（如已排序数组）
 * - 平均情况：O(n log n)
 * 
 * 空间复杂度：
 * - 最好情况：O(log n)，递归调用栈的深度
 * - 最坏情况：O(n)
 * 
 * 稳定性：不稳定（相等元素的相对位置可能改变）
 * 
 * @param {number[]} arr - 待排序数组
 * @return {number[]} 排序后的数组
 */
function quickSort(arr) {
  // 基础情况：数组长度小于等于1，已经有序
  if (arr.length <= 1) {
    return arr;
  }
  
  // 选择基准（这里简单选择中间元素）
  const pivotIndex = Math.floor(arr.length / 2);
  const pivot = arr[pivotIndex];
  
  // 分区
  const left = [];    // 存放小于基准的元素
  const middle = [];  // 存放等于基准的元素
  const right = [];   // 存放大于基准的元素
  
  // 遍历数组，进行分区
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < pivot) {
      left.push(arr[i]);
    } else if (arr[i] > pivot) {
      right.push(arr[i]);
    } else {
      middle.push(arr[i]);
    }
  }
  
  // 递归对左右子数组进行快速排序，并合并结果
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

/**
 * 快速排序（原地分区版本）
 * 
 * 思路：
 * 与上面的实现相同，但不创建新数组，而是在原数组上进行分区操作
 * 
 * @param {number[]} arr - 待排序数组
 * @param {number} left - 子数组的左边界（默认为0）
 * @param {number} right - 子数组的右边界（默认为数组长度-1）
 * @return {number[]} 排序后的数组
 */
function quickSortInPlace(arr, left = 0, right = arr.length - 1) {
  // 基础情况：子数组长度小于等于1
  if (left >= right) {
    return arr;
  }
  
  // 分区，返回基准元素的新索引
  const pivotIndex = partition(arr, left, right);
  
  // 递归对左右子数组进行快速排序
  quickSortInPlace(arr, left, pivotIndex - 1);
  quickSortInPlace(arr, pivotIndex + 1, right);
  
  return arr;
}

/**
 * 分区函数：将子数组分为小于和大于基准的两部分
 * 
 * @param {number[]} arr - 待分区数组
 * @param {number} left - 子数组的左边界
 * @param {number} right - 子数组的右边界
 * @return {number} 基准元素的新索引
 */
function partition(arr, left, right) {
  // 选择最右边的元素作为基准
  const pivot = arr[right];
  
  // i是小于基准区域的右边界
  let i = left - 1;
  
  // 遍历子数组，将小于基准的元素放到左边
  for (let j = left; j < right; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  // 将基准元素放到正确的位置
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  
  // 返回基准元素的新索引
  return i + 1;
}

/**
 * 5. 归并排序
 * 
 * 思路：
 * 1. 将数组分成两半，递归地对它们进行排序
 * 2. 将两个已排序的子数组合并成一个已排序数组
 * 
 * 时间复杂度：
 * - 最好情况：O(n log n)
 * - 最坏情况：O(n log n)
 * - 平均情况：O(n log n)
 * 
 * 空间复杂度：O(n)，需要额外的空间来存储合并结果
 * 
 * 稳定性：稳定（相等元素的相对位置不会改变）
 * 
 * @param {number[]} arr - 待排序数组
 * @return {number[]} 排序后的数组
 */
function mergeSort(arr) {
  // 基础情况：数组长度小于等于1，已经有序
  if (arr.length <= 1) {
    return arr;
  }
  
  // 分割数组
  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);
  
  // 递归排序并合并
  return merge(mergeSort(left), mergeSort(right));
}

/**
 * 合并两个已排序的数组
 * 
 * @param {number[]} left - 左子数组
 * @param {number[]} right - 右子数组
 * @return {number[]} 合并后的有序数组
 */
function merge(left, right) {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;
  
  // 比较两个数组的元素，将较小的添加到结果数组
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] < right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }
  
  // 添加剩余的元素
  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

/**
 * 6. 堆排序
 * 
 * 思路：
 * 1. 将数组构建成最大堆
 * 2. 交换堆顶元素（最大值）和堆的最后一个元素
 * 3. 将堆的大小减1，并维护最大堆性质
 * 4. 重复步骤2和3，直到堆的大小为1
 * 
 * 时间复杂度：
 * - 最好情况：O(n log n)
 * - 最坏情况：O(n log n)
 * - 平均情况：O(n log n)
 * 
 * 空间复杂度：O(1)，原地排序
 * 
 * 稳定性：不稳定（相等元素的相对位置可能改变）
 * 
 * @param {number[]} arr - 待排序数组
 * @return {number[]} 排序后的数组
 */
function heapSort(arr) {
  const len = arr.length;
  
  // 构建最大堆
  for (let i = Math.floor(len / 2) - 1; i >= 0; i--) {
    heapify(arr, len, i);
  }
  
  // 一个个交换元素
  for (let i = len - 1; i > 0; i--) {
    // 将堆顶元素（最大值）与堆的最后一个元素交换
    [arr[0], arr[i]] = [arr[i], arr[0]];
    
    // 在减小的堆上重新维护最大堆性质
    heapify(arr, i, 0);
  }
  
  return arr;
}

/**
 * 维护最大堆性质
 * 
 * @param {number[]} arr - 数组
 * @param {number} n - 堆的大小
 * @param {number} i - 当前节点的索引
 */
function heapify(arr, n, i) {
  // 初始化最大值为当前节点
  let largest = i;
  const left = 2 * i + 1;  // 左子节点
  const right = 2 * i + 2; // 右子节点
  
  // 如果左子节点大于最大值，更新最大值
  if (left < n && arr[left] > arr[largest]) {
    largest = left;
  }
  
  // 如果右子节点大于最大值，更新最大值
  if (right < n && arr[right] > arr[largest]) {
    largest = right;
  }
  
  // 如果最大值不是当前节点，交换节点并继续维护堆性质
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}

/**
 * 生成测试数组
 * 
 * @param {number} size - 数组大小
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @return {number[]} 生成的随机数组
 */
function generateTestArray(size, min = 0, max = 1000) {
  return Array.from({ length: size }, () => 
    Math.floor(Math.random() * (max - min + 1)) + min
  );
}

/**
 * 检查数组是否已排序
 * 
 * @param {number[]} arr - 待检查数组
 * @return {boolean} 数组是否已排序
 */
function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) {
      return false;
    }
  }
  return true;
}

/**
 * 排序算法性能测试
 * 
 * @param {Function} sortFn - 排序函数
 * @param {number[]} arr - 测试数组
 * @param {string} name - 算法名称
 */
function testSortingAlgorithm(sortFn, arr, name) {
  console.log(`测试 ${name}...`);
  
  // 复制数组，避免修改原数组
  const arrCopy = [...arr];
  
  // 记录开始时间
  const startTime = performance.now();
  
  // 执行排序
  const sortedArr = sortFn(arrCopy);
  
  // 记录结束时间
  const endTime = performance.now();
  
  // 计算耗时
  const timeUsed = endTime - startTime;
  
  // 验证排序结果
  const sorted = isSorted(sortedArr);
  
  console.log(`${name} ${sorted ? '成功' : '失败'}`);
  console.log(`耗时: ${timeUsed.toFixed(2)}ms`);
  console.log('--------------------------');
  
  return timeUsed;
}

// 执行排序测试
function runSortingTests() {
  // 生成测试数组
  const smallArray = generateTestArray(100);
  const mediumArray = generateTestArray(1000);
  const largeArray = generateTestArray(10000);
  
  console.log('小型数组测试 (100个元素):');
  console.log('--------------------------');
  testSortingAlgorithm(bubbleSort, smallArray, '冒泡排序');
  testSortingAlgorithm(selectionSort, smallArray, '选择排序');
  testSortingAlgorithm(insertionSort, smallArray, '插入排序');
  testSortingAlgorithm(quickSort, smallArray, '快速排序');
  testSortingAlgorithm(quickSortInPlace, smallArray, '原地快速排序');
  testSortingAlgorithm(mergeSort, smallArray, '归并排序');
  testSortingAlgorithm(heapSort, smallArray, '堆排序');
  
  console.log('\n中型数组测试 (1000个元素):');
  console.log('--------------------------');
  testSortingAlgorithm(bubbleSort, mediumArray, '冒泡排序');
  testSortingAlgorithm(selectionSort, mediumArray, '选择排序');
  testSortingAlgorithm(insertionSort, mediumArray, '插入排序');
  testSortingAlgorithm(quickSort, mediumArray, '快速排序');
  testSortingAlgorithm(quickSortInPlace, mediumArray, '原地快速排序');
  testSortingAlgorithm(mergeSort, mediumArray, '归并排序');
  testSortingAlgorithm(heapSort, mediumArray, '堆排序');
  
  console.log('\n大型数组测试 (10000个元素):');
  console.log('--------------------------');
  // 对于大型数组，冒泡排序、选择排序和插入排序会非常慢，可以跳过
  console.log('冒泡排序 - 跳过（效率太低）');
  console.log('选择排序 - 跳过（效率太低）');
  console.log('插入排序 - 跳过（效率太低）');
  testSortingAlgorithm(quickSort, largeArray, '快速排序');
  testSortingAlgorithm(quickSortInPlace, largeArray, '原地快速排序');
  testSortingAlgorithm(mergeSort, largeArray, '归并排序');
  testSortingAlgorithm(heapSort, largeArray, '堆排序');
}

// 运行测试
runSortingTests();

/**
 * 不同排序算法的特点总结：
 * 
 * 1. 冒泡排序:
 *    - 简单易实现
 *    - 对小数据集效率尚可
 *    - 对大数据集效率很低
 *    - 稳定排序，保持相等元素的相对顺序
 * 
 * 2. 选择排序:
 *    - 实现简单
 *    - 交换次数少于冒泡排序
 *    - 时间复杂度总是O(n²)，无论输入如何
 *    - 不稳定排序
 * 
 * 3. 插入排序:
 *    - 对部分有序的数据效率高
 *    - 对小数据集效率高
 *    - 稳定排序
 *    - 通常用作其他排序算法的子例程
 * 
 * 4. 快速排序:
 *    - 平均性能最好的比较排序算法
 *    - 空间效率高（特别是原地分区版本）
 *    - 不稳定排序
 *    - 对于特定输入（如已排序数组）可能退化为O(n²)
 * 
 * 5. 归并排序:
 *    - 稳定且可靠的O(n log n)性能
 *    - 需要额外的空间
 *    - 稳定排序
 *    - 适合外部排序
 * 
 * 6. 堆排序:
 *    - 最坏情况下也是O(n log n)
 *    - 原地排序，空间复杂度O(1)
 *    - 不稳定排序
 *    - 通常比快速排序和归并排序慢
 * 
 * 排序算法选择建议:
 * - 小数据集或部分有序数据: 插入排序
 * - 要求稳定性且内存充足: 归并排序
 * - 平均情况下最快: 快速排序
 * - 最坏情况性能要求严格: 堆排序
 * - 内存有限且不要求稳定性: 堆排序
 */ 