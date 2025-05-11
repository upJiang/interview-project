<template>
  <div class="container">
    <h1>大文件上传演示</h1>
    <FileUpload />
  </div>
</template>

<script setup>
import FileUpload from './components/FileUpload.vue';
</script>

<style>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}
</style> 