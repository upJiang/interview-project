# React面试题集合

这个目录包含了React面试中常见的题目和实现，每个题目都有详细的代码实现、注释和思路总结，方便理解和记忆。

## 目录结构

```
react/
├── README.md                    # 本文件，项目说明
├── study.md                     # 学习指南和面试技巧总结
├── 组件设计/
│   ├── Counter.jsx              # 计数器组件
│   ├── Counter.md               # 计数器组件说明
│   ├── TodoList.jsx             # 待办事项列表
│   ├── TodoList.md              # 待办事项列表说明
│   ├── Modal.jsx                # 模态框组件
│   ├── Modal.md                 # 模态框组件说明
│   ├── InfiniteScroll.jsx       # 无限滚动组件
│   └── InfiniteScroll.md        # 无限滚动组件说明
├── Hooks实现/
│   ├── useState.js              # useState Hook实现
│   ├── useState.md              # useState Hook说明
│   ├── useEffect.js             # useEffect Hook实现
│   ├── useEffect.md             # useEffect Hook说明
│   ├── useReducer.js            # useReducer Hook实现
│   ├── useReducer.md            # useReducer Hook说明
│   ├── useMemo.js               # useMemo Hook实现
│   ├── useMemo.md               # useMemo Hook说明
│   ├── useCallback.js           # useCallback Hook实现
│   └── useCallback.md           # useCallback Hook说明
├── 自定义Hooks/
│   ├── useDebounce.js           # 防抖Hook
│   ├── useDebounce.md           # 防抖Hook说明
│   ├── useThrottle.js           # 节流Hook
│   ├── useThrottle.md           # 节流Hook说明
│   ├── useLocalStorage.js       # 本地存储Hook
│   ├── useLocalStorage.md       # 本地存储Hook说明
│   ├── useFetch.js              # 数据获取Hook
│   ├── useFetch.md              # 数据获取Hook说明
│   ├── useToggle.js             # 切换状态Hook
│   └── useToggle.md             # 切换状态Hook说明
├── 高阶组件/
│   ├── withLoading.jsx          # 加载状态HOC
│   ├── withLoading.md           # 加载状态HOC说明
│   ├── withAuth.jsx             # 权限控制HOC
│   ├── withAuth.md              # 权限控制HOC说明
│   ├── withErrorBoundary.jsx    # 错误边界HOC
│   └── withErrorBoundary.md     # 错误边界HOC说明
├── 状态管理/
│   ├── simpleRedux.js           # 简单Redux实现
│   ├── simpleRedux.md           # 简单Redux说明
│   ├── useReducerStore.js       # useReducer状态管理
│   ├── useReducerStore.md       # useReducer状态管理说明
│   ├── contextStore.js          # Context状态管理
│   └── contextStore.md          # Context状态管理说明
├── 性能优化/
│   ├── LazyComponent.jsx        # 懒加载组件
│   ├── LazyComponent.md         # 懒加载组件说明
│   ├── VirtualList.jsx          # 虚拟列表组件
│   ├── VirtualList.md           # 虚拟列表组件说明
│   ├── MemoComponent.jsx        # React.memo优化
│   └── MemoComponent.md         # React.memo优化说明
└── 生命周期/
    ├── ClassComponent.jsx       # 类组件生命周期
    ├── ClassComponent.md        # 类组件生命周期说明
    ├── FunctionComponent.jsx    # 函数组件生命周期
    └── FunctionComponent.md     # 函数组件生命周期说明
```

## 使用方式

每个实现文件都有对应的说明文档，建议先阅读说明文档了解概念，再查看代码实现。

## 学习建议

1. 先阅读代码和注释，理解实现原理
2. 尝试自己不看代码实现一遍
3. 参考 study.md 中的面试技巧
4. 在面试前反复练习，直到能够流畅地写出来
5. 理解每个概念的使用场景和最佳实践 