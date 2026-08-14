@echo off
chcp 65001 >nul
title TTS Master Dashboard Launcher

setlocal EnableDelayedExpansion

:: 1. Tim duong dan Python
set "PYTHON_EXE=python"
if exist "%USERPROFILE%\runtimes\python\python.exe" (
    set "PYTHON_EXE=%USERPROFILE%\runtimes\python\python.exe"
    set "PATH=%USERPROFILE%\runtimes\python;%USERPROFILE%\runtimes\python\Scripts;!PATH!"
)

:: 2. Tim duong dan NPM / Node
set "NPM_CMD=npm"
if exist "%USERPROFILE%\runtimes\node\npm.cmd" (
    set "NPM_CMD=%USERPROFILE%\runtimes\node\npm.cmd"
    set "PATH=%USERPROFILE%\runtimes\node;!PATH!"
)

echo.
echo ===========================================
echo        TTS Master Dashboard Launcher
echo ===========================================
echo.

:: Kiem tra Python
"%PYTHON_EXE%" --version >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay Python. Vui long cai Python va thu lai.
    pause & exit /b 1
)

:: Kiem tra Node / NPM
call "%NPM_CMD%" --version >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay Node.js / NPM. Vui long kiem tra lai.
    pause & exit /b 1
)

:: 3. Don dep tien trinh cu tren port 5000 va 5173 neu co
echo [1/4] Kiem tra port 5000 va 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: 4. Kiem tra thu vien Python
echo [2/4] Kiem tra thu vien Python...
"%PYTHON_EXE%" -m pip show flask >nul 2>&1
if errorlevel 1 (
    echo       - Dang cai dat requirements.txt...
    pushd "%~dp0tts_app"
    "%PYTHON_EXE%" -m pip install -r "requirements.txt" --quiet
    popd
)

:: 5. Kiem tra node_modules
echo [3/4] Kiem tra thu vien Node...
if not exist "%~dp0frontend\node_modules" (
    echo       - Dang cai dat node_modules...
    pushd "%~dp0frontend"
    call "%NPM_CMD%" install --silent
    popd
)

:: 6. Khoi dong Backend & Frontend
echo [4/4] Dang khoi dong Backend va Frontend...
pushd "%~dp0tts_app"
start "TTS Backend" cmd /k "title TTS Backend (Port 5000) && "%PYTHON_EXE%" run.py"
popd

timeout /t 2 /nobreak >nul

pushd "%~dp0frontend"
start "TTS Frontend" cmd /k "title TTS Frontend (Port 5173) && call "%NPM_CMD%" run dev"
popd

echo.
echo ===========================================
echo   Da khoi dong thanh cong!
echo   Backend  =^>  http://localhost:5000
echo   Frontend =^>  http://localhost:5173
echo ===========================================
echo.

timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"

echo Nhan phim bat ky hoac dong cua so nay (Backend va Frontend van tiep tuc chay).
pause >nul