@echo off
REM ==============================================================================
REM Windows Service Uninstaller for Home Inventory Server
REM Run as Administrator
REM ==============================================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Must be run as Administrator!
    pause
    exit /b 1
)

set SERVICE_NAME=HomeInventory

where nssm >nul 2>&1
if %errorlevel% equ 0 (
    nssm stop %SERVICE_NAME% >nul 2>&1
    nssm remove %SERVICE_NAME% confirm
) else (
    sc stop %SERVICE_NAME% >nul 2>&1
    sc delete %SERVICE_NAME%
)

echo Service %SERVICE_NAME% removed successfully.
pause
