# Simple Azure Deployment Script for Complaint Management System

param(
    [string]$ResourceGroup = "complaintmgmt-rg",
    [string]$Location = "eastus",
    [string]$AppName = "complaintmgmt-$(Get-Random -Minimum 1000 -Maximum 9999)"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Complaint Management System Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$dbServerName = "$AppName-dbserver"
$dbName = "complaints"
$dbAdmin = "complaintadmin"
$dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_}) + "!1Aa"
$acrName = $AppName.Replace("-", "") + "acr"
$backendAppName = "$AppName-api"
$frontendAppName = "$AppName-web"

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Resource Group: $ResourceGroup"
Write-Host "  Location: $Location"
Write-Host "  App Name: $AppName"
Write-Host ""

# Step 1: Create Resource Group
Write-Host "[1/8] Creating resource group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none
Write-Host "✓ Resource group created" -ForegroundColor Green

# Step 2: Create Container Registry
Write-Host "[2/8] Creating container registry..." -ForegroundColor Yellow
az acr create --name $acrName --resource-group $ResourceGroup --sku Basic --admin-enabled true --output none
Write-Host "✓ Container registry created" -ForegroundColor Green

$acrServer = az acr show --name $acrName --resource-group $ResourceGroup --query loginServer -o tsv
$acrCreds = az acr credential show --name $acrName --resource-group $ResourceGroup | ConvertFrom-Json

# Step 3: Build Backend
Write-Host "[3/8] Building backend container..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\..\backend"
az acr build --registry $acrName --image complaint-backend:latest --file Dockerfile . --output none
Write-Host "✓ Backend container built" -ForegroundColor Green

# Step 4: Create Database
Write-Host "[4/8] Creating PostgreSQL database (this may take 5-10 minutes)..." -ForegroundColor Yellow
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
    --public-access All `
    --yes `
    --output none

az postgres flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $dbServerName `
    --database-name $dbName `
    --output none

Write-Host "✓ Database created" -ForegroundColor Green

# Step 5: Create App Service Plan
Write-Host "[5/8] Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
    --name "$AppName-plan" `
    --resource-group $ResourceGroup `
    --location $Location `
    --is-linux `
    --sku B1 `
    --output none
Write-Host "✓ App Service Plan created" -ForegroundColor Green

# Step 6: Create Backend Web App
Write-Host "[6/8] Creating backend web app..." -ForegroundColor Yellow
$backendUrl = "https://$backendAppName.azurewebsites.net"
$databaseUrl = "postgresql://${dbAdmin}:${dbPassword}@${dbServerName}.postgres.database.azure.com:5432/${dbName}?sslmode=require"

az webapp create `
    --name $backendAppName `
    --resource-group $ResourceGroup `
    --plan "$AppName-plan" `
    --deployment-container-image-name "$acrServer/complaint-backend:latest" `
    --output none

az webapp config appsettings set `
    --name $backendAppName `
    --resource-group $ResourceGroup `
    --settings `
        DATABASE_URL="$databaseUrl" `
        CORS_ORIGINS="https://$frontendAppName.azurewebsites.net" `
        WEBSITES_PORT=8000 `
    --output none

az webapp config container set `
    --name $backendAppName `
    --resource-group $ResourceGroup `
    --docker-registry-server-url "https://$acrServer" `
    --docker-registry-server-user $acrCreds.username `
    --docker-registry-server-password $acrCreds.passwords[0].value `
    --output none

Write-Host "✓ Backend configured" -ForegroundColor Green

# Step 7: Build Frontend
Write-Host "[7/8] Building frontend container..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\..\frontend"
az acr build `
    --registry $acrName `
    --image complaint-frontend:latest `
    --file Dockerfile `
    --build-arg VITE_API_URL=$backendUrl `
    . `
    --output none
Write-Host "✓ Frontend container built" -ForegroundColor Green

# Step 8: Create Frontend Web App
Write-Host "[8/8] Creating frontend web app..." -ForegroundColor Yellow
az webapp create `
    --name $frontendAppName `
    --resource-group $ResourceGroup `
    --plan "$AppName-plan" `
    --deployment-container-image-name "$acrServer/complaint-frontend:latest" `
    --output none

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

Write-Host "✓ Frontend configured" -ForegroundColor Green

# Enable HTTPS
az webapp update --name $backendAppName --resource-group $ResourceGroup --https-only true --output none
az webapp update --name $frontendAppName --resource-group $ResourceGroup --https-only true --output none

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

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Deployment Complete! 🎉" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: https://$frontendAppName.azurewebsites.net" -ForegroundColor Green
Write-Host "  Backend API: $backendUrl" -ForegroundColor Green
Write-Host "  API Docs: $backendUrl/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Database:" -ForegroundColor Cyan
Write-Host "  Server: $dbServerName.postgres.database.azure.com"
Write-Host "  Database: $dbName"
Write-Host "  Admin: $dbAdmin"
Write-Host "  Password: $dbPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: Apps may take 2-3 minutes to fully start" -ForegroundColor Yellow
Write-Host "Deployment info saved to: deployment-info.json" -ForegroundColor Cyan
Write-Host ""
