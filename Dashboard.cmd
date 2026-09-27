@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
  echo Dashboard requires Node.js 18 or newer. Install Node.js and try again.
  pause
  exit /b 1
)
node -e "if (Number(process.versions.node.split('.')[0]) < 18) process.exit(1)"
if errorlevel 1 (
  echo Dashboard requires Node.js 18 or newer. Please update Node.js.
  pause
  exit /b 1
)
node "%~dp0scripts\wizard\launch.mjs" --open %*
if errorlevel 1 (
  echo Dashboard did not start. See the message above.
  pause
  exit /b 1
)
endlocal
