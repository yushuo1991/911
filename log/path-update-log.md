# 部署路径更新日志

## 更新时间
2025-09-26

## 路径变更详情

### 原路径配置
- **项目路径**: `/www/wwwroot/yushuo.click/cc`
- **访问域名**: `https://yushuo.click/cc`
- **部署方式**: 子路径部署

### 新路径配置
- **项目路径**: `/www/wwwroot/stock-tracker`
- **访问域名**: `https://bk.yushuo.click`
- **部署方式**: 子域名独立部署

## 技术模块影响

### 1. 服务器同步模块
- **功能**: 从GitHub同步代码到服务器
- **影响**: 目标路径变更，简化目录结构
- **修改文件**: `server-sync.sh`
- **关键变更**:
  ```bash
  # 旧配置
  PROJECT_DIR="/www/wwwroot/yushuo.click/cc"

  # 新配置
  PROJECT_DIR="/www/wwwroot/stock-tracker"
  ```

### 2. 部署自动化模块
- **功能**: 宝塔面板一键部署
- **影响**: Nginx配置从子路径改为子域名
- **修改文件**: `baota-deploy.sh`
- **关键变更**:
  ```bash
  # 旧配置
  PROJECT_PATH="/www/wwwroot/${DOMAIN}/cc"
  NEXTAUTH_URL=https://${DOMAIN}/cc

  # 新配置
  PROJECT_PATH="/www/wwwroot/stock-tracker"
  NEXTAUTH_URL=https://bk.${DOMAIN}
  ```

### 3. Nginx反向代理模块
- **功能**: HTTP请求转发和路由
- **影响**: 从子路径代理改为根路径代理
- **配置变更**:
  ```nginx
  # 旧配置 - 子路径代理
  location /cc/ {
    proxy_pass http://127.0.0.1:3002/;
  }

  # 新配置 - 根路径代理
  location / {
    proxy_pass http://127.0.0.1:3002/;
  }
  ```

### 4. SSL证书模块
- **功能**: HTTPS安全连接
- **影响**: 证书路径从主域名改为子域名
- **配置变更**:
  ```nginx
  # 旧配置
  server_name yushuo.click;
  ssl_certificate /www/server/panel/vhost/cert/yushuo.click/fullchain.pem;

  # 新配置
  server_name bk.yushuo.click;
  ssl_certificate /www/server/panel/vhost/cert/bk.yushuo.click/fullchain.pem;
  ```

## 优势分析

### 1. URL结构优化
- **简化访问**: 用户无需记住子路径 `/cc`
- **语义清晰**: 子域名直观表明应用功能
- **SEO友好**: 独立子域名有利于搜索引擎优化

### 2. 部署架构优化
- **独立性**: 子域名部署与主站完全隔离
- **扩展性**: 便于后续添加更多子系统
- **维护性**: 独立的配置文件和日志系统

### 3. 安全性提升
- **域名隔离**: 子域名提供更好的安全边界
- **证书管理**: 独立SSL证书配置更灵活
- **权限控制**: 目录权限更加精确

### 4. 运维效率
- **路径清晰**: 项目直接部署在根级目录
- **备份简化**: 独立项目目录便于备份管理
- **监控优化**: 独立的日志和监控配置

## 文档更新范围

### 修改的脚本文件
1. `server-sync.sh` - 服务器代码同步脚本
2. `baota-deploy.sh` - 宝塔面板部署脚本

### 更新的文档文件
1. `log/server-sync-guide.md` - 服务器同步指导文档
2. `log/deployment-summary.md` - 部署方案总结
3. `log/baota-deployment-guide.md` - 宝塔面板部署指南
4. `log/github-sync-log.md` - GitHub同步日志
5. `log/v4.3-backup-log.md` - v4.3备份日志

### 批量替换内容
- 所有 `/www/wwwroot/yushuo.click/cc` → `/www/wwwroot/stock-tracker`
- 所有 `https://yushuo.click/cc` → `https://bk.yushuo.click`
- 相关的nginx配置和环境变量

## 服务器同步指令

### 更新后的同步命令
```bash
# 下载最新的同步脚本
wget https://raw.githubusercontent.com/yushuo1991/911/main/server-sync.sh
chmod +x server-sync.sh

# 执行同步（会自动同步到新路径）
sudo ./server-sync.sh
```

### 域名配置要求
1. 添加子域名解析: `bk.yushuo.click` → 服务器IP
2. 配置SSL证书（可选，但推荐）
3. 在宝塔面板中添加站点: `bk.yushuo.click`

## 回滚方案

如需回滚到原路径配置，可以使用以下Git命令：
```bash
git revert 7f5a1e9
git push origin main
```

## 验证清单

部署完成后，请确认：
- [ ] 域名解析 `bk.yushuo.click` 正常
- [ ] SSL证书配置（如需要）
- [ ] 应用在新域名下可正常访问
- [ ] 所有功能测试通过
- [ ] 日志记录在正确路径

---

**路径更新已完成并推送到GitHub，现在可以使用新路径进行服务器同步部署！**