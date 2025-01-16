from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from typing import List
import shutil
import os

router = APIRouter()

# Configure upload directory
UPLOAD_DIR = Path("data/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {ALLOWED_EXTENSIONS}"
        )
    
    try:
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "status": "success",
            "filename": file.filename,
            "path": str(file_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_documents() -> List[dict]:
    """List all uploaded documents"""
    try:
        files = []
        for file_path in UPLOAD_DIR.glob("*"):
            if file_path.suffix.lower() in ALLOWED_EXTENSIONS:
                files.append({
                    "filename": file_path.name,
                    "size": file_path.stat().st_size,
                    "uploaded_at": file_path.stat().st_mtime
                })
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))