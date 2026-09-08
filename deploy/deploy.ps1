# TaskCloud Azure Deployment Script
# This script deploys the complete application to Azure

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "taskcloud-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "taskcloud-$(Get-Random -Minimum 1000 -Maximum 9999)"
)

# Color functions for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "============================================"
Write-Info "  TaskCloud Azure Deployment"
Write-Info "============================================"
Write-Info ""

# Check if Azure CLI is installed
Write-Info "Checking Azure CLI installation..."
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Success "✓ Azure CLI version: $($azVersion.'azure-cli')"
} catch {
    Write-Error "✗ Azure CLI is not installed. Please install it from: https://aka.ms/installazurecliwindows"
    exit 1
}

# Check if logged in
Write-Info "Checking Azure login status..."
$account = az account show 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Not logged in to Azure. Please login..."
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Error "✗ Login failed"
        exit 1
    }
}

$accountInfo = az account show | ConvertFrom-Json
Write-Success "✓ Logged in as: $($accountInfo.user.name)"
Write-Success "✓ Subscription: $($accountInfo.name)"
Write-Info ""

# Configuration
$dbServerName = "$AppName-dbserver"
$dbName = "taskcloud"
$dbAdmin = "taskcloudadmin"
$dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_}) + "!1Aa"
$acrName = $AppName.Replace("-", "") + "acr"
$backendAppName = "$AppName-backend"
$frontendAppName = "$AppName-frontend"

Write-Info "Deployment Configuration:"
Write-Info "  Resource Group: $ResourceGroup"
Write-Info "  Location: $Location"
Write-Info "  App Name: $AppName"
Write-Info "  Database Server: $dbServerName"
Write-Info "  Container Registry: $acrName"
Write-Info ""

Read-Host "Press Enter to continue or Ctrl+C to cancel"

# Step 1: Create Resource Group
Write-Info "[1/9] Creating resource group..."
az group create --name $ResourceGroup --location $Location --output none
if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Resource group created"
} else {
    Write-Error "✗ Failed to create resource group"
    exit 1
}

# Step 2: Create Azure Container Registry
Write-Info "[2/9] Creating Azure Container Registry..."
az acr create `
    --name $acrName `
    --resource-group $ResourceGroup `
    --sku Basic `
    --admin-enabled true `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Container registry created"
} else {
    Write-Error "✗ Failed to create container registry"
    exit 1
}

# Get ACR credentials
$acrCreds = az acr credential show --name $acrName --resource-group $ResourceGroup | ConvertFrom-Json
$acrServer = az acr show --name $acrName --resource-group $ResourceGroup --query loginServer -o tsv

# Step 3: Build and push backend container
Write-Info "[3/9] Building and pushing backend container..."
Set-Location -Path "$PSScriptRoot\..\backend"
az acr build --registry $acrName --image taskcloud-backend:latest --file Dockerfile . --output none
if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Backend container built and pushed"
} else {
    Write-Error "✗ Failed to build backend container"
    exit 1
}

# Step 4: Create PostgreSQL Database
Write-Info "[4/9] Creating Azure Database for PostgreSQL..."
az postgres flexible-server create `
    --name $dbServerName `
    --resource-group $ResourceGroup `
    --location $Location `
    --admin-user $dbAdmin `
    --admin-password $dbPassword `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --storage-size 32 `
    --version 15 `
    --public-access 0.0.0.0-255.255.255.255 `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ PostgreSQL server created"
} else {
    Write-Error "✗ Failed to create PostgreSQL server"
    exit 1
}

# Create database
Write-Info "[4/9] Creating database..."
az postgres flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $dbServerName `
    --database-name $dbName `
    --output none

Write-Success "✓ Database created"

# Configure firewall to allow Azure services
az postgres flexible-server firewall-rule create `
    --resource-group $ResourceGroup `
    --name $dbServerName `
    --rule-name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0 `
    --output none

# Step 5: Create App Service Plan
Write-Info "[5/9] Creating App Service Plan..."
az appservice plan create `
    --name "$AppName-plan" `
    --resource-group $ResourceGroup `
    --location $Location `
    --is-linux `
    --sku B1 `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ App Service Plan created"
} else {
    Write-Error "✗ Failed to create App Service Plan"
    exit 1
}

# Step 6: Create Backend Web App
Write-Info "[6/9] Creating backend web app..."
$backendUrl = "https://$backendAppName.azurewebsites.net"
$databaseUrl = "postgresql://${dbAdmin}:${dbPassword}@${dbServerName}.postgres.database.azure.com:5432/${dbName}?sslmode=require"

az webapp create `
    --name $backendAppName `
    --resource-group $ResourceGroup `
    --plan "$AppName-plan" `
    --deployment-container-image-name "$acrServer/taskcloud-backend:latest" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Backend web app created"
} else {
    Write-Error "✗ Failed to create backend web app"
    exit 1
}

# Configure backend app settings
Write-Info "[6/9] Configuring backend settings..."
az webapp config appsettings set `
    --name $backendAppName `
    --resource-group $ResourceGroup `
    --settings `
        DATABASE_URL="$databaseUrl" `
        CORS_ORIGINS="https://$frontendAppName.azurewebsites.net" `
        WEBSITES_PORT=8000 `
    --output none

# Configure container registry credentials
az webapp config container set `
    --name $backendAppName `
    --resource-group $ResourceGroup `
    --docker-registry-server-url "https://$acrServer" `
    --docker-registry-server-user $acrCreds.username `
    --docker-registry-server-password $acrCreds.passwords[0].value `
    --output none

Write-Success "✓ Backend configured"

# Step 7: Build and push frontend container
Write-Info "[7/9] Building and pushing frontend container..."
Set-Location -Path "$PSScriptRoot\..\frontend"
az acr build `
    --registry $acrName `
    --image taskcloud-frontend:latest `
    --file Dockerfile `
    --build-arg VITE_API_URL=$backendUrl `
    . `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Frontend container built and pushed"
} else {
    Write-Error "✗ Failed to build frontend container"
    exit 1
}

# Step 8: Create Frontend Web App
Write-Info "[8/9] Creating frontend web app..."
az webapp create `
    --name $frontendAppName `
    --resource-group $ResourceGroup `
    --plan "$AppName-plan" `
    --deployment-container-image-name "$acrServer/taskcloud-frontend:latest" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Success "✓ Frontend web app created"
} else {
    Write-Error "✗ Failed to create frontend web app"
    exit 1
}

# Configure frontend container
az webapp config container set `
    --name $frontendAppName `
    --resource-group $ResourceGroup `
    --docker-registry-server-url "https://$acrServer" `
    --docker-registry-server-user $acrCreds.username `
    --docker-registry-server-password $acrCreds.passwords[0].value `
    --output none

az webapp config appsettings set `
    --name $frontendAppName `
    --resource-group $ResourceGroup `
    --settings WEBSITES_PORT=80 `
    --output none

Write-Success "✓ Frontend configured"

# Step 9: Enable HTTPS and configure
Write-Info "[9/9] Configuring HTTPS..."
az webapp update --name $backendAppName --resource-group $ResourceGroup --https-only true --output none
az webapp update --name $frontendAppName --resource-group $ResourceGroup --https-only true --output none
Write-Success "✓ HTTPS enabled"

# Wait for deployment
Write-Info ""
Write-Info "Waiting for services to start (this may take 2-3 minutes)..."
Start-Sleep -Seconds 60

# Save deployment info
Set-Location -Path "$PSScriptRoot"
$deploymentInfo = @{
    resourceGroup = $ResourceGroup
    location = $Location
    appName = $AppName
    frontendUrl = "https://$frontendAppName.azurewebsites.net"
    backendUrl = $backendUrl
    dbServer = $dbServerName
    dbName = $dbName
    dbAdmin = $dbAdmin
    dbPassword = $dbPassword
    acrName = $acrName
    deploymentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

$deploymentInfo | ConvertTo-Json | Out-File -FilePath "deployment-info.json"

# Display summary
Write-Info ""
Write-Success "============================================"
Write-Success "  Deployment Complete! 🎉"
Write-Success "============================================"
Write-Info ""
Write-Info "Application URLs:"
Write-Success "  Frontend: https://$frontendAppName.azurewebsites.net"
Write-Success "  Backend API: $backendUrl"
Write-Success "  API Docs: $backendUrl/docs"
Write-Info ""
Write-Info "Database Connection:"
Write-Info "  Server: $dbServerName.postgres.database.azure.com"
Write-Info "  Database: $dbName"
Write-Info "  Admin User: $dbAdmin"
Write-Warning "  Password: $dbPassword"
Write-Info ""
Write-Info "Container Registry:"
Write-Info "  Name: $acrName"
Write-Info "  Server: $acrServer"
Write-Info ""
Write-Info "Deployment info saved to: deployment-info.json"
Write-Info ""
Write-Warning "IMPORTANT: Save the database password securely!"
Write-Info ""
Write-Info "To view resources:"
Write-Info "  az group show --name $ResourceGroup"
Write-Info ""
Write-Info "To delete all resources:"
Write-Info "  az group delete --name $ResourceGroup --yes --no-wait"
Write-Info ""
