# Simple Azure Deployment for Complaint Management System

$RG = "complaint-system"
$LOC = "southeastasia"
$APP = "complaint" + (Get-Random -Min 1000 -Max 9999)
$ACR = $APP.Replace("-","") + "acr"
$DB = "$APP-db"
$PLAN = "$APP-plan"
$BACKEND = "$APP-api"
$FRONTEND = "$APP-web"
$DBADMIN = "complainadmin"
$DBPASS = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_}) + "!1Aa"

Write-Host "Deploying to: $LOC" -ForegroundColor Cyan
Write-Host "Resource Group: $RG" -ForegroundColor Cyan
Write-Host "App Name: $APP" -ForegroundColor Cyan
Write-Host ""

# Create resource group
Write-Host "[1/9] Creating resource group..." -ForegroundColor Yellow
az group create --name $RG --location $LOC
Write-Host "Done" -ForegroundColor Green

# Create ACR
Write-Host "[2/9] Creating container registry..." -ForegroundColor Yellow
az acr create --name $ACR --resource-group $RG --sku Basic --admin-enabled true --location $LOC
$ACRSERVER = az acr show --name $ACR --resource-group $RG --query loginServer -o tsv
$ACRUSER = az acr credential show --name $ACR --query username -o tsv --resource-group $RG
$ACRPASS = az acr credential show --name $ACR --query "passwords[0].value" -o tsv --resource-group $RG
Write-Host "Done: $ACRSERVER" -ForegroundColor Green

# Build backend
Write-Host "[3/9] Building backend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend"
az acr build --registry $ACR --image complaint-backend:latest --file Dockerfile .
Write-Host "Done" -ForegroundColor Green

# Create database
Write-Host "[4/9] Creating database (takes 5-10 min)..." -ForegroundColor Yellow
az postgres flexible-server create --name $DB --resource-group $RG --location $LOC --admin-user $DBADMIN --admin-password $DBPASS --sku-name Standard_B1ms --tier Burstable --storage-size 32 --version 15 --public-access All --yes
az postgres flexible-server db create --resource-group $RG --server-name $DB --database-name complaints
Write-Host "Done" -ForegroundColor Green

# Create app plan
Write-Host "[5/9] Creating app service plan..." -ForegroundColor Yellow
az appservice plan create --name $PLAN --resource-group $RG --location $LOC --is-linux --sku B1
Write-Host "Done" -ForegroundColor Green

# Create backend app
Write-Host "[6/9] Creating backend app..." -ForegroundColor Yellow
$BACKEND_URL = "https://$BACKEND.azurewebsites.net"
$DB_URL = "postgresql://$DBADMIN`:$DBPASS@$DB.postgres.database.azure.com:5432/complaints?sslmode=require"
az webapp create --name $BACKEND --resource-group $RG --plan $PLAN --deployment-container-image-name "$ACRSERVER/complaint-backend:latest"
az webapp config appsettings set --name $BACKEND --resource-group $RG --settings DATABASE_URL="$DB_URL" CORS_ORIGINS="https://$FRONTEND.azurewebsites.net" WEBSITES_PORT=8000
az webapp config container set --name $BACKEND --resource-group $RG --docker-registry-server-url "https://$ACRSERVER" --docker-registry-server-user $ACRUSER --docker-registry-server-password $ACRPASS
Write-Host "Done: $BACKEND_URL" -ForegroundColor Green

# Build frontend
Write-Host "[7/9] Building frontend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\frontend"
az acr build --registry $ACR --image complaint-frontend:latest --file Dockerfile --build-arg VITE_API_URL=$BACKEND_URL .
Write-Host "Done" -ForegroundColor Green

# Create frontend app
Write-Host "[8/9] Creating frontend app..." -ForegroundColor Yellow
az webapp create --name $FRONTEND --resource-group $RG --plan $PLAN --deployment-container-image-name "$ACRSERVER/complaint-frontend:latest"
az webapp config container set --name $FRONTEND --resource-group $RG --docker-registry-server-url "https://$ACRSERVER" --docker-registry-server-user $ACRUSER --docker-registry-server-password $ACRPASS
az webapp config appsettings set --name $FRONTEND --resource-group $RG --settings WEBSITES_PORT=80
Write-Host "Done" -ForegroundColor Green

# Enable HTTPS
Write-Host "[9/9] Enabling HTTPS..." -ForegroundColor Yellow
az webapp update --name $BACKEND --resource-group $RG --https-only true
az webapp update --name $FRONTEND --resource-group $RG --https-only true
Write-Host "Done" -ForegroundColor Green

# Save info
Set-Location "$PSScriptRoot"
@{
    resourceGroup = $RG
    location = $LOC
    frontendUrl = "https://$FRONTEND.azurewebsites.net"
    backendUrl = $BACKEND_URL
    dbServer = "$DB.postgres.database.azure.com"
    dbAdmin = $DBADMIN
    dbPassword = $DBPASS
    deploymentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json | Out-File "deployment-info.json"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: https://$FRONTEND.azurewebsites.net" -ForegroundColor Cyan
Write-Host "Backend: $BACKEND_URL" -ForegroundColor Cyan
Write-Host "API Docs: $BACKEND_URL/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database Password: $DBPASS" -ForegroundColor Yellow
Write-Host ""
Write-Host "Wait 2-3 minutes for apps to start" -ForegroundColor Yellow
Write-Host ""
