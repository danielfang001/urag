from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    openai_api_key: str

    milvus_host: str = "localhost"
    milvus_port: int = 19530
    milvus_collection: str = "urag_documents"

    api_port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = ConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

@lru_cache()
def get_settings():
    return Settings()
