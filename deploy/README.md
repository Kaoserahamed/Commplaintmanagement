# Azure Deployment Scripts

This directory contains PowerShell scripts for deploying and managing TaskCloud on Microsoft Azure.

## Prerequisites

1. **Azure CLI** - Install from [aka.ms/installazurecliwindows](https://aka.ms/installazurecliwindows)
2. **Azure Subscription** - Active subscription with permission to create resources
3. **Docker** - For local testing (optional)
4. **PowerShell** - Windows PowerShell 5.1 or PowerShell 7+

## Scripts Overview

### `deploy.ps1` - Initial Deployment

Deploys the complete TaskCloud application to Azure including:
- Resource Group
- Azure Container Registry
- PostgreSQL Flexible Server
- App Service Plan (Linux B1)
- Backend Web App (FastAPI)
- Frontend Web App (React)

**Usage:**

```powershell
# Basic deployment with default settings
.\deploy\deploy.ps1

# Custom deployment
.\deploy\deploy.ps1 -ResourceGroup "my-taskcloud-rg" -Location "westus" -AppName "my-taskcloud"
```

**Parameters:**
- `ResourceGroup` - Azure resource group name (default: "taskcloud-rg")
- `Location` - Azure region (default: "eastus")
- `AppName` - Base name for all resources (default: "taskcloud-{random}")

**Output:**
- Creates `deployment-info.json` with all deployment details
- Displays application URLs and credentials

**Duration:** ~10-15 minutes

### `update.ps1` - Update Deployment

Rebuilds and redeploys containers without recreating infrastructure.

**Usage:**

```powershell
# Update both frontend and backend
.\deploy\update.ps1

# Use custom config file
.\deploy\update.ps1 -ConfigFile "my-deployment-info.json"
```

**Duration:** ~5-7 minutes

### `status.ps1` - Check Status

Checks the health and status of all deployed resources.

**Usage:**

```powershell
.\deploy\status.ps1
```

**Checks:**
- Resource Group existence
- Database server state
- Container Registry status
- Backend and Frontend availability
- Health endpoint responses

### `logs.ps1` - View Logs

Downloads or streams application logs.

**Usage:**

```powershell
# Download logs for both services
.\deploy\logs.ps1

# Stream backend logs (live)
.\deploy\logs.ps1 -Service backend -Follow

# Download frontend logs only
.\deploy\logs.ps1 -Service frontend
```

**Parameters:**
- `Service` - Which service logs to view: "backend", "frontend", or "both" (default)
- `Follow` - Stream logs in real-time (like tail -f)

### `cleanup.ps1` - Delete Resources

Deletes all Azure resources to avoid ongoing charges.

**Usage:**

```powershell
# Interactive cleanup (requires confirmation)
.\deploy\cleanup.ps1

# Force cleanup without confirmation
.\deploy\cleanup.ps1 -Force
```

**Warning:** This permanently deletes all resources and data!

## Deployment Workflow

### First-Time Deployment

1. **Login to Azure:**
   ```powershell
   az login
   ```

2. **Run deployment:**
   ```powershell
   .\deploy\deploy.ps1
   ```

3. **Save the output:**
   - Frontend URL
   - Backend URL
   - Database password (from `deployment-info.json`)

4. **Verify deployment:**
   ```powershell
   .\deploy\status.ps1
   ```

### Making Updates

1. **Make code changes** to backend or frontend

2. **Redeploy:**
   ```powershell
   .\deploy\update.ps1
   ```

3. **Wait 1-2 minutes** for changes to go live

### Troubleshooting

1. **Check status:**
   ```powershell
   .\deploy\status.ps1
   ```

2. **View logs:**
   ```powershell
   .\deploy\logs.ps1 -Service backend -Follow
   ```

3. **Check in Azure Portal:**
   - Go to https://portal.azure.com
   - Navigate to your resource group
   - Check App Service logs and metrics

### Cleanup After Demo

```powershell
.\deploy\cleanup.ps1
```

## Cost Management

**Estimated Monthly Costs:**
- App Service Plan (B1): ~$13/month
- PostgreSQL (B1ms): ~$26/month  
- Container Registry (Basic): ~$5/month
- **Total: ~$44/month**

**To minimize costs:**
1. Use the Free Tier PostgreSQL if available in your region
2. Stop App Services when not in use:
   ```powershell
   az webapp stop --name {app-name} --resource-group {rg}
   ```
3. Delete resources immediately after demo:
   ```powershell
   .\deploy\cleanup.ps1
   ```

## Configuration File

The `deployment-info.json` file contains:

```json
{
  "resourceGroup": "taskcloud-rg",
  "location": "eastus",
  "appName": "taskcloud-1234",
  "frontendUrl": "https://taskcloud-1234-frontend.azurewebsites.net",
  "backendUrl": "https://taskcloud-1234-backend.azurewebsites.net",
  "dbServer": "taskcloud-1234-dbserver",
  "dbName": "taskcloud",
  "dbAdmin": "taskcloudadmin",
  "dbPassword": "GeneratedPassword123!",
  "acrName": "taskcloud1234acr",
  "deploymentDate": "2024-01-15 10:30:00"
}
```

**Important:** Keep this file secure! It contains database credentials.

## Azure Resources Created

1. **Resource Group** - Container for all resources
2. **Container Registry** - Stores Docker images
3. **PostgreSQL Flexible Server** - Database with SSL enabled
4. **App Service Plan** - Linux B1 tier for hosting
5. **Backend Web App** - FastAPI container
6. **Frontend Web App** - React/Nginx container

## Security Features

- HTTPS enforced on all endpoints
- PostgreSQL with SSL required
- Container images in private registry
- Firewall rules configured
- Admin credentials auto-generated

## Common Issues

### Issue: "Resource provider not registered"

**Solution:**
```powershell
az provider register --namespace Microsoft.DBforPostgreSQL
az provider register --namespace Microsoft.ContainerRegistry
```

### Issue: "Name already exists"

**Solution:** Use a different AppName:
```powershell
.\deploy\deploy.ps1 -AppName "taskcloud-$(Get-Random)"
```

### Issue: "Quota exceeded"

**Solution:** Choose a different region or check your subscription limits:
```powershell
az vm list-usage --location eastus --output table
```

### Issue: Apps not responding

**Solutions:**
1. Check if apps are running: `.\deploy\status.ps1`
2. View logs: `.\deploy\logs.ps1 -Follow`
3. Restart apps:
   ```powershell
   az webapp restart --name {app-name} --resource-group {rg}
   ```

## Additional Commands

### Connect to Database

```powershell
# Install PostgreSQL client if needed
# Then connect using info from deployment-info.json

$config = Get-Content deployment-info.json | ConvertFrom-Json
psql "postgresql://$($config.dbAdmin):$($config.dbPassword)@$($config.dbServer).postgres.database.azure.com:5432/$($config.dbName)?sslmode=require"
```

### Scale App Service

```powershell
# Scale to S1 tier (more resources)
az appservice plan update --name taskcloud-1234-plan --resource-group taskcloud-rg --sku S1

# Scale to Free tier (limited)
az appservice plan update --name taskcloud-1234-plan --resource-group taskcloud-rg --sku F1
```

### Enable Diagnostic Logs

```powershell
az webapp log config --name {app-name} --resource-group {rg} --docker-container-logging filesystem
```

## Support

For issues:
1. Check Azure Portal for detailed error messages
2. Review logs with `logs.ps1`
3. Verify configuration with `status.ps1`
4. Check Azure service health: https://status.azure.com/

## Next Steps

After successful deployment:
1. Test all CRUD operations
2. Configure custom domain (optional)
3. Set up Application Insights for monitoring
4. Configure automated backups
5. Implement CI/CD pipeline with GitHub Actions
