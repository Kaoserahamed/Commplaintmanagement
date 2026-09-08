# Check TaskCloud Deployment Status
# This script checks the health and status of all Azure resources

param(
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "deployment-info.json"
)

function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "============================================"
Write-Info "  TaskCloud Status Check"
Write-Info "============================================"
Write-Info ""

# Load deployment info
if (-not (Test-Path $ConfigFile)) {
    Write-Error "Deployment info file not found: $ConfigFile"
    exit 1
}

$config = Get-Content $ConfigFile | ConvertFrom-Json
Write-Success "Configuration loaded"
Write-Info ""

$backendAppName = "$($config.appName)-backend"
$frontendAppName = "$($config.appName)-frontend"

# Check Resource Group
Write-Info "[1/5] Checking Resource Group..."
$rg = az group show --name $config.resourceGroup 2>$null | ConvertFrom-Json
if ($rg) {
    Write-Success "✓ Resource Group: $($rg.name) ($($rg.location))"
} else {
    Write-Error "✗ Resource Group not found"
    exit 1
}

# Check Database
Write-Info "[2/5] Checking PostgreSQL Database..."
$db = az postgres flexible-server show --name $config.dbServer --resource-group $config.resourceGroup 2>$null | ConvertFrom-Json
if ($db) {
    Write-Success "✓ Database Server: $($db.name) - State: $($db.state)"
} else {
    Write-Error "✗ Database server not found"
}

# Check Container Registry
Write-Info "[3/5] Checking Container Registry..."
$acr = az acr show --name $config.acrName --resource-group $config.resourceGroup 2>$null | ConvertFrom-Json
if ($acr) {
    Write-Success "✓ Container Registry: $($acr.name) - Status: $($acr.provisioningState)"
} else {
    Write-Error "✗ Container Registry not found"
}

# Check Backend App
Write-Info "[4/5] Checking Backend App Service..."
$backend = az webapp show --name $backendAppName --resource-group $config.resourceGroup 2>$null | ConvertFrom-Json
if ($backend) {
    Write-Success "✓ Backend App: $($backend.name) - State: $($backend.state)"
    Write-Info "  URL: $($backend.defaultHostName)"
    
    # Test backend health
    try {
        $healthResponse = Invoke-RestMethod -Uri "$($config.backendUrl)/health" -TimeoutSec 10
        Write-Success "  Health Check: $($healthResponse.status) - DB: $($healthResponse.database)"
    } catch {
        Write-Warning "  Health Check: Failed (app may still be starting)"
    }
} else {
    Write-Error "✗ Backend App not found"
}

# Check Frontend App
Write-Info "[5/5] Checking Frontend App Service..."
$frontend = az webapp show --name $frontendAppName --resource-group $config.resourceGroup 2>$null | ConvertFrom-Json
if ($frontend) {
    Write-Success "✓ Frontend App: $($frontend.name) - State: $($frontend.state)"
    Write-Info "  URL: $($frontend.defaultHostName)"
    
    # Test frontend availability
    try {
        $response = Invoke-WebRequest -Uri $config.frontendUrl -TimeoutSec 10 -UseBasicParsing
        Write-Success "  Availability: HTTP $($response.StatusCode)"
    } catch {
        Write-Warning "  Availability: Failed (app may still be starting)"
    }
} else {
    Write-Error "✗ Frontend App not found"
}

# Summary
Write-Info ""
Write-Info "============================================"
Write-Info "  Summary"
Write-Info "============================================"
Write-Info ""
Write-Info "Deployment Date: $($config.deploymentDate)"
Write-Success "Frontend URL: $($config.frontendUrl)"
Write-Success "Backend API: $($config.backendUrl)"
Write-Success "API Documentation: $($config.backendUrl)/docs"
Write-Info ""
Write-Info "Resource Group: $($config.resourceGroup)"
Write-Info "Location: $($config.location)"
Write-Info ""

# List all resources
Write-Info "All Resources:"
az resource list --resource-group $config.resourceGroup --output table

Write-Info ""
