// vite.config.js
import myPlugin from './vite-plugin-example';

export default {
  // 基本公共路径
  base: '/',
  
  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  
  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    
    // Rollup 打包配置
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['lodash-es']
        }
      }
    }
  },
  
  // 插件配置
  plugins: [
    myPlugin({ prefix: 'Vite Demo' })
  ]
} 