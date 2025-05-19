# Git 分支管理

## 分支概念

Git分支是指向提交对象的可移动指针，它使我们能够在不同的开发线上独立工作。

### Git分支的特点:
- 轻量级：创建和切换分支几乎是瞬间完成的
- 独立性：每个分支可以独立开发，互不干扰
- 指针特性：本质上是指向提交对象的指针

### Git中的HEAD指针:
- HEAD是一个特殊指针，指向当前所在的分支
- 当切换分支时，HEAD指针会移动到新分支
- 当提交时，当前分支指针会随着新提交向前移动

## 分支操作

Git提供了丰富的分支操作命令，用于创建、切换和管理分支。

### 查看分支
```
git branch          # 查看本地分支
git branch -r       # 查看远程分支
git branch -a       # 查看所有分支（本地+远程）
git branch -v       # 查看分支最后一次提交
```

### 创建分支
```
git branch <branch-name>               # 创建新分支
git checkout -b <branch-name>          # 创建并切换到新分支
git checkout -b <branch> <start-point> # 从特定提交创建分支
```

### 切换分支
```
git checkout <branch-name>
git switch <branch-name>  # Git 2.23+新命令
```

### 重命名分支
```
git branch -m <old-name> <new-name>
```

### 删除分支
```
git branch -d <branch-name>  # 安全删除（检查是否合并）
git branch -D <branch-name>  # 强制删除
```

### 查看分支合并状态
```
git branch --merged     # 查看已合并到当前分支的分支
git branch --no-merged  # 查看未合并到当前分支的分支
```

## 远程分支

远程分支是对远程仓库中分支状态的引用，它们帮助我们追踪远程仓库的变化。

### 远程分支命名规则: 
- 格式: `<remote>/<branch>`
- 例如: `origin/master`, `origin/develop`

### 查看远程分支
```
git branch -r
```

### 获取远程分支信息
```
git fetch <remote>
```

### 从远程分支创建本地分支
```
git checkout -b <local-branch> <remote>/<branch>
git checkout --track <remote>/<branch>  # 自动设置跟踪关系
```

### 推送本地分支到远程
```
git push <remote> <branch>
git push -u <remote> <branch>  # 推送并设置跟踪关系
```

### 删除远程分支
```
git push <remote> --delete <branch>
git push <remote> :<branch>  # 简写形式
```

### 设置分支跟踪关系
```
git branch -u <remote>/<branch>
git branch --set-upstream-to=<remote>/<branch>
```

## 分支管理策略

Git分支管理策略有多种，选择合适的策略可以提高团队协作效率。

### 常见分支管理策略:

#### 1. Git Flow
- **master**: 主分支，存放发布版本
- **develop**: 开发分支，日常开发
- **feature/\***: 功能分支，开发新功能
- **release/\***: 发布分支，准备发布版本
- **hotfix/\***: 热修复分支，修复生产环境bug

#### 2. GitHub Flow
- **master**: 主分支，始终可部署
- **feature**: 从master创建功能分支，完成后通过PR合并回master

#### 3. GitLab Flow
- 结合Git Flow和GitHub Flow的优点
- **master**: 主分支
- **production**: 生产环境分支
- **pre-production**: 预生产环境分支
- 功能分支从master创建，完成后合并回master

#### 4. Trunk Based Development
- 所有开发在主干(master)上进行
- 短期功能分支，尽快合并回主干
- 重视持续集成

### 选择分支策略考虑因素:
- 团队规模
- 项目复杂度
- 发布频率
- 持续集成/持续部署实践

## 常见面试题

1. Git分支的实现原理是什么？
2. 如何在Git中解决分支冲突？
3. Git中的HEAD指针是什么？
4. 如何删除已经合并到master的所有分支？
5. 什么情况下应该创建新的分支？ 