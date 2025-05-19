# HTTP/1.0

## HTTP/1.0 简介

HTTP/1.0是HTTP协议的早期版本，发布于1996年，相比HTTP/0.9增加了更多功能，为万维网的早期发展奠定了基础。

```javascript
function http10Introduction() {
  // HTTP/1.0的主要特点:
  // - 引入了HTTP头部，支持传输HTML以外的文件类型
  // - 增加了POST和HEAD请求方法
  // - 支持状态码，提供请求结果的状态信息
  // - 引入了字符集支持，允许传输非ASCII字符
  // - 添加了缓存控制机制
  // - 引入了用户代理标识、引用站点等元数据
  
  // HTTP/1.0的局限性:
  // - 不支持持久连接，每个请求需要建立新的TCP连接
  // - 不支持虚拟主机，一个IP只能有一个网站
  // - 不支持分块传输编码
  // - 缓存控制机制相对简单
  
  // HTTP/1.0的正式规范:
  // - RFC 1945 (1996年5月)
  // - 定义了HTTP协议的基本语法和语义
}
```

## HTTP/1.0 方法

HTTP/1.0相比HTTP/0.9增加了POST和HEAD两种请求方法。

### HTTP/1.0支持的请求方法

#### 1. GET
- 向指定资源发出请求，获取资源
- 参数附加在URL后面，通过查询字符串传递
- 请求数据长度受URL长度限制
- 例如: `GET /index.html?id=123 HTTP/1.0`

#### 2. POST
- 向指定资源提交数据，请求处理
- 参数在请求体中传递，不受URL长度限制
- 适用于表单提交等需要发送大量数据的场景
- 例如: `POST /submit-form HTTP/1.0`

#### 3. HEAD
- 与GET方法类似，但服务器只返回响应头，不返回响应体
- 用于获取资源的元信息，如文件大小、修改时间等
- 可用于检查资源是否存在、判断资源是否变化
- 例如: `HEAD /index.html HTTP/1.0`

### HTTP/1.0尚未正式支持的方法(但有些实现可能支持)
- PUT: 上传指定资源
- DELETE: 删除指定资源
- LINK: 建立资源间的联系
- UNLINK: 断开资源间的联系

## HTTP/1.0 头部字段

HTTP/1.0引入了头部字段的概念，大大增强了协议的灵活性和功能性。

### 1. 请求头
- **Accept**: 客户端能接受的内容类型，如"text/html"
- **Accept-Encoding**: 客户端能接受的编码方式，如"gzip"
- **Accept-Language**: 客户端偏好的语言，如"en-US"
- **Authorization**: 身份验证凭证
- **Content-Length**: 请求体的长度
- **Content-Type**: 请求体的MIME类型，如"application/x-www-form-urlencoded"
- **From**: 请求发送者的邮件地址
- **If-Modified-Since**: 条件请求，仅当资源在指定时间后修改过才返回
- **Referer**: 当前请求页面的来源URL
- **User-Agent**: 客户端程序的标识字符串

### 2. 响应头
- **Content-Encoding**: 响应体的编码方式，如"gzip"
- **Content-Length**: 响应体的长度
- **Content-Type**: 响应体的MIME类型，如"text/html"
- **Date**: 消息生成的日期和时间
- **Expires**: 响应内容的过期时间
- **Last-Modified**: 资源的最后修改时间
- **Location**: 重定向目标URL
- **Server**: 服务器软件的名称和版本
- **WWW-Authenticate**: 服务器对客户端的认证方式

### 通用头部(请求和响应都可使用)
- **Cache-Control**: 缓存控制指令，如"no-cache"
- **Connection**: 连接的管理，如"close"
- **Date**: 消息生成的日期和时间
- **MIME-Version**: MIME协议的版本
- **Pragma**: 与实现相关的指令，最常用的是"Pragma: no-cache"

## HTTP/1.0 状态码

HTTP/1.0引入了状态码的概念，用于表示服务器对请求的处理结果。

### 1xx - 信息性状态码(HTTP/1.0未正式定义)

### 2xx - 成功状态码
- **200 OK**: 请求成功，返回请求的资源
- **201 Created**: 请求已完成，并创建了新资源
- **202 Accepted**: 请求已接受，但尚未处理完成
- **204 No Content**: 请求成功，但没有返回任何内容

### 3xx - 重定向状态码
- **300 Multiple Choices**: 请求的资源有多个可用的表示形式
- **301 Moved Permanently**: 资源已永久移动到新位置
- **302 Moved Temporarily**: 资源临时位于不同的URL(HTTP/1.1改为Found)
- **304 Not Modified**: 资源未修改，使用缓存的版本

### 4xx - 客户端错误状态码
- **400 Bad Request**: 请求语法有误，服务器无法理解
- **401 Unauthorized**: 请求需要用户身份验证
- **403 Forbidden**: 服务器拒绝执行请求
- **404 Not Found**: 服务器找不到请求的资源

### 5xx - 服务器错误状态码
- **500 Internal Server Error**: 服务器遇到意外情况，无法完成请求
- **501 Not Implemented**: 服务器不支持请求所需功能
- **502 Bad Gateway**: 服务器作为网关收到无效响应
- **503 Service Unavailable**: 服务器暂时无法处理请求

## HTTP/1.0 缓存机制

HTTP/1.0引入了初步的缓存机制，用于提高Web访问性能。

### 1. Expires头部
- 指定资源的过期时间
- 格式为GMT时间，如"Expires: Thu, 01 Dec 1994 16:00:00 GMT"
- 过期前客户端可直接使用缓存，无需向服务器确认
- 缺点：客户端和服务器时钟可能不同步

### 2. Last-Modified和If-Modified-Since
- **Last-Modified**: 服务器返回资源的最后修改时间
- **If-Modified-Since**: 客户端发送上次收到的Last-Modified值
- 服务器比较这个时间，如果资源未修改，返回304 Not Modified
- 如果资源已修改，返回200 OK和新的资源内容

### 3. Pragma: no-cache
- 指示所有中间缓存不要缓存此资源
- 客户端每次都会向服务器发送请求
- HTTP/1.0的首选方法，但不是所有缓存都支持

### HTTP/1.0缓存的局限性
- 缺乏缓存控制的精细粒度
- 没有明确的缓存过期机制
- 不支持条件请求中的实体标签(ETag)
- 无法区分共享缓存和私有缓存

## HTTP/1.0 连接管理

HTTP/1.0默认使用非持久连接，每个请求都需要建立一个新的TCP连接。

### 1. 非持久连接(短连接)
- 每个HTTP请求/响应都需要一个单独的TCP连接
- 完成请求后立即关闭连接
- 连接建立和关闭增加了开销
- 每个请求都需要TCP三次握手

### 2. Connection: keep-alive (非标准扩展)
- 一些HTTP/1.0实现支持的非标准扩展
- 允许在一个TCP连接上发送多个请求/响应
- 减少了TCP连接的开销
- 使用方式:
  - 客户端发送: "Connection: keep-alive"
  - 服务器返回: "Connection: keep-alive"
  - 双方同意后保持连接打开
- 非标准特性，不是所有服务器都支持

### 3. 连接关闭
- 默认情况下，服务器发送完响应后关闭连接
- 客户端必须为每个新请求建立新连接
- 连接的持续时间非常短暂

### HTTP/1.0连接管理的局限性
- 频繁建立和关闭连接导致性能下降
- 未能充分利用TCP连接
- TCP慢启动机制使短连接效率低下
- 没有标准化的持久连接机制

## 常见面试题

1. HTTP/1.0与HTTP/0.9相比有哪些重要改进？
2. HTTP/1.0的主要缺点是什么？
3. HTTP/1.0如何实现缓存机制？
4. 为什么HTTP/1.0的性能不如HTTP/1.1？
5. HTTP/1.0中的Connection: keep-alive头部有什么作用？