@echo off
cd /d "%~dp0"
echo === Iniciando sistema LIVE ===

netstat -an | findstr ":1935" | findstr "LISTENING" >nul
if %errorlevel%==0 (
  echo [OK] MediaMTX ya esta corriendo
) else (
  echo [..] Iniciando MediaMTX...
  start "MediaMTX" "%~dp0mediamtx\mediamtx.exe" "%~dp0mediamtx.yml"
)

netstat -an | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel%==0 (
  echo [OK] Web ya esta corriendo
) else (
  echo [..] Iniciando web...
  start "Web LIVE" cmd /k "cd /d %~dp0 && node --env-file-if-exists=.env serve.js"
)

echo.
echo ====================================
echo  Listo. Todo corre en ventanas propias
echo  - Ver video:      http://localhost:3000
echo  - Transmitir:     http://100.69.29.43:3000/broadcast
echo  Para apagar todo: detener.cmd
echo ====================================
timeout /t 5 >nul