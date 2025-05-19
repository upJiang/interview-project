# 微信小程序SDK

本文件介绍常用API与组件使用指南

## 1. 微信小程序SDK概述

微信小程序SDK提供了丰富的原生API和组件，帮助开发者快速构建小程序。
这些能力包括界面交互、网络通信、数据存储、媒体操作、设备功能等多个方面。
通过合理使用SDK，开发者可以充分利用微信平台能力，提升小程序体验。

## 2. 网络请求API

### wx.request: 发起网络请求

```javascript
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
```

### 请求封装示例

```javascript
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
```

### 网络请求注意事项
- 必须配置合法域名（开发时可勾选"不校验合法域名"）
- 请求默认超时时间为60秒
- 小程序请求并发限制最多10个
- HTTPS证书必须有效
- 不支持跨域Cookie

### 上传和下载文件

```javascript
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
```

### WebSocket连接

```javascript
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
```

## 3. 数据缓存API

### 同步存储数据

```javascript
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

// 移除指定缓存
try {
  wx.removeStorageSync('key');
  console.log('删除缓存成功');
} catch (e) {
  console.error('删除缓存失败', e);
}

// 清除所有缓存
try {
  wx.clearStorageSync();
  console.log('清除所有缓存成功');
} catch (e) {
  console.error('清除缓存失败', e);
}
```

### 异步存储数据

```javascript
// 设置缓存
wx.setStorage({
  key: 'key',
  data: 'value',
  success() {
    console.log('异步存储成功');
  },
  fail(err) {
    console.error('异步存储失败', err);
  }
});

// 获取缓存
wx.getStorage({
  key: 'key',
  success(res) {
    console.log('异步获取缓存成功', res.data);
  },
  fail(err) {
    console.error('异步获取缓存失败', err);
  }
});
```

### 缓存使用建议
- 缓存大小限制为10MB
- 存储关键业务数据建议使用同步方法
- 存储非关键数据可使用异步方法
- 敏感信息不要使用缓存存储
- 定期清理不需要的缓存

## 4. 界面交互API

### 导航API

```javascript
// 导航到新页面
wx.navigateTo({
  url: '/pages/detail/detail?id=123',
  success() {
    console.log('导航成功');
  },
  fail(err) {
    console.error('导航失败', err);
  }
});

// 页面重定向
wx.redirectTo({
  url: '/pages/other/other',
});

// 切换Tab页
wx.switchTab({
  url: '/pages/home/home',
});

// 返回上一页
wx.navigateBack({
  delta: 1, // 返回的页面数，默认1
});

// 关闭所有页面，打开新页面
wx.reLaunch({
  url: '/pages/new/new',
});
```

### 交互提示API

```javascript
// 显示提示框
wx.showToast({
  title: '操作成功',
  icon: 'success', // 'success', 'loading', 'none'
  duration: 2000,
  mask: true, // 是否显示透明蒙层
});

// 隐藏提示框
wx.hideToast();

// 显示加载框
wx.showLoading({
  title: '加载中...',
  mask: true,
});

// 隐藏加载框
wx.hideLoading();

// 显示模态对话框
wx.showModal({
  title: '提示',
  content: '确定要删除吗？',
  showCancel: true,
  cancelText: '取消',
  cancelColor: '#999999',
  confirmText: '确定',
  confirmColor: '#3CC51F',
  success(res) {
    if (res.confirm) {
      console.log('用户点击确定');
    } else if (res.cancel) {
      console.log('用户点击取消');
    }
  }
});

// 显示操作菜单
wx.showActionSheet({
  itemList: ['选项A', '选项B', '选项C'],
  success(res) {
    console.log('用户选择了第', res.tapIndex + 1, '个选项');
  },
  fail(err) {
    console.log('用户取消选择');
  }
});
```

## 5. 媒体操作API

### 图片操作

```javascript
// 选择图片
wx.chooseImage({
  count: 9, // 最多可选择的图片数量，默认9
  sizeType: ['original', 'compressed'], // 原图或压缩图
  sourceType: ['album', 'camera'], // 相册或相机
  success(res) {
    const tempFilePaths = res.tempFilePaths;
    const tempFiles = res.tempFiles;
    
    console.log('选择图片成功', tempFilePaths);
    // 处理选择的图片...
  }
});

// 预览图片
wx.previewImage({
  current: 'https://example.com/images/1.jpg', // 当前显示图片的链接
  urls: [
    'https://example.com/images/1.jpg',
    'https://example.com/images/2.jpg',
    'https://example.com/images/3.jpg'
  ], // 需要预览的图片链接列表
});

// 保存图片到相册
wx.saveImageToPhotosAlbum({
  filePath: 'tempFilePath',
  success(res) {
    console.log('保存图片成功');
  },
  fail(err) {
    console.error('保存图片失败', err);
  }
});
```

### 音频操作

```javascript
// 创建音频上下文
const innerAudioContext = wx.createInnerAudioContext();
innerAudioContext.autoplay = true;
innerAudioContext.src = 'https://example.com/audio.mp3';

// 监听播放事件
innerAudioContext.onPlay(() => {
  console.log('音频开始播放');
});

// 监听错误事件
innerAudioContext.onError((res) => {
  console.error('音频播放错误', res.errMsg);
});

// 播放控制
innerAudioContext.play();  // 播放
innerAudioContext.pause(); // 暂停
innerAudioContext.stop();  // 停止

// 销毁音频实例
innerAudioContext.destroy();
```

### 视频操作

```javascript
// 选择视频
wx.chooseVideo({
  sourceType: ['album', 'camera'], // 视频来源
  maxDuration: 60, // 最长时间，单位秒
  camera: 'back', // 使用后置或前置摄像头
  success(res) {
    console.log('视频临时路径', res.tempFilePath);
    console.log('视频时长', res.duration);
    console.log('视频大小', res.size);
    console.log('视频尺寸', res.width, res.height);
  }
});

// 视频组件控制
// 通过VideoContext操作<video>组件
const videoContext = wx.createVideoContext('myVideo');
videoContext.play();    // 播放
videoContext.pause();   // 暂停
videoContext.stop();    // 停止
videoContext.seek(30);  // 跳转到指定位置（秒）
```

## 6. 设备能力API

### 位置服务

```javascript
// 获取当前位置
wx.getLocation({
  type: 'gcj02', // 默认为wgs84，gcj02用于地图显示
  altitude: true, // 是否需要高度信息
  success(res) {
    const latitude = res.latitude;
    const longitude = res.longitude;
    console.log('当前位置', latitude, longitude);
    
    // 打开地图选择位置
    wx.openLocation({
      latitude,
      longitude,
      scale: 18,
      name: '当前位置',
      address: '详细地址说明'
    });
  },
  fail(err) {
    console.error('获取位置失败', err);
  }
});

// 选择位置
wx.chooseLocation({
  success(res) {
    console.log('位置名称', res.name);
    console.log('详细地址', res.address);
    console.log('纬度', res.latitude);
    console.log('经度', res.longitude);
  }
});
```

### 设备信息

```javascript
// 获取系统信息
wx.getSystemInfo({
  success(res) {
    console.log('手机品牌', res.brand);
    console.log('手机型号', res.model);
    console.log('设备像素比', res.pixelRatio);
    console.log('屏幕宽度', res.screenWidth);
    console.log('屏幕高度', res.screenHeight);
    console.log('窗口宽度', res.windowWidth);
    console.log('窗口高度', res.windowHeight);
    console.log('微信版本号', res.version);
    console.log('操作系统版本', res.system);
    console.log('客户端平台', res.platform);
    console.log('基础库版本', res.SDKVersion);
  }
});

// 获取网络状态
wx.getNetworkType({
  success(res) {
    const networkType = res.networkType; // wifi, 2g, 3g, 4g, 5g, unknown, none
    console.log('当前网络类型', networkType);
  }
});

// 监听网络状态变化
wx.onNetworkStatusChange((res) => {
  console.log('当前是否有网络连接', res.isConnected);
  console.log('当前网络类型', res.networkType);
});
```

### 扫码功能

```javascript
// 扫描二维码
wx.scanCode({
  onlyFromCamera: false, // 是否只能从相机扫码
  scanType: ['qrCode', 'barCode'], // 扫码类型
  success(res) {
    console.log('扫码结果', res.result);
    console.log('扫码类型', res.scanType);
    console.log('条形码数据', res.charSet);
    console.log('条形码原始数据', res.rawData);
  }
});
```

## 7. 微信支付API

### 发起支付

```javascript
// 发起微信支付
wx.requestPayment({
  timeStamp: '',
  nonceStr: '',
  package: '',
  signType: 'MD5',
  paySign: '',
  success(res) {
    console.log('支付成功', res);
  },
  fail(err) {
    console.error('支付失败', err);
  },
  complete(res) {
    console.log('支付操作完成');
  }
});
```

### 支付流程
1. 小程序向服务器发起下单请求
2. 服务器调用微信支付统一下单API
3. 服务器返回支付参数给小程序
4. 小程序调用wx.requestPayment发起支付
5. 用户完成支付
6. 微信服务器通知商户服务器支付结果
7. 小程序查询支付结果

### 支付注意事项
- 小程序必须在微信支付商户平台关联
- 支付参数必须由服务器生成并签名
- 支付金额单位为分
- 注意处理支付取消和失败情况
- 勿在小程序前端储存支付密钥 