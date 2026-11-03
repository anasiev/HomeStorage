@echo off
REM ==============================================================================
REM Home Inventory - Quick Backup Script (Windows 10/11)
REM Backs up db.json and the uploads\ folder to a timestamped ZIP archive.
REM ==============================================================================

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set BACKUP_DIR=%ROOT_DIR%\backups

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DT=%%I
set TIMESTAMP=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%-%DT:~10,2%-%DT:~12,2%
set ARCHIVE_NAME=inventory_backup_%TIMESTAMP%.zip

set DB_PATH=
if exist "%ROOT_DIR%\db.json" set DB_PATH=%ROOT_DIR%\db.json
if exist "%ROOT_DIR%\go-backend\db.json" set DB_PATH=%ROOT_DIR%\go-backend\db.json

set UPLOADS_PATH=
if exist "%ROOT_DIR%\uploads" set UPLOADS_PATH=%ROOT_DIR%\uploads
if exist "%ROOT_DIR%\go-backend\uploads" set UPLOADS_PATH=%ROOT_DIR%\go-backend\uploads

echo Creating backup of:
echo   - %DB_PATH%
echo   - %UPLOADS_PATH%

powershell -Command "Compress-Archive -Path '%DB_PATH%', '%UPLOADS_PATH%' -DestinationPath '%BACKUP_DIR%\%ARCHIVE_NAME%' -Force"

if %errorlevel% equ 0 (
    echo [SUCCESS] Backup created successfully:
    echo %BACKUP_DIR%\%ARCHIVE_NAME%
) else (
    echo [ERROR] Backup failed.
)

pause
