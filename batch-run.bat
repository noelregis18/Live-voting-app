@echo off
echo ===================================================
echo VoteHub Application Startup
echo ===================================================
echo.

REM Show current directory
echo Current directory: %CD%

REM Check if directories exist
if not exist "%~dp0server" (
  echo [ERROR] Server directory not found at: %~dp0server
  echo Please run this batch file from the voting-app directory.
  goto end
)

if not exist "%~dp0client" (
  echo [ERROR] Client directory not found at: %~dp0client
  echo Please run this batch file from the voting-app directory.
  goto end
)

echo.
echo ===================================================
echo IMPORTANT: QUICK FIX INSTRUCTIONS
echo ===================================================
echo.
echo If you have ANY issues with login or registration:
echo.
echo * ALWAYS use the green "Use Test Account" button
echo * Do NOT fill out the form manually
echo * This bypasses all validation and server connection issues
echo.
echo ===================================================
echo.
pause

REM Create or update .env file for server
echo Creating .env file for server...
(
  echo PORT=5000
  echo DATABASE_URL=postgresql://postgres:your-password@db.onqdltwevkeeptipypjl.supabase.co:5432/postgres?ssl=true
  echo SUPABASE_URL=https://onqdltwevkeeptipypjl.supabase.co
  echo SUPABASE_KEY=your-anon-key
  echo JWT_SECRET=noelregis_voting_app_secret_key
  echo JWT_EXPIRE=30d
  echo FORCE_MOCK=true
) > "%~dp0server\.env"
echo .env file created.

REM Install server dependencies
echo Installing server dependencies...
cd /d "%~dp0server"
call npm install

REM Install pg package
echo Installing pg package for PostgreSQL...
call npm install pg

REM Start the server
echo.
echo Starting the server...
start cmd /k "cd /d %~dp0server && echo Starting server in %CD% && node index.js"

REM Wait for server to initialize
echo Waiting for server to start...
timeout /t 5

REM Install client dependencies
echo.
echo Installing client dependencies...
cd /d "%~dp0client"
call npm install

REM Start the client
echo.
echo Starting the client...
start cmd /k "cd /d %~dp0client && echo Starting client in %CD% && npm start"

REM Wait for client to initialize
echo Waiting for client to start...
timeout /t 5

REM Open in browser
echo.
echo Opening application in browser...
start http://localhost:3000
start http://localhost:5000/health

echo.
echo ===================================================
echo IMPORTANT: App is now running
echo ===================================================
echo.
echo To use the app properly:
echo.
echo 1. ALWAYS click the green "Use Test Account" button
echo 2. Do NOT try to fill out the login form
echo 3. Do NOT try to register with your own details
echo.
echo This will bypass all validation and server issues
echo ===================================================

:end
pause
