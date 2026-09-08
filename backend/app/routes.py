"""API routes for Bangladesh Civic Complaint Management."""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from . import schemas, models
from .database import get_db
from .media import save_upload_file, delete_media_file, get_media_path
from .bangladesh_locations import (
    get_divisions, 
    get_districts, 
    get_upazilas, 
    validate_location
)

router = APIRouter(prefix="/api", tags=["complaints"])

# Admin authentication setup
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "8"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_admin_token(credentials: HTTPAuthorizationCredentials, db: Session) -> models.Admin:
    """Verify admin JWT token and return admin user."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: int = payload.get("sub")
        if admin_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    admin = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="Admin not found or inactive")
    
    return admin


# ============ Location Endpoints ============

@router.get("/locations/divisions", response_model=schemas.LocationResponse)
def list_divisions():
    """Get all divisions in Bangladesh."""
    return {"divisions": get_divisions()}


@router.get("/locations/districts", response_model=schemas.DistrictResponse)
def list_districts(division: str):
    """Get all districts in a division."""
    districts = get_districts(division)
    if not districts:
        raise HTTPException(status_code=404, detail=f"Division '{division}' not found")
    return {"districts": districts}


@router.get("/locations/upazilas", response_model=schemas.UpazilaResponse)
def list_upazilas(division: str, district: str):
    """Get all upazilas in a district."""
    upazilas = get_upazilas(division, district)
    if not upazilas:
        raise HTTPException(status_code=404, detail=f"District '{district}' in '{division}' not found")
    return {"upazilas": upazilas}


@router.get("/upazila/availability", response_model=schemas.UpazilaAvailability)
def check_upazila_availability(division: str, district: str, upazila: str, db: Session = Depends(get_db)):
    """
    Check if an upazila is available for new complaint submission.
    Returns available=False if there's an active complaint (submitted or in_process).
    """
    # Validate location hierarchy
    if not validate_location(division, district, upazila):
        raise HTTPException(
            status_code=400,
            detail="Invalid location hierarchy. Please check division, district, and upazila."
        )
    
    # Check for existing active complaints in this upazila
    existing = db.query(models.Complaint).filter(
        and_(
            models.Complaint.upazila == upazila,
            models.Complaint.status.in_([
                models.ComplaintStatus.SUBMITTED,
                models.ComplaintStatus.IN_PROCESS
            ])
        )
    ).first()
    
    if existing:
        return {
            "available": False,
            "message": f"There is already an active complaint for {upazila}, {district}. Please wait until it is resolved.",
            "existing_complaint": existing
        }
    
    return {
        "available": True,
        "message": f"{upazila}, {district} is available for new complaint submission.",
        "existing_complaint": None
    }


# ============ Complaint Endpoints (Public) ============

@router.get("/complaints", response_model=List[schemas.ComplaintResponse])
def get_complaints(
    skip: int = 0,
    limit: int = 100,
    category: Optional[schemas.ComplaintCategory] = None,
    status: Optional[schemas.ComplaintStatus] = None,
    priority: Optional[schemas.ComplaintPriority] = None,
    division: Optional[str] = None,
    district: Optional[str] = None,
    upazila: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve all complaints with optional filtering and pagination.
    
    Filters:
    - category: Filter by complaint category
    - status: Filter by complaint status
    - priority: Filter by complaint priority
    - division: Filter by division
    - district: Filter by district
    - upazila: Filter by upazila/thana
    """
    query = db.query(models.Complaint)
    
    if category:
        query = query.filter(models.Complaint.category == models.ComplaintCategory[category.name])
    
    if status:
        query = query.filter(models.Complaint.status == models.ComplaintStatus[status.name])
    
    if priority:
        query = query.filter(models.Complaint.priority == models.ComplaintPriority[priority.name])
    
    if division:
        query = query.filter(models.Complaint.division == division)
    
    if district:
        query = query.filter(models.Complaint.district == district)
    
    if upazila:
        query = query.filter(models.Complaint.upazila == upazila)
    
    complaints = query.order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return complaints


@router.get("/complaints/{complaint_id}", response_model=schemas.ComplaintResponse)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific complaint by ID."""
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint with id {complaint_id} not found")
    return complaint


@router.post("/complaints", response_model=schemas.ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(get_db)):
    """
    Create a new complaint (anonymous - no user account required).
    
    CONSTRAINT: Only ONE active complaint (submitted or in_process) allowed per upazila at a time.
    Check /api/upazila/availability before submitting.
    
    Required fields:
    - title: Complaint title
    - category: Select from available categories
    - division, district, upazila: Location hierarchy (cascading selection)
    - local_area: Specific address/location (user types)
    - phone_number: Contact phone number
    - description: Detailed description
    - evidence: Upload via separate media endpoint after creation
    """
    # Validate location hierarchy
    if not validate_location(complaint.division, complaint.district, complaint.upazila):
        raise HTTPException(
            status_code=400,
            detail="Invalid location hierarchy. Please verify division, district, and upazila."
        )
    
    # Check upazila availability
    existing = db.query(models.Complaint).filter(
        and_(
            models.Complaint.upazila == complaint.upazila,
            models.Complaint.status.in_([
                models.ComplaintStatus.SUBMITTED,
                models.ComplaintStatus.IN_PROCESS
            ])
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Active complaint already exists for {complaint.upazila}, {complaint.district}. Please wait until it is resolved."
        )
    
    # Create complaint (priority set to MEDIUM by default, admin can change later)
    db_complaint = models.Complaint(
        title=complaint.title,
        description=complaint.description,
        category=models.ComplaintCategory[complaint.category.name],
        priority=models.ComplaintPriority.MEDIUM,  # Default priority
        division=complaint.division,
        district=complaint.district,
        upazila=complaint.upazila,
        local_area=complaint.local_area,
        phone_number=complaint.phone_number,
        status=models.ComplaintStatus.SUBMITTED
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


@router.post("/complaints/{complaint_id}/media", response_model=schemas.MediaUploadResponse)
async def upload_complaint_media(
    complaint_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload media (image or video) for a complaint.
    
    - Max size: 10MB
    - Supported formats: jpg, png, gif, webp, mp4, mov, avi, webm
    """
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(status_code=404, detail=f"Complaint with id {complaint_id} not found")
    
    # Delete old media if exists
    if db_complaint.media_url:
        delete_media_file(db_complaint.media_url)
    
    # Save new media
    media_url, media_type = await save_upload_file(file)
    
    # Update complaint with media info
    db_complaint.media_url = media_url
    db_complaint.media_type = media_type
    db.commit()
    db.refresh(db_complaint)
    
    return {
        "media_url": media_url,
        "media_type": media_type,
        "message": "Media uploaded successfully"
    }


@router.get("/media/{filename}")
async def serve_media(filename: str):
    """Serve uploaded media files."""
    file_path = get_media_path(filename)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Media file not found")
    
    return FileResponse(file_path)


# ============ Admin Endpoints ============

@router.post("/admin/login", response_model=schemas.AdminToken)
def admin_login(credentials: schemas.AdminLogin, db: Session = Depends(get_db)):
    """Admin login endpoint."""
    admin = db.query(models.Admin).filter(models.Admin.username == credentials.username).first()
    
    if not admin or not verify_password(credentials.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin account is inactive")
    
    # Update last login
    admin.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": admin.id})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/admin/me", response_model=schemas.AdminResponse)
def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current admin user info."""
    admin = verify_admin_token(credentials, db)
    return admin


@router.put("/admin/complaints/{complaint_id}", response_model=schemas.ComplaintResponse)
def admin_update_complaint(
    complaint_id: int,
    complaint_update: schemas.AdminComplaintUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Admin endpoint to update complaint status and add notes.
    
    Status transitions:
    - submitted → in_process → closed
    """
    # Verify admin
    admin = verify_admin_token(credentials, db)
    
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(status_code=404, detail=f"Complaint with id {complaint_id} not found")
    
    # Update fields
    update_data = complaint_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "status" and value:
            setattr(db_complaint, field, models.ComplaintStatus[value.name])
            # Set closed_at when status changes to closed
            if value == schemas.ComplaintStatus.CLOSED:
                db_complaint.closed_at = datetime.utcnow()
        elif field == "priority" and value:
            setattr(db_complaint, field, models.ComplaintPriority[value.name])
        else:
            setattr(db_complaint, field, value)
    
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


@router.delete("/admin/complaints/{complaint_id}", response_model=schemas.MessageResponse)
def admin_delete_complaint(
    complaint_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Admin endpoint to delete a complaint and its media."""
    # Verify admin
    admin = verify_admin_token(credentials, db)
    
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(status_code=404, detail=f"Complaint with id {complaint_id} not found")
    
    # Delete associated media file
    if db_complaint.media_url:
        delete_media_file(db_complaint.media_url)
    
    db.delete(db_complaint)
    db.commit()
    return {"message": f"Complaint {complaint_id} deleted successfully"}


# ============ Dashboard Statistics ============

@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics for public view."""
    # Total count
    total = db.query(func.count(models.Complaint.id)).scalar()
    
    # Status counts
    by_status = {}
    for status_enum in models.ComplaintStatus:
        count = db.query(func.count(models.Complaint.id)).filter(
            models.Complaint.status == status_enum
        ).scalar()
        by_status[status_enum.value] = count
    
    # Category counts
    by_category = {}
    for category in models.ComplaintCategory:
        count = db.query(func.count(models.Complaint.id)).filter(
            models.Complaint.category == category
        ).scalar()
        by_category[category.value] = count
    
    # Priority counts
    by_priority = {}
    for priority in models.ComplaintPriority:
        count = db.query(func.count(models.Complaint.id)).filter(
            models.Complaint.priority == priority
        ).scalar()
        by_priority[priority.value] = count
    
    # Division counts
    by_division = {}
    divisions = db.query(models.Complaint.division, func.count(models.Complaint.id)).group_by(
        models.Complaint.division
    ).all()
    for division, count in divisions:
        by_division[division] = count
    
    return {
        "total_complaints": total,
        "by_status": by_status,
        "by_category": by_category,
        "by_priority": by_priority,
        "by_division": by_division
    }
