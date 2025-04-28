# 前端手写题集合

这个目录包含了前端面试中常见的手写题实现，每个题目都有详细的注释和思路总结，方便理解和记忆。

## 目录结构

```
手写题/
├── README.md                # 本文件，项目说明
├── study.md                 # 学习指南和面试技巧
├── 防抖节流/
│   ├── debounce.js          # 防抖函数实现
│   └── throttle.js          # 节流函数实现
├── Promise/
│   ├── Promise.js           # Promise A+规范实现
│   ├── promiseAll.js        # Promise.all实现
│   ├── promiseRace.js       # Promise.race实现
│   ├── promiseAllSettled.js # Promise.allSettled实现
│   └── promiseAny.js        # Promise.any实现
├── 实用工具/
│   ├── deepClone.js         # 深拷贝实现
│   ├── curry.js             # 函数柯里化
│   ├── compose.js           # 函数组合
│   ├── flatten.js           # 数组扁平化
│   └── memoize.js           # 函数记忆化
├── 原型和继承/
│   ├── new.js               # new操作符实现
│   ├── instanceof.js        # instanceof操作符实现
│   ├── inherit.js           # 各种继承方式实现
│   └── bind.js              # Function.prototype.bind实现
├── 异步控制/
│   ├── asyncPool.js         # 异步并发控制
│   └── scheduler.js         # 任务调度器
└── 设计模式/
    ├── eventEmitter.js      # 事件发布订阅模式
    ├── singleton.js         # 单例模式
    └── observer.js          # 观察者模式
```

## 使用方式

每个实现文件都可以直接运行，例如:

```bash
node 防抖节流/debounce.js
```

## 学习建议

1. 先阅读代码和注释，理解实现原理
2. 尝试自己不看代码实现一遍
3. 参考 study.md 中的面试技巧
4. 在面试前反复练习，直到能够流畅地手写出来 