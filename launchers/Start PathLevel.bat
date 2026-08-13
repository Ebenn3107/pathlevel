@echo off
setlocal

rem This launcher lives on \\wsl.localhost\... (a UNC path). cmd.exe refuses UNC
rem working directories, so we never rely on the CWD. Instead we hand the UNC
rem path of this folder to `wsl.exe --cd`, which translates it back to the real
rem WSL path (no hardcoded paths, portable wherever the project lives).
set "LAUNCH_DIR=%~dp0"
if "%LAUNCH_DIR:~-1%"=="\" set "LAUNCH_DIR=%LAUNCH_DIR:~0,-1%"

rem ---- Start Docker Desktop if it is not already running ----
set "DOCKER_EXE=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if not exist "%DOCKER_EXE%" set "DOCKER_EXE=%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe"

tasklist /fi "imagename eq Docker Desktop.exe" 2>nul | find /i "Docker Desktop.exe" >nul
if errorlevel 1 (
  echo Starting Docker Desktop...
  start "" "%DOCKER_EXE%"
)

rem ---- Launch the WSL orchestrator (stays open as the control panel) ----
echo Launching PathLevel...
wsl.exe -d Ubuntu-24.04 --cd "%LAUNCH_DIR%" bash ./start.sh
if not "%errorlevel%"=="0" (
  echo.
  echo Startup failed - see the messages above.
  echo.
  pause
)
exit /b %errorlevel%
