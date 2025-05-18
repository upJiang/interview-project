# Git 基础知识

## Git 简介

Git是一个分布式版本控制系统，用于跟踪文件变化，协调多人协作的软件开发工作。

```javascript
function gitIntroduction() {
  // Git的主要特点:
  // - 分布式版本控制
  // - 强大的分支管理
  // - 快速高效
  // - 数据完整性保证
  // - 支持离线工作
  
  // Git与其他版本控制系统(如SVN)的区别:
  // 1. 分布式vs集中式
  // - SVN: 需要中央服务器，离线无法提交
  // - Git: 本地仓库包含完整历史，可离线提交
  // 2. 存储方式
  // - SVN: 存储文件差异
  // - Git: 存储文件快照
  // 3. 分支管理
  // - SVN: 分支是目录的副本，操作缓慢且占用空间
  // - Git: 分支仅是指向提交的轻量级指针，切换迅速
  // 4. 操作速度
  // - Git: 大部分操作在本地完成，速度快
  // - SVN: 许多操作需要与服务器通信，速度受网络影响
}
```

## Git 工作区域

Git项目有三个工作区域：工作目录、暂存区和Git仓库。

```javascript
function gitWorkingAreas() {
  // Git的三个工作区:
  // 1. 工作目录 (Working Directory)
  // - 包含项目的实际文件
  // - 可以编辑、修改文件
  // - 未被Git追踪和管理的区域
  
  // 2. 暂存区 (Staging Area / Index)
  // - 临时存储修改的区域
  // - 使用git add命令将文件添加到暂存区
  // - 暂存区记录了下次提交的内容
  
  // 3. 版本库 (Repository)
  // - .git目录，包含所有提交的历史版本
  // - 本地仓库存储在.git/objects中
  // - 远程仓库引用存储在.git/refs/remotes中
  
  // Git工作流程:
  // 1. 在工作目录中修改文件
  // 2. 使用git add将修改添加到暂存区
  // 3. 使用git commit将暂存区内容提交到版本库
  // 4. 使用git push将本地版本库同步到远程仓库
}
```

## Git 基本配置

在使用Git前需要进行一些基本配置，如用户名和邮箱设置。

```javascript
function gitBasicConfig() {
  // 配置Git的用户信息
  // - 全局配置(对所有仓库有效)
  /* 
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  */
  
  // - 仓库级配置(只对当前仓库有效)
  /*
  git config user.name "Your Name"
  git config user.email "your.email@example.com"
  */
  
  // 查看配置
  // git config --list
  
  // 配置编辑器
  // git config --global core.editor "vim"
  
  // 配置差异对比工具
  // git config --global merge.tool "vimdiff"
  
  // 配置别名
  // git config --global alias.co checkout
  // git config --global alias.br branch
  // git config --global alias.ci commit
  // git config --global alias.st status
  
  // Git配置文件的位置:
  // - 系统级: /etc/gitconfig
  // - 全局级: ~/.gitconfig 或 ~/.config/git/config
  // - 仓库级: .git/config
}
```

## Git 基本操作

Git的基本操作包括初始化仓库、添加文件、提交更改等。

```javascript
function gitBasicOperations() {
  // 初始化仓库
  // git init
  
  // 查看仓库状态
  // git status
  
  // 添加文件到暂存区
  // git add <file>  // 添加单个文件
  // git add .       // 添加所有更改
  
  // 提交更改
  // git commit -m "Commit message"
  
  // 查看提交历史
  // git log
  // git log --oneline  // 简洁模式
  // git log --graph    // 图形化显示
  
  // 查看文件差异
  // git diff           // 工作目录vs暂存区
  // git diff --staged  // 暂存区vs最近一次提交
  // git diff HEAD      // 工作目录vs最近一次提交
  
  // 撤销工作目录中的修改
  // git checkout -- <file>
  
  // 撤销暂存区的修改
  // git reset HEAD <file>
  
  // 修改最近一次提交
  // git commit --amend
  
  // 查看远程仓库
  // git remote -v
  
  // 添加远程仓库
  // git remote add origin https://github.com/user/repo.git
  
  // 从远程仓库获取更新
  // git fetch origin
  
  // 合并远程分支
  // git merge origin/master
  
  // 获取并合并(拉取)
  // git pull origin master
  
  // 推送到远程仓库
  // git push origin master
}
```

## Git 忽略文件

通过.gitignore文件可以指定Git应忽略的文件和目录。

```javascript
function gitIgnoreFiles() {
  // .gitignore文件用于指定Git忽略的文件和目录
  
  // .gitignore文件示例:
  /*
  # 忽略所有.log文件
  *.log
  
  # 忽略所有build目录下的文件
  build/
  
  # 忽略node_modules目录
  node_modules/
  
  # 忽略特定文件
  config.json
  
  # 使用!前缀表示不忽略
  !important.log
  
  # 忽略所有.txt文件，除了doc目录下的
  *.txt
  !doc/*.txt
  */
  
  // .gitignore规则:
  // - 每行一个匹配模式
  // - #开头的行是注释
  // - 空行会被忽略
  // - /结尾表示目录
  // - !开头表示取反(不忽略)
  // - *匹配零个或多个字符
  // - ?匹配一个字符
  // - []匹配指定范围内的字符
  
  // 默认会从当前目录递归向上查找.gitignore文件
  
  // 全局忽略文件配置(对所有仓库有效):
  // git config --global core.excludesfile ~/.gitignore_global
}
```

## 常见面试题

1. Git与SVN的主要区别是什么?
2. 如何撤销最后一次提交?
3. 什么是快进合并(fast-forward merge)?
4. 如何解决Git合并冲突?
5. Git的分支模型是怎样的? 