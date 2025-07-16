@echo off
echo.
echo ========================================
echo   JEF Chrome Extension Installation
echo ========================================
echo.
echo This script will help you install the JEF Chrome Extension.
echo.
echo STEPS:
echo 1. Open Chrome browser
echo 2. Go to chrome://extensions/
echo 3. Enable "Developer mode" (top right toggle)
echo 4. Click "Load unpacked"
echo 5. Select this folder: %~dp0
echo.
echo The extension files are ready in: %~dp0
echo.
echo Press any key to open Chrome extensions page...
pause >nul

start chrome://extensions/

echo.
echo Extension page opened in Chrome.
echo Follow the steps above to install the extension.
echo.
pause
