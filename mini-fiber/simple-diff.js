/**
 * 50行代码实现React Diff算法核心原理
 */

// 创建虚拟DOM元素
function createElement(type, props = {}, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => 
        typeof child === 'object' ? child : { type: 'TEXT', props: { nodeValue: child } }
      )
    }
  };
}

// 核心Diff算法
function diff(dom, oldVNode, newVNode, parentDom = dom.parentNode) {
  // 情况1: 新节点不存在，删除旧节点
  if (!newVNode && oldVNode) {
    return dom.remove();
  }
  
  // 情况2: 旧节点不存在，创建新节点
  if (newVNode && !oldVNode) {
    const newDom = createDom(newVNode);
    return parentDom.appendChild(newDom);
  }
  
  // 情况3: 节点类型改变，替换节点
  if (oldVNode.type !== newVNode.type) {
    const newDom = createDom(newVNode);
    return parentDom.replaceChild(newDom, dom);
  }
  
  // 情况4: 文本节点内容变化
  if (newVNode.type === 'TEXT') {
    if (oldVNode.props.nodeValue !== newVNode.props.nodeValue) {
      dom.nodeValue = newVNode.props.nodeValue;
    }
    return dom;
  }
  
  // 情况5: 相同类型节点，更新属性
  updateProps(dom, oldVNode.props, newVNode.props);
  
  // 对比子节点
  const oldChildren = [].concat(oldVNode.props.children || []);
  const newChildren = [].concat(newVNode.props.children || []);
  
  // 处理子节点（简化版，无key优化）
  const maxLength = Math.max(oldChildren.length, newChildren.length);
  for (let i = 0; i < maxLength; i++) {
    diff(
      dom.childNodes[i] || null,
      oldChildren[i] || null,
      newChildren[i] || null,
      dom
    );
  }
  
  return dom;
}

// 创建DOM元素
function createDom(vNode) {
  const dom = vNode.type === 'TEXT'
    ? document.createTextNode(vNode.props.nodeValue)
    : document.createElement(vNode.type);
  
  updateProps(dom, {}, vNode.props);
  
  (vNode.props.children || []).forEach(child => {
    dom.appendChild(createDom(child));
  });
  
  return dom;
}

// 更新DOM属性
function updateProps(dom, oldProps, newProps) {
  // 移除旧属性
  Object.keys(oldProps).forEach(name => {
    if (name !== 'children' && !(name in newProps)) dom[name] = '';
  });
  
  // 设置新属性
  Object.keys(newProps).forEach(name => {
    if (name !== 'children' && oldProps[name] !== newProps[name]) {
      dom[name] = newProps[name];
    }
  });
}

// 渲染函数
function render(vNode, container) {
  diff(container.firstChild, container._vNode || null, vNode, container);
  container._vNode = vNode;
}

// 暴露API
window.MiniReact = { createElement, render }; 