@echo off
echo 🚀 启动 Meta Map 联调热更新环境...
echo.

echo 📂 项目路径:
echo    演示项目: %cd%
echo    库项目:   %cd%\..
echo.

echo 🔧 启动库构建监听...
start "库构建监听" cmd /k "cd .. && npm run dev"

echo.
echo ⏳ 等待库构建启动...
timeout /t 3 >nul

echo.
echo 🌐 启动演示应用...
npm start

echo.
echo ✅ 联调环境已启动! 