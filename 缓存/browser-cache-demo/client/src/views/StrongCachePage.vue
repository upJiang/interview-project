<template>
  <div>
    <div class="card">
      <div class="card-title">强缓存（Strong Cache）演示</div>
      <div class="card-content">
        <p>强缓存是指浏览器在加载资源时，如果命中缓存，不需要发送请求到服务器，直接从浏览器缓存中获取资源。这种方式可以显著提高页面加载速度。</p>
        
        <h3>强缓存的控制方式</h3>
        <p>主要通过两个HTTP头控制：</p>
        <ul>
          <li><strong>Expires：</strong> HTTP 1.0的控制方式，指定资源过期的具体时间点</li>
          <li><strong>Cache-Control：</strong> HTTP 1.1的控制方式，更加灵活，可以指定最大有效时间等多种策略</li>
        </ul>
        
        <div class="alert alert-info">
          <strong>注意：</strong> 当Expires和Cache-Control同时存在时，Cache-Control优先级更高。
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">示例1：Expires</div>
      <div class="card-content">
        <p>Expires设置了一个绝对的过期时间（GMT格式）。在过期时间前，浏览器会直接使用缓存。</p>
        <p>格式：<code>Expires: Wed, 21 Oct 2022 07:28:00 GMT</code></p>
        <p>缺点：服务器和客户端时间可能不同步，导致缓存控制不准确。</p>
        
        <RequestDemo
          title="Expires 示例"
          description="此请求使用Expires头控制缓存，设置资源在1分钟后过期。观察多次请求的缓存状态。"
          url="http://localhost:3000/api/expires"
          :options="{}"
        />
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">示例2：Cache-Control max-age</div>
      <div class="card-content">
        <p>Cache-Control的max-age指令设置了资源从响应时间开始的最大有效时间（单位为秒）。</p>
        <p>格式：<code>Cache-Control: max-age=60</code>（例如60秒）</p>
        <p>优点：相对时间，不受客户端时间影响。</p>
        
        <RequestDemo
          title="Cache-Control max-age 示例"
          description="此请求使用Cache-Control: max-age控制缓存，设置资源在30秒内有效。观察多次请求的缓存状态。"
          url="http://localhost:3000/api/cache-control/max-age"
          :options="{}"
        />
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">示例3：Cache-Control no-cache与no-store</div>
      <div class="card-content">
        <p>Cache-Control还提供了更多缓存控制指令：</p>
        <ul>
          <li><strong>no-cache：</strong> 强制验证缓存，每次使用缓存前必须校验资源的有效性</li>
          <li><strong>no-store：</strong> 禁止缓存，每次请求都从服务器获取完整资源</li>
        </ul>
        
        <div class="demo-grid">
          <RequestDemo
            title="Cache-Control: no-cache"
            description="每次都会发送请求到服务器验证资源是否过期，如未过期则返回304状态码。"
            url="http://localhost:3000/api/cache-control/no-cache"
            :options="{}"
          />
          
          <RequestDemo
            title="Cache-Control: no-store"
            description="完全禁止缓存，每次都从服务器获取完整资源，返回200状态码。"
            url="http://localhost:3000/api/cache-control/no-store"
            :options="{}"
          />
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">强缓存工作原理</div>
      <div class="card-content">
        <HeaderExplainer />
      </div>
    </div>
  </div>
</template>

<script>
import HeaderExplainer from '../components/HeaderExplainer.vue';
import RequestDemo from '../components/RequestDemo.vue';

export default {
  name: 'StrongCachePage',
  components: {
    RequestDemo,
    HeaderExplainer
  }
}
</script>

<style scoped>
.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

ul {
  padding-left: 20px;
  margin-bottom: 15px;
}

li {
  margin-bottom: 8px;
}

code {
  background-color: #f1f1f1;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
}
</style> 