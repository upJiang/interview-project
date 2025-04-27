/**
 * Vue集成插件
 * 用于在Vue应用中集成MiniSentry
 */

import { captureException, setExtra } from '../index';

/**
 * 获取Vue组件名称
 * @param {Vue} vm Vue实例
 * @returns {string} 组件名称
 */
function getComponentName(vm) {
  if (!vm) return 'Anonymous Component';
  
  if (vm.$root === vm) {
    return 'Root';
  }
  
  // Vue 2.x
  if (vm.$options && vm.$options.name) {
    return vm.$options.name;
  }
  
  if (vm.$options && vm.$options._componentTag) {
    return vm.$options._componentTag;
  }
  
  // Vue 3.x
  if (vm.type && vm.type.name) {
    return vm.type.name;
  }
  
  if (vm._.uid) {
    return `Component<${vm._.uid}>`;
  }
  
  return 'Anonymous Component';
}

/**
 * 创建Vue错误处理器
 * @param {Object} options 选项
 * @returns {Function} Vue错误处理器
 */
function createVueErrorHandler(options = {}) {
  return function vueErrorHandler(error, vm, info) {
    try {
      // 收集组件信息
      const componentInfo = {};
      
      if (vm) {
        componentInfo.name = getComponentName(vm);
        componentInfo.props = vm.$props || {};
        componentInfo.lifecycleHook = info;
        
        // 尝试获取组件路径
        if (vm.$route) {
          componentInfo.route = {
            name: vm.$route.name,
            path: vm.$route.path,
            query: vm.$route.query,
            params: vm.$route.params
          };
        }
      }
      
      // 设置错误上下文
      const errorContext = {
        vue: true,
        component: componentInfo.name,
        props: JSON.stringify(componentInfo.props),
        lifecycleHook: info,
        ...(options.attachProps ? { componentInfo } : {})
      };
      
      // 上报错误
      captureException(error, { 
        tags: { framework: 'vue' }, 
        extra: errorContext 
      });
    } catch (e) {
      console.error('[MiniSentry] Vue错误处理器异常:', e);
    }
    
    // 调用原始错误处理器
    if (typeof options.originalErrorHandler === 'function') {
      options.originalErrorHandler.call(null, error, vm, info);
    }
  };
}

/**
 * Vue应用跟踪插件
 * @param {Vue} Vue Vue构造函数
 * @param {Object} options 插件选项
 */
export function vuePlugin(Vue, options = {}) {
  // 如果Vue已经被instrumented，返回
  if (Vue.prototype && Vue.prototype.__mini_sentry_instrumented__) {
    return;
  }
  
  const opts = {
    attachProps: true,
    logErrors: true, // 是否在控制台输出错误
    Vue,
    ...options
  };
  
  // 保存原始错误处理器
  const originalErrorHandler = Vue.config.errorHandler;
  opts.originalErrorHandler = originalErrorHandler;
  
  // 设置Vue错误处理器
  Vue.config.errorHandler = createVueErrorHandler(opts);
  
  // 标记已instrumented
  if (Vue.prototype) {
    Vue.prototype.__mini_sentry_instrumented__ = true;
  }
  
  // 钩入Vue Router(如果存在)
  if (opts.router) {
    const router = opts.router;
    
    // 记录路由变化
    router.beforeEach((to, from, next) => {
      // 添加路由信息
      setExtra('vue:route', {
        from: from.path,
        to: to.path,
        name: to.name
      });
      
      next();
    });
  }
  
  // Vue 2.x兼容模式
  if (Vue.version && Vue.version.startsWith('2.')) {
    // 使用mixin跟踪组件生命周期钩子
    Vue.mixin({
      beforeCreate() {
        this.$__mini_sentry_id__ = this._uid || (Math.random() * 1000000).toFixed(0);
      }
    });
  }
  
  // Vue 3.x兼容
  if (Vue.version && Vue.version.startsWith('3.')) {
    // Vue 3需要app.use()形式安装插件
    return {
      install(app) {
        const originalErrorHandler = app.config.errorHandler;
        opts.originalErrorHandler = originalErrorHandler;
        
        app.config.errorHandler = createVueErrorHandler(opts);
        
        // 标记已instrumented
        app.provide('__mini_sentry_instrumented__', true);
      }
    };
  }
}

// 导出插件
export default vuePlugin; 