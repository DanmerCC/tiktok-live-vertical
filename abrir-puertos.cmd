@echo off
echo Abriendo puertos para el sistema LIVE...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Ejecuta este archivo como Administrador (clic derecho - Ejecutar como administrador)
    pause
    exit /b 1
)
netsh advfirewall firewall delete rule name="MediaMTX RTMP" >nul 2>&1
netsh advfirewall firewall delete rule name="MediaMTX HLS" >nul 2>&1
netsh advfirewall firewall delete rule name="MediaMTX WebRTC HTTP" >nul 2>&1
netsh advfirewall firewall delete rule name="MediaMTX WebRTC ICE" >nul 2>&1
netsh advfirewall firewall delete rule name="MediaMTX Web" >nul 2>&1

netsh advfirewall firewall add rule name="MediaMTX RTMP" dir=in action=allow protocol=TCP localport=1935
netsh advfirewall firewall add rule name="MediaMTX HLS" dir=in action=allow protocol=TCP localport=8888
netsh advfirewall firewall add rule name="MediaMTX WebRTC HTTP" dir=in action=allow protocol=TCP localport=8889
netsh advfirewall firewall add rule name="MediaMTX WebRTC ICE" dir=in action=allow protocol=UDP localport=8189
netsh advfirewall firewall add rule name="MediaMTX Web" dir=in action=allow protocol=TCP localport=3000

echo.
echo Puertos abiertos: 1935, 8888, 8889, 8189, 3000
pause