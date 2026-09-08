"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum


class ComplaintCategory(str, Enum):
    """Complaint category enum for API."""
    ROAD_TRANSPORT = "road_transport"
    ELECTRICITY = "electricity"
    WATER_DRAINAGE = "water_drainage"
    GARBAGE_ENVIRONMENT = "garbage_environment"
    PUBLIC_SAFETY = "public_safety"
    GOVERNMENT_SERVICES = "government_services"
    OTHER = "other"


class ComplaintStatus(str, Enum):
    """Complaint status enum for API."""
    SUBMITTED = "submitted"
    IN_PROCESS = "in_process"
    CLOSED = "closed"


class ComplaintPriority(str, Enum):
    """Complaint priority enum for API."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ============ Complaint Schemas ============

class ComplaintBase(BaseModel):
    """Base schema for Complaint."""
    title: str = Field(..., min_length=1, max_length=200, description="Complaint title")
    description: str = Field(..., min_length=10, description="Detailed complaint description")
    category: ComplaintCategory = Field(..., description="Complaint category")
    
    # Bangladesh Location Hierarchy (Required: Division → District → Upazila → Address)
    division: str = Field(..., max_length=100, description="Division (e.g., Dhaka)")
    district: str = Field(..., max_length=100, description="District (e.g., Dhaka)")
    upazila: str = Field(..., max_length=100, description="Upazila/Thana (e.g., Savar)")
    local_area: str = Field(..., max_length=200, description="Specific location/address")
    
    # Contact Information
    phone_number: str = Field(..., min_length=11, max_length=20, description="Contact phone number")


class ComplaintCreate(ComplaintBase):
    """Schema for creating a complaint (citizen submission)."""
    pass


class ComplaintUpdate(BaseModel):
    """Schema for citizen updating their own complaint."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[ComplaintCategory] = None
    priority: Optional[ComplaintPriority] = None


class AdminComplaintUpdate(BaseModel):
    """Schema for admin to update complaint."""
    status: Optional[ComplaintStatus] = None
    priority: Optional[ComplaintPriority] = None
    admin_notes: Optional[str] = None


class ComplaintResponse(ComplaintBase):
    """Schema for complaint response."""
    id: int
    status: ComplaintStatus
    priority: ComplaintPriority
    media_url: Optional[str]
    media_type: Optional[str]
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    admin_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UpazilaAvailability(BaseModel):
    """Schema for checking upazila availability."""
    available: bool
    message: str
    existing_complaint: Optional[ComplaintResponse] = None


# ============ Admin Schemas ============

class AdminLogin(BaseModel):
    """Schema for admin login."""
    username: str = Field(..., description="Admin username")
    password: str = Field(..., description="Admin password")


class AdminToken(BaseModel):
    """Schema for admin token response."""
    access_token: str
    token_type: str = "bearer"


class AdminResponse(BaseModel):
    """Schema for admin user response."""
    id: int
    username: str
    email: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# ============ Location Schemas ============

class LocationResponse(BaseModel):
    """Schema for location data."""
    divisions: list[str]


class DistrictResponse(BaseModel):
    """Schema for district list."""
    districts: list[str]


class UpazilaResponse(BaseModel):
    """Schema for upazila list."""
    upazilas: list[str]


# ============ Dashboard Schemas ============

class DashboardStats(BaseModel):
    """Schema for dashboard statistics."""
    total_complaints: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    by_priority: dict[str, int]
    by_division: dict[str, int]


# ============ General Schemas ============

class HealthResponse(BaseModel):
    """Schema for health check response."""
    status: str = Field(..., description="Application status")
    timestamp: datetime = Field(..., description="Current timestamp")
    database: str = Field(..., description="Database connection status")


class MessageResponse(BaseModel):
    """Schema for simple message response."""
    message: str


class MediaUploadResponse(BaseModel):
    """Schema for media upload response."""
    media_url: str
    media_type: str
    message: str
