Write-Host "Starting VoteHub Frontend Client..." -ForegroundColor Green

# Get the directory where the script is located and navigate to client directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path "$scriptPath\client"

# Install dependencies if needed
Write-Host "Checking for dependencies..." -ForegroundColor Yellow
npm install

# Start the client
Write-Host "Starting client..." -ForegroundColor Green
npm start 