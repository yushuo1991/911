#!/bin/bash

# v4.3.1 骨架屏修复 - 自动应用脚本
# 用途：自动替换page.tsx中的loading逻辑

set -e

echo "========================================"
echo "🔧 v4.3.1 骨架屏修复脚本"
echo "========================================"
echo ""

# 检查文件存在
if [ ! -f "src/app/page.tsx" ]; then
  echo "❌ 错误: src/app/page.tsx 文件不存在"
  exit 1
fi

# 备份原文件
BACKUP_FILE="src/app/page.tsx.backup-$(date +%Y%m%d_%H%M%S)"
echo "📦 备份原文件到: $BACKUP_FILE"
cp src/app/page.tsx "$BACKUP_FILE"

# 读取文件内容
echo "📖 读取page.tsx..."

# 使用sed或awk替换第380-390行的loading逻辑
# 注意：这里提供手动替换的指导，因为自动替换可能有风险

echo ""
echo "========================================"
echo "⚠️  需要手动替换的代码段"
echo "========================================"
echo ""
echo "请打开 src/app/page.tsx，找到第380-390行："
echo ""
echo "原代码（需要删除）："
echo "---"
cat <<'EOF'
if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在获取7天数据...</p>
        <p className="text-gray-500 text-sm mt-2">这可能需要几分钟时间</p>
      </div>
    </div>
  );
}
EOF
echo "---"
echo ""
echo "替换为（新代码）："
echo "---"
cat <<'EOF'
// 首次加载显示骨架屏
if (loading && !sevenDaysData) {
  return (
    <div className="min-h-screen bg-gray-50 p-3">
      {/* 骨架屏：页面标题和Top 5占位 */}
      <div className="max-w-full mx-auto mb-4">
        <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-7 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-7 w-28 bg-gray-200 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-7 w-28 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-7 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 骨架屏：7天网格占位 */}
      <div className="max-w-full mx-auto">
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div key={day} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-300 to-gray-400 p-2 text-center">
                <div className="h-4 w-16 bg-white/30 rounded mx-auto mb-1 animate-pulse"></div>
                <div className="h-3 w-12 bg-white/20 rounded mx-auto mb-1 animate-pulse"></div>
                <div className="h-5 w-20 bg-white/25 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="p-2 space-y-1.5">
                {[1, 2, 3].map((sector) => (
                  <div key={sector} className="border border-gray-200 rounded p-2">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-1 animate-pulse"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="h-5 w-24 bg-blue-200 rounded mb-2 animate-pulse"></div>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-3 bg-blue-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading提示 */}
      <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span className="text-sm font-medium">正在加载7天数据...</span>
        </div>
      </div>
    </div>
  );
}
EOF
echo "---"
echo ""
echo "然后在 return ( 语句内部（约第392行）的第一行后添加："
echo "---"
cat <<'EOF'
{/* 刷新时显示loading toast */}
{loading && sevenDaysData && (
  <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      <span className="text-sm font-medium">正在刷新数据...</span>
    </div>
  </div>
)}
EOF
echo "---"
echo ""

# 提供VSCode打开命令
echo "========================================"
echo "🚀 后续步骤"
echo "========================================"
echo ""
echo "1. 打开文件编辑器："
echo "   code src/app/page.tsx"
echo ""
echo "2. 应用上述修改"
echo ""
echo "3. 验证本地效果："
echo "   npm run dev"
echo "   访问 http://localhost:3000"
echo ""
echo "4. 构建部署："
echo "   npm run build"
echo "   docker build -t stock-tracker:v4.3.1 ."
echo ""
echo "5. 部署到服务器："
echo "   docker stop stock-tracker || true"
echo "   docker rm stock-tracker || true"
echo "   docker run -d --name stock-tracker -p 3000:3000 stock-tracker:v4.3.1"
echo ""
echo "6. 验证生产环境："
echo "   访问 http://bk.yushuo.click"
echo ""
echo "备份文件已保存: $BACKUP_FILE"
echo ""
echo "✅ 脚本执行完成"
echo ""
