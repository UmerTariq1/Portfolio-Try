@echo off
echo Starting Portfolio Web Server...
echo.

REM Try Python first
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo Using Python HTTP Server
    echo Open http://localhost:8000 in your browser
    echo Press Ctrl+C to stop
    echo.
    python -m http.server 8000
    goto :eof
)

REM Try Python3
where python3 >nul 2>nul
if %errorlevel% equ 0 (
    echo Using Python HTTP Server
    echo Open http://localhost:8000 in your browser
    echo Press Ctrl+C to stop
    echo.
    python3 -m http.server 8000
    goto :eof
)

REM Try npx/npm
where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo Using npx serve
    echo This will open automatically in your browser
    echo.
    npx serve .
    goto :eof
)

REM If nothing is available, try PowerShell script
echo No Python or Node.js found. Trying PowerShell server...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"

