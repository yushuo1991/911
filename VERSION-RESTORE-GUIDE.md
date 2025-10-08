# 🔄 版本恢复完整指南

**最后更新**: 2025-10-03
**适用版本**: v4.8.7及之前所有版本

---

## 📋 目录

1. [查看可用版本](#查看可用版本)
2. [恢复到指定版本](#恢复到指定版本)
3. [常用恢复场景](#常用恢复场景)
4. [版本列表](#版本列表)
5. [故障排查](#故障排查)

---

## 🔍 查看可用版本

### 方法一：查看本地Git标签

```bash
# 在本地项目目录执行
cd "C:\Users\yushu\Desktop\stock-tracker - 副本"
git tag

# 查看标签详情
git tag -n
```

**输出示例**:
```
v4.2-stable-20250930
v4.8.4-stable
v4.8.5-stable
v4.8.6-stable
v4.8.7-stable
```

### 方法二：查看GitHub远程标签

```bash
# 查看远程仓库的所有标签
git ls-remote --tags origin

# 或访问GitHub网页
https://github.com/yushuo1991/911/tags
```

### 方法三：查看提交历史

```bash
# 查看最近10次提交
git log --oneline -10

# 查看带标签的提交
git log --oneline --decorate -10
```

---

## 🚀 恢复到指定版本

### 场景一：服务器恢复到指定版本（完整部署）

**单行命令**（推荐）:

```bash
cd /www/wwwroot/stock-tracker && git fetch origin && git checkout v4.8.7-stable && docker compose down && docker compose build && docker compose up -d && sleep 20 && docker ps | grep stock-tracker && echo "✅ 已恢复到v4.8.7"
```

**分步命令**（更清晰）:

```bash
# 步骤1: 进入项目目录
cd /www/wwwroot/stock-tracker

# 步骤2: 拉取最新的标签信息
git fetch origin --tags

# 步骤3: 查看可用版本
git tag

# 步骤4: 切换到指定版本（例如v4.8.7-stable）
git checkout v4.8.7-stable

# 步骤5: 重新构建并启动Docker容器
docker compose down
docker compose build
docker compose up -d

# 步骤6: 等待启动完成
sleep 20

# 步骤7: 验证容器状态
docker ps | grep stock-tracker

# 步骤8: 验证HTTP响应
curl -I http://localhost:3002

echo "✅ 已成功恢复到v4.8.7-stable"
```

---

### 场景二：本地恢复到指定版本

```bash
# 在本地项目目录执行
cd "C:\Users\yushu\Desktop\stock-tracker - 副本"

# 拉取最新标签
git fetch origin --tags

# 切换到指定版本
git checkout v4.8.7-stable

# 验证当前版本
git describe --tags

# 构建验证
npm run build
```

---

### 场景三：创建新分支保留当前版本

如果想保留当前修改，同时测试旧版本：

```bash
# 步骤1: 保存当前工作到新分支
git checkout -b backup-current-work
git add .
git commit -m "保存当前工作状态"

# 步骤2: 切换到指定历史版本
git checkout v4.8.7-stable

# 步骤3: 基于历史版本创建新分支测试
git checkout -b test-v4.8.7

# 步骤4: 如果要回到原来的工作
git checkout main
```

---

## 📚 常用恢复场景

### 场景A: 新版本出问题，回退到上一个稳定版本

```bash
# 服务器上执行
cd /www/wwwroot/stock-tracker && git fetch origin --tags && git checkout v4.8.6-stable && docker compose down && docker compose build && docker compose up -d && sleep 20 && echo "✅ 已回退到v4.8.6"
```

**适用情况**:
- v4.8.7部署后发现bug
- 需要紧急回退到v4.8.6稳定版本

---

### 场景B: 恢复到最早的完整备份版本

```bash
# 恢复到v4.2-stable-20250930
cd /www/wwwroot/stock-tracker && git fetch origin --tags && git checkout v4.2-stable-20250930 && docker compose down && docker compose build && docker compose up -d && sleep 20 && echo "✅ 已恢复到v4.2-stable-20250930"
```

**适用情况**:
- 多个版本都有问题
- 需要恢复到最初的稳定版本

---

### 场景C: 临时查看某个历史版本的代码

```bash
# 本地临时查看
cd "C:\Users\yushu\Desktop\stock-tracker - 副本"
git checkout v4.8.5-stable

# 查看代码后恢复到最新版本
git checkout main
```

**适用情况**:
- 查看历史版本的实现方式
- 对比不同版本的代码差异

---

### 场景D: 对比两个版本的差异

```bash
# 对比v4.8.6和v4.8.7的差异
git diff v4.8.6-stable v4.8.7-stable

# 只看某个文件的差异
git diff v4.8.6-stable v4.8.7-stable -- src/app/page.tsx

# 查看改动的文件列表
git diff --name-only v4.8.6-stable v4.8.7-stable
```

---

## 📊 版本列表

### v4.8.7-stable（当前最新版本）⭐

**发布时间**: 2025-10-03
**标签名**: `v4.8.7-stable`
**提交ID**: `6569f18`

**核心功能**:
- ✅ K线图z-index修复（z-[70]）
- ✅ 板块梯队显示所有7天日期
- ✅ 连板信息完整显示（6天3板）

**恢复命令**:
```bash
cd /www/wwwroot/stock-tracker && git fetch origin --tags && git checkout v4.8.7-stable && docker compose down && docker compose build && docker compose up -d && sleep 20 && echo "✅ 已恢复到v4.8.7"
```

---

### v4.8.6-stable

**发布时间**: 2025-10-03
**标签名**: `v4.8.6-stable`
**提交ID**: `7f84d00`

**核心功能**:
- ✅ 日期弹窗板块名称放大（14px semibold）
- ✅ 溢价徽章放大（12px）
- ✅ 总和徽章放大（14px）

**恢复命令**:
```bash
cd /www/wwwroot/stock-tracker && git fetch origin --tags && git checkout v4.8.6-stable && docker compose down && docker compose build && docker compose up -d && sleep 20 && echo "✅ 已恢复到v4.8.6"
```

---

### v4.8.5-stable

**发布时间**: 2025-10-03
**标签名**: `v4.8.5-stable`
**提交ID**: `090f6ea`

**核心功能**:
- ✅ 涨停数弹窗徽章微调（9px）
- ✅ 对齐日期弹窗样式
- ✅ 使用getPerformanceColorClass

**恢复命令**:
```bash
cd /www/wwwroot/stock-tracker && git fetch origin --tags && git checkout v4.8.5-stable && docker compose down && docker compose build && docker compose up -d && sleep 20 && echo "✅ 已恢复到v4.8.5"
```

---

### v4.8.4-stable

**发布时间**: 2025-10-03
**标签名**: `v4.8.4-stable`
**提交ID**: `cf216db`

**核心功能**:
- ✅ 修复CSS覆盖问题
- ✅ 新增getPerformanceColorClass函数
- ✅ 分离颜色类和尺寸类

**恢复命令**:
```bash
cd /www/wwwroot/stock-tracker && git fetch origin --tags && git checkout v4.8.4-stable && docker compose down && docker compose build && docker compose up -d && sleep 20 && echo "✅ 已恢复到v4.8.4"
```

---

### v4.2-stable-20250930

**发布时间**: 2025-09-30
**标签名**: `v4.2-stable-20250930`

**核心功能**:
- ✅ 最早的完整稳定版本
- ✅ 基础板块节奏分析功能
- ✅ 7天涨停数据展示

**恢复命令**:
```bash
cd /www/wwwroot/stock-tracker && git fetch origin --tags && git checkout v4.2-stable-20250930 && docker compose down && docker compose build && docker compose up -d && sleep 20 && echo "✅ 已恢复到v4.2-stable-20250930"
```

---

## 🔧 故障排查

### 问题1: "tag not found" 错误

**错误信息**:
```
error: pathspec 'v4.8.7-stable' did not match any file(s) known to git
```

**解决方法**:
```bash
# 拉取远程标签
git fetch origin --tags

# 验证标签是否存在
git tag | grep v4.8.7

# 再次尝试切换
git checkout v4.8.7-stable
```

---

### 问题2: Docker构建失败

**错误信息**:
```
failed to solve: node:18-alpine: failed to resolve
```

**解决方法**:
```bash
# 方法1: 使用缓存构建（不重新拉取基础镜像）
docker compose build

# 方法2: 配置Docker镜像加速
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com"
  ]
}
EOF
systemctl daemon-reload
systemctl restart docker

# 方法3: 使用服务器备份的page.tsx热替换（无需重建）
CONTAINER_ID=$(docker ps | grep stock-tracker-app | awk '{print $1}')
docker cp /www/backup/page.tsx.v4.8.7 $CONTAINER_ID:/app/src/app/page.tsx
docker restart $CONTAINER_ID
```

---

### 问题3: 本地修改冲突

**错误信息**:
```
error: Your local changes to the following files would be overwritten by checkout
```

**解决方法**:

**方法1: 放弃本地修改**
```bash
git checkout -- .
git checkout v4.8.7-stable
```

**方法2: 保存本地修改**
```bash
# 保存到临时分支
git stash
git checkout v4.8.7-stable

# 如果需要恢复修改
git stash pop
```

**方法3: 提交本地修改**
```bash
git add .
git commit -m "保存本地修改"
git checkout v4.8.7-stable
```

---

### 问题4: 容器启动失败

**检查步骤**:

```bash
# 步骤1: 查看容器状态
docker ps -a | grep stock-tracker

# 步骤2: 查看容器日志
docker logs stock-tracker-app

# 步骤3: 检查端口占用
netstat -tuln | grep 3002

# 步骤4: 完全清理重新部署
docker compose down -v
docker compose build --no-cache
docker compose up -d

# 步骤5: 实时查看启动日志
docker logs -f stock-tracker-app
```

---

## 📝 快速参考

### 查看当前版本

```bash
# 查看当前Git标签
git describe --tags

# 查看当前分支
git branch

# 查看最近的提交
git log --oneline -1
```

### 列出所有备份版本

```bash
# 按时间排序
git tag --sort=-creatordate

# 带说明
git tag -n
```

### 强制回退到指定版本

```bash
# 服务器上强制回退（放弃所有本地修改）
cd /www/wwwroot/stock-tracker && git fetch origin --tags && git reset --hard v4.8.7-stable && docker compose down && docker compose build && docker compose up -d && sleep 20 && echo "✅ 强制恢复到v4.8.7"
```

**⚠️ 警告**: `git reset --hard` 会永久删除所有未提交的修改，请谨慎使用！

---

## 🎓 Git标签管理原理

### 什么是Git标签？

Git标签（Tag）是指向某个特定提交的固定指针，类似于书签。与分支不同，标签创建后不会移动。

**特点**:
- ✅ 永久标记重要版本
- ✅ 不会随提交移动
- ✅ 可以带说明信息
- ✅ 支持远程推送和拉取

### 标签vs分支

| 特性 | 标签 (Tag) | 分支 (Branch) |
|------|-----------|--------------|
| 位置 | 固定不动 | 随提交移动 |
| 用途 | 标记版本 | 开发迭代 |
| 修改 | 不可修改 | 可以修改 |
| 推送 | `git push origin v1.0` | `git push origin main` |

### 为什么使用标签进行备份？

1. **明确性**: 标签名清楚标识版本号（v4.8.7-stable）
2. **稳定性**: 标签指向的提交永不改变
3. **便捷性**: 一条命令即可恢复到指定版本
4. **可追溯**: 标签包含发布时间和说明信息

---

## 🔗 相关文档

- [v4.8.7完整备份文档](./BACKUP-v4.8.7-COMPLETE.md)
- [v4.8.7单行部署命令](./DEPLOY-v4.8.7-ONELINE.txt)
- [v4.8.6备份文档](./BACKUP-v4.8.6-COMPLETE.md)
- [v4.8.5备份文档](./BACKUP-v4.8.5-COMPLETE.md)

---

## 📞 联系信息

- **项目**: 股票追踪系统
- **访问地址**: http://bk.yushuo.click
- **GitHub仓库**: https://github.com/yushuo1991/911.git
- **服务器**: yushuo.click

---

**文档创建者**: Claude Code
**文档类型**: 版本恢复指南
**维护状态**: 持续更新
**最后验证**: 2025-10-03

---

_提示: 建议定期（每月）验证恢复流程，确保关键版本标签可用_
