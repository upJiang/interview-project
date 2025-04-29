/**
 * SSRF防御演示脚本
 * 注意：真实的SSRF防御应在服务器端实现，此脚本仅作为前端演示
 */

document.addEventListener("DOMContentLoaded", () => {
  // 获取DOM元素
  const imageUrlInput = document.getElementById("imageUrl");
  const fetchImageBtn = document.getElementById("fetchImage");
  const urlValidationResult = document.getElementById("urlValidationResult");
  const imageResult = document.getElementById("imageResult");

  // 为按钮添加事件监听器
  fetchImageBtn.addEventListener("click", () => {
    const url = imageUrlInput.value.trim();
    processImageUrl(url);
  });

  // 为输入框添加回车事件
  imageUrlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const url = imageUrlInput.value.trim();
      processImageUrl(url);
    }
  });

  // 处理图片URL
  function processImageUrl(url) {
    // 清空之前的结果
    urlValidationResult.innerHTML = "";
    imageResult.innerHTML = "";

    // 设置默认样式
    urlValidationResult.style.padding = "10px";
    urlValidationResult.style.borderRadius = "4px";

    // 验证URL
    const validation = validateUrl(url);

    if (!validation.valid) {
      // URL验证失败
      urlValidationResult.style.backgroundColor = "#fadbd8";
      urlValidationResult.style.border = "1px solid #e74c3c";
      urlValidationResult.innerHTML = `<strong>URL验证失败：</strong> ${validation.reason}`;
      return;
    }

    // URL验证通过，显示安全提示
    urlValidationResult.style.backgroundColor = "#d5f5e3";
    urlValidationResult.style.border = "1px solid #2ecc71";
    urlValidationResult.innerHTML =
      "<strong>URL验证通过！</strong> 这是一个安全的URL请求。";

    // 显示如何在服务器端安全处理此请求
    displayServerSideCode(url);

    // 仅用于演示 - 在真实环境中，应该通过服务器端代理请求图片
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
      displayImage(url);
    } else {
      imageResult.innerHTML = `
                <div style="padding: 10px; background-color: #ebf5fb; border: 1px solid #3498db; border-radius: 4px;">
                    <p><strong>注意：</strong> 此URL不是图片格式。在实际应用中，服务器应验证响应内容类型。</p>
                </div>
            `;
    }
  }

  /**
   * 综合的URL安全验证函数
   * @param {string} url 待验证的URL
   * @returns {Object} 返回验证结果和错误信息
   */
  function validateUrl(url) {
    try {
      // 检查URL是否为空
      if (!url || typeof url !== "string") {
        return { valid: false, reason: "URL为空或格式不正确" };
      }

      // 尝试解析URL
      const parsedUrl = new URL(url);

      // 检查协议
      const allowedProtocols = ["http:", "https:"];
      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        return { valid: false, reason: `不允许的协议: ${parsedUrl.protocol}` };
      }

      // 检查是否为localhost或127.0.0.1
      if (
        parsedUrl.hostname === "localhost" ||
        /^127\.0\.0\.\d{1,3}$/.test(parsedUrl.hostname)
      ) {
        return { valid: false, reason: "不允许请求本地地址" };
      }

      // 检查是否为内网IP
      const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const ipMatch = parsedUrl.hostname.match(ipv4Pattern);

      if (ipMatch) {
        const octets = ipMatch.slice(1).map((octet) => parseInt(octet, 10));

        // 检查IP地址格式是否有效
        if (octets.some((octet) => isNaN(octet) || octet < 0 || octet > 255)) {
          return { valid: false, reason: "IP地址格式无效" };
        }

        // 检查常见内网IP范围
        if (
          octets[0] === 10 || // 10.0.0.0/8
          (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || // 172.16.0.0/12
          (octets[0] === 192 && octets[1] === 168) || // 192.168.0.0/16
          (octets[0] === 169 && octets[1] === 254) || // 169.254.0.0/16
          octets[0] === 127 // 127.0.0.0/8
        ) {
          return { valid: false, reason: "不允许请求内网IP地址" };
        }
      }

      // 演示目的 - 允许访问某些公共图片服务
      const whitelistedDomains = [
        "via.placeholder.com",
        "picsum.photos",
        "images.unsplash.com",
        "dummyimage.com",
        "placekitten.com",
      ];

      // 如果启用严格白名单，则只允许已列出的域名
      const enableStrictWhitelist = true;
      if (enableStrictWhitelist) {
        let isWhitelisted = false;

        for (const domain of whitelistedDomains) {
          if (
            parsedUrl.hostname === domain ||
            parsedUrl.hostname.endsWith("." + domain)
          ) {
            isWhitelisted = true;
            break;
          }
        }

        if (!isWhitelisted) {
          return {
            valid: false,
            reason: `域名不在白名单中。演示环境仅允许: ${whitelistedDomains.join(
              ", "
            )}`,
          };
        }
      }

      // 检查端口
      const bannedPorts = [22, 23, 25, 445, 3306, 5432, 6379, 27017];
      if (
        parsedUrl.port &&
        bannedPorts.includes(parseInt(parsedUrl.port, 10))
      ) {
        return { valid: false, reason: `不允许请求端口: ${parsedUrl.port}` };
      }

      // 验证通过
      return { valid: true, reason: "" };
    } catch (e) {
      return { valid: false, reason: `URL解析错误: ${e.message}` };
    }
  }

  /**
   * 显示图片（仅用于演示）
   * 在实际应用中，应使用服务器端代理来获取图片
   */
  function displayImage(url) {
    imageResult.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>说明：</strong> 在实际应用中，下面的图片应通过服务器端代理获取，而不是直接显示。
            </div>
            <div style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                <img src="${url}" alt="验证后的图片" style="max-width: 100%; max-height: 300px;" onerror="this.onerror=null;this.src='';this.alt='图片加载失败';this.style.display='none';document.getElementById('loadError').style.display='block';">
                <div id="loadError" style="display: none; color: #e74c3c; padding: 20px;">图片加载失败</div>
            </div>
        `;
  }

  /**
   * 显示服务器端安全处理代码
   */
  function displayServerSideCode(url) {
    const secureServerCode = `
            <div style="margin-top: 15px;">
                <h4>安全处理此请求的服务器端代码示例 (Node.js)</h4>
                <pre style="background-color: #f1f1f1; padding: 10px; overflow-x: auto; font-size: 12px;">
// 图片代理服务示例 (Express.js)
const express = require('express');
const axios = require('axios');
const url = require('url');
const app = express();

// 图片代理端点
app.get('/proxy-image', async (req, res) => {
    try {
        // 获取要代理的URL
        const imageUrl = req.query.url;
        
        // 验证URL
        const validation = validateUrl(imageUrl);
        if (!validation.valid) {
            return res.status(400).send({ error: validation.reason });
        }
        
        // 设置请求选项
        const options = {
            method: 'GET',
            url: imageUrl,
            responseType: 'stream',
            timeout: 5000,  // 5秒超时
            maxRedirects: 2,  // 最多允许2次重定向
            validateStatus: status => status >= 200 && status < 300,
            headers: {
                'User-Agent': 'ImageProxyService/1.0'
            }
        };
        
        // 发送请求
        const response = await axios(options);
        
        // 验证内容类型
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
            return res.status(400).send({ error: '不是有效的图片' });
        }
        
        // 转发响应头
        res.set('Content-Type', contentType);
        res.set('Content-Length', response.headers['content-length']);
        res.set('Cache-Control', 'public, max-age=86400');
        
        // 发送图片数据
        response.data.pipe(res);
    } catch (error) {
        console.error('图片代理错误:', error);
        res.status(500).send({ error: '获取图片失败' });
    }
});

// 启动服务器
app.listen(3000, () => {
    console.log('图片代理服务运行在端口3000');
});

// URL验证函数
function validateUrl(imageUrl) {
    try {
        // 这里实现与前端类似的验证逻辑
        // ...
    } catch (e) {
        return { valid: false, reason: \`URL解析错误: \${e.message}\` };
    }
}
                </pre>
            </div>
        `;

    imageResult.innerHTML += secureServerCode;
  }

  // 设置示例URL
  imageUrlInput.value = "https://via.placeholder.com/350x150";
});
