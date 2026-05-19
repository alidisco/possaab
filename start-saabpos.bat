@echo off
setlocal

rem Saab Electric POS launcher
rem Starts the packaged Electron app if installed under Program Files.

set APP_NAME=Saab Electric POS
set INSTALLED_EXE="%ProgramFiles%\%APP_NAME%\Saab Electric POS.exe"
set INSTALLED_EXE2="%ProgramFiles%\%APP_NAME%\%APP_NAME%.exe"
set LOCAL_EXE=%~dp0dist\win-unpacked\Saab Electric POS.exe

if exist %INSTALLED_EXE% (
  echo Launching installed app...
  start "SaabPOS" %INSTALLED_EXE%
  exit /b 0
)

if exist %INSTALLED_EXE2% (
  echo Launching installed app...
  start "SaabPOS" %INSTALLED_EXE2%
  exit /b 0
)

if exist %LOCAL_EXE% (
  echo Launching local unpacked build...
  start "SaabPOS" %LOCAL_EXE%
  exit /b 0
)


echo Could not find a built app to launch.
echo.
echo 1) Build the app first: npm run electron:build
echo 2) Or create an unpacked dir with: npx electron-builder --dir --win --x64

pause
endlocal

