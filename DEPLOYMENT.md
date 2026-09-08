# TaskCloud - Azure Deployment Guide

Complete step-by-step guide for deploying TaskCloud to Microsoft Azure.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Deployment Steps](#detailed-deployment-steps)
4. [Local Development Setup](#local-development-setup)
5. [Azure Architecture](#azure-architecture)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Cost Optimization](#cost-optimization)
10. [CI/CD Setup](#cicd-setup)

---

## Prerequisites

### Required Software

- **Azure CLI** (version 2.50.0+)
  - Download: https://aka.ms/installazurecliwindows
  - Verify: `az --version`

- **Azure Subscription**
  - Free tier available: https://azure.microsoft.com/free/
  - Required permissions: Contributor or Owner role

- **PowerShell** (Windows)
  - PowerShell 5.1+ or PowerShell 7+
  - Verify: `$PSVersionTable.PSVersion`

### Optional (for local development)

- **Docker Desktop**
  - Download: https://www.docker.com/products/docker-desktop
  - Required for local testing with docker-compose

- **Node.js 18+**
  - Download: https://nodejs.org/
  - For frontend development

- **Python 3.11+**
  - Download: https://www.python.org/downloads/
  - For backend development

---

## Quick Start

### 1. Login to Azure

```powershell
az login
```

This will open a browser for authentication. Select your Azure account.

### 2. Verify Subscription

```powershell
az account show
```

If you have multiple subscriptions, set the desired one:

```powershell
az account set --subscription "Your Subscription Name"
```

### 3. Deploy Application

```powershell
cd d:\TaskCloud
.\deploy\deploy.ps1
```

**Default settings:**
- Resource Group: `taskcloud-rg`
- Location: `eastus`
- App Name: `taskcloud-{random-number}`

**Custom deployment:**

```powershell
.\deploy\deploy.ps1 -ResourceGroup "my-rg" -Location "westus2" -AppName "myapp"
```

### 4. Wait for Deployment

The deployment takes approximately **10-15 minutes** and will:
- ✅ Create resource group
- ✅ Set up container registry
- ✅ Build and push Docker images
- ✅ Create PostgreSQL database
- ✅ Deploy backend API
- ✅ Deploy frontend app
- ✅ Configure HTTPS

### 5. Access Your Application

After deployment completes, you'll see:

```
============================================
  Deployment Complete! 🎉
============================================

Application URLs:
  Frontend: https://taskcloud-1234-frontend.azurewebsites.net
  Backend API: https://taskcloud-1234-backend.azurewebsites.net
  API Docs: https://taskcloud-1234-backend.azurewebsites.net/docs
```

**Wait 1-2 minutes** for apps to fully start, then open the Frontend URL.

---

## Detailed Deployment Steps

### Step 1: Prepare Your Environment

1. **Clone or navigate to the project:**
   ```powershell
   cd d:\TaskCloud
   ```

2. **Review the project structure:**
   ```powershell
   Get-ChildItem -Recurse -Depth 1
   ```

3. **Check deployment scripts:**
   ```powershell
   Get-Content .\deploy\deploy.ps1 | Select-Object -First 20
   ```

### Step 2: Azure CLI Setup

1. **Install Azure CLI** (if not already installed):
   - Download from https://aka.ms/installazurecliwindows
   - Run the installer
   - Restart your terminal

2. **Login to Azure:**
   ```powershell
   az login
   ```

3. **List available subscriptions:**
   ```powershell
   az account list --output table
   ```

4. **Set active subscription:**
   ```powershell
   az account set --subscription "YOUR_SUBSCRIPTION_ID"
   ```

### Step 3: Configure Deployment

You can customize the deployment by editing parameters:

```powershell
# Deploy with custom settings
.\deploy\deploy.ps1 `
    -ResourceGroup "production-taskcloud" `
    -Location "westus2" `
    -AppName "taskcloud-prod"
```

**Available Azure Regions:**
- `eastus` - US East (Virginia)
- `westus2` - US West (Washington)
- `centralus` - US Central (Iowa)
- `northeurope` - North Europe (Ireland)
- `westeurope` - West Europe (Netherlands)
- `southeastasia` - Southeast Asia (Singapore)

### Step 4: Run Deployment

```powershell
.\deploy\deploy.ps1
```

**What happens during deployment:**

1. **Resource Group Creation** (30 seconds)
   - Creates a container for all resources
   - Tags: environment, application

2. **Container Registry** (2 minutes)
   - Creates Azure Container Registry (ACR)
   - Enables admin access for pulling images

3. **Backend Container Build** (3-4 minutes)
   - Builds FastAPI Docker image
   - Pushes to ACR
   - Tags as `taskcloud-backend:latest`

4. **PostgreSQL Database** (3-5 minutes)
   - Creates flexible server (B1ms tier)
   - Configures SSL requirement
   - Creates `taskcloud` database
   - Sets up firewall rules

5. **App Service Plan** (30 seconds)
   - Creates Linux-based plan (B1 tier)
   - Configured for Docker containers

6. **Backend Deployment** (2 minutes)
   - Creates Web App for backend
   - Configures environment variables
   - Sets up container registry credentials
   - Enables HTTPS

7. **Frontend Container Build** (3-4 minutes)
   - Builds React app with Vite
   - Creates production bundle
   - Builds nginx-based Docker image
   - Pushes to ACR

8. **Frontend Deployment** (2 minutes)
   - Creates Web App for frontend
   - Configures container settings
   - Enables HTTPS

9. **Final Configuration** (1 minute)
   - Updates CORS settings
   - Enables health checks
   - Waits for services to start

### Step 5: Verify Deployment

```powershell
.\deploy\status.ps1
```

**Expected output:**

```
============================================
  TaskCloud Status Check
============================================

[1/5] Checking Resource Group...
✓ Resource Group: taskcloud-rg (eastus)

[2/5] Checking PostgreSQL Database...
✓ Database Server: taskcloud-1234-dbserver - State: Ready

[3/5] Checking Container Registry...
✓ Container Registry: taskcloud1234acr - Status: Succeeded

[4/5] Checking Backend App Service...
✓ Backend App: taskcloud-1234-backend - State: Running
  Health Check: healthy - DB: connected

[5/5] Checking Frontend App Service...
✓ Frontend App: taskcloud-1234-frontend - State: Running
  Availability: HTTP 200
```

### Step 6: Test the Application

1. **Open Frontend URL** in your browser

2. **Create a test task:**
   - Click "New Task"
   - Title: "Test Task"
   - Description: "Testing deployment"
   - Status: "To Do"
   - Click "Create Task"

3. **Test CRUD operations:**
   - ✅ Create - Add new task
   - ✅ Read - View task list
   - ✅ Update - Edit task, change status
   - ✅ Delete - Remove task

4. **Check API Documentation:**
   - Navigate to `{backend-url}/docs`
   - Test endpoints interactively

---

## Local Development Setup

Before deploying to Azure, test locally with Docker Compose.

### 1. Set Up Environment Files

**Backend (.env):**

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://taskcloud:taskcloud123@db:5432/taskcloud
CORS_ORIGINS=http://localhost:5173
```

**Frontend (.env):**

```powershell
cd frontend
Copy-Item .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

### 2. Start with Docker Compose

```powershell
cd d:\TaskCloud
docker-compose up --build
```

**Services started:**
- PostgreSQL: `localhost:5432`
- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:5173`

### 3. Test Locally

- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

### 4. Stop Services

```powershell
docker-compose down
```

**Remove volumes (delete data):**
```powershell
docker-compose down -v
```

---

## Azure Architecture

### Resource Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Resource Group                          │
│                    (taskcloud-rg)                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Azure Container Registry (ACR)                     │  │
│  │  • Stores Docker images                             │  │
│  │  • taskcloud-backend:latest                         │  │
│  │  • taskcloud-frontend:latest                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Flexible Server                         │  │
│  │  • B1ms tier (1 vCore, 2GB RAM)                     │  │
│  │  • 32GB storage                                      │  │
│  │  • SSL enforced                                      │  │
│  │  • Database: taskcloud                               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  App Service Plan (Linux)                           │  │
│  │  • B1 tier (1 vCPU, 1.75GB RAM)                     │  │
│  │  • Supports 2 web apps                               │  │
│  └─────────────────────────────────────────────────────┘  │
│                     │                                       │
│         ┌───────────┴───────────┐                          │
│         │                       │                          │
│  ┌──────▼───────┐      ┌───────▼──────┐                  │
│  │ Backend App  │      │ Frontend App │                  │
│  │ (FastAPI)    │      │ (React/Nginx)│                  │
│  │ Port: 8000   │      │ Port: 80     │                  │
│  └──────────────┘      └──────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Browser
     │
     │ HTTPS
     ↓
Frontend (React + Nginx)
     │
     │ REST API (HTTPS)
     ↓
Backend (FastAPI)
     │
     │ PostgreSQL Protocol (SSL)
     ↓
PostgreSQL Database
```

### Network Configuration

- **Frontend → Backend:** CORS configured
- **Backend → Database:** SSL required
- **All external access:** HTTPS enforced
- **Firewall:** Azure services allowed

---

## Post-Deployment Configuration

### 1. Save Deployment Information

The deployment creates `deployment-info.json`:

```json
{
  "resourceGroup": "taskcloud-rg",
  "frontendUrl": "https://...",
  "backendUrl": "https://...",
  "dbPassword": "..."
}
```

**⚠️ Important:** Save this file securely! It contains database credentials.

### 2. Configure Custom Domain (Optional)

**Add custom domain to Frontend:**

```powershell
# Add domain
az webapp config hostname add `
    --webapp-name taskcloud-1234-frontend `
    --resource-group taskcloud-rg `
    --hostname www.yourdomain.com

# Create SSL binding
az webapp config ssl bind `
    --certificate-thumbprint {thumbprint} `
    --ssl-type SNI `
    --name taskcloud-1234-frontend `
    --resource-group taskcloud-rg
```

**Update Backend CORS:**

```powershell
az webapp config appsettings set `
    --name taskcloud-1234-backend `
    --resource-group taskcloud-rg `
    --settings CORS_ORIGINS="https://www.yourdomain.com"
```

### 3. Enable Application Insights (Monitoring)

```powershell
# Create Application Insights
az monitor app-insights component create `
    --app taskcloud-insights `
    --location eastus `
    --resource-group taskcloud-rg

# Get instrumentation key
$key = az monitor app-insights component show `
    --app taskcloud-insights `
    --resource-group taskcloud-rg `
    --query instrumentationKey -o tsv

# Configure backend
az webapp config appsettings set `
    --name taskcloud-1234-backend `
    --resource-group taskcloud-rg `
    --settings APPINSIGHTS_INSTRUMENTATIONKEY=$key
```

### 4. Configure Backup (Database)

```powershell
# Enable automated backup
az postgres flexible-server backup create `
    --resource-group taskcloud-rg `
    --name taskcloud-1234-dbserver `
    --backup-name manual-backup-$(Get-Date -Format "yyyyMMdd")
```

### 5. Set Up Alerts

```powershell
# Create action group for notifications
az monitor action-group create `
    --name taskcloud-alerts `
    --resource-group taskcloud-rg `
    --short-name tc-alert `
    --email-receiver admin alerts@yourdomain.com

# Create alert for high CPU
az monitor metrics alert create `
    --name high-cpu-alert `
    --resource-group taskcloud-rg `
    --scopes /subscriptions/{sub-id}/resourceGroups/taskcloud-rg/providers/Microsoft.Web/sites/taskcloud-1234-backend `
    --condition "avg Percentage CPU > 80" `
    --action taskcloud-alerts
```

---

## Monitoring and Maintenance

### Check Application Health

```powershell
.\deploy\status.ps1
```

### View Logs

**Stream live logs:**
```powershell
.\deploy\logs.ps1 -Service backend -Follow
```

**Download logs:**
```powershell
.\deploy\logs.ps1 -Service both
```

### Monitor in Azure Portal

1. Go to https://portal.azure.com
2. Navigate to your resource group
3. Select the backend or frontend app
4. View:
   - Metrics (CPU, Memory, Requests)
   - Log Stream (real-time logs)
   - Deployment Center (container info)

### Update Application Code

After making code changes:

```powershell
.\deploy\update.ps1
```

This rebuilds containers and redeploys without recreating infrastructure.

### Scale Resources

**Scale App Service Plan:**

```powershell
# Scale up to S1 (more resources)
az appservice plan update `
    --name taskcloud-1234-plan `
    --resource-group taskcloud-rg `
    --sku S1

# Scale out (multiple instances)
az appservice plan update `
    --name taskcloud-1234-plan `
    --resource-group taskcloud-rg `
    --number-of-workers 2
```

**Scale Database:**

```powershell
az postgres flexible-server update `
    --resource-group taskcloud-rg `
    --name taskcloud-1234-dbserver `
    --sku-name Standard_B2s
```

### Database Management

**Connect to database:**

```powershell
$config = Get-Content deploy\deployment-info.json | ConvertFrom-Json
psql "postgresql://$($config.dbAdmin):$($config.dbPassword)@$($config.dbServer).postgres.database.azure.com:5432/$($config.dbName)?sslmode=require"
```

**Backup database:**

```powershell
az postgres flexible-server backup create `
    --resource-group taskcloud-rg `
    --name taskcloud-1234-dbserver `
    --backup-name backup-$(Get-Date -Format "yyyyMMdd-HHmmss")
```

---

## Troubleshooting

### Issue: Deployment Script Fails

**Symptoms:**
- Script exits with error
- Resources partially created

**Solutions:**

1. **Check Azure CLI login:**
   ```powershell
   az account show
   ```

2. **Verify subscription has available quota:**
   ```powershell
   az vm list-usage --location eastus --output table
   ```

3. **Delete partial deployment and retry:**
   ```powershell
   .\deploy\cleanup.ps1
   .\deploy\deploy.ps1
   ```

### Issue: Application Not Responding

**Symptoms:**
- Frontend shows "Failed to load tasks"
- Backend returns 503 errors

**Solutions:**

1. **Check app status:**
   ```powershell
   .\deploy\status.ps1
   ```

2. **View logs for errors:**
   ```powershell
   .\deploy\logs.ps1 -Service backend -Follow
   ```

3. **Restart applications:**
   ```powershell
   az webapp restart --name taskcloud-1234-backend --resource-group taskcloud-rg
   az webapp restart --name taskcloud-1234-frontend --resource-group taskcloud-rg
   ```

4. **Check environment variables:**
   ```powershell
   az webapp config appsettings list `
       --name taskcloud-1234-backend `
       --resource-group taskcloud-rg
   ```

### Issue: Database Connection Errors

**Symptoms:**
- Health check shows "database: error"
- Backend logs show connection refused

**Solutions:**

1. **Verify database is running:**
   ```powershell
   az postgres flexible-server show `
       --resource-group taskcloud-rg `
       --name taskcloud-1234-dbserver
   ```

2. **Check firewall rules:**
   ```powershell
   az postgres flexible-server firewall-rule list `
       --resource-group taskcloud-rg `
       --name taskcloud-1234-dbserver
   ```

3. **Test connection from backend:**
   ```powershell
   az webapp ssh --name taskcloud-1234-backend --resource-group taskcloud-rg
   # Then inside container:
   # curl localhost:8000/health
   ```

### Issue: Container Build Fails

**Symptoms:**
- ACR build fails with error
- Image not pushed to registry

**Solutions:**

1. **Check Docker files for syntax errors:**
   ```powershell
   docker build -t test ./backend
   ```

2. **Verify ACR is accessible:**
   ```powershell
   az acr check-health --name taskcloud1234acr
   ```

3. **Retry build manually:**
   ```powershell
   az acr build `
       --registry taskcloud1234acr `
       --image taskcloud-backend:latest `
       --file backend/Dockerfile `
       backend/
   ```

### Issue: CORS Errors

**Symptoms:**
- Browser console shows CORS error
- Frontend can't reach backend

**Solutions:**

1. **Check CORS settings:**
   ```powershell
   az webapp config appsettings show `
       --name taskcloud-1234-backend `
       --resource-group taskcloud-rg `
       --query "[?name=='CORS_ORIGINS'].value" -o tsv
   ```

2. **Update CORS to include frontend:**
   ```powershell
   az webapp config appsettings set `
       --name taskcloud-1234-backend `
       --resource-group taskcloud-rg `
       --settings CORS_ORIGINS="https://taskcloud-1234-frontend.azurewebsites.net"
   ```

3. **Restart backend:**
   ```powershell
   az webapp restart --name taskcloud-1234-backend --resource-group taskcloud-rg
   ```

### Getting Help

1. **View detailed logs:**
   ```powershell
   az webapp log tail --name taskcloud-1234-backend --resource-group taskcloud-rg
   ```

2. **Check Azure service health:**
   - Visit: https://status.azure.com/

3. **Review deployment info:**
   ```powershell
   Get-Content deploy\deployment-info.json | ConvertFrom-Json | Format-List
   ```

---

## Cost Optimization

### Current Cost Breakdown

**Estimated monthly costs (pay-as-you-go):**

| Resource | Tier | Monthly Cost |
|----------|------|--------------|
| App Service Plan (B1) | 1 vCPU, 1.75GB RAM | ~$13 USD |
| PostgreSQL (B1ms) | 1 vCore, 2GB RAM | ~$26 USD |
| Container Registry (Basic) | 10GB storage | ~$5 USD |
| **Total** | | **~$44 USD** |

*Prices may vary by region and are subject to change.*

### Cost Reduction Strategies

#### 1. Use Free Tier (Development/Demo)

```powershell
# Deploy with Free tier App Service (limited resources)
az appservice plan create `
    --name taskcloud-free-plan `
    --resource-group taskcloud-rg `
    --sku F1 `
    --is-linux
```

**Limitations:**
- 60 CPU minutes/day
- 1GB RAM
- No custom domains
- No always-on

#### 2. Stop When Not In Use

```powershell
# Stop both apps
az webapp stop --name taskcloud-1234-backend --resource-group taskcloud-rg
az webapp stop --name taskcloud-1234-frontend --resource-group taskcloud-rg

# Start when needed
az webapp start --name taskcloud-1234-backend --resource-group taskcloud-rg
az webapp start --name taskcloud-1234-frontend --resource-group taskcloud-rg
```

**Savings:** Database charges continue, but App Service charges stop.

#### 3. Delete After Demo

```powershell
.\deploy\cleanup.ps1
```

This completely removes all resources and stops all charges.

#### 4. Use Azure Student/Free Credits

- **Azure for Students:** $100 credit (no credit card required)
  - https://azure.microsoft.com/free/students/

- **Azure Free Trial:** $200 credit for 30 days
  - https://azure.microsoft.com/free/

#### 5. Optimize Resource Tiers

**Downgrade database during low usage:**

```powershell
az postgres flexible-server update `
    --resource-group taskcloud-rg `
    --name taskcloud-1234-dbserver `
    --tier Burstable `
    --sku-name Standard_B1ms
```

### Cost Monitoring

**Set up budget alerts:**

```powershell
az consumption budget create `
    --budget-name taskcloud-budget `
    --amount 50 `
    --time-grain Monthly `
    --start-date 2024-01-01 `
    --end-date 2025-01-01 `
    --resource-group taskcloud-rg
```

**View current costs:**

```powershell
az consumption usage list `
    --start-date 2024-01-01 `
    --end-date 2024-01-31 `
    --query "[?contains(instanceName, 'taskcloud')]"
```

---

## CI/CD Setup

### GitHub Actions Deployment

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  AZURE_RESOURCE_GROUP: taskcloud-rg
  BACKEND_APP_NAME: taskcloud-1234-backend
  FRONTEND_APP_NAME: taskcloud-1234-frontend
  ACR_NAME: taskcloud1234acr

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Build and push backend
        run: |
          az acr build \
            --registry ${{ env.ACR_NAME }} \
            --image taskcloud-backend:latest \
            --file backend/Dockerfile \
            backend/
      
      - name: Restart backend app
        run: |
          az webapp restart \
            --name ${{ env.BACKEND_APP_NAME }} \
            --resource-group ${{ env.AZURE_RESOURCE_GROUP }}

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Build and push frontend
        run: |
          az acr build \
            --registry ${{ env.ACR_NAME }} \
            --image taskcloud-frontend:latest \
            --file frontend/Dockerfile \
            --build-arg VITE_API_URL=https://${{ env.BACKEND_APP_NAME }}.azurewebsites.net \
            frontend/
      
      - name: Restart frontend app
        run: |
          az webapp restart \
            --name ${{ env.FRONTEND_APP_NAME }} \
            --resource-group ${{ env.AZURE_RESOURCE_GROUP }}
```

**Setup steps:**

1. Create service principal:
   ```powershell
   az ad sp create-for-rbac `
       --name "taskcloud-github" `
       --role contributor `
       --scopes /subscriptions/{subscription-id}/resourceGroups/taskcloud-rg `
       --sdk-auth
   ```

2. Add output as GitHub secret `AZURE_CREDENTIALS`

3. Push to main branch to trigger deployment

---

## Best Practices

### Security

1. **Never commit secrets** to git
2. **Use Azure Key Vault** for production secrets
3. **Enable Azure AD authentication** for admin access
4. **Implement rate limiting** in FastAPI
5. **Regular security updates** for dependencies

### Performance

1. **Enable CDN** for frontend static assets
2. **Configure connection pooling** in backend
3. **Add database indexes** for frequent queries
4. **Implement caching** (Redis) for read-heavy operations
5. **Use Application Insights** for performance monitoring

### Reliability

1. **Configure health checks** (already done)
2. **Enable auto-scaling** for App Service
3. **Set up automated backups** for database
4. **Implement retry logic** in API calls
5. **Use Azure Front Door** for multi-region deployment

### Maintainability

1. **Document all configuration changes**
2. **Use infrastructure as code** (Bicep/Terraform)
3. **Tag resources** for cost tracking
4. **Implement logging** at all layers
5. **Regular dependency updates**

---

## Next Steps

After successful deployment:

1. ✅ **Test all functionality** - Create, read, update, delete tasks
2. ✅ **Review security settings** - Check CORS, SSL, firewall rules
3. ✅ **Set up monitoring** - Enable Application Insights
4. ✅ **Configure backups** - Database and configuration
5. ✅ **Document for CV** - Take screenshots, note architecture
6. ✅ **Set up CI/CD** - Automate future deployments
7. ✅ **Implement custom domain** - Professional appearance
8. ✅ **Add authentication** - Azure AD or OAuth

---

## Appendix

### Useful Azure CLI Commands

```powershell
# List all resources
az resource list --resource-group taskcloud-rg --output table

# Get app URLs
az webapp show --name taskcloud-1234-backend --resource-group taskcloud-rg --query defaultHostName -o tsv

# View app logs
az webapp log tail --name taskcloud-1234-backend --resource-group taskcloud-rg

# SSH into container
az webapp ssh --name taskcloud-1234-backend --resource-group taskcloud-rg

# Download app settings
az webapp config appsettings list --name taskcloud-1234-backend --resource-group taskcloud-rg -o json > settings.json

# View database connections
az postgres flexible-server show-connection-string --server-name taskcloud-1234-dbserver

# Check costs
az consumption usage list --start-date 2024-01-01 --end-date 2024-01-31 --output table
```

### Environment Variables Reference

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGINS` - Allowed frontend origins (comma-separated)
- `WEBSITES_PORT` - Port for App Service (8000)

**Frontend:**
- `VITE_API_URL` - Backend API URL (build-time)
- `WEBSITES_PORT` - Port for App Service (80)

### Port Configuration

- Backend API: `8000` (internal), `443` (external HTTPS)
- Frontend: `80` (internal), `443` (external HTTPS)
- Database: `5432` (internal only)

---

## Support and Resources

- **Azure Documentation:** https://docs.microsoft.com/azure/
- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **React Documentation:** https://react.dev/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/

For issues with this project:
1. Check logs with `.\deploy\logs.ps1`
2. Review status with `.\deploy\status.ps1`
3. Consult troubleshooting section above

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Author:** TaskCloud Development Team
