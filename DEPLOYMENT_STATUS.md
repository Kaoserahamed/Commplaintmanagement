# 🚀 Deployment Status

**Bangladesh Civic Complaint Management System**

---

## ✅ Current Deployment

**Status:** LIVE AND RUNNING

### 🌐 Application URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://complaint2292-web.azurewebsites.net | ✅ Live |
| **Backend API** | https://complaint2292-api.azurewebsites.net | ✅ Live |
| **API Documentation** | https://complaint2292-api.azurewebsites.net/docs | ✅ Live |
| **Health Check** | https://complaint2292-api.azurewebsites.net/health | ✅ Live |

---

## 🔧 Infrastructure Details

### Backend (Container - FastAPI)
- **Resource:** Azure App Service
- **Name:** complaint2292-api
- **Region:** Southeast Asia
- **Tier:** B1 Basic
- **Container Registry:** complaint2292acr.azurecr.io
- **Image:** complaint-backend:latest
- **Port:** 8000
- **Status:** ✅ Running

### Frontend (Container - Vite + React)
- **Resource:** Azure App Service
- **Name:** complaint2292-web
- **Region:** Southeast Asia
- **Tier:** B1 Basic
- **Container Registry:** complaint2292acr.azurecr.io
- **Image:** complaint-frontend:latest
- **Port:** 80
- **Status:** ✅ Running

### Database (PostgreSQL)
- **Resource:** Azure Database for PostgreSQL Flexible Server
- **Name:** complaint2292-db
- **Region:** Southeast Asia
- **Tier:** Burstable B1ms
- **Database:** complaints
- **Username:** complainadmin
- **SSL:** Enforced (sslmode=require)
- **Status:** ✅ Running

### Container Registry
- **Resource:** Azure Container Registry
- **Name:** complaint2292acr
- **Region:** Southeast Asia
- **Tier:** Basic
- **Status:** ✅ Active

---

## 🔐 Configuration

### Backend Environment Variables (App Service Settings)

```
DATABASE_URL=postgresql://complainadmin:PASSWORD@complaint2292-db.postgres.database.azure.com:5432/complaints?sslmode=require
CORS_ORIGINS=https://complaint2292-web.azurewebsites.net,http://localhost:5173
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=8
DEBUG=False
WEBSITES_PORT=8000
```

### Frontend Build Arguments

```
VITE_API_URL=https://complaint2292-api.azurewebsites.net
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

- **File:** `.github/workflows/azure-deploy.yml`
- **Trigger:** Push to `main` branch or manual dispatch
- **Status:** ✅ Active

### Deployment Steps

1. **Backend Job:**
   - Checkout code
   - Azure login (using service principal)
   - Build Docker image and push to ACR
   - Restart backend web app

2. **Frontend Job:**
   - Checkout code
   - Azure login
   - Build Docker image with VITE_API_URL
   - Push to ACR
   - Restart frontend web app

### GitHub Secrets

- `AZURE_CREDENTIALS` - Service principal credentials for Azure authentication

---

## 📊 Deployment History

| Commit | Status | Date | Notes |
|--------|--------|------|-------|
| e66f973 | ✅ Success | 2026-09-08 | Removed Static Web App workflow |
| 036888f | ✅ Success | 2026-09-08 | Fixed TypeScript build error |
| 99c945c | ✅ Success | 2026-09-08 | Fixed Azure deployment with CORS |
| 8c7c785 | ✅ Success | 2026-09-08 | Bangladesh Civic System transformation |

---

## ⚙️ Known Issues & Limitations

### ❌ Azure Static Web Apps
- **Status:** Not Available
- **Reason:** Azure Student subscription policy restrictions
- **Alternative:** Using container-based App Service (works perfectly)

### ✅ CORS Configuration
- **Status:** Configured and Working
- Backend allows: `https://complaint2292-web.azurewebsites.net` and `http://localhost:5173`

---

## 🔍 Monitoring & Logs

### View Backend Logs
```bash
az webapp log tail --name complaint2292-api --resource-group complaint-system
```

### View Frontend Logs
```bash
az webapp log tail --name complaint2292-web --resource-group complaint-system
```

### Check Health
```bash
curl https://complaint2292-api.azurewebsites.net/health
```

---

## 🛠️ Manual Deployment Commands

### Deploy Backend Only
```bash
az acr build \
  --registry complaint2292acr \
  --image complaint-backend:latest \
  --file backend/Dockerfile \
  backend/

az webapp restart --name complaint2292-api --resource-group complaint-system
```

### Deploy Frontend Only
```bash
az acr build \
  --registry complaint2292acr \
  --image complaint-frontend:latest \
  --file frontend/Dockerfile \
  --build-arg VITE_API_URL=https://complaint2292-api.azurewebsites.net \
  frontend/

az webapp restart --name complaint2292-web --resource-group complaint-system
```

---

## 💰 Cost Estimate

| Resource | Tier | Monthly Cost (USD) |
|----------|------|--------------------|
| App Service Plan (B1) | Basic | ~$13 |
| PostgreSQL (B1ms) | Burstable | ~$12 |
| Container Registry | Basic | ~$5 |
| **Total** | | **~$30/month** |

---

## 🚨 Important Notes

1. **Database Password:** Stored in Azure App Service settings (not in git)
2. **Admin Account:** Created via `backend/create_admin.py` script
3. **CORS:** Configured to allow frontend domain only
4. **SSL:** Enabled for database connections
5. **GitHub Secrets:** Service principal credentials stored securely

---

## 📞 Support & Troubleshooting

### Application Not Loading
1. Check if services are running: `az webapp show --name complaint2292-api --resource-group complaint-system`
2. Check logs: `az webapp log tail`
3. Verify environment variables in Azure Portal

### CORS Errors
1. Verify CORS_ORIGINS includes frontend URL
2. Restart backend: `az webapp restart --name complaint2292-api --resource-group complaint-system`

### Database Connection Issues
1. Check DATABASE_URL in app settings
2. Verify firewall rules allow Azure services
3. Check PostgreSQL server status

---

**Last Updated:** 2026-09-08  
**Deployment Version:** 2.0.0  
**Status:** ✅ Production Ready
