/**
 * CSRF防御演示脚本
 */

document.addEventListener("DOMContentLoaded", () => {
  // 获取DOM元素
  const secureForm = document.getElementById("secureForm");
  const requestStatus = document.getElementById("requestStatus");
  const showRequestBtn = document.getElementById("showRequestBtn");
  const requestCode = document.getElementById("requestCode");

  // 初始化请求状态
  requestStatus.textContent = "请填写表单并提交以测试CSRF防御措施";

  // 生成并设置CSRF令牌
  const token = generateCSRFToken();
  document.getElementById("csrfToken").value = token;

  // 设置Double Submit Cookie
  document.cookie = `CSRF-TOKEN=${token}; SameSite=Strict; Path=/`;

  // 为表单添加提交事件监听器
  secureForm.addEventListener("submit", handleFormSubmit);

  // 为显示请求代码按钮添加点击事件
  showRequestBtn.addEventListener("click", () => {
    if (requestCode.style.display === "none") {
      requestCode.style.display = "block";
      showRequestBtn.textContent = "隐藏请求代码";
      showRequestExamples();
    } else {
      requestCode.style.display = "none";
      showRequestBtn.textContent = "显示请求代码";
    }
  });

  /**
   * 生成CSRF令牌
   * 在实际应用中，令牌应该由服务器生成
   */
  function generateCSRFToken() {
    return Array(32)
      .fill(0)
      .map(() => Math.random().toString(36).charAt(2))
      .join("");
  }

  /**
   * 处理表单提交
   */
  function handleFormSubmit(event) {
    event.preventDefault();

    // 获取表单数据
    const username = document.getElementById("username").value;
    const action = document.getElementById("action").value;
    const formToken = document.getElementById("csrfToken").value;

    // 获取Cookie中的CSRF令牌
    const cookieToken = getCookie("CSRF-TOKEN");

    // 验证令牌是否存在且一致
    if (!formToken || !cookieToken || formToken !== cookieToken) {
      // 令牌验证失败
      setRequestStatus("错误：CSRF令牌验证失败！令牌不匹配或缺失。", true);
      return false;
    }

    // 令牌验证成功，模拟发送请求
    const requestData = {
      username: username,
      action: action,
      csrf_token: formToken,
    };

    // 在实际应用中，这里会发送AJAX请求到服务器
    // 服务器端也需要验证CSRF令牌
    console.log("发送请求数据:", requestData);

    // 显示成功信息
    setRequestStatus(
      `成功：表单已安全提交，CSRF令牌验证通过！用户名: ${username}, 操作: ${action}`,
      false
    );

    // 每次提交后重新生成令牌（增强安全性）
    const newToken = generateCSRFToken();
    document.getElementById("csrfToken").value = newToken;
    document.cookie = `CSRF-TOKEN=${newToken}; SameSite=Strict; Path=/`;
  }

  /**
   * 从Cookie中获取值
   */
  function getCookie(name) {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        return cookie.substring(name.length + 1);
      }
    }
    return "";
  }

  /**
   * 设置请求状态显示
   */
  function setRequestStatus(message, isError) {
    requestStatus.textContent = message;
    requestStatus.style.backgroundColor = isError ? "#fadbd8" : "#d5f5e3";
    requestStatus.style.borderColor = isError ? "#e74c3c" : "#2ecc71";
  }

  /**
   * 显示请求代码示例
   */
  function showRequestExamples() {
    const token = document.getElementById("csrfToken").value;

    const requestExample = `
<h4>安全的AJAX请求示例</h4>
<pre style="background-color: #f1f1f1; padding: 10px; overflow-x: auto;">
// 使用Fetch API发送带CSRF令牌的请求
fetch('/api/user/update', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': '${token}',  // 在请求头中包含CSRF令牌
        'X-Requested-With': 'XMLHttpRequest'  // 表明这是AJAX请求
    },
    credentials: 'same-origin',  // 确保发送Cookie
    body: JSON.stringify({
        username: 'example_user',
        action: 'update',
        csrf_token: '${token}'  // 在请求体中也包含CSRF令牌
    })
})
.then(response => response.json())
.then(data => console.log('请求成功:', data))
.catch(error => console.error('请求失败:', error));
</pre>

<h4>服务器端验证示例 (Node.js + Express)</h4>
<pre style="background-color: #f1f1f1; padding: 10px; overflow-x: auto;">
// Express中间件验证CSRF令牌
function validateCSRFToken(req, res, next) {
    // 获取请求中的令牌（可能在请求头或请求体中）
    const requestToken = req.headers['x-csrf-token'] || req.body.csrf_token;
    
    // 获取Cookie中的令牌
    const cookieToken = req.cookies['CSRF-TOKEN'];
    
    // 验证令牌
    if (!requestToken || !cookieToken || requestToken !== cookieToken) {
        return res.status(403).json({ error: 'CSRF验证失败' });
    }
    
    // 验证通过，继续处理请求
    next();
}

// 应用中间件到需要保护的路由
app.post('/api/user/update', validateCSRFToken, (req, res) => {
    // 处理请求...
    res.json({ success: true });
});
</pre>
        `;

    requestCode.innerHTML = requestExample;
  }
});
 