@echo off
:: ============================================================
:: build_windows.bat — Build SmartFilm Valencia para Windows
:: Genera SmartFilm_Valencia.exe (ventana nativa, sin navegador)
:: ============================================================
:: Requisitos:
::   - Python 3.x con venv activo en backend/venv/
::   - Node.js instalado
:: ============================================================

echo.
echo ============================================================
echo   Smart Film Valencia — Build para Windows
echo ============================================================
echo.

:: Paso 1: Compilar el frontend React
echo [1/5] Compilando frontend React...
cd /d "%~dp0..\frontend"
call npm install --silent
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo el build del frontend.
    pause & exit /b 1
)
echo       Frontend OK ^(dist en backend\static_frontend\^)
echo.

:: Paso 2: Volver al backend
cd /d "%~dp0"

:: Paso 3: Instalar dependencias Python
echo [2/5] Instalando dependencias Python...
call venv\Scripts\pip.exe install -r requirements.txt --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo pip install.
    pause & exit /b 1
)
call venv\Scripts\pip.exe install pyinstaller --quiet
echo       Dependencias OK
echo.

:: Paso 4: Limpiar builds anteriores
echo [3/5] Limpiando builds anteriores...
if exist dist  rmdir /s /q dist
if exist build rmdir /s /q build
echo       Limpieza OK
echo.

:: Paso 5: Compilar con PyInstaller
echo [4/5] Compilando ejecutable con PyInstaller...
call venv\Scripts\pyinstaller.exe smartfilm.spec --noconfirm
if %ERRORLEVEL% NEQ 0 (
    echo [ADVERTENCIA] PyInstaller reporto advertencias, verificando exe...
)

:: Verificar que el exe existe
if not exist "dist\SmartFilm_Valencia\SmartFilm_Valencia.exe" (
    echo [ERROR] El ejecutable no fue generado.
    pause & exit /b 1
)

echo.
echo ============================================================
echo   [5/5] BUILD COMPLETADO
echo.
echo   Ejecutable: dist\SmartFilm_Valencia\SmartFilm_Valencia.exe
echo.
echo   Para distribuir, copia TODA la carpeta:
echo   dist\SmartFilm_Valencia\
echo.
echo   Los datos del usuario se guardaran en:
echo   (junto al .exe)\local_storage\
echo ============================================================
echo.
pause
