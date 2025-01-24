from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Request
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import shutil
import os
from datetime import datetime
import logging
from typing import List
from dotenv import load_dotenv
from urllib.parse import unquote
from typing import Optional
from localrag.core.document_processor import DocumentProcessor
from localrag.config import get_settings

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Configure upload directory with absolute path
UPLOAD_DIR = Path(__file__).parent.parent.parent.parent / "data" / "documents"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

logger.info(f"Upload directory configured at: {UPLOAD_DIR.absolute()}")

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}

router = APIRouter()


@router.get("")
async def list_documents():
    try:
        documents = []
        for file_path in UPLOAD_DIR.glob("*"):
            if file_path.suffix.lower() in ALLOWED_EXTENSIONS:
                stat = file_path.stat()
                documents.append({
                    "id": str(file_path.stem),
                    "name": file_path.name,
                    "type": file_path.suffix,
                    "size": f"{stat.st_size / 1024:.1f} KB",
                    "uploadDate": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        return documents
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    x_openai_key: Optional[str] = Header(None, alias="X-OpenAI-Key")
):
    try:
        logger.info(f"Received upload request for file: {file.filename}")
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in ALLOWED_EXTENSIONS:
            logger.warning(f"Unsupported file type: {file_ext}")
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed types: {ALLOWED_EXTENSIONS}"
            )
        
        # Get Milvus engine from app state
        engine = request.app.state.vector_db

        processor = DocumentProcessor(x_openai_key)

        # Save file with original name first
        file_path = UPLOAD_DIR / file.filename
        content = await file.read()
        
        logger.info(f"Saving file to {file_path}")
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info("File saved successfully")
        
        try:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
            logger.info("Loading document...")
            chunks = processor.load_document(file_path)
            logger.info(f"Generated {len(chunks)} chunks")
            
            # Prepare metadata for each chunk
            metadata_list = []
            texts = []
            filenames = []
            for chunk in chunks:
                metadata = {
                    "source": file.filename,
                    "type": file_ext,
                    "chunk_index": chunk.get('chunk_index', 0),
                    "page": chunk.get('page', 1),
                    "total_pages": chunk.get('total_pages', 1),
                    "upload_date": datetime.now().isoformat()
                }
                filenames.append(file.filename)
                metadata_list.append(metadata)
                texts.append(chunk['content'])
            
            logger.info("Generating embeddings...")
            embeddings = processor.embeddings.embed_documents(texts)
            logger.info(f"Generated {len(embeddings)} embeddings")
            
            logger.info("Adding to vector store...")
            ids = engine.add(filenames, texts, embeddings, metadata_list)
            logger.info(f"Added to vector store with IDs: {ids}")
            
            if not ids:
                raise HTTPException(status_code=500, detail="Failed to add document to vector store")
            
            return {
                "name": file.filename,
                "type": file_ext,
                "size": len(content),
                "uploadDate": datetime.now().isoformat(),
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Processing error: {str(e)}", exc_info=True)
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail=str(e))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{filename}")
async def delete_document(
    filename: str,
    request: Request
):
    try:
        # Decode URL-encoded filename
        filename = unquote(filename)
        logger.info(f"Received delete request for document: {filename}")
        
        # Get Milvus engine from app state
        engine = request.app.state.vector_db
        
        # Delete from vector store using filename field
        logger.info(f"Deleting from vector store with filename: {filename}")
        try:
            success = engine.delete_by_filename(filename)
            if success:
                logger.info(f"Successfully deleted document chunks from vector store")
            else:
                logger.warning(f"No chunks found in vector store for document {filename}")
        except Exception as e:
            logger.error(f"Error deleting from vector store: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        
        # Find and delete the file - check for any extension
        file_found = False
        for file_path in UPLOAD_DIR.glob("*"):
            # Compare without extension
            if file_path.stem == filename:
                logger.info(f"Found file to delete: {file_path}")
                file_path.unlink()
                file_found = True
                break
            # Also try with full filename in case it includes extension
            elif file_path.name == filename:
                logger.info(f"Found file to delete (exact match): {file_path}")
                file_path.unlink()
                file_found = True
                break
        
        if not file_found:
            logger.warning(f"No file found for document: {filename}")
            # Don't raise an error since we already deleted from Milvus
        
        return {"status": "success", "message": f"Document {filename} deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/documents/{filename}/content")
async def get_document_content(filename: str):
    try:
        # Debug logging
        logger.info(f"Requested filename: {filename}")
        logger.info(f"Upload directory: {get_settings().upload_dir}")
        
        decoded_filename = filename.replace('%20', ' ')
        file_path = os.path.join(get_settings().upload_dir, decoded_filename)
        logger.info(f"Full file path: {file_path}")
        logger.info(f"File exists: {os.path.exists(file_path)}")
        
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            raise HTTPException(status_code=404, detail=f"Document not found: {decoded_filename}")
            
        return FileResponse(file_path)
    except Exception as e:
        logger.error(f"Content fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
