<template>
  <div>
    <div class="card">
      <div class="card-title">浏览器缓存策略对比</div>
      <div class="card-content">
        <p>不同缓存策略在性能、资源新鲜度和实现复杂度上各有优劣。本页面对比分析各种缓存策略的特点及适用场景。</p>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">性能比较</div>
      <div class="card-content">
        <p>以下对比展示了不同缓存策略在资源加载速度上的表现（从快到慢）：</p>
        
        <CacheComparisonChart 
          :chartData="performanceData"
          :notes="'数据加载时间从慢到快: 无缓存 > 协商缓存 (304) > 强缓存 (memory) > 强缓存 (disk)。协商缓存虽然需要发送请求，但只返回状态码，不返回资源内容，因此比无缓存快很多。'"
        />
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">缓存策略特点对比</div>
      <div class="card-content">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>缓存策略</th>
              <th>实现方式</th>
              <th>优点</th>
              <th>缺点</th>
              <th>适用场景</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>强缓存 (Expires)</td>
              <td>Expires: [GMT时间]</td>
              <td>
                <ul>
                  <li>完全不发送请求，速度最快</li>
                  <li>实现简单</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>依赖客户端时间</li>
                  <li>更新难以控制</li>
                  <li>HTTP 1.0的过时技术</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>简单场景下的静态资源</li>
                  <li>作为后备方案</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>强缓存 (Cache-Control)</td>
              <td>Cache-Control: max-age=[秒]</td>
              <td>
                <ul>
                  <li>完全不发送请求，速度最快</li>
                  <li>相对时间，不依赖客户端时钟</li>
                  <li>指令丰富，控制精确</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>缓存期内无法感知资源更新</li>
                  <li>需要版本化解决更新问题</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>静态资源（JS/CSS/图像）</li>
                  <li>不经常变化的API响应</li>
                  <li>版本化的资源</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>协商缓存 (Last-Modified)</td>
              <td>Last-Modified / If-Modified-Since</td>
              <td>
                <ul>
                  <li>可以即时感知资源更新</li>
                  <li>服务器判断简单高效</li>
                  <li>304响应不返回资源内容</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>需要发送请求到服务器</li>
                  <li>只有秒级精度</li>
                  <li>无法识别1秒内多次修改</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>HTML文档</li>
                  <li>更新频率较低的资源</li>
                  <li>需要保证资源最新的场景</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>协商缓存 (ETag)</td>
              <td>ETag / If-None-Match</td>
              <td>
                <ul>
                  <li>可以即时感知资源更新</li>
                  <li>精确到内容级别</li>
                  <li>可以解决精度问题</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>需要发送请求到服务器</li>
                  <li>服务器需要计算资源摘要</li>
                  <li>计算成本较高</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>动态内容</li>
                  <li>API响应</li>
                  <li>需要精确控制缓存的场景</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>版本化缓存</td>
              <td>URL中添加版本号或哈希值</td>
              <td>
                <ul>
                  <li>结合强缓存使用</li>
                  <li>可以长期缓存</li>
                  <li>通过URL变化实现即时更新</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>需要构建工具支持</li>
                  <li>实现相对复杂</li>
                  <li>需要修改资源引用</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>生产环境的静态资源</li>
                  <li>打包后的JS/CSS</li>
                  <li>长期不变的图像资源</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>Service Worker缓存</td>
              <td>通过JS控制的缓存API</td>
              <td>
                <ul>
                  <li>完全可编程的缓存控制</li>
                  <li>离线访问支持</li>
                  <li>可以实现自定义缓存策略</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>实现复杂度高</li>
                  <li>需要额外的JS代码</li>
                  <li>调试困难</li>
                </ul>
              </td>
              <td>
                <ul>
                  <li>PWA应用</li>
                  <li>需要离线访问的网站</li>
                  <li>复杂的缓存需求</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">决策流程</div>
      <div class="card-content">
        <p>以下是选择合适缓存策略的决策流程图：</p>
        
        <div class="decision-flow">
          <div class="flow-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>资源类型判断</h3>
              <p>资源是静态的还是动态的？是否会频繁变化？</p>
              <div class="step-options">
                <div class="option">
                  <span class="option-label">静态且不变</span>
                  <span class="option-arrow">→</span>
                </div>
                <div class="option">
                  <span class="option-label">静态但可能更新</span>
                  <span class="option-arrow">→</span>
                </div>
                <div class="option">
                  <span class="option-label">动态内容</span>
                  <span class="option-arrow">→</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flow-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>缓存策略选择</h3>
              <div class="strategy-options">
                <div class="strategy">
                  <h4>版本化 + 长期强缓存</h4>
                  <p>Cache-Control: max-age=31536000, immutable</p>
                  <p>结合文件名哈希或URL参数版本号</p>
                </div>
                <div class="strategy">
                  <h4>中期强缓存 + 协商缓存</h4>
                  <p>Cache-Control: max-age=86400</p>
                  <p>配合ETag/Last-Modified</p>
                </div>
                <div class="strategy">
                  <h4>短期强缓存或纯协商缓存</h4>
                  <p>Cache-Control: max-age=60 或 no-cache</p>
                  <p>配合ETag进行验证</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flow-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>特殊需求考量</h3>
              <ul>
                <li>是否需要离线访问？ → 考虑Service Worker</li>
                <li>是否有CDN？ → 添加public和s-maxage指令</li>
                <li>是否有隐私内容？ → 使用private指令</li>
                <li>是否需要强制验证？ → 添加must-revalidate</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">实际项目中的缓存策略推荐</div>
      <div class="card-content">
        <div class="recommendations">
          <div class="recommendation">
            <h3>电子商务网站</h3>
            <ul>
              <li>产品页面: <code>Cache-Control: private, no-cache</code> + ETag</li>
              <li>产品图片: <code>Cache-Control: public, max-age=86400</code></li>
              <li>静态资源: 版本化 + <code>Cache-Control: public, max-age=31536000</code></li>
              <li>购物车API: <code>Cache-Control: private, no-store</code></li>
            </ul>
          </div>
          
          <div class="recommendation">
            <h3>新闻媒体网站</h3>
            <ul>
              <li>文章页面: <code>Cache-Control: public, max-age=300</code> + ETag</li>
              <li>首页: <code>Cache-Control: public, max-age=60</code> + ETag</li>
              <li>图片资源: <code>Cache-Control: public, max-age=86400</code></li>
              <li>静态资源: 版本化 + <code>Cache-Control: public, max-age=31536000</code></li>
            </ul>
          </div>
          
          <div class="recommendation">
            <h3>SaaS应用</h3>
            <ul>
              <li>应用页面: <code>Cache-Control: private, no-cache</code> + ETag</li>
              <li>API数据: <code>Cache-Control: private, max-age=60</code> 或按需设置</li>
              <li>静态资源: 版本化 + <code>Cache-Control: public, max-age=31536000</code></li>
              <li>用户特定内容: <code>Cache-Control: private, no-store</code></li>
            </ul>
          </div>
          
          <div class="recommendation">
            <h3>社交媒体</h3>
            <ul>
              <li>信息流: <code>Cache-Control: private, max-age=60</code> + ETag</li>
              <li>用户资料: <code>Cache-Control: private, max-age=300</code> + ETag</li>
              <li>媒体文件: <code>Cache-Control: public, max-age=604800</code></li>
              <li>静态资源: 版本化 + <code>Cache-Control: public, max-age=31536000</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CacheComparisonChart from '../components/CacheComparisonChart.vue';

export default {
  name: 'ComparisonPage',
  components: {
    CacheComparisonChart
  },
  data() {
    return {
      performanceData: [
        {
          label: '无缓存 (200)',
          value: 100,
          color: '#dc3545',
          description: '从服务器获取完整资源，传输所有数据'
        },
        {
          label: '协商缓存 (304)',
          value: 25,
          color: '#ffc107',
          description: '向服务器验证资源，但不下载资源内容'
        },
        {
          label: '强缓存 (memory)',
          value: 5,
          color: '#28a745',
          description: '从内存中读取缓存，速度最快'
        },
        {
          label: '强缓存 (disk)',
          value: 10,
          color: '#20c997',
          description: '从磁盘中读取缓存，速度较快'
        }
      ]
    }
  }
}
</script>

<style scoped>
.comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.comparison-table th,
.comparison-table td {
  padding: 12px;
  border: 1px solid #ddd;
  text-align: left;
  vertical-align: top;
}

.comparison-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.comparison-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.comparison-table ul {
  margin: 0;
  padding-left: 20px;
}

.comparison-table li {
  margin-bottom: 5px;
}

.decision-flow {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
}

.flow-step {
  display: flex;
  gap: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  font-weight: bold;
  font-size: 1.2em;
}

.step-content {
  flex: 1;
}

.step-content h3 {
  margin-top: 0;
  color: var(--color-primary);
}

.step-options {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.option {
  display: flex;
  align-items: center;
}

.option-label {
  font-weight: bold;
}

.option-arrow {
  margin-left: 5px;
  font-weight: bold;
}

.strategy-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.strategy {
  padding: 10px;
  background-color: #fff;
  border-radius: 5px;
  border-left: 3px solid var(--color-primary);
}

.strategy h4 {
  margin-top: 0;
  margin-bottom: 8px;
  color: var(--color-primary);
}

.recommendations {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.recommendation {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.recommendation h3 {
  margin-top: 0;
  color: var(--color-primary);
  margin-bottom: 10px;
}

.recommendation ul {
  padding-left: 20px;
  margin: 0;
}

.recommendation li {
  margin-bottom: 8px;
}

code {
  background-color: #f1f1f1;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
}
</style> 