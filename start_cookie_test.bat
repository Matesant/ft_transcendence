@echo off
echo 🍪 Cookie Authentication Test Server
echo.
echo Starting Python HTTP server...
echo This serves the cookie test page on http://localhost:8080
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found in PATH
    echo Please install Python or add it to your PATH
    pause
    exit /b 1
)

REM Check if the HTML file exists
if not exist "cookie-test-fixed.html" (
    echo ❌ cookie-test-fixed.html not found
    echo Make sure you're running this from the correct directory
    pause
    exit /b 1
)

echo ✅ Starting server...
python serve_cookie_test.py

pause
