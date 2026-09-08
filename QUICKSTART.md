# TaskCloud - Quick Start Guide

Get TaskCloud running in 5 minutes! ⚡

## 🎯 Choose Your Path

### Path 1: Local Development (2 minutes)

Perfect for testing and development.

```powershell
# 1. Navigate to project
cd d:\TaskCloud

# 2. Start all services
docker-compose up --build

# 3. Open browser
# Frontend: http://localhost:5173
# API Docs: http://localhost:8000/docs
```

**Stop services:**
```powershell
docker-compose down
```

---

### Path 2: Azure Deployment (10 minutes)

Deploy to production on Azure.

```powershell
# 1. Login to Azure
az login

# 2. Deploy
cd d:\TaskCloud
.\deploy\deploy.ps1

# 3. Wait for completion
# Your URLs will be displayed at the end
```

---

## 📝 Local Setup Details

### Prerequisites

- Docker Desktop installed and running
- No other software needed!

### Step-by-Step

1. **Create environment file (optional):**

   ```powershell
   # Backend (optional, has defaults)
   Copy-Item backend\.env.example backend\.env
   
   # Frontend (optional, has defaults)
   Copy-Item frontend\.env.example frontend\.env
   ```

2. **Start services:**

   ```powershell
   docker-compose up --build
   ```

   Wait for:
   ```
   ✓ Database ready
   ✓ Backend running on port 8000
   ✓ Frontend running on port 5173
   ```

3. **Test the app:**

   - Open http://localhost:5173
   - Click "New Task"
   - Add a task
   - ✅ Done!

4. **View API documentation:**

   - Open http://localhost:8000/docs
   - Try the interactive API

---

## ☁️ Azure Deployment Details

### Prerequisites

- Azure CLI installed
- Azure account (free tier available)

### Step-by-Step

1. **Verify Azure CLI:**

   ```powershell
   az --version
   ```

   Install if needed: https://aka.ms/installazurecliwindows

2. **Login to Azure:**

   ```powershell
   az login
   ```

3. **Deploy application:**

   ```powershell
   cd d:\TaskCloud
   .\deploy\deploy.ps1
   ```

   **Default configuration:**
   - Resource Group: `taskcloud-rg`
   - Region: `East US`
   - Random app name

   **Custom configuration:**
   ```powershell
   .\deploy\deploy.ps1 -ResourceGroup "my-rg" -Location "westus2" -AppName "myapp"
   ```

4. **Wait for deployment (~10-15 minutes):**

   The script will:
   - ✅ Create resources
   - ✅ Build containers
   - ✅ Deploy database
   - ✅ Deploy apps
   - ✅ Configure HTTPS

5. **Get your URLs:**

   After completion, you'll see:
   ```
   Frontend: https://taskcloud-1234-frontend.azurewebsites.net
   Backend:  https://taskcloud-1234-backend.azurewebsites.net
   API Docs: https://taskcloud-1234-backend.azurewebsites.net/docs
   ```

6. **Test your deployment:**

   - Open the Frontend URL
   - Wait 1-2 minutes for initial startup
   - Create a task to verify everything works

---

## 🔧 Common Operations

### Check Deployment Status

```powershell
.\deploy\status.ps1
```

### View Logs

```powershell
# Download logs
.\deploy\logs.ps1

# Stream live logs
.\deploy\logs.ps1 -Service backend -Follow
```

### Update Code

After making changes:

```powershell
.\deploy\update.ps1
```

### Delete Everything

To avoid charges:

```powershell
.\deploy\cleanup.ps1
```

---

## 💰 Cost Information

**Azure Costs (Monthly):**
- App Service: ~$13
- Database: ~$26
- Registry: ~$5
- **Total: ~$44**

**Free Options:**
- Use Azure free credits ($200 for 30 days)
- Use Azure for Students ($100/year)
- Stop apps when not in use
- Delete resources after demo

**Stop apps to save money:**
```powershell
az webapp stop --name taskcloud-1234-backend --resource-group taskcloud-rg
az webapp stop --name taskcloud-1234-frontend --resource-group taskcloud-rg
```

---

## 🆘 Troubleshooting

### Local Development

**Problem:** Docker won't start

**Solution:**
1. Ensure Docker Desktop is running
2. Try: `docker-compose down` then `docker-compose up --build`

**Problem:** Port already in use

**Solution:**
```powershell
# Stop the process using the port
# Or change ports in docker-compose.yml
```

### Azure Deployment

**Problem:** Login failed

**Solution:**
```powershell
az logout
az login
```

**Problem:** App not responding

**Solution:**
```powershell
# Check status
.\deploy\status.ps1

# View logs
.\deploy\logs.ps1 -Service backend -Follow

# Restart app
az webapp restart --name {app-name} --resource-group taskcloud-rg
```

**Problem:** Deployment failed

**Solution:**
```powershell
# Clean up and retry
.\deploy\cleanup.ps1
.\deploy\deploy.ps1
```

---

## 📚 Next Steps

1. ✅ **Read full documentation:** [DEPLOYMENT.md](DEPLOYMENT.md)
2. ✅ **Explore the code:** Check `backend/` and `frontend/` directories
3. ✅ **Test all features:** CRUD operations, filtering, status changes
4. ✅ **Customize:** Add features, change styling, extend API
5. ✅ **Deploy:** Show it off in your portfolio!

---

## 🔗 Quick Links

- **API Documentation:** `{backend-url}/docs`
- **Health Check:** `{backend-url}/health`
- **Azure Portal:** https://portal.azure.com
- **Docker Hub:** https://hub.docker.com

---

## 📞 Help

Need more details? Check these files:

- **Full deployment guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Project overview:** [README.md](README.md)
- **Deployment scripts:** [deploy/README.md](deploy/README.md)

---

**Ready to go? Pick your path and start building! 🚀**
