from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from localrag.api.routes import documents


app = FastAPI(
    title="URAG",
    description="Universal Retrieval-Augmented Generation System",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/documents", tags=["documents"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# run uvicorn localrag.main:app --reload