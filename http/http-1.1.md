# HTTP/1.1

## HTTP/1.1 简介

HTTP/1.1是HTTP协议的第一个标准化版本，发布于1997年，RFC 2068，后修订为RFC 2616(1999年)和RFC 7230-7235(2014年)，它解决了HTTP/1.0的许多限制，提高了Web性能和灵活性。

```javascript
function http11Introduction() {
  // HTTP/1.1的主要改进:
  // - 持久连接: 默认支持连接复用，减少TCP连接开销
  // - 管道机制: 允许在同一连接上并行发送多个请求
  // - 分块传输编码: 允许分块发送响应，不需预先知道内容长度
  // - 缓存增强: 引入更强大的缓存控制机制
  // - 内容协商: 允许客户端和服务器协商最适合的内容表示
  // - 虚拟主机: 支持在同一IP地址上托管多个域名
  // - 新增请求方法: 增加了OPTIONS, PUT, DELETE, TRACE, CONNECT方法
  
  // HTTP/1.1的重要特性:
  // - 强制要求Host头部，支持虚拟主机
  // - 支持范围请求，允许断点续传
  // - 支持压缩/解压缩内容编码
  // - 支持传输编码
  // - 更完善的缓存控制机制
  // - 更好的错误处理
  
  // HTTP/1.1的规范变化:
  // - 最初: RFC 2068 (1997年)
  // - 更新: RFC 2616 (1999年)
  // - 最新: RFC 7230-7235 (2014年)
}
```

## HTTP/1.1 持久连接

HTTP/1.1的一个重要改进是默认启用持久连接，大大提高了性能。

```javascript
function http11PersistentConnections() {
  // HTTP/1.1持久连接的特点:
  
  // 1. 默认开启
  // - HTTP/1.1默认使用持久连接，不需要显式指定
  // - 除非明确使用"Connection: close"头部关闭持久连接
  
  // 2. 连接复用
  // - 多个请求/响应可以在同一TCP连接上传输
  // - 减少了TCP连接建立和关闭的开销
  // - 避免了TCP慢启动导致的性能损失
  
  // 3. 连接管理
  // - 服务器可以使用超时机制关闭空闲连接
  // - 客户端和服务器都可以通过"Connection: close"关闭连接
  // - 通常会限制每个主机的最大连接数
  
  // 4. 与HTTP/1.0的区别
  // - HTTP/1.0: 默认关闭，需使用"Connection: keep-alive"开启
  // - HTTP/1.1: 默认开启，使用"Connection: close"关闭
  
  // 持久连接的优势:
  // - 减少延迟: 避免重复的TCP握手和慢启动
  // - 提高吞吐量: 更高效地利用TCP连接
  // - 降低网络负载: 减少网络中的TCP连接数
  // - 减少服务器负载: 降低服务器维护TCP连接的开销
}
```

## HTTP/1.1 管道机制

HTTP/1.1引入了管道机制，理论上允许在同一连接上并行处理多个请求。

```javascript
function http11Pipelining() {
  // HTTP/1.1管道机制的工作原理:
  
  // 1. 基本概念
  // - 允许客户端在收到上一个响应之前发送下一个请求
  // - 请求在单个连接上"管道式"排队
  // - 服务器必须按照接收请求的顺序返回响应
  
  // 2. 管道请求的限制
  // - 只能用于幂等方法(如GET, HEAD, PUT, DELETE)
  // - 不能用于非幂等方法(如POST)
  // - 响应必须按请求顺序返回，可能导致队头阻塞
  // - 客户端必须做好处理部分失败的准备
  
  // 3. 与普通持久连接的对比
  // - 普通持久连接: 发送请求→等待响应→发送下一个请求
  // - 管道机制: 发送请求→发送下一个请求→...→接收响应
  
  // 4. 实际应用中的问题
  // - 队头阻塞(HOL blocking): 一个请求的处理延迟会阻塞后续所有请求
  // - 代理和服务器兼容性问题
  // - 处理复杂性增加
  // - 难以调试
  
  // 管道机制的现状:
  // - 大多数浏览器默认禁用HTTP管道
  // - 很多代理和服务器不完全支持或有bug
  // - 在实践中很少使用
  // - 被HTTP/2的多路复用取代
}
```

## HTTP/1.1 缓存控制

HTTP/1.1引入了更强大、灵活的缓存控制机制。

```javascript
function http11CacheControl() {
  // HTTP/1.1的缓存增强:
  
  // 1. Cache-Control头部
  // - 提供了细粒度的缓存控制
  // - 可在请求和响应中使用
  // - 常用指令:
  //   - max-age=<seconds>: 指定资源的最大有效时间
  //   - private: 仅客户端可缓存，中间缓存不可缓存
  //   - public: 所有缓存都可存储
  //   - no-cache: 强制验证缓存
  //   - no-store: 不缓存任何内容
  //   - must-revalidate: 过期后必须向服务器验证
  
  // 2. 条件请求和验证器
  // - ETag/If-None-Match: 基于资源内容的实体标签
  // - Last-Modified/If-Modified-Since: 基于资源修改时间
  // - 当缓存需要验证时，使用这些头部进行验证
  // - 如果资源未变化，服务器返回304 Not Modified
  
  // 3. 范围请求 (Range Requests)
  // - 允许客户端请求资源的一部分
  // - 使用Range头部指定范围
  // - 服务器使用206 Partial Content响应
  // - 支持断点续传和视频流的特定位置播放
  
  // 4. 新鲜度和过期机制
  // - 资源过期时间通过max-age或Expires确定
  // - 过期的资源需要验证或重新获取
  // - 验证基于条件请求机制
  
  // 5. Vary头部
  // - 指示缓存根据哪些请求头部字段区分响应版本
  // - 常用于内容协商，如语言、编码、设备特性等
  // - 例如: Vary: Accept-Language, User-Agent
}
```

## HTTP/1.1 内容协商

HTTP/1.1增强了内容协商机制，允许客户端和服务器协商最适合的内容表示形式。

```javascript
function http11ContentNegotiation() {
  // HTTP/1.1的内容协商机制:
  
  // 1. 服务器驱动协商
  // - 客户端发送偏好信息
  // - 服务器根据客户端偏好选择最佳表示形式
  // - 使用的请求头部:
  //   - Accept: 首选的媒体类型
  //   - Accept-Language: 首选的语言
  //   - Accept-Encoding: 首选的内容编码
  //   - Accept-Charset: 首选的字符集
  
  // 2. 品质因子(q值)
  // - 客户端可以为偏好分配权重(0到1)
  // - 例如: Accept-Language: en-US,en;q=0.8,fr;q=0.6
  // - q值越高表示偏好越高，默认为1
  
  // 3. 服务器响应
  // - 服务器选择最佳匹配，通过相应头部指示所选表示形式:
  //   - Content-Type: 响应的媒体类型
  //   - Content-Language: 响应的语言
  //   - Content-Encoding: 响应的编码方式
  
  // 4. Vary头部
  // - 服务器使用Vary指示用于内容协商的请求头
  // - 帮助缓存理解如何存储不同的表示形式
  // - 例如: Vary: Accept-Language, Accept-Encoding
  
  // 5. 协商的优势
  // - 支持国际化和本地化
  // - 支持不同设备和浏览器能力
  // - 优化内容传输(压缩)
  // - 提供降级替代选项
}
```

## HTTP/1.1 新增方法

HTTP/1.1扩展了请求方法，增加了更多功能，使HTTP成为更完整的应用协议。

```javascript
function http11Methods() {
  // HTTP/1.1新增的请求方法:
  
  // 1. OPTIONS
  // - 用于获取目标资源支持的通信选项
  // - 常用于CORS预检请求
  // - 例如: OPTIONS /api/data HTTP/1.1
  
  // 2. PUT
  // - 用于上传或完全替换指定资源
  // - 幂等方法: 多次调用效果相同
  // - 例如: PUT /api/users/123 HTTP/1.1
  
  // 3. DELETE
  // - 用于删除指定资源
  // - 幂等方法: 多次调用效果相同
  // - 例如: DELETE /api/users/123 HTTP/1.1
  
  // 4. TRACE
  // - 沿请求-响应链执行消息环回测试
  // - 主要用于诊断
  // - 由于安全问题，很多服务器禁用
  // - 例如: TRACE /debug HTTP/1.1
  
  // 5. CONNECT
  // - 建立到由目标资源标识的服务器的隧道
  // - 通常用于HTTPS代理
  // - 例如: CONNECT example.com:443 HTTP/1.1
  
  // HTTP/1.1对原有方法的改进:
  // - GET, HEAD: 增加条件请求和范围请求能力
  // - POST: 增加了更多的内容协商能力
  
  // HTTP/1.1方法特性:
  // - 安全方法: GET, HEAD, OPTIONS, TRACE (不应有副作用)
  // - 幂等方法: GET, HEAD, PUT, DELETE, OPTIONS, TRACE
  // - 可缓存方法: GET, HEAD (以及某些情况下的POST)
}
```

## HTTP/1.1 状态码扩展

HTTP/1.1扩展了状态码，提供了更详细的信息传达请求处理结果。

```javascript
function http11StatusCodes() {
  // HTTP/1.1新增的主要状态码:
  
  // 1xx - 信息性状态码
  // - 100 Continue: 客户端应继续请求
  // - 101 Switching Protocols: 服务器正在切换协议
  
  // 2xx - 成功状态码
  // - 203 Non-Authoritative Information: 响应内容可能来自第三方
  // - 205 Reset Content: 请求已处理，用户代理应重置文档视图
  // - 206 Partial Content: 服务器成功处理了部分GET请求(范围请求)
  
  // 3xx - 重定向状态码
  // - 303 See Other: 应使用GET方法获取响应
  // - 305 Use Proxy: 必须通过代理访问资源
  // - 307 Temporary Redirect: 临时重定向，保留请求方法
  
  // 4xx - 客户端错误状态码
  // - 405 Method Not Allowed: 请求方法不允许用于请求的资源
  // - 406 Not Acceptable: 服务器没有符合客户端内容协商条件的资源
  // - 407 Proxy Authentication Required: 需要代理身份验证
  // - 408 Request Timeout: 客户端请求超时
  // - 409 Conflict: 请求与服务器当前状态冲突
  // - 410 Gone: 资源永久不可用
  // - 411 Length Required: 需要Content-Length头部
  // - 412 Precondition Failed: 条件请求失败
  // - 413 Request Entity Too Large: 请求实体太大
  // - 414 Request-URI Too Long: 请求URI太长
  // - 415 Unsupported Media Type: 不支持的媒体类型
  // - 416 Requested Range Not Satisfiable: 范围请求不满足
  // - 417 Expectation Failed: 服务器不满足Expect头部
  
  // 5xx - 服务器错误状态码
  // - 504 Gateway Timeout: 网关超时
  // - 505 HTTP Version Not Supported: 不支持的HTTP版本
}
```

## HTTP/1.1 的局限性

尽管HTTP/1.1相比HTTP/1.0有了很大改进，但仍然存在一些限制和性能瓶颈。

```javascript
function http11Limitations() {
  // HTTP/1.1的主要局限性:
  
  // 1. 队头阻塞(Head-of-Line Blocking)
  // - 即使使用管道，响应也必须按请求顺序返回
  // - 一个慢请求会阻塞后续所有请求的处理
  // - 导致连接利用率低下
  
  // 2. 连接数限制
  // - 浏览器通常限制每个主机的连接数(通常为6-8个)
  // - 促使开发者使用域名分片(domain sharding)等变通方法
  // - 增加了DNS查询和TCP连接的开销
  
  // 3. 请求-响应模型限制
  // - 服务器不能主动推送资源
  // - 客户端必须先知道资源存在才能请求
  // - 导致额外的请求延迟
  
  // 4. 头部冗余
  // - 每个请求都会发送完整的头部
  // - 头部通常未压缩
  // - 在cookie较大时性能损失严重
  
  // 5. 协议开销
  // - 大量纯文本头部导致带宽使用效率低
  // - 状态管理复杂
  
  // 6. 安全性考虑
  // - 明文传输易受中间人攻击
  // - 没有强制加密机制
  // - 依赖HTTPS提供安全性
  
  // 解决方案:
  // - 使用多个连接(连接池)缓解队头阻塞
  // - 使用域名分片增加并发连接数
  // - 资源合并和内联减少请求数
  // - 使用SPDY和最终的HTTP/2解决根本问题
}
```

## 常见面试题

1. HTTP/1.1相比HTTP/1.0有哪些主要改进？
2. 什么是HTTP/1.1的持久连接和管道机制？
3. HTTP/1.1如何解决"队头阻塞"问题？
4. HTTP/1.1的Cache-Control头部有哪些常用指令？
5. 为什么HTTP/1.1的性能仍然不够理想？ 