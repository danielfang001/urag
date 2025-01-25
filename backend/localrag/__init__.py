from fastapi import FastAPI
from .config import get_settings
from .core import bind_milvus
from .api.routes import documents, search, chat
from fastapi.middleware.cors import CORSMiddleware
import logging
from .database.mongodb import db 

logger = logging.getLogger(__name__)
def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="URAG",
        description="Universal Retrieval-Augmented Generation System",
        version="0.1.0"
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    async def startup_event():
        # Bind Milvus using settings
        uri = f"http://{settings.milvus_host}:{settings.milvus_port}"
        logger.info(f"Binding Milvus to {uri}")
        bind_milvus(app, uri, settings.milvus_collection)
        await db.connect_to_mongo()  

    @app.on_event("shutdown")
    async def shutdown_event():
        await db.close_mongo_connection()  

    # Register API routes
    app.include_router(
        documents.router,
        prefix="/api/documents",
        tags=["documents"]
    )
    app.include_router(
        search.router,  
        prefix="/api",     
        tags=["search"]
    )

    app.include_router(
        chat.router,
        prefix="/api/chat",
        tags=["chat"]
    )

    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "version": "0.1.0",
            "services": {
                "milvus": hasattr(app.state, "vector_db")
            }
        }

    return app
