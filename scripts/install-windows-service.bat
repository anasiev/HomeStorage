@echo off
REM ==============================================================================
REM Windows 10/11 Service Installer for Home Inventory Server
REM Run as Administrator (Right click -> Run as administrator)
REM ==============================================================================

setlocal enabledelayedexpansion

echo ======================================================
echo   Home Inventory Windows Service Setup (Windows 10/11)
echo ======================================================

REM Check Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo Please right-click this .bat file and select 'Run as administrator'.
    pause
    exit /b 1
)

set SERVICE_NAME=HomeInventory
set CURRENT_DIR=%~dp0
set BASE_DIR=%CURRENT_DIR%..
pushd "%BASE_DIR%"
set APP_DIR=%CD%
popd

set BIN_PATH=%APP_DIR%\go-backend\inventory.exe
if not exist "%BIN_PATH%" (
    set BIN_PATH=%APP_DIR%\inventory.exe
)

if not exist "%BIN_PATH%" (
    echo [WARNING] inventory.exe was not found in:
    echo   - %APP_DIR%\go-backend\inventory.exe
    echo   - %APP_DIR%\inventory.exe
    echo.
    echo If Go is installed, building inventory.exe now...
    cd /d "%APP_DIR%\go-backend"
    go build -ldflags="-s -w" -o inventory.exe main.go
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed. Please compile inventory.exe first.
        pause
        exit /b 1
    )
    set BIN_PATH=%APP_DIR%\go-backend\inventory.exe
)

echo Found executable: %BIN_PATH%

REM Option A: Using NSSM (Recommended if nssm.exe exists)
where nssm >nul 2>&1
if %errorlevel% equ 0 (
    echo Installing service via NSSM...
    nssm stop %SERVICE_NAME% >nul 2>&1
    nssm remove %SERVICE_NAME% confirm >nul 2>&1
    nssm install %SERVICE_NAME% "%BIN_PATH%"
    nssm set %SERVICE_NAME% AppDirectory "%APP_DIR%\go-backend"
    nssm set %SERVICE_NAME% Description "Home Inventory and Hierarchical Storage Management Service"
    nssm set %SERVICE_NAME% Start SERVICE_AUTO_START
    nssm start %SERVICE_NAME%
    echo [SUCCESS] Service %SERVICE_NAME% installed and started via NSSM!
    goto :done
)

REM Option B: Using Windows native sc.exe
echo Installing service via Windows Service Control Manager (sc.exe)...
sc query %SERVICE_NAME% >nul 2>&1
if %errorlevel% equ 0 (
    sc stop %SERVICE_NAME% >nul 2>&1
    sc delete %SERVICE_NAME% >nul 2>&1
    timeout /t 2 /nobreak >nul
)

sc create %SERVICE_NAME% binPath= "\"%BIN_PATH%\"" start= auto DisplayName= "Home Inventory Server"
sc description %SERVICE_NAME% "Home Inventory and Hierarchical Storage Management Service"
sc start %SERVICE_NAME%

:done
echo.
echo ======================================================
echo   Service Installation Completed!
echo   Service Name: %SERVICE_NAME%
echo   Local Web App: http://localhost:8080
echo   Status Check:  sc query %SERVICE_NAME%
echo   Stop Command:  net stop %SERVICE_NAME%
echo   Start Command: net start %SERVICE_NAME%
echo ======================================================
echo.
pause
