"""SQLAlchemy models for Complaint Management System."""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Float
from sqlalchemy.sql import func
import enum
from .database import Base


class ComplaintCategory(enum.Enum):
    """Complaint category enum."""
    ROAD_TRANSPORT = "road_transport"
    ELECTRICITY = "electricity"
    WATER_DRAINAGE = "water_drainage"
    GARBAGE_ENVIRONMENT = "garbage_environment"
    PUBLIC_SAFETY = "public_safety"
    GOVERNMENT_SERVICES = "government_services"
    OTHER = "other"


class ComplaintStatus(enum.Enum):
    """Complaint status enum."""
    PENDING = "pending"
    IN_REVIEW = "in_review"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class ComplaintPriority(enum.Enum):
    """Complaint priority enum."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Complaint(Base):
    """Complaint model for database."""
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(
        Enum(ComplaintCategory),
        nullable=False,
        index=True
    )
    status = Column(
        Enum(ComplaintStatus),
        default=ComplaintStatus.PENDING,
        nullable=False,
        index=True
    )
    priority = Column(
        Enum(ComplaintPriority),
        default=ComplaintPriority.MEDIUM,
        nullable=False,
        index=True
    )
    location = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    media_url = Column(String(1000), nullable=True)  # URL or path to uploaded media
    media_type = Column(String(50), nullable=True)  # image or video
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Complaint(id={self.id}, title='{self.title}', category='{self.category.value}', status='{self.status.value}')>"
