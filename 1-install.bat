@echo off
echo =================================================================
echo   KingdomForge // Unity AI Builder - Local Installation Hook
echo =================================================================
echo.

node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Node.js environment detected.
echo [2/3] Installing application dependencies...
call npm install

if not exist .env.local (
    echo [3/3] Creating .env.local configuration file...
    (
        echo # KingdomForge Local Daemon Config
        echo UNITY_PROJECT_PATH=C:/Users/%USERNAME%/Documents/UnityKingdomGame
        echo UNITY_EXE_PATH=C:/Program Files/Unity/Hub/Editor/2022.3.20f1/Editor/Unity.exe
        echo SPRITE_WEBHOOK_URL=http://localhost:8080/generate-sprite
        echo MEDIA_WEBHOOK_URL=http://localhost:8080/generate-media
    ) > .env.local
    echo [OK] .env.local created.
) else (
    echo [3/3] .env.local already exists.
)

echo.
echo =================================================================
echo   Installation Complete! Run 2-start-kingdom-forge.bat to launch.
echo =================================================================
pause
