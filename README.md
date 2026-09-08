# Complaint Management System

A full-stack web application for reporting and managing public complaints with media upload support. Users can report issues across various categories (road, electricity, water, garbage, public safety, etc.) with optional image/video proof.

**Live Demo**: [https://complaint2292-web.azurewebsites.net](https://complaint2292-web.azurewebsites.net)

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Tailwind CSS
- Vite
- Axios

**Backend**
- FastAPI (Python)
- SQLAlchemy + PostgreSQL
- Pydantic v2
- Pillow (image processing)

**DevOps**
- Docker
- GitHub Actions (CI/CD)
- Azure App Service
- Azure Container Registry
- Azure PostgreSQL

## System Workflow

```
User Browser
     ↓
Frontend (React/Nginx) → Backend (FastAPI) → PostgreSQL Database
     ↓                        ↓
  Tailwind UI          REST API + Media Upload
```

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/Kaoserahamed/Commplaintmanagement.git
cd TaskCloud
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials:
# DATABASE_URL=postgresql://user:password@localhost:5432/complaints
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure API URL
echo "VITE_API_URL=http://localhost:8000" > .env.local
```

## How to Run

### Option 1: Manual
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Docker Compose
```bash
# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start all services
docker-compose up --build

# Stop services
docker-compose down
```

## Deployment

### Azure (CI/CD with GitHub Actions)

1. **Create Azure Resources** (one-time):
```powershell
cd deploy
.\deploy-azure.ps1
```

2. **Setup GitHub Actions**:
```bash
# Create service principal
az ad sp create-for-rbac \
  --name "complaint-deploy" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/complaint-system \
  --sdk-auth
```

3. **Add GitHub Secret**:
   - Go to GitHub repo → Settings → Secrets → New secret
   - Name: `AZURE_CREDENTIALS`
   - Value: JSON output from above command

4. **Deploy**:
```bash
git push origin main  # Triggers automatic deployment
```

## API Endpoints

```
GET    /health                      - Health check
GET    /api/complaints              - List complaints (with filters)
POST   /api/complaints              - Create complaint
GET    /api/complaints/{id}         - Get complaint
PUT    /api/complaints/{id}         - Update complaint
DELETE /api/complaints/{id}         - Delete complaint
POST   /api/complaints/{id}/media   - Upload media
GET    /api/dashboard/stats         - Get statistics
```

## Project Structure

```
TaskCloud/
├── .github/workflows/           # CI/CD pipeline
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app
│   │   ├── models.py           # Database models
│   │   ├── routes.py           # API endpoints
│   │   └── schemas.py          # Validation schemas
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/api.ts     # API client
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
├── deploy/                      # Azure deployment scripts
├── docker-compose.yml
└── README.md
```

## License

MIT License - see LICENSE file for details

---

**Repository**: [https://github.com/Kaoserahamed/Commplaintmanagement](https://github.com/Kaoserahamed/Commplaintmanagement)
