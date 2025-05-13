<template>
  <div>
    <div class="card">
      <div class="card-title">协商缓存（Negotiated Cache）演示</div>
      <div class="card-content">
        <p>协商缓存是浏览器与服务器协商使用缓存的机制。当强缓存过期后，浏览器会发送请求到服务器，服务器根据请求头判断是否使用缓存。</p>
        
        <h3>协商缓存的工作原理</h3>
        <p>协商缓存主要有两种实现方式：</p>
        <ul>
          <li><strong>Last-Modified/If-Modified-Since：</strong> 基于资源修改时间的缓存策略</li>
          <li><strong>ETag/If-None-Match：</strong> 基于资源内容特征值的缓存策略</li>
        </ul>
        
        <div class="alert alert-info">
          <strong>注意：</strong> 协商缓存虽然会发送请求到服务器，但若资源未变化，服务器只返回304状态码，没有实际内容，大大减少传输数据量。
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">示例1：Last-Modified/If-Modified-Since</div>
      <div class="card-content">
        <p>Last-Modified是服务器响应头，表示资源的最后修改时间。If-Modified-Since是浏览器请求头，将上次返回的Last-Modified值发送给服务器。</p>
        <p>工作流程：</p>
        <ol>
          <li>首次请求资源，服务器返回资源和Last-Modified值</li>
          <li>再次请求时，浏览器在请求头中加入If-Modified-Since</li>
          <li>服务器比较If-Modified-Since与资源当前Last-Modified</li>
          <li>若资源未变化，返回304 Not Modified；若已变化，返回200 OK和新资源</li>
        </ol>
        
        <RequestDemo
          title="Last-Modified 示例"
          description="此请求使用Last-Modified/If-Modified-Since控制缓存。首次请求返回资源和Last-Modified，后续请求返回304状态码（如资源未变）。"
          url="http://localhost:3000/api/last-modified"
          :options="{}"
        />
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">示例2：ETag/If-None-Match</div>
      <div class="card-content">
        <p>ETag是服务器响应头，表示资源的唯一标识（通常是内容的哈希值）。If-None-Match是浏览器请求头，将上次返回的ETag值发送给服务器。</p>
        <p>工作流程：</p>
        <ol>
          <li>首次请求资源，服务器返回资源和ETag值</li>
          <li>再次请求时，浏览器在请求头中加入If-None-Match</li>
          <li>服务器比较If-None-Match与资源当前ETag</li>
          <li>若资源未变化，返回304 Not Modified；若已变化，返回200 OK和新资源</li>
        </ol>
        
        <RequestDemo
          title="ETag 示例"
          description="此请求使用ETag/If-None-Match控制缓存。首次请求返回资源和ETag，后续请求返回304状态码（如资源未变）。"
          url="http://localhost:3000/api/etag"
          :options="{}"
        />
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">Last-Modified 与 ETag 对比</div>
      <div class="card-content">
        <table>
          <thead>
            <tr>
              <th>特性</th>
              <th>Last-Modified</th>
              <th>ETag</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>判断依据</td>
              <td>资源最后修改时间</td>
              <td>资源内容特征值（哈希值）</td>
            </tr>
            <tr>
              <td>精确度</td>
              <td>秒级精确度</td>
              <td>内容级精确度</td>
            </tr>
            <tr>
              <td>优点</td>
              <td>计算简单，性能好</td>
              <td>精确度高，解决1秒内多次修改问题</td>
            </tr>
            <tr>
              <td>缺点</td>
              <td>精度不高，1秒内多次修改无法识别</td>
              <td>计算复杂，消耗服务器资源</td>
            </tr>
            <tr>
              <td>适用场景</td>
              <td>更新频率低的静态资源</td>
              <td>动态内容，更新频繁的资源</td>
            </tr>
          </tbody>
        </table>
        
        <div class="alert alert-warning mt-3">
          <strong>最佳实践：</strong> 当ETag和Last-Modified同时存在时，服务器会优先验证ETag，都验证通过时才会返回304。
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">示例3：同时使用ETag与Last-Modified</div>
      <div class="card-content">
        <p>在实际应用中，通常会同时使用ETag和Last-Modified两种缓存验证机制，以获得更高的缓存精确度。</p>
        
        <RequestDemo
          title="组合使用示例"
          description="此请求同时使用ETag和Last-Modified进行缓存控制，提供双重验证机制。"
          url="http://localhost:3000/api/combined"
          :options="{}"
        />
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">实际应用场景</div>
      <div class="card-content">
        <div class="application-scenario">
          <h3>资源更新检测</h3>
          <p>例如新闻网站，使用ETag可以精确检测内容是否有更新，减少不必要的数据传输。</p>
        </div>
        
        <div class="application-scenario">
          <h3>API数据缓存</h3>
          <p>RESTful API可以利用ETag实现客户端缓存，减轻服务器负载并提高响应速度。</p>
        </div>
        
        <div class="application-scenario">
          <h3>带宽敏感应用</h3>
          <p>移动应用中，使用协商缓存可以大幅减少数据传输，降低流量消耗。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RequestDemo from '../components/RequestDemo.vue';

export default {
  name: 'NegotiatedCachePage',
  components: {
    RequestDemo
  }
}
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

th, td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

th {
  background-color: #f5f5f5;
  font-weight: bold;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

.mt-3 {
  margin-top: 15px;
}

.application-scenario {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.application-scenario h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--color-primary);
}

ol, ul {
  padding-left: 20px;
  margin-bottom: 15px;
}

li {
  margin-bottom: 8px;
}
</style> 