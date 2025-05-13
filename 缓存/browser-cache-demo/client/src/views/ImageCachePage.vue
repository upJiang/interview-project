<template>
  <div>
    <div class="card">
      <div class="card-title">图像缓存策略演示</div>
      <div class="card-content">
        <p>图像是网站中常见的资源类型，通过合理的缓存策略可以大幅提升加载速度和用户体验。本页面演示不同图像缓存策略的效果。</p>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">静态图像缓存</div>
      <div class="card-content">
        <p>不经常变化的图像（如logo、背景图等）通常使用长期缓存策略。</p>
        
        <div class="image-demo">
          <div class="image-container">
            <img ref="staticImage" :src="staticImageUrl" alt="静态图像" @load="imageLoaded('static')" />
            <div v-if="loadingStatic" class="loading">加载中...</div>
          </div>
          
          <div class="image-info">
            <h3>静态图像 (长期缓存)</h3>
            <p>缓存策略: <code>Cache-Control: public, max-age=31536000</code></p>
            <p>特点: 设置一年的缓存时间，适用于不会频繁变化的图像资源。</p>
            <button @click="reloadImage('static')" class="btn btn-primary">重新加载图像</button>
            <div v-if="staticStats" class="stats">
              <p>加载时间: {{ staticStats.time }}ms</p>
              <p>缓存状态: <span :class="'cache-badge ' + staticStats.cacheClass">{{ staticStats.cacheStatus }}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">动态图像缓存</div>
      <div class="card-content">
        <p>可能会经常变化的图像（如用户头像、商品图片等）通常使用较短的缓存时间或协商缓存。</p>
        
        <div class="image-demo">
          <div class="image-container">
            <img ref="dynamicImage" :src="dynamicImageUrl" alt="动态图像" @load="imageLoaded('dynamic')" />
            <div v-if="loadingDynamic" class="loading">加载中...</div>
          </div>
          
          <div class="image-info">
            <h3>动态图像 (短期缓存)</h3>
            <p>缓存策略: <code>Cache-Control: private, max-age=60</code></p>
            <p>特点: 设置较短的缓存时间（60秒），适用于会定期更新的图像。</p>
            <button @click="reloadImage('dynamic')" class="btn btn-primary">重新加载图像</button>
            <div v-if="dynamicStats" class="stats">
              <p>加载时间: {{ dynamicStats.time }}ms</p>
              <p>缓存状态: <span :class="'cache-badge ' + dynamicStats.cacheClass">{{ dynamicStats.cacheStatus }}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">协商缓存图像</div>
      <div class="card-content">
        <p>使用ETag/Last-Modified进行协商缓存的图像，可以在保证资源最新的同时减少网络传输。</p>
        
        <div class="image-demo">
          <div class="image-container">
            <img ref="negotiatedImage" :src="negotiatedImageUrl" alt="协商缓存图像" @load="imageLoaded('negotiated')" />
            <div v-if="loadingNegotiated" class="loading">加载中...</div>
          </div>
          
          <div class="image-info">
            <h3>协商缓存图像</h3>
            <p>缓存策略: <code>Cache-Control: no-cache, ETag: "..."</code></p>
            <p>特点: 使用协商缓存验证资源是否变化，如未变化则返回304状态码。</p>
            <button @click="reloadImage('negotiated')" class="btn btn-primary">重新加载图像</button>
            <div v-if="negotiatedStats" class="stats">
              <p>加载时间: {{ negotiatedStats.time }}ms</p>
              <p>缓存状态: <span :class="'cache-badge ' + negotiatedStats.cacheClass">{{ negotiatedStats.cacheStatus }}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">版本化图像缓存</div>
      <div class="card-content">
        <p>通过URL参数或路径来版本化图像，可以实现长期缓存和即时更新的平衡。</p>
        
        <div class="image-demo">
          <div class="image-container">
            <img ref="versionedImage" :src="versionedImageUrl" alt="版本化图像" @load="imageLoaded('versioned')" />
            <div v-if="loadingVersioned" class="loading">加载中...</div>
          </div>
          
          <div class="image-info">
            <h3>版本化图像</h3>
            <p>缓存策略: <code>Cache-Control: public, max-age=31536000, immutable</code></p>
            <p>特点: 使用版本号参数（如?v=1）和长期缓存，更新时只需修改版本号。</p>
            <div class="version-controls">
              <button @click="updateVersion" class="btn btn-secondary">更新版本</button>
              <button @click="reloadImage('versioned')" class="btn btn-primary">重新加载图像</button>
            </div>
            <div class="version-info">当前版本: v{{ version }}</div>
            <div v-if="versionedStats" class="stats">
              <p>加载时间: {{ versionedStats.time }}ms</p>
              <p>缓存状态: <span :class="'cache-badge ' + versionedStats.cacheClass">{{ versionedStats.cacheStatus }}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">图像缓存最佳实践</div>
      <div class="card-content">
        <div class="best-practices">
          <div class="practice">
            <h3>根据图像类型选择缓存策略</h3>
            <ul>
              <li><strong>UI元素、Logo、图标:</strong> 长期缓存 + 版本化</li>
              <li><strong>产品图片、用户上传内容:</strong> 中期缓存或协商缓存</li>
              <li><strong>个性化图像(如用户头像):</strong> 短期缓存或协商缓存</li>
              <li><strong>临时图像(如验证码):</strong> no-store 禁止缓存</li>
            </ul>
          </div>
          
          <div class="practice">
            <h3>使用CDN分发图像</h3>
            <p>结合CDN分发和边缘缓存，可以进一步加速图像加载速度。CDN可以通过以下头控制：</p>
            <p><code>Cache-Control: public, max-age=86400, s-maxage=31536000</code></p>
          </div>
          
          <div class="practice">
            <h3>响应式图像与缓存</h3>
            <p>使用srcset和sizes属性提供响应式图像时，各尺寸图像都应有适当的缓存策略。</p>
            <pre><code>&lt;img srcset="small.jpg 400w, medium.jpg 800w, large.jpg 1200w"
     sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
     src="medium.jpg" alt="响应式图像"&gt;</code></pre>
          </div>
          
          <div class="practice">
            <h3>图像格式优化</h3>
            <p>使用WebP、AVIF等现代图像格式可以减小文件体积，从而减少缓存存储和传输数据量。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageCachePage',
  data() {
    return {
      version: 1,
      baseUrl: 'http://localhost:3000',
      
      loadingStatic: false,
      loadingDynamic: false,
      loadingNegotiated: false,
      loadingVersioned: false,
      
      staticStats: null,
      dynamicStats: null,
      negotiatedStats: null,
      versionedStats: null,
      
      loadStartTime: {
        static: 0,
        dynamic: 0,
        negotiated: 0,
        versioned: 0
      }
    }
  },
  computed: {
    staticImageUrl() {
      return `${this.baseUrl}/images/static-image.jpg`;
    },
    dynamicImageUrl() {
      return `${this.baseUrl}/images/dynamic-image.jpg`;
    },
    negotiatedImageUrl() {
      return `${this.baseUrl}/images/negotiated-image.jpg`;
    },
    versionedImageUrl() {
      return `${this.baseUrl}/images/versioned-image.jpg?v=${this.version}`;
    }
  },
  methods: {
    reloadImage(type) {
      this[`loading${type.charAt(0).toUpperCase() + type.slice(1)}`] = true;
      this.loadStartTime[type] = performance.now();
      
      const img = this.$refs[`${type}Image`];
      const currentSrc = img.src;
      img.src = '';
      setTimeout(() => {
        img.src = currentSrc.includes('?') 
          ? currentSrc.split('?')[0] + `?v=${this.version}&t=${Date.now()}` 
          : `${currentSrc}?t=${Date.now()}`;
      }, 100);
    },
    
    imageLoaded(type) {
      const loadTime = performance.now() - this.loadStartTime[type];
      this[`loading${type.charAt(0).toUpperCase() + type.slice(1)}`] = false;
      
      // 模拟确定缓存状态
      let cacheStatus = '未知';
      let cacheClass = 'unknown';
      
      if (loadTime < 50) {
        cacheStatus = '使用缓存';
        cacheClass = 'cached';
      } else if (loadTime < 200) {
        cacheStatus = '304 协商缓存';
        cacheClass = 'negotiated';
      } else {
        cacheStatus = '从服务器获取';
        cacheClass = 'uncached';
      }
      
      this[`${type}Stats`] = {
        time: Math.round(loadTime),
        cacheStatus,
        cacheClass
      };
    },
    
    updateVersion() {
      this.version++;
      this.reloadImage('versioned');
    }
  },
  mounted() {
    // 初始加载所有图像
    ['static', 'dynamic', 'negotiated', 'versioned'].forEach(type => {
      this[`loading${type.charAt(0).toUpperCase() + type.slice(1)}`] = true;
      this.loadStartTime[type] = performance.now();
    });
  }
}
</script>

<style scoped>
.image-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 20px 0;
}

.image-container {
  position: relative;
  width: 300px;
  height: 200px;
  background-color: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s;
}

.loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  font-weight: bold;
}

.image-info {
  flex: 1;
  min-width: 300px;
}

.image-info h3 {
  margin-top: 0;
  color: var(--color-primary);
}

.stats {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.cache-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 0.9em;
  font-weight: bold;
}

.cache-badge.cached {
  background-color: #d4edda;
  color: #155724;
}

.cache-badge.negotiated {
  background-color: #fff3cd;
  color: #856404;
}

.cache-badge.uncached {
  background-color: #f8d7da;
  color: #721c24;
}

.cache-badge.unknown {
  background-color: #d6d8d9;
  color: #1b1e21;
}

.version-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.version-info {
  margin: 10px 0;
  font-weight: bold;
}

code {
  background-color: #f1f1f1;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
}

pre {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
}

pre code {
  background-color: transparent;
  padding: 0;
}

.best-practices {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.practice {
  padding: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.practice h3 {
  margin-top: 0;
  color: var(--color-primary);
}

ul {
  padding-left: 20px;
  margin-bottom: 15px;
}

li {
  margin-bottom: 8px;
}
</style> 