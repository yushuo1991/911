#!/bin/bash

echo "========================================"
echo "GitHub 推送脚本"
echo "========================================"
echo ""
echo "当前仓库路径："
pwd
echo ""
echo "检查待推送的提交..."
git log --oneline -5
echo ""
echo "========================================"
echo "开始推送到 GitHub..."
echo "========================================"
echo ""

git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✓ 推送成功！"
    echo "========================================"
    echo ""
    echo "接下来："
    echo "1. 访问 https://github.com/yushuo1991/bkyushuo/actions"
    echo "2. 查看自动部署进度（约3-5分钟）"
    echo "3. 部署完成后访问 https://bk.yushuo.click 验证修复"
    echo ""
else
    echo ""
    echo "========================================"
    echo "✗ 推送失败"
    echo "========================================"
    echo ""
    echo "可能的原因："
    echo "1. 网络连接问题 - 请检查网络连接"
    echo "2. 防火墙限制 - 请尝试切换网络（如使用手机热点）"
    echo "3. 代理设置 - 如果需要代理，请配置："
    echo "   git config --global http.proxy http://代理地址:端口"
    echo ""
    echo "或者使用手动上传方案："
    echo "1. 打开 MANUAL-UPLOAD-GUIDE.md 查看详细步骤"
    echo "2. 推荐使用 GitHub Desktop 进行推送"
    echo ""
fi

read -p "按回车键退出..."
