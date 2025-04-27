/**
 * 数字格式化与分割
 * 
 * 本文件实现各种数字格式化方法，包括：
 * 1. 千分位分割
 * 2. 货币格式化
 * 3. 小数位控制
 * 4. 科学计数法转换
 * 5. 文件大小格式化
 */

/**
 * 使用正则表达式将数字按千分位分割
 * 
 * @param {number|string} num - 要格式化的数字或数字字符串
 * @return {string} - 千分位分割后的字符串
 */
function formatNumberWithCommasRegex(num) {
  // 将输入转为字符串
  let numStr = String(num);
  
  // 处理可能的负号
  const isNegative = numStr.startsWith('-');
  if (isNegative) {
    numStr = numStr.slice(1);
  }
  
  // 分离整数部分和小数部分
  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
  
  // 使用正则表达式在整数部分每三位数字前添加逗号
  // 正则解释: (?=(\d{3})+(?!\d)) 表示向前查找，后面紧跟着3的倍数个数字，且之后没有数字
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // 组合结果
  return (isNegative ? '-' : '') + formattedInteger + decimalPart;
}

/**
 * 手动实现将数字按千分位分割（不使用正则）
 * 
 * @param {number|string} num - 要格式化的数字或数字字符串
 * @return {string} - 千分位分割后的字符串
 */
function formatNumberWithCommasManual(num) {
  // 将输入转为字符串
  let numStr = String(num);
  
  // 处理可能的负号
  const isNegative = numStr.startsWith('-');
  if (isNegative) {
    numStr = numStr.slice(1);
  }
  
  // 分离整数部分和小数部分
  const parts = numStr.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
  
  // 从右向左每三位添加一个逗号
  let result = '';
  for (let i = integerPart.length - 1, count = 0; i >= 0; i--, count++) {
    // 每三位前添加一个逗号（但不包括最左边）
    if (count > 0 && count % 3 === 0) {
      result = ',' + result;
    }
    result = integerPart[i] + result;
  }
  
  // 组合结果
  return (isNegative ? '-' : '') + result + decimalPart;
}

/**
 * 使用Intl.NumberFormat进行千分位分割
 * 现代浏览器标准方法，支持国际化
 * 
 * @param {number} num - 要格式化的数字
 * @param {string} locale - 区域设置，默认为浏览器默认
 * @return {string} - 千分位分割后的字符串
 */
function formatNumberWithIntl(num, locale = undefined) {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * 货币格式化
 * 
 * @param {number} amount - 货币金额
 * @param {string} currencyCode - 货币代码，如 'CNY', 'USD'
 * @param {string} locale - 区域设置，如 'zh-CN', 'en-US'
 * @return {string} - 格式化后的货币字符串
 */
function formatCurrency(amount, currencyCode = 'CNY', locale = 'zh-CN') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

/**
 * 控制小数位数（四舍五入）
 * 
 * @param {number} num - 要格式化的数字
 * @param {number} decimals - 小数位数
 * @return {string} - 格式化后的数字字符串
 */
function formatDecimalPlaces(num, decimals = 2) {
  return num.toFixed(decimals);
}

/**
 * 控制小数位数（截断，不四舍五入）
 * 
 * @param {number} num - 要格式化的数字
 * @param {number} decimals - 小数位数
 * @return {string} - 格式化后的数字字符串
 */
function truncateDecimals(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return (Math.floor(num * factor) / factor).toFixed(decimals);
}

/**
 * 科学计数法格式化
 * 
 * @param {number} num - 要格式化的数字
 * @param {number} decimals - 小数位数
 * @return {string} - 科学计数法格式的字符串
 */
function formatScientificNotation(num, decimals = 2) {
  return num.toExponential(decimals);
}

/**
 * 将科学计数法转换为普通数字字符串
 * 
 * @param {string} sciNotation - 科学计数法表示的字符串
 * @return {string} - 普通数字字符串
 */
function scientificToDecimal(sciNotation) {
  // 匹配科学计数法格式，如 1.23e+4, 5.67e-8
  const match = sciNotation.match(/^(\d*\.?\d*)e([+-])(\d+)$/);
  if (!match) return sciNotation; // 不是科学计数法格式
  
  const [, coefficient, sign, exponent] = match;
  const exp = parseInt(exponent, 10);
  
  if (sign === '+') {
    // 正指数：小数点右移
    const parts = coefficient.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : '';
    
    if (exp >= decimalPart.length) {
      // 小数部分长度不够，需要补零
      return integerPart + decimalPart + '0'.repeat(exp - decimalPart.length);
    } else {
      // 将小数点插入到合适的位置
      return integerPart + decimalPart.slice(0, exp) + '.' + decimalPart.slice(exp);
    }
  } else {
    // 负指数：小数点左移
    const parts = coefficient.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : '';
    
    if (exp >= integerPart.length) {
      // 整数部分长度不够，需要在前面补零
      return '0.' + '0'.repeat(exp - integerPart.length) + integerPart + decimalPart;
    } else {
      // 将小数点插入到合适的位置
      return integerPart.slice(0, integerPart.length - exp) + '.' + 
             integerPart.slice(integerPart.length - exp) + decimalPart;
    }
  }
}

/**
 * 文件大小格式化
 * 
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @param {boolean} binary - 是否使用二进制(1024)而不是十进制(1000)进制
 * @return {string} - 格式化后的文件大小字符串
 */
function formatFileSize(bytes, decimals = 2, binary = true) {
  if (bytes === 0) return '0 Bytes';
  
  const base = binary ? 1024 : 1000;
  const units = binary 
    ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const exponent = Math.floor(Math.log(bytes) / Math.log(base));
  return parseFloat((bytes / Math.pow(base, exponent)).toFixed(decimals)) + ' ' + units[exponent];
}

/**
 * 数字缩写格式化（如将1200转为1.2k）
 * 
 * @param {number} num - 要格式化的数字
 * @param {number} decimals - 小数位数
 * @return {string} - 缩写格式的数字字符串
 */
function formatNumberAbbreviation(num, decimals = 1) {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum < 1000) {
    return sign + absNum;
  } else if (absNum < 1000000) {
    return sign + (absNum / 1000).toFixed(decimals) + 'k';
  } else if (absNum < 1000000000) {
    return sign + (absNum / 1000000).toFixed(decimals) + 'M';
  } else if (absNum < 1000000000000) {
    return sign + (absNum / 1000000000).toFixed(decimals) + 'B';
  } else {
    return sign + (absNum / 1000000000000).toFixed(decimals) + 'T';
  }
}

/**
 * 中文数字格式化（将数字转为中文表示）
 * 
 * @param {number} num - 要格式化的数字
 * @return {string} - 中文格式的数字字符串
 */
function formatNumberToChinese(num) {
  if (num === 0) return '零';
  
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const units = ['', '十', '百', '千', '万', '十万', '百万', '千万', '亿', '十亿', '百亿', '千亿'];
  
  const numStr = String(num);
  
  // 处理小于10000的情况
  if (num < 10000) {
    let result = '';
    let prevZero = false;
    
    for (let i = 0; i < numStr.length; i++) {
      const digit = parseInt(numStr[i]);
      const position = numStr.length - i - 1;
      
      if (digit === 0) {
        // 避免重复的零
        if (!prevZero) {
          result += digits[0];
          prevZero = true;
        }
      } else {
        result += digits[digit] + units[position];
        prevZero = false;
      }
    }
    
    // 特殊处理11-19的情况
    if (num >= 11 && num <= 19) {
      result = result.replace('一十', '十');
    }
    
    // 移除结尾的零
    return result.replace(/零+$/, '');
  }
  
  // 处理大于等于10000的情况
  if (num < 100000000) {
    // 拆分为万以上和万以下两部分
    const high = Math.floor(num / 10000);
    const low = num % 10000;
    
    let result = formatNumberToChinese(high) + '万';
    
    if (low > 0) {
      if (low < 1000) {
        result += '零' + formatNumberToChinese(low);
      } else {
        result += formatNumberToChinese(low);
      }
    }
    
    return result;
  }
  
  // 处理亿及以上的情况
  const high = Math.floor(num / 100000000);
  const low = num % 100000000;
  
  let result = formatNumberToChinese(high) + '亿';
  
  if (low > 0) {
    if (low < 10000000) {
      result += '零' + formatNumberToChinese(low);
    } else {
      result += formatNumberToChinese(low);
    }
  }
  
  return result;
}

// 测试函数
function testNumberFormatting() {
  console.log('\n----------- 数字格式化与分割测试 -----------');
  
  const testNum = 1234567.89;
  
  console.log(`原始数字: ${testNum}`);
  
  // 千分位分割测试
  console.log('\n千分位分割:');
  console.log(`使用正则表达式: ${formatNumberWithCommasRegex(testNum)}`);
  console.log(`手动实现: ${formatNumberWithCommasManual(testNum)}`);
  console.log(`使用Intl.NumberFormat: ${formatNumberWithIntl(testNum)}`);
  
  // 货币格式化测试
  console.log('\n货币格式化:');
  console.log(`人民币 (CNY): ${formatCurrency(testNum, 'CNY', 'zh-CN')}`);
  console.log(`美元 (USD): ${formatCurrency(testNum, 'USD', 'en-US')}`);
  console.log(`欧元 (EUR): ${formatCurrency(testNum, 'EUR', 'de-DE')}`);
  console.log(`日元 (JPY): ${formatCurrency(testNum, 'JPY', 'ja-JP')}`);
  
  // 小数控制测试
  console.log('\n小数位控制:');
  console.log(`四舍五入(2位): ${formatDecimalPlaces(testNum, 2)}`);
  console.log(`四舍五入(0位): ${formatDecimalPlaces(testNum, 0)}`);
  console.log(`截断(2位): ${truncateDecimals(testNum, 2)}`);
  console.log(`截断(0位): ${truncateDecimals(testNum, 0)}`);
  
  // 科学计数法测试
  console.log('\n科学计数法:');
  console.log(`格式化为科学计数法: ${formatScientificNotation(testNum, 2)}`);
  console.log(`科学计数法转普通数字: ${scientificToDecimal('1.23e+6')}`);
  console.log(`科学计数法转普通数字: ${scientificToDecimal('5.67e-4')}`);
  
  // 文件大小格式化测试
  console.log('\n文件大小格式化:');
  console.log(`1023 bytes: ${formatFileSize(1023)}`);
  console.log(`1024 bytes: ${formatFileSize(1024)}`);
  console.log(`1536 bytes: ${formatFileSize(1536)}`);
  console.log(`1048576 bytes: ${formatFileSize(1048576)}`);
  console.log(`1073741824 bytes: ${formatFileSize(1073741824)}`);
  
  // 数字缩写测试
  console.log('\n数字缩写:');
  console.log(`999: ${formatNumberAbbreviation(999)}`);
  console.log(`1000: ${formatNumberAbbreviation(1000)}`);
  console.log(`12345: ${formatNumberAbbreviation(12345)}`);
  console.log(`1234567: ${formatNumberAbbreviation(1234567)}`);
  console.log(`1234567890: ${formatNumberAbbreviation(1234567890)}`);
  
  // 中文数字格式化测试
  console.log('\n中文数字格式化:');
  console.log(`9: ${formatNumberToChinese(9)}`);
  console.log(`10: ${formatNumberToChinese(10)}`);
  console.log(`21: ${formatNumberToChinese(21)}`);
  console.log(`1001: ${formatNumberToChinese(1001)}`);
  console.log(`12345: ${formatNumberToChinese(12345)}`);
  console.log(`100200300: ${formatNumberToChinese(100200300)}`);
}

// 执行测试
testNumberFormatting();

// 总结
console.log('\n----------- 总结 -----------');
console.log('1. 千分位分割有多种实现方法：');
console.log('   - 正则表达式方法简洁但需要理解正则');
console.log('   - 手动实现方法直观但代码较长');
console.log('   - Intl.NumberFormat是现代浏览器标准方法，支持国际化');
console.log('2. 数字格式化应考虑：');
console.log('   - 正负号处理');
console.log('   - 小数部分处理');
console.log('   - 零值处理');
console.log('   - 边界情况处理');
console.log('3. 科学计数法转换需要考虑正负指数不同情况');
console.log('4. 文件大小格式化需要根据需求选择二进制或十进制进制'); 