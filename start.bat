@echo off
title GM Companion
echo.
echo  ============================================
echo    GM Companion
echo  ============================================
echo.

:: Check if setup has been run
if not exist "node_modules" (
    echo  First time? Running setup...
    echo.
    call setup.bat
    if %ERRORLEVEL% neq 0 exit /b 1
)

:: Check for .env token
if not exist ".env" (
    echo  [!] No .env file found. Run setup.bat first.
    pause
    exit /b 1
)

findstr /c:"your_bot_token_here" .env >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo  [!] Bot token not configured. Run setup.bat or edit .env
    pause
    exit /b 1
)

echo  Starting bot + control panel...
echo  Control panel will open at: http://localhost:3000
echo.
echo  Keep this window open (minimize it).
echo  Close this window to stop the bot.
echo  ============================================
echo.

:: Open the control panel in the default browser after a short delay
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: Start the bot + UI server
node src/bot.js
