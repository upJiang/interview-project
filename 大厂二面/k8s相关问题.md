# Kubernetes (k8s) 相关问题 - 前端面试指南

## 📋 常见面试题与答案

### Q1: 什么是Kubernetes？前端开发者为什么需要了解k8s？

**标准答案：**
Kubernetes是一个开源的容器编排平台，用于自动化部署、扩展和管理容器化应用程序。

**前端开发者需要了解k8s的原因：**
1. **微服务架构**：前端应用作为独立服务部署
2. **自动化部署**：简化CI/CD流程
3. **高可用性**：确保应用稳定运行
4. **资源管理**：优化资源使用效率

**面试回答技巧：**
```yaml
# 前端应用Deployment示例
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-app
  labels:
    app: frontend
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
        image: frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Q2: k8s的核心组件有哪些？

**标准答案：**

**Master节点组件：**
- **API Server**：集群统一入口
- **etcd**：分布式键值存储
- **Scheduler**：调度器
- **Controller Manager**：控制器管理器

**Node节点组件：**
- **kubelet**：节点代理
- **kube-proxy**：网络代理
- **Container Runtime**：容器运行时

**面试回答技巧：**
```bash
# 查看集群组件状态
kubectl get componentstatuses

# 查看节点信息
kubectl get nodes

# 查看Pod状态
kubectl get pods -A
```

### Q3: 如何为前端应用创建k8s部署？

**标准答案：**
使用Deployment资源来管理前端应用的部署。

**面试回答技巧：**
```yaml
# 完整的部署配置
apiVersion: apps/v1
kind: Deployment
metadata:
  name: react-app
  namespace: frontend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: react-app
  template:
    metadata:
      labels:
        app: react-app
    spec:
      containers:
      - name: react-app
        image: react-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: REACT_APP_API_URL
          value: "https://api.example.com"
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Q4: 如何配置前端应用的服务发现？

**标准答案：**
使用Service资源来暴露前端应用，实现负载均衡和服务发现。

**面试回答技巧：**
```yaml
# Service配置
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: frontend
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  selector:
    app: react-app
---
# Ingress配置（用于域名路由）
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: frontend-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### Q5: 如何实现前端应用的滚动更新？

**标准答案：**
使用RollingUpdate策略，逐步替换旧版本Pod。

**面试回答技巧：**
```yaml
# 滚动更新配置
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-app
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2        # 最多可以超出期望副本数的数量
      maxUnavailable: 1  # 更新过程中最多不可用的Pod数量
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
        image: frontend:v2.0.0
        ports:
        - containerPort: 80
```

```bash
# 执行滚动更新
kubectl set image deployment/frontend-app frontend=frontend:v2.0.0

# 查看更新状态
kubectl rollout status deployment/frontend-app

# 回滚到上一个版本
kubectl rollout undo deployment/frontend-app
```

### Q6: 如何配置前端应用的健康检查？

**标准答案：**
使用readinessProbe和livenessProbe来监控应用健康状态。

**面试回答技巧：**
```yaml
# 健康检查配置
spec:
  containers:
  - name: frontend
    image: frontend:latest
    ports:
    - containerPort: 3000
    readinessProbe:
      httpGet:
        path: /ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
```

```javascript
// 前端健康检查端点示例
// health.js
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/ready', (req, res) => {
  // 检查应用是否准备就绪
  if (app.isReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});
```

### Q7: 如何管理前端应用的环境变量和配置？

**标准答案：**
使用ConfigMap和Secret来管理配置信息。

**面试回答技巧：**
```yaml
# ConfigMap配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
data:
  REACT_APP_API_URL: "https://api.example.com"
  REACT_APP_ENV: "production"
  REACT_APP_VERSION: "1.0.0"
---
# Secret配置
apiVersion: v1
kind: Secret
metadata:
  name: frontend-secret
type: Opaque
data:
  REACT_APP_API_KEY: <base64-encoded-value>
---
# 在Deployment中使用
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-app
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: frontend:latest
        env:
        - name: REACT_APP_API_URL
          valueFrom:
            configMapKeyRef:
              name: frontend-config
              key: REACT_APP_API_URL
        - name: REACT_APP_API_KEY
          valueFrom:
            secretKeyRef:
              name: frontend-secret
              key: REACT_APP_API_KEY
```

### Q8: 如何实现前端应用的自动扩缩容？

**标准答案：**
使用HorizontalPodAutoscaler (HPA) 根据CPU和内存使用率自动扩缩容。

**面试回答技巧：**
```yaml
# HPA配置
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

```bash
# 查看HPA状态
kubectl get hpa

# 手动扩缩容
kubectl scale deployment frontend-app --replicas=5
```

## 🎯 面试技巧总结

### 回答策略

**1. 概念理解**
- 理解k8s的核心概念（Pod、Deployment、Service、Ingress）
- 解释为什么前端需要容器编排

**2. 实践经验**
- 展示实际的YAML配置文件编写
- 说明部署策略和健康检查的重要性

**3. 技术深度**
- 理解k8s架构和组件作用
- 掌握资源管理和扩缩容机制

### 加分点

1. **配置优化**：合理设置资源限制和健康检查
2. **安全考虑**：使用RBAC、NetworkPolicy等安全机制
3. **监控意识**：集成Prometheus、Grafana等监控工具
4. **CI/CD集成**：展示与Jenkins、GitLab CI的集成经验

### 常见误区

1. **只关注部署**：要理解k8s的完整生态
2. **忽视监控**：要关注应用性能和健康状态
3. **配置不当**：要合理设置资源限制和健康检查
4. **缺乏实践经验**：要有实际的项目部署经验

### 面试准备清单

- [ ] 理解k8s核心概念和架构
- [ ] 能够编写基本的YAML配置文件
- [ ] 掌握Deployment、Service、Ingress的使用
- [ ] 了解健康检查和资源管理
- [ ] 准备实际项目案例
- [ ] 了解监控和日志收集方案

## 💡 总结

Kubernetes在前端开发中主要用于：
1. **容器编排**：自动化部署和管理前端应用
2. **高可用性**：确保应用稳定运行和故障恢复
3. **资源管理**：优化资源使用和成本控制
4. **微服务架构**：支持前端应用独立部署和扩展

面试时要重点展示：
- 对k8s核心概念的理解
- 实际的YAML配置文件编写经验
- 部署策略和健康检查配置
- 与CI/CD集成的实践经验 