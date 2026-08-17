@echo off
cd /d "%~dp0"
echo Levantando la pagina web...
start "Web LIVE" cmd /k "cd /d %~dp0 && node --env-file-if-exists=.env serve.js"
echo  - Pagina web:      http://localhost:3000
echo  - App transmitir:  http://100.69.29.43:3000/broadcast
pause