@echo off
echo Deteniendo MediaMTX y la web...
taskkill /F /IM mediamtx.exe >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
echo.
echo Detenido. Puedes cerrar las ventanas restantes.
timeout /t 3 >nul