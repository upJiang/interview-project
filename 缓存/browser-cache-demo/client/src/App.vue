<template>
  <div class="container">
    <header>
      <h1>浏览器缓存策略演示</h1>
      <p>本应用展示了不同的浏览器缓存策略及其工作原理</p>
    </header>
    
    <nav class="nav">
      <router-link to="/" class="nav-link">主页</router-link>
      <router-link to="/strong-cache" class="nav-link">强缓存</router-link>
      <router-link to="/negotiated-cache" class="nav-link">协商缓存</router-link>
      <router-link to="/cache-control" class="nav-link">Cache-Control</router-link>
      <router-link to="/image-cache" class="nav-link">图像缓存</router-link>
      <router-link to="/comparison" class="nav-link">对比分析</router-link>
    </nav>
    
    <main>
      <router-view />
    </main>
    
    <footer>
      <p>浏览器缓存学习项目 © {{ new Date().getFullYear() }}</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
header {
  margin-bottom: 30px;
}

header h1 {
  color: var(--color-primary);
  margin-bottom: 10px;
}

footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  text-align: center;
  color: #777;
}
</style> 