Write-Host "Starting FitConnect Backend Server..." -ForegroundColor Green
Write-Host ""

Set-Location backend

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

Write-Host "Starting the server..." -ForegroundColor Yellow
python -m app.main

Write-Host "Press any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")



