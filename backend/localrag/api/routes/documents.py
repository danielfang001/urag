from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pathlib import Path
from typing import List
import shutil
import os
from dotenv import load_dotenv

from localrag.core.document_processor import DocumentProcessor

load_dotenv()

router = APIRouter()

# Configure upload directory
UPLOAD_DIR = Path("data/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}

def get_document_processor():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")
    return DocumentProcessor(api_key)



@router.post("/upload")
async def upload_document(file: UploadFile = File(...),
                          processor: DocumentProcessor = Depends(get_document_processor)):

    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {ALLOWED_EXTENSIONS}"
        )
    
    try:
        file_path = UPLOAD_DIR / file.filename # / is overloaded to concatenate paths, file_path is where the file is stored
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        chunks, embeddings = await processor.process_and_embed(file_path)

        return {
            "status": "success",
            "filename": file.filename,
            "path": str(file_path),
            "chunks": len(chunks),
            "embeddings_dim": len(embeddings[0]) if embeddings else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_documents() -> List[dict]:
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