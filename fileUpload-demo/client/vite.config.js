import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    strictPort: true, // 严格使用3000端口，如果被占用则启动失败
    proxy: {
      "/api": {
        target: "http://localhost:3001", // 固定后端端口为3001
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        configure: (proxy, options) => {
          // 添加代理配置以记录请求和响应
          proxy.on("error", (err, req, res) => {
            console.error("代理请求错误:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log("代理请求:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            console.log("代理响应:", proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
});
