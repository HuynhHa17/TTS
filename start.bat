@echo off
chcp 65001 >nul
title TTS Master Dashboard

echo.
echo ===========================================
echo        TTS Master Dashboard
echo ===========================================
echo.

:: 1. Kiem tra Python
where python >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay Python. Hay cai Python va thu lai.
    pause & exit /b 1
)

:: 2. Cai pip packages neu thieu
echo [1/4] Kiem tra thu vien Python...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo       - Dang cai requirements.txt...
    pip install -r "%~dp0tts_app\requirements.txt" --quiet
    if errorlevel 1 (
        echo [LOI] Cai Python packages that bai.
        pause & exit /b 1
    )
    echo       OK Da cai xong.
) else (
    echo       OK Thu vien Python da co san.
)

:: 3. Kiem tra Node / npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay npm. Hay cai Node.js va thu lai.
    pause & exit /b 1
)

:: 4. Cai node_modules neu thieu
echo [2/4] Kiem tra thu vien Node...
if not exist "%~dp0frontend\node_modules" (
    echo       - Dang chay npm install...
    pushd "%~dp0frontend"
    call npm install --silent
    if errorlevel 1 (
        echo [LOI] npm install that bai.
        popd & pause & exit /b 1
    )
    popd
    echo       OK Da cai xong.
) else (
    echo       OK node_modules da co san.
)

:: 5. Khoi dong Backend
echo [3/4] Khoi dong Backend Flask :5000...
start "TTS Backend" cmd /k "cd /d %~dp0tts_app && python run.py"

timeout /t 2 /nobreak >nul

:: 6. Khoi dong Frontend
echo [4/4] Khoi dong Frontend Vite :5173...
start "TTS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo OK Dang khoi dong...
echo   Backend  =^>  http://localhost:5000
echo   Frontend =^>  http://localhost:5173
echo.

timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"

echo Dong cua so nay de thoat (Backend va Frontend van chay).
pause >nul
