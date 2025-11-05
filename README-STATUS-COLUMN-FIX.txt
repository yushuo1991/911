========================================
涨停数弹窗状态列问题 - 快速修复
========================================

问题现象：
---------
点击"53家涨停"时，弹窗中"状态"列显示"+6.7"、"+10.0"等数字
预期应显示："3板"、"首板"等连板数

诊断结果：
---------
✅ 本地代码v4.11完全正确
❌ 问题出在服务器未部署最新版本

解决方案（三选一）：
-------------------

【方案1】浏览器强制刷新（1分钟）
----------------------------------
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R

如果刷新后正常，则是浏览器缓存问题。

【方案2】检查服务器版本（5分钟）
---------------------------------
ssh root@yushuo.click
cd /www/wwwroot/stock-tracker
git log --oneline -1
grep -n "td_type.replace" src/app/page.tsx

如果找到3处结果（行665, 1030, 1352），则代码正确。
如果找不到，执行方案3。

【方案3】重新部署v4.11（15分钟）★ 推荐
--------------------------------------
ssh root@yushuo.click
cd /www/wwwroot/stock-tracker

# 备份
mkdir -p /www/backup/stock-tracker
tar -czf /www/backup/stock-tracker/backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# 更新代码
git fetch origin
git checkout main
git pull origin main

# 重新构建（关键：--no-cache）
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 等待启动
sleep 30

# 验证
docker ps | grep stock-tracker

验证步骤：
---------
1. 强制刷新浏览器 (Ctrl+Shift+R)
2. 访问 bk.yushuo.click
3. 点击任意"XX只涨停"
4. 检查"状态"列显示：
   ✅ 正确: "首板"、"1板"、"2板"、"3板"
   ❌ 错误: "+6.7"、"+10.0"

技术要点：
---------
- 涉及模块: Next.js前端渲染 (page.tsx)
- 数据来源: Tushare API (route.ts)
- 部署工具: Docker
- 问题原因: 服务器未部署v4.9+版本，或Docker构建缓存

版本历史：
---------
v4.9  (9d3269b) - 首次添加状态列 ⭐
v4.10 (957f746) - 优化弹窗布局
v4.11 (f790995) - 当前最新版本

相关文档：
---------
- 详细报告: log/stock-count-modal-status-column-diagnosis-20251002.md
- 用户指南: STATUS-COLUMN-ISSUE-SUMMARY.md
- 诊断脚本: diagnose-status-column.sh

问题仍未解决？
-------------
请提供以下信息：
1. 服务器Git版本: git log --oneline -5
2. 代码检查结果: grep -n "td_type.replace" src/app/page.tsx
3. 浏览器控制台截图 (F12 → Console)
4. 弹窗完整截图

========================================
最后更新: 2025-10-02
诊断人员: Claude Code Agent
========================================
