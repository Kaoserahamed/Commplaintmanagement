# Complaint Management System - Azure Deployment

A modern, full-stack complaint reporting and tracking system for managing public issues with media proof, deployed on Microsoft Azure.

## 🚀 Features

- **Comprehensive Complaint Management** - Create, view, update, and delete complaints with detailed information
- **7 Categories** - Road & Transport, Electricity, Water & Drainage, Garbage & Environment, Public Safety, Government Services, Other
- **5 Status Levels** - Pending, In Review, In Progress, Resolved, Rejected
- **4 Priority Levels** - Low, Medium, High, Urgent
- **Media Upload** - Attach photos or videos as evidence (max 10MB)
- **Location Tracking** - Record location details and GPS coordinates
- **Dashboard Analytics** - Real-time statistics by status, category, and priority
- **Advanced Filtering** - Filter complaints by category, status, and priority
- **React + TypeScript + Tailwind CSS** - Modern, responsive UI
- **FastAPI + Python** - High-performance REST API
- **Azure Database for PostgreSQL** - Reliable cloud database
- **Docker containerization** - Easy deployment and scaling
- **Cost-optimized** - Designed for minimal Azure costs

## 🏗️ Architecture

```
┌──────────────────┐         ┌──────────────────┐         ┌───────────────────┐
│  React Frontend  │ ──────> │ FastAPI Backend  │ ──────> │  PostgreSQL DB    │
│  (Static Site)   │  REST   │ (Container App)  │  SQL    │ (Azure Database)  │
│  + Dashboard     │   +     │ + Media Upload   │   +     │ + Complaints      │
└──────────────────┘  Media  └──────────────────┘  Store  └───────────────────┘
```

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Docker** and Docker Compose
- **Azure CLI** (`az`) installed and authenticated
- **Azure subscription** with appropriate permissions

## 🛠️ Local Development

### Backend Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskcloud
CORS_ORIGINS=http://localhost:5173
```

Run the backend:
```powershell
uvicorn app.main:app --reload
```

### Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

### Using Docker Compose (Recommended)

```powershell
docker-compose up --build
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## ☁️ Azure Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy

```powershell
# Login to Azure
az login

# Run deployment script
.\deploy\deploy.ps1
```

## 🔌 API Endpoints

### Complaints
- `GET /api/complaints` - List all complaints (with filtering)
- `POST /api/complaints` - Create a complaint
- `GET /api/complaints/{id}` - Get complaint by ID
- `PUT /api/complaints/{id}` - Update complaint
- `DELETE /api/complaints/{id}` - Delete complaint
- `POST /api/complaints/{id}/media` - Upload media for complaint

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Media
- `GET /media/{filename}` - Serve uploaded media files

### Health
- `GET /health` - Health check

## 🎨 Tech Stack

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Axios

**Backend:**
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- Uvicorn

**Infrastructure:**
- Azure App Service (Linux Container)
- Azure Container Registry
- Azure Database for PostgreSQL
- Docker

## 📝 Environment Variables

### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://myapp.azurewebsites.net` |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.azurewebsites.net` |

## 🧪 Testing

```powershell
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📦 Project Structure

```
TaskCloud/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── models.py         # Complaint database models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── database.py       # Database connection
│   │   ├── routes.py         # API endpoints
│   │   └── media.py          # Media file handling
│   ├── uploads/              # Media storage directory
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ComplaintForm.tsx    # Form with media upload
│   │   │   ├── ComplaintCard.tsx    # Complaint display
│   │   │   ├── Dashboard.tsx        # Statistics dashboard
│   │   │   ├── FilterBar.tsx        # Multi-filter component
│   │   │   └── Header.tsx           # App header
│   │   ├── services/
│   │   │   └── api.ts               # API client
│   │   ├── types.ts                 # TypeScript types
│   │   ├── App.tsx                  # Main component
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── deploy/
│   └── deploy.ps1           # Azure deployment script
├── docker-compose.yml
└── README.md
```

## 💰 Cost Estimation (Azure)

- **App Service (B1)**: ~$13/month
- **PostgreSQL (B1)**: ~$26/month
- **Container Registry (Basic)**: ~$5/month
- **Total**: ~$44/month

Use Free Tier options where available to reduce costs.

## 🔒 Security Considerations

- Use Azure Key Vault for production secrets
- Enable HTTPS only
- Implement rate limiting
- Use managed identities
- Regular security updates

## 📄 License

MIT License - Feel free to use this project for your portfolio.

## 👤 Author

Built as a demonstration project for Azure deployment capabilities.

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.
