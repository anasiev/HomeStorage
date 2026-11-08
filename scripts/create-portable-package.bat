@echo off
REM ==============================================================================
REM Create Ready-to-Run Portable Deployment Folder for Home Inventory
REM ==============================================================================
setlocal enabledelayedexpansion

echo =====================================================================
echo   Creating Portable Folder with inventory.exe and web/ interface
echo =====================================================================

set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set PORTABLE_DIR=%ROOT_DIR%\portable_inventory

if not exist "%PORTABLE_DIR%" mkdir "%PORTABLE_DIR%"

echo [1/3] Copying web frontend directory (go-backend\web)...
if exist "%PORTABLE_DIR%\web" rd /s /q "%PORTABLE_DIR%\web"
if exist "%ROOT_DIR%\go-backend\web" (
    xcopy /e /i /y "%ROOT_DIR%\go-backend\web" "%PORTABLE_DIR%\web" >nul
) else if exist "%ROOT_DIR%\dist" (
    xcopy /e /i /y "%ROOT_DIR%\dist" "%PORTABLE_DIR%\web" >nul
) else (
    echo [ERROR] Web directory not found in go-backend\web or dist!
    echo Please run 'npm run build' first.
    pause
    exit /b 1
)

echo [2/3] Checking inventory.exe executable...
if exist "%ROOT_DIR%\go-backend\inventory.exe" (
    copy /y "%ROOT_DIR%\go-backend\inventory.exe" "%PORTABLE_DIR%\inventory.exe" >nul
) else if exist "%ROOT_DIR%\inventory.exe" (
    copy /y "%ROOT_DIR%\inventory.exe" "%PORTABLE_DIR%\inventory.exe" >nul
) else (
    where go >nul 2>&1
    if !errorlevel! equ 0 (
        echo Compiling inventory.exe using Go...
        cd /d "%ROOT_DIR%\go-backend"
        go build -ldflags="-s -w" -o "%PORTABLE_DIR%\inventory.exe" main.go
    ) else (
        echo [WARNING] inventory.exe not found and 'go' compiler is not in PATH.
        echo Please compile inventory.exe or copy it into portable_inventory\
    )
)

echo [3/3] Creating start.bat and README.txt...
(
echo @echo off
echo echo ======================================================
echo echo Starting Home Inventory Server on port 8080...
echo echo Local URL: http://localhost:8080
echo echo ======================================================
echo start http://localhost:8080
echo inventory.exe
echo pause
) > "%PORTABLE_DIR%\start.bat"

(
echo Home Inventory Portable Package
echo ===============================
echo 
echo This folder is completely ready to run:
echo 1. Double-click 'start.bat' or 'inventory.exe'
echo 2. Open your browser at http://localhost:8080
echo 
echo Folder structure:
echo - inventory.exe  (Go web server)
echo - web/           (Web interface assets)
echo - start.bat      (Convenient launcher)
echo - db.json        (Database file - created automatically on first run)
echo - uploads/       (Photo folder - created automatically on first run)
echo 
echo BACKUP INSTRUCTIONS:
echo To backup your inventory, save 'db.json' and the 'uploads/' folder.
) > "%PORTABLE_DIR%\README.txt"

echo.
echo =====================================================================
echo [SUCCESS] Portable folder created at:
echo %PORTABLE_DIR%
echo.
echo You can move the entire 'portable_inventory' folder to ANY computer,
echo flash drive, or new directory on Windows.
echo =====================================================================
pause
