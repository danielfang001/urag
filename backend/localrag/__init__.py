from fastapi import FastAPI
from .config import get_settings
from .core import bind_milvus
from .api.routes import documents, search
from fastapi.middleware.cors import CORSMiddleware

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

    # Bind services on startup
    @app.on_event("startup")
    async def startup_event():
        # Bind Milvus using settings
        uri = f"http://{settings.milvus_host}:{settings.milvus_port}"
        bind_milvus(app, uri, settings.milvus_collection)

     # Register API routes
    app.include_router(
        documents.router,
        prefix="/api/documents",
        tags=["documents"]
    )
    app.include_router(
        search.router,
        prefix="/api/search",
        tags=["search"]
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
