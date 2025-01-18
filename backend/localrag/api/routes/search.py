from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator
from ...core.vector_store import get_milvus
from ...core.document_processor import DocumentProcessor
from ...config import get_settings, Settings

router = APIRouter()

class SearchSettings(BaseModel):
    """Search settings that can be configured by users through UI"""
    limit: int = Field(
        default=5,
        ge=1,  
        le=50,  
        description="Number of results to return"
    )
    
    similarity_threshold: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Similarity threshold for results (0-1). Lower values return more results."
    )
    
    metadata_filter: Optional[str] = Field(
        default=None,
        description="Filter results by metadata (e.g., 'source:document1.pdf')"
    )
    
    @field_validator('metadata_filter')
    def validate_metadata_filter(cls, v):
        if v and ':' not in v:
            raise ValueError("Metadata filter must be in format 'field:value'")
        return v

class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, description="The search query text")
    settings: SearchSettings = Field(default_factory=SearchSettings)

@router.post("/semantic")
async def semantic_search(
    request: Request,
    search_request: SearchQuery,
    settings: Settings = Depends(get_settings)
):
    try:
        engine = get_milvus(request.app)
        processor = DocumentProcessor(settings.openai_api_key)
        
        query_embedding = await processor.embeddings.aembed_query(search_request.query)
        
        results = engine.similarity_search(
            query_embedding=query_embedding,
            limit=search_request.settings.limit,
            metadata_filter=search_request.settings.metadata_filter,
            similarity_threshold=search_request.settings.similarity_threshold
        )
        
        return {
            "query": search_request.query,
            "settings": search_request.settings.model_dump(),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))