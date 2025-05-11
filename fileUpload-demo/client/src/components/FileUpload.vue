<template>
  <div class="upload-container">
    <a-upload
      :file-list="fileList"
      :before-upload="beforeUpload"
      :remove="handleRemove"
      :multiple="true"
      :show-upload-list="true"
    >
      <a-button type="primary">
        <upload-outlined />
        选择文件
      </a-button>
    </a-upload>

    <div class="action-buttons">
      <a-button 
        type="primary" 
        @click="handleUploadAll" 
        :disabled="uploading || fileList.length === 0 || calculating"
        :loading="calculating"
      >
        {{ calculating ? '计算文件hash中...' : '开始上传' }}
      </a-button>
      <a-button type="primary" danger @click="cancelAllUploads" :disabled="!uploading">
        取消上传
      </a-button>
    </div>

    <div v-if="error" class="error-message">
      <a-alert type="error" :message="error" banner />
      <a-button type="primary" class="retry-button" @click="retryAllUploads">
        重试
      </a-button>
    </div>

    <div v-for="file in fileList" :key="file.uid" class="file-item">
      <div class="file-info">
        <p>文件名: {{ file.name }}</p>
        <p>文件大小: {{ formatFileSize(file.size) }}</p>
        <p>文件类型: {{ file.type || '未知' }}</p>
        
        <div v-if="fileStatus[file.uid]">
          <div v-if="fileStatus[file.uid].calculating" class="status-message">
            <a-alert type="info" message="计算文件Hash中..." banner />
          </div>
          
          <div v-if="fileStatus[file.uid].uploading || fileStatus[file.uid].success" class="progress-container">
            <div class="progress-info">
              <span>进度: {{ fileStatus[file.uid].progress || 0 }}%</span>
              <span v-if="fileStatus[file.uid].speed">上传速度: {{ fileStatus[file.uid].speed }}</span>
            </div>
            <a-progress 
              :percent="fileStatus[file.uid].progress || 0" 
              :status="fileStatus[file.uid].success ? 'success' : 'active'" 
            />
            
            <div class="chunk-list">
              <div 
                v-for="(chunk, index) in fileStatus[file.uid].chunks" 
                :key="index" 
                class="chunk-item"
              >
                <div class="chunk-progress">
                  <div 
                    class="chunk-progress-bar" 
                    :style="{ width: `${chunk.progress || 0}%` }"
                    :class="{ 
                      'uploading': chunk.status === 'uploading',
                      'success': chunk.status === 'success',
                      'error': chunk.status === 'error',
                      'waiting': chunk.status === 'waiting'
                    }"
                  ></div>
                </div>
                <span class="chunk-index">{{ index + 1 }}</span>
              </div>
            </div>
          </div>

          <div v-if="fileStatus[file.uid].success" class="success-message">
            <a-alert type="success" message="文件上传成功!" banner />
          </div>

          <div v-if="fileStatus[file.uid].error" class="error-message">
            <a-alert type="error" :message="fileStatus[file.uid].errorMsg" banner />
            <a-button type="primary" class="retry-button" @click="retryUpload(file)">
              重试
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { UploadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import SparkMD5 from 'spark-md5';
import { computed, onBeforeUnmount, reactive, ref } from 'vue';

// 配置参数
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB 每片大小
const MAX_CONCURRENT_REQUESTS = 6; // 最大并发请求数
const MAX_CONCURRENT_FILES = 3; // 最大并发文件数
const API_URL = '/api'; // 注意这里是前缀，会被Vite代理到后端
const MAX_RETRY_COUNT = 3; // 最大重试次数

// 上传状态
const fileList = ref([]);
const fileStatus = reactive({}); // 存储每个文件的上传状态
const uploading = ref(false);
const calculating = ref(false);
const cancelTokenSources = reactive({}); // 每个文件的取消令牌
const speedIntervals = reactive({}); // 每个文件的速度计算定时器
const error = ref('');
const uploadQueue = ref([]); // 上传队列

// 计算全局calculating状态
const isAnyFileCalculating = computed(() => {
  return Object.values(fileStatus).some(status => status.calculating);
});

// 在组件销毁前清除定时器和取消所有上传
onBeforeUnmount(() => {
  Object.values(speedIntervals).forEach(interval => {
    if (interval) clearInterval(interval);
  });
  cancelAllUploads();
});

// 计算单个文件的总进度
const calculateFileProgress = (chunks) => {
  if (!chunks || chunks.length === 0) return 0;
  
  const totalProgress = chunks.reduce((acc, chunk) => {
    return acc + (chunk.progress || 0);
  }, 0);
  
  return Math.floor(totalProgress / chunks.length);
};

// 格式化文件大小显示
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

// 计算文件的唯一标识符（使用MD5哈希）
const calculateFileHash = async (file) => {
  const fileUid = file.uid;
  if (fileStatus[fileUid]) {
    fileStatus[fileUid].calculating = true;
  }
  
  return new Promise((resolve) => {
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks for hash calculation
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    
    fileReader.onload = (e) => {
      spark.append(e.target.result);
      currentChunk++;
      
      if (currentChunk < chunks) {
        loadNext();
      } else {
        const hash = spark.end();
        if (fileStatus[fileUid]) {
          fileStatus[fileUid].calculating = false;
        }
        calculating.value = false;
        resolve(hash);
      }
    };
    
    fileReader.onerror = () => {
      if (fileStatus[fileUid]) {
        fileStatus[fileUid].calculating = false;
      }
      calculating.value = false;
      message.error('文件hash计算失败');
      resolve(null);
    };
    
    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      fileReader.readAsArrayBuffer(file.slice(start, end));
    }
    
    loadNext();
  });
};

// 文件上传前的处理
const beforeUpload = async (file) => {
  // 检查文件大小，这里限制为10GB以内
  const maxSize = 10 * 1024 * 1024 * 1024;
  if (file.size > maxSize) {
    message.error('文件大小不能超过10GB');
    return false;
  }
  
  // 添加文件到列表
  fileList.value.push(file);
  
  // 初始化文件状态
  fileStatus[file.uid] = {
    hash: '',
    chunks: [],
    progress: 0,
    uploading: false,
    success: false,
    error: false,
    errorMsg: '',
    speed: '',
    uploadedSize: 0,
    uploadStartTime: 0,
    calculating: false
  };
  
  // 阻止默认上传行为
  return false;
};

// 移除文件
const handleRemove = (file) => {
  // 如果该文件正在上传，取消上传
  if (fileStatus[file.uid]?.uploading) {
    cancelUpload(file);
  }
  
  // 从文件列表中移除
  const index = fileList.value.findIndex(item => item.uid === file.uid);
  if (index !== -1) {
    fileList.value.splice(index, 1);
  }
  
  // 从上传队列中移除
  const queueIndex = uploadQueue.value.findIndex(item => item.uid === file.uid);
  if (queueIndex !== -1) {
    uploadQueue.value.splice(queueIndex, 1);
  }
  
  // 删除文件状态
  if (fileStatus[file.uid]) {
    delete fileStatus[file.uid];
  }
};

// 取消单个文件的上传
const cancelUpload = (file) => {
  const fileUid = file.uid;
  if (fileStatus[fileUid]?.uploading && cancelTokenSources[fileUid]) {
    cancelTokenSources[fileUid].cancel('用户取消了上传');
    message.info(`文件 ${file.name} 上传已取消`);
    fileStatus[fileUid].uploading = false;
    
    if (speedIntervals[fileUid]) {
      clearInterval(speedIntervals[fileUid]);
      delete speedIntervals[fileUid];
    }
  }
};

// 取消所有上传
const cancelAllUploads = () => {
  fileList.value.forEach(file => {
    cancelUpload(file);
  });
  
  uploading.value = false;
  uploadQueue.value = [];
  error.value = '';
};

// 重试单个文件的上传
const retryUpload = (file) => {
  if (fileStatus[file.uid]) {
    fileStatus[file.uid].error = false;
    fileStatus[file.uid].errorMsg = '';
    
    // 将文件添加到上传队列
    if (!uploadQueue.value.some(item => item.uid === file.uid)) {
      uploadQueue.value.push(file);
    }
    
    // 如果当前没有上传任务，开始上传
    if (!uploading.value) {
      processUploadQueue();
    }
  }
};

// 重试所有失败的上传
const retryAllUploads = () => {
  error.value = '';
  
  // 找出所有失败的文件
  fileList.value.forEach(file => {
    if (fileStatus[file.uid]?.error) {
      retryUpload(file);
    }
  });
};

// 处理上传队列
const processUploadQueue = async () => {
  if (uploadQueue.value.length === 0 || !fileList.value.length) {
    uploading.value = false;
    return;
  }
  
  uploading.value = true;
  
  // 计算当前正在上传的文件数量
  const activeUploads = Object.values(fileStatus).filter(status => status.uploading).length;
  
  // 如果当前上传数量小于最大并发数，开始上传下一个文件
  if (activeUploads < MAX_CONCURRENT_FILES && uploadQueue.value.length > 0) {
    const nextBatch = uploadQueue.value.slice(0, MAX_CONCURRENT_FILES - activeUploads);
    
    // 从队列中移除这些文件
    uploadQueue.value = uploadQueue.value.filter(
      file => !nextBatch.some(item => item.uid === file.uid)
    );
    
    // 并行上传这些文件
    await Promise.all(nextBatch.map(file => uploadFile(file)));
    
    // 继续处理队列中的下一批文件
    if (uploadQueue.value.length > 0) {
      processUploadQueue();
    }
  }
};

// 开始上传所有文件
const handleUploadAll = async () => {
  if (fileList.value.length === 0) {
    message.error('请先选择文件');
    return;
  }
  
  calculating.value = true;
  error.value = '';
  
  try {
    // 将所有未上传成功且未在队列中的文件添加到上传队列
    const filesToUpload = fileList.value.filter(file => 
      !fileStatus[file.uid]?.success && 
      !fileStatus[file.uid]?.uploading && 
      !uploadQueue.value.some(item => item.uid === file.uid)
    );
    
    if (filesToUpload.length === 0) {
      calculating.value = false;
      message.info('没有需要上传的文件');
      return;
    }
    
    // 预先计算所有文件的hash，避免在上传过程中显示计算中状态
    await Promise.all(filesToUpload.map(async (file) => {
      if (!fileStatus[file.uid].hash) {
        const hash = await calculateFileHash(file);
        if (hash) {
          fileStatus[file.uid].hash = hash;
        } else {
          // 如果计算失败，设置错误状态
          fileStatus[file.uid].error = true;
          fileStatus[file.uid].errorMsg = '文件hash计算失败';
        }
      }
    }));
    
    // 只添加计算hash成功的文件到上传队列
    const validFiles = filesToUpload.filter(file => 
      fileStatus[file.uid].hash && !fileStatus[file.uid].error
    );
    
    validFiles.forEach(file => {
      uploadQueue.value.push(file);
    });
    
    // 开始处理上传队列
    calculating.value = false;
    
    if (uploadQueue.value.length > 0) {
      processUploadQueue();
    } else {
      message.error('所有文件都无法上传，请检查文件');
    }
  } catch (err) {
    calculating.value = false;
    error.value = `准备上传文件时出错: ${err.message || '未知错误'}`;
  }
};

// 上传单个文件
const uploadFile = async (file) => {
  const fileUid = file.uid;
  
  try {
    // 重置文件状态
    fileStatus[fileUid].uploading = true;
    fileStatus[fileUid].progress = 0;
    fileStatus[fileUid].error = false;
    fileStatus[fileUid].errorMsg = '';
    fileStatus[fileUid].uploadedSize = 0;
    
    // 如果hash还没计算，则计算hash (应该在handleUploadAll中已经预先计算)
    if (!fileStatus[fileUid].hash) {
      const hash = await calculateFileHash(file);
      if (!hash) {
        fileStatus[fileUid].error = true;
        fileStatus[fileUid].errorMsg = '文件hash计算失败，请重试';
        fileStatus[fileUid].uploading = false;
        throw new Error('文件hash计算失败');
      }
      fileStatus[fileUid].hash = hash;
    }
    
    // 检查文件是否已存在
    try {
      const checkResponse = await axios.post(`${API_URL}/check`, {
        hash: fileStatus[fileUid].hash,
        filename: file.name,
        fileSize: file.size
      });
      
      // 如果文件已完全上传
      if (checkResponse.data.uploaded) {
        message.success(`文件 ${file.name} 已秒传成功！`);
        fileStatus[fileUid].success = true;
        fileStatus[fileUid].uploading = false;
        fileStatus[fileUid].progress = 100;
        
        // 继续处理队列中的下一个文件
        processUploadQueue();
        return;
      }
      
      // 分割文件为多个块
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
      
      // 设置上传速度计算
      fileStatus[fileUid].uploadStartTime = Date.now();
      speedIntervals[fileUid] = setInterval(() => {
        const elapsedTime = (Date.now() - fileStatus[fileUid].uploadStartTime) / 1000; // 已上传时间（秒）
        const speed = fileStatus[fileUid].uploadedSize / elapsedTime; // 字节/秒
        
        if (speed < 1024) {
          fileStatus[fileUid].speed = `${speed.toFixed(1)} B/s`;
        } else if (speed < 1024 * 1024) {
          fileStatus[fileUid].speed = `${(speed / 1024).toFixed(1)} KB/s`;
        } else {
          fileStatus[fileUid].speed = `${(speed / (1024 * 1024)).toFixed(1)} MB/s`;
        }
      }, 1000);
      
      // 创建取消令牌
      cancelTokenSources[fileUid] = axios.CancelToken.source();
      
      // 初始化块状态
      fileStatus[fileUid].chunks = Array.from({ length: totalChunks }, (_, index) => {
        const start = index * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        return {
          index,
          start,
          end,
          progress: 0,
          status: 'waiting',
          chunk: file.slice(start, end),
          retryCount: 0
        };
      });
      
      // 获取已上传的分片
      const uploadedChunks = checkResponse.data.uploaded_chunks || [];
      
      // 标记已上传的块
      if (uploadedChunks.length > 0) {
        uploadedChunks.forEach(chunkIndex => {
          if (fileStatus[fileUid].chunks[chunkIndex]) {
            fileStatus[fileUid].chunks[chunkIndex].status = 'success';
            fileStatus[fileUid].chunks[chunkIndex].progress = 100;
          }
        });
        
        // 更新总进度
        fileStatus[fileUid].progress = calculateFileProgress(fileStatus[fileUid].chunks);
      }
      
      // 上传未完成的块
      await uploadFileChunks(file, uploadedChunks);
    } catch (checkError) {
      console.error('检查文件状态失败:', checkError);
      fileStatus[fileUid].error = true;
      fileStatus[fileUid].errorMsg = `检查文件状态失败: ${checkError.message || '未知错误'}`;
      fileStatus[fileUid].uploading = false;
      
      if (speedIntervals[fileUid]) {
        clearInterval(speedIntervals[fileUid]);
        delete speedIntervals[fileUid];
      }
    }
    
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Upload cancelled:', error.message);
    } else {
      console.error('Upload error:', error);
      fileStatus[fileUid].error = true;
      fileStatus[fileUid].errorMsg = `上传过程中发生错误: ${error.message || '未知错误'}`;
    }
    fileStatus[fileUid].uploading = false;
    
    if (speedIntervals[fileUid]) {
      clearInterval(speedIntervals[fileUid]);
      delete speedIntervals[fileUid];
    }
  }
};

// 上传文件块
const uploadFileChunks = async (file, uploadedChunks = []) => {
  const fileUid = file.uid;
  
  // 确保文件有切片
  if (!fileStatus[fileUid].chunks || fileStatus[fileUid].chunks.length === 0) {
    console.error('文件没有切片信息:', file.name);
    fileStatus[fileUid].error = true;
    fileStatus[fileUid].errorMsg = '文件切片错误';
    fileStatus[fileUid].uploading = false;
    return;
  }
  
  const pendingChunks = fileStatus[fileUid].chunks
    .filter(chunk => !uploadedChunks.includes(chunk.index))
    .map((chunk, index) => ({
      ...chunk,
      priority: index // 设置优先级
    }))
    .sort((a, b) => a.priority - b.priority); // 按优先级排序
  
  // 如果所有块都已上传，直接合并
  if (pendingChunks.length === 0) {
    await mergeFileChunks(file);
    return;
  }

  // 文件小于切片大小，且只有一个分片，简化上传过程
  if (fileStatus[fileUid].chunks.length === 1) {
    const chunk = fileStatus[fileUid].chunks[0];
    try {
      const formData = new FormData();
      formData.append('file', chunk.chunk);
      formData.append('hash', fileStatus[fileUid].hash);
      formData.append('filename', file.name);
      formData.append('chunkIndex', 0);
      formData.append('totalChunks', 1);
      
      const headers = {
        'X-File-Hash': fileStatus[fileUid].hash,
        'X-Chunk-Index': 0
      };
      
      await axios.post(`${API_URL}/upload`, formData, {
        headers,
        cancelToken: cancelTokenSources[fileUid].token,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          fileStatus[fileUid].chunks[0].progress = percentCompleted;
          fileStatus[fileUid].chunks[0].status = 'uploading';
          fileStatus[fileUid].progress = percentCompleted;
          fileStatus[fileUid].uploadedSize = (progressEvent.loaded / progressEvent.total) * file.size;
        }
      });
      
      fileStatus[fileUid].chunks[0].status = 'success';
      fileStatus[fileUid].chunks[0].progress = 100;
      fileStatus[fileUid].progress = 100;
      
      // 确保调用合并接口以完成上传
      await mergeFileChunks(file);
      return;
    } catch (err) {
      if (axios.isCancel(err)) {
        return;
      }
      fileStatus[fileUid].error = true;
      fileStatus[fileUid].errorMsg = `上传失败: ${err.message || '未知错误'}`;
      fileStatus[fileUid].uploading = false;
      return;
    }
  }
  
  // 控制并发请求数量
  const uploadQueue = async () => {
    const activeRequests = [];
    let completedChunks = 0;
    
    // 处理队列中的每个块
    for (let i = 0; i < pendingChunks.length; i++) {
      if (activeRequests.length >= MAX_CONCURRENT_REQUESTS) {
        // 等待某个请求完成
        await Promise.race(activeRequests);
      }
      
      // 如果上传被取消，终止所有上传
      if (!fileStatus[fileUid].uploading) {
        return;
      }
      
      const chunk = pendingChunks[i];
      
      // 创建上传请求函数
      const uploadChunk = async (chunk, retryCount = 0) => {
        const formData = new FormData();
        formData.append('file', chunk.chunk);
        formData.append('hash', fileStatus[fileUid].hash);
        formData.append('filename', file.name);
        formData.append('chunkIndex', chunk.index);
        formData.append('totalChunks', fileStatus[fileUid].chunks.length);
        
        // 添加请求头以便在服务器端捕获
        const headers = {
          'X-File-Hash': fileStatus[fileUid].hash,
          'X-Chunk-Index': chunk.index
        };
        
        try {
          await axios.post(`${API_URL}/upload`, formData, {
            headers,
            cancelToken: cancelTokenSources[fileUid].token,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              
              // 更新块的进度
              const chunkIndex = chunk.index;
              if (fileStatus[fileUid].chunks[chunkIndex]) {
                fileStatus[fileUid].chunks[chunkIndex].progress = percentCompleted;
                fileStatus[fileUid].chunks[chunkIndex].status = 'uploading';
                
                // 更新总进度
                fileStatus[fileUid].progress = calculateFileProgress(fileStatus[fileUid].chunks);
                
                // 更新已上传的总大小（用于计算速度）
                const chunkSize = fileStatus[fileUid].chunks[chunkIndex].end - fileStatus[fileUid].chunks[chunkIndex].start;
                fileStatus[fileUid].uploadedSize += (progressEvent.loaded / progressEvent.total) * chunkSize;
              }
            }
          });
          
          // 更新块状态为成功
          fileStatus[fileUid].chunks[chunk.index].status = 'success';
          fileStatus[fileUid].chunks[chunk.index].progress = 100;
          
          // 更新总进度
          fileStatus[fileUid].progress = calculateFileProgress(fileStatus[fileUid].chunks);
          
          completedChunks++;
          
          // 如果所有块都已上传，进行合并
          if (completedChunks === pendingChunks.length) {
            await mergeFileChunks(file);
          }
          
          return true;
        } catch (err) {
          // 如果是取消异常，直接返回
          if (axios.isCancel(err)) {
            return false;
          }
          
          // 如果达到最大重试次数，标记为失败
          if (retryCount >= MAX_RETRY_COUNT) {
            fileStatus[fileUid].chunks[chunk.index].status = 'error';
            fileStatus[fileUid].error = true;
            fileStatus[fileUid].errorMsg = `第${chunk.index + 1}块上传失败，请重试`;
            return false;
          }
          
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 递增重试计数并重试
          return uploadChunk(chunk, retryCount + 1);
        }
      };
      
      // 执行上传请求并添加到活动请求数组
      const uploadRequest = uploadChunk(chunk)
        .then(() => {
          // 从活动请求中移除
          const index = activeRequests.indexOf(uploadRequest);
          if (index !== -1) {
            activeRequests.splice(index, 1);
          }
        });
      
      activeRequests.push(uploadRequest);
    }
    
    // 等待所有活动请求完成
    await Promise.all(activeRequests);
  };
  
  await uploadQueue();
};

// 合并文件块
const mergeFileChunks = async (file) => {
  const fileUid = file.uid;
  
  try {
    // 请求合并所有块
    await axios.post(`${API_URL}/merge`, {
      hash: fileStatus[fileUid].hash,
      filename: file.name,
      size: file.size,
      totalChunks: fileStatus[fileUid].chunks.length
    });
    
    // 更新上传状态
    fileStatus[fileUid].success = true;
    fileStatus[fileUid].uploading = false;
    fileStatus[fileUid].progress = 100;
    message.success(`文件 ${file.name} 上传成功！`);
    
    // 清除速度计算定时器
    if (speedIntervals[fileUid]) {
      clearInterval(speedIntervals[fileUid]);
      delete speedIntervals[fileUid];
    }
    
    // 延迟一点再处理队列，避免UI更新冲突
    setTimeout(() => {
      // 检查队列中是否还有待上传的文件
      processUploadQueue();
    }, 100);
  } catch (error) {
    console.error('Merge error:', error);
    fileStatus[fileUid].error = true;
    fileStatus[fileUid].errorMsg = `文件合并失败: ${error.message || '未知错误'}`;
    fileStatus[fileUid].uploading = false;
    
    if (speedIntervals[fileUid]) {
      clearInterval(speedIntervals[fileUid]);
      delete speedIntervals[fileUid];
    }
  }
};
</script>

<style scoped>
.upload-container {
  border: 1px solid #e8e8e8;
  padding: 20px;
  border-radius: 4px;
  background-color: #fafafa;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.file-item {
  margin-top: 20px;
  padding: 15px;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.file-info {
  margin-bottom: 10px;
}

.progress-container {
  margin-top: 15px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.chunk-list {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.chunk-item {
  position: relative;
  width: 40px;
  height: 25px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chunk-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.chunk-progress-bar {
  height: 100%;
  background-color: #ccc;
  transition: width 0.3s;
}

.chunk-progress-bar.uploading {
  background-color: #1890ff;
}

.chunk-progress-bar.success {
  background-color: #52c41a;
}

.chunk-progress-bar.error {
  background-color: #f5222d;
}

.chunk-progress-bar.waiting {
  background-color: #d9d9d9;
}

.chunk-index {
  position: relative;
  z-index: 2;
  font-size: 10px;
  color: #333;
}

.success-message {
  margin-top: 15px;
}

.error-message {
  margin: 15px 0;
}

.retry-button {
  margin-top: 10px;
}
</style> 