/**
 * 前端认证安全演示脚本
 * 模拟安全JWT认证实现及最佳实践
 */

document.addEventListener("DOMContentLoaded", () => {
  // 获取DOM元素
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const tokenInfo = document.getElementById("tokenInfo");
  const authStatus = document.getElementById("authStatus");
  const tokenDetails = document.getElementById("tokenDetails");
  const logoutBtn = document.getElementById("logoutBtn");
  const accessProtectedBtn = document.getElementById("accessProtectedBtn");
  const protectedContent = document.getElementById("protectedContent");

  // 模拟的用户数据（实际应用中应从服务器获取）
  const mockUsers = [
    { username: "admin", password: "secure123", role: "admin" },
    { username: "user", password: "password123", role: "user" },
  ];

  // 模拟的JWT密钥（实际应用中应保存在服务器端）
  const jwtSecret = "your-256-bit-secret";

  // 初始化页面状态
  initAuthState();

  // 为表单添加提交事件监听器
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    loginSecurely(usernameInput.value, passwordInput.value);
  });

  // 登出按钮事件监听器
  logoutBtn.addEventListener("click", logoutSecurely);

  // 访问受保护资源按钮事件监听器
  accessProtectedBtn.addEventListener("click", accessProtectedResource);

  /**
   * 初始化认证状态
   */
  function initAuthState() {
    const token = getStoredToken();
    if (token && !isTokenExpired(token)) {
      // 令牌有效，显示已认证状态
      displayAuthenticatedState(token);

      // 设置令牌到期自动登出
      const payload = parseJwt(token);
      const expiryTime = payload.exp * 1000 - Date.now();
      if (expiryTime > 0) {
        setTimeout(logoutSecurely, expiryTime);
      }
    } else if (token) {
      // 令牌已过期，清除
      removeStoredToken();
    }
  }

  /**
   * 安全登录实现
   * @param {string} username 用户名
   * @param {string} password 密码
   */
  function loginSecurely(username, password) {
    // 验证输入（防XSS和注入）
    if (!validateInput(username) || !validateInput(password)) {
      showErrorMessage("无效的输入");
      return;
    }

    // 模拟服务器验证（实际应用中应通过HTTPS发送到服务器）
    const user = mockUsers.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      // 生成JWT令牌
      const token = generateMockJwt(user);

      // 安全存储令牌
      securelyStoreToken(token);

      // 更新UI为已认证状态
      displayAuthenticatedState(token);

      // 设置令牌自动过期
      const payload = parseJwt(token);
      const expiryTime = payload.exp * 1000 - Date.now();
      setTimeout(logoutSecurely, expiryTime);

      // 清空表单
      loginForm.reset();
    } else {
      showErrorMessage("用户名或密码错误");
    }
  }

  /**
   * 安全登出实现
   */
  function logoutSecurely() {
    // 移除令牌
    removeStoredToken();

    // 更新UI到未认证状态
    tokenInfo.style.display = "none";
    protectedContent.style.display = "none";
    loginForm.style.display = "block";

    // 在实际应用中，还应通知服务器使该令牌失效
    console.log("用户已安全登出");
  }

  /**
   * 访问受保护资源
   */
  function accessProtectedResource() {
    const token = getStoredToken();

    if (!token || isTokenExpired(token)) {
      showErrorMessage("未授权，请先登录");
      logoutSecurely();
      return;
    }

    // 验证令牌和权限
    const payload = parseJwt(token);

    // 显示受保护内容
    protectedContent.style.display = "block";

    // 实际应用中应使用令牌请求受保护的API
    console.log("已验证访问权限");
  }

  /**
   * 显示已认证状态
   * @param {string} token JWT令牌
   */
  function displayAuthenticatedState(token) {
    const payload = parseJwt(token);

    loginForm.style.display = "none";
    tokenInfo.style.display = "block";

    authStatus.innerHTML = `<div class="success-message">已认证用户: ${payload.username} (${payload.role})</div>`;
    tokenDetails.innerHTML = `
      <div>
        <strong>令牌有效期至:</strong> ${new Date(
          payload.exp * 1000
        ).toLocaleString()}
      </div>
      <div>
        <strong>JWT格式:</strong>
        <pre style="overflow-x: auto;">${formatJwt(token)}</pre>
      </div>
    `;
  }

  /**
   * 生成模拟JWT令牌
   * @param {object} user 用户对象
   * @returns {string} JWT令牌
   */
  function generateMockJwt(user) {
    // 注意：这是前端演示用途，实际应用中JWT应在服务器端生成

    // 创建头部
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    // 创建载荷
    const payload = {
      sub: crypto.randomUUID(), // 随机用户ID
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000), // 发行时间
      exp: Math.floor(Date.now() / 1000) + 900, // 15分钟后过期
    };

    // Base64编码
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));

    // 在实际应用中，这里应使用HMAC-SHA256算法生成签名
    // 这里简化处理，实际应用中绝不应在前端签名
    const signature = btoa(Math.random().toString(36).substring(2));

    // 拼接JWT
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * 解析JWT令牌
   * @param {string} token JWT令牌
   * @returns {object} 解析后的载荷部分
   */
  function parseJwt(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch (error) {
      console.error("解析令牌失败:", error);
      return {};
    }
  }

  /**
   * 检查令牌是否过期
   * @param {string} token JWT令牌
   * @returns {boolean} 是否过期
   */
  function isTokenExpired(token) {
    try {
      const payload = parseJwt(token);
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }

  /**
   * 安全存储令牌
   * @param {string} token JWT令牌
   */
  function securelyStoreToken(token) {
    // 在实际应用中，最佳做法是使用HttpOnly Cookie
    // 这里为了演示使用localStorage
    localStorage.setItem("authToken", token);

    // 注意：实际应用中，如果使用localStorage存储JWT，
    // 应考虑加密存储并实施其他保护措施
  }

  /**
   * 获取存储的令牌
   * @returns {string|null} JWT令牌或null
   */
  function getStoredToken() {
    return localStorage.getItem("authToken");
  }

  /**
   * 移除存储的令牌
   */
  function removeStoredToken() {
    localStorage.removeItem("authToken");
  }

  /**
   * 格式化JWT令牌显示
   * @param {string} token JWT令牌
   * @returns {string} 格式化的JWT
   */
  function formatJwt(token) {
    const parts = token.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2].substring(0, 8)}...`;
  }

  /**
   * 验证输入（防XSS和注入）
   * @param {string} input 用户输入
   * @returns {boolean} 是否有效
   */
  function validateInput(input) {
    // 基本输入验证
    if (!input || input.length < 3 || input.length > 50) {
      return false;
    }

    // 禁止特殊字符（根据需要调整）
    const pattern = /^[\w@.]+$/;
    return pattern.test(input);
  }

  /**
   * 显示错误消息
   * @param {string} message 错误消息
   */
  function showErrorMessage(message) {
    authStatus.innerHTML = `<div class="error-message">${message}</div>`;
    tokenInfo.style.display = "block";
    setTimeout(() => {
      if (!getStoredToken()) {
        tokenInfo.style.display = "none";
      }
    }, 3000);
  }
});
