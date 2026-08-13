@echo off
setlocal

rem Resolve this launcher's folder to its WSL path via wsl.exe --cd, so the
rem scripts below are found regardless of where the project lives.
set "LAUNCH_DIR=%~dp0"
if "%LAUNCH_DIR:~-1%"=="\" set "LAUNCH_DIR=%LAUNCH_DIR:~0,-1%"

rem ---- Stop servers and containers (inside WSL) ----
echo Stopping PathLevel servers and containers...
wsl.exe -d Ubuntu-24.04 --cd "%LAUNCH_DIR%" bash ./stop.sh

rem ---- Close Docker Desktop ----
echo Stopping Docker Desktop...
taskkill /im "Docker Desktop.exe" >nul 2>&1
if errorlevel 1 taskkill /f /im "Docker Desktop.exe" >nul 2>&1

rem ---- Shut down WSL (stops the Docker engine VM and all distros) ----
echo Shutting down WSL...
wsl.exe --shutdown

echo.
echo PathLevel stopped. You can close this window.
pause
