// AES加密相关功能
document.addEventListener("DOMContentLoaded", function () {
  // AES加密部分
  const aesInput = document.getElementById("aes-input");
  const aesKey = document.getElementById("aes-key");
  const aesEncryptBtn = document.getElementById("aes-encrypt-btn");
  const aesDecryptBtn = document.getElementById("aes-decrypt-btn");
  const aesOutput = document.getElementById("aes-output");

  // RSA加密部分
  const rsaInput = document.getElementById("rsa-input");
  const rsaPublicKey = document.getElementById("rsa-public-key");
  const rsaPrivateKey = document.getElementById("rsa-private-key");
  const rsaGenerateBtn = document.getElementById("rsa-generate-btn");
  const rsaEncryptBtn = document.getElementById("rsa-encrypt-btn");
  const rsaDecryptBtn = document.getElementById("rsa-decrypt-btn");
  const rsaOutput = document.getElementById("rsa-output");

  // 用于RSA加密的实例
  let crypt = new JSEncrypt({ default_key_size: 2048 });

  // 显示错误消息
  function showError(element, message) {
    element.innerHTML = `<div class="error-message">${message}</div>`;
  }

  // 显示成功结果
  function showSuccess(element, message) {
    element.innerHTML = `<div class="result">
      <span class="result-text">${message}</span>
      <button class="copy-btn" onclick="copyToClipboard(this)">复制</button>
    </div>`;
  }

  // 验证AES密钥长度
  function validateAesKey(key) {
    // AES密钥长度必须为16、24或32个字符（对应128、192或256位）
    return key.length === 16 || key.length === 24 || key.length === 32;
  }

  // AES加密函数
  function aesEncrypt(text, key) {
    try {
      // 检查密钥长度
      if (!validateAesKey(key)) {
        throw new Error("AES密钥长度必须为16、24或32个字符");
      }

      // 使用CryptoJS进行AES加密
      const encrypted = CryptoJS.AES.encrypt(text, key).toString();
      return encrypted;
    } catch (error) {
      throw new Error(`加密错误: ${error.message}`);
    }
  }

  // AES解密函数
  function aesDecrypt(ciphertext, key) {
    try {
      // 检查密钥长度
      if (!validateAesKey(key)) {
        throw new Error("AES密钥长度必须为16、24或32个字符");
      }

      // 使用CryptoJS进行AES解密
      const decrypted = CryptoJS.AES.decrypt(ciphertext, key).toString(
        CryptoJS.enc.Utf8
      );

      if (!decrypted) {
        throw new Error("解密失败，可能是密钥错误或格式不正确");
      }

      return decrypted;
    } catch (error) {
      throw new Error(`解密错误: ${error.message}`);
    }
  }

  // 事件监听器 - AES加密
  aesEncryptBtn.addEventListener("click", function () {
    const text = aesInput.value.trim();
    const key = aesKey.value;

    if (!text) {
      showError(aesOutput, "请输入要加密的文本");
      return;
    }

    try {
      const encrypted = aesEncrypt(text, key);
      showSuccess(aesOutput, encrypted);
    } catch (error) {
      showError(aesOutput, error.message);
    }
  });

  // 事件监听器 - AES解密
  aesDecryptBtn.addEventListener("click", function () {
    const ciphertext = aesInput.value.trim();
    const key = aesKey.value;

    if (!ciphertext) {
      showError(aesOutput, "请输入要解密的文本");
      return;
    }

    try {
      const decrypted = aesDecrypt(ciphertext, key);
      showSuccess(aesOutput, decrypted);
    } catch (error) {
      showError(aesOutput, error.message);
    }
  });

  // 生成RSA密钥对
  function generateRSAKeys() {
    try {
      crypt = new JSEncrypt({ default_key_size: 2048 });
      crypt.getKey();

      // 获取公钥和私钥
      const publicKey = crypt.getPublicKey();
      const privateKey = crypt.getPrivateKey();

      // 更新页面上的公钥和私钥显示
      rsaPublicKey.value = publicKey;
      rsaPrivateKey.value = privateKey;

      // 启用RSA加密和解密按钮
      rsaEncryptBtn.disabled = false;
      rsaDecryptBtn.disabled = false;

      showSuccess(rsaOutput, "密钥对生成成功");
    } catch (error) {
      showError(rsaOutput, `生成密钥对失败: ${error.message}`);
    }
  }

  // 事件监听器 - 生成RSA密钥对
  rsaGenerateBtn.addEventListener("click", generateRSAKeys);

  // 事件监听器 - RSA加密（使用公钥）
  rsaEncryptBtn.addEventListener("click", function () {
    const text = rsaInput.value.trim();
    const publicKey = rsaPublicKey.value.trim();

    if (!text) {
      showError(rsaOutput, "请输入要加密的文本");
      return;
    }

    if (!publicKey) {
      showError(rsaOutput, "请先生成密钥对或输入公钥");
      return;
    }

    try {
      // 设置公钥并加密
      crypt.setPublicKey(publicKey);
      const encrypted = crypt.encrypt(text);

      if (!encrypted) {
        throw new Error("加密失败，可能是文本过长或格式不正确");
      }

      showSuccess(rsaOutput, encrypted);
    } catch (error) {
      showError(rsaOutput, `加密错误: ${error.message}`);
    }
  });

  // 事件监听器 - RSA解密（使用私钥）
  rsaDecryptBtn.addEventListener("click", function () {
    const ciphertext = rsaInput.value.trim();
    const privateKey = rsaPrivateKey.value.trim();

    if (!ciphertext) {
      showError(rsaOutput, "请输入要解密的文本");
      return;
    }

    if (!privateKey) {
      showError(rsaOutput, "请先生成密钥对或输入私钥");
      return;
    }

    try {
      // 设置私钥并解密
      crypt.setPrivateKey(privateKey);
      const decrypted = crypt.decrypt(ciphertext);

      if (!decrypted) {
        throw new Error("解密失败，可能是密钥错误或格式不正确");
      }

      showSuccess(rsaOutput, decrypted);
    } catch (error) {
      showError(rsaOutput, `解密错误: ${error.message}`);
    }
  });

  // 添加简单的表单验证
  aesKey.addEventListener("input", function () {
    if (!validateAesKey(this.value)) {
      this.classList.add("invalid");
    } else {
      this.classList.remove("invalid");
    }
  });

  // 复制到剪贴板功能
  window.copyToClipboard = function (button) {
    const resultText = button.previousElementSibling.textContent;

    navigator.clipboard
      .writeText(resultText)
      .then(function () {
        // 临时改变按钮文本表示复制成功
        const originalText = button.textContent;
        button.textContent = "已复制!";
        setTimeout(function () {
          button.textContent = originalText;
        }, 1500);
      })
      .catch(function (err) {
        console.error("复制失败:", err);
      });
  };

  // 初始生成一对RSA密钥
  generateRSAKeys();
});
