<template>
  <div>
    <div class="card">
      <div class="card-title">Cache-Control详解</div>
      <div class="card-content">
        <p>Cache-Control是HTTP/1.1中最重要的缓存控制头，提供了丰富的缓存指令，可以精确控制缓存行为。本页面详细介绍各种Cache-Control指令及其应用。</p>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">缓存存储指令</div>
      <div class="card-content">
        <p>这些指令控制资源是否可以被缓存，以及如何被缓存：</p>
        
        <div class="directives-container">
          <div class="directive">
            <h3>public</h3>
            <p>表示响应可以被任何缓存存储，包括中间代理、CDN等。</p>
            <p><code>Cache-Control: public</code></p>
            
            <RequestDemo
              title="public 示例"
              description="此请求使用public指令，表示响应可以被任何缓存存储。"
              url="http://localhost:3000/api/cache-control/public"
              :options="{}"
            />
          </div>
          
          <div class="directive">
            <h3>private</h3>
            <p>表示响应只能被浏览器私有缓存存储，不允许中间代理缓存。</p>
            <p><code>Cache-Control: private</code></p>
            
            <RequestDemo
              title="private 示例"
              description="此请求使用private指令，表示响应只能被浏览器私有缓存存储。"
              url="http://localhost:3000/api/cache-control/private"
              :options="{}"
            />
          </div>
          
          <div class="directive">
            <h3>no-cache</h3>
            <p>资源会被缓存，但每次使用前必须向服务器验证是否过期（协商缓存）。</p>
            <p><code>Cache-Control: no-cache</code></p>
            
            <RequestDemo
              title="no-cache 示例"
              description="此请求使用no-cache指令，每次都会进行协商缓存验证。"
              url="http://localhost:3000/api/cache-control/no-cache"
              :options="{}"
            />
          </div>
          
          <div class="directive">
            <h3>no-store</h3>
            <p>完全禁止缓存，每次都从服务器获取最新资源。</p>
            <p><code>Cache-Control: no-store</code></p>
            
            <RequestDemo
              title="no-store 示例"
              description="此请求使用no-store指令，完全禁止缓存。"
              url="http://localhost:3000/api/cache-control/no-store"
              :options="{}"
            />
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">过期指令</div>
      <div class="card-content">
        <p>这些指令控制缓存的过期时间：</p>
        
        <div class="directives-container">
          <div class="directive">
            <h3>max-age</h3>
            <p>指定资源从响应时间开始的最大有效时间（单位秒）。</p>
            <p><code>Cache-Control: max-age=60</code></p>
            
            <RequestDemo
              title="max-age 示例"
              description="此请求使用max-age=30指令，资源在30秒内有效。"
              url="http://localhost:3000/api/cache-control/max-age"
              :options="{}"
            />
          </div>
          
          <div class="directive">
            <h3>s-maxage</h3>
            <p>类似max-age，但仅适用于共享缓存（如CDN），私有缓存会忽略此指令。</p>
            <p><code>Cache-Control: s-maxage=120</code></p>
            
            <RequestDemo
              title="s-maxage 示例"
              description="此请求使用s-maxage=60指令，仅对共享缓存有效。"
              url="http://localhost:3000/api/cache-control/s-maxage"
              :options="{}"
            />
          </div>
          
          <div class="directive">
            <h3>max-stale</h3>
            <p>客户端可接受过期资源，但过期时间不超过指定值（单位秒）。</p>
            <p><code>Cache-Control: max-stale=30</code></p>
            <div class="alert alert-info">注意：此指令通常用于请求头。</div>
          </div>
          
          <div class="directive">
            <h3>min-fresh</h3>
            <p>客户端希望获取在指定时间内仍然新鲜的响应（单位秒）。</p>
            <p><code>Cache-Control: min-fresh=10</code></p>
            <div class="alert alert-info">注意：此指令通常用于请求头。</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">重新验证和重新加载指令</div>
      <div class="card-content">
        <p>这些指令控制缓存的验证行为：</p>
        
        <div class="directives-container">
          <div class="directive">
            <h3>must-revalidate</h3>
            <p>缓存必须在使用前验证过期资源的状态，不可使用过期资源。</p>
            <p><code>Cache-Control: max-age=60, must-revalidate</code></p>
            
            <RequestDemo
              title="must-revalidate 示例"
              description="此请求使用must-revalidate指令，过期后必须验证。"
              url="http://localhost:3000/api/cache-control/must-revalidate"
              :options="{}"
            />
          </div>
          
          <div class="directive">
            <h3>proxy-revalidate</h3>
            <p>类似must-revalidate，但仅适用于共享缓存（如CDN）。</p>
            <p><code>Cache-Control: max-age=60, proxy-revalidate</code></p>
            
            <RequestDemo
              title="proxy-revalidate 示例"
              description="此请求使用proxy-revalidate指令，仅对共享缓存要求验证。"
              url="http://localhost:3000/api/cache-control/proxy-revalidate"
              :options="{}"
            />
          </div>
          
          <div class="directive">
            <h3>no-transform</h3>
            <p>禁止代理服务器对资源进行转换（如图像格式转换、压缩等）。</p>
            <p><code>Cache-Control: no-transform</code></p>
            
            <RequestDemo
              title="no-transform 示例"
              description="此请求使用no-transform指令，禁止代理服务器对资源进行转换。"
              url="http://localhost:3000/api/cache-control/no-transform"
              :options="{}"
            />
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">组合使用示例</div>
      <div class="card-content">
        <p>在实际应用中，通常会组合使用多个Cache-Control指令来实现精确的缓存控制：</p>
        
        <div class="examples">
          <div class="example">
            <h3>静态资源典型配置</h3>
            <p><code>Cache-Control: public, max-age=31536000, immutable</code></p>
            <p>一年有效期，不会变化的静态资源（如带版本号的JS/CSS文件）。</p>
            
            <RequestDemo
              title="静态资源缓存示例"
              description="此请求模拟带哈希值的静态资源缓存设置。"
              url="http://localhost:3000/api/cache-control/static-resource"
              :options="{}"
            />
          </div>
          
          <div class="example">
            <h3>HTML页面典型配置</h3>
            <p><code>Cache-Control: private, no-cache</code></p>
            <p>HTML通常需要及时更新，使用协商缓存更合适。</p>
            
            <RequestDemo
              title="HTML页面缓存示例"
              description="此请求模拟HTML页面的缓存设置。"
              url="http://localhost:3000/api/cache-control/html"
              :options="{}"
            />
          </div>
          
          <div class="example">
            <h3>API响应典型配置</h3>
            <p><code>Cache-Control: private, max-age=60</code></p>
            <p>API响应通常只缓存短时间，确保数据相对新鲜。</p>
            
            <RequestDemo
              title="API响应缓存示例"
              description="此请求模拟API响应的缓存设置。"
              url="http://localhost:3000/api/cache-control/api"
              :options="{}"
            />
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">Cache-Control最佳实践</div>
      <div class="card-content">
        <div class="best-practices">
          <div class="practice">
            <h3>按资源类型设置不同策略</h3>
            <ul>
              <li>HTML: <code>no-cache</code> 或短期缓存</li>
              <li>JS/CSS: 使用版本号/哈希值 + 长期缓存</li>
              <li>图片: 根据业务需求设置适当的缓存时间</li>
              <li>API数据: 根据数据更新频率设置，通常较短或使用ETag</li>
            </ul>
          </div>
          
          <div class="practice">
            <h3>版本化静态资源</h3>
            <p>为静态资源添加版本号或哈希值（如 script.js?v=1.2 或 style.a7cd3e.css），结合长期缓存，可以有效解决缓存更新问题。</p>
          </div>
          
          <div class="practice">
            <h3>使用Vary头</h3>
            <p>当响应内容会根据请求头（如User-Agent、Accept-Encoding）变化时，应使用Vary头指定这些变化因素。</p>
            <p><code>Vary: Accept-Encoding, User-Agent</code></p>
          </div>
          
          <div class="practice">
            <h3>使用immutable指令</h3>
            <p>对于永远不会改变的资源（如带哈希值的文件），添加immutable指令可以减少浏览器的重新验证。</p>
            <p><code>Cache-Control: max-age=31536000, immutable</code></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RequestDemo from '../components/RequestDemo.vue';

export default {
  name: 'CacheControlPage',
  components: {
    RequestDemo
  }
}
</script>

<style scoped>
.directives-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.directive, .example, .practice {
  padding: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
  margin-bottom: 15px;
}

.directive h3, .example h3, .practice h3 {
  color: var(--color-primary);
  margin-top: 0;
  margin-bottom: 10px;
}

code {
  background-color: #f1f1f1;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
}

.examples {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.best-practices {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

ul {
  padding-left: 20px;
  margin-bottom: 15px;
}

li {
  margin-bottom: 8px;
}
</style> 