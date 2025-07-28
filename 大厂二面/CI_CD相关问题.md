# CI/CD 相关问题 - 前端面试指南

## 📋 常见面试题与答案

### Q1: 什么是CI/CD？前端开发中为什么重要？

**标准答案：**
CI/CD是持续集成(Continuous Integration)和持续部署(Continuous Deployment)的缩写，是一种软件开发实践。

**前端开发中的重要性：**
1. **快速反馈**：及时发现和修复问题
2. **自动化部署**：减少人工错误
3. **版本控制**：确保代码质量和一致性
4. **团队协作**：提高开发效率

**面试回答技巧：**
```yaml
# GitLab CI/CD 配置示例
# .gitlab-ci.yml
stages:
  - install
  - test
  - build
  - deploy

install_dependencies:
  stage: install
  image: node:18-alpine
  script:
    - npm ci
  cache:
    paths:
      - node_modules/
  artifacts:
    paths:
      - node_modules/

run_tests:
  stage: test
  image: node:18-alpine
  script:
    - npm run test:ci
    - npm run lint
  dependencies:
    - install_dependencies

build_app:
  stage: build
  image: node:18-alpine
  script:
    - npm run build
    - docker build -t frontend:$CI_COMMIT_SHA .
  artifacts:
    paths:
      - dist/
  dependencies:
    - install_dependencies

deploy_production:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying to production..."
    - kubectl set image deployment/frontend frontend=frontend:$CI_COMMIT_SHA
  only:
    - main
  when: manual
```

### Q2: 如何设计前端项目的CI/CD流水线？

**标准答案：**
设计多阶段流水线，包括代码检查、测试、构建、部署等阶段。

**面试回答技巧：**
```yaml
# GitHub Actions 配置示例
# .github/workflows/ci-cd.yml
name: Frontend CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Build application
      run: npm run build
      env:
        REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment"
        # 部署到测试环境的脚本

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
        # 部署到生产环境的脚本
```

### Q3: 如何实现前端项目的自动化测试？

**标准答案：**
集成单元测试、集成测试和端到端测试到CI/CD流程中。

**面试回答技巧：**
```javascript
// Jest 测试配置示例
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// package.json 测试脚本
{
  "scripts": {
    "test": "jest",
    "test:ci": "jest --coverage --watchAll=false",
    "test:watch": "jest --watch",
    "test:e2e": "cypress run",
    "test:e2e:ci": "cypress run --headless"
  }
}
```

```javascript
// 组件测试示例
// src/components/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  test('renders button with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Q4: 如何实现前端项目的自动化部署？

**标准答案：**
使用Docker容器化和k8s编排，结合CI/CD工具实现自动化部署。

**面试回答技巧：**
```bash
# 部署脚本示例
#!/bin/bash
# deploy.sh

set -e

# 构建Docker镜像
docker build -t frontend:$CI_COMMIT_SHA .

# 推送到镜像仓库
docker tag frontend:$CI_COMMIT_SHA registry.example.com/frontend:$CI_COMMIT_SHA
docker push registry.example.com/frontend:$CI_COMMIT_SHA

# 更新k8s部署
kubectl set image deployment/frontend frontend=registry.example.com/frontend:$CI_COMMIT_SHA

# 等待部署完成
kubectl rollout status deployment/frontend

# 健康检查
curl -f http://frontend.example.com/health || exit 1
```

```yaml
# k8s部署配置
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: registry.example.com/frontend:latest
        ports:
        - containerPort: 80
        readinessProbe:
          httpGet:
            path: /health
            port: 80
```

### Q5: 如何实现蓝绿部署和金丝雀发布？

**标准答案：**
蓝绿部署是同时维护两个相同环境，金丝雀发布是逐步将流量迁移到新版本。

**面试回答技巧：**
```yaml
# 蓝绿部署配置
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  selector:
    app: frontend
    version: blue  # 或 green
  ports:
  - port: 80
    targetPort: 3000
---
# 金丝雀发布配置
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: frontend-ingress
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"  # 10%流量到新版本
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service-canary
            port:
              number: 80
```

### Q6: 如何监控CI/CD流水线的性能？

**标准答案：**
使用监控工具跟踪构建时间、成功率、部署频率等指标。

**面试回答技巧：**
```yaml
# Prometheus监控配置
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gitlab-ci'
    static_configs:
      - targets: ['gitlab.example.com:9090']
    metrics_path: '/-/metrics'
    scrape_interval: 30s

  - job_name: 'jenkins'
    static_configs:
      - targets: ['jenkins.example.com:8080']
    metrics_path: '/prometheus'
```

```javascript
// 构建性能监控
// build-metrics.js
const { execSync } = require('child_process');
const fs = require('fs');

class BuildMetrics {
  constructor() {
    this.startTime = Date.now();
  }

  recordBuildTime() {
    const buildTime = Date.now() - this.startTime;
    console.log(`Build completed in ${buildTime}ms`);
    
    // 记录到文件或发送到监控系统
    fs.appendFileSync('build-metrics.log', 
      `${new Date().toISOString()},${buildTime}\n`);
  }

  recordTestResults(results) {
    const { passed, failed, total } = results;
    console.log(`Tests: ${passed}/${total} passed, ${failed} failed`);
  }
}

module.exports = BuildMetrics;
```

### Q7: 如何实现前端项目的环境管理？

**标准答案：**
使用环境变量、配置文件和环境特定的部署策略。

**面试回答技巧：**
```javascript
// 环境配置管理
// config/environment.js
const environments = {
  development: {
    API_URL: 'http://localhost:3001',
    DEBUG: true,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_URL: 'https://staging-api.example.com',
    DEBUG: false,
    LOG_LEVEL: 'info'
  },
  production: {
    API_URL: 'https://api.example.com',
    DEBUG: false,
    LOG_LEVEL: 'error'
  }
};

const getConfig = (env = process.env.NODE_ENV || 'development') => {
  return environments[env] || environments.development;
};

module.exports = { getConfig };
```

```yaml
# 环境特定的部署配置
# k8s/staging/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-staging
  namespace: staging
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: frontend
        image: frontend:staging
        env:
        - name: NODE_ENV
          value: "staging"
        - name: REACT_APP_API_URL
          value: "https://staging-api.example.com"
```

## 🎯 面试技巧总结

### 回答策略

**1. 概念理解**
- 理解CI/CD的核心概念和优势
- 解释为什么前端需要CI/CD

**2. 实践经验**
- 展示实际的配置文件编写
- 说明不同阶段的职责和作用

**3. 技术深度**
- 理解自动化测试的重要性
- 掌握部署策略和监控方法

### 加分点

1. **自动化程度**：展示完整的自动化流程
2. **测试覆盖**：强调测试的重要性和覆盖率
3. **监控意识**：展示性能监控和告警机制
4. **安全考虑**：说明安全扫描和漏洞检测

### 常见误区

1. **只关注部署**：要理解完整的CI/CD流程
2. **忽视测试**：要重视自动化测试的重要性
3. **缺乏监控**：要关注流水线性能和应用状态
4. **环境混乱**：要规范环境管理

### 面试准备清单

- [ ] 理解CI/CD核心概念和流程
- [ ] 能够编写基本的CI/CD配置文件
- [ ] 掌握自动化测试的配置和执行
- [ ] 了解部署策略和监控方法
- [ ] 准备实际项目案例
- [ ] 了解不同CI/CD工具的特点

## 💡 总结

CI/CD在前端开发中主要用于：
1. **自动化流程**：减少人工干预，提高效率
2. **质量保证**：通过自动化测试确保代码质量
3. **快速部署**：实现快速、可靠的部署
4. **团队协作**：提高开发团队的协作效率

面试时要重点展示：
- 对CI/CD核心概念的理解
- 实际的配置文件编写经验
- 自动化测试和部署策略
- 监控和性能优化意识 