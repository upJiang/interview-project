# 浏览器缓存学习总结

## 概述

浏览器缓存是浏览器将网站资源（HTML、CSS、JavaScript、图像等）存储在本地的机制，目的是减少网络请求，提高页面加载速度，降低服务器负载。合理利用缓存可以显著提升Web应用性能和用户体验。

## 缓存分类

浏览器缓存主要分为两类：

### 1. 强缓存 (Strong Cache)

不需要发送请求到服务器，直接从浏览器缓存中获取资源。

**控制方式：**
- **Expires**：HTTP 1.0的控制方式，指定资源过期的具体时间点（GMT格式）
  ```
  Expires: Wed, 21 Oct 2023 07:28:00 GMT
  ```
  
- **Cache-Control**：HTTP 1.1的控制方式，更加灵活，优先级高于Expires
  ```
  Cache-Control: max-age=3600
  ```

**常用指令：**
- `max-age=<秒>`：指定资源从响应时间开始的最大有效时间
- `s-maxage=<秒>`：类似max-age，但仅适用于共享缓存（如CDN）
- `public`：表示响应可以被任何缓存存储
- `private`：表示响应只能被浏览器私有缓存存储
- `no-cache`：资源会被缓存，但每次使用前必须校验资源的有效性
- `no-store`：完全禁止缓存，每次请求都从服务器获取完整资源
- `must-revalidate`：缓存必须在使用前验证过期资源的状态
- `immutable`：表示资源内容不会改变，在指定时间内不需要重新验证

### 2. 协商缓存 (Negotiated Cache)

当强缓存过期后，浏览器会发送请求到服务器，服务器根据请求头判断资源是否有变化，如未变化则返回304状态码，浏览器继续使用本地缓存。

**控制方式：**
- **Last-Modified/If-Modified-Since**：基于资源修改时间的缓存策略
  ```
  // 服务器响应头
  Last-Modified: Wed, 21 Oct 2023 07:28:00 GMT
  
  // 浏览器后续请求头
  If-Modified-Since: Wed, 21 Oct 2023 07:28:00 GMT
  ```
  
- **ETag/If-None-Match**：基于资源内容特征值的缓存策略
  ```
  // 服务器响应头
  ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
  
  // 浏览器后续请求头
  If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
  ```

**Last-Modified与ETag对比：**

| 特性 | Last-Modified | ETag |
|------|--------------|------|
| 判断依据 | 资源最后修改时间 | 资源内容特征值（哈希值） |
| 精确度 | 秒级精确度 | 内容级精确度 |
| 优点 | 计算简单，性能好 | 精确度高，解决1秒内多次修改问题 |
| 缺点 | 精度不高，1秒内多次修改无法识别 | 计算复杂，消耗服务器资源 |
| 适用场景 | 更新频率低的静态资源 | 动态内容，更新频繁的资源 |

当ETag和Last-Modified同时存在时，服务器会优先验证ETag。

## 浏览器缓存工作流程

1. 浏览器发起HTTP请求
2. 检查强缓存是否可用（Expires, Cache-Control）
3. 如果强缓存可用，直接使用缓存资源
4. 如果强缓存已过期，发送请求到服务器进行协商缓存验证（ETag, Last-Modified）
5. 如果协商缓存验证资源未修改，服务器返回304状态码，浏览器使用本地缓存
6. 如果资源已修改，服务器返回200状态码和新资源

## 缓存策略选择指南

### 按资源类型选择缓存策略

1. **HTML文档**
   - 推荐：`Cache-Control: no-cache` 或短期缓存 + ETag
   - 确保内容的及时更新

2. **JavaScript/CSS文件**
   - 推荐：版本化（文件名哈希或URL参数）+ `Cache-Control: public, max-age=31536000, immutable`
   - 长期缓存提高性能，版本化确保更新

3. **图像资源**
   - **UI元素、Logo、图标**：长期缓存 + 版本化
     ```
     Cache-Control: public, max-age=31536000, immutable
     ```
   - **产品图片、用户上传内容**：中期缓存或协商缓存
     ```
     Cache-Control: public, max-age=86400
     ```
   - **个性化图像(如用户头像)**：短期缓存或协商缓存
     ```
     Cache-Control: private, max-age=3600
     ```
   - **临时图像(如验证码)**：禁止缓存
     ```
     Cache-Control: no-store
     ```

4. **API响应**
   - 动态数据：短期缓存或协商缓存
     ```
     Cache-Control: private, max-age=60
     ```
   - 静态数据：较长时间缓存 + ETag
     ```
     Cache-Control: public, max-age=3600
     ```

### 特殊场景缓存策略

1. **CDN分发资源**
   ```
   Cache-Control: public, max-age=86400, s-maxage=31536000
   ```
   - 浏览器缓存1天，CDN缓存1年

2. **多版本内容（如不同语言、设备适配）**
   ```
   Vary: Accept-Language, User-Agent
   ```
   - 指定缓存根据请求头变化内容

3. **Service Worker缓存**
   - 实现离线访问和自定义缓存策略
   - 完全可编程的缓存控制

## 缓存策略性能比较

从快到慢排序：
1. 强缓存（内存 memory cache）
2. 强缓存（磁盘 disk cache）
3. 协商缓存（304 Not Modified）
4. 无缓存（200 OK）

## 版本化静态资源技术

两种主要的版本化方式：

1. **查询参数版本号**
   ```
   style.css?v=1.2.3
   ```
   - 简单易实现，但可能被某些代理忽略

2. **文件名哈希**
   ```
   style.a7cd3e.css
   ```
   - 更可靠，需要构建工具支持
   - 内容变化时哈希值变化，强制客户端请求新资源

## 实际应用场景

### 电子商务网站
- 产品页面: `Cache-Control: private, no-cache` + ETag
- 产品图片: `Cache-Control: public, max-age=86400`
- 静态资源: 版本化 + `Cache-Control: public, max-age=31536000`
- 购物车API: `Cache-Control: private, no-store`

### 新闻媒体网站
- 文章页面: `Cache-Control: public, max-age=300` + ETag
- 首页: `Cache-Control: public, max-age=60` + ETag
- 图片资源: `Cache-Control: public, max-age=86400`
- 静态资源: 版本化 + `Cache-Control: public, max-age=31536000`

### SaaS应用
- 应用页面: `Cache-Control: private, no-cache` + ETag
- API数据: `Cache-Control: private, max-age=60` 或按需设置
- 静态资源: 版本化 + `Cache-Control: public, max-age=31536000`
- 用户特定内容: `Cache-Control: private, no-store`

## 调试技巧

1. 使用Chrome开发者工具的"Network"标签查看缓存状态
   - 勾选"Disable cache"可以临时禁用浏览器缓存
   - 右键点击刷新按钮，选择"清空缓存并硬性重新加载"可以强制刷新页面并清除缓存
   - "Size"列显示"(from disk cache)"或"(from memory cache)"表示使用了缓存
   - "Status"列，200表示从服务器获取资源，304表示协商缓存验证后使用本地缓存

2. 服务器端添加调试头部
   ```
   X-Cache: HIT/MISS
   X-Cache-Hit: true/false
   ```

## 最佳实践

1. **不同类型资源采用不同缓存策略**
   - 静态资源：长期缓存+版本化
   - 动态内容：短期缓存或协商缓存

2. **使用版本化解决强缓存更新问题**
   - 文件名哈希或URL参数实现

3. **配合CDN使用缓存头**
   - 使用`public`和`s-maxage`指令

4. **监控和优化缓存效果**
   - 缓存命中率
   - 缓存过期策略

5. **安全性考虑**
   - 不缓存敏感数据
   - 使用`private`指令限制敏感信息 