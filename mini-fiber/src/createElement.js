/**
 * createElement函数
 * 
 * 类似于React.createElement，用于创建虚拟DOM元素
 * 将JSX转换为虚拟DOM对象，也就是React元素
 */

// 确保全局命名空间存在
window.MiniFiber = window.MiniFiber || {};

/**
 * 创建虚拟DOM元素
 * @param {string|function} type - 元素类型，如'div', 'span'等或组件函数
 * @param {object} config - 元素的属性配置
 * @param {*} children - 子元素
 * @returns {object} - 返回虚拟DOM对象(React元素)
 */
MiniFiber.createElement = function(type, config, ...children) {
  // 提取key和ref，这些是特殊属性
  let key = null;
  let ref = null;
  const props = {};
  
  if (config) {
    // 如果存在config，提取key和ref
    if (config.key !== undefined) {
      key = '' + config.key;
    }
    
    if (config.ref !== undefined) {
      ref = config.ref;
    }
    
    // 复制config中的属性到props中，除了key和ref
    for (let propName in config) {
      if (propName !== 'key' && propName !== 'ref') {
        props[propName] = config[propName];
      }
    }
  }
  
  // 处理children，将其添加到props.children中
  if (children.length > 0) {
    // 如果只有一个子元素，直接赋值给props.children
    // 否则，将children数组赋值给props.children
    props.children = children.length === 1 ? children[0] : children;
  }
  
  // 返回ReactElement
  return {
    $$typeof: Symbol.for('react.element'), // 标识这是一个React元素
    type,                                  // 元素类型
    key,                                   // 唯一标识
    ref,                                   // 引用
    props,                                 // 属性
  };
};