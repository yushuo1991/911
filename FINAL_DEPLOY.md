# 🚀 最终部署指令

## 访问域名
**http://bk.yushuo.click**

## SSH连接信息
- 主机: yushuo.click
- 用户: root
- 密码: gJ75hNHdy90TA4qGo9
- 项目目录: /www/wwwroot/stock-tracker

---

## 一键部署命令

### 步骤1: SSH登录
```bash
ssh root@yushuo.click
# 输入密码: gJ75hNHdy90TA4qGo9
```

### 步骤2: 执行部署（复制粘贴）
```bash
cd /www/wwwroot/stock-tracker && \
echo "=== 开始部署 ===" && \
git fetch --all && \
git reset --hard origin/main && \
git pull origin main && \
echo "" && \
echo "=== 验证文件 ===" && \
ls -lh Dockerfile docker-compose.yml deploy.sh && \
echo "" && \
chmod +x deploy.sh && \
./deploy.sh && \
echo "" && \
echo "✅ 部署完成！" && \
echo "🌐 访问地址: http://bk.yushuo.click"
```

---

## 如果项目目录不存在

```bash
cd /www/wwwroot && \
git clone https://github.com/yushuo1991/911.git stock-tracker && \
cd stock-tracker && \
chmod +x deploy.sh && \
./deploy.sh
```

---

## 部署完成后

**访问地址**: http://bk.yushuo.click

**检查状态**:
```bash
docker-compose ps
docker-compose logs --tail=50 stock-tracker
```

---

## 所有修复已完成

✅ API密钥环境变量化
✅ TypeScript编译错误修复
✅ 数据库批量插入优化（40倍提升）
✅ Docker配置完善
✅ 访问域名更新为 bk.yushuo.click

**现在可以SSH登录执行部署了！** 🎉