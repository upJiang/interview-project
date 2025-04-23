// vite-plugin-example.js
export default function myPlugin(options = {}) {
  const { prefix = 'PREFIX' } = options;
  
  return {
    // 插件名称
    name: 'vite-plugin-example',
    
    // Vite特有钩子
    configureServer(server) {
      // 配置开发服务器
      server.middlewares.use((req, res, next) => {
        // 自定义中间件
        console.log(`${prefix}: ${req.url}`);
        next();
      });
    },
    
    // Rollup钩子 - 构建开始
    buildStart() {
      console.log(`${prefix}: Build starting...`);
    },
    
    // Rollup钩子 - 解析模块ID
    resolveId(source) {
      // 自定义模块解析逻辑
      if (source === 'virtual-module') {
        return source;
      }
      return null; // 继续正常解析
    },
    
    // Rollup钩子 - 加载模块
    load(id) {
      // 为虚拟模块提供内容
      if (id === 'virtual-module') {
        return 'export default "This is a virtual module"';
      }
      return null; // 其他模块正常加载
    },
    
    // Rollup钩子 - 转换代码
    transform(code, id) {
      // 代码转换
      if (id.includes('.js') && !id.includes('node_modules')) {
        // 对JavaScript代码进行转换
        return {
          code: `/* ${prefix} */\n${code}`,
          map: null // 可以返回source map
        };
      }
      return null;
    },
    
    // Rollup钩子 - 构建结束
    buildEnd() {
      console.log(`${prefix}: Build ended`);
    },
    
    // Vite特有钩子 - 处理HTML
    transformIndexHtml(html) {
      // 转换HTML内容
      return html.replace(
        /<title>(.*?)<\/title>/,
        `<title>${prefix} - $1</title>`
      );
    }
  };
} 