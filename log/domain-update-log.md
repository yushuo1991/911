# 域名配置更新日志

## 更新时间
2025-09-26

## 域名变更详情

### 原域名配置
- **访问域名**: `stock-tracker.yushuo.click`
- **Nginx配置**: `stock-tracker.yushuo.click.conf`
- **SSL证书路径**: `/www/server/panel/vhost/cert/stock-tracker.yushuo.click/`

### 新域名配置
- **访问域名**: `bk.yushuo.click`
- **Nginx配置**: `bk.yushuo.click.conf`
- **SSL证书路径**: `/www/server/panel/vhost/cert/bk.yushuo.click/`

## 技术模块影响

### 1. Nginx配置模块
- **功能**: HTTP请求路由和SSL终止
- **影响**: 服务器名称和证书路径变更
- **配置变更**:
  ```nginx
  # 旧配置
  server_name stock-tracker.yushuo.click;
  ssl_certificate /www/server/panel/vhost/cert/stock-tracker.yushuo.click/fullchain.pem;

  # 新配置
  server_name bk.yushuo.click;
  ssl_certificate /www/server/panel/vhost/cert/bk.yushuo.click/fullchain.pem;
  ```

### 2. 环境变量模块
- **功能**: 应用配置和认证URL
- **影响**: NEXTAUTH_URL环境变量更新
- **配置变更**:
  ```bash
  # 旧配置
  NEXTAUTH_URL=https://stock-tracker.yushuo.click

  # 新配置
  NEXTAUTH_URL=https://bk.yushuo.click
  ```

### 3. 部署脚本模块
- **功能**: 自动化部署和配置生成
- **影响**: 域名变量和输出信息更新
- **修改文件**: `baota-deploy.sh`, `server-sync.sh`

### 4. 文档系统模块
- **功能**: 部署指南和技术文档
- **影响**: 所有域名引用批量更新
- **修改范围**: 全部.md文档文件

## 域名优势分析

### 1. 简洁性优势
- **URL长度**: 从24字符减少到16字符
- **记忆难度**: `bk` 前缀更简洁易记
- **输入效率**: 减少用户输入成本

### 2. 技术优势
- **DNS解析**: 更短的域名解析更快
- **SSL证书**: 证书管理路径更简洁
- **日志分析**: 日志中域名标识更清晰

### 3. 用户体验
- **访问便利**: 简短域名提升访问体验
- **品牌一致**: bk前缀可能更符合品牌定位
- **移动友好**: 短域名在移动设备上更友好

## 部署要求更新

### DNS解析配置
- **A记录**: `bk.yushuo.click` → 服务器IP地址
- **CNAME记录**: 如果使用CDN，需要更新CNAME指向

### SSL证书配置
- **证书类型**: 支持bk.yushuo.click的SSL证书
- **自动续期**: 更新自动续期脚本中的域名
- **证书路径**: 宝塔面板中配置正确的证书路径

### 宝塔面板配置
- **站点管理**: 添加新域名 `bk.yushuo.click`
- **SSL设置**: 为新域名配置SSL证书
- **伪静态**: 如有需要，配置相应的伪静态规则

## 服务器同步指令

### 更新后的同步命令
```bash
# 下载最新的同步脚本（包含新域名配置）
wget https://raw.githubusercontent.com/yushuo1991/911/main/server-sync.sh
chmod +x server-sync.sh

# 执行同步到 /www/wwwroot/stock-tracker
sudo ./server-sync.sh
```

### 部署验证命令
```bash
# 检查域名解析
nslookup bk.yushuo.click

# 测试HTTP访问
curl -I http://bk.yushuo.click

# 测试HTTPS访问（需SSL证书）
curl -I https://bk.yushuo.click

# 检查应用状态
pm2 status stock-tracker-v42
```

## 修改文件清单

### 核心脚本文件
1. **server-sync.sh**
   - 更新验证命令中的域名引用
   - 修改行数: 1处

2. **baota-deploy.sh**
   - 更新NEXTAUTH_URL环境变量
   - 更新Nginx配置文件路径
   - 更新server_name和SSL证书路径
   - 更新部署信息输出
   - 修改行数: 5处

### 文档文件
1. **log/server-sync-guide.md** - 同步指导文档
2. **log/deployment-summary.md** - 部署总结文档
3. **log/baota-deployment-guide.md** - 宝塔部署指南
4. **log/v4.3-backup-log.md** - 版本备份日志
5. **log/path-update-log.md** - 路径更新日志

## 迁移检查清单

部署完成后，请确认：
- [ ] DNS解析 `bk.yushuo.click` 指向正确IP
- [ ] 宝塔面板已添加新域名站点
- [ ] SSL证书配置正确（如需要）
- [ ] Nginx配置文件生成并加载
- [ ] 应用在新域名下正常访问
- [ ] 所有API接口功能正常
- [ ] 静态资源加载正常
- [ ] 数据库连接和数据显示正常

## 回滚方案

如需回滚到原域名配置：
```bash
# Git回滚到域名更新前
git revert c3bcf84

# 或手动修改配置文件
# 将所有 bk.yushuo.click 改回 stock-tracker.yushuo.click
```

## 后续优化建议

1. **监控配置**: 更新域名监控告警规则
2. **备份脚本**: 更新备份脚本中的域名引用
3. **文档维护**: 定期检查确保文档与实际配置一致
4. **性能优化**: 考虑为新域名配置CDN加速

---

**域名配置已更新完成，现在使用 `bk.yushuo.click` 访问应用！**