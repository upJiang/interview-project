<template>
  <div class="header-explainer">
    <h3>HTTP 缓存头部详解</h3>
    
    <div v-if="selectedHeader" class="header-detail">
      <h4>{{ selectedHeader.name }}</h4>
      
      <div class="syntax">
        <strong>语法:</strong> <code>{{ selectedHeader.syntax }}</code>
      </div>
      
      <div class="description">
        <p>{{ selectedHeader.description }}</p>
      </div>
      
      <div class="example" v-if="selectedHeader.example">
        <strong>示例:</strong>
        <pre>{{ selectedHeader.example }}</pre>
      </div>
      
      <div class="values" v-if="selectedHeader.values && selectedHeader.values.length">
        <strong>可能的值:</strong>
        <ul>
          <li v-for="(value, index) in selectedHeader.values" :key="index">
            <code>{{ value.name }}</code>: {{ value.description }}
          </li>
        </ul>
      </div>
      
      <div class="notes" v-if="selectedHeader.notes">
        <strong>注意:</strong>
        <p>{{ selectedHeader.notes }}</p>
      </div>
    </div>
    
    <div class="header-list">
      <h4>缓存相关头部列表</h4>
      <div class="header-tabs">
        <button 
          v-for="header in headers" 
          :key="header.name"
          @click="selectHeader(header)"
          class="header-tab"
          :class="{ active: selectedHeader && selectedHeader.name === header.name }"
        >
          {{ header.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HeaderExplainer',
  data() {
    return {
      selectedHeader: null,
      headers: [
        {
          name: 'Cache-Control',
          syntax: 'Cache-Control: <directive>[, <directive>]*',
          description: '控制缓存行为的主要HTTP头，指定缓存机制应遵循的指令。多个指令以逗号分隔。',
          example: 'Cache-Control: max-age=3600, must-revalidate, public',
          values: [
            { name: 'max-age=<seconds>', description: '指定从请求时间开始计算的最大过期时间（秒）' },
            { name: 'no-cache', description: '每次使用缓存前必须向服务器验证资源是否过期' },
            { name: 'no-store', description: '不缓存任何响应' },
            { name: 'public', description: '表示响应可以被任何缓存存储' },
            { name: 'private', description: '表示响应只能被浏览器私有缓存存储，不能被共享缓存存储' },
            { name: 'must-revalidate', description: '一旦过期，必须向服务器验证才能使用' },
            { name: 'immutable', description: '表示响应内容不会改变，在指定时间内不需要重新验证' },
            { name: 'stale-while-revalidate=<seconds>', description: '允许使用过期的响应，同时在后台重新验证' }
          ],
          notes: 'Cache-Control是HTTP/1.1引入的，比Expires更先进，提供了更多的控制选项。'
        },
        {
          name: 'Expires',
          syntax: 'Expires: <http-date>',
          description: '指定资源的过期时间（GMT格式的日期）。',
          example: 'Expires: Wed, 21 Oct 2023 07:28:00 GMT',
          notes: '如果同时存在Cache-Control: max-age，则Expires会被忽略。受客户端和服务器时间可能不同步的影响。'
        },
        {
          name: 'ETag',
          syntax: 'ETag: "<etag-value>"',
          description: '资源的唯一标识符，通常是内容的哈希值。用于协商缓存，验证资源是否有变化。',
          example: 'ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"',
          notes: 'ETag可以是强验证或弱验证（前缀为W/）。配合If-None-Match请求头使用。'
        },
        {
          name: 'If-None-Match',
          syntax: 'If-None-Match: "<etag-value>"',
          description: '请求头，包含客户端缓存的资源ETag值。如果服务器资源的ETag没有变化，返回304，否则返回200和新资源。',
          example: 'If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"',
          notes: '通常由浏览器根据上一次请求的ETag自动添加。'
        },
        {
          name: 'Last-Modified',
          syntax: 'Last-Modified: <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT',
          description: '指示资源最后修改的日期和时间，用于协商缓存。',
          example: 'Last-Modified: Wed, 21 Oct 2023 07:28:00 GMT',
          notes: '精度只到秒级，对于快速变化的资源不够精确。配合If-Modified-Since请求头使用。'
        },
        {
          name: 'If-Modified-Since',
          syntax: 'If-Modified-Since: <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT',
          description: '请求头，包含客户端缓存的资源的最后修改时间。如果服务器资源没有变化，返回304，否则返回200和新资源。',
          example: 'If-Modified-Since: Wed, 21 Oct 2023 07:28:00 GMT',
          notes: '通常由浏览器根据上一次请求的Last-Modified自动添加。'
        },
        {
          name: 'Vary',
          syntax: 'Vary: <header-name>, <header-name>, ...',
          description: '告诉缓存服务器哪些请求头的变化会导致响应内容的变化，用于处理不同的内容协商版本。',
          example: 'Vary: User-Agent, Accept-Encoding',
          notes: '常用于响应不同设备或语言的内容。"Vary: *" 表示每个请求都被视为唯一的，实际上禁用了缓存。'
        },
        {
          name: 'Age',
          syntax: 'Age: <seconds>',
          description: '响应已经在缓存中存在的时间（秒）。',
          example: 'Age: 24',
          notes: '通常由代理缓存服务器添加，用于指示响应已经在缓存中多久。'
        }
      ]
    };
  },
  created() {
    // 默认选择第一个头部
    this.selectedHeader = this.headers[0];
  },
  methods: {
    selectHeader(header) {
      this.selectedHeader = header;
    }
  }
};
</script>

<style scoped>
.header-explainer {
  margin: 20px 0;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.2rem;
}

h4 {
  color: var(--color-primary);
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.header-detail {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.syntax, .description, .example, .values, .notes {
  margin-bottom: 15px;
}

.syntax code, .values code {
  background-color: #e9ecef;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
}

pre {
  background-color: #f1f1f1;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  margin: 5px 0;
}

.values ul {
  padding-left: 20px;
}

.values li {
  margin-bottom: 8px;
}

.header-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.header-tab {
  padding: 8px 12px;
  background-color: #f1f1f1;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.header-tab:hover {
  background-color: #e1e1e1;
}

.header-tab.active {
  background-color: var(--color-primary);
  color: white;
}
</style> 