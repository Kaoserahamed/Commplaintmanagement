"""API routes for Complaint Management."""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pathlib import Path
from . import schemas, models
from .database import get_db
from .media import save_upload_file, delete_media_file, get_media_path

router = APIRouter(prefix="/api", tags=["complaints"])


@router.get("/complaints", response_model=List[schemas.ComplaintResponse])
def get_complaints(
    skip: int = 0,
    limit: int = 100,
    category: schemas.ComplaintCategory | None = None,
    status: schemas.ComplaintStatus | None = None,
    priority: schemas.ComplaintPriority | None = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve all complaints with optional filtering and pagination.
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100)
    - **category**: Filter by complaint category (optional)
    - **status**: Filter by complaint status (optional)
    - **priority**: Filter by complaint priority (optional)
    """
    query = db.query(models.Complaint)
    
    if category:
        query = query.filter(models.Complaint.category == models.ComplaintCategory[category.name])
    
    if status:
        query = query.filter(models.Complaint.status == models.ComplaintStatus[status.name])
    
    if priority:
        query = query.filter(models.Complaint.priority == models.ComplaintPriority[priority.name])
    
    complaints = query.order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return complaints


@router.post("/complaints", response_model=schemas.ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(get_db)):
    """
    Create a new complaint.
    
    - **title**: Complaint title (required, 1-200 characters)
    - **description**: Detailed description (required, min 10 characters)
    - **category**: Complaint category (required)
    - **priority**: Priority level (default: medium)
    - **location**: Location of the issue (optional)
    - **latitude**: GPS latitude (optional)
    - **longitude**: GPS longitude (optional)
    """
    db_complaint = models.Complaint(
        title=complaint.title,
        description=complaint.description,
        category=models.ComplaintCategory[complaint.category.name],
        priority=models.ComplaintPriority[complaint.priority.name],
        location=complaint.location,
        latitude=complaint.latitude,
        longitude=complaint.longitude,
        status=models.ComplaintStatus.PENDING
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


@router.get("/complaints/{complaint_id}", response_model=schemas.ComplaintResponse)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific complaint by ID.
    
    - **complaint_id**: Complaint ID
    """
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with id {complaint_id} not found"
        )
    return complaint


@router.put("/complaints/{complaint_id}", response_model=schemas.ComplaintResponse)
def update_complaint(complaint_id: int, complaint_update: schemas.ComplaintUpdate, db: Session = Depends(get_db)):
    """
    Update an existing complaint.
    
    - **complaint_id**: Complaint ID
    - All fields are optional
    """
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with id {complaint_id} not found"
        )
    
    # Update only provided fields
    update_data = complaint_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "category" and value:
            setattr(db_complaint, field, models.ComplaintCategory[value.name])
        elif field == "status" and value:
            setattr(db_complaint, field, models.ComplaintStatus[value.name])
        elif field == "priority" and value:
            setattr(db_complaint, field, models.ComplaintPriority[value.name])
        else:
            setattr(db_complaint, field, value)
    
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


@router.delete("/complaints/{complaint_id}", response_model=schemas.MessageResponse)
def delete_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """
    Delete a complaint and its associated media.
    
    - **complaint_id**: Complaint ID
    """
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with id {complaint_id} not found"
        )
    
    # Delete associated media file
    delete_media_file(db_complaint.media_url)
    
    db.delete(db_complaint)
    db.commit()
    return {"message": f"Complaint {complaint_id} deleted successfully"}


@router.post("/complaints/{complaint_id}/media", response_model=schemas.MediaUploadResponse)
async def upload_complaint_media(
    complaint_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload media (image or video) for a complaint.
    
    - **complaint_id**: Complaint ID
    - **file**: Media file (jpg, png, gif, webp, mp4, mov, avi, webm)
    - Max size: 10MB
    """
    # Check if complaint exists
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with id {complaint_id} not found"
        )
    
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


@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get dashboard statistics including counts by status, category, and priority.
    """
    # Total counts
    total = db.query(func.count(models.Complaint.id)).scalar()
    
    # Status counts
    pending = db.query(func.count(models.Complaint.id)).filter(
        models.Complaint.status == models.ComplaintStatus.PENDING
    ).scalar()
    
    in_review = db.query(func.count(models.Complaint.id)).filter(
        models.Complaint.status == models.ComplaintStatus.IN_REVIEW
    ).scalar()
    
    in_progress = db.query(func.count(models.Complaint.id)).filter(
        models.Complaint.status == models.ComplaintStatus.IN_PROGRESS
    ).scalar()
    
    resolved = db.query(func.count(models.Complaint.id)).filter(
        models.Complaint.status == models.ComplaintStatus.RESOLVED
    ).scalar()
    
    rejected = db.query(func.count(models.Complaint.id)).filter(
        models.Complaint.status == models.ComplaintStatus.REJECTED
    ).scalar()
    
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
    
    # Recent complaints (last 5)
    recent = db.query(models.Complaint).order_by(
        models.Complaint.created_at.desc()
    ).limit(5).all()
    
    return {
        "total_complaints": total,
        "pending": pending,
        "in_review": in_review,
        "in_progress": in_progress,
        "resolved": resolved,
        "rejected": rejected,
        "by_category": by_category,
        "by_priority": by_priority,
        "recent_complaints": recent
    }


@router.get("/media/{filename}")
async def serve_media(filename: str):
    """
    Serve uploaded media files.
    
    - **filename**: Media filename
    """
    file_path = get_media_path(filename)
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media file not found"
        )
    
    return FileResponse(file_path)
