"""Media file handling for complaint uploads."""
import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
from PIL import Image
import aiofiles

# Configuration
UPLOAD_DIR = Path("uploads")
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_IMAGE_DIMENSION = 2000  # Max width/height for images

# Ensure upload directory exists
UPLOAD_DIR.mkdir(exist_ok=True)


def get_file_extension(filename: str) -> str:
    """Get file extension from filename."""
    return Path(filename).suffix.lower()


def is_allowed_file(filename: str) -> tuple[bool, Optional[str]]:
    """
    Check if file type is allowed.
    Returns: (is_allowed, media_type)
    """
    ext = get_file_extension(filename)
    
    if ext in ALLOWED_IMAGE_EXTENSIONS:
        return True, "image"
    elif ext in ALLOWED_VIDEO_EXTENSIONS:
        return True, "video"
    else:
        return False, None


def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename preserving extension."""
    ext = get_file_extension(original_filename)
    unique_id = uuid.uuid4().hex
    return f"{unique_id}{ext}"


async def optimize_image(file_path: Path, max_dimension: int = MAX_IMAGE_DIMENSION):
    """Optimize image size while maintaining quality."""
    try:
        with Image.open(file_path) as img:
            # Convert RGBA to RGB if needed
            if img.mode == "RGBA":
                img = img.convert("RGB")
            
            # Resize if too large
            width, height = img.size
            if width > max_dimension or height > max_dimension:
                if width > height:
                    new_width = max_dimension
                    new_height = int(height * (max_dimension / width))
                else:
                    new_height = max_dimension
                    new_width = int(width * (max_dimension / height))
                
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save optimized image
            img.save(file_path, optimize=True, quality=85)
    except Exception as e:
        print(f"Error optimizing image: {e}")
        # If optimization fails, keep original file


async def save_upload_file(upload_file: UploadFile) -> tuple[str, str]:
    """
    Save uploaded file to disk.
    Returns: (file_url, media_type)
    """
    # Validate file type
    is_allowed, media_type = is_allowed_file(upload_file.filename or "")
    if not is_allowed:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Supported: {ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS}"
        )
    
    # Read file content
    content = await upload_file.read()
    file_size = len(content)
    
    # Check file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    # Generate unique filename
    filename = generate_unique_filename(upload_file.filename or "file")
    file_path = UPLOAD_DIR / filename
    
    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
    
    # Optimize images
    if media_type == "image":
        await optimize_image(file_path)
    
    # Return relative URL path
    file_url = f"/media/{filename}"
    return file_url, media_type


def delete_media_file(media_url: Optional[str]):
    """Delete media file from disk."""
    if not media_url:
        return
    
    try:
        # Extract filename from URL
        filename = Path(media_url).name
        file_path = UPLOAD_DIR / filename
        
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        print(f"Error deleting media file: {e}")


def get_media_path(filename: str) -> Path:
    """Get full path to media file."""
    return UPLOAD_DIR / filename
