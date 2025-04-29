/**
 * 前端加密演示脚本
 * 实现AES和RSA加密/解密功能
 */

// AES加密相关函数
const AESUtils = {
  /**
   * 生成随机密钥
   * @returns {string} 生成的密钥
   */
  generateKey: function () {
    // 生成16字节(128位)的随机密钥
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) =>
      ("0" + byte.toString(16)).slice(-2)
    ).join("");
  },

  /**
   * AES加密
   * @param {string} plaintext 明文
   * @param {string} key 密钥(十六进制字符串)
   * @returns {object} 包含密文和IV的对象
   */
  encrypt: async function (plaintext, key) {
    try {
      // 将十六进制密钥转换为ArrayBuffer
      const keyBytes = new Uint8Array(
        key.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
      );

      // 生成随机IV
      const iv = window.crypto.getRandomValues(new Uint8Array(16));

      // 导入密钥
      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-CBC" },
        false,
        ["encrypt"]
      );

      // 将明文转换为ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // 加密
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-CBC", iv },
        cryptoKey,
        data
      );

      // 将加密结果转换为Base64
      const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
      const encryptedBase64 = btoa(
        String.fromCharCode.apply(null, encryptedArray)
      );

      // 将IV转换为Base64
      const ivBase64 = btoa(String.fromCharCode.apply(null, Array.from(iv)));

      return {
        ciphertext: encryptedBase64,
        iv: ivBase64,
      };
    } catch (error) {
      console.error("AES加密失败:", error);
      throw error;
    }
  },

  /**
   * AES解密
   * @param {string} ciphertext 密文(Base64编码)
   * @param {string} key 密钥(十六进制字符串)
   * @param {string} iv 初始化向量(Base64编码)
   * @returns {string} 解密后的明文
   */
  decrypt: async function (ciphertext, key, iv) {
    try {
      // 将十六进制密钥转换为ArrayBuffer
      const keyBytes = new Uint8Array(
        key.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
      );

      // 将Base64 IV转换为ArrayBuffer
      const ivBytes = new Uint8Array(
        Array.from(atob(iv), (c) => c.charCodeAt(0))
      );

      // 导入密钥
      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-CBC" },
        false,
        ["decrypt"]
      );

      // 将Base64密文转换为ArrayBuffer
      const encryptedBytes = new Uint8Array(
        Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
      );

      // 解密
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-CBC", iv: ivBytes },
        cryptoKey,
        encryptedBytes
      );

      // 将解密结果转换为字符串
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error("AES解密失败:", error);
      throw error;
    }
  },
};

// RSA加密相关函数
const RSAUtils = {
  /**
   * 生成RSA密钥对
   * @returns {Promise<object>} 包含公钥和私钥的对象
   */
  generateKeyPair: async function () {
    try {
      // 生成RSA密钥对
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: "SHA-256",
        },
        true, // 可导出
        ["encrypt", "decrypt"]
      );

      // 导出公钥
      const publicKeyBuffer = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
      const publicKeyBase64 = btoa(
        String.fromCharCode.apply(null, new Uint8Array(publicKeyBuffer))
      );

      // 导出私钥
      const privateKeyBuffer = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );
      const privateKeyBase64 = btoa(
        String.fromCharCode.apply(null, new Uint8Array(privateKeyBuffer))
      );

      return {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
      };
    } catch (error) {
      console.error("RSA密钥对生成失败:", error);
      throw error;
    }
  },

  /**
   * RSA加密
   * @param {string} plaintext 明文
   * @param {string} publicKeyBase64 公钥(Base64编码)
   * @returns {string} 加密后的密文(Base64编码)
   */
  encrypt: async function (plaintext, publicKeyBase64) {
    try {
      // 将Base64公钥转换为ArrayBuffer
      const publicKeyBytes = new Uint8Array(
        Array.from(atob(publicKeyBase64), (c) => c.charCodeAt(0))
      );

      // 导入公钥
      const publicKey = await window.crypto.subtle.importKey(
        "spki",
        publicKeyBytes,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false,
        ["encrypt"]
      );

      // 将明文转换为ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // 加密
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        data
      );

      // 将加密结果转换为Base64
      const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
      const encryptedBase64 = btoa(
        String.fromCharCode.apply(null, encryptedArray)
      );

      return encryptedBase64;
    } catch (error) {
      console.error("RSA加密失败:", error);
      throw error;
    }
  },

  /**
   * RSA解密
   * @param {string} ciphertext 密文(Base64编码)
   * @param {string} privateKeyBase64 私钥(Base64编码)
   * @returns {string} 解密后的明文
   */
  decrypt: async function (ciphertext, privateKeyBase64) {
    try {
      // 将Base64私钥转换为ArrayBuffer
      const privateKeyBytes = new Uint8Array(
        Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0))
      );

      // 导入私钥
      const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBytes,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false,
        ["decrypt"]
      );

      // 将Base64密文转换为ArrayBuffer
      const encryptedBytes = new Uint8Array(
        Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
      );

      // 解密
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedBytes
      );

      // 将解密结果转换为字符串
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error("RSA解密失败:", error);
      throw error;
    }
  },
};

// 数字签名相关函数
const SignatureUtils = {
  /**
   * 生成RSA签名密钥对
   * @returns {Promise<object>} 包含公钥和私钥的对象
   */
  generateKeyPair: async function () {
    try {
      // 生成RSA签名密钥对
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-PSS",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: "SHA-256",
        },
        true, // 可导出
        ["sign", "verify"]
      );

      // 导出公钥
      const publicKeyBuffer = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
      const publicKeyBase64 = btoa(
        String.fromCharCode.apply(null, new Uint8Array(publicKeyBuffer))
      );

      // 导出私钥
      const privateKeyBuffer = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );
      const privateKeyBase64 = btoa(
        String.fromCharCode.apply(null, new Uint8Array(privateKeyBuffer))
      );

      return {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
      };
    } catch (error) {
      console.error("RSA签名密钥对生成失败:", error);
      throw error;
    }
  },

  /**
   * 计算消息摘要
   * @param {string} message 消息
   * @returns {Promise<string>} 消息摘要(Base64编码)
   */
  digest: async function (message) {
    try {
      // 将消息转换为ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      // 计算SHA-256摘要
      const digestBuffer = await window.crypto.subtle.digest("SHA-256", data);

      // 将摘要转换为Base64
      const digestArray = Array.from(new Uint8Array(digestBuffer));
      const digestBase64 = btoa(String.fromCharCode.apply(null, digestArray));

      return digestBase64;
    } catch (error) {
      console.error("消息摘要计算失败:", error);
      throw error;
    }
  },

  /**
   * 签名
   * @param {string} message 消息
   * @param {string} privateKeyBase64 私钥(Base64编码)
   * @returns {Promise<string>} 签名(Base64编码)
   */
  sign: async function (message, privateKeyBase64) {
    try {
      // 将Base64私钥转换为ArrayBuffer
      const privateKeyBytes = new Uint8Array(
        Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0))
      );

      // 导入私钥
      const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBytes,
        {
          name: "RSA-PSS",
          hash: "SHA-256",
        },
        false,
        ["sign"]
      );

      // 将消息转换为ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      // 签名
      const signatureBuffer = await window.crypto.subtle.sign(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        privateKey,
        data
      );

      // 将签名转换为Base64
      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const signatureBase64 = btoa(
        String.fromCharCode.apply(null, signatureArray)
      );

      return signatureBase64;
    } catch (error) {
      console.error("签名失败:", error);
      throw error;
    }
  },

  /**
   * 验证签名
   * @param {string} message 消息
   * @param {string} signature 签名(Base64编码)
   * @param {string} publicKeyBase64 公钥(Base64编码)
   * @returns {Promise<boolean>} 验证结果
   */
  verify: async function (message, signature, publicKeyBase64) {
    try {
      // 将Base64公钥转换为ArrayBuffer
      const publicKeyBytes = new Uint8Array(
        Array.from(atob(publicKeyBase64), (c) => c.charCodeAt(0))
      );

      // 导入公钥
      const publicKey = await window.crypto.subtle.importKey(
        "spki",
        publicKeyBytes,
        {
          name: "RSA-PSS",
          hash: "SHA-256",
        },
        false,
        ["verify"]
      );

      // 将消息转换为ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      // 将Base64签名转换为ArrayBuffer
      const signatureBytes = new Uint8Array(
        Array.from(atob(signature), (c) => c.charCodeAt(0))
      );

      // 验证签名
      const result = await window.crypto.subtle.verify(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        publicKey,
        signatureBytes,
        data
      );

      return result;
    } catch (error) {
      console.error("签名验证失败:", error);
      throw error;
    }
  },
};

// 导出函数供外部使用
window.AESUtils = AESUtils;
window.RSAUtils = RSAUtils;
window.SignatureUtils = SignatureUtils;
