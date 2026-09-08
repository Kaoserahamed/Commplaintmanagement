"""FastAPI main application entry point."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from sqlalchemy import text
from dotenv import load_dotenv
from pathlib import Path

from .database import engine, get_db, init_db
from .routes import router
from . import models, schemas

load_dotenv()

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create FastAPI app
app = FastAPI(
    title="Complaint Management System API",
    description="REST API for reporting and managing public complaints with media proof",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for media uploads
try:
    app.mount("/media", StaticFiles(directory="uploads"), name="media")
except RuntimeError:
    pass  # Directory already mounted or doesn't exist

# Include routers
app.include_router(router)


@app.get("/", tags=["root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Complaint Management System API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=schemas.HealthResponse, tags=["health"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    Verifies API and database connectivity.
    """
    db_status = "unknown"
    
    try:
        # Test database connection
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return schemas.HealthResponse(
        status="healthy" if db_status == "connected" else "unhealthy",
        timestamp=datetime.utcnow(),
        database=db_status
    )


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    print("✅ Database initialized")
    print(f"✅ CORS enabled for: {cors_origins}")
    print(f"✅ Media uploads directory: {UPLOAD_DIR.absolute()}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("👋 Shutting down Complaint Management System API")
