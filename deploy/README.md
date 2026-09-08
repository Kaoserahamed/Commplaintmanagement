# Deployment Guide

## Azure Deployment with CI/CD

### Prerequisites
- Azure CLI installed and logged in
- GitHub account with repository access
- Azure subscription (Azure for Students works)

### 1. Initial Setup (One-time)

Run the deployment script to create all Azure resources:

```powershell
cd deploy
.\deploy-azure.ps1
```

This creates:
- Resource Group: `complaint-system`
- Container Registry: `complaint2292acr`
- PostgreSQL Database: `complaint2292-db`
- App Service Plan: `complaint2292-plan`
- Backend App: `complaint2292-api`
- Frontend App: `complaint2292-web`

**Important**: Save the database password displayed at the end!

### 2. Configure GitHub Actions (CI/CD)

#### Create Azure Service Principal

```bash
az ad sp create-for-rbac \
  --name "complaint-system-deploy" \
  --role contributor \
  --scopes /subscriptions/{SUBSCRIPTION_ID}/resourceGroups/complaint-system \
  --sdk-auth
```

Replace `{SUBSCRIPTION_ID}` with your Azure subscription ID:
```bash
az account show --query id -o tsv
```

#### Add GitHub Secret

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `AZURE_CREDENTIALS`
5. Value: Paste the entire JSON output from the service principal command
6. Click "Add secret"

### 3. Configure Azure App Services

#### Backend Configuration

```bash
# Set environment variables
az webapp config appsettings set \
  --name complaint2292-api \
  --resource-group complaint-system \
  --settings \
    DATABASE_URL="postgresql://complainadmin:YOUR_PASSWORD@complaint2292-db.postgres.database.azure.com:5432/complaints?sslmode=require" \
    CORS_ORIGINS="https://complaint2292-web.azurewebsites.net" \
    DEBUG="False" \
    WEBSITES_PORT="8000"
```

#### Frontend Configuration

```bash
# Frontend is configured at build time with VITE_API_URL
# No additional settings needed after deployment
```

### 4. Deploy

Push to `main` branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

GitHub Actions will automatically:
1. Build backend Docker image
2. Push to Azure Container Registry
3. Restart backend webapp
4. Build frontend Docker image with API URL
5. Push to Azure Container Registry
6. Restart frontend webapp

Monitor deployment in GitHub Actions tab.

### 5. Verify Deployment

```bash
# Check backend health
curl https://complaint2292-api.azurewebsites.net/health

# Check frontend (in browser)
# Visit: https://complaint2292-web.azurewebsites.net
```

## Manual Deployment (Without CI/CD)

If you prefer manual deployment:

```bash
# Build and push backend
cd backend
az acr build \
  --registry complaint2292acr \
  --image complaint-backend:latest \
  --file Dockerfile \
  .

# Restart backend
az webapp restart \
  --name complaint2292-api \
  --resource-group complaint-system

# Build and push frontend
cd ../frontend
az acr build \
  --registry complaint2292acr \
  --image complaint-frontend:latest \
  --file Dockerfile \
  --build-arg VITE_API_URL=https://complaint2292-api.azurewebsites.net \
  .

# Restart frontend
az webapp restart \
  --name complaint2292-web \
  --resource-group complaint-system
```

## Updating Environment Variables

### Azure Portal Method
1. Go to Azure Portal
2. Navigate to App Service (complaint2292-api or complaint2292-web)
3. Settings → Configuration
4. Add/modify Application settings
5. Click "Save"
6. Restart the app

### CLI Method

```bash
# Update backend settings
az webapp config appsettings set \
  --name complaint2292-api \
  --resource-group complaint-system \
  --settings KEY=VALUE

# Update frontend settings
az webapp config appsettings set \
  --name complaint2292-web \
  --resource-group complaint-system \
  --settings KEY=VALUE
```

## Monitoring & Logs

### View Live Logs

```powershell
# Backend logs
az webapp log tail \
  --name complaint2292-api \
  --resource-group complaint-system

# Frontend logs
az webapp log tail \
  --name complaint2292-web \
  --resource-group complaint-system
```

### Check App Status

```bash
az webapp show \
  --name complaint2292-api \
  --resource-group complaint-system \
  --query "{Name:name, State:state, URL:defaultHostName}"
```

## Troubleshooting

### Backend 503 Error
```bash
# Check logs
az webapp log tail --name complaint2292-api --resource-group complaint-system

# Verify database connection
# Check DATABASE_URL in app settings

# Restart app
az webapp restart --name complaint2292-api --resource-group complaint-system
```

### Frontend 503 Error
```bash
# Check if container image exists
az acr repository show-tags \
  --name complaint2292acr \
  --repository complaint-frontend

# Check container configuration
az webapp config container show \
  --name complaint2292-web \
  --resource-group complaint-system

# Restart app
az webapp restart --name complaint2292-web --resource-group complaint-system
```

### Database Connection Issues
```bash
# Test database connectivity
az postgres flexible-server connect \
  --name complaint2292-db \
  --admin-user complainadmin \
  --database-name complaints

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --name complaint2292-db \
  --resource-group complaint-system
```

## Cleanup (Delete All Resources)

```bash
# Delete entire resource group (CAUTION!)
az group delete \
  --name complaint-system \
  --yes \
  --no-wait
```

## Cost Optimization

Current configuration uses:
- **App Service Plan**: B1 (Basic tier) - ~$13/month
- **PostgreSQL**: Burstable B1ms - ~$12/month
- **Container Registry**: Basic - ~$5/month

**Total**: ~$30/month

To reduce costs:
1. Use Free tier App Service (limited hours)
2. Stop services when not in use
3. Use shared database for multiple apps

## Security Checklist

- [x] No hardcoded credentials
- [x] Environment variables for secrets
- [x] PostgreSQL SSL enforced
- [x] CORS configured
- [x] GitHub secrets for CI/CD
- [x] Container registry authentication
- [x] File upload size limits
- [x] Input validation

## Support

For issues or questions:
- Check logs: `az webapp log tail`
- Review GitHub Actions workflow runs
- Verify environment variables
- Check Azure resource status in portal

---

**Quick Links:**
- Frontend: https://complaint2292-web.azurewebsites.net
- Backend API: https://complaint2292-api.azurewebsites.net
- API Docs: https://complaint2292-api.azurewebsites.net/docs
