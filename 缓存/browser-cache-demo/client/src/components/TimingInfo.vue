<template>
  <div class="timing-container">
    <h3>请求性能分析</h3>
    <div class="timing-grid">
      <div v-for="(time, index) in times" :key="index" class="timing-item">
        <div class="timing-value">{{ time.value.toFixed(2) }}ms</div>
        <div class="timing-label">{{ time.label }}</div>
        <div class="timing-bar" :style="{ width: getBarWidth(time.value) + '%' }"></div>
      </div>
    </div>
    
    <div class="cache-summary" v-if="cacheInfo">
      <h4>缓存状态</h4>
      <div class="cache-type">
        {{ cacheInfo.type }}
        <span class="cache-badge" :class="getBadgeClass(cacheInfo.type)">{{ cacheInfo.status }}</span>
      </div>
      <div class="cache-details">
        <ul>
          <li v-for="(detail, index) in cacheInfo.details" :key="index">
            {{ detail }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TimingInfo',
  props: {
    // Performance API的时间数据
    timingData: {
      type: Object,
      required: true
    },
    // 缓存信息
    cacheInfo: {
      type: Object,
      default: null
    }
  },
  computed: {
    times() {
      const { domainLookupStart, domainLookupEnd, connectStart, connectEnd, 
              requestStart, responseStart, responseEnd } = this.timingData;
      
      // 计算各阶段时间
      const dnsTime = domainLookupEnd - domainLookupStart;
      const tcpTime = connectEnd - connectStart;
      const requestTime = responseStart - requestStart;
      const responseTime = responseEnd - responseStart;
      const totalTime = responseEnd - domainLookupStart;
      
      return [
        { label: 'DNS查询', value: dnsTime },
        { label: 'TCP连接', value: tcpTime },
        { label: '请求时间', value: requestTime },
        { label: '响应时间', value: responseTime },
        { label: '总时间', value: totalTime }
      ];
    }
  },
  methods: {
    getBarWidth(value) {
      // 找出最大时间值
      const maxTime = Math.max(...this.times.map(t => t.value));
      // 计算相对宽度（最大为90%）
      return (value / maxTime) * 90;
    },
    getBadgeClass(type) {
      switch(type) {
        case '强缓存':
          return 'strong-cache';
        case '协商缓存':
          return 'negotiated-cache';
        case '无缓存':
          return 'no-cache';
        default:
          return '';
      }
    }
  }
};
</script>

<style scoped>
.timing-container {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.timing-container h3 {
  margin-bottom: 15px;
  color: var(--color-primary);
  font-size: 1.1rem;
}

.timing-grid {
  display: grid;
  gap: 10px;
}

.timing-item {
  position: relative;
  padding: 8px 10px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.timing-label {
  font-size: 0.85rem;
  color: #666;
}

.timing-value {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 5px;
}

.timing-bar {
  position: absolute;
  height: 3px;
  background-color: var(--color-primary);
  bottom: 0;
  left: 0;
  border-radius: 0 1.5px 1.5px 0;
}

.cache-summary {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

.cache-summary h4 {
  margin-bottom: 10px;
  font-size: 1rem;
}

.cache-type {
  font-weight: 500;
  margin-bottom: 10px;
}

.cache-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 0.75rem;
  border-radius: 10px;
  margin-left: 8px;
  color: white;
}

.cache-badge.strong-cache {
  background-color: var(--color-secondary);
}

.cache-badge.negotiated-cache {
  background-color: var(--color-primary);
}

.cache-badge.no-cache {
  background-color: var(--color-warning);
}

.cache-details ul {
  padding-left: 20px;
  font-size: 0.9rem;
  color: #555;
}

.cache-details li {
  margin-bottom: 5px;
}
</style> 