# Docker容器和应用服务诊断报告
**生成时间**: 2025-09-28 14:36:xx
**服务器**: 107.173.154.147
**容器名**: stock-app
**分析目标**: Docker容器运行状态、应用服务问题和端口配置

## 🔍 问题症状描述
用户报告无法访问股票跟踪应用，怀疑Docker容器或应用服务存在问题，特别关注：
- Docker容器stock-app运行状态
- 应用启动日志和错误信息
- 端口3000绑定状态
- Next.js应用是否正常启动
- 交易日历集成后的依赖问题

## 📊 诊断结果总结

### ✅ 正常运行的服务
1. **Docker容器状态**: 运行正常，已启动19分钟
2. **Next.js应用**: 正常启动，Ready in 3.6s
3. **端口监听**: 3000端口正常监听
4. **API接口**: 可正常响应请求
5. **交易日历模块**: 文件存在且正常集成

### ⚠️ 发现的问题点
1. **数据库连接问题**: MySQL访问被拒绝
2. **容器端口映射**: 显示为空但实际使用host模式
3. **配置警告**: MySQL2配置选项过时警告

## 🔧 详细技术分析

### 1. Docker容器状态分析
```bash
# 容器基本信息
容器名: stock-app
状态: Up 19 minutes (运行中)
镜像: node:18-alpine
网络模式: host
重启策略: no
端口映射: 显示为空 (因为使用host模式)

# 容器配置
启动命令: sh -c npm run dev
工作目录: /app
暴露端口: 无明确暴露 (host模式下不需要)
```

### 2. Next.js应用分析
```bash
# 应用状态
启动状态: ✓ Ready in 3.6s
进程状态:
  - PID 17: node /app/node_modules/.bin/next dev
  - PID 28: next-server (v14.2.32)
编译状态: ✓ Compiled /api/stocks in 1898ms (229 modules)
```

### 3. 网络端口分析
```bash
# 端口监听状态
tcp6   0   0  :::3000   :::*   LISTEN   918647/next-server

# 外部访问测试
HTTP/1.1 200 OK
X-Powered-By: Next.js
Content-Type: text/html; charset=utf-8
```

### 4. API功能测试
```bash
# 基础API测试
GET /api/stocks → {"success":false,"error":"请提供日期参数"}

# 带参数API测试
GET /api/stocks?date=2025-09-26 → 返回完整数据
{
  "success": true,
  "data": {
    "date": "2025-09-26",
    "categories": { /* 57只股票，12个分类 */ },
    "stats": {
      "total_stocks": 57,
      "category_count": 12,
      "profit_ratio": 0
    }
  }
}
```

### 5. 错误日志分析

#### 🚨 MySQL数据库连接错误
```
[数据库] 获取缓存股票数据失败: Error: Access denied for user 'root'@'172.17.0.1' (using password: YES)
Code: ER_ACCESS_DENIED_ERROR (1045)
SQLState: 28000
```

**分析**:
- 数据库连接被拒绝，IP 172.17.0.1 是Docker网络地址
- 用户'root'使用密码认证失败
- 这说明MySQL服务存在但认证配置有问题

#### ⚠️ MySQL2配置警告
```
Ignoring invalid configuration option passed to Connection: acquireTimeout
Ignoring invalid configuration option passed to Connection: createDatabaseIfNotExist
```

**分析**:
- MySQL2版本升级导致某些配置选项过时
- 功能影响: 不影响核心功能，只是警告
- 需要更新数据库配置文件

### 6. 交易日历模块状态
```bash
文件位置: /app/src/lib/enhanced-trading-calendar.ts
文件状态: 存在且完整
集成状态: 正常，无编译错误
API密钥: 已配置Tushare token
频率控制: 实现了60次/分钟限制
```

## 🎯 核心问题根因

### 主要问题: MySQL数据库认证失败
**模块**: 数据库连接层 (database.ts)
**影响**:
- 无法使用缓存功能，影响性能
- 股票数据需要重新获取，响应较慢
- 7天对比功能可能受影响

**技术原因**:
1. Docker容器使用172.17.0.1访问宿主机MySQL
2. MySQL用户'root'从该IP的权限配置错误
3. 可能是密码错误或主机访问权限限制

### 次要问题: 容器端口映射显示异常
**模块**: Docker网络配置
**影响**:
- 诊断时可能造成误判
- 实际功能正常 (host模式下正常现象)

**技术原因**:
- 容器使用host网络模式
- 端口直接绑定到宿主机，不需要映射
- Docker inspect显示为空是正常行为

## 🔨 修复建议和解决方案

### 1. 立即修复: MySQL数据库权限问题

#### 方案A: 修复MySQL用户权限 (推荐)
```sql
-- 登录MySQL
mysql -u root -p

-- 检查用户权限
SELECT user, host FROM mysql.user WHERE user='root';

-- 授权Docker网络访问
GRANT ALL PRIVILEGES ON *.* TO 'root'@'172.17.0.1' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'172.17.%' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;
```

#### 方案B: 创建专用数据库用户
```sql
-- 创建应用专用用户
CREATE USER 'stock_app'@'172.17.%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON stock_tracker.* TO 'stock_app'@'172.17.%';
FLUSH PRIVILEGES;
```

### 2. 配置优化: 更新MySQL2配置

#### 修改数据库配置文件
```typescript
// src/lib/database.ts
const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // 移除过时配置
  // acquireTimeout: 60000,  // 删除这行
  // createDatabaseIfNotExist: true,  // 删除这行

  // 使用新的配置
  acquireTimeout: 60000,  // 改为 connectionLimit
  connectionLimit: 10,
  timeout: 60000,
};
```

### 3. 监控改进: 添加健康检查

#### 容器健康检查
```dockerfile
# 在Dockerfile中添加
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

#### API健康检查端点
```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // 检查数据库连接
    await db.query('SELECT 1');
    return Response.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    }, { status: 503 });
  }
}
```

### 4. 性能优化建议

#### 缓存策略优化
```typescript
// 添加内存缓存降级机制
const fallbackCache = new Map();

// 数据库失败时使用内存缓存
if (dbError) {
  console.log('[缓存] 数据库不可用，使用内存缓存');
  return fallbackCache.get(cacheKey);
}
```

## 📈 验证步骤

### 1. 修复后验证数据库连接
```bash
# 进入容器测试数据库连接
docker exec stock-app node -e "
const mysql = require('mysql2/promise');
const pool = mysql.createPool({/*config*/});
pool.execute('SELECT 1').then(() => console.log('DB OK'));
"
```

### 2. 验证API功能
```bash
# 测试缓存功能恢复
curl 'http://107.173.154.147:3000/api/stocks?date=2025-09-26' | grep -o '"cache":"[^"]*"'

# 测试7天对比功能
curl 'http://107.173.154.147:3000/api/stocks?date=2025-09-26&mode=7days'
```

### 3. 监控日志改善
```bash
# 观察错误日志消失
docker logs stock-app --tail 20 | grep -i error
```

## 📋 总结

### 当前状态: 🟡 部分功能正常
- ✅ Docker容器运行正常
- ✅ Next.js应用启动成功
- ✅ 端口3000可访问
- ✅ API接口响应正常
- ✅ 交易日历模块集成完整
- ❌ MySQL数据库连接失败
- ⚠️ 配置警告需要清理

### 优先级修复顺序:
1. **高优先级**: 修复MySQL数据库权限问题
2. **中优先级**: 更新MySQL2配置消除警告
3. **低优先级**: 添加健康检查和监控

### 预期修复效果:
- 数据库缓存功能恢复，API响应速度提升
- 消除错误日志，系统更稳定
- 提供更好的监控和诊断能力

**结论**: 应用核心功能正常，主要问题是数据库连接权限，修复后系统将完全正常运行。