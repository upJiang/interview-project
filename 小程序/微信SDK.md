# 微信小程序SDK

本文件介绍常用API与组件使用指南

## 1. 微信小程序SDK概述

微信小程序SDK提供了丰富的原生API和组件，帮助开发者快速构建小程序。
这些能力包括界面交互、网络通信、数据存储、媒体操作、设备功能等多个方面。
通过合理使用SDK，开发者可以充分利用微信平台能力，提升小程序体验。

## 2. 网络请求API

```javascript
function networkRequests() {
  // wx.request: 发起网络请求
  /*
  wx.request({
    url: 'https://api.example.com/data',
    method: 'GET', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
    header: {
      'content-type': 'application/json',
      'Authorization': 'Bearer token123'
    },
    data: {
      x: 'value',
      y: 123
    },
    dataType: 'json', // 返回的数据格式
    responseType: 'text', // 响应的数据类型，默认text，可选arraybuffer
    success(res) {
      console.log('请求成功', res.data);
    },
    fail(err) {
      console.error('请求失败', err);
    },
    complete() {
      console.log('请求完成');
    }
  });
  */
  // 请求封装示例:
  /*
  // 请求封装
  function request(options) {
    return new Promise((resolve, reject) => {
      // 统一添加请求头
      const header = Object.assign({
        'content-type': 'application/json'
      }, options.header || {});
      
      // 处理token
      const token = wx.getStorageSync('token');
      if (token) {
        header.Authorization = `Bearer ${token}`;
      }
      
      // 发起请求
      wx.request({
        ...options,
        header,
        success(res) {
          // 统一处理状态码
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // token失效，重新登录
            wx.navigateTo({ url: '/pages/login/login' });
            reject(new Error('登录已过期'));
          } else {
            reject(new Error(`请求失败，状态码：${res.statusCode}`));
          }
        },
        fail(err) {
          // 统一处理错误
          reject(new Error(`网络请求失败：${err.errMsg}`));
        }
      });
    });
  }
  
  // 使用示例
  async function fetchData() {
    try {
      const data = await request({
        url: 'https://api.example.com/data',
        method: 'GET'
      });
      console.log('获取数据成功', data);
      return data;
    } catch (error) {
      console.error('获取数据失败', error);
      wx.showToast({
        title: error.message,
        icon: 'none'
      });
    }
  }
  */
  // 网络请求注意事项:
  // - 必须配置合法域名（开发时可勾选"不校验合法域名"）
  // - 请求默认超时时间为60秒
  // - 小程序请求并发限制最多10个
  // - HTTPS证书必须有效
  // - 不支持跨域Cookie
  // 上传和下载文件:
  /*
  // 上传文件
  wx.uploadFile({
    url: 'https://api.example.com/upload',
    filePath: tempFilePath,
    name: 'file',
    formData: {
      'user': 'test'
    },
    success(res) {
      console.log('上传成功', res.data);
    }
  });
  
  // 下载文件
  wx.downloadFile({
    url: 'https://example.com/file.pdf',
    success(res) {
      if (res.statusCode === 200) {
        const filePath = res.tempFilePath;
        // 打开文件
        wx.openDocument({
          filePath: filePath,
          success() {
            console.log('打开文件成功');
          }
        });
      }
    }
  });
  */
  // WebSocket连接:
  /*
  // 建立WebSocket连接
  const socketTask = wx.connectSocket({
    url: 'wss://example.com/socket',
    header: {
      'content-type': 'application/json'
    },
    protocols: ['protocol1', 'protocol2']
  });
  
  // 监听连接打开
  socketTask.onOpen(() => {
    console.log('WebSocket连接已打开');
    // 发送数据
    socketTask.send({
      data: JSON.stringify({ msg: 'hello' })
    });
  });
  
  // 监听消息
  socketTask.onMessage((res) => {
    console.log('收到服务器消息', res.data);
  });
  
  // 监听连接关闭
  socketTask.onClose(() => {
    console.log('WebSocket连接已关闭');
  });
  
  // 监听错误
  socketTask.onError((error) => {
    console.error('WebSocket错误', error);
  });
  
  // 关闭连接
  socketTask.close({
    code: 1000,
    reason: '主动关闭连接'
  });
  */
}
```

## 3. 数据缓存API

```javascript
function storageAPI() {
  // 同步存储数据:
  /*
  try {
    wx.setStorageSync('key', 'value');
    console.log('存储成功');
  } catch (e) {
    console.error('存储失败', e);
  }
  
  try {
    const value = wx.getStorageSync('key');
    if (value) {
      console.log('获取缓存值', value);
    }
  } catch (e) {
    console.error('获取缓存失败', e);
  }
  
  try {
    wx.removeStorageSync('key');
    console.log('删除缓存成功');
  } catch (e) {
    console.error('删除缓存失败', e);
  }
  
  try {
    wx.clearStorageSync();
    console.log('清理缓存成功');
  } catch (e) {
    console.error('清理缓存失败', e);
  }
  
  try {
    const storageInfo = wx.getStorageInfoSync();
    console.log('缓存信息', storageInfo.keys, storageInfo.currentSize, storageInfo.limitSize);
  } catch (e) {
    console.error('获取缓存信息失败', e);
  }
  */
  
  // 异步存储数据:
  /*
  // 设置缓存
  wx.setStorage({
    key: 'key',
    data: 'value',
    success() {
      console.log('存储成功');
    },
    fail(e) {
      console.error('存储失败', e);
    }
  });
  
  // 获取缓存
  wx.getStorage({
    key: 'key',
    success(res) {
      console.log('获取缓存值', res.data);
    },
    fail(e) {
      console.error('获取缓存失败', e);
    }
  });
  
  // 删除缓存
  wx.removeStorage({
    key: 'key',
    success() {
      console.log('删除缓存成功');
    }
  });
  
  // 清理缓存
  wx.clearStorage({
    success() {
      console.log('清理缓存成功');
    }
  });
  
  // 获取缓存信息
  wx.getStorageInfo({
    success(res) {
      console.log('缓存信息', res.keys, res.currentSize, res.limitSize);
    }
  });
  */
  
  // 封装缓存工具:
  /*
  const Storage = {
    // 设置缓存，支持过期时间
    set(key, data, expires = 0) {
      const storageData = {
        data,
        expires: expires ? Date.now() + expires : 0
      };
      wx.setStorageSync(key, storageData);
    },
    
    // 获取缓存，自动判断是否过期
    get(key) {
      try {
        const storageData = wx.getStorageSync(key);
        if (!storageData) return null;
        
        // 判断是否过期
        if (storageData.expires && storageData.expires < Date.now()) {
          // 已过期，删除缓存
          wx.removeStorageSync(key);
          return null;
        }
        
        return storageData.data;
      } catch (e) {
        return null;
      }
    },
    
    // 删除缓存
    remove(key) {
      wx.removeStorageSync(key);
    },
    
    // 清空缓存
    clear() {
      wx.clearStorageSync();
    }
  };
  
  // 使用示例
  Storage.set('userInfo', { name: 'John' }, 24 * 60 * 60 * 1000); // 存储用户信息，有效期1天
  const userInfo = Storage.get('userInfo'); // 获取缓存
  */
  
  // 缓存注意事项:
  // - 单个 key 允许存储的最大数据长度为 1MB
  // - 所有数据存储上限为 10MB
  // - 同步方法会阻塞当前线程
  // - 数据会被全局缓存，可在多个页面使用
  // - 原生只支持基础数据类型、对象和数组，其他类型需要转换
}
``` 