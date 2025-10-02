#!/bin/bash

echo "🚨 开始紧急恢复生产环境..."

# 1. 备份当前状态
echo "📦 备份当前状态..."
ssh root@107.173.154.147 "docker exec stock-app cp -r /app/src /tmp/backup-$(date +%Y%m%d-%H%M%S)"

# 2. 恢复基础工作版本的page.tsx (使用备份版本)
echo "🔄 恢复基础工作版本..."
if [ -f "page.tsx.backup" ]; then
    dos2unix page.tsx.backup
    scp page.tsx.backup root@107.173.154.147:/tmp/page.tsx
    ssh root@107.173.154.147 "docker cp /tmp/page.tsx stock-app:/app/src/app/page.tsx"
else
    echo "❌ 备份文件不存在，使用当前版本"
fi

# 3. 恢复基础Tailwind配置
echo "⚙️ 恢复基础配置..."
cat > /tmp/tailwind.simple.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

scp /tmp/tailwind.simple.js root@107.173.154.147:/tmp/
ssh root@107.173.154.147 "docker cp /tmp/tailwind.simple.js stock-app:/app/tailwind.config.js"

# 4. 恢复基础CSS
echo "🎨 恢复基础CSS..."
cat > /tmp/globals.simple.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

scp /tmp/globals.simple.css root@107.173.154.147:/tmp/
ssh root@107.173.154.147 "docker cp /tmp/globals.simple.css stock-app:/app/src/app/globals.css"

# 5. 清理缓存并重启
echo "🧹 清理缓存..."
ssh root@107.173.154.147 "docker exec stock-app rm -rf /app/.next"
ssh root@107.173.154.147 "docker restart stock-app"

echo "⏳ 等待服务启动..."
sleep 30

# 6. 测试服务状态
echo "🔍 测试服务状态..."
if curl -f http://107.173.154.147:3000 > /dev/null 2>&1; then
    echo "✅ 服务恢复成功！"
    echo "🌐 访问地址: http://107.173.154.147:3000"
else
    echo "❌ 服务仍有问题，需要进一步诊断"
    ssh root@107.173.154.147 "docker logs stock-app --tail 10"
fi

echo "🏁 紧急恢复完成"