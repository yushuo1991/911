import subprocess
import sys

password = "gJ75hNHdy90TA4qGo9"
server = "root@107.173.154.147"

commands = [
    ("检查磁盘使用情况", "df -h"),
    ("清理构建文件", "cd /www/wwwroot/stock-tracker && rm -rf .next node_modules backup log && echo '清理完成'"),
    ("清理npm缓存", "npm cache clean --force"),
    ("清理PM2日志", "pm2 flush"),
    ("Git垃圾回收", "cd /www/wwwroot/stock-tracker && git gc --aggressive --prune=now"),
    ("再次检查磁盘", "df -h")
]

print("=" * 50)
print("服务器磁盘清理脚本")
print("=" * 50)
print()

for i, (desc, cmd) in enumerate(commands, 1):
    print(f"[步骤{i}/{len(commands)}] {desc}...")

    full_cmd = f'echo {password} | ssh -o StrictHostKeyChecking=no {server} "{cmd}"'

    try:
        result = subprocess.run(
            full_cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.stdout:
            print(result.stdout)
        if result.stderr and "password" not in result.stderr.lower():
            print(f"错误: {result.stderr}")

        print()
    except subprocess.TimeoutExpired:
        print(f"超时：命令执行时间过长")
        print()
    except Exception as e:
        print(f"错误: {e}")
        print()

print("=" * 50)
print("清理完成！")
print("=" * 50)
