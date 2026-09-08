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
    PENDING = "pending"
    IN_REVIEW = "in_review"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class ComplaintPriority(str, Enum):
    """Complaint priority enum for API."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ComplaintBase(BaseModel):
    """Base schema for Complaint."""
    title: str = Field(..., min_length=1, max_length=200, description="Complaint title")
    description: str = Field(..., min_length=10, description="Detailed complaint description")
    category: ComplaintCategory = Field(..., description="Complaint category")
    priority: ComplaintPriority = Field(default=ComplaintPriority.MEDIUM, description="Complaint priority")
    location: Optional[str] = Field(None, max_length=500, description="Location of the issue")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude coordinate")


class ComplaintCreate(ComplaintBase):
    """Schema for creating a complaint."""
    pass


class ComplaintUpdate(BaseModel):
    """Schema for updating a complaint (all fields optional)."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Complaint title")
    description: Optional[str] = Field(None, min_length=10, description="Detailed complaint description")
    category: Optional[ComplaintCategory] = Field(None, description="Complaint category")
    status: Optional[ComplaintStatus] = Field(None, description="Complaint status")
    priority: Optional[ComplaintPriority] = Field(None, description="Complaint priority")
    location: Optional[str] = Field(None, max_length=500, description="Location of the issue")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude coordinate")


class ComplaintResponse(ComplaintBase):
    """Schema for complaint response."""
    id: int
    status: ComplaintStatus
    media_url: Optional[str]
    media_type: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardStats(BaseModel):
    """Schema for dashboard statistics."""
    total_complaints: int
    by_category: dict[str, int]
    by_priority: dict[str, int]


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
