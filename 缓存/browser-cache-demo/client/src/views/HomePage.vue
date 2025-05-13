<template>
  <div>
    <div class="card">
      <div class="card-title">浏览器缓存学习与实践</div>
      <div class="card-content">
        <p>本应用演示了不同的浏览器缓存策略及其工作原理，通过实际示例帮助理解缓存机制。</p>
        
        <h3>什么是浏览器缓存？</h3>
        <p>浏览器缓存是浏览器将资源（如HTML页面、JS、CSS、图像等）存储在本地的机制，目的是减少网络请求，提高页面加载速度，降低服务器负载。</p>
        
        <h3>主要缓存类型</h3>
        <div class="cache-types">
          <div class="cache-type">
            <h4>强缓存 (Strong Cache)</h4>
            <p>不需要发送请求到服务器，直接从浏览器缓存中获取资源。通过 <code>Cache-Control</code> 和 <code>Expires</code> 头控制。</p>
            <router-link to="/strong-cache" class="btn btn-primary">查看强缓存示例</router-link>
          </div>
          
          <div class="cache-type">
            <h4>协商缓存 (Negotiated Cache)</h4>
            <p>浏览器需要向服务器发送请求验证资源是否过期，如未过期则返回304状态码。通过 <code>ETag</code> 和 <code>Last-Modified</code> 头控制。</p>
            <router-link to="/negotiated-cache" class="btn btn-primary">查看协商缓存示例</router-link>
          </div>
        </div>
        
        <h3>浏览器缓存过程</h3>
        <ol class="cache-process">
          <li>浏览器发起HTTP请求</li>
          <li>检查强缓存是否可用 (Expires, Cache-Control)</li>
          <li>如果强缓存可用，直接使用缓存资源</li>
          <li>如果强缓存已过期，发送请求到服务器进行协商缓存验证 (ETag, Last-Modified)</li>
          <li>如果协商缓存验证资源未修改，服务器返回304状态码，浏览器使用本地缓存</li>
          <li>如果资源已修改，服务器返回200状态码和新资源</li>
        </ol>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">应用功能</div>
      <div class="card-content">
        <div class="features">
          <div class="feature">
            <h4>强缓存演示</h4>
            <p>通过实例展示Cache-Control和Expires头的使用和效果。</p>
            <router-link to="/strong-cache" class="btn btn-secondary">查看</router-link>
          </div>
          
          <div class="feature">
            <h4>协商缓存演示</h4>
            <p>演示ETag和Last-Modified的工作原理和应用场景。</p>
            <router-link to="/negotiated-cache" class="btn btn-secondary">查看</router-link>
          </div>
          
          <div class="feature">
            <h4>Cache-Control详解</h4>
            <p>探索Cache-Control头的各种指令及其效果。</p>
            <router-link to="/cache-control" class="btn btn-secondary">查看</router-link>
          </div>
          
          <div class="feature">
            <h4>图像缓存策略</h4>
            <p>演示不同资源类型的缓存策略应用。</p>
            <router-link to="/image-cache" class="btn btn-secondary">查看</router-link>
          </div>
          
          <div class="feature">
            <h4>性能对比分析</h4>
            <p>不同缓存策略的性能比较和应用场景分析。</p>
            <router-link to="/comparison" class="btn btn-secondary">查看</router-link>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">使用说明</div>
      <div class="card-content">
        <p>本应用需要与后端服务器配合使用，确保后端服务器已启动并运行在 <code>http://localhost:3000</code>。</p>
        
        <div class="alert alert-info">
          <strong>提示：</strong> 可以使用浏览器开发者工具的"Network"标签查看请求详情，观察缓存状态和HTTP头信息。
        </div>
        
        <div class="tips">
          <h4>调试技巧</h4>
          <ul>
            <li>使用Chrome开发者工具中的"Network"标签，勾选"Disable cache"可以临时禁用浏览器缓存</li>
            <li>鼠标右键点击刷新按钮，选择"清空缓存并硬性重新加载"可以强制刷新页面并清除缓存</li>
            <li>在"Network"标签中，"Size"列显示"(from disk cache)"或"(from memory cache)"表示使用了缓存</li>
            <li>观察请求的"Status"列，200表示从服务器获取资源，304表示协商缓存验证后使用本地缓存</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage'
}
</script>

<style scoped>
.cache-types {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}

.cache-type {
  flex: 1;
  padding: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.cache-type h4 {
  color: var(--color-primary);
  margin-bottom: 10px;
}

.cache-type .btn {
  margin-top: 10px;
}

.cache-process {
  margin: 20px 0;
  padding-left: 20px;
}

.cache-process li {
  margin-bottom: 8px;
}

code {
  background-color: #f1f1f1;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.feature {
  padding: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.feature h4 {
  color: var(--color-primary);
  margin-bottom: 10px;
}

.feature p {
  margin-bottom: 15px;
  flex-grow: 1;
}

.tips {
  margin-top: l5px;
}

.tips h4 {
  margin-bottom: 10px;
}

.tips ul {
  padding-left: 20px;
}

.tips li {
  margin-bottom: 8px;
}
</style> 