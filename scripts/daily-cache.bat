@echo off
REM 每日股票数据缓存脚本 - Windows版本
REM 建议在Windows任务计划程序中设置每天18:00执行

setlocal EnableDelayedExpansion

REM 脚本配置
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR:~0,-9%
set LOG_DIR=%PROJECT_DIR%log
set LOG_FILE=%LOG_DIR%\daily-cache-%date:~0,4%%date:~5,2%%date:~8,2%.log

REM 确保日志目录存在
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM 日志函数（通过call实现）
call :log "🚀 开始每日数据缓存任务"

REM 读取环境变量
if exist "%PROJECT_DIR%.env.local" (
    for /f "usebackq delims=" %%a in ("%PROJECT_DIR%.env.local") do (
        set "%%a"
    )
)

REM 设置默认值
if not defined NEXTAUTH_URL set NEXTAUTH_URL=http://localhost:3000
if not defined SCHEDULER_TOKEN set SCHEDULER_TOKEN=default-token

call :log "📡 API地址: !NEXTAUTH_URL!"

REM 执行缓存任务
curl -s -X POST ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer !SCHEDULER_TOKEN!" ^
  "!NEXTAUTH_URL!/api/scheduler" ^
  --max-time 600 > temp_response.json

if !errorlevel! == 0 (
    call :log "✅ 缓存任务完成"

    REM 读取响应并记录
    for /f "usebackq delims=" %%a in ("temp_response.json") do (
        call :log "📊 响应结果: %%a"
    )

    REM 检查成功状态
    findstr "success.*true" temp_response.json >nul
    if !errorlevel! == 0 (
        call :log "🎉 缓存任务执行成功"
    ) else (
        call :log "⚠️  缓存任务可能有问题，请检查响应"
    )

    del temp_response.json
) else (
    call :log "❌ 缓存任务请求失败"
    call :log "🔍 请检查服务是否正常运行"
)

call :log "📝 详细日志已保存到: %LOG_FILE%"
call :log "✨ 每日缓存任务结束"

REM 清理7天前的日志文件
forfiles /p "%LOG_DIR%" /m daily-cache-*.log /d -7 /c "cmd /c del @path" 2>nul

echo 完成时间: %date% %time% >> "%LOG_FILE%"

goto :eof

REM 日志函数
:log
echo [%date% %time%] %~1 >> "%LOG_FILE%"
echo [%date% %time%] %~1
goto :eof