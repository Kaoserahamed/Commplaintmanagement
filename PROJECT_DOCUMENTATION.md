# Bangladesh Civic Complaint Management System - Complete Implementation Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Database Design](#database-design)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Deployment Strategy](#deployment-strategy)
8. [Key Features & Implementation](#key-features--implementation)
9. [Security & Best Practices](#security--best-practices)
10. [Troubleshooting & Lessons Learned](#troubleshooting--lessons-learned)

---

## Project Overview

### What is this system?
A full-stack civic complaint management platform designed specifically for Bangladesh, allowing citizens to report local issues (roads, electricity, water, etc.) with geographic precision using the Division → District → Upazila hierarchy.

### Core Business Logic
**One Active Complaint Per Upazila Rule**: Only ONE active complaint (status: submitted or in_process) is allowed per upazila at any given time. This prevents complaint flooding and ensures focused resolution.

### Live URLs
- **Frontend**: https://complaint2292-web.azurewebsites.net
- **Backend API**: https://complaint2292-api.azurewebsites.net
- **Database**: PostgreSQL on Azure (complaint2292-db.postgres.database.azure.com)

---

## Architecture & Tech Stack

### System Architecture
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend   │────────▶│  PostgreSQL │
│  (React +   │  HTTPS  │  (FastAPI)  │   SQL   │  Database   │
│  Vite +     │  CORS   │   Python    │         │             │
│  TypeScript)│         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
      │                       │
      │                       ▼
      │                 ┌─────────────┐
      │                 │  File Store │
      │                 │  (Media)    │
      │                 └─────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│        Azure App Services                │
│  - complaint2292-web (frontend)          │
│  - complaint2292-api (backend)           │
│  - Docker containers                     │
└─────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast HMR, optimized builds)
- **Styling**: Tailwind CSS (utility-first CSS)
- **HTTP Client**: Axios (with interceptors)
- **State Management**: React Hooks (useState, useEffect)
- **Deployment**: Azure App Service (Docker container)

#### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy (database abstraction)
- **Authentication**: JWT (JSON Web Tokens) for admin
- **Password Hashing**: Passlib with bcrypt
- **CORS**: FastAPI CORS middleware
- **Server**: Uvicorn (ASGI server)
- **Deployment**: Azure App Service (Docker container)

#### Database
- **RDBMS**: PostgreSQL 14+ (Azure Flexible Server)
- **Connection**: psycopg2 (PostgreSQL adapter)
- **Schema Management**: SQLAlchemy declarative models

#### DevOps
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Containerization**: Docker + docker-compose
- **Cloud Provider**: Microsoft Azure
- **CLI Tools**: Azure CLI, PowerShell

---

## Database Design

### Entity-Relationship Diagram
```
┌─────────────────────────────────────┐
│          Complaint                  │
├─────────────────────────────────────┤
│ id (PK)             : INTEGER       │
│ title               : VARCHAR(200)  │
│ description         : TEXT          │
│ category            : ENUM          │
│ priority            : ENUM          │
│ status              : ENUM          │
│ division            : VARCHAR(50)   │
│ district            : VARCHAR(50)   │
│ upazila             : VARCHAR(50)   │
│ local_area          : TEXT          │
│ phone_number        : VARCHAR(20)   │
│ media_url           : VARCHAR(500)  │
│ media_type          : VARCHAR(50)   │
│ admin_notes         : TEXT          │
│ created_at          : TIMESTAMP     │
│ updated_at          : TIMESTAMP     │
│ closed_at           : TIMESTAMP     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│            Admin                    │
├─────────────────────────────────────┤
│ id (PK)             : INTEGER       │
│ username            : VARCHAR(50)   │
│ email               : VARCHAR(100)  │
│ password_hash       : VARCHAR(255)  │
│ is_active           : BOOLEAN       │
│ created_at          : TIMESTAMP     │
│ last_login          : TIMESTAMP     │
└─────────────────────────────────────┘
```

### Schema Details

#### Complaint Table
```sql
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,  -- road_transport, electricity, water_drainage, etc.
    priority VARCHAR(20) DEFAULT 'medium',  -- low, medium, high, urgent
    status VARCHAR(20) DEFAULT 'submitted',  -- submitted, in_process, closed
    division VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    upazila VARCHAR(50) NOT NULL,
    local_area TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    media_url VARCHAR(500),
    media_type VARCHAR(50),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX idx_upazila_status ON complaints(upazila, status);
CREATE INDEX idx_created_at ON complaints(created_at DESC);
CREATE INDEX idx_division ON complaints(division);
```

#### Admin Table
```sql
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

### Enums
```python
# Category
- ROAD_TRANSPORT
- ELECTRICITY
- WATER_DRAINAGE
- GARBAGE_ENVIRONMENT
- PUBLIC_SAFETY
- GOVERNMENT_SERVICES
- OTHER

# Status
- SUBMITTED (initial state)
- IN_PROCESS (admin started working)
- CLOSED (resolved)

# Priority
- LOW
- MEDIUM (default)
- HIGH
- URGENT
```

---

## Backend Implementation

### Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app initialization, CORS
│   ├── database.py                # Database connection, session
│   ├── models.py                  # SQLAlchemy models (Complaint, Admin)
│   ├── schemas.py                 # Pydantic schemas (request/response)
│   ├── routes.py                  # API endpoints
│   ├── media.py                   # File upload handling
│   └── bangladesh_locations.py    # Location data (8 divisions, 64 districts, ~500 upazilas)
├── create_admin.py                # Script to create admin users
├── requirements.txt               # Python dependencies
├── Dockerfile                     # Backend container
└── .env                           # Environment variables
```

### Step-by-Step Implementation

#### 1. Database Connection (`database.py`)
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost/complaint_db"
)

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for getting DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Key Concepts**:
- `pool_pre_ping=True`: Prevents stale connection errors
- `SessionLocal`: Factory for creating database sessions
- `get_db()`: Dependency injection for route handlers

#### 2. Models (`models.py`)
```python
from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, Boolean
from sqlalchemy.sql import func
from .database import Base
import enum

class ComplaintCategory(str, enum.Enum):
    ROAD_TRANSPORT = "road_transport"
    ELECTRICITY = "electricity"
    # ... more categories

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    IN_PROCESS = "in_process"
    CLOSED = "closed"

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(ComplaintCategory), nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.SUBMITTED)
    
    # Bangladesh location hierarchy
    division = Column(String(50), nullable=False, index=True)
    district = Column(String(50), nullable=False)
    upazila = Column(String(50), nullable=False, index=True)
    local_area = Column(Text, nullable=False)
    phone_number = Column(String(20), nullable=False)
    
    # Media
    media_url = Column(String(500))
    media_type = Column(String(50))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True))
```

**Key Concepts**:
- `Enum`: Type-safe enumerations
- `func.now()`: Database-level timestamp
- `index=True`: Performance optimization for queries

#### 3. Schemas (`schemas.py`)
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class ComplaintCategory(str, Enum):
    ROAD_TRANSPORT = "road_transport"
    # ... more

class ComplaintCreate(BaseModel):
    """Schema for creating complaint (user-facing)"""
    title: str = Field(..., min_length=10, max_length=200)
    description: str = Field(..., min_length=20)
    category: ComplaintCategory
    division: str
    district: str
    upazila: str
    local_area: str
    phone_number: str = Field(..., pattern=r'^01[3-9]\d{8}$')

class ComplaintResponse(BaseModel):
    """Schema for complaint response"""
    id: int
    title: str
    description: str
    category: str
    status: str
    priority: str
    division: str
    district: str
    upazila: str
    local_area: str
    phone_number: str
    media_url: Optional[str]
    created_at: datetime
    
    class Config:
        orm_mode = True  # Allow SQLAlchemy model conversion
```

**Key Concepts**:
- `Pydantic`: Data validation and serialization
- `Field()`: Add constraints (min_length, pattern)
- `orm_mode`: Convert SQLAlchemy models to Pydantic

#### 4. Core Routes (`routes.py`)

##### A. Location Endpoints
```python
from .bangladesh_locations import get_divisions, get_districts, get_upazilas

@router.get("/locations/divisions")
def list_divisions():
    """Get all 8 divisions"""
    return {"divisions": get_divisions()}

@router.get("/locations/districts")
def list_districts(division: str):
    """Get districts for a division"""
    districts = get_districts(division)
    if not districts:
        raise HTTPException(status_code=404, detail="Division not found")
    return {"districts": districts}

@router.get("/locations/upazilas")
def list_upazilas(division: str, district: str):
    """Get upazilas for a district"""
    upazilas = get_upazilas(division, district)
    if not upazilas:
        raise HTTPException(status_code=404, detail="District not found")
    return {"upazilas": upazilas}
```

##### B. Upazila Availability Check
```python
@router.get("/upazila/availability")
def check_upazila_availability(
    division: str,
    district: str,
    upazila: str,
    db: Session = Depends(get_db)
):
    """Check if upazila accepts new complaints"""
    # Validate location hierarchy
    if not validate_location(division, district, upazila):
        raise HTTPException(status_code=400, detail="Invalid location")
    
    # Check for active complaints
    existing = db.query(Complaint).filter(
        and_(
            Complaint.upazila == upazila,
            Complaint.status.in_([
                ComplaintStatus.SUBMITTED,
                ComplaintStatus.IN_PROCESS
            ])
        )
    ).first()
    
    if existing:
        return {
            "available": False,
            "message": f"Active complaint exists for {upazila}",
            "existing_complaint": existing
        }
    
    return {"available": True, "message": f"{upazila} is available"}
```

**Key Concepts**:
- `Depends(get_db)`: Dependency injection for database session
- `and_()`: SQLAlchemy AND condition
- `.in_()`: Check if value in list

##### C. Create Complaint
```python
@router.post("/complaints", status_code=201)
def create_complaint(
    complaint: schemas.ComplaintCreate,
    db: Session = Depends(get_db)
):
    """Create new complaint (public endpoint)"""
    # 1. Validate location
    if not validate_location(complaint.division, complaint.district, complaint.upazila):
        raise HTTPException(status_code=400, detail="Invalid location hierarchy")
    
    # 2. Check upazila availability (ONE ACTIVE COMPLAINT RULE)
    existing = db.query(Complaint).filter(
        and_(
            Complaint.upazila == complaint.upazila,
            Complaint.status.in_([
                ComplaintStatus.SUBMITTED,
                ComplaintStatus.IN_PROCESS
            ])
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Active complaint exists for {complaint.upazila}"
        )
    
    # 3. Create complaint
    db_complaint = Complaint(
        title=complaint.title,
        description=complaint.description,
        category=ComplaintCategory[complaint.category.name],
        priority=ComplaintPriority.MEDIUM,  # Default
        division=complaint.division,
        district=complaint.district,
        upazila=complaint.upazila,
        local_area=complaint.local_area,
        phone_number=complaint.phone_number,
        status=ComplaintStatus.SUBMITTED
    )
    
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    
    return db_complaint
```

**Key Concepts**:
- `status_code=409`: Conflict (upazila not available)
- `db.add()`: Stage object for insertion
- `db.commit()`: Persist to database
- `db.refresh()`: Load generated values (id, timestamps)

##### D. Admin Authentication (JWT)
```python
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import HTTPBearer

SECRET_KEY = os.getenv("SECRET_KEY", "change-in-production")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict) -> str:
    """Generate JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=8)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/admin/login")
def admin_login(credentials: schemas.AdminLogin, db: Session = Depends(get_db)):
    """Admin login endpoint"""
    admin = db.query(Admin).filter(Admin.username == credentials.username).first()
    
    if not admin or not pwd_context.verify(credentials.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Account inactive")
    
    # Update last login
    admin.last_login = datetime.utcnow()
    db.commit()
    
    # Create token
    token = create_access_token(data={"sub": admin.id})
    return {"access_token": token, "token_type": "bearer"}
```

**Key Concepts**:
- `bcrypt`: Secure password hashing (slow = resistant to brute force)
- JWT: Stateless authentication (no session storage needed)
- `exp`: Token expiration (8 hours)

#### 5. Media Upload (`media.py`)
```python
from pathlib import Path
import shutil

UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {
    'image': {'jpg', 'jpeg', 'png', 'gif', 'webp'},
    'video': {'mp4', 'mov', 'avi', 'webm'}
}

async def save_upload_file(file: UploadFile) -> tuple[str, str]:
    """Save uploaded media file"""
    # Validate file type
    ext = file.filename.split('.')[-1].lower()
    media_type = None
    
    for type_name, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            media_type = type_name
            break
    
    if not media_type:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Generate unique filename
    timestamp = int(time.time() * 1000)
    filename = f"{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return f"/api/media/{filename}", media_type
```

**Key Concepts**:
- `UploadFile`: FastAPI multipart form handling
- `shutil.copyfileobj()`: Efficient file copy
- Timestamp prefix: Prevent filename collisions

#### 6. CORS Configuration (`main.py`)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Bangladesh Civic Complaint API")

# CORS - Allow frontend to call backend
origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Key Concepts**:
- CORS: Cross-Origin Resource Sharing (browser security)
- `allow_origins`: Whitelist of allowed frontend URLs
- Production: Must set `CORS_ORIGINS=https://your-frontend.com`

---

## Frontend Implementation

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Top navbar
│   │   ├── Dashboard.tsx           # Stats cards (4-card compact layout)
│   │   ├── FilterBar.tsx           # Location + category + status filters
│   │   ├── ComplaintForm.tsx       # Create complaint modal
│   │   └── ComplaintCard.tsx       # Individual complaint display
│   ├── services/
│   │   └── api.ts                  # Axios API client
│   ├── types.ts                    # TypeScript interfaces
│   ├── App.tsx                     # Main component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Tailwind CSS
├── Dockerfile
├── nginx.conf                      # Production web server config
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### Step-by-Step Implementation

#### 1. Type Definitions (`types.ts`)
```typescript
export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  division: string;
  district: string;
  upazila: string;
  local_area: string;
  phone_number: string;
  media_url?: string;
  media_type?: string;
  created_at: string;
  updated_at?: string;
}

export type ComplaintStatus = 'submitted' | 'in_process' | 'closed';
export type ComplaintCategory = 
  | 'road_transport'
  | 'electricity'
  | 'water_drainage'
  | 'garbage_environment'
  | 'public_safety'
  | 'government_services'
  | 'other';

export interface ComplaintCreate {
  title: string;
  description: string;
  category: ComplaintCategory;
  division: string;
  district: string;
  upazila: string;
  local_area: string;
  phone_number: string;
}
```

**Key Concepts**:
- TypeScript interfaces: Compile-time type checking
- Union types: `'submitted' | 'in_process' | 'closed'`
- Optional properties: `media_url?:`

#### 2. API Service (`services/api.ts`)
```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor (logging)
api.interceptors.request.use(
  (config) => {
    console.log(`🔵 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (error handling)
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`🔴 ${error.response?.status || 'Network Error'} ${error.config?.url}`);
    return Promise.reject(error);
  }
);

export const complaintApi = {
  getComplaints: async (): Promise<Complaint[]> => {
    const response = await api.get<Complaint[]>('/api/complaints');
    return response.data;
  },
  
  createComplaint: async (complaint: ComplaintCreate): Promise<Complaint> => {
    const response = await api.post<Complaint>('/api/complaints', complaint);
    return response.data;
  },
  
  uploadMedia: async (complaintId: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(
      `/api/complaints/${complaintId}/media`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },
  
  getDivisions: async (): Promise<string[]> => {
    const response = await api.get<{ divisions: string[] }>('/api/locations/divisions');
    return response.data.divisions;
  },
  
  getDistricts: async (division: string): Promise<string[]> => {
    const response = await api.get<{ districts: string[] }>(
      '/api/locations/districts',
      { params: { division } }  // Proper URL encoding
    );
    return response.data.districts;
  },
  
  getUpazilas: async (division: string, district: string): Promise<string[]> => {
    const response = await api.get<{ upazilas: string[] }>(
      '/api/locations/upazilas',
      { params: { division, district } }
    );
    return response.data.upazilas;
  },
};
```

**Key Concepts**:
- Axios instance: Centralized configuration
- Interceptors: Add logging, auth headers, error handling
- `params` object: Automatic URL encoding (prevents 404 errors)
- FormData: Multipart file uploads

#### 3. Complaint Form (`ComplaintForm.tsx`)
```typescript
const ComplaintForm = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState<ComplaintCreate>({
    title: '',
    description: '',
    category: 'road_transport',
    division: '',
    district: '',
    upazila: '',
    local_area: '',
    phone_number: '',
  });
  
  const [divisions, setDivisions] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [upazilas, setUpazilas] = useState<string[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  
  // Load divisions on mount
  useEffect(() => {
    complaintApi.getDivisions().then(setDivisions);
  }, []);
  
  // Load districts when division changes
  useEffect(() => {
    if (formData.division) {
      complaintApi.getDistricts(formData.division).then(setDistricts);
      setFormData(prev => ({ ...prev, district: '', upazila: '' }));
    }
  }, [formData.division]);
  
  // Load upazilas when district changes
  useEffect(() => {
    if (formData.district) {
      complaintApi.getUpazilas(formData.division, formData.district).then(setUpazilas);
      setFormData(prev => ({ ...prev, upazila: '' }));
    }
  }, [formData.district]);
  
  // Check availability when upazila selected
  useEffect(() => {
    if (formData.upazila) {
      complaintApi.checkUpazilaAvailability(
        formData.division,
        formData.district,
        formData.upazila
      ).then(setAvailability);
    }
  }, [formData.upazila]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!availability?.available) {
      alert('This upazila already has an active complaint. Please wait.');
      return;
    }
    
    await onSubmit(formData, mediaFile);
  };
  
  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          minLength={10}
          required
        />
        
        {/* Category */}
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        >
          <option value="road_transport">Road & Transport</option>
          <option value="electricity">Electricity</option>
          {/* ... more options */}
        </select>
        
        {/* Location Cascade */}
        <select
          value={formData.division}
          onChange={(e) => setFormData({ ...formData, division: e.target.value })}
          required
        >
          <option value="">Select Division</option>
          {divisions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <select
          value={formData.district}
          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
          disabled={!formData.division}
          required
        >
          <option value="">Select District</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <select
          value={formData.upazila}
          onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
          disabled={!formData.district}
          required
        >
          <option value="">Select Upazila</option>
          {upazilas.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        
        {/* Availability Message */}
        {availability && !availability.available && (
          <div className="alert alert-warning">
            {availability.message}
          </div>
        )}
        
        {/* Submit */}
        <button type="submit" disabled={isSubmitting || !availability?.available}>
          {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
};
```

**Key Concepts**:
- Cascading dropdowns: Each selection loads next level
- `useEffect`: Side effects (API calls on state change)
- Disabled state: Prevent submission if upazila unavailable
- Controlled inputs: React state drives form values

#### 4. Dashboard (`Dashboard.tsx`)
```typescript
const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  useEffect(() => {
    complaintApi.getDashboardStats().then(setStats);
  }, []);
  
  if (!stats) return <div>Loading...</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Complaints Card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-4 rounded-lg">
        <div className="text-3xl font-bold">{stats.total_complaints}</div>
        <div className="text-sm opacity-90">Total Complaints</div>
      </div>
      
      {/* Status Cards */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <div>
            <div className="text-2xl font-bold">{stats.by_status.submitted}</div>
            <div className="text-xs text-gray-600">Submitted</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          <div>
            <div className="text-2xl font-bold">{stats.by_status.in_process}</div>
            <div className="text-xs text-gray-600">In Process</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <div>
            <div className="text-2xl font-bold">{stats.by_status.closed}</div>
            <div className="text-xs text-gray-600">Closed</div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Key Concepts**:
- Tailwind CSS: `grid`, `gap-4`, `rounded-lg`, `shadow-sm`
- Responsive: `md:grid-cols-4` (1 col mobile, 4 cols desktop)
- Conditional rendering: Show loader until data loads

#### 5. Filter Bar (`FilterBar.tsx`)
```typescript
const FilterBar = ({ 
  categoryFilter, 
  statusFilter, 
  onCategoryChange, 
  onStatusChange,
  onLocationChange 
}) => {
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [divisions, setDivisions] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [upazilas, setUpazilas] = useState<string[]>([]);
  
  // Load divisions on mount
  useEffect(() => {
    complaintApi.getDivisions().then(setDivisions);
  }, []);
  
  // Load districts when division changes
  useEffect(() => {
    if (division) {
      complaintApi.getDistricts(division).then(setDistricts);
    } else {
      setDistricts([]);
    }
  }, [division]);
  
  // Load upazilas when district changes
  useEffect(() => {
    if (district) {
      complaintApi.getUpazilas(division, district).then(setUpazilas);
    } else {
      setUpazilas([]);
    }
  }, [district]);
  
  // Notify parent of location changes
  useEffect(() => {
    onLocationChange(division, district, upazila);
  }, [division, district, upazila]);
  
  const handleClear = () => {
    setDivision('');
    setDistrict('');
    setUpazila('');
    onCategoryChange('all');
    onStatusChange('all');
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Location Filters */}
        <select value={division} onChange={(e) => setDivision(e.target.value)}>
          <option value="">All Divisions</option>
          {divisions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <select 
          value={district} 
          onChange={(e) => setDistrict(e.target.value)}
          disabled={!division}
        >
          <option value="">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <select 
          value={upazila} 
          onChange={(e) => setUpazila(e.target.value)}
          disabled={!district}
        >
          <option value="">All Upazilas</option>
          {upazilas.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        
        {/* Category Filter */}
        <select value={categoryFilter} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="road_transport">Road & Transport</option>
          {/* ... */}
        </select>
        
        {/* Status Filter */}
        <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="in_process">In Process</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      
      <button onClick={handleClear} className="mt-2 text-sm">
        Clear Filters
      </button>
    </div>
  );
};
```

**Key Concepts**:
- Props drilling: Pass callbacks from parent (App.tsx)
- Clear functionality: Reset all filters
- Disabled state: Prevent selection until parent loads

#### 6. Main App (`App.tsx`)
```typescript
function App() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [upazilaFilter, setUpazilaFilter] = useState('');
  
  // Fetch all complaints on mount
  useEffect(() => {
    complaintApi.getComplaints().then(setAllComplaints);
  }, []);
  
  // Apply filters whenever they change
  useEffect(() => {
    let filtered = allComplaints;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    if (divisionFilter) {
      filtered = filtered.filter(c => c.division === divisionFilter);
    }
    
    if (districtFilter) {
      filtered = filtered.filter(c => c.district === districtFilter);
    }
    
    if (upazilaFilter) {
      filtered = filtered.filter(c => c.upazila === upazilaFilter);
    }
    
    setComplaints(filtered);
  }, [allComplaints, categoryFilter, statusFilter, divisionFilter, districtFilter, upazilaFilter]);
  
  const handleLocationChange = (div: string, dist: string, upa: string) => {
    setDivisionFilter(div);
    setDistrictFilter(dist);
    setUpazilaFilter(upa);
  };
  
  return (
    <div>
      <Header />
      <Dashboard />
      <FilterBar 
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
        onLocationChange={handleLocationChange}
      />
      
      {/* Complaint Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {complaints.map(complaint => (
          <ComplaintCard key={complaint.id} complaint={complaint} />
        ))}
      </div>
    </div>
  );
}
```

**Key Concepts**:
- Client-side filtering: Filter in memory (fast, no API calls)
- Multiple filters: AND logic (all filters must match)
- Key prop: React reconciliation optimization

---

## CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/azure-deploy.yml`)

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:  # Manual trigger

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    # 1. Checkout code
    - name: Checkout repository
      uses: actions/checkout@v3
    
    # 2. Azure login
    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
        enable-AzPSSession: false
    
    # 3. Build and push backend Docker image
    - name: Build and push backend
      run: |
        cd backend
        docker build -t complaint2292-api:${{ github.sha }} .
        docker tag complaint2292-api:${{ github.sha }} complaint2292acr.azurecr.io/complaint-api:latest
        az acr login --name complaint2292acr
        docker push complaint2292acr.azurecr.io/complaint-api:latest
    
    # 4. Deploy backend to App Service
    - name: Deploy backend
      run: |
        az webapp config container set \
          --name complaint2292-api \
          --resource-group complaint-system \
          --docker-custom-image-name complaint2292acr.azurecr.io/complaint-api:latest \
          --docker-registry-server-url https://complaint2292acr.azurecr.io
        
        az webapp restart --name complaint2292-api --resource-group complaint-system
    
    # 5. Build frontend
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Build frontend
      run: |
        cd frontend
        npm ci
        VITE_API_URL=${{ secrets.BACKEND_API_URL }} npm run build
    
    # 6. Build and push frontend Docker image
    - name: Build and push frontend
      run: |
        cd frontend
        docker build -t complaint2292-web:${{ github.sha }} .
        docker tag complaint2292-web:${{ github.sha }} complaint2292acr.azurecr.io/complaint-web:latest
        az acr login --name complaint2292acr
        docker push complaint2292acr.azurecr.io/complaint-web:latest
    
    # 7. Deploy frontend to App Service
    - name: Deploy frontend
      run: |
        az webapp config container set \
          --name complaint2292-web \
          --resource-group complaint-system \
          --docker-custom-image-name complaint2292acr.azurecr.io/complaint-web:latest \
          --docker-registry-server-url https://complaint2292acr.azurecr.io
        
        az webapp restart --name complaint2292-web --resource-group complaint-system
    
    # 8. Run database migrations (if needed)
    - name: Database setup
      run: |
        echo "Database tables auto-created by SQLAlchemy on backend startup"
```

### Pipeline Stages Explained

#### Stage 1: Checkout
- Clones the repository to GitHub Actions runner
- `actions/checkout@v3`: Official GitHub action

#### Stage 2: Azure Authentication
- Logs into Azure using Service Principal credentials
- Stored in GitHub Secrets as `AZURE_CREDENTIALS` (JSON format)
- Format:
  ```json
  {
    "clientId": "xxx",
    "clientSecret": "xxx",
    "subscriptionId": "xxx",
    "tenantId": "xxx"
  }
  ```

#### Stage 3-4: Backend Build & Deploy
1. **Build**: Creates Docker image with Python + FastAPI
2. **Tag**: Tags image with commit SHA + `latest`
3. **Push**: Uploads to Azure Container Registry (ACR)
4. **Deploy**: Updates App Service to use new image
5. **Restart**: Ensures new container starts

#### Stage 5-7: Frontend Build & Deploy
1. **Install**: `npm ci` (clean install from package-lock.json)
2. **Build**: Vite builds optimized production bundle
   - Tree-shaking: Remove unused code
   - Minification: Compress JS/CSS
   - Code splitting: Separate bundles for lazy loading
3. **Environment**: Injects `VITE_API_URL` at build time
4. **Dockerize**: Creates Nginx container serving static files
5. **Deploy**: Same process as backend

### Docker Configuration

#### Backend Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY create_admin.py .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Key Concepts**:
- Multi-stage build: Smaller final image
- `--no-cache-dir`: Reduce image size
- HEALTHCHECK: Azure monitors container health
- Port 8000: Default FastAPI/Uvicorn port

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Key Concepts**:
- Multi-stage: Build in Node, serve with Nginx (smaller image)
- `nginx:alpine`: Minimal Linux distro (5MB vs 100MB+)
- Static files: Vite output in `/dist`

#### Nginx Configuration (`nginx.conf`)
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;

    # SPA routing - always serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Key Concepts**:
- `try_files`: SPA routing (React Router compatibility)
- `gzip`: Compress responses (faster load times)
- `expires 1y`: Cache JS/CSS bundles aggressively

---

## Deployment Strategy

### Azure Resources

```
Resource Group: complaint-system
├── App Service Plan: complaint2292-plan (B1 Basic tier)
├── App Service: complaint2292-api (Backend)
├── App Service: complaint2292-web (Frontend)
├── PostgreSQL Flexible Server: complaint2292-db
└── Container Registry: complaint2292acr
```

### Step-by-Step Deployment

#### 1. Create Resource Group
```powershell
az group create \
  --name complaint-system \
  --location southeastasia
```

#### 2. Create PostgreSQL Database
```powershell
az postgres flexible-server create \
  --resource-group complaint-system \
  --name complaint2292-db \
  --location southeastasia \
  --admin-user dbadmin \
  --admin-password <PASSWORD> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14

# Create database
az postgres flexible-server db create \
  --resource-group complaint-system \
  --server-name complaint2292-db \
  --database-name complaint_db
```

**Configuration**:
- Tier: Burstable (cost-effective for dev/test)
- SKU: Standard_B1ms (1 vCore, 2GB RAM)
- Storage: 32GB SSD
- Version: PostgreSQL 14

#### 3. Create Container Registry
```powershell
az acr create \
  --resource-group complaint-system \
  --name complaint2292acr \
  --sku Basic \
  --admin-enabled true
```

#### 4. Create App Service Plan
```powershell
az appservice plan create \
  --name complaint2292-plan \
  --resource-group complaint-system \
  --location southeastasia \
  --is-linux \
  --sku B1
```

**SKU B1**:
- 1 Core, 1.75GB RAM
- $13/month
- Supports custom domains, SSL

#### 5. Create Backend App Service
```powershell
az webapp create \
  --resource-group complaint-system \
  --plan complaint2292-plan \
  --name complaint2292-api \
  --deployment-container-image-name complaint2292acr.azurecr.io/complaint-api:latest

# Configure environment variables
az webapp config appsettings set \
  --name complaint2292-api \
  --resource-group complaint-system \
  --settings \
    DATABASE_URL="postgresql://dbadmin:<PASS>@complaint2292-db.postgres.database.azure.com/complaint_db" \
    SECRET_KEY="<RANDOM-SECRET-KEY>" \
    CORS_ORIGINS="https://complaint2292-web.azurewebsites.net,http://localhost:5173"

# Enable container logging
az webapp log config \
  --name complaint2292-api \
  --resource-group complaint-system \
  --docker-container-logging filesystem
```

#### 6. Create Frontend App Service
```powershell
az webapp create \
  --resource-group complaint-system \
  --plan complaint2292-plan \
  --name complaint2292-web \
  --deployment-container-image-name complaint2292acr.azurecr.io/complaint-web:latest
```

#### 7. Configure GitHub Secrets
```powershell
# Get Azure credentials
az ad sp create-for-rbac \
  --name "github-actions-complaint" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION-ID>/resourceGroups/complaint-system \
  --sdk-auth

# Output (store in GitHub Secret: AZURE_CREDENTIALS):
{
  "clientId": "xxx",
  "clientSecret": "xxx",
  "subscriptionId": "xxx",
  "tenantId": "xxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  ...
}
```

#### 8. Create Admin User
```powershell
# SSH into backend container or run locally
az webapp ssh --name complaint2292-api --resource-group complaint-system

# Inside container
export DATABASE_URL="postgresql://..."
python create_admin.py
# Enter username, email, password
```

### Environment Variables

#### Backend (`complaint2292-api`)
```env
DATABASE_URL=postgresql://dbadmin:password@complaint2292-db.postgres.database.azure.com/complaint_db?sslmode=require
SECRET_KEY=<256-bit-random-string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=8
CORS_ORIGINS=https://complaint2292-web.azurewebsites.net,http://localhost:5173
```

#### Frontend (Build-time)
```env
VITE_API_URL=https://complaint2292-api.azurewebsites.net
```

### Database Migration Strategy

**Auto-Creation on Startup** (Current Implementation):
```python
# In app/main.py
from .database import engine
from . import models

@app.on_event("startup")
def startup():
    models.Base.metadata.create_all(bind=engine)
    print("✅ Database initialized")
```

**Pros**:
- Simple for small projects
- No migration tool needed
- Works well with fresh databases

**Cons**:
- No version control for schema changes
- Can't roll back changes
- Not suitable for production with existing data

**Production Alternative (Alembic)**:
```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

---

## Key Features & Implementation

### 1. One Active Complaint Per Upazila

**Problem**: Prevent complaint spam for the same location.

**Solution**: Database constraint + API validation.

**Implementation**:
```python
# Check in create_complaint endpoint
existing = db.query(Complaint).filter(
    and_(
        Complaint.upazila == complaint.upazila,
        Complaint.status.in_([
            ComplaintStatus.SUBMITTED,
            ComplaintStatus.IN_PROCESS
        ])
    )
).first()

if existing:
    raise HTTPException(status_code=409, detail="Active complaint exists")
```

**Index for Performance**:
```sql
CREATE INDEX idx_upazila_status ON complaints(upazila, status);
```

### 2. Bangladesh Location Hierarchy

**Challenge**: 8 divisions, 64 districts, ~500 upazilas - hard-coded or database?

**Decision**: Hard-code in Python dict (static data, rarely changes).

**Structure**:
```python
BANGLADESH_LOCATIONS = {
    "Dhaka": {
        "districts": {
            "Dhaka": ["Dhamrai", "Dohar", "Keraniganj", ...],
            "Gazipur": ["Gazipur Sadar", "Kaliakair", ...],
        }
    },
    "Chittagong": { ... }
}
```

**Benefits**:
- Fast lookup (no DB query)
- Easy validation
- No database overhead

### 3. Cascading Location Dropdowns

**UX Flow**:
1. User selects Division → API loads Districts
2. User selects District → API loads Upazilas
3. User selects Upazila → Check availability

**Implementation** (React):
```typescript
useEffect(() => {
  if (formData.division) {
    complaintApi.getDistricts(formData.division).then(setDistricts);
    // Reset dependent fields
    setFormData(prev => ({ ...prev, district: '', upazila: '' }));
  }
}, [formData.division]);
```

### 4. Real-time Upazila Availability Check

**Flow**:
```
User selects Upazila
  ↓
Frontend: GET /api/upazila/availability?division=X&district=Y&upazila=Z
  ↓
Backend: Query active complaints for upazila
  ↓
Response: { available: true/false, message: "...", existing_complaint: {...} }
  ↓
Frontend: Show warning or enable submit button
```

### 5. Media Upload (Separate from Complaint Creation)

**Why Separate?**
- File uploads take time (bad UX if combined)
- Can create complaint first, upload later
- Easier error handling

**Flow**:
```
1. Create complaint (returns complaint_id)
2. POST /api/complaints/{id}/media with FormData
3. Backend saves file, updates complaint.media_url
4. Frontend refreshes complaint to show media
```

### 6. JWT Authentication for Admins

**Why JWT?**
- Stateless (no session storage)
- Scalable (no Redis/Memcached needed)
- Mobile-friendly (easy to pass in headers)

**Flow**:
```
1. Admin login: POST /api/admin/login { username, password }
2. Backend verifies password hash (bcrypt)
3. Backend creates JWT with expiration: { sub: admin_id, exp: ... }
4. Frontend stores token in localStorage
5. Subsequent requests: Authorization: Bearer <token>
6. Backend verifies JWT signature and expiration
```

### 7. Client-Side Filtering

**Why Client-Side?**
- Fast (no network latency)
- Works offline (once data loaded)
- Reduces server load

**Trade-off**:
- Not suitable for large datasets (>10,000 items)
- Initial load includes all data

**Implementation**:
```typescript
// Load all once
useEffect(() => {
  complaintApi.getComplaints().then(setAllComplaints);
}, []);

// Filter in memory
useEffect(() => {
  let filtered = allComplaints;
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(c => c.category === categoryFilter);
  }
  // ... more filters
  setComplaints(filtered);
}, [allComplaints, categoryFilter, statusFilter, ...]);
```

### 8. Responsive Design with Tailwind

**Mobile-First Approach**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {/* 1 column mobile, 3 tablet, 4 desktop */}
</div>
```

**Breakpoints**:
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

---

## Security & Best Practices

### 1. Password Security
```python
# Hashing (bcrypt - adaptive cost)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash(plain_password)

# Verification
is_valid = pwd_context.verify(plain_password, hashed_password)
```

**Why bcrypt?**
- Adaptive: Can increase cost as CPUs get faster
- Salt: Automatic random salt per password
- Slow: ~250ms per hash (prevents brute force)

### 2. SQL Injection Prevention
```python
# ✅ SAFE (SQLAlchemy ORM)
db.query(Complaint).filter(Complaint.upazila == upazila).first()

# ❌ UNSAFE (raw SQL with string interpolation)
db.execute(f"SELECT * FROM complaints WHERE upazila = '{upazila}'")
```

**ORM Benefits**:
- Automatic parameterization
- Type safety
- No manual escaping

### 3. CORS Configuration
```python
# Development: Allow localhost
origins = ["http://localhost:5173"]

# Production: Only allow frontend domain
origins = ["https://complaint2292-web.azurewebsites.net"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Common Mistake**: `allow_origins=["*"]` is insecure (allows any domain).

### 4. Environment Variables (Never Hardcode Secrets)
```python
# ✅ GOOD
SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

# ❌ BAD
SECRET_KEY = "hardcoded-secret-123"
```

### 5. Input Validation (Pydantic)
```python
class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=200)
    phone_number: str = Field(..., pattern=r'^01[3-9]\d{8}$')  # Bangladesh format
```

**Pydantic validates**:
- Type (str, int, bool)
- Length (min/max)
- Pattern (regex)
- Required vs optional

### 6. File Upload Security
```python
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

async def save_upload_file(file: UploadFile):
    # 1. Validate extension
    ext = file.filename.split('.')[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # 2. Generate unique filename (prevent overwrites)
    timestamp = int(time.time() * 1000)
    filename = f"{timestamp}_{file.filename}"
    
    # 3. Save with limited size
    # (FastAPI automatically limits request size)
```

### 7. Database Connection Pooling
```python
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Test connections before use
    pool_size=5,             # Keep 5 connections
    max_overflow=10,         # Allow 10 additional connections
    pool_recycle=3600        # Recycle connections after 1 hour
)
```

**Benefits**:
- Reuse connections (faster than creating new)
- Limit connections (prevent database overload)
- Auto-recovery (pool_pre_ping handles stale connections)

### 8. API Rate Limiting (Future Enhancement)
```python
# Using slowapi
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/complaints")
@limiter.limit("5/minute")  # Max 5 complaints per minute per IP
def create_complaint():
    ...
```

---

## Troubleshooting & Lessons Learned

### Issue 1: CORS Errors in Production

**Symptom**:
```
Access to XMLHttpRequest blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

**Root Cause**: Backend `CORS_ORIGINS` not set to frontend URL.

**Solution**:
```powershell
az webapp config appsettings set \
  --name complaint2292-api \
  --settings CORS_ORIGINS="https://complaint2292-web.azurewebsites.net"
```

**Lesson**: Always set environment variables BEFORE deployment.

---

### Issue 2: 404 on Location API After URL Encoding

**Symptom**: Districts endpoint returns 404 after selecting division.

**Root Cause**: Manual string interpolation doesn't URL-encode:
```typescript
// ❌ BAD
api.get(`/api/locations/districts?division=${division}`)
// If division = "Barisal" → OK
// If division = "Cox's Bazar" → breaks (space + apostrophe)
```

**Solution**: Use axios params object:
```typescript
// ✅ GOOD
api.get('/api/locations/districts', { params: { division } })
// Axios automatically encodes: "Cox's Bazar" → "Cox%27s%20Bazar"
```

**Lesson**: Always use library URL encoding, never manual.

---

### Issue 3: Database Column Not Found

**Symptom**:
```
column complaints.division does not exist
```

**Root Cause**: Database schema outdated (old tables from previous version).

**Solution**: Recreate database (dev/test environment):
```powershell
az postgres flexible-server db delete --database-name complaint_db ...
az postgres flexible-server db create --database-name complaint_db ...
az webapp restart --name complaint2292-api ...
```

**Lesson**: Use proper migrations in production (Alembic).

---

### Issue 4: Container Startup Failure

**Symptom**: App Service shows "Application Error".

**Root Cause**: Environment variable `DATABASE_URL` not set.

**Debug Steps**:
```powershell
# 1. Check logs
az webapp log tail --name complaint2292-api

# 2. Check environment variables
az webapp config appsettings list --name complaint2292-api

# 3. SSH into container
az webapp ssh --name complaint2292-api
env | grep DATABASE
```

**Lesson**: Always verify environment variables after deployment.

---

### Issue 5: Slow Image Load Times

**Symptom**: Media takes 5+ seconds to load.

**Root Cause**: Files stored in container (ephemeral), not persistent storage.

**Better Solution**: Use Azure Blob Storage:
```python
from azure.storage.blob import BlobServiceClient

blob_service = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION)
container = blob_service.get_container_client("media")

# Upload
blob_client = container.upload_blob(name=filename, data=file_data)

# Get URL
media_url = blob_client.url
```

**Lesson**: Use object storage (S3, Azure Blob) for user-uploaded files.

---

## Performance Optimization Tips

### 1. Database Indexing
```sql
-- Speed up common queries
CREATE INDEX idx_upazila_status ON complaints(upazila, status);
CREATE INDEX idx_created_at ON complaints(created_at DESC);
CREATE INDEX idx_division ON complaints(division);
```

### 2. Frontend Code Splitting
```typescript
// Lazy load admin panel
const AdminPanel = React.lazy(() => import('./AdminPanel'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminPanel />
    </Suspense>
  );
}
```

### 3. Image Optimization
```python
from PIL import Image

def optimize_image(file_path):
    img = Image.open(file_path)
    # Resize large images
    if img.width > 1920:
        ratio = 1920 / img.width
        img = img.resize((1920, int(img.height * ratio)))
    # Compress
    img.save(file_path, optimize=True, quality=85)
```

### 4. API Response Caching
```python
from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache

@router.get("/locations/divisions")
@cache(expire=3600)  # Cache for 1 hour
def list_divisions():
    return {"divisions": get_divisions()}
```

### 5. Database Connection Management
```python
# Use context manager
with SessionLocal() as db:
    complaints = db.query(Complaint).all()
# Connection automatically closed
```

---

## Interview Talking Points

### System Design Decisions
1. **Monolithic vs Microservices**: Chose monolithic (simpler for small project)
2. **SQL vs NoSQL**: PostgreSQL for ACID guarantees, complex queries
3. **JWT vs Session**: JWT for stateless, scalable authentication
4. **Client vs Server Filtering**: Client-side (fast, but limited to small datasets)
5. **Hard-coded vs DB Locations**: Hard-coded (static data, faster lookups)

### Scalability Considerations
1. **Database**: Add read replicas for heavy read traffic
2. **Caching**: Redis for frequently accessed data (divisions, districts)
3. **CDN**: CloudFront/Azure CDN for static assets
4. **Load Balancer**: Azure Load Balancer for multiple backend instances
5. **Async Processing**: Celery for background tasks (email notifications)

### Trade-offs Made
1. **Auto Schema Creation** → Simple but not production-ready
2. **File Storage in Container** → Easy but not scalable
3. **Client-Side Filtering** → Fast but limited to small datasets
4. **One Complaint Per Upazila** → Prevents spam but may frustrate users

### What I Would Do Differently
1. **Alembic Migrations**: Version control for schema changes
2. **Azure Blob Storage**: Persistent media storage
3. **Rate Limiting**: Prevent abuse (slowapi, Redis)
4. **Email Notifications**: Notify users when status changes
5. **Admin Dashboard**: Better UI for managing complaints
6. **Testing**: Unit tests (pytest), integration tests
7. **Monitoring**: Application Insights, error tracking (Sentry)

---

## Resources & References

### Official Documentation
- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **Azure App Service**: https://learn.microsoft.com/en-us/azure/app-service/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Docker**: https://docs.docker.com/

### Key Libraries
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **Pydantic**: https://docs.pydantic.dev/
- **Axios**: https://axios-http.com/
- **Tailwind CSS**: https://tailwindcss.com/

### Tools Used
- **Git**: Version control
- **GitHub Actions**: CI/CD
- **Azure CLI**: Cloud resource management
- **Docker**: Containerization
- **Vite**: Frontend build tool

---

## Conclusion

This Bangladesh Civic Complaint Management System demonstrates:
- ✅ Full-stack development (React + FastAPI + PostgreSQL)
- ✅ Cloud deployment (Azure App Service + Docker)
- ✅ CI/CD automation (GitHub Actions)
- ✅ RESTful API design
- ✅ Authentication & authorization (JWT)
- ✅ Database design & optimization
- ✅ Responsive UI/UX (Tailwind CSS)
- ✅ Geographic data handling (Bangladesh locations)
- ✅ Business logic implementation (one complaint per upazila)

**Total Cost**: ~$50/month (Azure resources)
**Development Time**: 2-3 weeks
**Lines of Code**: ~5,000 (backend + frontend)

Good luck with your interview! 🚀
