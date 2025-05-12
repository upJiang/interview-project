/**
 * HTTP 状态码
 *
 * HTTP 状态码是服务器对浏览器的请求返回的响应码，用来表示服务器响应的状态。
 * 状态码分为五类：
 * 1xx: 信息响应 - 请求已接收，继续处理
 * 2xx: 成功响应 - 请求已成功接收、理解和处理
 * 3xx: 重定向 - 需要进一步操作以完成请求
 * 4xx: 客户端错误 - 请求包含语法错误或请求无法实现
 * 5xx: 服务器错误 - 服务器在处理请求过程中发生错误
 */

// HTTP 状态码及其含义
const httpStatusCodes = {
  // 1xx: 信息响应
  100: {
    name: "Continue",
    description: "服务器已收到请求的初始部分，客户端应继续请求",
  },
  101: {
    name: "Switching Protocols",
    description: "服务器正在根据客户端的请求切换协议",
    example: "从HTTP/1.1升级到WebSocket",
  },
  102: {
    name: "Processing",
    description: "服务器已收到并正在处理请求，但没有响应可用",
  },

  // 2xx: 成功响应
  200: {
    name: "OK",
    description: "请求成功。一般用于GET与POST请求",
    explanation: "最常见的HTTP状态码，表示请求已成功处理",
  },
  201: {
    name: "Created",
    description: "请求已成功，并创建了新的资源",
    example: "POST请求创建新用户后可能返回201",
  },
  202: {
    name: "Accepted",
    description: "请求已接收，但尚未处理完成",
    example: "批处理操作可能返回此状态",
  },
  204: {
    name: "No Content",
    description: "请求成功，但没有返回任何内容",
    example: "DELETE操作成功可能返回204",
  },
  206: {
    name: "Partial Content",
    description: "服务器已完成对资源的部分GET请求",
    example: "断点续传或分块下载时使用",
  },

  // 3xx: 重定向
  300: {
    name: "Multiple Choices",
    description: "请求有多个可能的响应",
    example: "服务器提供多种格式的资源，客户端需选择",
  },
  301: {
    name: "Moved Permanently",
    description: "请求的资源已永久移动到新位置",
    explanation: "所有对此资源的future请求都应使用新URI",
    example: "网站域名更改时使用",
  },
  302: {
    name: 'Found (Previously "Moved Temporarily")',
    description: "请求的资源临时从不同的URI响应请求",
    explanation: "后续请求仍应使用原始URI",
    example: "临时重定向到另一个页面",
  },
  303: {
    name: "See Other",
    description:
      "服务器发送此响应，以指示客户端通过GET请求在另一个URI上获取所请求的资源",
    example: "表单提交后重定向到成功页面",
  },
  304: {
    name: "Not Modified",
    description: "资源未修改，可使用客户端缓存的版本",
    explanation: "用于条件性请求，如带有If-Modified-Since头的请求",
    example: "浏览器缓存验证时使用",
  },
  307: {
    name: "Temporary Redirect",
    description: "资源临时位于不同URI，但客户端应继续使用原始URI进行future请求",
    difference: "与302相比，确保请求方法和主体不变",
  },
  308: {
    name: "Permanent Redirect",
    description: "资源已永久移动到新位置，客户端应使用新位置",
    difference: "与301相比，确保请求方法和主体不变",
  },

  // 4xx: 客户端错误
  400: {
    name: "Bad Request",
    description: "服务器无法理解请求",
    explanation: "请求可能包含语法错误或无效参数",
    example: "请求JSON格式错误",
  },
  401: {
    name: "Unauthorized",
    description: "请求需要用户身份验证",
    explanation: "需要提供有效的认证凭据",
    example: "未提供JWT令牌或令牌无效",
  },
  403: {
    name: "Forbidden",
    description: "服务器理解请求但拒绝授权",
    explanation: "与401不同，身份验证不会有所帮助",
    example: "用户无权访问受限资源",
  },
  404: {
    name: "Not Found",
    description: "服务器找不到请求的资源",
    explanation: "最常见的错误状态码之一",
    example: "访问不存在的URL",
  },
  405: {
    name: "Method Not Allowed",
    description: "请求方法不允许用于请求的资源",
    example: "尝试对只支持GET的资源发起POST请求",
  },
  406: {
    name: "Not Acceptable",
    description: "无法根据请求中的Accept头生成满足条件的响应",
    example: "客户端只接受JSON，但服务器只能提供XML",
  },
  408: {
    name: "Request Timeout",
    description: "服务器在等待请求时超时",
    example: "客户端发起请求但未完成，服务器断开连接",
  },
  409: {
    name: "Conflict",
    description: "请求与服务器当前状态冲突",
    example: "尝试上传的文件版本低于服务器上的版本",
  },
  413: {
    name: "Payload Too Large",
    description: "请求体超过服务器定义的限制",
    example: "上传超过大小限制的文件",
  },
  415: {
    name: "Unsupported Media Type",
    description: "请求的媒体格式不被服务器支持",
    example: "发送XML但服务器只支持JSON",
  },
  429: {
    name: "Too Many Requests",
    description: "用户在给定时间内发送了太多请求(频率限制)",
    example: "API限制每分钟60个请求，用户已超过此限制",
  },

  // 5xx: 服务器错误
  500: {
    name: "Internal Server Error",
    description: "服务器遇到意外情况，无法完成请求",
    explanation: "最常见的服务器错误状态码",
    example: "服务器代码中的未捕获异常",
  },
  501: {
    name: "Not Implemented",
    description: "服务器不支持完成请求所需的功能",
    example: "服务器不支持请求的HTTP方法",
  },
  502: {
    name: "Bad Gateway",
    description: "服务器作为网关或代理，从上游服务器收到无效响应",
    example: "正确配置的反向代理无法连接到后端服务或收到无效响应",
  },
  503: {
    name: "Service Unavailable",
    description: "服务器暂时无法处理请求",
    explanation: "通常是由于服务器过载或维护",
    example: "服务器正在维护或流量过大时",
  },
  504: {
    name: "Gateway Timeout",
    description: "服务器作为网关或代理，未及时从上游服务器接收响应",
    example: "后端API请求超时",
  },
};

// 状态码分类的总结
const statusCodeCategories = {
  "1xx": {
    name: "信息响应",
    description:
      "请求已接收，继续处理。这类响应是临时响应，只包含状态行和某些可选的响应头信息，以空行结尾。",
  },
  "2xx": {
    name: "成功响应",
    description: "请求已成功接收、理解和处理。",
  },
  "3xx": {
    name: "重定向",
    description:
      "需要客户端进一步操作才能完成请求。通常，这些状态码用来重定向。",
  },
  "4xx": {
    name: "客户端错误",
    description:
      "客户端请求包含语法错误或无法完成请求。这些状态码表示错误来自客户端。",
  },
  "5xx": {
    name: "服务器错误",
    description:
      "服务器在处理请求过程中发生错误。这些状态码表示服务器在尝试处理请求时发生内部错误。这些错误可能是服务器本身的错误，而不是请求出错。",
  },
};

// 特别需要了解的状态码
const mostImportantStatusCodes = [
  200, // OK
  201, // Created
  204, // No Content
  301, // Moved Permanently
  302, // Found
  304, // Not Modified
  400, // Bad Request
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  405, // Method Not Allowed
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
];

/**
 * 示例：处理不同HTTP状态码的通用函数
 */
function handleHttpResponse(response) {
  const { status } = response;

  // 2xx: 成功响应
  if (status >= 200 && status < 300) {
    console.log("请求成功!");
    return response.json(); // 或者其他处理
  }

  // 3xx: 重定向
  if (status >= 300 && status < 400) {
    if (status === 301 || status === 302) {
      console.log("资源已被移动");
      // 处理重定向
    } else if (status === 304) {
      console.log("使用缓存的资源");
      // 使用缓存
    }
    return null;
  }

  // 4xx: 客户端错误
  if (status >= 400 && status < 500) {
    if (status === 401) {
      console.log("需要身份验证");
      // 跳转到登录页面
    } else if (status === 403) {
      console.log("没有权限");
      // 显示无权访问消息
    } else if (status === 404) {
      console.log("资源不存在");
      // 显示404页面
    } else if (status === 429) {
      console.log("请求过于频繁");
      // 实现退避算法
    } else {
      console.log("请求错误");
      // 显示一般错误信息
    }
    throw new Error("客户端错误: " + status);
  }

  // 5xx: 服务器错误
  if (status >= 500) {
    console.log("服务器错误");
    // 显示友好的错误信息
    throw new Error("服务器错误: " + status);
  }

  return null;
}

/**
 * 状态码与RESTful API的关系
 */
const restfulApiStatusCodes = {
  GET: {
    success: 200, // OK
    notFound: 404, // Not Found
  },
  POST: {
    success: 201, // Created
    badRequest: 400, // Bad Request
    unauthorized: 401, // Unauthorized
    forbidden: 403, // Forbidden
  },
  PUT: {
    success: 200, // OK
    badRequest: 400, // Bad Request
    notFound: 404, // Not Found
  },
  PATCH: {
    success: 200, // OK
    badRequest: 400, // Bad Request
    notFound: 404, // Not Found
  },
  DELETE: {
    success: 204, // No Content
    notFound: 404, // Not Found
  },
};

/**
 * 面试中常见的HTTP状态码问题：
 *
 * 1. 请解释一下2xx, 3xx, 4xx, 5xx状态码分别代表什么？
 * 2. 301和302重定向的区别是什么？
 * 3. 401和403状态码有什么区别？
 * 4. 什么情况下会返回204状态码？
 * 5. 如何正确处理API返回的429状态码？
 * 6. 500和502状态码的区别是什么？
 * 7. 304状态码的作用是什么，浏览器如何使用它？
 * 8. RESTful API中，创建资源成功应该返回什么状态码？
 * 9. 面对不同的HTTP状态码，前端应该如何处理？
 * 10. 在微服务架构中，502和504状态码通常表示什么问题？
 */

// 导出供其他模块使用
module.exports = {
  httpStatusCodes,
  statusCodeCategories,
  mostImportantStatusCodes,
  handleHttpResponse,
  restfulApiStatusCodes,
};
