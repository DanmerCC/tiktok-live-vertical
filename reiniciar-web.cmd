@echo off
cd /d "%~dp0"
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
timeout /t 1 /nobreak >nul
start "Web LIVE" cmd /k "cd /d %~dp0 && node --env-file-if-exists=.env serve.js"
echo Web reiniciada.