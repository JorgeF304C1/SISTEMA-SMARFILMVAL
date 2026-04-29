@echo off
:: ============================================================
:: build_windows.bat — Script de build para Windows
:: Genera el ejecutable SmartFilm_Valencia.exe
:: ============================================================
:: Requiere:
::   - Python 3.x con venv activo en backend/venv/
::   - Node.js instalado
::   - pyinstaller instalado en el venv
:: ============================================================

echo.
echo ============================================================
echo   Smart Film Valencia — Build para Windows
echo ============================================================
echo.

:: Paso 1: Build del frontend React
echo [1/4] Compilando frontend React...
cd /d "%~dp0..\frontend"
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo el build del frontend.
    pause
    exit /b 1
)
echo     Frontend compilado OK
echo.

:: Paso 2: Volver al backend
cd /d "%~dp0"

:: Paso 3: Instalar pyinstaller si no está
echo [2/4] Verificando PyInstaller...
call venv\Scripts\pip.exe install pyinstaller --quiet
echo     PyInstaller OK
echo.

:: Paso 4: Limpiar builds anteriores
echo [3/4] Limpiando builds anteriores...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
echo     Limpieza OK
echo.

:: Paso 5: Build con PyInstaller
echo [4/4] Generando ejecutable...
call venv\Scripts\pyinstaller.exe smartfilm.spec --noconfirm
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo PyInstaller.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   BUILD EXITOSO
echo   Ejecutable en: dist\SmartFilm_Valencia\SmartFilm_Valencia.exe
echo ============================================================
echo.
pause
