Write-Host "Starting VoteHub Backend Server..." -ForegroundColor Green

# Check for database configuration
$envPath = Join-Path -Path $PSScriptRoot -ChildPath "server\.env"
$envContent = Get-Content $envPath -ErrorAction SilentlyContinue

# Check if direct PostgreSQL is configured
$hasPgConfig = $false
if ($envContent -match "DATABASE_URL" -and -not $envContent -match "\[YOUR-PASSWORD\]") {
    Write-Host "PostgreSQL direct connection configured!" -ForegroundColor Green
    $hasPgConfig = $true
}

# Check for Supabase configuration if no direct PostgreSQL
if (-not $hasPgConfig -and $envContent -match "SUPABASE_URL" -and $envContent -match "SUPABASE_KEY") {
    Write-Host "Supabase configuration detected!" -ForegroundColor Cyan
} elseif (-not $hasPgConfig) {
    Write-Host "No database configuration found. Using mock database mode." -ForegroundColor Yellow
    Write-Host "To use PostgreSQL direct connection, run: node setup-postgres-env.js your-password" -ForegroundColor Yellow
    Write-Host "To use Supabase, run: node setup-supabase-env.js your-project-url your-anon-key" -ForegroundColor Yellow
}

# Get the directory where the script is located and navigate to server directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path "$scriptPath\server"

# Check if pg package is installed if using PostgreSQL
if ($hasPgConfig) {
    $packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
    $hasPgPackage = $packageJson.dependencies.pg -ne $null

    if (-not $hasPgPackage) {
        Write-Host "Installing PostgreSQL driver..." -ForegroundColor Yellow
        npm install pg
    }
}

# Install dependencies if needed
Write-Host "Checking for dependencies..." -ForegroundColor Yellow
npm install

# Start the server
Write-Host "Starting server..." -ForegroundColor Green
npm run dev 