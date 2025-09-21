# 子域名 bk.yushuo.click 配置指南

**目标**: 设置 `bk.yushuo.click` 访问股票追踪系统
**原则**: 不影响原有 `yushuo.click` 项目运行
**服务器**: 107.173.154.147

## 🔧 配置步骤

### 步骤1: DNS解析配置 ⭐

**在你的域名管理面板中添加A记录**:

```
类型: A
主机记录: bk
记录值: 107.173.154.147
TTL: 600 (或默认)
```

**说明**:
- `bk` + `yushuo.click` = `bk.yushuo.click`
- 指向你的服务器IP地址
- 不影响原有的 `yushuo.click` 解析

### 步骤2: 宝塔面板网站配置

#### 2.1 添加新网站
1. 登录宝塔面板: `http://107.173.154.147:8888`
2. 点击 **网站** → **添加站点**
3. 填写信息:
   ```
   域名: bk.yushuo.click
   网站目录: /www/wwwroot/stock-tracker  ← 使用现有项目目录
   FTP: 不创建
   数据库: 不创建 (使用现有)
   PHP版本: 不选择 (Node.js项目)
   ```
4. 点击 **提交**

#### 2.2 配置反向代理
1. 找到新创建的 `bk.yushuo.click` 网站
2. 点击 **设置** → **反向代理**
3. 点击 **添加反向代理**
4. 配置参数:
   ```
   代理名称: stock-tracker-bk
   目标URL: http://127.0.0.1:3000
   发送域名: $host
   内容替换: (留空)
   ```
5. 点击 **提交**

### 步骤3: SSL证书配置 (可选但推荐)

1. 在 `bk.yushuo.click` 网站设置中
2. 点击 **SSL** → **Let's Encrypt**
3. 勾选 `bk.yushuo.click`
4. 点击 **申请**

配置后可通过 `https://bk.yushuo.click` 访问

### 步骤4: 验证配置

#### 4.1 检查DNS解析
```bash
# 在命令行中执行
nslookup bk.yushuo.click
```
应该返回: `107.173.154.147`

#### 4.2 测试HTTP访问
```bash
curl -I http://bk.yushuo.click
```
应该返回: `HTTP/1.1 200 OK`

## 📋 配置后的访问地址

### 新的股票追踪系统访问地址
- **HTTP**: `http://bk.yushuo.click`
- **HTTPS**: `https://bk.yushuo.click` (如果配置了SSL)
- **API**: `http://bk.yushuo.click/api/stocks`

### 原有项目保持不变
- **原项目**: `http://yushuo.click` (继续正常运行)
- **新项目**: `http://bk.yushuo.click` (股票追踪系统)

## 🔍 故障排除

### 问题1: DNS解析不生效
**解决**: DNS生效需要时间，通常5-30分钟

### 问题2: 502错误
**检查**:
1. Node.js应用是否在3000端口运行
2. 反向代理配置是否正确
3. 防火墙是否开放3000端口

### 问题3: 证书申请失败
**原因**: DNS解析未完全生效
**解决**: 等待DNS生效后重新申请

## 🎯 配置验证清单

- [ ] DNS A记录添加完成
- [ ] 宝塔面板网站创建完成
- [ ] 反向代理配置完成
- [ ] DNS解析生效 (`nslookup bk.yushuo.click`)
- [ ] HTTP访问正常 (`curl -I http://bk.yushuo.click`)
- [ ] SSL证书配置 (可选)
- [ ] 原有项目访问正常 (`yushuo.click`)

## 🚀 最终效果

配置完成后:
- ✅ `bk.yushuo.click` → 股票追踪系统
- ✅ `yushuo.click` → 原有项目 (不受影响)
- ✅ 两个项目独立运行，互不干扰

---
**配置指南生成时间**: 2025-09-21
**适用服务器**: 107.173.154.147
**技术栈**: 宝塔面板 + Nginx + Node.js