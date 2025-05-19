# Git 重置与撤销

## 重置概念

Git重置是一种强大的撤销操作，允许你将HEAD指针和当前分支引用移动到特定的提交。

### Git重置的基本概念
- 重置(reset)会移动HEAD指针和当前分支引用
- 可以用来撤销提交、取消暂存文件或恢复工作目录
- 是一个强大但也有一定风险的操作

### 重置的三个阶段
1. **移动HEAD (--soft)**
   - 仅移动HEAD指针和分支引用
   - 不影响暂存区和工作目录

2. **更新暂存区 (--mixed，默认)**
   - 移动HEAD指针和分支引用
   - 重置暂存区以匹配指定的提交
   - 不影响工作目录

3. **更新工作目录 (--hard)**
   - 移动HEAD指针和分支引用
   - 重置暂存区以匹配指定的提交
   - 重置工作目录以匹配指定的提交
   - 注意：这会丢失未提交的修改

## 重置操作

Git提供了多种重置命令，用于不同的撤销需求。

### 软重置 - 只移动HEAD
```
git reset --soft <commit>
```
- 用于修改最近的提交历史
- 保留所有修改在暂存区

### 混合重置 - 移动HEAD并更新暂存区(默认)
```
git reset --mixed <commit> 或 git reset <commit>
```
- 用于撤销暂存的更改
- 保留所有修改在工作目录

### 硬重置 - 移动HEAD并更新暂存区和工作目录
```
git reset --hard <commit>
```
- 完全丢弃所有未提交的更改
- 慎用，操作不可逆

### 重置单个文件
```
git reset <commit> -- <file>
```
- 只重置特定文件的暂存状态
- 不会移动HEAD指针

### 撤销暂存的文件
```
git reset -- <file>
```
- 等同于git reset HEAD <file>
- 将文件从暂存区移回工作目录

### 保留工作目录的修改但重置分支
```
git reset --keep <commit>
```
- 如果修改过的文件与目标提交有冲突则会失败

## 撤销与恢复

除了重置，Git还提供了其他撤销和恢复操作的命令。

### 撤销工作目录中的修改
```
git checkout -- <file>
git restore <file>  // Git 2.23+新命令
```
- 将工作目录中的文件恢复到最近一次提交状态
- 丢弃未暂存的修改

### 撤销暂存的更改
```
git reset -- <file>
git restore --staged <file>  // Git 2.23+新命令
```
- 将文件从暂存区移回工作目录

### 还原提交
```
git revert <commit>
```
- 创建一个新提交来撤销指定提交的更改
- 不会修改现有历史

### 恢复已删除的文件
```
git checkout <commit> -- <file>
```
- 从历史提交中恢复被删除的文件

### 查找丢失的提交
```
git reflog
```
- 显示HEAD的移动历史
- 可用于找回因reset --hard丢失的提交

### 恢复删除的分支
```
git branch <branch-name> <commit>
```
- 使用reflog找到分支指向的提交，然后创建新分支

## Revert详解

与reset不同，revert通过创建新提交来撤销更改，保留历史记录完整性。

### Git revert的特点
- 创建新的提交来撤销之前的更改
- 不修改历史记录，只是添加新提交
- 适合已推送到公共仓库的提交

### 撤销单个提交
```
git revert <commit>
```
- 创建一个新提交来撤销指定提交的更改

### 撤销多个提交
```
git revert <oldest-commit>..<newest-commit>
```
- 为每个提交创建一个新的撤销提交

### 不自动提交的撤销
```
git revert --no-commit <commit>
```
- 将撤销修改放入暂存区，而不自动创建新提交
- 可以一次撤销多个提交然后一起提交

### 处理合并提交
```
git revert -m 1 <merge-commit>
```
- 撤销合并提交时需指定要保留的父提交(-m参数)
- 1通常表示主线，2表示被合并的分支

### 解决撤销冲突
```
git revert --continue
git revert --abort
```
- 处理撤销过程中的冲突

## Reset vs Revert

Git的reset和revert命令虽然都可用于撤销更改，但有着根本的区别。

### Git reset
- 移动HEAD指针和分支引用
- 修改现有的提交历史
- 适合本地未推送的提交
- 可能丢失提交历史
- 三种模式: --soft, --mixed, --hard

### Git revert
- 创建新的撤销提交
- 不修改现有历史，只是添加新提交
- 适合已推送到公共仓库的提交
- 保留完整的提交历史
- 更加安全，不会丢失历史

### 使用场景
- 本地修改撤销: 使用reset
- 公共仓库提交撤销: 使用revert
- 需要保留历史完整性: 使用revert
- 清理本地环境: 使用reset --hard

## 常见面试题

1. Git中reset和revert的主要区别是什么？
2. reset的三种模式(--soft, --mixed, --hard)有什么不同？
3. 如何撤销已经推送到远程仓库的提交？
4. 如何恢复一个已经被reset --hard删除的提交？
5. 撤销合并提交时为什么需要使用-m参数？ 