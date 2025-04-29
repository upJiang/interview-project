/**
 * 前端支付安全演示脚本
 * 展示电商平台支付流程中的安全最佳实践
 */

document.addEventListener("DOMContentLoaded", () => {
  // 常量定义（实际应用中敏感值应从服务器获取，不应硬编码）
  const API_SECRET_KEY = "abc123456789demo_key"; // 仅作演示用途
  const ENCRYPT_KEY = "8a7b6c5d4e3f2g1h"; // 16位AES密钥，演示用
  const ENCRYPT_IV = "1a2b3c4d5e6f7g8h"; // 16位初始向量，演示用

  // 获取DOM元素
  const createOrderBtn = document.getElementById("createOrderBtn");
  const orderInfo = document.getElementById("orderInfo");
  const orderId = document.getElementById("orderId");
  const orderTime = document.getElementById("orderTime");
  const orderSign = document.getElementById("orderSign");
  const paymentForm = document.getElementById("paymentForm");
  const cardNumber = document.getElementById("cardNumber");
  const expiryDate = document.getElementById("expiryDate");
  const cvv = document.getElementById("cvv");
  const payBtn = document.getElementById("payBtn");
  const paymentResult = document.getElementById("paymentResult");

  // 为创建订单按钮添加事件监听器
  createOrderBtn.addEventListener("click", handleCreateOrder);

  // 为支付按钮添加事件监听器
  payBtn.addEventListener("click", handlePayment);

  // 初始化信用卡输入安全处理
  initSecureCreditCardInput();

  /**
   * 处理创建订单操作
   */
  function handleCreateOrder() {
    try {
      // 禁用按钮防止重复点击
      createOrderBtn.disabled = true;
      createOrderBtn.textContent = "处理中...";

      // 模拟创建订单（实际应向服务器发送请求）
      setTimeout(() => {
        const order = createSecureOrder();
        displayOrderInfo(order);

        // 恢复按钮状态
        createOrderBtn.disabled = false;
        createOrderBtn.textContent = "创建订单";

        // 显示支付表单
        paymentForm.style.display = "block";

        // 设置订单15分钟超时
        setTimeout(() => {
          if (paymentResult.style.display !== "block") {
            orderInfo.style.display = "none";
            paymentForm.style.display = "none";
            paymentResult.style.display = "block";
            paymentResult.innerHTML =
              '<div class="error-message">订单已超时，请重新创建</div>';
          }
        }, 15 * 60 * 1000); // 15分钟
      }, 1000);
    } catch (error) {
      console.error("创建订单失败:", error);
      showError("创建订单失败，请重试");

      // 恢复按钮状态
      createOrderBtn.disabled = false;
      createOrderBtn.textContent = "创建订单";
    }
  }

  /**
   * 创建安全订单
   * @returns {Object} 创建的订单对象
   */
  function createSecureOrder() {
    // 生成唯一订单号
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const orderNumber = `ORD${timestamp}${randomStr}`;

    // 订单数据
    const orderData = {
      orderId: orderNumber,
      productName: "测试商品",
      amount: "99.00",
      quantity: 1,
      totalAmount: "99.00",
      createTime: new Date().toISOString(),
      expireTime: new Date(timestamp + 15 * 60 * 1000).toISOString(), // 15分钟后过期
    };

    // 计算订单签名
    orderData.sign = signOrderData(orderData);

    return orderData;
  }

  /**
   * 对订单数据进行签名
   * @param {Object} orderData 订单数据
   * @returns {string} 签名字符串
   */
  function signOrderData(orderData) {
    // 复制对象，排除sign字段
    const { sign: existingSign, ...dataToSign } = orderData;

    // 参数按字母顺序排序
    const sortedKeys = Object.keys(dataToSign).sort();
    let signStr = "";

    // 拼接参数
    sortedKeys.forEach((key) => {
      if (dataToSign[key] !== null && dataToSign[key] !== undefined) {
        signStr += `${key}=${dataToSign[key]}&`;
      }
    });

    // 添加密钥
    signStr += `key=${API_SECRET_KEY}`;

    // 计算签名 (使用SHA-256)
    const signature = CryptoJS.SHA256(signStr).toString();
    return signature;
  }

  /**
   * 显示订单信息
   * @param {Object} order 订单对象
   */
  function displayOrderInfo(order) {
    orderId.textContent = order.orderId;
    orderTime.textContent = new Date(order.createTime).toLocaleString();

    // 显示简化的签名（安全起见不显示完整签名）
    const signShort =
      order.sign.substring(0, 16) +
      "..." +
      order.sign.substring(order.sign.length - 8);
    orderSign.textContent = signShort;

    // 显示订单信息区域
    orderInfo.style.display = "block";
  }

  /**
   * 处理支付操作
   */
  function handlePayment() {
    // 防止重复提交
    payBtn.disabled = true;
    payBtn.textContent = "处理中...";

    // 表单验证
    if (!validatePaymentForm()) {
      payBtn.disabled = false;
      payBtn.textContent = "支付";
      return;
    }

    try {
      // 获取并加密支付表单数据
      const formData = getFormData();
      const encryptedData = encryptPaymentData(formData);

      // 显示处理中提示
      paymentResult.style.display = "block";
      paymentResult.innerHTML =
        '<div class="pending-message">正在处理支付，请勿关闭页面...</div>';

      // 模拟支付处理（实际应发送到服务器）
      setTimeout(() => {
        // 模拟支付成功
        const success = Math.random() > 0.2; // 80%概率成功

        if (success) {
          showPaymentSuccess();
        } else {
          showPaymentError("支付处理失败，请检查支付信息或稍后再试");
        }

        // 恢复按钮状态
        payBtn.disabled = false;
        payBtn.textContent = "支付";
      }, 2000);
    } catch (error) {
      console.error("支付处理错误:", error);
      showPaymentError("支付处理出错");

      // 恢复按钮状态
      payBtn.disabled = false;
      payBtn.textContent = "支付";
    }
  }

  /**
   * 验证支付表单
   * @returns {boolean} 验证结果
   */
  function validatePaymentForm() {
    // 清除空格
    const cardNum = cardNumber.value.replace(/\s/g, "");
    const expiry = expiryDate.value.replace(/\D/g, "");
    const cvvValue = cvv.value.trim();

    // 卡号验证
    if (!cardNum || cardNum.length < 16 || !/^\d+$/.test(cardNum)) {
      showError("请输入有效的卡号");
      return false;
    }

    // 有效期验证
    if (!expiry || expiry.length !== 4) {
      showError("请输入有效的过期日期 (MM/YY)");
      return false;
    }

    const month = parseInt(expiry.substring(0, 2), 10);
    if (month < 1 || month > 12) {
      showError("请输入有效的月份 (01-12)");
      return false;
    }

    // CVV验证
    if (!cvvValue || cvvValue.length < 3 || !/^\d+$/.test(cvvValue)) {
      showError("请输入有效的安全码");
      return false;
    }

    return true;
  }

  /**
   * 获取表单数据
   * @returns {Object} 表单数据对象
   */
  function getFormData() {
    return {
      card_number: cardNumber.value.replace(/\s/g, ""),
      expiry: expiryDate.value,
      cvv: cvv.value,
      order_id: orderId.textContent,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: createNonceStr(16),
    };
  }

  /**
   * 生成随机字符串
   * @param {number} length 字符串长度
   * @returns {string} 随机字符串
   */
  function createNonceStr(length = 32) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 加密支付数据
   * @param {Object} data 支付数据
   * @returns {string} 加密后的字符串
   */
  function encryptPaymentData(data) {
    // 实际应用中应使用公钥加密或其他安全的加密方式
    const key = CryptoJS.enc.Utf8.parse(ENCRYPT_KEY);
    const iv = CryptoJS.enc.Utf8.parse(ENCRYPT_IV);

    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return encrypted.toString();
  }

  /**
   * 初始化信用卡输入安全处理
   */
  function initSecureCreditCardInput() {
    // 信用卡号输入格式化
    cardNumber.addEventListener("input", function () {
      // 移除非数字字符
      let value = this.value.replace(/\D/g, "");

      // 添加空格分隔
      if (value.length > 0) {
        value = value.match(new RegExp(".{1,4}", "g")).join(" ");
      }

      this.value = value;
    });

    // 有效期格式化
    expiryDate.addEventListener("input", function () {
      let value = this.value.replace(/\D/g, "");

      if (value.length > 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4);
      }

      this.value = value;
    });

    // 仅允许CVV输入数字
    cvv.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "");
    });

    // 防止敏感字段复制粘贴（增强安全性）
    const secureInputs = [cardNumber, expiryDate, cvv];
    secureInputs.forEach((input) => {
      input.addEventListener("copy", (e) => e.preventDefault());
      input.addEventListener("paste", (e) => e.preventDefault());
      input.addEventListener("cut", (e) => e.preventDefault());
    });
  }

  /**
   * 显示支付成功信息
   */
  function showPaymentSuccess() {
    paymentResult.innerHTML = `
      <div class="success-message">
        <h4>支付成功!</h4>
        <p>订单: ${orderId.textContent}</p>
        <p>交易时间: ${new Date().toLocaleString()}</p>
        <p>交易流水号: TXN${Date.now()}${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}</p>
      </div>
    `;

    // 隐藏支付表单
    paymentForm.style.display = "none";
  }

  /**
   * 显示支付错误信息
   * @param {string} message 错误信息
   */
  function showPaymentError(message) {
    paymentResult.innerHTML = `
      <div class="error-message">
        <h4>支付失败</h4>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * 显示错误提示
   * @param {string} message 错误信息
   */
  function showError(message) {
    paymentResult.style.display = "block";
    paymentResult.innerHTML = `<div class="error-message">${message}</div>`;

    // 3秒后自动隐藏
    setTimeout(() => {
      paymentResult.style.display = "none";
    }, 3000);
  }

  /**
   * 添加防止刷新页面的提示
   * 实际应用中可根据需要决定是否使用
   */
  window.addEventListener("beforeunload", (e) => {
    if (orderInfo.style.display === "block" && paymentResult.innerHTML === "") {
      // 如果订单已创建但未完成支付，显示提示
      const message = "您的支付还未完成，离开页面将取消订单。确定离开吗？";
      e.returnValue = message;
      return message;
    }
  });
});
