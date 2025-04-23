// 用于存储副作用函数的全局变量
let activeEffect = null;
// 用于存储响应式对象和其对应的依赖映射关系
const targetMap = new WeakMap();

/**
 * 追踪依赖，将当前激活的副作用函数与目标对象的属性关联起来
 * @param {Object} target - 目标对象
 * @param {string|symbol} key - 属性名
 */
function track(target, key) {
  if (!activeEffect) return;
  
  // 获取target对应的依赖图
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  
  // 获取key对应的依赖集合
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  
  // 添加依赖
  deps.add(activeEffect);
}

/**
 * 触发更新，执行与目标对象属性相关的所有副作用函数
 * @param {Object} target - 目标对象
 * @param {string|symbol} key - 属性名
 */
function trigger(target, key) {
  // 获取target对应的依赖图
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  
  // 获取key对应的依赖集合
  const deps = depsMap.get(key);
  if (!deps) return;
  
  // 执行所有副作用函数
  deps.forEach(effect => effect());
}

/**
 * 注册副作用函数
 * @param {Function} fn - 副作用函数
 * @returns {Function} - 用于清除副作用的函数
 */
function effect(fn) {
  const run = () => {
    activeEffect = run;
    return fn();
  };
  
  // 立即执行一次副作用函数来收集依赖
  run();
  
  // 返回清理函数
  return () => {
    activeEffect = null;
  };
}

/**
 * 创建响应式对象
 * @param {Object} target - 目标对象
 * @returns {Proxy} - 代理后的响应式对象
 */
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      
      // 追踪依赖
      track(target, key);
      
      return result;
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      
      // 触发更新
      trigger(target, key);
      
      return result;
    }
  });
}

/**
 * 创建一个ref，包装基本类型值使其成为响应式
 * @param {any} value - 初始值
 * @returns {Object} - 包含value属性的响应式对象
 */
function ref(value) {
  const refObject = {
    get value() {
      track(refObject, 'value');
      return value;
    },
    set value(newValue) {
      value = newValue;
      trigger(refObject, 'value');
    }
  };
  
  return refObject;
}

/**
 * 计算属性，基于getter函数创建只读的响应式数据
 * @param {Function} getter - 计算属性的getter函数
 * @returns {Object} - 只读的响应式对象
 */
function computed(getter) {
  // 缓存计算结果
  let value;
  // 标记是否需要重新计算
  let dirty = true;
  
  // 当依赖变化时，将dirty设为true
  const runner = effect(() => {
    dirty = true;
  });
  
  return {
    get value() {
      // 如果dirty为true，重新计算
      if (dirty) {
        value = getter();
        dirty = false;
      }
      return value;
    }
  };
}

export {
  effect,
  track,
  trigger,
  reactive,
  ref,
  computed
}; 