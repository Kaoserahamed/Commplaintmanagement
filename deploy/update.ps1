# Update TaskCloud Application on Azure
# This script rebuilds and redeploys containers to existing Azure infrastructure

param(
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "deployment-info.json"
)

function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "============================================"
Write-Info "  TaskCloud Update Deployment"
Write-Info "============================================"
Write-Info ""

# Load deployment info
if (-not (Test-Path $ConfigFile)) {
    Write-Error "Deployment info file not found: $ConfigFile"
    Write-Info "Please run deploy.ps1 first or specify the correct config file."
    exit 1
}

$config = Get-Content $ConfigFile | ConvertFrom-Json
Write-Success "✓ Loaded deployment configuration"
Write-Info "  Resource Group: $($config.resourceGroup)"
Write-Info "  App Name: $($config.appName)"
Write-Info ""

$acrName = $config.acrName
$backendAppName = "$($config.appName)-backend"
$frontendAppName = "$($config.appName)-frontend"

# Get ACR server
$acrServer = az acr show --name $acrName --resource-group $config.resourceGroup --query loginServer -o tsv

# Update backend
Write-Info "[1/4] Building and pushing updated backend..."
Set-Location -Path "$PSScriptRoot\..\backend"
az acr build --registry $acrName --image taskcloud-backend:latest --file Dockerfile . --output none

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Backend container updated"
} else {
    Write-Error "✗ Failed to build backend"
    exit 1
}

# Restart backend app
Write-Info "[2/4] Restarting backend app..."
az webapp restart --name $backendAppName --resource-group $config.resourceGroup --output none
Write-Success "✓ Backend restarted"

# Update frontend
Write-Info "[3/4] Building and pushing updated frontend..."
Set-Location -Path "$PSScriptRoot\..\frontend"
az acr build `
    --registry $acrName `
    --image taskcloud-frontend:latest `
    --file Dockerfile `
    --build-arg VITE_API_URL=$($config.backendUrl) `
    . `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Frontend container updated"
} else {
    Write-Error "✗ Failed to build frontend"
    exit 1
}

# Restart frontend app
Write-Info "[4/4] Restarting frontend app..."
az webapp restart --name $frontendAppName --resource-group $config.resourceGroup --output none
Write-Success "✓ Frontend restarted"

Write-Info ""
Write-Success "============================================"
Write-Success "  Update Complete! 🎉"
Write-Success "============================================"
Write-Info ""
Write-Info "Application URLs:"
Write-Success "  Frontend: $($config.frontendUrl)"
Write-Success "  Backend: $($config.backendUrl)"
Write-Info ""
Write-Info "Changes will be live in 1-2 minutes."
Write-Info ""
