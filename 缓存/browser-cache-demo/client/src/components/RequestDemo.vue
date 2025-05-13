<template>
  <div class="card">
    <div class="card-title">{{ title }}</div>
    <div class="card-content">
      <p>{{ description }}</p>
      
      <div class="form-group" v-if="showOptions">
        <label>请求选项：</label>
        <select v-model="selectedOption">
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      
      <div class="code-block" v-if="requestUrl">
        <strong>请求URL:</strong> {{ requestUrl }}
      </div>
      
      <div class="alert alert-info" v-if="headerInfo">
        <strong>请求头：</strong>
        <pre>{{ headerInfo }}</pre>
      </div>
      
      <div class="btn-group">
        <button @click="sendRequest" class="btn btn-primary">发送请求</button>
        <button @click="clearResponse" class="btn btn-danger" v-if="response">清除响应</button>
      </div>
      
      <div class="response-area" v-if="response">
        <div class="response-header">响应结果：</div>
        
        <div class="header-info" v-if="responseHeaders">
          <div class="header-item" v-for="(value, key) in responseHeaders" :key="key">
            {{ key }}: {{ value }}
          </div>
        </div>
        
        <div class="cache-info" v-if="cacheStatus">
          <strong>缓存状态：</strong>
          <span 
            class="cache-status" 
            :class="{
              'cache-status-hit': cacheStatus === '命中缓存', 
              'cache-status-miss': cacheStatus === '未命中缓存',
              'cache-status-revalidated': cacheStatus === '重新验证'
            }"
          >
            {{ cacheStatus }}
          </span>
        </div>
        
        <pre>{{ response }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'RequestDemo',
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    url: {
      type: String,
      required: true
    },
    showOptions: {
      type: Boolean,
      default: false
    },
    options: {
      type: Array,
      default: () => []
    },
    customHeaders: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      selectedOption: '',
      response: null,
      responseHeaders: null,
      cacheStatus: null,
      startTime: 0,
      endTime: 0
    };
  },
  computed: {
    requestUrl() {
      if (!this.url) return '';
      
      return this.selectedOption 
        ? `${this.url}/${this.selectedOption}`
        : this.url;
    },
    headerInfo() {
      return Object.keys(this.customHeaders).length > 0 
        ? JSON.stringify(this.customHeaders, null, 2) 
        : null;
    }
  },
  created() {
    if (this.options && this.options.length > 0) {
      this.selectedOption = this.options[0].value;
    }
  },
  methods: {
    async sendRequest() {
      this.startTime = performance.now();
      
      try {
        const response = await axios.get(this.requestUrl, {
          headers: this.customHeaders
        });
        
        this.endTime = performance.now();
        this.response = response.data;
        this.responseHeaders = response.headers;
        this.determineCacheStatus();
      } catch (error) {
        console.error('Request error:', error);
        this.response = {
          error: true,
          message: error.message
        };
        this.responseHeaders = error.response?.headers || {};
      }
    },
    clearResponse() {
      this.response = null;
      this.responseHeaders = null;
      this.cacheStatus = null;
    },
    determineCacheStatus() {
      // 响应时间低于50ms可能是缓存命中
      const responseTime = this.endTime - this.startTime;
      const isFast = responseTime < 50;
      
      // 检查响应头部确定缓存状态
      if (this.responseHeaders['x-cache'] === 'HIT') {
        this.cacheStatus = '命中缓存';
      } else if (this.responseHeaders['x-cache'] === 'MISS') {
        this.cacheStatus = '未命中缓存';
      } else if (this.responseHeaders['x-cache'] === 'REVALIDATED') {
        this.cacheStatus = '重新验证';
      } else {
        // 根据状态码和响应时间推断
        if (this.responseHeaders.status === 304) {
          this.cacheStatus = '重新验证';
        } else if (isFast) {
          this.cacheStatus = '可能命中缓存';
        } else {
          this.cacheStatus = '可能未命中缓存';
        }
      }
    }
  }
};
</script>

<style scoped>
.btn-group {
  margin-bottom: 15px;
}

.btn-group .btn {
  margin-right: 10px;
}
</style> 