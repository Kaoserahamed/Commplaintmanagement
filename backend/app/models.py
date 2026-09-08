"""SQLAlchemy models for Bangladesh Civic Complaint Management System."""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Float, Boolean
from sqlalchemy.sql import func
import enum
from .database import Base


class ComplaintStatus(enum.Enum):
    """Complaint status enum - Simplified for citizen view."""
    SUBMITTED = "submitted"
    IN_PROCESS = "in_process"
    CLOSED = "closed"


class ComplaintPriority(enum.Enum):
    """Complaint priority enum."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ComplaintCategory(enum.Enum):
    """Complaint category enum."""
    ROAD_TRANSPORT = "road_transport"
    ELECTRICITY = "electricity"
    WATER_DRAINAGE = "water_drainage"
    GARBAGE_ENVIRONMENT = "garbage_environment"
    PUBLIC_SAFETY = "public_safety"
    GOVERNMENT_SERVICES = "government_services"
    OTHER = "other"


class Complaint(Base):
    """Complaint model with Bangladesh location hierarchy."""
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    
    # Content
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    # Classification
    category = Column(Enum(ComplaintCategory), nullable=False, index=True)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False, index=True)
    priority = Column(Enum(ComplaintPriority), default=ComplaintPriority.MEDIUM, nullable=False, index=True)
    
    # Bangladesh Location Hierarchy (Division → District → Upazila/Thana)
    division = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    upazila = Column(String(100), nullable=False, index=True)  # Required - this is our constraint key
    local_area = Column(String(200), nullable=False)  # Specific address/location
    
    # Contact Information
    phone_number = Column(String(20), nullable=False)
    
    # Media
    media_url = Column(String(1000), nullable=True)
    media_type = Column(String(50), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Admin tracking
    admin_notes = Column(Text, nullable=True)

    def __repr__(self):
        return f"<Complaint(id={self.id}, upazila='{self.upazila}', status='{self.status.value}')>"


class Admin(Base):
    """Simple admin model for authentication."""
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Admin(id={self.id}, username='{self.username}')>"
