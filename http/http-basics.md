# HTTP 基础知识

## HTTP 简介

HTTP(HyperText Transfer Protocol，超文本传输协议)是一种用于分布式、协作式和超媒体信息系统的应用层协议，是Web的基础。

### HTTP协议的基本特点
- 基于客户端-服务器架构
- 简单快速：客户端向服务器发送请求时，只需传送请求方法和路径
- 灵活：允许传输任意类型的数据对象
- 无状态：协议对于事务处理没有记忆能力
- 无连接：限制每次连接只处理一个请求

### HTTP的工作原理
1. 客户端建立与服务器的TCP连接
2. 客户端发送HTTP请求报文
3. 服务器处理请求并返回HTTP响应报文
4. 连接关闭

### HTTP的发展历史
- HTTP/0.9: 1991年，只支持GET方法，不支持请求头
- HTTP/1.0: 1996年，增加了POST和HEAD方法，支持请求头和响应头
- HTTP/1.1: 1997年，标准化，支持持久连接和管道机制
- HTTP/2.0: 2015年，多路复用，头部压缩，服务器推送等优化
- HTTP/3.0: 正在发展中，基于QUIC协议的新一代HTTP协议

## HTTP 请求

HTTP请求由请求行、请求头和请求体三部分组成。

### HTTP请求的组成部分

#### 1. 请求行 (Request Line)
- 请求方法：如GET, POST, PUT, DELETE等
- 请求资源的URL
- HTTP协议版本
- 例如: `GET /index.html HTTP/1.1`

#### 2. 请求头 (Request Headers)
- 包含有关请求的附加信息，如浏览器类型、接受的内容类型等
- 格式为"名称: 值"，每行一个头部字段
- 常见请求头:
  - `Host: example.com`
  - `User-Agent: Mozilla/5.0 ...`
  - `Accept: text/html,application/xhtml+xml,...`
  - `Accept-Language: en-US,en;q=0.9`
  - `Connection: keep-alive`

#### 3. 请求体 (Request Body)
- 包含客户端向服务器发送的数据
- 用于POST, PUT等请求方法
- 根据Content-Type不同，格式也不同(如表单数据、JSON、XML等)

### HTTP请求示例

```
POST /api/users HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Content-Type: application/json
Content-Length: 45

{"name":"John Doe","email":"john@example.com"}
```

## HTTP 响应

HTTP响应由状态行、响应头和响应体三部分组成。

### HTTP响应的组成部分

#### 1. 状态行 (Status Line)
- HTTP协议版本
- 状态码：表示请求处理的结果
- 状态消息：对状态码的文本描述
- 例如: `HTTP/1.1 200 OK`

#### 2. 响应头 (Response Headers)
- 包含有关响应的附加信息
- 格式为"名称: 值"，每行一个头部字段
- 常见响应头:
  - `Content-Type: text/html; charset=UTF-8`
  - `Content-Length: 2048`
  - `Server: nginx/1.18.0`
  - `Date: Wed, 21 Oct 2023 07:28:00 GMT`
  - `Set-Cookie: sessionId=abc123; Path=/`

#### 3. 响应体 (Response Body)
- 包含服务器返回的数据
- 根据Content-Type不同，格式也不同(如HTML文档、JSON数据等)

### HTTP响应示例

```
HTTP/1.1 200 OK
Date: Wed, 21 Oct 2023 07:28:00 GMT
Server: Apache/2.4.41 (Unix)
Content-Type: text/html; charset=UTF-8
Content-Length: 138

<!DOCTYPE html>
<html>
<head>
  <title>Example Page</title>
</head>
<body>
  <h1>Hello, World!</h1>
</body>
</html>
```

## HTTP 状态码

HTTP状态码是服务器向客户端返回的三位数字代码，表示请求的处理结果。

### HTTP状态码分为5类

#### 1xx: 信息性状态码 - 请求已接收，继续处理
- **100 Continue**: 服务器已收到请求的初始部分，客户端应继续发送剩余部分
- **101 Switching Protocols**: 服务器正在根据客户端的请求切换协议

#### 2xx: 成功状态码 - 请求成功接收、理解和处理
- **200 OK**: 请求成功，响应中包含请求的资源
- **201 Created**: 请求成功，并创建了新资源
- **204 No Content**: 请求成功，但没有返回任何内容
- **206 Partial Content**: 服务器已处理部分GET请求(范围请求)

#### 3xx: 重定向状态码 - 需要客户端采取进一步操作
- **301 Moved Permanently**: 请求的资源已永久移动到新位置
- **302 Found**: 请求的资源暂时位于不同的URI(临时重定向)
- **304 Not Modified**: 资源未被修改，可使用缓存版本
- **307 Temporary Redirect**: 临时重定向，但要求客户端使用相同方法
- **308 Permanent Redirect**: 永久重定向，但要求客户端使用相同方法

#### 4xx: 客户端错误状态码 - 客户端请求包含错误
- **400 Bad Request**: 服务器无法理解请求语法
- **401 Unauthorized**: 请求需要身份验证
- **403 Forbidden**: 服务器拒绝执行请求
- **404 Not Found**: 服务器找不到请求的资源
- **405 Method Not Allowed**: 请求方法对指定资源不允许
- **429 Too Many Requests**: 客户端发送了太多请求

#### 5xx: 服务器错误状态码 - 服务器处理请求时出错
- **500 Internal Server Error**: 服务器遇到意外情况，无法完成请求
- **501 Not Implemented**: 服务器不支持请求所需的功能
- **502 Bad Gateway**: 作为网关的服务器收到来自上游服务器的无效响应
- **503 Service Unavailable**: 服务器暂时无法处理请求(过载或维护)
- **504 Gateway Timeout**: 作为网关的服务器未能及时从上游服务器获得响应

## HTTP 方法

HTTP方法定义了对资源要执行的操作类型。

### 常用HTTP方法

#### GET
- 获取资源
- 只用于获取数据，不应有其他副作用
- 数据通过URL参数传递
- 请求可被缓存
- 例如: `GET /api/users?id=123`

#### POST
- 创建资源
- 可能改变服务器状态或有副作用
- 数据通过请求体传递
- 请求不可被缓存
- 例如: `POST /api/users`

#### PUT
- 更新资源(完整替换)
- 幂等操作(多次执行结果相同)
- 数据通过请求体传递
- 例如: `PUT /api/users/123`

#### DELETE
- 删除资源
- 幂等操作
- 例如: `DELETE /api/users/123`

#### PATCH
- 部分更新资源
- 不同于PUT，只更新指定的字段
- 例如: `PATCH /api/users/123`

#### HEAD
- 和GET相同，但不返回响应体
- 用于获取资源的元信息
- 例如: `HEAD /api/users/123`

#### OPTIONS
- 获取目标资源支持的通信选项
- 常用于CORS预检请求
- 例如: `OPTIONS /api/users`

#### TRACE
- 沿请求-响应链执行消息环回测试
- 主要用于调试

#### CONNECT
- 建立到目标资源的隧道
- 常用于HTTPS连接的SSL隧道

## HTTP 头部

HTTP头部字段包含了关于请求、响应和要传输的资源的重要信息。

### 常见的HTTP请求头

- **Accept**: 客户端能够处理的内容类型
- **Accept-Charset**: 客户端能够处理的字符集
- **Accept-Encoding**: 客户端能够处理的编码方式(如gzip)
- **Accept-Language**: 客户端期望的自然语言
- **Authorization**: 身份验证凭证
- **Cache-Control**: 缓存控制指令
- **Connection**: 连接管理
- **Content-Length**: 请求体的字节长度
- **Content-Type**: 请求体的媒体类型
- **Cookie**: 先前由服务器通过Set-Cookie设置的HTTP cookie
- **Host**: 请求的目标主机名和端口号
- **If-Modified-Since**: 仅当资源在指定时间后有修改时才返回
- **Origin**: 发起跨域请求的源
- **Referer**: 当前请求页面的上一个页面的地址
- **User-Agent**: 客户端软件的标识字符串

### 常见的HTTP响应头

- **Access-Control-Allow-Origin**: 指定允许跨域的源
- **Age**: 对象在代理缓存中的时间(秒)
- **Cache-Control**: 缓存控制指令
- **Connection**: 连接管理
- **Content-Disposition**: 指示内容是否应该内联显示或作为附件下载
- **Content-Encoding**: 内容的编码方式
- **Content-Language**: 内容的自然语言
- **Content-Length**: 响应体的字节长度
- **Content-Type**: 响应体的媒体类型
- **Date**: 消息生成的日期和时间
- **ETag**: 资源的特定版本的标识符
- **Expires**: 资源过期的日期和时间
- **Last-Modified**: 资源的最后修改日期和时间
- **Location**: 重定向请求的目标URI
- **Server**: 处理请求的源服务器软件
- **Set-Cookie**: 设置HTTP cookie
- **WWW-Authenticate**: 表明获取资源的身份验证方法

## 常见面试题

1. HTTP和HTTPS的主要区别是什么？
2. 解释HTTP的无状态性以及如何克服它？
3. HTTP的各个版本(1.0、1.1、2.0、3.0)有什么主要区别？
4. 描述HTTP缓存机制的工作原理。
5. 什么是RESTful API？它如何利用HTTP方法来操作资源？ 